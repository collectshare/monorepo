import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const ForgotPassword = lazy(() => import('@/views/pages/ForgotPassword'));
const ForgotPasswordConfirm = lazy(() => import('@/views/pages/ForgotPasswordConfirm'));
const SignIn = lazy(() => import('@/views/pages/SignIn'));
const SignUp = lazy(() => import('@/views/pages/SignUp'));
const LoadScreen = lazy(() => import('@/components/LoadScreen'));
const AuthGuard = lazy(() => import('@/app/router/AuthGuard'));
const AuthLayout = lazy(() => import('@/views/layouts/AuthLayout'));
const MainLayout = lazy(() => import('@/views/layouts/MainLayout'));
const NotFound = lazy(() => import('@/views/pages/NotFound'));
const Home = lazy(() => import('@/views/pages/Home'));
const MyForms = lazy(() => import('@/views/pages/MyForms'));
const FormBuilder = lazy(() => import('@/views/pages/FormBuilder'));
const FormRenderer = lazy(() => import('@/views/pages/FormRenderer'));
const FormDashboard = lazy(() => import('@/views/pages/FormDashboard'));

export default function Router() {
  return (
    <Suspense fallback={<LoadScreen />}>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/forms/response/:id" element={<FormRenderer />} />

        <Route element={<AuthGuard isPrivate={false} />}>
          <Route element={<AuthLayout />}>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password/confirm" element={<ForgotPasswordConfirm />} />
          </Route>
        </Route>
        <Route element={<AuthGuard isPrivate />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/my-forms" element={<MyForms />} />
            <Route path="/forms/builder" element={<FormBuilder />} />
            <Route path="/forms/builder/:id" element={<FormBuilder />} />
            <Route path="/forms/dashboard/:formId" element={<FormDashboard />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
