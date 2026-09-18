ALTER TABLE planilla_partido 
ADD COLUMN IF NOT EXISTS sistema_ataque text,
ADD COLUMN IF NOT EXISTS sistema_defensa text,
ADD COLUMN IF NOT EXISTS sistema_ataque_rival text,
ADD COLUMN IF NOT EXISTS sistema_defensa_rival text;
