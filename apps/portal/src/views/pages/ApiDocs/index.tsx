import '@scalar/api-reference-react/style.css';

import { buttonVariants } from '@monorepo/ui';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import { useMemo, useSyncExternalStore } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

// Map Scalar's palette onto the portal tokens; they already switch with the `.dark` class.
const SCALAR_CSS = `
.light-mode, .dark-mode {
  --scalar-background-1: var(--background);
  --scalar-background-2: var(--muted);
  --scalar-background-3: var(--border);
  --scalar-background-accent: color-mix(in oklch, var(--primary) 15%, transparent);
  --scalar-color-1: var(--foreground);
  --scalar-color-2: var(--muted-foreground);
  --scalar-color-3: color-mix(in oklch, var(--muted-foreground) 70%, transparent);
  --scalar-color-accent: var(--primary);
  --scalar-border-color: var(--border);
  --scalar-font: var(--font-sans);
  --scalar-font-code: var(--font-mono);
  --scalar-radius: calc(var(--radius) - 4px);
}
`;

// useTheme keeps state per component, so follow the class it toggles on <html> instead.
function subscribeToThemeClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function useIsDark() {
  return useSyncExternalStore(subscribeToThemeClass, () => document.documentElement.classList.contains('dark'));
}

export function ApiDocs() {
  const isDark = useIsDark();

  // Memoized: the Scalar wrapper re-applies the config whenever the object identity changes.
  const configuration = useMemo(() => ({
    url: '/openapi.yaml',
    // Point the API client at this environment's API instead of the prod server listed in openapi.yaml.
    servers: API_BASE_URL ? [{ url: API_BASE_URL }] : undefined,
    theme: 'none' as const,
    customCss: SCALAR_CSS,
    withDefaultFonts: false,
    forceDarkModeState: isDark ? 'dark' as const : 'light' as const,
    hideDarkModeToggle: true,
    // No Scalar AI: the "Ask AI" agent chat and the "generate MCP server" action.
    agent: { disabled: true },
    mcp: { disabled: true },
  }), [isDark]);

  return (
    <div className="flex flex-col">
      <div className="max-w-5xl w-full mx-auto px-4 pt-10 pb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Documentação da API</h1>
          <p className="text-muted-foreground">
            Especificação OpenAPI da API externa (<code className="font-mono text-sm">/v1/*</code>).{' '}
            <a href="/openapi.yaml" download className="underline">Baixar openapi.yaml</a>
          </p>
        </div>
        {WEB_APP_URL && (
          <a
            href={`${WEB_APP_URL}/api-keys`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Gerenciar chaves de API
          </a>
        )}
      </div>

      <div className="border-t">
        <ApiReferenceReact configuration={configuration} />
      </div>
    </div>
  );
}
