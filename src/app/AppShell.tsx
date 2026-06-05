import { useEffect, type ReactNode } from 'react';
import { Loader } from '../common/components';
import { Navigate, Route, RouteGuard, Routes } from '../common/services/router';
import { Login, useAuthStore } from '../features/auth';
import { useMeetingStore } from '../features/meeting/store';
import { MeetingForm } from '../features/meeting/form/MeetingForm';
import { MeetingDashboard } from '../features/meeting/dashboard/MeetingDashboard';
import { MeetingReport } from '../features/meeting/report/MeetingReport';
import { MeetingsHistory } from '../features/meeting/history/MeetingsHistory';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import styles from './App.module.css';

export function AppShell() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const bind = useMeetingStore((state) => state.bind);

  useEffect(() => {
    if (!user) {
      return;
    }
    return bind(user.uid);
  }, [user, bind]);

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <Loader label="Starting Timebox Works…" />
      </div>
    );
  }

  const authed = status === 'authenticated';
  const protect = (element: ReactNode) => (
    <RouteGuard when={authed} redirectTo="/login">
      {element}
    </RouteGuard>
  );

  return (
    <div className={styles.layout}>
      <AppHeader />
      <main className={styles.main}>
        <Routes>
          <Route
            path="/login"
            element={authed ? <Navigate to="/meeting/form" replace /> : <Login />}
          />
          <Route path="/meeting/form" element={protect(<MeetingForm />)} />
          <Route path="/meeting/dashboard" element={protect(<MeetingDashboard />)} />
          <Route path="/meeting/report" element={protect(<MeetingReport />)} />
          <Route path="/meetings" element={protect(<MeetingsHistory />)} />
          <Route path="*" element={<Navigate to="/meeting/form" replace />} />
        </Routes>
      </main>
      <AppFooter />
    </div>
  );
}
