import type { ReminderType } from '@asistente/reminders-model';
import styles from './calendar.module.css';

/**
 * Combina una clase base con su variante por tipo de recordatorio, p. ej.
 * `typeClass('chip', ReminderType.Cita)` → clases `chip` + `chip-cita`.
 *
 * Los valores del enum `ReminderType` ya son slugs en minúscula
 * (`'tarea' | 'cita' | 'medicina' | 'personal' | 'otro'`), así que este es el
 * único sitio donde se arma el nombre de la clase: evita repetir el switch
 * tipo→color en cada componente (chips del calendario, filas de la agenda,
 * indicador del selector del formulario). Los colores en sí viven en los
 * tokens `--rem-*` de `global.css` y en las reglas `.{base}-{tipo}` de
 * `calendar.module.css`.
 */
export function typeClass(base: string, type: ReminderType): string {
  return `${styles[base]} ${styles[`${base}-${type}`]}`;
}
