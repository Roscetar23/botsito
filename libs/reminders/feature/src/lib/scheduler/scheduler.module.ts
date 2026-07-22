import { Module } from '@nestjs/common';
import { SCHEDULER_PORT } from '@asistente/reminders-data-access';

import { AgendaScheduler } from './agenda-scheduler.service.js';

/**
 * Ata el `SchedulerPort` a la implementación Agenda. Al usar `useExisting`,
 * Nest sigue llamando el `onModuleInit`/`onModuleDestroy` de la única
 * instancia de `AgendaScheduler` (necesarios para start/stop de Agenda).
 */
@Module({
  providers: [
    AgendaScheduler,
    { provide: SCHEDULER_PORT, useExisting: AgendaScheduler },
  ],
  exports: [SCHEDULER_PORT],
})
export class SchedulerModule {}
