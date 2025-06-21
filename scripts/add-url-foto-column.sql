-- Adicionar coluna url_foto na tabela users se não existir
ALTER TABLE rarcursos.users 
ADD COLUMN IF NOT EXISTS url_foto TEXT NULL;

-- Comentário para documentar a coluna
COMMENT ON COLUMN rarcursos.users.url_foto IS 'URL da foto de perfil do usuário armazenada no Supabase Storage';
