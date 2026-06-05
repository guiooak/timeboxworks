import { useEffect } from 'react';
import { DialogProvider } from '../common/components';
import { RouterRoot } from '../common/services/router';
import { useAuthStore } from '../features/auth';
import { AppShell } from './AppShell';

export function App() {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <DialogProvider>
      <RouterRoot>
        <AppShell />
      </RouterRoot>
    </DialogProvider>
  );
}
