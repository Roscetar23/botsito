import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ReminderFrequency, ReminderType } from '@asistente/reminders-model';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'reminders' })
export class Reminder {
  @Prop({ type: String, enum: Object.values(ReminderType), required: true })
  type!: ReminderType;

  @Prop({ type: String, required: true })
  text!: string;

  /** YYYY-MM-DD */
  @Prop({ type: String, required: true })
  date!: string;

  /** HH:mm 24h */
  @Prop({ type: String, required: true })
  time!: string;

  @Prop({
    type: String,
    enum: Object.values(ReminderFrequency),
    required: true,
  })
  frequency!: ReminderFrequency;

  @Prop({ type: Number, required: true })
  count!: number;

  @Prop({ type: String, required: true, index: true })
  ownerId!: string;

  @Prop({ type: String, index: true })
  taskId?: string;

  // Añadidos por `{ timestamps: true }` (no requieren @Prop): se declaran
  // aquí solo para que el tipo `ReminderDocument` los conozca.
  createdAt!: Date;
  updatedAt!: Date;
}

export type ReminderDocument = HydratedDocument<Reminder>;

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
