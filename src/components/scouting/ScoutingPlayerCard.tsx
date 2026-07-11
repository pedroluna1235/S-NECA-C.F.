import type { ScoutingJugador, EstadoScouting } from '../../types/scouting';
import { User, Shield, MapPin, Calendar, Clock, Eye, XCircle, CheckCircle, ChevronRight, Activity, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Props {
  jugador: ScoutingJugador;
  onUpdate: () => void;
  onViewHistory: (jugador: ScoutingJugador) => void;
  onEdit: (jugador: ScoutingJugador) => void;
}

export function ScoutingPlayerCard({ jugador, onUpdate, onViewHistory, onEdit }: Props) {
  const getBadgeColor = (estado: EstadoScouting) => {
    switch (estado) {
      case 'Seguir viendo':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'No ver':
        return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30';
      case 'Fichar':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'Pendiente':
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400 border-neutral-200 dark:border-neutral-500/30';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getBadgeIcon = (estado: EstadoScouting) => {
    switch (estado) {
      case 'Seguir viendo': return <Eye size={14} className="mr-1" />;
      case 'No ver': return <XCircle size={14} className="mr-1" />;
      case 'Fichar': return <CheckCircle size={14} className="mr-1" />;
      case 'Pendiente': return <Clock size={14} className="mr-1" />;
    }
  };

  const changeStatus = async (nuevoEstado: EstadoScouting) => {
    if (jugador.estado_scouting === nuevoEstado) return;
    
    try {
      const { error } = await supabase
        .from('scouting_jugadores')
        .update({ estado_scouting: nuevoEstado })
        .eq('id', jugador.id);

      if (error) throw error;
      onUpdate();
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch (error: any) {
      toast.error('Error al actualizar el estado: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este jugador y todo su historial de scouting?')) return;

    try {
      const { error } = await supabase
        .from('scouting_jugadores')
        .delete()
        .eq('id', jugador.id);

      if (error) throw error;
      onUpdate();
      toast.success('Jugador eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar el jugador: ' + error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:shadow-md hover:border-red-500/30 group flex flex-col h-full relative">
      {/* Actions Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(jugador)}
          className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
          title="Editar Jugador"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          title="Eliminar Jugador"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex flex-shrink-0 items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-red-500 transition-colors">
            {jugador.foto_url ? (
              <img src={jugador.foto_url} alt={jugador.nombre_jugador} className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-neutral-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              {jugador.nombre_jugador}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadgeColor(jugador.estado_scouting)}`}>
                {getBadgeIcon(jugador.estado_scouting)}
                {jugador.estado_scouting}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5 flex-1">
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg">
          <Shield size={16} className="text-red-500" />
          <span className="truncate" title={jugador.equipo_origen}>{jugador.equipo_origen || '-'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg">
          <Calendar size={16} className="text-blue-500" />
          <span>{jugador.ano_nacimiento || '-'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg">
          <MapPin size={16} className="text-green-500" />
          <span className="truncate" title={jugador.demarcacion}>{jugador.demarcacion || '-'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg">
          <span className="font-bold text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-700 w-5 h-5 flex items-center justify-center rounded text-xs">
            {jugador.dorsal || '-'}
          </span>
          <span>Dorsal</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-auto">
        {/* Quick Status Change */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => changeStatus('Seguir viendo')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              jugador.estado_scouting === 'Seguir viendo'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            Seguir
          </button>
          <button
            onClick={() => changeStatus('No ver')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              jugador.estado_scouting === 'No ver'
                ? 'bg-red-500 text-white border-red-600'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            No Ver
          </button>
          <button
            onClick={() => changeStatus('Fichar')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              jugador.estado_scouting === 'Fichar'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            Fichar
          </button>
        </div>

        {/* History Button */}
        <button
          onClick={() => onViewHistory(jugador)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl font-medium transition-colors text-sm"
        >
          <Activity size={16} className="text-red-500" />
          Ver Historial
          <ChevronRight size={16} className="text-neutral-400" />
        </button>
      </div>
    </div>
  );
}
