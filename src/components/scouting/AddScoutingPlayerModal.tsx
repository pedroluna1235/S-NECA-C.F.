import { useState, useEffect } from 'react';
import { X, Save, User, Shield, Calendar, MapPin, Hash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { EstadoScouting, ScoutingJugador } from '../../types/scouting';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jugadorToEdit?: ScoutingJugador | null;
}

const ESTADOS_INICIALES: EstadoScouting[] = ['Seguir viendo', 'No ver', 'Fichar', 'Pendiente'];

export function AddScoutingPlayerModal({ isOpen, onClose, onSuccess, jugadorToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_jugador: '',
    equipo_origen: '',
    ano_nacimiento: '',
    dorsal: '',
    demarcacion: '',
    estado_scouting: 'Pendiente' as EstadoScouting,
  });

  useEffect(() => {
    if (jugadorToEdit && isOpen) {
      setFormData({
        nombre_jugador: jugadorToEdit.nombre_jugador || '',
        equipo_origen: jugadorToEdit.equipo_origen || '',
        ano_nacimiento: jugadorToEdit.ano_nacimiento || '',
        dorsal: jugadorToEdit.dorsal || '',
        demarcacion: jugadorToEdit.demarcacion || '',
        estado_scouting: jugadorToEdit.estado_scouting || 'Pendiente',
      });
    } else if (isOpen) {
      setFormData({
        nombre_jugador: '',
        equipo_origen: '',
        ano_nacimiento: '',
        dorsal: '',
        demarcacion: '',
        estado_scouting: 'Pendiente',
      });
    }
  }, [jugadorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_jugador.trim()) {
      toast.error('El nombre del jugador es obligatorio');
      return;
    }

    setLoading(true);
    try {
      if (jugadorToEdit) {
        const { error } = await supabase
          .from('scouting_jugadores')
          .update(formData)
          .eq('id', jugadorToEdit.id);
        if (error) throw error;
        toast.success('Jugador actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('scouting_jugadores')
          .insert([formData]);
        if (error) throw error;
        toast.success('Jugador añadido correctamente');
      }
      setFormData({
        nombre_jugador: '',
        equipo_origen: '',
        ano_nacimiento: '',
        dorsal: '',
        demarcacion: '',
        estado_scouting: 'Pendiente',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Error al guardar el jugador: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <User className="text-red-600" />
            {jugadorToEdit ? 'Editar Jugador' : 'Añadir Jugador'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-2">
              <User size={16} className="text-neutral-400" /> Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.nombre_jugador}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre_jugador: e.target.value }))}
              className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2.5 px-4"
              placeholder="Ej. Pedro Gómez"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-2">
                <Shield size={16} className="text-neutral-400" /> Equipo Origen
              </label>
              <input
                type="text"
                value={formData.equipo_origen}
                onChange={(e) => setFormData(prev => ({ ...prev, equipo_origen: e.target.value }))}
                className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3"
                placeholder="Ej. Córdoba CF"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-2">
                <Calendar size={16} className="text-neutral-400" /> Año Nacimiento
              </label>
              <input
                type="text"
                value={formData.ano_nacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, ano_nacimiento: e.target.value }))}
                className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3"
                placeholder="Ej. 2012"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-2">
                <MapPin size={16} className="text-neutral-400" /> Demarcación
              </label>
              <input
                type="text"
                value={formData.demarcacion}
                onChange={(e) => setFormData(prev => ({ ...prev, demarcacion: e.target.value }))}
                className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3"
                placeholder="Ej. Medio Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-2">
                <Hash size={16} className="text-neutral-400" /> Dorsal
              </label>
              <input
                type="text"
                value={formData.dorsal}
                onChange={(e) => setFormData(prev => ({ ...prev, dorsal: e.target.value }))}
                className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3"
                placeholder="Ej. 10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Estado Inicial
            </label>
            <select
              value={formData.estado_scouting}
              onChange={(e) => setFormData(prev => ({ ...prev, estado_scouting: e.target.value as EstadoScouting }))}
              className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2.5 px-4"
            >
              {ESTADOS_INICIALES.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
