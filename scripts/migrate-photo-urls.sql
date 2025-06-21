-- Script para migrar URLs de fotos para caminhos relativos
UPDATE rarcursos.users 
SET url_foto = REPLACE(url_foto, 'https://studio.rardevops.com/storage/v1/object/public/ead/', '')
WHERE url_foto LIKE '%storage/v1/object/public/ead/%';

-- Verificar o resultado
SELECT uid, nome, url_foto 
FROM rarcursos.users 
WHERE url_foto IS NOT NULL;
