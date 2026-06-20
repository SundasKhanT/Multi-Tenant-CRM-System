import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { QueryCustomerDto } from './dtos/query-customer.dto';
import { AssignCustomerDto } from './dtos/assign-customer.dto';
import { BulkAssignCustomerDto } from './dtos/bulk-assign-customer.dto';

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.create(dto, user.organizationId, user.id);
  }

  @Get()
  async findAll(
    @Query() query: QueryCustomerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.findAll(query, user.organizationId);
  }

  @Patch('bulk-assign')
  async bulkAssign(
    @Body() dto: BulkAssignCustomerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.bulkAssignCustomers(
      dto,
      user.organizationId,
      user.id,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.update(id, dto, user.organizationId, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.softDelete(id, user.organizationId, user.id);
  }

  @Patch(':id/restore')
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.restore(id, user.organizationId, user.id);
  }

  @Patch(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignCustomerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customersService.assignCustomer(
      id,
      dto,
      user.organizationId,
      user.id,
    );
  }
}
