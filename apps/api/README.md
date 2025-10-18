# Documentação da API Collectshare

Esta é a documentação detalhada para a API do Collectshare.

## Como Rodar o Projeto

1.  **Instale as dependências:**
    ```bash
    pnpm install
    ```

2.  **Execute o projeto localmente:**
    ```bash
    serverless offline
    ```

## Documentação da API

A documentação completa e detalhada de todos os endpoints da API pode ser encontrada em:

[Documentação da API](./docs/API_DOCS.md)

---

## Autenticação

A API utiliza autenticação via `CognitoAuthorizer` para rotas privadas. Para acessar essas rotas, é necessário incluir um token de acesso válido no cabeçalho `Authorization` de cada requisição.

As rotas que necessitam de autenticação estão marcadas com **(Requer Autenticação)**.

---

## Contas

### 1. Obter Dados do Usuário Logado

- **Nome:** `getMe`
- **Método:** `GET`
- **Path:** `/me`
- **Autenticação:** **(Requer Autenticação)**
- **Descrição:** Retorna as informações básicas da conta do usuário autenticado.

- **Resposta de Sucesso (200 OK):**

  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string"
  }
  ```

---

## Autenticação (Auth)

### 1. Registrar Novo Usuário

- **Nome:** `signUp`
- **Método:** `POST`
- **Path:** `/auth/sign-up`
- **Autenticação:** Pública
- **Descrição:** Cria uma nova conta de usuário e um perfil associado.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "account": {
      "email": "string (email válido)",
      "password": "string (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 especial)"
    },
    "profile": {
      "name": "string",
      "birthDate": "string (formato YYYY-MM-DD)"
    }
  }
  ```

- **Resposta de Sucesso (201 Created):**

  ```json
  {
    "accessToken": "string",
    "refreshToken": "string"
  }
  ```

### 2. Autenticar Usuário

- **Nome:** `signIn`
- **Método:** `POST`
- **Path:** `/auth/sign-in`
- **Autenticação:** Pública
- **Descrição:** Autentica um usuário com email e senha.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "email": "string (email válido)",
    "password": "string"
  }
  ```

- **Resposta de Sucesso (200 OK):**

  ```json
  {
    "accessToken": "string",
    "refreshToken": "string"
  }
  ```

### 3. Atualizar Token de Acesso

- **Nome:** `refreshToken`
- **Método:** `POST`
- **Path:** `/auth/refresh-token`
- **Autenticação:** Pública
- **Descrição:** Gera um novo `accessToken` e `refreshToken` a partir de um `refreshToken` válido.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "refreshToken": "string"
  }
  ```

- **Resposta de Sucesso (200 OK):**

  ```json
  {
    "accessToken": "string",
    "refreshToken": "string"
  }
  ```

### 4. Solicitar Redefinição de Senha

- **Nome:** `forgotPassword`
- **Método:** `POST`
- **Path:** `/auth/forgot-password`
- **Autenticação:** Pública
- **Descrição:** Inicia o fluxo de redefinição de senha. Um código de confirmação será enviado para o email do usuário.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "email": "string (email válido)"
  }
  ```

- **Resposta de Sucesso (204 No Content):** N/A

### 5. Confirmar Redefinição de Senha

- **Nome:** `confirmForgotPassword`
- **Método:** `POST`
- **Path:** `/auth/forgot-password/confirm`
- **Autenticação:** Pública
- **Descrição:** Confirma a redefinição de senha utilizando o código de confirmação e uma nova senha.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "email": "string (email válido)",
    "confirmationCode": "string",
    "password": "string (nova senha, seguindo as mesmas regras da criação de conta)"
  }
  ```

- **Resposta de Sucesso (204 No Content):** N/A

---

## Formulários (Forms)

### 1. Criar Novo Formulário

- **Nome:** `createForm`
- **Método:** `POST`
- **Path:** `/forms`
- **Autenticação:** **(Requer Autenticação)**
- **Descrição:** Cria um novo formulário para o usuário autenticado.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "title": "string",
    "description": "string (opcional)"
  }
  ```

- **Resposta de Sucesso (201 Created):**

  ```json
  {
    "formId": "string"
  }
  ```

### 2. Atualizar Detalhes do Formulário

- **Nome:** `updateForm`
- **Método:** `POST`
- **Path:** `/forms/{formId}`
- **Autenticação:** **(Requer Autenticação)**
- **Descrição:** Atualiza o título e a descrição de um formulário existente.

- **Parâmetros de Path:**
  - `formId`: ID do formulário a ser atualizado.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "title": "string",
    "description": "string (opcional)"
  }
  ```

- **Resposta de Sucesso (204 No Content):** N/A

### 3. Listar Formulários do Usuário

- **Nome:** `listForms`
- **Método:** `GET`
- **Path:** `/forms`
- **Autenticação:** **(Requer Autenticação)**
- **Descrição:** Retorna uma lista de todos os formulários criados pelo usuário autenticado.

- **Resposta de Sucesso (200 OK):**

  ```json
  {
    "forms": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "accountId": "string",
        "createdAt": "string (ISO 8601)"
      }
    ]
  }
  ```

### 4. Obter Detalhes de um Formulário

- **Nome:** `getForm`
- **Método:** `GET`
- **Path:** `/forms/{formId}`
- **Autenticação:** Pública
- **Descrição:** Retorna os detalhes de um formulário específico, incluindo suas perguntas.

- **Parâmetros de Path:**
  - `formId`: ID do formulário a ser obtido.

- **Resposta de Sucesso (200 OK):**

  ```json
  {
    "form": {
      "id": "string",
      "title": "string",
      "description": "string",
      "accountId": "string",
      "createdAt": "string (ISO 8601)"
    },
    "questions": [
      {
        "id": "string",
        "formId": "string",
        "text": "string",
        "questionType": "TEXT | TEXTAREA | RADIO | CHECKBOX | SELECT",
        "order": "number",
        "options": ["string"],
        "createdAt": "string (ISO 8601)"
      }
    ]
  }
  ```

### 5. Submeter Respostas a um Formulário

- **Nome:** `submitForm`
- **Método:** `POST`
- **Path:** `/forms/{formId}/submissions`
- **Autenticação:** Pública
- **Descrição:** Envia um conjunto de respostas para um formulário específico.

- **Parâmetros de Path:**
  - `formId`: ID do formulário a ser respondido.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "answers": [
      {
        "questionId": "string",
        "value": "string | string[]"
      }
    ]
  }
  ```

- **Resposta de Sucesso (201 Created):**

  ```json
  {
    "submissionId": "string"
  }
  ```

### 6. Obter Submissões de um Formulário

- **Nome:** `getFormSubmissions`
- **Método:** `GET`
- **Path:** `/forms/{formId}/submissions`
- **Autenticação:** **(Requer Autenticação)**
- **Descrição:** Retorna todas as submissões (respostas) de um formulário específico. Apenas o criador do formulário pode acessar esta rota.

- **Parâmetros de Path:**
  - `formId`: ID do formulário.

- **Resposta de Sucesso (200 OK):**

  ```json
  {
    "submissions": [
      {
        "submission": {
          "id": "string",
          "formId": "string",
          "createdAt": "string (ISO 8601)"
        },
        "answers": [
          {
            "id": "string",
            "submissionId": "string",
            "questionId": "string",
            "value": "string | string[]"
          }
        ]
      }
    ],
    "questions": [
      {
        "id": "string",
        "formId": "string",
        "text": "string",
        "questionType": "TEXT | TEXTAREA | RADIO | CHECKBOX | SELECT",
        "order": "number",
        "options": ["string"],
        "createdAt": "string (ISO 8601)"
      }
    ]
  }
  ```

### 7. Inserir Perguntas em um Formulário

- **Nome:** `insertQuestionsInForm`
- **Método:** `POST`
- **Path:** `/forms/{formId}/questions`
- **Autenticação:** **(Requer Autenticação)**
- **Descrição:** Adiciona ou atualiza as perguntas de um formulário.

- **Parâmetros de Path:**
  - `formId`: ID do formulário.

- **Corpo da Requisição (`application/json`):**

  ```json
  {
    "questions": [
      {
        "text": "string",
        "questionType": "TEXT | TEXTAREA | RADIO | CHECKBOX | SELECT",
        "order": "number",
        "options": ["string"]
      }
    ]
  }
  ```

- **Resposta de Sucesso (204 No Content):** N/A
