import { Injectable } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import {Repository} from 'typeorm';

@Injectable()
export class TransactionService {
    //injects the transaction repository so that we can talk to the database
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>
    )
}
