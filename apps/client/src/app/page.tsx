import { AppShell } from './_components/app-shell';
import { AvatarPlayground } from './_components/avatar-playground';
import styles from './page.module.css';

export default function Index() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Asistente</h1>
      <AppShell>
        <AvatarPlayground />
      </AppShell>
    </main>
  );
}
