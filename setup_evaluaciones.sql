-- Crear tabla para Evaluaciones de Jugadores en Partidos
CREATE TABLE IF NOT EXISTS evaluaciones_partido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id uuid REFERENCES partidos(id) ON DELETE CASCADE NOT NULL,
  jugador_id uuid REFERENCES jugadores(id) ON DELETE CASCADE NOT NULL,
  minutos_jugados integer DEFAULT 0,
  goles integer DEFAULT 0,
  nota numeric(4,2) CHECK (nota >= 0 AND nota <= 10),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(partido_id, jugador_id)
);

-- Habilitar Row Level Security (RLS) en la tabla
ALTER TABLE evaluaciones_partido ENABLE ROW LEVEL SECURITY;

-- Crear políticas públicas para la tabla (permite al anon key interactuar con ella)
CREATE POLICY "Lectura pública de evaluaciones" ON evaluaciones_partido FOR SELECT USING (true);
CREATE POLICY "Inserción pública de evaluaciones" ON evaluaciones_partido FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización pública de evaluaciones" ON evaluaciones_partido FOR UPDATE USING (true);
CREATE POLICY "Eliminación pública de evaluaciones" ON evaluaciones_partido FOR DELETE USING (true);
