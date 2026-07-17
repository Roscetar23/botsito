import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReminderDocument } from '@asistente/reminders-data-access';
import {
  CreateReminderDto,
  UpdateReminderDto,
} from '@asistente/reminders-model';
import type { AuthenticatedUser } from '@asistente/shared-types';

import { CurrentUser } from './current-user.decorator.js';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
@UseGuards(AuthGuard('jwt'))
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  create(
    @Body() dto: CreateReminderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReminderDocument> {
    return this.remindersService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReminderDocument[]> {
    return this.remindersService.findAllByOwner(user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReminderDocument> {
    return this.remindersService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.remindersService.remove(id, user.userId);
  }
}
