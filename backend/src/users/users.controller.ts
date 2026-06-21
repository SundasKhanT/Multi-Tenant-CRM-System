import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { Roles } from '../auth/decorators/role.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.createUser(dto, currentUser.organizationId);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.findAllInOrganization(currentUser.organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.findOneWithCustomers(
      id,
      currentUser.organizationId,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.updateUser(id, dto, currentUser.organizationId);
  }
}
