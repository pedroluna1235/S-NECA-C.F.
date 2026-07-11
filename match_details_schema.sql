-- Habilitar extensión uuid si no está
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear bucket de storage para los archivos de los partidos
INSERT INTO storage.buckets (id, name, public) VALUES ('partidos', 'partidos', true) ON CONFLICT (id) DO NOTHING;

-- Crear tabla para Plan de Partido
CREATE TABLE IF NOT EXISTS plan_partido (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id uuid REFERENCES partidos(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ataque_notas text,
  ataque_video_url text,
  ataque_img1_url text,
  ataque_img2_url text,
  ataque_img3_url text,
  ataque_pdf_url text,
  defensa_notas text,
  defensa_video_url text,
  defensa_img1_url text,
  defensa_img2_url text,
  defensa_img3_url text,
  defensa_pdf_url text,
  transiciones_notas text,
  transiciones_video_url text,
  transiciones_img1_url text,
  transiciones_img2_url text,
  transiciones_img3_url text,
  transiciones_pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Crear tabla para ABP (Acciones a Balón Parado)
CREATE TABLE IF NOT EXISTS abp_partido (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id uuid REFERENCES partidos(id) ON DELETE CASCADE NOT NULL,
  tipo text CHECK (tipo IN ('Ofensivo', 'Defensivo')),
  corner1_img_url text,
  corner1_detalle text,
  corner1_video_url text,
  corner2_img_url text,
  corner2_detalle text,
  corner2_video_url text,
  corner3_img_url text,
  corner3_detalle text,
  corner3_video_url text,
  corner4_img_url text,
  corner4_detalle text,
  corner4_video_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(partido_id, tipo)
);

-- Crear tabla para Eventos
CREATE TABLE IF NOT EXISTS eventos_partido (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id uuid REFERENCES partidos(id) ON DELETE CASCADE NOT NULL,
  tipo text CHECK (tipo IN ('Gol', 'Ocasión', 'Duelo', 'Nota')),
  tiempo_segundos integer NOT NULL,
  descripcion text,
  video_url text,
  created_at timestamp with time zone DEFAULT now()
);
