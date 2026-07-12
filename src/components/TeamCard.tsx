import { Edit2, Trash2 } from 'lucide-react';

export interface Team {
  id: string;
  nombre: string;
  escudo_url: string | null;
}

interface TeamCardProps {
  team: Team;
  onEdit?: (team: Team) => void;
  onDelete?: (id: string) => void;
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  return (
    <div className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Botones (Hover) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(team);
            }}
            className="p-2 bg-white/90 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-blue-500 hover:text-blue-600 rounded-full shadow-sm backdrop-blur-sm transition-colors"
          >
            <Edit2 size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team.id);
            }}
            className="p-2 bg-white/90 dark:bg-black/70 hover:bg-white dark:hover:bg-black text-red-500 hover:text-red-600 rounded-full shadow-sm backdrop-blur-sm transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 mb-4 overflow-hidden relative shadow-inner group-hover:shadow-md transition-shadow">
        {team.escudo_url ? (
          <img 
            src={team.escudo_url} 
            alt={`Escudo de ${team.nombre}`} 
            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-full">
            <span className="font-bold text-2xl opacity-50">{team.nombre.substring(0, 2).toUpperCase()}</span>
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-lg text-center text-neutral-900 dark:text-white line-clamp-2">
        {team.nombre}
      </h3>
    </div>
  );
}
