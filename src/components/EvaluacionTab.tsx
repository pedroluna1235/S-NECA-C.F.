import { useState, useEffect } from 'react';
import { Save, Loader2, Users, Star, Clock, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface EvaluacionTabProps {
  matchId: string;
}

interface Jugador {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string;
  foto_url: string | null;
}

interface Evaluacion {
  id?: string;
  jugador_id: string;
  minutos_jugados: number;
  goles: number;
  nota: number;
}

export function EvaluacionTab({ matchId }: EvaluacionTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Record<string, Evaluacion>>({});
  
  // Get all players and existing evaluations
  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all players
      const { data: jugadoresData, error: jugadoresError } = await supabase
        .from('jugadores')
        .select('id, nombre, dorsal, demarcacion, foto_url')
        .order('dorsal', { ascending: true });
        
      if (jugadoresError) throw jugadoresError;
      
      // Fetch convocatoria for this match
      const { data: convData } = await supabase
        .from('convocatoria')
        .select('jugadores_ids')
        .eq('partido_id', matchId)
        .maybeSingle();
      
      let filteredJugadores = jugadoresData || [];
      
      // If there is a convocatoria, show only summoned players. Otherwise, show all.
      if (convData && convData.jugadores_ids && convData.jugadores_ids.length > 0) {
        filteredJugadores = filteredJugadores.filter(j => convData.jugadores_ids.includes(j.id));
      }
      setJugadores(filteredJugadores);

      // Fetch existing evaluations
      const { data: evalData, error: evalError } = await supabase
        .from('evaluaciones_partido')
        .select('*')
        .eq('partido_id', matchId);
        
      // Ignore error if table doesn't exist yet, just means we start fresh
      if (evalError && evalError.code !== '42P01') {
        console.error("Error loading evaluations:", evalError);
      }
      
      const evalMap: Record<string, Evaluacion> = {};
      if (evalData) {
        evalData.forEach((ev: any) => {
          evalMap[ev.jugador_id] = {
            id: ev.id,
            jugador_id: ev.jugador_id,
            minutos_jugados: ev.minutos_jugados || 0,
            goles: ev.goles || 0,
            nota: ev.nota || 0
          };
        });
      }
      
      // Initialize missing evaluations with default values
      filteredJugadores.forEach(j => {
        if (!evalMap[j.id]) {
          evalMap[j.id] = {
            jugador_id: j.id,
            minutos_jugados: 0,
            goles: 0,
            nota: 0
          };
        }
      });
      
      setEvaluaciones(evalMap);
    } catch (error) {
      console.error('Error fetching data for evaluations:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (jugadorId: string, field: keyof Evaluacion, value: string) => {
    let parsedValue = 0;
    if (field === 'nota') {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) parsedValue = 0;
      if (parsedValue > 10) parsedValue = 10;
      if (parsedValue < 0) parsedValue = 0;
    } else {
      parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue)) parsedValue = 0;
      if (parsedValue < 0) parsedValue = 0;
    }
    
    setEvaluaciones(prev => ({
      ...prev,
      [jugadorId]: {
        ...prev[jugadorId],
        [field]: parsedValue
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const upsertData = Object.values(evaluaciones).map(ev => ({
        partido_id: matchId,
        jugador_id: ev.jugador_id,
        minutos_jugados: ev.minutos_jugados,
        goles: ev.goles,
        nota: ev.nota
      }));

      const { error } = await supabase
        .from('evaluaciones_partido')
        .upsert(upsertData, { onConflict: 'partido_id,jugador_id' });

      if (error) {
        if (error.code === '42P01') {
          toast.error("Por favor, ejecuta el script SQL 'setup_evaluaciones.sql' en Supabase primero.");
        } else {
          toast.error("DB Error: " + error.message + (error.details ? " - " + error.details : ""));
          console.error("DB Error:", error);
        }
      } else {
        toast.success('Evaluaciones guardadas correctamente');
        // Refresh to get any new IDs
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error saving evaluations:', error);
      toast.error('Catch Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  const posiciones = ['Portero', 'Defensa', 'Centrocampista', 'Delantero'];
  const groupedJugadores = posiciones.map(pos => ({
    posicion: pos,
    jugadores: jugadores.filter(j => j.demarcacion === pos)
  })).filter(group => group.jugadores.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <Star className="text-amber-500" /> Evaluación de Jugadores
          </h2>
          <p className="text-neutral-500 mt-1">Registra minutos, goles y nota para cada jugador en este partido.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-70 w-full sm:w-auto"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{saving ? 'Guardando...' : 'Guardar Evaluaciones'}</span>
        </button>
      </div>

      {groupedJugadores.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
          <Users size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No hay jugadores para evaluar</h3>
          <p className="text-neutral-500 mt-2">Añade jugadores a la convocatoria primero, o asegúrate de que hay jugadores en la plantilla.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedJugadores.map(group => (
            <div key={group.posicion} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-lg font-black text-neutral-400 uppercase tracking-wider mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                {group.posicion}s
              </h3>
              
              <div className="space-y-4">
                {/* Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <div className="col-span-5">Jugador</div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1"><Clock size={14} /> Minutos</div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1"><Target size={14} /> Goles</div>
                  <div className="col-span-3 text-center flex items-center justify-center gap-1"><Star size={14} /> Nota (0-10)</div>
                </div>

                {group.jugadores.map(jugador => {
                  const ev = evaluaciones[jugador.id];
                  if (!ev) return null;
                  
                  return (
                    <div key={jugador.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 items-center">
                      <div className="col-span-1 md:col-span-5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                          {jugador.foto_url ? (
                            <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400"><Users size={20} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">{jugador.nombre}</p>
                          {jugador.dorsal && <p className="text-xs font-medium text-neutral-500">Dorsal {jugador.dorsal}</p>}
                        </div>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 flex md:justify-center items-center gap-3">
                        <label className="text-xs font-bold text-neutral-500 md:hidden w-16">Minutos</label>
                        <input
                          type="number"
                          min="0"
                          value={ev.minutos_jugados || ''}
                          onChange={(e) => handleInputChange(jugador.id, 'minutos_jugados', e.target.value)}
                          placeholder="0"
                          className="w-20 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-center"
                        />
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 flex md:justify-center items-center gap-3">
                        <label className="text-xs font-bold text-neutral-500 md:hidden w-16">Goles</label>
                        <input
                          type="number"
                          min="0"
                          value={ev.goles || ''}
                          onChange={(e) => handleInputChange(jugador.id, 'goles', e.target.value)}
                          placeholder="0"
                          className="w-20 px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold text-center text-green-700 dark:text-green-500"
                        />
                      </div>
                      
                      <div className="col-span-1 md:col-span-3 flex md:justify-center items-center gap-3">
                        <label className="text-xs font-bold text-neutral-500 md:hidden w-16">Nota</label>
                        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 w-full md:w-32 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={ev.nota || ''}
                            onChange={(e) => handleInputChange(jugador.id, 'nota', e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-transparent border-none focus:outline-none font-bold text-center text-amber-600 dark:text-amber-500"
                          />
                          <Star size={16} className={ev.nota >= 7 ? "text-amber-500 fill-amber-500" : "text-neutral-300 dark:text-neutral-600"} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
