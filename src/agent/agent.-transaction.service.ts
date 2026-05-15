// agent-transaction.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { Account } from './entities/account.entity';
import { AgentDepositDto } from './dto/agent-deposit.dto';
import { AgentWithdrawDto } from './dto/agent-withdraw.dto';

@Injectable()
export class AgentTransactionService {
  constructor(private dataSource: DataSource) {}

  // Agent deposits cash INTO a user's account
  // Money flow: Agent float TO User balance
  async agentDeposit(dto: AgentDepositDto) {
    const { agentId, userId, amount } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // fetch both agent and user account
      const agent = await queryRunner.manager.findOne(Agent, {
        where: { id: agentId },
      });
      const userAccount = await queryRunner.manager.findOne(Account, {
        where: { id: userId },
      });

      // existence checks
      if (!agent) throw new BadRequestException('Agent not found');
      if (!userAccount) throw new BadRequestException('User account not found');
      if (!agent.isActive) throw new BadRequestException('Agent is not active');

      // agent must have enough float to cover the deposit
      if (agent.floatBalance < amount) {
        throw new BadRequestException('Agent has insufficient float');
      }

      // money moves: out of agent float, into user account
      agent.floatBalance -= amount;
      userAccount.balance += amount;

      await queryRunner.manager.save(agent);
      await queryRunner.manager.save(userAccount);

      await queryRunner.commitTransaction();
      return {
        message: `Deposited ${amount} to user ${userId} via agent ${agentId}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction(); // nothing changes if this fails
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // Agent withdraws cash FROM a user's account
  // Money flow: User balance to Agent float
  async agentWithdraw(dto: AgentWithdrawDto) {
    const { agentId, userId, amount } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const agent = await queryRunner.manager.findOne(Agent, {
        where: { id: agentId },
      });
      const userAccount = await queryRunner.manager.findOne(Account, {
        where: { id: userId },
      });

      if (!agent) throw new BadRequestException('Agent not found');
      if (!userAccount) throw new BadRequestException('User account not found');
      if (!agent.isActive) throw new BadRequestException('Agent is not active');

      // user must have enough balance to withdraw
      if (userAccount.balance < amount) {
        throw new BadRequestException('Insufficient user balance');
      }

      // money moves: out of user account, into agent float
      userAccount.balance -= amount;
      agent.floatBalance += amount;

      await queryRunner.manager.save(userAccount);
      await queryRunner.manager.save(agent);

      await queryRunner.commitTransaction();
      return {
        message: `Withdrew ${amount} from user ${userId} via agent ${agentId}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
