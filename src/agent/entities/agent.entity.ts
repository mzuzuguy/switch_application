import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Agent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    agentCode: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({unique: true})
    phoneNumber: string;

    @Column('decimal', {precision: 10, scale: 2, default: 0})
    floatBalance: number;//the agents own working capital

    @Column({default: true})
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}