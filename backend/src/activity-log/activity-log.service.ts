import { Injectable } from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: ActivityAction;
    organizationId: string;
    performedById: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        organizationId: params.organizationId,
        performedById: params.performedById,
      },
    });
  }

  async findAllForOrganization(organizationId: string) {
    return this.prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      include: {
        performedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
