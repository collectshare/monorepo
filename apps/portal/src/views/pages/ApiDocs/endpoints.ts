export interface EndpointParam {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  description: string;
}

export interface EndpointError {
  status: string;
  condition: string;
}

export interface Endpoint {
  id: string;
  method: 'GET';
  path: string;
  scope: 'portal:read' | 'data:read';
  summary: string;
  params: EndpointParam[];
  response: string;
  errors: EndpointError[];
}

export const endpoints: Endpoint[] = [
  {
    id: 'search-datasets',
    method: 'GET',
    path: '/v1/portal/search',
    scope: 'portal:read',
    summary: 'Busca datasets publicados, com o mesmo índice usado pela busca pública do portal.',
    params: [
      { name: 'q', in: 'query', required: false, description: 'Termo de busca. Quando omitido, retorna os resultados padrão sem filtro de texto.' },
      { name: 'sort', in: 'query', required: false, description: 'Critério de ordenação dos resultados (ex.: relevância ou em alta).' },
    ],
    response: 'Objeto com results: uma lista de datasets publicados (título, descrição, tags, conta e contagem de respostas), no mesmo formato retornado pela busca pública.',
    errors: [
      { status: '401 Unauthorized', condition: 'Chave de API ausente ou inválida.' },
      { status: '405 Not Allowed', condition: 'A chave é válida, mas não possui o scope portal:read.' },
    ],
  },
  {
    id: 'dataset-data',
    method: 'GET',
    path: '/v1/portal/datasets/{formId}/data',
    scope: 'portal:read',
    summary: 'Retorna os dados brutos (anonimizados) de um dataset publicado, paginados.',
    params: [
      { name: 'formId', in: 'path', required: true, description: 'ID do formulário publicado.' },
      { name: 'limit', in: 'query', required: false, description: 'Quantidade de linhas por página. Valores acima de 1000 são reduzidos automaticamente para 1000.' },
      { name: 'cursor', in: 'query', required: false, description: 'Cursor de paginação retornado como nextCursor na página anterior.' },
    ],
    response: 'Objeto com rows (linhas de resposta, com valores anonimizados conforme a estratégia de PII de cada pergunta), questions (as perguntas do formulário, sem o campo interno anonymizationSuggestion) e nextCursor (presente quando há mais páginas).',
    errors: [
      { status: '401 Unauthorized', condition: 'Chave de API ausente ou inválida.' },
      { status: '404 Not Found', condition: 'O formId não existe, ou existe mas não está publicado.' },
      { status: '405 Not Allowed', condition: 'A chave é válida, mas não possui o scope portal:read.' },
    ],
  },
  {
    id: 'list-forms',
    method: 'GET',
    path: '/v1/forms',
    scope: 'data:read',
    summary: 'Lista todos os formulários da conta dona da chave de API, publicados ou não.',
    params: [],
    response: 'Lista com o objeto completo de cada formulário da conta, sem filtro por status de publicação. Uma conta sem formulários recebe uma lista vazia.',
    errors: [
      { status: '401 Unauthorized', condition: 'Chave de API ausente ou inválida.' },
      { status: '405 Not Allowed', condition: 'A chave é válida, mas não possui o scope data:read.' },
    ],
  },
  {
    id: 'own-submissions',
    method: 'GET',
    path: '/v1/submissions/{formId}',
    scope: 'data:read',
    summary: 'Retorna os dados brutos (sem anonimização) das respostas de um formulário da própria conta, publicado ou não, paginados.',
    params: [
      { name: 'formId', in: 'path', required: true, description: 'ID de um formulário pertencente à conta dona da chave.' },
      { name: 'limit', in: 'query', required: false, description: 'Quantidade de linhas por página. Valores acima de 1000 são reduzidos automaticamente para 1000.' },
      { name: 'cursor', in: 'query', required: false, description: 'Cursor de paginação retornado como nextCursor na página anterior.' },
    ],
    response: 'Objeto com rows (linhas de resposta com valores não modificados) e nextCursor (presente quando há mais páginas).',
    errors: [
      { status: '401 Unauthorized', condition: 'Chave de API ausente ou inválida.' },
      { status: '404 Not Found', condition: 'O formId não existe.' },
      { status: '405 Not Allowed', condition: 'A chave é válida mas não possui o scope data:read, ou o formId pertence a outra conta.' },
    ],
  },
];
