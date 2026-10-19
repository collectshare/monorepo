// Tools mirror apps/api/src/application/mcp/ToolRegistry; keep both in sync when a tool is added or changed.

const API_URL = import.meta.env.VITE_API_URL ?? 'https://<api>';

export const MCP_URL = `${API_URL}/mcp`;

export type Client = {
  id: 'claude-ai' | 'claude-code' | 'cursor';
  label: string;
  steps: string[];
  code?: string;
};

export type Tool = {
  name: string;
  description: string;
  kind: 'read' | 'write' | 'destructive';
};

export const CLIENTS: Client[] = [
  {
    id: 'claude-ai',
    label: 'claude.ai / Desktop',
    steps: [
      'No claude.ai ou no app Claude Desktop, abra Configurações → Conectores.',
      'Clique em "Adicionar conector personalizado" (pode não estar disponível em todos os planos).',
      'Dê o nome "Collectshare", cole a URL do servidor e salve.',
      'Clique em "Conectar": uma janela do Collectshare abre para você entrar e autorizar.',
      'Em uma conversa, ative o conector Collectshare no menu de ferramentas.',
    ],
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    steps: [
      'No terminal, rode o comando abaixo para registrar o servidor.',
      'Abra o Claude Code e digite /mcp. Escolha "collectshare" e "Authenticate".',
      'O navegador abre a tela do Collectshare: entre e autorize. Volte ao terminal.',
    ],
    code: `claude mcp add --transport http collectshare ${MCP_URL}`,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    steps: [
      'Abra Cursor Settings → MCP → "Add new MCP server" (ou edite ~/.cursor/mcp.json).',
      'Adicione o trecho abaixo e salve.',
      'Clique em "Login" ao lado de collectshare: o navegador abre a tela do Collectshare para você autorizar.',
    ],
    code: JSON.stringify({ mcpServers: { collectshare: { url: MCP_URL } } }, null, 2),
  },
];

export const TOOLS: Tool[] = [
  { name: 'list_forms', description: 'Lista seus formulários.', kind: 'read' },
  { name: 'get_form', description: 'Mostra um formulário e suas perguntas.', kind: 'read' },
  { name: 'get_form_submissions', description: 'Lê as respostas recebidas por um formulário seu (até 200 por vez).', kind: 'read' },
  { name: 'search_datasets', description: 'Busca datasets publicados no portal.', kind: 'read' },
  { name: 'get_dataset_data', description: 'Lê as linhas (anonimizadas) de um dataset publicado, página a página.', kind: 'read' },
  { name: 'create_form', description: 'Cria um formulário novo na sua conta.', kind: 'write' },
  { name: 'update_form', description: 'Substitui título, descrição e tags de um formulário. Flags omitidas (publicado, anônimo, página única) mantêm o valor atual.', kind: 'destructive' },
  { name: 'insert_questions', description: 'Substitui todas as perguntas de um formulário. Perguntas que ficarem de fora são apagadas.', kind: 'destructive' },
];

export const EXAMPLE_PROMPTS = [
  'Liste meus formulários e quantas respostas cada um recebeu.',
  'Crie um formulário de satisfação de clientes com 5 perguntas.',
  'Resuma as respostas do formulário "Pesquisa de clima 2026".',
  'Procure datasets públicos sobre mobilidade urbana e mostre as 10 primeiras linhas.',
];
