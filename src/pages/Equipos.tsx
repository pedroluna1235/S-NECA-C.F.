import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TeamCard, type Team } from '../components/TeamCard';
import { TeamModal } from '../components/TeamModal';

export function Equipos() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleAdd = () => {
    setTeamToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (team: Team) => {
    setTeamToEdit(team);
    setIsModalOpen(true);
  };

  const filteredTeams = teams.filter(t => 
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Equipos</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestiona los clubes rivales.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={fetchTeams}
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
            <span className="hidden sm:inline">Añadir equipo</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-red-500" size={40} />
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTeams.map((team, index) => (
            <div key={team.id} className="animate-in slide-in-from-bottom-4 fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
              <TeamCard team={team} onEdit={handleEdit} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="text-neutral-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No se encontraron equipos</h3>
          <p className="text-neutral-500">Prueba con otro término de búsqueda o añade uno nuevo.</p>
          <button 
            onClick={handleAdd}
            className="text-red-600 hover:text-red-700 font-medium text-sm mt-4"
          >
            Añadir el primer equipo
          </button>
        </div>
      )}

      {/* Modal */}
      <TeamModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTeams}
        teamToEdit={teamToEdit}
      />
    </div>
  );
}
