import {IsNotEmpty, IsNumber, IsString, IsDate} from 'class-validator';

export class CreateTransactionDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNumber()
    amount: number;

    @IsString()
    status: string;

    @IsString()
    @IsNotEmpty()
    agent_id: string;

    @IsNumber()
    @IsNotEmpty()
    sender_number: number;

    @IsNumber()
    @IsNotEmpty()
    receiver_number: number;

    @IsDate()
    @IsNotEmpty()
    time_of_transaction: string;

    @IsString()
    @IsNotEmpty()
    sender_id: string;

}