import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateNoteDto } from './dtos/create-note-dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(
    customerId: string,
    dto: CreateNoteDto,
    organizationId: string,
    createdById: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const note = await this.prisma.note.create({
      data: {
        content: dto.content,
        customerId,
        organizationId,
        createdById,
      },
    });

    await this.activityLog.log({
      entityType: 'Note',
      entityId: note.id,
      action: 'NOTE_ADDED',
      organizationId,
      performedById: createdById,
    });

    return { message: 'Note added successfully', note };
  }

  async findAllForCustomer(customerId: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.note.findMany({
      where: { customerId, organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
