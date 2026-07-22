/**
 * Construye el instante de disparo de una ocurrencia.
 *
 * SUPUESTO (MVP): fecha ("YYYY-MM-DD") + hora ("HH:mm") se interpretan
 * como **hora local del proceso** que ejecuta la API (correcto para un
 * único usuario ejecutando el servidor en su propia máquina). Soporte
 * multi-zona-horaria queda para una iteración futura.
 */
export function occurrenceFireDate(occurrenceDate: string, time: string): Date {
  return new Date(`${occurrenceDate}T${time}:00`);
}
