import { cn } from '../lib/utils';
import { differenceInYears } from 'date-fns';

export interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string;
  fecha_nacimiento: string | null;
  foto_url: string | null;
}

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const age = player.fecha_nacimiento 
    ? differenceInYears(new Date(), new Date(player.fecha_nacimiento))
    : 'N/A';

  // Simular la forma con un número aleatorio entre 60 y 100 si no viene en los datos
  const forma = Math.floor(Math.random() * 41) + 60; 
  
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Dorsal en la esquina superior */}
      {player.dorsal && (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
          {player.dorsal}
        </div>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Información superpuesta */}
      <div className="absolute bottom-0 w-full p-4 pt-12 flex flex-col gap-1">
        <h3 className="font-bold text-xl text-white truncate drop-shadow-md">{player.nombre}</h3>
        <div className="flex justify-between items-center text-neutral-200 text-sm font-medium drop-shadow-md">
          <span>{player.demarcacion || 'Sin demarcación'}</span>
          <span>{age} años</span>
        </div>
        
        {/* Barra de Forma */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-bold text-white/90 drop-shadow-md">FORMA</span>
          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                forma >= 80 ? "bg-green-500" : forma >= 70 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${forma}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white drop-shadow-md">{forma}%</span>
        </div>
      </div>
    </div>
  );
}
