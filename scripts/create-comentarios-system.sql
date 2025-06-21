-- Tabela para armazenar anotações dos usuários
CREATE TABLE IF NOT EXISTS anotacoes_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  
  -- Conteúdo da anotação
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  
  -- Timestamp do vídeo (em segundos) - para anotações em momentos específicos
  timestamp_video INTEGER DEFAULT NULL,
  
  -- Tipo de anotação
  tipo VARCHAR(20) DEFAULT 'nota' CHECK (tipo IN ('nota', 'duvida', 'importante', 'resumo')),
  
  -- Cor/categoria visual
  cor VARCHAR(20) DEFAULT 'azul' CHECK (cor IN ('azul', 'verde', 'amarelo', 'vermelho', 'roxo')),
  
  -- Metadados
  privada BOOLEAN DEFAULT true, -- Se false, pode ser compartilhada com outros alunos
  favorita BOOLEAN DEFAULT false,
  
  -- Timestamps
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT unique_user_course_lesson UNIQUE(usuario_id, curso_id, aula_id, timestamp_video)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_anotacoes_usuario_id ON anotacoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_curso_id ON anotacoes_usuario(curso_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_aula_id ON anotacoes_usuario(aula_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_timestamp ON anotacoes_usuario(timestamp_video);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo ON anotacoes_usuario(tipo);

-- Tabela para tags personalizadas (opcional - para versão futura)
CREATE TABLE IF NOT EXISTS tags_anotacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(50) NOT NULL,
  cor VARCHAR(20) DEFAULT 'cinza',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_tag UNIQUE(usuario_id, nome)
);

-- Tabela de relacionamento anotação-tag (opcional - para versão futura)
CREATE TABLE IF NOT EXISTS anotacao_tags (
  anotacao_id UUID REFERENCES anotacoes_usuario(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags_anotacao(id) ON DELETE CASCADE,
  PRIMARY KEY (anotacao_id, tag_id)
);

-- RLS (Row Level Security)
ALTER TABLE anotacoes_usuario ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias anotações
CREATE POLICY "Usuários podem ver suas próprias anotações" ON anotacoes_usuario
  FOR ALL USING (auth.uid() = usuario_id);

-- Política: usuários podem inserir suas próprias anotações
CREATE POLICY "Usuários podem criar suas próprias anotações" ON anotacoes_usuario
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: usuários podem atualizar suas próprias anotações
CREATE POLICY "Usuários podem atualizar suas próprias anotações" ON anotacoes_usuario
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: usuários podem deletar suas próprias anotações
CREATE POLICY "Usuários podem deletar suas próprias anotações" ON anotacoes_usuario
  FOR DELETE USING (auth.uid() = usuario_id);
