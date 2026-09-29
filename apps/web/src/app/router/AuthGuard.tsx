import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';

import { buildSignInPath,getSafeReturnTo } from '@/app/utils/safeReturnTo';

import { useAuth } from '../hooks/useAuth';

interface IAuthGuardProps {
  isPrivate: boolean;
}

export default function AuthGuard({ isPrivate }: IAuthGuardProps) {
  const { signedIn } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!signedIn && isPrivate) {
    return <Navigate to={buildSignInPath(`${location.pathname}${location.search}`)} replace />;
  }

  if (signedIn && !isPrivate) {
    return <Navigate to={getSafeReturnTo(searchParams.get('returnTo')) ?? '/'} replace />;
  }

  return <Outlet />;
}
