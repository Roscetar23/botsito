import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ReminderFrequency } from '../reminder-frequency.enum.js';
import { ReminderType } from '../reminder-type.enum.js';

export class UpdateReminderDto {
  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  text?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time?: string;

  @IsOptional()
  @IsEnum(ReminderFrequency)
  frequency?: ReminderFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  count?: number;

  @IsOptional()
  @IsMongoId()
  taskId?: string;
}
