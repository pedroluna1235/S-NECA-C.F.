import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Match } from '../components/MatchCard';
import { MatchTabs } from '../components/MatchTabs';

export function PartidoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        if (!id) return;
        
        const { data, error } = await supabase
          .from('partidos')
          .select(`
            *,
            rival:equipos(*)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setMatch(data);
      } catch (error) {
        console.error('Error fetching match details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20 px-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Partido no encontrado</h3>
        <Link to="/partidos" className="text-red-600 hover:text-red-700 font-medium text-sm inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Volver a partidos
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(match.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isLocal = match.condicion !== 'Visitante';
  const localTeamLogo = '/logo.png';
  const localTeamName = 'SÉNECA C.F.';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
        {/* Background glow based on type */}
        <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-10 ${match.tipo === 'Liga' ? 'bg-red-500' : 'bg-blue-500'}`} />
        
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <Link to="/partidos" className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          
          <div className="flex items-center gap-4 flex-1">
            {/* Left Team */}
            <div className="flex items-center gap-3">
              {isLocal ? (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-red-600 overflow-hidden">
                  <img src={localTeamLogo} alt={localTeamName} className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-red-600 font-bold text-xl">S</span>'; }} />
                </div>
              ) : match.rival?.escudo_url ? (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-800 overflow-hidden">
                  <img src={match.rival.escudo_url} alt={match.rival.nombre} className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-800" />
              )}
              <span className="font-black text-lg truncate max-w-[150px] sm:max-w-none">{isLocal ? localTeamName : (match.rival?.nombre || 'Rival')}</span>
            </div>
            
            <span className="text-neutral-400 font-bold px-2">VS</span>
            
            {/* Right Team */}
            <div className="flex items-center gap-3">
              {!isLocal ? (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-red-600 overflow-hidden">
                  <img src={localTeamLogo} alt={localTeamName} className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-red-600 font-bold text-xl">S</span>'; }} />
                </div>
              ) : match.rival?.escudo_url ? (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-800 overflow-hidden">
                  <img src={match.rival.escudo_url} alt={match.rival.nombre} className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-800" />
              )}
              <span className="font-black text-lg truncate max-w-[150px] sm:max-w-none">{!isLocal ? localTeamName : (match.rival?.nombre || 'Rival')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 relative z-10 w-full md:w-auto">
          <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wider ${match.tipo === 'Liga' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}`}>
            {match.tipo.toUpperCase()}
          </span>
          <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1 capitalize"><Calendar size={14} /> {formattedDate}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin size={14} /> {match.lugar || 'Por determinar'}</span>
          </div>
        </div>
      </div>

      {/* Tabs System */}
      <MatchTabs match={match} />
    </div>
  );
}
