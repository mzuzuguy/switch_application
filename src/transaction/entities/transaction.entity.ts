import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsPositive,
} from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsString()
  @IsNotEmpty()
  agent_id: string;

  @IsString()
  @IsNotEmpty()
  sender_number: string;

  @IsString()
  @IsNotEmpty()
  receiver_number: string;

  @IsString()
  @IsNotEmpty()
  sender_id: string;

  @IsString()
  @IsNotEmpty()
  receiver_id: string;
}
