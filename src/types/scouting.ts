export type EstadoScouting = 'Seguir viendo' | 'No ver' | 'Fichar' | 'Pendiente';

export interface ScoutingJugador {
  id: string;
  nombre_jugador: string;
  equipo_origen: string;
  ano_nacimiento: string;
  dorsal: string;
  demarcacion: string;
  estado_scouting: EstadoScouting;
  foto_url?: string;
  created_at: string;
}

export interface ScoutingVisualizacion {
  id: string;
  scouting_jugador_id: string;
  fecha_visualizacion: string;
  notas_observacion: string;
  created_at: string;
}
