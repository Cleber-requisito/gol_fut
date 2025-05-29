-- Criar tabelas no Supabase

-- Tabela de jogadores (conectada à autenticação do Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  posicao TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 10),
  perfil TEXT NOT NULL DEFAULT 'jogador',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de confirmação de presença
CREATE TABLE presencas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_jogo DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmado', 'fila', 'desistente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, data_jogo)
);

-- Tabela de jogos
CREATE TABLE jogos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL,
  times JSONB DEFAULT '{}'::JSONB,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'finalizado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de estatísticas
CREATE TABLE estatisticas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jogo_id UUID NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('gol', 'assistencia', 'vitoria', 'participacao')),
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de regras de pontuação
CREATE TABLE regras_pontuacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL UNIQUE CHECK (tipo IN ('gol', 'assistencia', 'vitoria', 'participacao')),
  valor INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir valores padrão nas regras de pontuação
INSERT INTO regras_pontuacao (tipo, valor) VALUES
  ('gol', 3),
  ('assistencia', 1),
  ('vitoria', 2),
  ('participacao', 1);

-- Inserir usuários padrão
INSERT INTO users (nome, email, posicao, nota, perfil, ativo)
VALUES
  ('Administrador', 'admin@gol_fut.com', 'Meio-campo', 7, 'admin', true),
  ('Jogador Padrão', 'user@fut_gol.com', 'Atacante', 6, 'jogador', true);

-- Criar políticas de segurança (RLS - Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estatisticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE regras_pontuacao ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
CREATE POLICY "Usuários podem ver todos os jogadores" ON users
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem criar jogadores" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar outros jogadores" ON users
  FOR UPDATE USING (
    email = auth.current_user() OR
    EXISTS (
      SELECT 1 FROM users WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem excluir jogadores" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

-- Políticas para tabela presencas
CREATE POLICY "Qualquer usuário pode ver todas as presenças" ON presencas
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem confirmar sua própria presença" ON presencas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = presencas.user_id AND email = auth.current_user()
    )
  );

CREATE POLICY "Usuários podem atualizar sua própria presença ou admins podem atualizar qualquer presença" ON presencas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = presencas.user_id AND email = auth.current_user()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

-- Políticas para tabela jogos
CREATE POLICY "Qualquer usuário pode ver todos os jogos" ON jogos
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem criar jogos" ON jogos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar jogos" ON jogos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

-- Políticas para tabela estatisticas
CREATE POLICY "Qualquer usuário pode ver todas as estatísticas" ON estatisticas
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem adicionar estatísticas" ON estatisticas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar estatísticas" ON estatisticas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );

-- Políticas para tabela regras_pontuacao
CREATE POLICY "Qualquer usuário pode ver as regras de pontuação" ON regras_pontuacao
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem atualizar regras de pontuação" ON regras_pontuacao
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.current_user() AND perfil = 'admin'
    )
  );