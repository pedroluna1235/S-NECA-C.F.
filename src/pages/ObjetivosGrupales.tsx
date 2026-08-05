import { useEffect, useState } from 'react';
import { Plus, Target, RefreshCcw, Search, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface ObjetivoGrupal {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'Activo' | 'Completado' | 'Archivado';
  created_at: string;
}

interface Jugador {
  id: string;
  nombre: string;
  dorsal: number;
}

interface ObjetivoJugadorConDetalle {
  id: string;
  descripcion: string;
  tipo_mejora: string;
  jugadores: Jugador;
}

export function ObjetivosGrupales() {
  const { role } = useAuth();
  const [objetivos, setObjetivos] = useState<ObjetivoGrupal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [objetivoToEdit, setObjetivoToEdit] = useState<ObjetivoGrupal | null>(null);

  // Formulario del Modal
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    estado: 'Activo'
  });
  const [saving, setSaving] = useState(false);

  // Jugadores vinculados al objetivo seleccionado
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [linkedObjectives, setLinkedObjectives] = useState<ObjetivoJugadorConDetalle[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const fetchObjetivos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('objetivos_grupales')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setObjetivos(data || []);
    } catch (error) {
      console.error('Error fetching objetivos grupales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjetivos();
  }, []);

  const handleOpenModal = (objetivo?: ObjetivoGrupal) => {
    if (role === 'lector') return;
    if (objetivo) {
      setObjetivoToEdit(objetivo);
      setFormData({
        titulo: objetivo.titulo,
        descripcion: objetivo.descripcion || '',
        estado: objetivo.estado
      });
    } else {
      setObjetivoToEdit(null);
      setFormData({
        titulo: '',
        descripcion: '',
        estado: 'Activo'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }

    setSaving(true);
    try {
      if (objetivoToEdit) {
        const { error } = await supabase
          .from('objetivos_grupales')
          .update({
            titulo: formData.titulo.trim(),
            descripcion: formData.descripcion.trim() || null,
            estado: formData.estado
          })
          .eq('id', objetivoToEdit.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('objetivos_grupales')
          .insert([{
            titulo: formData.titulo.trim(),
            descripcion: formData.descripcion.trim() || null,
            estado: formData.estado
          }]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchObjetivos();
    } catch (error: any) {
      console.error('Error guardando objetivo grupal:', error);
      alert('Error al guardar: ' + (error.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (role === 'lector') return;
    if (!confirm('¿Seguro que quieres eliminar este objetivo grupal? Se desvinculará de los objetivos individuales.')) return;
    
    try {
      const { error } = await supabase
        .from('objetivos_grupales')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setObjetivos(objetivos.filter(o => o.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar el objetivo.');
    }
  };

  const fetchLinkedObjectives = async (grupalId: string) => {
    setLoadingLinks(true);
    try {
      // Necesitamos hacer join con la tabla jugadores para traer el nombre y dorsal
      const { data, error } = await supabase
        .from('objetivos_jugadores')
        .select(`
          id,
          descripcion,
          tipo_mejora,
          jugadores (id, nombre, dorsal)
        `)
        .eq('objetivo_grupal_id', grupalId);

      if (error) throw error;
      setLinkedObjectives(data as any || []);
    } catch (error) {
      console.error('Error fetching linked objectives:', error);
    } finally {
      setLoadingLinks(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchLinkedObjectives(id);
    }
  };

  const filtered = objetivos.filter(o => 
    o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.descripcion && o.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Objetivos Grupales</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestiona los objetivos de equipo y conéctalos con los jugadores
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar objetivo..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
            />
          </div>
          
          <button 
            onClick={fetchObjetivos}
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
            title="Recargar"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={() => handleOpenModal()}
            disabled={role === 'lector'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all shadow-md",
              role === 'lector' 
                ? "bg-red-600 opacity-50 cursor-not-allowed pointer-events-none" 
                : "bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-95"
            )}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Objetivo</span>
          </button>
        </div>
      </div>

      {/* Grid de Objetivos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={28} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No hay objetivos grupales</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
            Crea objetivos generales para el equipo y vincula los objetivos individuales de los jugadores.
          </p>
          <button 
            onClick={() => handleOpenModal()}
            disabled={role === 'lector'}
            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
          >
            Crear el primer objetivo grupal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map(objetivo => (
            <div key={objetivo.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
              <div className="p-6 flex flex-col flex-1 cursor-pointer" onClick={() => toggleExpand(objetivo.id)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl",
                      objetivo.estado === 'Activo' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      objetivo.estado === 'Completado' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    )}>
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                        {objetivo.titulo}
                      </h3>
                      <span className={cn(
                        "text-xs font-bold uppercase",
                        objetivo.estado === 'Activo' ? "text-emerald-600 dark:text-emerald-400" :
                        objetivo.estado === 'Completado' ? "text-blue-600 dark:text-blue-400" :
                        "text-neutral-500 dark:text-neutral-400"
                      )}>
                        {objetivo.estado}
                      </span>
                    </div>
                  </div>
                  
                  {role !== 'lector' && (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenModal(objetivo)}
                        className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(objetivo.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-neutral-600 dark:text-neutral-300 text-sm flex-1 whitespace-pre-wrap">
                  {objetivo.descripcion || 'Sin descripción'}
                </p>
                
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                  {expandedId === objetivo.id ? 'Ocultar jugadores vinculados' : 'Ver jugadores vinculados'}
                </div>
              </div>
              
              {/* Sección expandida de jugadores vinculados */}
              {expandedId === objetivo.id && (
                <div className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 p-6 animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
                    Objetivos individuales vinculados
                    {!loadingLinks && <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full text-xs">{linkedObjectives.length}</span>}
                  </h4>
                  
                  {loadingLinks ? (
                    <div className="flex justify-center p-4">
                      <RefreshCcw size={20} className="animate-spin text-neutral-400" />
                    </div>
                  ) : linkedObjectives.length === 0 ? (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                      No hay ningún jugador vinculado a este objetivo todavía.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {linkedObjectives.map(link => (
                        <div key={link.id} className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 text-xs shrink-0">
                            {link.jugadores?.dorsal || '-'}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-neutral-900 dark:text-white">
                              {link.jugadores?.nombre || 'Jugador desconocido'}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                              <span className="font-medium text-neutral-700 dark:text-neutral-300 mr-1">
                                [{link.tipo_mejora}]
                              </span>
                              {link.descripcion}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {objetivoToEdit ? 'Editar Objetivo Grupal' : 'Nuevo Objetivo Grupal'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  Título del Objetivo <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ej: Mejorar la salida de balón..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  Descripción
                </label>
                <textarea 
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Detalles sobre el objetivo..."
                  className="w-full h-24 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  Estado
                </label>
                <select 
                  value={formData.estado}
                  onChange={e => setFormData({...formData, estado: e.target.value})}
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Activo">Activo</option>
                  <option value="Completado">Completado</option>
                  <option value="Archivado">Archivado</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-950">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70"
              >
                {saving && <RefreshCcw size={18} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
