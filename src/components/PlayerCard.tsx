import { differenceInYears } from 'date-fns';
import { Edit2, Eye, Trash2 } from 'lucide-react';

export interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string;
  fecha_nacimiento: string | null;
  lateralidad?: string | null;
  foto_url: string | null;
  gustos?: string | null;
  estadisticas_generales?: any;
  stats_con_balon?: any;
  stats_sin_balon?: any;
  stats_fisico?: any;
  video_url?: string | null;
}

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onView?: (player: Player) => void;
  onDelete?: (id: string) => void;
}

export function PlayerCard({ player, onEdit, onView, onDelete }: PlayerCardProps) {
  let age: string | number = 'N/A';
  
  if (player.fecha_nacimiento) {
    const parsedDate = new Date(player.fecha_nacimiento);
    if (!isNaN(parsedDate.getTime())) {
      try {
        age = differenceInYears(new Date(), parsedDate);
      } catch (e) {
        console.error(e);
      }
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 pb-14">
      {/* Dorsal en la esquina superior */}
      {player.dorsal && (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
          {player.dorsal}
        </div>
      )}

      {/* Botón de eliminar en hover */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(player.id);
          }}
          className="absolute top-3 left-3 z-20 p-2 bg-white/90 dark:bg-black/70 hover:bg-red-50 dark:hover:bg-red-900/40 text-neutral-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
          title="Eliminar jugador"
        >
          <Trash2 size={16} />
        </button>
      )}
      
      {/* Imagen del jugador */}
      <div className="aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {player.foto_url ? (
          <img 
            src={player.foto_url} 
            alt={`Foto de ${player.nombre}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium">Sin foto</span>
          </div>
        )}
        
        {/* Gradiente en la parte inferior de la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Información superpuesta */}
      <div className="absolute bottom-14 w-full p-4 pt-12 flex flex-col gap-1 pointer-events-none">
        <h3 className="font-bold text-xl text-white truncate drop-shadow-md">{player.nombre}</h3>
        <div className="flex justify-between items-center text-neutral-200 text-sm font-medium drop-shadow-md">
          <span>{player.demarcacion || 'Sin demarcación'}</span>
          <span>{age} años</span>
        </div>
      </div>

      {/* Botones de acción en la base (fuera de la imagen, con fondo blanco/negro del card) */}
      <div className="absolute bottom-0 w-full h-14 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-center gap-3 px-4">
        {onView && (
          <button
            onClick={() => onView(player)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-semibold"
          >
            <Eye size={16} className="text-neutral-500" />
            Ver
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(player)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-sm font-semibold"
          >
            <Edit2 size={16} />
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
