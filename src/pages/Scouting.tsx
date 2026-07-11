import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ScoutingJugador } from '../types/scouting';
import { ScoutingPlayerCard } from '../components/scouting/ScoutingPlayerCard';
import { AddScoutingPlayerModal } from '../components/scouting/AddScoutingPlayerModal';
import { ScoutingHistoryModal } from '../components/scouting/ScoutingHistoryModal';
import { Plus, Search, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export function Scouting() {
  const [jugadores, setJugadores] = useState<ScoutingJugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<ScoutingJugador | null>(null);
  const [historyPlayer, setHistoryPlayer] = useState<ScoutingJugador | null>(null);

  const handleOpenAddModal = () => {
    setPlayerToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditPlayer = (jugador: ScoutingJugador) => {
    setPlayerToEdit(jugador);
    setIsAddModalOpen(true);
  };

  const fetchJugadores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scouting_jugadores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJugadores(data || []);
    } catch (error: any) {
      toast.error('Error al cargar jugadores de scouting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJugadores();
  }, []);

  const filteredJugadores = jugadores.filter(jugador => {
    const matchesSearch = jugador.nombre_jugador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          jugador.equipo_origen?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEstado === 'Todos' || jugador.estado_scouting === filterEstado;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Eye className="text-red-600" size={36} />
            Scouting
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
            Seguimiento de jugadores y posibles fichajes.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Nuevo Jugador
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-neutral-800 rounded-xl transition-colors text-neutral-900 dark:text-white font-medium"
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-neutral-800 rounded-xl transition-colors text-neutral-900 dark:text-white font-medium appearance-none"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Seguir viendo">Seguir viendo</option>
            <option value="No ver">No ver</option>
            <option value="Fichar">Fichar</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : filteredJugadores.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <Eye size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No se encontraron jugadores</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            {searchTerm || filterEstado !== 'Todos'
              ? 'Intenta ajustar los filtros de búsqueda.'
              : 'Añade tu primer jugador al sistema de scouting para comenzar a hacer seguimiento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredJugadores.map(jugador => (
            <ScoutingPlayerCard
              key={jugador.id}
              jugador={jugador}
              onUpdate={fetchJugadores}
              onViewHistory={setHistoryPlayer}
              onEdit={handleEditPlayer}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddScoutingPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchJugadores}
        jugadorToEdit={playerToEdit}
      />

      <ScoutingHistoryModal
        jugador={historyPlayer}
        isOpen={!!historyPlayer}
        onClose={() => setHistoryPlayer(null)}
      />
    </div>
  );
}
