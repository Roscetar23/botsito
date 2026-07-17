import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ReminderFrequency } from '../reminder-frequency.enum.js';
import { ReminderType } from '../reminder-type.enum.js';

export class CreateReminderDto {
  @IsEnum(ReminderType)
  type!: ReminderType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  text!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time!: string;

  @IsEnum(ReminderFrequency)
  frequency!: ReminderFrequency;

  @IsInt()
  @Min(1)
  @Max(365)
  count!: number;
}
