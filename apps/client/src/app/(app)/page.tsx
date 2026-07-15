import { ViewBoundary } from '../_components/view-boundary';
import { Visualizer } from '../_components/home/visualizer';

/** Vista Inicio: el visualizador del avatar, aislado en su error boundary. */
export default function Index() {
  return (
    <ViewBoundary name="Visualizador">
      <Visualizer />
    </ViewBoundary>
  );
}
