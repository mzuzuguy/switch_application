import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Account } from '../common/entities/account.entity'; // Assuming Account is in common/entities

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource, // Retained for multi-table local ledger updates
  ) {}

  /**
   * STEP 1: Just log the intent. DO NOT adjust balances yet.
   * This generates the reference string you send to PayChangu.
   */
  async createPendingTransaction(
    senderPhone: string,
    receiverAgentId: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      idempotencyKey,
      amount,
      customerPhone: senderPhone,
      agentId: receiverAgentId,
      status: TransactionStatus.CREATED, // State: Awaiting PayChangu collection
    });

    return await this.transactionRepository.save(transaction);
  }

  /**
   * STEP 2: Triggered ONLY when PayChangu fires a webhook confirming 
   * the customer's cash has landed safely in your ecosystem.
   * This is where your original atomic QueryRunner code actually belongs!
   */
  async executeAgentCredit(idempotencyKey: string, systemFee: number, agentCommission: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch the logged transaction and lock the row for processing
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { idempotencyKey },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) throw new Error('Transaction record not found');
      
      // Prevent processing an already completed or failed transaction (Idempotency check)
      if (transaction.status !== TransactionStatus.CREATED) {
        return; 
      }

      // 2. Fetch the target agent's virtual account/wallet profile
      const agentAccount = await queryRunner.manager.findOne(Account, { 
        where: { id: transaction.agentId },
        lock: { mode: 'pessimistic_write' }
      });
      if (!agentAccount) throw new Error('Target Agent account not found');

      // 3. Mathematical ledger update (Credit the agent)
      // The customer's physical float is already collected via PayChangu, 
      // so we safely update the agent's internal platform balance.
      const netPayoutToAgent = transaction.amount - systemFee + agentCommission;
      agentAccount.balance += netPayoutToAgent;

      // 4. Update the state machine status
      transaction.status = TransactionStatus.PULL_SUCCESS;
      transaction.systemFee = systemFee;
      transaction.agentCommission = agentCommission;

      // 5. Commit everything locally
      await queryRunner.manager.save(agentAccount);
      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      // STEP 3 NEXT: Trigger background worker to fire the PayChangu OUTBOUND Payout API to the agent's actual phone line.
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException((error as any).message);
    } finally {
      await queryRunner.release();
    }
  }
}