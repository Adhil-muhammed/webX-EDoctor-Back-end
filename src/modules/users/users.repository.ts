import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { BaseRepository } from '@database/repositories/base.repository';
import { Patient, Prisma } from '@prisma-client';

@Injectable()
export class UsersRepository extends BaseRepository<
  Patient,
  Prisma.PatientCreateInput,
  Prisma.PatientUpdateInput
> {
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService, 'patient'); // 'user' matches prisma model name
  }
}
