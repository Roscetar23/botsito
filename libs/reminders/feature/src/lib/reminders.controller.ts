import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReminderDocument } from '@asistente/reminders-data-access';
import { CreateReminderDto } from '@asistente/reminders-model';
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
}
