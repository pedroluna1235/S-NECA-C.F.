export interface JugadorSesion {
  id: string;
  nombre: string;
  disponible: boolean;
}

export interface TareaSesion {
  id: string;
  titulo: string;
  tiempo: string;
  equipos: string;
  descripcion: string;
  variables: string;
  roles: string;
  reflexion: string;
  imagen_url: string; // Base64 or uploaded URL
}

export interface MaterialSesion {
  balones: number;
  petos1: number;
  petos2: number;
  petos3: number;
  conos: number;
  aros: number;
  bancos: number;
  fitball: number;
  picas: number;
  porterias: number;
}

export interface ObjetivosSesion {
  tecnicos: string;
  tacticos: string;
  fisicos: string;
}

export interface CabeceraSesion {
  objetivo: string;
  principios: string;
  microcicloNum: string;
  fecha: string;
  hora: string;
  sesionNum: string;
}

export interface DatosDisenoSesion {
  cabecera: CabeceraSesion;
  material: MaterialSesion;
  tareas: TareaSesion[];
  jugadores: JugadorSesion[];
}
