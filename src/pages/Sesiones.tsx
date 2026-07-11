import { useState, useEffect } from 'react';
import { Calendar, List, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CalendarioSesiones } from '../components/sesiones/CalendarioSesiones';
import { HistorialSesiones } from '../components/sesiones/HistorialSesiones';

export type Sesion = {
  id: string;
  numero_sesion: number;
  fecha: string;
  titulo: string;
  pdf_url: string;
  created_at: string;
};

export function Sesiones() {
  const [activeTab, setActiveTab] = useState<'calendario' | 'historial'>('calendario');
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSesiones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sesiones')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setSesiones(data || []);
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
            onSesionAdded={fetchSesiones} 
          />
        ) : (
          <HistorialSesiones 
            sesiones={sesiones} 
            onSesionDeleted={fetchSesiones} 
          />
        )}
      </div>
    </div>
  );
}
