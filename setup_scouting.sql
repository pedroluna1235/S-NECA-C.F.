-- Habilitar extensión uuid si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Jugadores de Scouting
CREATE TABLE scouting_jugadores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_jugador text NOT NULL,
  equipo_origen text,
  ano_nacimiento text,
  dorsal text,
  demarcacion text,
  estado_scouting text CHECK (estado_scouting IN ('Seguir viendo', 'No ver', 'Fichar', 'Pendiente')) DEFAULT 'Pendiente',
  foto_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla de Visualizaciones
CREATE TABLE scouting_visualizaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scouting_jugador_id uuid REFERENCES scouting_jugadores(id) ON DELETE CASCADE,
  fecha_visualizacion date NOT NULL,
  notas_observacion text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE scouting_jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_visualizaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para scouting_jugadores (Públicas para desarrollo)
CREATE POLICY "Permitir lectura pública de scouting_jugadores" ON scouting_jugadores FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de scouting_jugadores" ON scouting_jugadores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de scouting_jugadores" ON scouting_jugadores FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado público de scouting_jugadores" ON scouting_jugadores FOR DELETE USING (true);

-- Políticas para scouting_visualizaciones (Públicas para desarrollo)
CREATE POLICY "Permitir lectura pública de scouting_visualizaciones" ON scouting_visualizaciones FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de scouting_visualizaciones" ON scouting_visualizaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de scouting_visualizaciones" ON scouting_visualizaciones FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado público de scouting_visualizaciones" ON scouting_visualizaciones FOR DELETE USING (true);
