# Gol_Fut - App de Gestão de Futebol

Um aplicativo completo para gerenciamento de jogos de futebol amador, com recursos para confirmação de presença, sorteio de times equilibrados e estatísticas de jogadores.

## Funcionalidades

- **Autenticação e perfis de usuário**: Admin e jogadores regulares
- **Gestão de jogadores**: Cadastro, edição, exclusão
- **Confirmação de presença**: Sistema automático com fila de espera
- **Sorteio de times**: Algoritmo que considera posição e habilidade
- **Estatísticas e rankings**: Gols, assistências, vitórias e participações
- **Pontuação configurável**: Defina os valores para cada tipo de estatística

## Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Hospedagem**: Netlify/Render

## Configuração

1. Clone o repositório
2. Instale as dependências com `npm install`
3. Configure seu ambiente Supabase:
   - Crie um novo projeto no Supabase
   - Copie a URL e a chave anônima do projeto
   - Crie um arquivo `.env` na raiz do projeto com as variáveis:
     ```
     VITE_SUPABASE_URL=sua_url_do_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
     ```
4. Configure as tabelas no Supabase conforme o esquema abaixo
5. Execute o projeto com `npm run dev`

## Esquema do Banco de Dados

### users (Jogadores)
- id: uuid
- nome: text
- email: text
- posicao: text
- nota: integer
- perfil: text
- ativo: boolean
- foto_url: text

### presencas (Confirmação de presença)
- id: uuid
- user_id: uuid
- data_jogo: date
- status: text

### jogos
- id: uuid
- data: date
- times: json
- status: text

### estatisticas
- id: uuid
- jogo_id: uuid
- user_id: uuid
- tipo: text
- quantidade: integer

### regras_pontuacao
- id: uuid
- tipo: text
- valor: integer

## Usuários Padrão

- **Administrador**: admin@gol_fut.com / 1234
- **Jogador**: user@fut_gol.com / 1234

## Licença

MIT