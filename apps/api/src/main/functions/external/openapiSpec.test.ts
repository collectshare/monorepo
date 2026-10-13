import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf8');

// ponytail: line regexes instead of a YAML parser; both files are regular. Swap in a parser if their shape changes.
function declaredRoutes(): string[] {
  const yml = read('../../../../sls/functions/external.yml');
  return [...yml.matchAll(/method:\s*(\w+)\s*\n\s*path:\s*(\S+)/g)]
    .map(([, method, path]) => `${method.toUpperCase()} ${path}`);
}

function documentedRoutes(): string[] {
  const spec = read('../../../../../portal/public/openapi.yaml');
  const routes: string[] = [];
  let path: string | undefined;

  for (const line of spec.split('\n')) {
    const pathMatch = line.match(/^ {2}(\/v1\S*):\s*$/);
    if (pathMatch) { path = pathMatch[1]; continue; }

    const methodMatch = line.match(/^ {4}(get|post|put|patch|delete):\s*$/);
    if (methodMatch && path) { routes.push(`${methodMatch[1].toUpperCase()} ${path}`); continue; }

    if (/^\S/.test(line)) { path = undefined; }
  }

  return routes;
}

describe('openapi.yaml (apps/portal/public)', () => {
  it('documents exactly the /v1 routes declared in sls/functions/external.yml', () => {
    const declared = declaredRoutes();
    const documented = documentedRoutes();

    expect(declared.length).toBeGreaterThan(0);
    expect({
      missingFromSpec: declared.filter((route) => !documented.includes(route)),
      staleInSpec: documented.filter((route) => !declared.includes(route)),
    }).toEqual({ missingFromSpec: [], staleInSpec: [] });
  });
});
