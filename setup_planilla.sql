CREATE TABLE IF NOT EXISTS planilla_partido (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id uuid REFERENCES partidos(id) ON DELETE CASCADE UNIQUE NOT NULL,
  hora_partido text,
  lugar text,
  alineacion_local text,
  alineacion_visitante text,
  convocados text,
  tarjetas text,
  sustituciones text,
  goles text,
  observaciones text,
  arbitros text,
  clima text,
  mvp text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Políticas de RLS
ALTER TABLE planilla_partido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON planilla_partido
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON planilla_partido
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON planilla_partido
  FOR UPDATE USING (true);
