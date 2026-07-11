import { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, MapPin, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { Team } from './TeamCard';
import type { Match } from './MatchCard';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  matchToEdit?: Match | null;
}

export function MatchModal({ isOpen, onClose, onSuccess, matchToEdit }: MatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  const [formData, setFormData] = useState({
    rival_id: '',
    fecha: '',
    tipo: 'Liga' as 'Liga' | 'Amistoso',
    condicion: 'Local' as 'Local' | 'Visitante',
    lugar: '',
    estado: 'Planificado'
  });

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      if (matchToEdit) {
        setFormData({
          rival_id: matchToEdit.rival_id,
          fecha: matchToEdit.fecha,
          tipo: matchToEdit.tipo,
          condicion: matchToEdit.condicion || 'Local',
          lugar: matchToEdit.lugar || '',
          estado: matchToEdit.estado || 'Planificado'
        });
      } else {
        setFormData({
          rival_id: '',
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'Liga',
          condicion: 'Local',
          lugar: '',
          estado: 'Planificado'
        });
      }
    }
  }, [isOpen, matchToEdit]);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rival_id) {
      alert('Por favor, selecciona un rival');
      return;
    }
    if (!formData.fecha) {
      alert('Por favor, selecciona una fecha');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        rival_id: formData.rival_id,
        fecha: formData.fecha,
        tipo: formData.tipo,
        condicion: formData.condicion,
        lugar: formData.lugar,
        estado: formData.estado
      };

      if (matchToEdit) {
        const { error } = await supabase
          .from('partidos')
          .update(payload)
          .eq('id', matchToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partidos')
          .insert([payload]);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error al guardar el partido');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {matchToEdit ? 'Editar Partido' : 'Nuevo Partido'}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {matchToEdit ? 'Modifica los detalles del partido' : 'Añade un nuevo partido al calendario'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          {/* Rival */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Equipo Rival</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <select
                value={formData.rival_id}
                onChange={(e) => setFormData({ ...formData, rival_id: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-neutral-900 dark:text-white appearance-none"
                disabled={loadingTeams}
                required
              >
                <option value="">Selecciona un equipo...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Fecha del Partido</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-neutral-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Tipo de Partido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Competición</label>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="Liga"
                    checked={formData.tipo === 'Liga'}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'Liga' | 'Amistoso' })}
                    className="peer sr-only"
                  />
                  <div className="p-3 text-center rounded-xl border-2 border-neutral-200 dark:border-neutral-700 peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-500/10 peer-checked:text-red-700 dark:peer-checked:text-red-400 font-bold transition-all text-sm">
                    Liga
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="Amistoso"
                    checked={formData.tipo === 'Amistoso'}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'Liga' | 'Amistoso' })}
                    className="peer sr-only"
                  />
                  <div className="p-3 text-center rounded-xl border-2 border-neutral-200 dark:border-neutral-700 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-500/10 peer-checked:text-blue-700 dark:peer-checked:text-blue-400 font-bold transition-all text-sm">
                    Amistoso
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Condición</label>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="condicion"
                    value="Local"
                    checked={formData.condicion === 'Local'}
                    onChange={(e) => setFormData({ ...formData, condicion: e.target.value as 'Local' | 'Visitante' })}
                    className="peer sr-only"
                  />
                  <div className="p-3 text-center rounded-xl border-2 border-neutral-200 dark:border-neutral-700 peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-500/10 peer-checked:text-green-700 dark:peer-checked:text-green-400 font-bold transition-all text-sm">
                    Local
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="condicion"
                    value="Visitante"
                    checked={formData.condicion === 'Visitante'}
                    onChange={(e) => setFormData({ ...formData, condicion: e.target.value as 'Local' | 'Visitante' })}
                    className="peer sr-only"
                  />
                  <div className="p-3 text-center rounded-xl border-2 border-neutral-200 dark:border-neutral-700 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-500/10 peer-checked:text-purple-700 dark:peer-checked:text-purple-400 font-bold transition-all text-sm">
                    Visitante
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Lugar */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Lugar / Estadio (Opcional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                placeholder="Ej: Estadio Nuevo Arcángel"
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-neutral-900 dark:text-white"
              />
            </div>
          </div>
          
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex gap-3 justify-end mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-red-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            <span className={cn("flex items-center gap-2", !loading && "hidden")}>
              <Loader2 size={18} className="animate-spin" />
              <span>Guardando...</span>
            </span>
            <span className={cn(loading && "hidden")}>
              <Save size={18} />
              <span>{matchToEdit ? 'Actualizar Partido' : 'Crear Partido'}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
