import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity('transactions')

export class Transaction {
    //auto-generated ID for each transaction
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    amount: number;

    @Column()
    status: string;

    @Column()
    agent_id: string;

    @Column()
    sender_number: number;

    @Column()
    receiver_number: number;

    @Column()
    time_of_transaction: string;

    @Column()
    sender_id: string;
    
}

