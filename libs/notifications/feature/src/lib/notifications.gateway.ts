import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { REMINDER_FIRED_EVENT } from '@asistente/shared-types';
import type { ReminderFiredEvent } from '@asistente/shared-types';
import { Server, Socket } from 'socket.io';

/** Payload mínimo del JWT de acceso emitido por `auth` (`payload.sub` = userId). */
interface JwtAccessPayload {
  sub: string;
  email: string;
}

/**
 * Gateway Socket.IO de notificaciones en tiempo real.
 *
 * - Autentica el handshake con el mismo JWT de acceso que verifica el
 *   `JwtStrategy` de `auth` (`JWT_ACCESS_SECRET`), sin importar ese dominio:
 *   solo se replica la verificación con `@nestjs/jwt` + `ConfigService`.
 * - Cada socket autenticado se une a una sala nombrada con su `userId`
 *   (`payload.sub`), de forma que emitir a un usuario concreto no requiere
 *   conocer sus sockets activos.
 * - Escucha `REMINDER_FIRED_EVENT` (evento de dominio que emite `reminders`
 *   vía `@nestjs/event-emitter`, desacoplado por el contrato de `shared`) y
 *   reenvía el payload a la sala del dueño del recordatorio.
 */
@WebSocketGateway({
  cors: { origin: process.env.WS_CORS_ORIGIN || '*' },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(socket: Socket): void {
    const token = this.extractToken(socket);

    if (!token) {
      this.logger.warn(`Socket ${socket.id} sin token, desconectando`);
      socket.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtAccessPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      socket.data['userId'] = payload.sub;
      socket.join(payload.sub);
    } catch {
      this.logger.warn(`Socket ${socket.id} con token inválido, desconectando`);
      socket.disconnect();
    }
  }

  @OnEvent(REMINDER_FIRED_EVENT)
  handleReminderFired(payload: ReminderFiredEvent): void {
    this.server.to(payload.ownerId).emit('reminder', payload);
  }

  private extractToken(socket: Socket): string | undefined {
    const fromAuth = socket.handshake.auth?.['token'];
    if (typeof fromAuth === 'string') return fromAuth;

    const fromQuery = socket.handshake.query?.['token'];
    if (typeof fromQuery === 'string') return fromQuery;

    return undefined;
  }
}
