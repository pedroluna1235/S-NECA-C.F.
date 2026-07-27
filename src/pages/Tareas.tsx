import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { DiseñadorTarea } from '../components/tareas/DiseñadorTarea';

export type Tarea = {
  id: string;
  titulo: string;
  descripcion?: string;
  configuracion_pizarra: any;
  created_at: string;
};

export function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesigning, setIsDesigning] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('Todas');

  const TIPOS_TAREA = [
    'Todas',
    'Activación',
    'Rondo',
    'Posesión',
    'Juego lúdico',
    'Juego de posición',
    'Físico',
    'Minipartidos',
    'ABP',
    'Finalizaciones',
    'Partidos Modificados'
  ];

  const tareasFiltradas = tareas.filter(tarea => {
    if (filtroTipo === 'Todas') return true;
    const tipo = tarea.configuracion_pizarra?.tipo || 'Activación'; // default to Activación if not present
    return tipo === filtroTipo;
  });

  const fetchTareas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('created_at', { ascending: false });

      // Si la tabla no existe aún, data será null o error
      if (error && error.code !== '42P01') throw error; // 42P01 es undefined table
      setTareas(data || []);
    } catch (error) {
      console.error('Error fetching tareas:', error);
      // No mostrar toast de error inicial si la tabla no existe, para evitar molestias.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTareas();
  }, []);

  const handleCreateNew = () => {
    setEditingTarea(null);
    setIsDesigning(true);
  };

  const handleEdit = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setIsDesigning(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
      const { error } = await supabase.from('tareas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tarea eliminada');
      fetchTareas();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  if (isDesigning) {
    return (
      <DiseñadorTarea 
        initialData={editingTarea}
        onClose={() => {
          setIsDesigning(false);
          fetchTareas();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-red-600 dark:text-red-500" />
            Tareas
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gestiona y diseña tus tareas y ejercicios de entrenamiento
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-500/20"
        >
          <Plus size={20} />
          Nueva Tarea
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 min-h-[500px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : tareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-8">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No hay tareas creadas</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">Empieza a diseñar tus propios ejercicios y tácticas.</p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 px-5 py-2.5 rounded-xl font-bold transition-all"
            >
              <Plus size={20} />
              Crear primera tarea
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 pb-2">
              {TIPOS_TAREA.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    filtroTipo === tipo
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {tareasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                <p>No hay tareas de este tipo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tareasFiltradas.map((tarea) => (
                  <div 
                    key={tarea.id}
                    onClick={() => handleEdit(tarea)}
                    className="group relative bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 dark:hover:border-red-500/50 cursor-pointer transition-all hover:shadow-md"
                  >
                    <button
                      onClick={(e) => handleDelete(tarea.id, e)}
                      className="absolute top-3 right-3 p-2 bg-white dark:bg-neutral-900 rounded-lg text-neutral-400 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="w-full aspect-video bg-emerald-700/20 rounded-lg mb-4 flex items-center justify-center border border-emerald-700/30 overflow-hidden relative">
                       {tarea.configuracion_pizarra?.thumbnail ? (
                         <img src={tarea.configuracion_pizarra.thumbnail} alt={tarea.titulo} className="w-full h-full object-cover" />
                       ) : (
                         <ImageIcon className="w-10 h-10 text-emerald-600/50" />
                       )}
                    </div>
                    <h3 className="font-bold text-neutral-900 dark:text-white text-lg truncate" title={tarea.titulo}>
                      {tarea.titulo}
                    </h3>
                    {tarea.descripcion && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                        {tarea.descripcion}
                      </p>
                    )}
                    <div className="mt-4 text-xs text-neutral-400 font-medium flex justify-between items-center">
                      <span>{new Date(tarea.created_at).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-md text-[10px] uppercase font-bold">{tarea.configuracion_pizarra?.tipo || 'Activación'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
