import { buttonVariants } from '@monorepo/ui';
import { Link, Outlet } from 'react-router-dom';

import { ThemeSwitcher } from './ThemeSwitcher';

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

export function PortalLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b flex items-center justify-between px-6 py-3">
        <span className="font-semibold text-lg">CollectShare Portal</span>

        <div className="flex items-center gap-2">
          {WEB_APP_URL && (
            <a
              href={WEB_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Entrar
            </a>
          )}
          <Link to="/api-docs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            API Docs
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
