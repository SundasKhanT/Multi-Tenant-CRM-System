import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dtos/create-note-dto';

@Controller('customers/:customerId/notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notesService.create(
      customerId,
      dto,
      user.organizationId,
      user.id,
    );
  }

  @Get()
  async findAll(
    @Param('customerId') customerId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notesService.findAllForCustomer(
      customerId,
      user.organizationId,
    );
  }
}
