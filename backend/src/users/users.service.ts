import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto, organizationId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        organizationId,
      },
    });

    return { message: 'User created successfully', user };
  }

  async findAllInOrganization(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            assignedCustomers: { where: { deletedAt: null } },
          },
        },
      },
    });

    return users.map((user) => {
      const { _count, ...rest } = user;
      return {
        ...rest,
        activeCustomerCount: _count.assignedCustomers,
      };
    });
  }

  async updateUser(id: string, dto: UpdateUserDto, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    return { message: 'User updated successfully', user: updated };
  }
  async findOneWithCustomers(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      include: {
        assignedCustomers: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      activeCustomerCount: user.assignedCustomers.length,
    };
  }
}
