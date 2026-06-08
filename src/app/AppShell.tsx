import { useEffect, type ReactNode } from 'react';
import { Loader } from '../common/components';
import { Navigate, Route, RouteGuard, Routes, paths } from '../common/services/router';
import { Login, useAuthStore } from '../features/auth';
import { useMeetingStore } from '../features/meeting/store';
import { Home } from '../features/meeting/home/Home';
import { MeetingForm } from '../features/meeting/form/MeetingForm';
import { MeetingDashboard } from '../features/meeting/dashboard/MeetingDashboard';
import { MeetingReport } from '../features/meeting/report/MeetingReport';
import { MeetingsHistory } from '../features/meeting/history/MeetingsHistory';
import { AppFooter } from './AppFooter';
import { AppSidebar } from './AppSidebar';
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
    <RouteGuard when={authed} redirectTo={paths.login}>
      {element}
    </RouteGuard>
  );

  return (
    <div className={styles.layout}>
      {authed && <AppSidebar />}
      <div className={styles.content}>
        <main className={styles.main}>
          <Routes>
            <Route
              path={paths.login}
              element={authed ? <Navigate to={paths.home} replace /> : <Login />}
            />
            <Route path={paths.home} element={protect(<Home />)} />
            <Route path={paths.newMeeting} element={protect(<MeetingForm />)} />
            <Route path={paths.liveMeeting} element={protect(<MeetingDashboard />)} />
            <Route path={paths.report} element={protect(<MeetingReport />)} />
            <Route path={paths.meetings} element={protect(<MeetingsHistory />)} />
            <Route path="*" element={<Navigate to={paths.home} replace />} />
          </Routes>
        </main>
        {authed && <AppFooter />}
      </div>
    </div>
  );
}
