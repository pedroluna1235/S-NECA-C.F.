-- SQL script para añadir la columna de diseño a las sesiones

ALTER TABLE sesiones 
ADD COLUMN IF NOT EXISTS datos_diseno JSONB;
