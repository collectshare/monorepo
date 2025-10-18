import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

const Router = lazy(() => import('./app/router')) ;
const ErrorBoundary = lazy(() => import('@/components/ErrorBoundary')) ;
const AuthProvider = lazy(() => import('./app/contexts/AuthContext')) ;
const ModalProvider = lazy(() => import('./app/contexts/ModalContext')) ;
const SheetProvider = lazy(() => import('./app/contexts/SheetContext')) ;
const ThemeProvider = lazy(() => import('./app/contexts/ThemeContext')) ;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary
      fallback={<h1>Ocorreu um erro na plataforma.</h1>}
    >
      <BrowserRouter>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SheetProvider>
              <ModalProvider>
                <AuthProvider>
                  <Router />
                  <Toaster />
                </AuthProvider>
              </ModalProvider>
            </SheetProvider>
            <ReactQueryDevtools buttonPosition='bottom-left' />
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
