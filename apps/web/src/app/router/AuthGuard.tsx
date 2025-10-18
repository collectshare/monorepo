import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

interface IAuthGuardProps {
  isPrivate: boolean;
}

export default function AuthGuard({ isPrivate }: IAuthGuardProps) {
  const { signedIn } = useAuth();

  if (!signedIn && isPrivate) {
    return <Navigate to="/sign-in" replace />;
  }

  if (signedIn && !isPrivate) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
