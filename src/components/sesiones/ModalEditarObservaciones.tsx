import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Sesion } from '../../pages/Sesiones';

interface ModalEditarObservacionesProps {
  sesion: Sesion;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEditarObservaciones({ sesion, onClose, onSuccess }: ModalEditarObservacionesProps) {
  const [observaciones, setObservaciones] = useState(sesion.observaciones || '');
  const [asistentes, setAsistentes] = useState<string[]>(sesion.asistentes || []);
  const [jugadores, setJugadores] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingJugadores, setLoadingJugadores] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJugadores = async () => {
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('id, nombre')
          .order('nombre');
        
        if (error) throw error;
        setJugadores(data || []);
      } catch (err) {
        console.error('Error cargando jugadores:', err);
      } finally {
        setLoadingJugadores(false);
      }
    };

    fetchJugadores();
  }, []);

  const toggleAsistente = (jugadorId: string) => {
    setAsistentes(prev => 
      prev.includes(jugadorId)
        ? prev.filter(id => id !== jugadorId)
        : [...prev, jugadorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('sesiones')
        .update({ 
          observaciones: observaciones.trim() || null,
          asistentes: asistentes
        })
        .eq('id', sesion.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      console.error('Error al actualizar observaciones:', err);
      setError(err.message || 'Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Editar Observaciones
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Observaciones de: <span className="font-bold">{sesion.titulo}</span>
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Incidencias, jugadores destacados, notas..."
              rows={5}
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white transition-shadow resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex justify-between items-center">
              <span>Asistencia</span>
              <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                {asistentes.length} / {jugadores.length}
              </span>
            </label>
            
            <div className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
              {loadingJugadores ? (
                <div className="p-4 text-center text-sm text-neutral-500 flex justify-center items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Cargando jugadores...
                </div>
              ) : jugadores.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  No hay jugadores registrados
                </div>
              ) : (
                jugadores.map((jugador) => (
                  <label 
                    key={jugador.id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      asistentes.includes(jugador.id)
                        ? 'bg-red-50 dark:bg-red-500/10'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={asistentes.includes(jugador.id)}
                      onChange={() => toggleAsistente(jugador.id)}
                      className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    <span className={`text-sm font-medium ${
                      asistentes.includes(jugador.id)
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {jugador.nombre}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
