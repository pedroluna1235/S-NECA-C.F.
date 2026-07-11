import { useState, useEffect } from 'react';
import { X, Calendar, MessageSquare, Plus, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ScoutingJugador, ScoutingVisualizacion } from '../../types/scouting';
import toast from 'react-hot-toast';

interface Props {
  jugador: ScoutingJugador | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScoutingHistoryModal({ jugador, isOpen, onClose }: Props) {
  const [visualizaciones, setVisualizaciones] = useState<ScoutingVisualizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha_visualizacion: new Date().toISOString().split('T')[0],
    notas_observacion: '',
  });

  useEffect(() => {
    if (isOpen && jugador) {
      cargarVisualizaciones();
    }
  }, [isOpen, jugador]);

  const cargarVisualizaciones = async () => {
    if (!jugador) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scouting_visualizaciones')
        .select('*')
        .eq('scouting_jugador_id', jugador.id)
        .order('fecha_visualizacion', { ascending: false });

      if (error) throw error;
      setVisualizaciones(data || []);
    } catch (error: any) {
      toast.error('Error al cargar historial: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisualizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugador || !formData.notas_observacion.trim() || !formData.fecha_visualizacion) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('scouting_visualizaciones')
        .insert([{
          scouting_jugador_id: jugador.id,
          fecha_visualizacion: formData.fecha_visualizacion,
          notas_observacion: formData.notas_observacion
        }]);

      if (error) throw error;

      toast.success('Visualización añadida');
      setFormData({
        fecha_visualizacion: new Date().toISOString().split('T')[0],
        notas_observacion: '',
      });
      cargarVisualizaciones();
    } catch (error: any) {
      toast.error('Error al añadir visualización: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !jugador) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 transition-opacity">
      <div className="bg-white dark:bg-neutral-900 h-full w-full max-w-md shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Activity className="text-red-600" />
              Historial
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{jugador.nombre_jugador}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario Nueva Visualización */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm z-10">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Plus size={16} className="text-red-500" /> Nueva Observación
          </h3>
          <form onSubmit={handleAddVisualizacion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} /> Fecha
              </label>
              <input
                type="date"
                required
                value={formData.fecha_visualizacion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_visualizacion: e.target.value }))}
                className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <MessageSquare size={14} /> Notas Tácticas
              </label>
              <textarea
                required
                value={formData.notas_observacion}
                onChange={(e) => setFormData(prev => ({ ...prev, notas_observacion: e.target.value }))}
                className="w-full rounded-xl border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3 text-sm min-h-[80px]"
                placeholder="Ej. Destaca en el juego aéreo..."
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
            >
              <Plus size={18} />
              {saving ? 'Guardando...' : 'Añadir Observación'}
            </button>
          </form>
        </div>

        {/* Lista de Historial */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50 dark:bg-neutral-900/30">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">
            Cronología
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : visualizaciones.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Activity size={32} className="mx-auto text-neutral-400 mb-2 opacity-50" />
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">No hay observaciones registradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visualizaciones.map((vis) => (
                <div key={vis.id} className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-red-500" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {new Date(vis.fecha_visualizacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap pl-5 border-l-2 border-neutral-100 dark:border-neutral-700 mt-2">
                    {vis.notas_observacion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
