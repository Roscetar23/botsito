import { ViewBoundary } from '../../_components/view-boundary';
import { TasksLazy } from '../../_components/tasks/tasks-lazy';

/** Vista Tareas: módulo propio, diferido y aislado en su error boundary. */
export default function TareasPage() {
  return (
    <ViewBoundary name="Las tareas">
      <TasksLazy />
    </ViewBoundary>
  );
}
