import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerCard, type Player } from '../components/PlayerCard';
import { PlayerModal } from '../components/PlayerModal';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { useAuth } from '../contexts/AuthContext';

export function Plantilla() {
  const { role } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Edición/Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  // Modal de Detalle (Radar)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [playerToView, setPlayerToView] = useState<Player | null>(null);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('dorsal', { ascending: true, nullsFirst: false });
        
      if (error) throw error;
      setPlayers(data || []);
      
      // Actualizar la información en los modales si están abiertos
      setPlayerToView(prev => prev ? (data?.find(p => p.id === prev.id) || prev) : null);
      setPlayerToEdit(prev => prev ? (data?.find(p => p.id === prev.id) || prev) : null);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleEdit = (player: Player) => {
    if (role === 'lector') return;
    setPlayerToEdit(player);
    setIsModalOpen(true);
  };

  const handleView = (player: Player) => {
    setPlayerToView(player);
    setIsDetailModalOpen(true);
  };

  const handleAdd = () => {
    if (role === 'lector') return;
    setPlayerToEdit(null);
    setIsModalOpen(true);
  };

  const filteredPlayers = players.filter(p => {
    const nombreStr = p.nombre || '';
    const demarcacionStr = p.demarcacion || '';
    return nombreStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
           demarcacionStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Plantilla</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestiona los jugadores del Prebenjamín A
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar jugador..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
            />
          </div>
          
          <button 
            onClick={fetchPlayers}
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
            title="Recargar"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={handleAdd}
            disabled={role === 'lector'}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all shadow-md ${
              role === 'lector' 
                ? 'bg-red-600 opacity-50 cursor-not-allowed pointer-events-none' 
                : 'bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-95'
            }`}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Añadir Jugador</span>
          </button>
        </div>
      </div>

      {/* Grid de Jugadores */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-neutral-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No hay jugadores</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
            No se encontraron jugadores que coincidan con tu búsqueda o la plantilla está vacía.
          </p>
          <button 
            onClick={handleAdd}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Añadir el primer jugador
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {['Portero', 'Defensa', 'Centrocampista', 'Delantero'].map(position => {
            const groupPlayers = filteredPlayers.filter(p => p.demarcacion === position);
            
            if (groupPlayers.length === 0) return null;

            let badgeColor = 'bg-neutral-500';
            let abbrev = position.substring(0, 3).toUpperCase();
            let plural = position;

            switch (position) {
              case 'Portero': badgeColor = 'bg-purple-500 text-white'; abbrev = 'POR'; plural = 'Porteros'; break;
              case 'Defensa': badgeColor = 'bg-blue-500 text-white'; abbrev = 'DEF'; plural = 'Defensas'; break;
              case 'Centrocampista': badgeColor = 'bg-emerald-500 text-white'; abbrev = 'CEN'; plural = 'Centrocampistas'; break;
              case 'Delantero': badgeColor = 'bg-red-500 text-white'; abbrev = 'DEL'; plural = 'Delanteros'; break;
            }

            return (
              <div key={position} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${badgeColor} shadow-sm`}>
                    {abbrev}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {plural}
                    <span className="text-neutral-400 dark:text-neutral-500 text-sm font-medium">({groupPlayers.length})</span>
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {groupPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} onEdit={handleEdit} onView={handleView} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <PlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPlayers}
        playerToEdit={playerToEdit}
      />

      <PlayerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        player={playerToView}
        onSuccess={fetchPlayers}
      />
    </div>
  );
}
