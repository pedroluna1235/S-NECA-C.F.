import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MatchCard, type Match } from '../components/MatchCard';
import { MatchModal } from '../components/MatchModal';


export function Partidos() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      // We join with 'equipos' to get rival information
      const { data, error } = await supabase
        .from('partidos')
        .select(`
          *,
          rival:equipos(*)
        `)
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleAdd = () => {
    setIsModalOpen(true);
  };

  const filteredMatches = matches.filter(m => {
    const rivalName = m.rival?.nombre?.toLowerCase() || '';
    return rivalName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Partidos</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestiona los partidos y los informes del rival.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por rival..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={fetchMatches}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            title="Recargar"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin text-red-500' : ''} />
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-sm shadow-red-500/20 hover:shadow-md hover:shadow-red-500/30 active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Añadir partido</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-red-500" size={40} />
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMatches.map((match, index) => (
            <div key={match.id} className="animate-in slide-in-from-bottom-4 fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="text-neutral-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No se encontraron partidos</h3>
          <p className="text-neutral-500">Prueba con otro término de búsqueda.</p>
        </div>
      )}

      {/* Modal */}
      <MatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMatches}
      />
    </div>
  );
}
