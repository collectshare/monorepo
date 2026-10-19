// IDs follow the nodes in docs/visao-geral.md; keep both in sync when the flow changes.

export type SampleRow = { nome: string | null; cpf: string | null; cep: string | null };

export type Step = {
  id: 'RESP' | 'API' | 'DB' | 'STREAM' | 'ENGINE';
  title: string;
  what: string;
  where: string;
  row?: SampleRow;
};

export type Door = {
  id: 'OWNER' | 'PORTAL' | 'V1' | 'MCP';
  label: string;
  auth: string;
  row: SampleRow;
  note: string;
  howTo: { text: string; href?: string };
};

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

export const RAW_ROW: SampleRow = { nome: 'Maria Silva', cpf: '123.456.789-00', cep: '89010-000' };

// Illustrative values: name pseudonymized (HMAC, truncated here), CPF suppressed, CEP generalized to UF.
const ANONYMIZED_ROW: SampleRow = { nome: 'a3f9…e1', cpf: null, cep: 'SC' };

export const STEPS: Step[] = [
  {
    id: 'RESP',
    title: 'Envio',
    what: 'O respondente abre o link público do formulário e envia as respostas. Não é preciso criar conta.',
    where: 'No navegador do respondente, a caminho da API.',
    row: RAW_ROW,
  },
  {
    id: 'API',
    title: 'API',
    what: 'Uma função na AWS Lambda recebe o envio em POST /forms/{formId}/submissions, valida o formato das respostas e as grava.',
    where: 'Em trânsito, dentro da API do Collectshare.',
    row: RAW_ROW,
  },
  {
    id: 'DB',
    title: 'Armazenamento',
    what: 'A resposta é guardada como está. Este é o único lugar onde o dado bruto existe: nenhum outro serviço recebe as respostas.',
    where: 'No DynamoDB, o banco de dados do Collectshare.',
    row: RAW_ROW,
  },
  {
    id: 'STREAM',
    title: 'Eventos',
    what: 'Cada gravação dispara eventos. Um conta a nova resposta. Outro mantém a busca do portal atualizada, mas envia ao serviço de busca (Algolia) só o título, a descrição, as tags e os contadores do formulário, nunca as respostas.',
    where: 'O dado continua só no DynamoDB. A busca conhece apenas a "capa" do dataset.',
  },
  {
    id: 'ENGINE',
    title: 'Leitura',
    what: 'O dado sai por quatro portas. O dono vê tudo. Em toda leitura pública, o motor de anonimização aplica a estratégia que o dono escolheu para cada pergunta (pseudonimizar, generalizar ou suprimir). Sem escolha, ele pseudonimiza o que a classificação automática apontou como dado pessoal.',
    where: 'Depende da porta. Escolha uma abaixo.',
  },
];

export const DOORS: Door[] = [
  {
    id: 'OWNER',
    label: 'Dono',
    auth: 'Login no app web (Cognito)',
    row: RAW_ROW,
    note: 'Quem criou o formulário vê as respostas brutas no painel e pode exportá-las em CSV.',
    howTo: { text: 'Entrar no Collectshare', href: WEB_APP_URL },
  },
  {
    id: 'PORTAL',
    label: 'Portal',
    auth: 'Nenhuma: é público',
    row: ANONYMIZED_ROW,
    note: 'Qualquer pessoa busca, navega e baixa o dataset, sempre anonimizado. Neste exemplo, o dono escolheu pseudonimizar o nome, suprimir o CPF e reduzir o CEP ao estado.',
    howTo: { text: 'Buscar datasets', href: '/' },
  },
  {
    id: 'V1',
    label: 'API /v1',
    auth: 'Chave de API (x-api-key) com escopos',
    row: ANONYMIZED_ROW,
    note: 'Para sistemas externos. /v1/portal/... devolve os mesmos dados anonimizados do portal. /v1/submissions/{formId} devolve os dados brutos, mas só dos formulários do próprio dono da chave.',
    howTo: { text: 'Ver a documentação da API', href: '/api-docs' },
  },
  {
    id: 'MCP',
    label: 'MCP (IA)',
    auth: 'OAuth 2.1, com consentimento do dono',
    row: ANONYMIZED_ROW,
    note: 'Assistentes como Claude e Cursor agem em nome de quem autorizou: veem os dados brutos dos formulários dessa pessoa e, nos datasets públicos, o mesmo que o portal mostra.',
    howTo: { text: 'Como conectar no Claude', href: '/mcp' },
  },
];
