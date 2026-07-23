import type { CreateTaskDto, Task, UpdateTaskDto } from '@asistente/tasks-model';

/** Base de la API (Next inyecta `NEXT_PUBLIC_*`); fallback al backend en :3001. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Forma cruda de una tarea tal como la serializa Mongoose (`_id`, no `id`). */
interface RawTask extends Omit<Task, 'id'> {
  id?: string;
  _id?: string;
}

/** Error del cliente de tareas con el status HTTP y un mensaje legible. */
export class TasksApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TasksApiError';
  }
}

/** Extrae un mensaje legible del cuerpo de error estándar de Nest. */
function messageFrom(body: unknown, fallback: string): string {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return fallback;
}

/** Normaliza un documento serializado por Mongoose a un `Task` con `id` estable. */
function normalize(raw: RawTask): Task {
  const { _id, ...rest } = raw;
  return { ...rest, id: String(raw.id ?? _id) };
}

/** `fetch` JSON con manejo de errores → `TasksApiError` en respuestas !ok. */
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
    throw new TasksApiError('No se pudo conectar con el servidor', 0);
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new TasksApiError(messageFrom(body, 'Error al consultar tareas'), res.status);
  }
  return body as T;
}

/** Trae las tareas del usuario autenticado, con `id` ya normalizado. */
export async function fetchTasks(accessToken: string): Promise<Task[]> {
  const raw = await request<RawTask[]>('/tasks', accessToken, { method: 'GET' });
  return raw.map(normalize);
}

/** Crea una tarea. */
export async function createTask(dto: CreateTaskDto, accessToken: string): Promise<Task> {
  const raw = await request<RawTask>('/tasks', accessToken, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return normalize(raw);
}

/** Actualiza una tarea existente. */
export async function updateTask(
  id: string,
  dto: UpdateTaskDto,
  accessToken: string,
): Promise<Task> {
  const raw = await request<RawTask>(`/tasks/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return normalize(raw);
}

/** Borra una tarea. */
export async function deleteTask(id: string, accessToken: string): Promise<void> {
  await request<null>(`/tasks/${id}`, accessToken, { method: 'DELETE' });
}
