import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      omit: {
        user: {
          password: true,
        },
      },
    } as Prisma.PrismaClientOptions);
  }

  // constructor() {
  //   super({
  //     omit: {
  //       user: {
  //         password: true,
  //       },
  //     },
  //     log: ['query'],
  //   } as Prisma.PrismaClientOptions);
  // }
  async onModuleInit() {
    await this.$connect();
  }
}
