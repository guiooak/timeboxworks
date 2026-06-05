import type { ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

export { Routes, Route, Outlet, Link, NavLink, Navigate } from 'react-router-dom';

/** App-wide router provider (served at root on Firebase Hosting). */
export function RouterRoot({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

export type Navigation = {
  go: (to: string) => void;
  replace: (to: string) => void;
  back: () => void;
};

/** Our navigation API — features use this instead of react-router hooks. */
export function useNavigation(): Navigation {
  const navigate = useNavigate();
  return {
    go: (to) => navigate(to),
    replace: (to) => navigate(to, { replace: true }),
    back: () => navigate(-1),
  };
}

export function useRouteParams<T extends Record<string, string | undefined>>(): T {
  return useParams() as T;
}

export function useCurrentPath(): string {
  return useLocation().pathname;
}

/** Generic auth-agnostic guard: redirects to `redirectTo` unless `when` is true. */
export function RouteGuard({
  when,
  redirectTo,
  children,
}: {
  when: boolean;
  redirectTo: string;
  children: ReactNode;
}) {
  if (!when) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
