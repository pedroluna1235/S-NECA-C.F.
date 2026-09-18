import { useState, useEffect } from 'react';
import { Save, Loader2, Clock, MapPin, Users, Info, Plus, Trash2, ShieldAlert, Cloud, Star, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface PlanillaTabProps {
  matchId: string;
}

interface JugadorPlanilla {
  id: string;
  nombre: string;
  dorsal: string;
  titular: boolean;
}

interface EventoPlanilla {
  id: string;
  jugadorId: string;
  isLocal: boolean;
  tipo: 'gol' | 'amarilla' | 'roja' | 'sustitucion';
  minuto: string;
  entraId?: string; // Solo para sustituciones
}

export function PlanillaTab({ matchId }: PlanillaTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planillaId, setPlanillaId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    hora_partido: '',
    lugar: '',
    observaciones: '',
    arbitros: '',
    clima: '',
    mvp: '',
  });

  const [localPlayers, setLocalPlayers] = useState<JugadorPlanilla[]>([]);
  const [rivalPlayers, setRivalPlayers] = useState<JugadorPlanilla[]>([]);
  const [eventos, setEventos] = useState<EventoPlanilla[]>([]);

  // Add rival form
  const [newRival, setNewRival] = useState({ nombre: '', dorsal: '', titular: false });

  // Event modal form
  const [activeEventPrompt, setActiveEventPrompt] = useState<{jugadorId: string, isLocal: boolean} | null>(null);
  const [eventForm, setEventForm] = useState<{tipo: EventoPlanilla['tipo'], minuto: string, entraId: string}>({
    tipo: 'gol', minuto: '', entraId: ''
  });

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch match and conv
      const [matchRes, convRes] = await Promise.all([
        supabase.from('partidos').select('lugar').eq('id', matchId).single(),
        supabase.from('convocatoria').select('jugadores_ids, hora_partido').eq('partido_id', matchId).maybeSingle()
      ]);

      let fetchedLocalPlayers: JugadorPlanilla[] = [];
      if (convRes.data?.jugadores_ids?.length > 0) {
        const { data: jugData } = await supabase
          .from('jugadores')
          .select('id, nombre, dorsal')
          .in('id', convRes.data.jugadores_ids);

        if (jugData) {
          fetchedLocalPlayers = jugData.map(j => ({
            id: j.id,
            nombre: j.nombre,
            dorsal: j.dorsal?.toString() || '',
            titular: false
          }));
        }
      }

      const { data: planillaData } = await supabase
        .from('planilla_partido')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (planillaData) {
        setPlanillaId(planillaData.id);
        setFormData({
          hora_partido: planillaData.hora_partido || '',
          lugar: planillaData.lugar || '',
          observaciones: planillaData.observaciones || '',
          arbitros: planillaData.arbitros || '',
          clima: planillaData.clima || '',
          mvp: planillaData.mvp || '',
        });

        // Local
        let savedLocal: JugadorPlanilla[] = [];
        try { savedLocal = JSON.parse(planillaData.alineacion_local || '[]'); } catch (e) {}
        
        // Merge para preservar si es titular pero actualizar si cambian los convocados
        const mergedLocal = fetchedLocalPlayers.map(flp => {
          const saved = savedLocal.find(s => s.id === flp.id);
          return saved ? { ...flp, titular: saved.titular } : flp;
        });
        // Agregar los que estén en savedLocal pero no en fetched (por si acaso se desconvocó después pero queremos mantener el historial de la planilla, aunque lo ideal es guiarse por la convocatoria. Lo omitimos para mantenerlo limpio con los convocados actuales).
        setLocalPlayers(mergedLocal.length > 0 ? mergedLocal : savedLocal);

        // Rival
        try { setRivalPlayers(JSON.parse(planillaData.alineacion_visitante || '[]')); } catch (e) {}

        // Eventos
        let savedGoles = [];
        let savedTarjetas = [];
        let savedSubs = [];
        try { savedGoles = JSON.parse(planillaData.goles || '[]'); } catch (e) {}
        try { savedTarjetas = JSON.parse(planillaData.tarjetas || '[]'); } catch (e) {}
        try { savedSubs = JSON.parse(planillaData.sustituciones || '[]'); } catch (e) {}

        setEventos([...savedGoles, ...savedTarjetas, ...savedSubs]);
      } else {
        setFormData(prev => ({
          ...prev,
          lugar: matchRes.data?.lugar || '',
          hora_partido: convRes.data?.hora_partido || ''
        }));
        setLocalPlayers(fetchedLocalPlayers);
      }
    } catch (error) {
      console.error('Error fetching data for Planilla:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addRival = () => {
    if (!newRival.nombre.trim()) return;
    setRivalPlayers([...rivalPlayers, { 
      id: uuidv4(), 
      nombre: newRival.nombre, 
      dorsal: newRival.dorsal, 
      titular: newRival.titular 
    }]);
    setNewRival({ nombre: '', dorsal: '', titular: false });
  };

  const removeRival = (id: string) => {
    setRivalPlayers(rivalPlayers.filter(r => r.id !== id));
    // Remove their events
    setEventos(eventos.filter(e => e.jugadorId !== id && e.entraId !== id));
  };

  const toggleTitular = (id: string, isLocal: boolean, titular: boolean) => {
    if (isLocal) {
      setLocalPlayers(localPlayers.map(p => p.id === id ? { ...p, titular } : p));
    } else {
      setRivalPlayers(rivalPlayers.map(p => p.id === id ? { ...p, titular } : p));
    }
  };

  const openEventPrompt = (jugadorId: string, isLocal: boolean) => {
    setActiveEventPrompt({ jugadorId, isLocal });
    setEventForm({ tipo: 'gol', minuto: '', entraId: '' });
  };

  const saveEvent = (jugadorId: string, isLocal: boolean) => {
    if (!eventForm.minuto.trim()) {
      toast.error('Indica el minuto');
      return;
    }
    if (eventForm.tipo === 'sustitucion' && !eventForm.entraId) {
      toast.error('Indica el jugador que entra');
      return;
    }

    const newEvent: EventoPlanilla = {
      id: uuidv4(),
      jugadorId,
      isLocal,
      tipo: eventForm.tipo,
      minuto: eventForm.minuto,
      entraId: eventForm.tipo === 'sustitucion' ? eventForm.entraId : undefined
    };

    setEventos([...eventos, newEvent]);
    setActiveEventPrompt(null);
  };

  const removeEvent = (id: string) => {
    setEventos(eventos.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const goles = eventos.filter(e => e.tipo === 'gol');
      const tarjetas = eventos.filter(e => e.tipo === 'amarilla' || e.tipo === 'roja');
      const sustituciones = eventos.filter(e => e.tipo === 'sustitucion');

      const payload = {
        partido_id: matchId,
        ...formData,
        alineacion_local: JSON.stringify(localPlayers),
        alineacion_visitante: JSON.stringify(rivalPlayers),
        goles: JSON.stringify(goles),
        tarjetas: JSON.stringify(tarjetas),
        sustituciones: JSON.stringify(sustituciones),
      };

      if (planillaId) {
        const { error } = await supabase.from('planilla_partido').update(payload).eq('id', planillaId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('planilla_partido').insert([payload]).select().single();
        if (error) throw error;
        if (data) setPlanillaId(data.id);
      }
      
      toast.success('Planilla guardada correctamente');
    } catch (error: any) {
      console.error('Error saving planilla:', error);
      toast.error('Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const renderPlayerRow = (jugador: JugadorPlanilla, isLocal: boolean) => {
    const teamPlayers = isLocal ? localPlayers : rivalPlayers;
    const teamEvents = eventos.filter(e => e.jugadorId === jugador.id);
    const suplentes = teamPlayers.filter(p => !p.titular && p.id !== jugador.id);

    return (
      <div key={jugador.id} className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col gap-2 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
              {jugador.dorsal ? <span className="text-neutral-500 mr-1.5">{jugador.dorsal}.</span> : null}
              {jugador.nombre}
            </div>
            
            {/* Eventos tags */}
            {teamEvents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {teamEvents.map(ev => (
                  <div key={ev.id} className="bg-white dark:bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-800 flex items-center gap-1 text-xs shadow-sm">
                    {ev.tipo === 'gol' && <span>⚽</span>}
                    {ev.tipo === 'amarilla' && <span className="text-yellow-500">🟨</span>}
                    {ev.tipo === 'roja' && <span className="text-red-500">🟥</span>}
                    {ev.tipo === 'sustitucion' && <span className="text-blue-500">🔄</span>}
                    <span className="font-medium">{ev.minuto}'</span>
                    {ev.tipo === 'sustitucion' && ev.entraId && (
                      <span className="text-neutral-500 ml-0.5 truncate max-w-[100px]" title={teamPlayers.find(p => p.id === ev.entraId)?.nombre}>
                        (por {teamPlayers.find(p => p.id === ev.entraId)?.nombre})
                      </span>
                    )}
                    <button onClick={() => removeEvent(ev.id)} className="text-neutral-400 hover:text-red-500 ml-0.5">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <select 
                value={jugador.titular ? "Titular" : "Suplente"}
                onChange={(e) => toggleTitular(jugador.id, isLocal, e.target.value === "Titular")}
                className="text-xs font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="Titular">Titular</option>
                <option value="Suplente">Suplente</option>
              </select>
              {!isLocal && (
                <button onClick={() => removeRival(jugador.id)} className="text-neutral-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Formulario Inline de Evento */}
        {activeEventPrompt?.jugadorId === jugador.id ? (
          <div className="mt-2 p-2.5 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-sm shadow-sm">
            <select 
              value={eventForm.tipo} 
              onChange={e => setEventForm({...eventForm, tipo: e.target.value as any})} 
              className="border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded p-1.5 outline-none"
            >
              <option value="gol">Gol ⚽</option>
              <option value="amarilla">Amarilla 🟨</option>
              <option value="roja">Roja 🟥</option>
              <option value="sustitucion">Cambio 🔄</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Min" 
              value={eventForm.minuto} 
              onChange={e => setEventForm({...eventForm, minuto: e.target.value})} 
              className="border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded p-1.5 w-14 outline-none" 
            />
            
            {eventForm.tipo === 'sustitucion' && (
              <select 
                value={eventForm.entraId} 
                onChange={e => setEventForm({...eventForm, entraId: e.target.value})} 
                className="border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded p-1.5 max-w-[120px] outline-none"
              >
                <option value="">Entra...</option>
                {suplentes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            )}
            
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => saveEvent(jugador.id, isLocal)} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors">Añadir</button>
              <button onClick={() => setActiveEventPrompt(null)} className="text-neutral-500 font-medium px-2 py-1.5 hover:text-neutral-900 dark:hover:text-white">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => openEventPrompt(jugador.id, isLocal)} className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 self-start mt-1 transition-colors">
            <Plus size={12} strokeWidth={3} /> Añadir suceso
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            Planilla de Partido
          </h2>
          <p className="text-neutral-500 mt-1">Alineaciones, estadísticas y sucesos en tiempo real.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-70"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Guardar Planilla</span>
        </button>
      </div>

      {/* INFO GENERAL */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Info className="text-red-500" size={20} />
          Datos Generales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"><Clock size={16} /> Horario</label>
            <input type="time" name="hora_partido" value={formData.hora_partido} onChange={handleInputChange} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"><MapPin size={16} /> Lugar</label>
            <input type="text" name="lugar" value={formData.lugar} onChange={handleInputChange} placeholder="Instalaciones..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"><Cloud size={16} /> Clima</label>
            <input type="text" name="clima" value={formData.clima} onChange={handleInputChange} placeholder="Soleado, Lluvia..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"><ShieldAlert size={16} /> Árbitros</label>
            <input type="text" name="arbitros" value={formData.arbitros} onChange={handleInputChange} placeholder="Nombre..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SÉNECA C.F. ALINEACIÓN */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="text-red-500" size={20} />
              SÉNECA C.F.
            </h3>
            <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-lg text-sm font-bold">
              {localPlayers.length} Jugadores
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {localPlayers.length === 0 ? (
              <div className="text-center p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500">
                No hay jugadores en la convocatoria.<br/>Añádelos primero en la pestaña "Convocatoria".
              </div>
            ) : (
              <>
                <div className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2">Titulares ({localPlayers.filter(p => p.titular).length})</div>
                {localPlayers.filter(p => p.titular).map(p => renderPlayerRow(p, true))}
                
                <div className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2 mt-6">Suplentes ({localPlayers.filter(p => !p.titular).length})</div>
                {localPlayers.filter(p => !p.titular).map(p => renderPlayerRow(p, true))}
              </>
            )}
          </div>
        </div>

        {/* EQUIPO RIVAL ALINEACIÓN */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="text-neutral-500" size={20} />
              Equipo Rival
            </h3>
            <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-lg text-sm font-bold">
              {rivalPlayers.length} Jugadores
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {/* Formulario Añadir Rival */}
            <div className="flex gap-2 items-center p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <input type="text" placeholder="Dorsal" value={newRival.dorsal} onChange={e => setNewRival({...newRival, dorsal: e.target.value})} className="w-16 px-2 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500 text-sm" />
              <input type="text" placeholder="Nombre jugador rival..." value={newRival.nombre} onChange={e => setNewRival({...newRival, nombre: e.target.value})} onKeyDown={e => e.key === 'Enter' && addRival()} className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-red-500 text-sm" />
              <select value={newRival.titular ? 'Titular' : 'Suplente'} onChange={e => setNewRival({...newRival, titular: e.target.value === 'Titular'})} className="px-2 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-sm">
                <option value="Titular">Titular</option>
                <option value="Suplente">Suplente</option>
              </select>
              <button onClick={addRival} className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 p-2 rounded-lg transition-colors">
                <Plus size={18} />
              </button>
            </div>

            {/* Listas Rival */}
            <div className="space-y-3">
              {rivalPlayers.length === 0 ? (
                <div className="text-center p-6 text-sm text-neutral-500">
                  Añade jugadores del equipo rival usando el formulario de arriba.
                </div>
              ) : (
                <>
                  <div className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2 mt-4">Titulares ({rivalPlayers.filter(p => p.titular).length})</div>
                  {rivalPlayers.filter(p => p.titular).map(p => renderPlayerRow(p, false))}
                  
                  <div className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2 mt-6">Suplentes ({rivalPlayers.filter(p => !p.titular).length})</div>
                  {rivalPlayers.filter(p => !p.titular).map(p => renderPlayerRow(p, false))}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER: EXTRA INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            MVP del Partido
          </h3>
          <input 
            type="text" 
            name="mvp"
            value={formData.mvp}
            onChange={handleInputChange}
            placeholder="Jugador más valioso..."
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
          />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            Observaciones Adicionales
          </h3>
          <textarea 
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            placeholder="Notas, incidencias..."
            rows={3}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
          />
        </div>
      </div>

    </div>
  );
}
