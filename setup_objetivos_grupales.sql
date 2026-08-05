-- Crear tabla para Objetivos Grupales
CREATE TABLE IF NOT EXISTS objetivos_grupales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  estado text DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Completado', 'Archivado')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar Row Level Security (RLS) en la tabla
ALTER TABLE objetivos_grupales ENABLE ROW LEVEL SECURITY;

-- Crear políticas públicas para la tabla de objetivos grupales
CREATE POLICY "Lectura pública de objetivos grupales" ON objetivos_grupales FOR SELECT USING (true);
CREATE POLICY "Inserción pública de objetivos grupales" ON objetivos_grupales FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización pública de objetivos grupales" ON objetivos_grupales FOR UPDATE USING (true);
CREATE POLICY "Eliminación pública de objetivos grupales" ON objetivos_grupales FOR DELETE USING (true);

-- Añadir relación en objetivos_jugadores apuntando a objetivos_grupales
ALTER TABLE objetivos_jugadores
ADD COLUMN IF NOT EXISTS objetivo_grupal_id uuid REFERENCES objetivos_grupales(id) ON DELETE SET NULL;
