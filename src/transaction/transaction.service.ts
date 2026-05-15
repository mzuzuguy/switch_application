import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import {Repository} from 'typeorm';
import { DataSource } from 'typeorm/browser';

@Injectable()
export class TransactionService {

    //injects the transaction repository so that we can talk to the database
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>

        private dataSource: DataSource //query runner needs a data source to create a connection to the database(QuryRunner lives on DataSource)

    ){}
        // the logic lives inside a function
    async createTransaction(senderId: number, receiverId: number, amount: number): Promise<void> {

        const queryRunner = this.transactionRepository.createQueryRunner();//give me a private chanel/connection to the database

        await queryRunner.connect();//open that chanel/connection to the database

        await queryRunner.startTransaction();// start watching everything i do, don't actually save anything yet

        try {
            const sender = await queryRunner.manager.findOne(Account, { where: { id: senderId} });//no one else can see this transaction until it goes through

        const receiver = await queryRunner.manager.findOne(Account, { where: { id: receiverId} });//no one see this transaction until it goes through

        //check if the accounts exist
        if (!sender) {
            throw new Error('sender not found')
        }

        if (!receiver) {
            throw new Error('receiver not found')
        }

         if (sender.balance < amount) {//validate if the sender hahs enough money to send
            throw new Error ('Insufficient funds')
         }

        sender.balance -= amount;//take the money out of the sender's account

        receiver.balance += amount;//put the money in the receiver's account

        await queryRunner.manager.save(sender);
        await queryRunner.manager.save(receiver);

        await queryRunner.commitTransaction();//if everything goes well, save the transaction to the database
           return {message: 'Transaction successful'};
        } catch (error) {
            await queryRunner.rollbackTransaction();//if anything goes wrong, undo everything that was done in this transaction
            
            throw new BadRequestException(error.message);
        } finally {
            await queryRunner.release();//close the chanel/connection to the database
        }
    ){}
}
