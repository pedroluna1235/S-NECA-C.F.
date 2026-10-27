import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, List, BookOpen, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Match } from '../components/MatchCard';
import { CalendarioSesiones } from '../components/sesiones/CalendarioSesiones';
import { HistorialSesiones } from '../components/sesiones/HistorialSesiones';
import { HistorialAsistencia } from '../components/sesiones/HistorialAsistencia';
import { DisenadorSesion } from '../components/sesiones/DisenadorSesion';

export type Sesion = {
  id: string;
  numero_sesion: number;
  fecha: string;
  titulo: string;
  pdf_url: string;
  observaciones?: string;
  asistentes?: string[];
  created_at: string;
  datos_diseno?: import('../types/sesion').DatosDisenoSesion;
};

export function Sesiones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') as 'calendario' | 'historial' | 'asistencia' | 'disenar' | null;
  const activeTab = currentTab && ['calendario', 'historial', 'asistencia', 'disenar'].includes(currentTab)
    ? currentTab
    : 'calendario';

  const setActiveTab = (tab: 'calendario' | 'historial' | 'asistencia' | 'disenar') => {
    setSearchParams({ tab });
  };

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [partidos, setPartidos] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sesionToEdit, setSesionToEdit] = useState<Sesion | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const checkDraft = () => {
      try {
        const raw = localStorage.getItem('seneca_sesion_diseno_draft');
        if (raw) {
          const parsed = JSON.parse(raw);
          const d = parsed?.datos;
          if (d && (d.cabecera?.objetivo || d.cabecera?.principios || d.tareas?.length > 0 || d.kpis)) {
            setHasDraft(true);
            return;
          }
        }
        setHasDraft(false);
      } catch {
        setHasDraft(false);
      }
    };
    checkDraft();
    window.addEventListener('storage', checkDraft);
    return () => window.removeEventListener('storage', checkDraft);
  }, [activeTab]);

  const handleEditDesign = (sesion: Sesion) => {
    setSesionToEdit(sesion);
    setActiveTab('disenar');
  };

  const fetchSesiones = async () => {
    try {
      setLoading(true);
      const [sesionesResponse, partidosResponse] = await Promise.all([
        supabase.from('sesiones').select('*').order('fecha', { ascending: false }),
        supabase.from('partidos').select('*, rival:equipos(*)').order('fecha', { ascending: false })
      ]);

      if (sesionesResponse.error) throw sesionesResponse.error;
      if (partidosResponse.error) throw partidosResponse.error;
      
      setSesiones(sesionesResponse.data || []);
      setPartidos((partidosResponse.data as Match[]) || []);
    } catch (error) {
      console.error('Error fetching sesiones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSesiones();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-red-600 dark:text-red-500" />
            Sesiones Tácticas
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gestiona y visualiza las sesiones de entrenamiento
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-900 p-1 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 inline-flex">
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'calendario'
              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <Calendar size={20} />
          Calendario de Sesiones
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'historial'
              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <List size={20} />
          Historial de Sesiones
        </button>
        <button
          onClick={() => setActiveTab('asistencia')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'asistencia'
              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <Users size={20} />
          Historial de Asistencia
        </button>
        <button
          onClick={() => setActiveTab('disenar')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 relative ${
            activeTab === 'disenar'
              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <BookOpen size={20} />
          <span>Diseñar Sesión</span>
          {hasDraft && activeTab !== 'disenar' && (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full animate-pulse border border-amber-300 dark:border-amber-700">
              Borrador
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : activeTab === 'calendario' ? (
          <CalendarioSesiones 
            sesiones={sesiones} 
            partidos={partidos}
            onSesionAdded={fetchSesiones} 
          />
        ) : activeTab === 'historial' ? (
          <HistorialSesiones 
            sesiones={sesiones} 
            onSesionDeleted={fetchSesiones} 
            onEditDesign={handleEditDesign}
          />
        ) : activeTab === 'disenar' ? (
          <DisenadorSesion 
            initialDatos={sesionToEdit?.datos_diseno}
            sesionIdToEdit={sesionToEdit?.id}
            onSesionGuardada={() => {
              fetchSesiones();
              setActiveTab('calendario');
              setSesionToEdit(null);
            }}
          />
        ) : (
          <HistorialAsistencia 
            sesiones={sesiones} 
          />
        )}
      </div>
    </div>
  );
}
