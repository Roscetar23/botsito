import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TasksModule } from '@asistente/tasks-feature';
import { AuthModule } from '@asistente/auth-feature';
import { RemindersModule } from '@asistente/reminders-feature';
import { NotificationsModule } from '@asistente/notifications-feature';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    EventEmitterModule.forRoot(),
    TasksModule,
    AuthModule,
    RemindersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
