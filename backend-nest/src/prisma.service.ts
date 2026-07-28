import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/prisma';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}