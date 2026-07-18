import type { CreateReminderDto, Reminder, UpdateReminderDto } from '@asistente/reminders-model';

/** Base de la API (Next inyecta `NEXT_PUBLIC_*`); fallback al backend en :3001. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Forma cruda de un reminder tal como lo serializa Mongoose (`_id`, no `id`). */
interface RawReminder extends Omit<Reminder, 'id'> {
  id?: string;
  _id?: string;
}

/** Error del cliente de reminders con el status HTTP y un mensaje legible. */
export class RemindersApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'RemindersApiError';
  }
}

/** Extrae un mensaje legible del cuerpo de error estándar de Nest. */
function messageFrom(body: unknown, fallback: string): string {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return fallback;
}

/** Normaliza un documento serializado por Mongoose a un `Reminder` con `id` estable. */
function normalize(raw: RawReminder): Reminder {
  const { _id, ...rest } = raw;
  return { ...rest, id: String(raw.id ?? _id) };
}

/** `fetch` JSON con manejo de errores → `RemindersApiError` en respuestas !ok. */
async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...init?.headers,
      },
    });
  } catch {
    throw new RemindersApiError('No se pudo conectar con el servidor', 0);
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new RemindersApiError(messageFrom(body, 'Error al consultar recordatorios'), res.status);
  }
  return body as T;
}

/** Trae los recordatorios del usuario autenticado, con `id` ya normalizado. */
export async function fetchReminders(accessToken: string): Promise<Reminder[]> {
  const raw = await request<RawReminder[]>('/reminders', accessToken, { method: 'GET' });
  return raw.map(normalize);
}

/** Crea un recordatorio. */
export async function createReminder(
  dto: CreateReminderDto,
  accessToken: string,
): Promise<Reminder> {
  const raw = await request<RawReminder>('/reminders', accessToken, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return normalize(raw);
}

/** Actualiza un recordatorio existente (afecta a todas sus ocurrencias). */
export async function updateReminder(
  id: string,
  dto: UpdateReminderDto,
  accessToken: string,
): Promise<Reminder> {
  const raw = await request<RawReminder>(`/reminders/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return normalize(raw);
}

/** Borra un recordatorio por completo (todas sus ocurrencias). */
export async function deleteReminder(id: string, accessToken: string): Promise<void> {
  await request<null>(`/reminders/${id}`, accessToken, { method: 'DELETE' });
}
