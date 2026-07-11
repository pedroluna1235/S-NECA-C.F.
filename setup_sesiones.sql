-- setup_sesiones.sql

-- 1. Crear tabla 'sesiones'
CREATE TABLE IF NOT EXISTS sesiones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_sesion serial,
  fecha date NOT NULL,
  titulo text NOT NULL,
  pdf_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar Row Level Security (RLS) en la tabla
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;

-- Crear políticas públicas para la tabla (lectura pública, escritura para todos para facilitar demo, o ajustar según auth)
CREATE POLICY "Lectura pública de sesiones" ON sesiones FOR SELECT USING (true);
CREATE POLICY "Inserción pública de sesiones" ON sesiones FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización pública de sesiones" ON sesiones FOR UPDATE USING (true);
CREATE POLICY "Eliminación pública de sesiones" ON sesiones FOR DELETE USING (true);

-- 2. Crear bucket para PDFs de Sesiones
INSERT INTO storage.buckets (id, name, public) 
VALUES ('PDF_SESIONES', 'PDF_SESIONES', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas del Bucket
-- Permitir acceso público de lectura a los archivos
CREATE POLICY "Acceso público de lectura a PDF_SESIONES" ON storage.objects
FOR SELECT USING (bucket_id = 'PDF_SESIONES');

-- Permitir a cualquier usuario subir archivos
CREATE POLICY "Inserción pública a PDF_SESIONES" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'PDF_SESIONES');

-- Permitir a cualquier usuario eliminar archivos
CREATE POLICY "Eliminación pública a PDF_SESIONES" ON storage.objects
FOR DELETE USING (bucket_id = 'PDF_SESIONES');
