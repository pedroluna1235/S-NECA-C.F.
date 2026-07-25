-- Script para crear la tabla de Tareas

CREATE TABLE IF NOT EXISTS public.tareas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descripcion text,
  configuracion_pizarra jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para permitir lectura a todos los usuarios
CREATE POLICY "Permitir lectura a todos en tareas"
  ON public.tareas FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción a todos en tareas"
  ON public.tareas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización a todos en tareas"
  ON public.tareas FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación a todos en tareas"
  ON public.tareas FOR DELETE
  USING (true);
