import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { Team } from './TeamCard';

export interface Match {
  id: string;
  rival_id: string;
  fecha: string;
  tipo: 'Liga' | 'Amistoso';
  lugar: string;
  estado: string;
  rival?: Team;
}

interface MatchCardProps {
  match: Match;
  localTeamName?: string;
  localTeamLogo?: string;
}

export function MatchCard({ match, localTeamName = 'SÉNECA C.F.', localTeamLogo = '/logo.jpg' }: MatchCardProps) {
  const isLiga = match.tipo === 'Liga';

  // Format date to locale string
  const formattedDate = new Date(match.fecha).toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="group bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full">
      {/* Background decoration */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 transition-all group-hover:scale-150 duration-700",
        isLiga ? "bg-red-500" : "bg-blue-500"
      )} />

      {/* Header / Type */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <span className={cn(
          "px-3 py-1 text-xs font-bold rounded-full tracking-wider",
          isLiga 
            ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" 
            : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
        )}>
          {match.tipo.toUpperCase()}
        </span>
      </div>

      {/* Teams Vs */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        {/* Local Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 shadow-md flex items-center justify-center overflow-hidden relative">
            <img src={localTeamLogo} alt={localTeamName} className="w-full h-full object-contain p-1.5" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="font-black text-2xl text-red-600">S</span>'; }} />
          </div>
          <span className="font-bold text-sm text-center text-neutral-900 dark:text-white line-clamp-2">
            {localTeamName}
          </span>
        </div>

        {/* VS badge */}
        <div className="px-4">
          <span className="text-sm font-black text-neutral-300 dark:text-neutral-700">VS</span>
        </div>

        {/* Away Team (Rival) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 shadow-md flex items-center justify-center overflow-hidden relative">
            {match.rival?.escudo_url ? (
              <img src={match.rival.escudo_url} alt={match.rival.nombre} className="w-full h-full object-contain p-1.5" />
            ) : (
              <ShieldIcon />
            )}
          </div>
          <span className="font-bold text-sm text-center text-neutral-900 dark:text-white line-clamp-2">
            {match.rival?.nombre || 'Rival Desconocido'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6 flex-1 relative z-10">
        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl">
          <Calendar size={16} className="text-neutral-400" />
          <span className="font-medium capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-xl">
          <MapPin size={16} className="text-neutral-400" />
          <span className="font-medium truncate">{match.lugar || 'Por determinar'}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto relative z-10">
        <Link 
          to={`/partidos/${match.id}`}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 py-3 rounded-xl font-bold transition-all active:scale-95 group/btn"
        >
          <span>Abrir detalle</span>
          <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-neutral-400">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
