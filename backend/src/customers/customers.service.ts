import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { QueryCustomerDto } from './dtos/query-customer.dto';
import { AssignCustomerDto } from './dtos/assign-customer.dto';
import { BulkAssignCustomerDto } from './dtos/bulk-assign-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(
    dto: CreateCustomerDto,
    organizationId: string,
    performedById: string,
  ) {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        organizationId,
      },
    });

    await this.activityLog.log({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CUSTOMER_CREATED',
      organizationId,
      performedById,
    });

    return customer;
  }

  async findAll(query: QueryCustomerDto, organizationId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CustomerWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    organizationId: string,
    performedById: string,
  ) {
    await this.findOne(id, organizationId);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    await this.activityLog.log({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CUSTOMER_UPDATED',
      organizationId,
      performedById,
    });

    return { message: 'Customer updated successfully', customer };
  }

  async softDelete(id: string, organizationId: string, performedById: string) {
    await this.findOne(id, organizationId);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLog.log({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CUSTOMER_DELETED',
      organizationId,
      performedById,
    });

    return { message: 'Customer deleted successfully', customer };
  }

  async restore(id: string, organizationId: string, performedById: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: { not: null } },
    });

    if (!customer) {
      throw new NotFoundException('Deleted customer not found');
    }

    const restored = await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: null },
    });

    await this.activityLog.log({
      entityType: 'Customer',
      entityId: restored.id,
      action: 'CUSTOMER_RESTORED',
      organizationId,
      performedById,
    });

    return { message: 'Customer restored successfully', customer: restored };
  }

  async assignCustomer(
    customerId: string,
    dto: AssignCustomerDto,
    organizationId: string,
    performedById: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, organizationId, deletedAt: null },
        include: { assignedTo: { select: { id: true, name: true } } },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const assignee = await tx.user.findFirst({
        where: { id: dto.userId, organizationId },
      });
      if (!assignee) {
        throw new NotFoundException('User not found in this organization');
      }

      if (customer.assignedToId === dto.userId) {
        throw new BadRequestException(
          `This customer is already assigned to ${assignee.name}`,
        );
      }

      const previousOwnerName = customer.assignedTo?.name ?? null;

      await tx.$queryRaw`
        SELECT id FROM customers
        WHERE "assignedToId" = ${dto.userId}
          AND "deletedAt" IS NULL
        FOR UPDATE
      `;

      const activeCount = await tx.customer.count({
        where: { assignedToId: dto.userId, deletedAt: null },
      });

      if (activeCount >= 5) {
        throw new BadRequestException(
          'User already has 5 active customers assigned',
        );
      }

      const updated = await tx.customer.update({
        where: { id: customerId },
        data: { assignedToId: dto.userId },
      });

      const message = previousOwnerName
        ? `Customer reassigned from ${previousOwnerName} to ${assignee.name}`
        : `Customer assigned to ${assignee.name}`;

      return { message, customer: updated };
    });

    await this.activityLog.log({
      entityType: 'Customer',
      entityId: customerId,
      action: 'CUSTOMER_ASSIGNED',
      organizationId,
      performedById,
    });

    return result;
  }

  async bulkAssignCustomers(
    dto: BulkAssignCustomerDto,
    organizationId: string,
    performedById: string,
  ) {
    const results: { customerId: string; status: string; message: string }[] =
      [];

    for (const customerId of dto.customerIds) {
      try {
        const result = await this.assignCustomer(
          customerId,
          { userId: dto.userId },
          organizationId,
          performedById,
        );
        results.push({
          customerId,
          status: 'success',
          message: result.message,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to assign';
        results.push({ customerId, status: 'failed', message });
      }
    }

    return { results };
  }
}
