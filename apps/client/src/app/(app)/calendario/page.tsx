import { ViewBoundary } from '../../_components/view-boundary';
import { CalendarLazy } from '../../_components/calendar/calendar-lazy';

/** Vista Calendario: módulo propio, diferido y aislado en su error boundary. */
export default function CalendarPage() {
  return (
    <ViewBoundary name="El calendario">
      <CalendarLazy />
    </ViewBoundary>
  );
}
