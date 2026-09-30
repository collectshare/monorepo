/**
 * Exercises POST /mcp on a deployed stack: unauthenticated discovery challenge, the OAuth login
 * (as the MCP client + consent page), the protocol methods and the tools.
 *
 *   API_URL=https://<issuer> EMAIL=you@example.com PASSWORD=... pnpm verify:mcp-server
 *
 * Optional: FOREIGN_FORM_ID=<id of a form owned by ANOTHER account> to check ownership isolation,
 * and API_KEY=cs_sk_... to check that PATs are rejected.
 *
 * It creates one form (unpublished) and one grant on the account, and leaves them behind.
 */
import { createHash, randomBytes } from 'node:crypto';

const apiUrl = (process.env.API_URL ?? '').replace(/\/+$/, '');
const { EMAIL, PASSWORD, FOREIGN_FORM_ID, API_KEY } = process.env;

if (!apiUrl || !EMAIL || !PASSWORD) {
  throw new Error('API_URL, EMAIL and PASSWORD are required');
}

const REDIRECT_URI = 'http://localhost:53682/callback';

let failures = 0;
let nextId = 1;

function check(description: string, condition: boolean, details?: unknown) {
  // eslint-disable-next-line no-console
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${description}`);

  if (!condition) {
    failures += 1;

    if (details !== undefined) {
      // eslint-disable-next-line no-console
      console.log('      ', JSON.stringify(details));
    }
  }
}

async function json(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function obtainMcpAccessToken(): Promise<string> {
  const registered = await json(await fetch(`${apiUrl}/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: [REDIRECT_URI], client_name: 'verifyMcpServer script' }),
  }));

  const signIn = await json(await fetch(`${apiUrl}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }));

  const codeVerifier = randomBytes(48).toString('base64url');
  const approved = await json(await fetch(`${apiUrl}/oauth/authorize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${signIn.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: registered.client_id,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      code_challenge: createHash('sha256').update(codeVerifier).digest('base64url'),
      code_challenge_method: 'S256',
      decision: 'approve',
    }),
  }));

  const tokens = await json(await fetch(`${apiUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: new URL(approved.redirectTo).searchParams.get('code')!,
      client_id: registered.client_id,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }).toString(),
  }));

  return tokens.access_token as string;
}

async function rpc(token: string | null, method: string, params?: unknown) {
  const response = await fetch(`${apiUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, ...(params === undefined ? {} : { params }) }),
  });

  return { status: response.status, headers: response.headers, body: await json(response) };
}

async function callTool(token: string, name: string, args: Record<string, unknown> = {}) {
  const { body } = await rpc(token, 'tools/call', { name, arguments: args });
  const text = body.result?.content?.[0]?.text as string | undefined;

  return {
    isError: !!body.result?.isError,
    text,
    data: text && !body.result?.isError ? JSON.parse(text) : undefined,
    raw: body,
  };
}

async function main() {
  // 1. Unauthenticated: the discovery challenge
  const anonymous = await rpc(null, 'ping');
  const challenge = anonymous.headers.get('www-authenticate') ?? '';
  check('no credentials -> 401', anonymous.status === 401, anonymous.status);
  check('challenge points to the protected resource metadata', challenge.includes(`${apiUrl}/.well-known/oauth-protected-resource/mcp`), challenge);

  const invalid = await rpc('cs_mat_not-a-real-token', 'ping');
  check('invalid token -> 401 with error="invalid_token"', invalid.status === 401 && (invalid.headers.get('www-authenticate') ?? '').includes('invalid_token'), invalid.status);

  const getResponse = await fetch(`${apiUrl}/mcp`);
  check('GET /mcp -> 405 with Allow: POST', getResponse.status === 405 && getResponse.headers.get('allow') === 'POST', getResponse.status);

  if (API_KEY) {
    const viaHeader = await fetch(`${apiUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    });
    const viaBearer = await rpc(API_KEY, 'ping');
    check('PAT in x-api-key is rejected', viaHeader.status === 401, viaHeader.status);
    check('PAT as Bearer is rejected', viaBearer.status === 401, viaBearer.status);
  }

  // 2. Log in through OAuth
  const token = await obtainMcpAccessToken();
  check('obtained an MCP access token through OAuth', !!token && token.startsWith('cs_mat_'));

  // 3. Protocol
  const init = await rpc(token, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'verifyMcpServer', version: '1' },
  });
  check('initialize echoes the protocol version and advertises tools', init.body.result?.protocolVersion === '2025-06-18' && !!init.body.result?.capabilities?.tools, init.body);

  const notified = await fetch(`${apiUrl}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  check('notification -> 202', notified.status === 202, notified.status);

  const ping = await rpc(token, 'ping');
  check('ping -> {}', ping.status === 200 && JSON.stringify(ping.body.result) === '{}', ping.body);

  const unknownMethod = await rpc(token, 'resources/list');
  check('unknown method -> -32601', unknownMethod.body.error?.code === -32601, unknownMethod.body);

  const list = await rpc(token, 'tools/list');
  const names = (list.body.result?.tools ?? []).map((tool: { name: string }) => tool.name).sort();
  check('tools/list returns the eight tools', names.length === 8, names);

  // 4. Tools
  const forms = await callTool(token, 'list_forms');
  check('list_forms works', !forms.isError && Array.isArray(forms.data?.forms), forms.text);

  const invalidCreate = await callTool(token, 'create_form', {});
  check('create_form without title -> isError naming the field', invalidCreate.isError && (invalidCreate.text ?? '').includes('title'), invalidCreate.text);

  const created = await callTool(token, 'create_form', {
    title: `MCP verify ${new Date().toISOString()}`,
    isPublished: false,
  });
  const formId = created.data?.formId as string | undefined;
  check('create_form returns a formId', !created.isError && !!formId, created.text);

  if (formId) {
    const updated = await callTool(token, 'update_form', { formId, title: 'MCP verify (updated)', isPublished: false });
    check('update_form acknowledges', !updated.isError && updated.data?.ok === true, updated.text);

    const inserted = await callTool(token, 'insert_questions', {
      formId,
      questions: [{ text: 'Qual é o seu nome?', questionType: 'TEXT', order: 1 }],
    });
    check('insert_questions acknowledges', !inserted.isError && inserted.data?.ok === true, inserted.text);

    const fetched = await callTool(token, 'get_form', { formId });
    check('get_form returns the form and its questions', !fetched.isError && fetched.data?.form?.id === formId && fetched.data?.questions?.length === 1, fetched.text);

    const submissions = await callTool(token, 'get_form_submissions', { formId });
    check('get_form_submissions reports total/truncated', !submissions.isError && submissions.data?.truncated === false && submissions.data?.total === 0, submissions.text);

    const unpublished = await callTool(token, 'get_dataset_data', { formId });
    check('get_dataset_data on an unpublished form -> isError not found', unpublished.isError && (unpublished.text ?? '').includes('RESOURCE_NOT_FOUND'), unpublished.text);
  }

  const search = await callTool(token, 'search_datasets', { q: 'saúde' });
  check('search_datasets works', !search.isError && Array.isArray(search.data?.results), search.text);

  const unknownTool = await rpc(token, 'tools/call', { name: 'nope', arguments: {} });
  check('unknown tool -> -32602', unknownTool.body.error?.code === -32602, unknownTool.body);

  if (FOREIGN_FORM_ID) {
    const stolen = await callTool(token, 'update_form', { formId: FOREIGN_FORM_ID, title: 'hijack' });
    const peeked = await callTool(token, 'get_form_submissions', { formId: FOREIGN_FORM_ID });
    const overwritten = await callTool(token, 'insert_questions', {
      formId: FOREIGN_FORM_ID,
      questions: [{ text: 'x', questionType: 'TEXT', order: 1 }],
    });
    check('update_form on a foreign form -> isError NOT_ALLOWED', stolen.isError && (stolen.text ?? '').includes('NOT_ALLOWED'), stolen.text);
    check('get_form_submissions on a foreign form -> isError', peeked.isError, peeked.text);
    check('insert_questions on a foreign form -> isError', overwritten.isError, overwritten.text);
  }

  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
