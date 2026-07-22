import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { NotificationsGateway } from './notifications.gateway.js';

/**
 * Módulo de notificaciones en tiempo real. Registra el `NotificationsGateway`
 * (Socket.IO) y el `JwtModule` necesario para autenticar el handshake con el
 * mismo `JWT_ACCESS_SECRET` que usa `auth`, sin depender de ese dominio.
 *
 * `apps/api` solo necesita importar este módulo para que el gateway quede
 * activo; el evento `REMINDER_FIRED_EVENT` que emite `reminders` llega por
 * `@nestjs/event-emitter` sin ningún acoplamiento directo entre dominios.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
