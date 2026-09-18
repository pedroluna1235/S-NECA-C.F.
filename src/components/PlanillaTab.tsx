import { useState, useEffect } from 'react';
import { Save, Loader2, Clock, MapPin, Users, Info, AlertTriangle, RefreshCw, Star, Cloud, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PlanillaTabProps {
  matchId: string;
}

interface PlanillaData {
  id?: string;
  partido_id: string;
  hora_partido: string;
  lugar: string;
  alineacion_local: string;
  alineacion_visitante: string;
  convocados: string;
  tarjetas: string;
  sustituciones: string;
  goles: string;
  observaciones: string;
  arbitros: string;
  clima: string;
  mvp: string;
}

export function PlanillaTab({ matchId }: PlanillaTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planillaId, setPlanillaId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<PlanillaData, 'id' | 'partido_id'>>({
    hora_partido: '',
    lugar: '',
    alineacion_local: '',
    alineacion_visitante: '',
    convocados: '',
    tarjetas: '',
    sustituciones: '',
    goles: '',
    observaciones: '',
    arbitros: '',
    clima: '',
    mvp: '',
  });

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Try to fetch existing planilla
      const { data, error } = await supabase
        .from('planilla_partido')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Ignoramos error si la tabla no existe para usar fallback, pero lo loggeamos
        console.warn('Error fetching planilla:', error);
      }

      if (data) {
        setPlanillaId(data.id);
        setFormData({
          hora_partido: data.hora_partido || '',
          lugar: data.lugar || '',
          alineacion_local: data.alineacion_local || '',
          alineacion_visitante: data.alineacion_visitante || '',
          convocados: data.convocados || '',
          tarjetas: data.tarjetas || '',
          sustituciones: data.sustituciones || '',
          goles: data.goles || '',
          observaciones: data.observaciones || '',
          arbitros: data.arbitros || '',
          clima: data.clima || '',
          mvp: data.mvp || '',
        });
      } else {
        // If not found, attempt to preload data from `partidos` and `convocatoria`
        const [matchRes, convRes] = await Promise.all([
          supabase.from('partidos').select('lugar').eq('id', matchId).single(),
          supabase.from('convocatoria').select('hora_partido').eq('partido_id', matchId).maybeSingle()
        ]);

        setFormData(prev => ({
          ...prev,
          lugar: matchRes.data?.lugar || '',
          hora_partido: convRes.data?.hora_partido || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching data for Planilla:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        partido_id: matchId,
        ...formData
      };

      if (planillaId) {
        const { error } = await supabase
          .from('planilla_partido')
          .update(payload)
          .eq('id', planillaId);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('planilla_partido')
          .insert([payload])
          .select()
          .single();
          
        if (error) throw error;
        if (data) setPlanillaId(data.id);
      }
      
      toast.success('Planilla guardada correctamente');
    } catch (error: any) {
      console.error('Error saving planilla:', error);
      toast.error('Error al guardar. Asegúrate de haber ejecutado setup_planilla.sql en Supabase.');
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            Planilla de Partido
          </h2>
          <p className="text-neutral-500 mt-1">Registra la información oficial del acta del partido.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Guardar Planilla</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          
          {/* INFO GENERAL */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <Info className="text-red-500" size={20} />
              Datos Generales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Clock size={16} className="text-neutral-400" />
                  Horario
                </label>
                <input 
                  type="time" 
                  name="hora_partido"
                  value={formData.hora_partido}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <MapPin size={16} className="text-neutral-400" />
                  Dónde es
                </label>
                <input 
                  type="text" 
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleInputChange}
                  placeholder="Instalaciones..."
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Cloud size={16} className="text-neutral-400" />
                  Clima
                </label>
                <input 
                  type="text" 
                  name="clima"
                  value={formData.clima}
                  onChange={handleInputChange}
                  placeholder="Soleado, Lluvia, etc..."
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-neutral-400" />
                  Árbitros
                </label>
                <input 
                  type="text" 
                  name="arbitros"
                  value={formData.arbitros}
                  onChange={handleInputChange}
                  placeholder="Nombre del colegiado..."
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* ALINEACIONES */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="text-red-500" size={20} />
              Alineaciones
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Alineación Local</label>
                <textarea 
                  name="alineacion_local"
                  value={formData.alineacion_local}
                  onChange={handleInputChange}
                  placeholder="1. Jugador A, 2. Jugador B..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Alineación Visitante</label>
                <textarea 
                  name="alineacion_visitante"
                  value={formData.alineacion_visitante}
                  onChange={handleInputChange}
                  placeholder="1. Jugador C, 2. Jugador D..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
                />
              </div>
            </div>
          </div>
          
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

        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          
          {/* CONVOCADOS */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="text-neutral-500" size={20} />
              Todos los Jugadores Convocados
            </h3>
            <textarea 
              name="convocados"
              value={formData.convocados}
              onChange={handleInputChange}
              placeholder="Lista de todos los convocados..."
              rows={4}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
            />
          </div>

          {/* SUCESOS */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Desarrollo del Partido</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <div className="w-3 h-4 bg-yellow-400 rounded-sm border border-yellow-500"></div>
                  Tarjetas
                </label>
                <textarea 
                  name="tarjetas"
                  value={formData.tarjetas}
                  onChange={handleInputChange}
                  placeholder="Minuto - Jugador (Color)..."
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <RefreshCw size={16} className="text-blue-500" />
                  Sustituciones
                </label>
                <textarea 
                  name="sustituciones"
                  value={formData.sustituciones}
                  onChange={handleInputChange}
                  placeholder="Minuto - Entra X por Y..."
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <span className="text-red-500 font-black text-lg leading-none">⚽</span>
                  Goles
                </label>
                <textarea 
                  name="goles"
                  value={formData.goles}
                  onChange={handleInputChange}
                  placeholder="Minuto - Jugador..."
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Observaciones
            </h3>
            <textarea 
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              placeholder="Notas adicionales, incidencias, comentarios sobre el juego..."
              rows={4}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
