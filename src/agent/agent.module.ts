import { Module } from '@nestjs/common';
import { AgentService } from './agent.-transaction.service';

@Module({
  providers: [AgentService],
})
export class AgentModule {}
