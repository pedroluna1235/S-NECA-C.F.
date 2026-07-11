-- Habilitar RLS explícitamente por seguridad
ALTER TABLE plan_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE abp_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_partido ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso público (o autenticado si tienes login) para plan_partido
CREATE POLICY "Permitir todo en plan_partido" ON plan_partido FOR ALL USING (true) WITH CHECK (true);

-- Crear políticas de acceso público para abp_partido
CREATE POLICY "Permitir todo en abp_partido" ON abp_partido FOR ALL USING (true) WITH CHECK (true);

-- Crear políticas de acceso público para eventos_partido
CREATE POLICY "Permitir todo en eventos_partido" ON eventos_partido FOR ALL USING (true) WITH CHECK (true);
