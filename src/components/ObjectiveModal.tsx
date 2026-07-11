import { useState, useEffect } from 'react';
import { X, Target, Save, Loader2, Plus, Calendar, Activity, CheckCircle2, ChevronLeft, Trash2, FileText, Image as ImageIcon, Video, ExternalLink, Pencil, MessageSquare, ChevronDown, ChevronUp, XCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { type Player } from './PlayerCard';
import { ImageUploader } from './ImageUploader';
import { FileUploader } from './FileUploader';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: () => void;
}

interface Seguimiento {
  id: string;
  objetivo_id: string;
  fecha: string;
  descripcion: string;
  cumplido: boolean;
  imagen_url: string | null;
  created_at: string;
}

interface Objetivo {
  id: string;
  fecha_inicio: string;
  tipo_mejora: 'Mejorar' | 'Potenciar';
  categoria: 'Deportivo' | 'No deportivo';
  descripcion: string;
  estado: 'Activo' | 'Logrado' | 'Cancelado';
  imagen_url: string | null;
  pdf_url: string | null;
  video_url: string | null;
  created_at: string;
}

export function ObjectiveModal({ isOpen, onClose, player, onSuccess }: ObjectiveModalProps) {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Objective Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [tipoMejora, setTipoMejora] = useState<'Mejorar' | 'Potenciar'>('Mejorar');
  const [categoria, setCategoria] = useState<'Deportivo' | 'No deportivo'>('Deportivo');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Seguimiento State
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<string | null>(null);
  const [segFecha, setSegFecha] = useState(new Date().toISOString().split('T')[0]);
  const [segDescripcion, setSegDescripcion] = useState('');
  const [segCumplido, setSegCumplido] = useState(true);
  const [segImagenUrl, setSegImagenUrl] = useState<string | null>(null);
  const [isSubmittingSeg, setIsSubmittingSeg] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      fetchData();
      resetForm();
      setView('list');
    }
  }, [isOpen, player]);

  const fetchData = async () => {
    if (!player) return;
    setIsLoading(true);
    try {
      const { data: objData, error: objError } = await supabase
        .from('objetivos_jugadores')
        .select('*')
        .eq('jugador_id', player.id)
        .order('created_at', { ascending: false });

      if (objError) throw objError;
      const objs = objData || [];
      setObjetivos(objs);

      if (objs.length > 0) {
        const { data: segData, error: segError } = await supabase
          .from('seguimiento_objetivos')
          .select('*')
          .in('objetivo_id', objs.map(o => o.id))
          .order('fecha', { ascending: true });

        if (segError) throw segError;
        setSeguimientos(segData || []);
      } else {
        setSeguimientos([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setTipoMejora('Mejorar');
    setCategoria('Deportivo');
    setDescripcion('');
    setImagenUrl(null);
    setPdfUrl(null);
    setVideoUrl('');
  };

  const resetSegForm = () => {
    setSegFecha(new Date().toISOString().split('T')[0]);
    setSegDescripcion('');
    setSegCumplido(true);
    setSegImagenUrl(null);
  };

  const handleEdit = (obj: Objetivo) => {
    setEditingId(obj.id);
    setFechaInicio(obj.fecha_inicio);
    setTipoMejora(obj.tipo_mejora);
    setCategoria(obj.categoria);
    setDescripcion(obj.descripcion);
    setImagenUrl(obj.imagen_url);
    setPdfUrl(obj.pdf_url);
    setVideoUrl(obj.video_url || '');
    setView('create');
  };

  const handleSave = async () => {
    if (!descripcion.trim() || !player) {
      alert('La descripción es obligatoria');
      return;
    }

    setIsSubmitting(true);
    try {
      const objectiveData = {
        jugador_id: player.id,
        fecha_inicio: fechaInicio,
        tipo_mejora: tipoMejora,
        categoria: categoria,
        descripcion: descripcion.trim(),
        estado: 'Activo',
        imagen_url: imagenUrl,
        pdf_url: pdfUrl,
        video_url: videoUrl.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('objetivos_jugadores')
          .update(objectiveData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('objetivos_jugadores')
          .insert([objectiveData]);
        if (error) throw error;
      }

      await fetchData();
      setView('list');
      resetForm();
    } catch (error: any) {
      console.error('Error saving objective:', error);
      alert('Error al guardar el objetivo: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este objetivo y todo su historial?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('objetivos_jugadores')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setObjetivos(objetivos.filter(obj => obj.id !== id));
      setSeguimientos(seguimientos.filter(seg => seg.objetivo_id !== id));
    } catch (error) {
      console.error('Error deleting objective:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ----- SEGUIMIENTO LOGIC -----
  const handleSaveSeguimiento = async (objetivoId: string) => {
    if (!segDescripcion.trim()) {
      alert('La descripción del seguimiento es obligatoria');
      return;
    }

    setIsSubmittingSeg(true);
    try {
      const { error } = await supabase
        .from('seguimiento_objetivos')
        .insert([{
          objetivo_id: objetivoId,
          fecha: segFecha,
          descripcion: segDescripcion.trim(),
          cumplido: segCumplido,
          imagen_url: segImagenUrl
        }]);

      if (error) throw error;
      
      resetSegForm();
      await fetchData(); // Refetch to get the new timeline item
    } catch (error: any) {
      console.error('Error saving seguimiento:', error);
      alert('Error al guardar el seguimiento: ' + (error.message || String(error)));
    } finally {
      setIsSubmittingSeg(false);
    }
  };

  const handleDeleteSeguimiento = async (id: string) => {
    if (!confirm('¿Borrar esta anotación del historial?')) return;
    try {
      const { error } = await supabase.from('seguimiento_objetivos').delete().eq('id', id);
      if (error) throw error;
      setSeguimientos(seguimientos.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting seguimiento', error);
    }
  };


  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto py-8">
      <div className="m-auto bg-neutral-50 dark:bg-neutral-950 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
          <div className="flex items-center gap-4">
            {view === 'create' ? (
              <button 
                onClick={() => setView('list')}
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Target size={26} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {view === 'create' ? (editingId ? 'Editar Objetivo' : 'Nuevo Objetivo') : 'Objetivos Individuales'}
              </h2>
              <p className="text-sm font-medium text-neutral-500">{player.nombre}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* VIEW: LIST */}
          {view === 'list' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : objetivos.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
                  <Target size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-6 font-medium">Este jugador aún no tiene objetivos asignados.</p>
                  <button
                    onClick={() => { resetForm(); setView('create'); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                  >
                    <Plus size={20} /> Crear primer objetivo
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-neutral-700 dark:text-neutral-300">Historial de Objetivos ({objetivos.length})</h3>
                    <button
                      onClick={() => { resetForm(); setView('create'); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl font-bold transition-colors text-sm"
                    >
                      <Plus size={16} /> Añadir nuevo
                    </button>
                  </div>
                  <div className="space-y-4">
                    {objetivos.map(obj => {
                      const objSeguimientos = seguimientos.filter(s => s.objetivo_id === obj.id);
                      const isExpanded = expandedObjectiveId === obj.id;

                      return (
                        <div key={obj.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col relative group transition-all">
                          
                          {/* Botones de acción (ocultos hasta hover) */}
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-lg">
                            <button 
                              onClick={() => handleEdit(obj)}
                              className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                              title="Editar objetivo"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(obj.id)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Eliminar objetivo"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-2 pr-20">
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-bold uppercase",
                                obj.tipo_mejora === 'Mejorar' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              )}>
                                {obj.tipo_mejora}
                              </span>
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {obj.categoria}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 ml-auto">
                                <Calendar size={14} /> {obj.fecha_inicio}
                              </span>
                            </div>
                            
                            <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{obj.descripcion}</p>
                            
                            {/* Adjuntos del Objetivo */}
                            {(obj.imagen_url || obj.pdf_url || obj.video_url) && (
                              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-3">
                                {obj.imagen_url && (
                                  <a href={obj.imagen_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:underline">
                                    <ImageIcon size={16} /> Ver Imagen
                                  </a>
                                )}
                                {obj.pdf_url && (
                                  <a href={obj.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:underline">
                                    <FileText size={16} /> Ver Informe PDF
                                  </a>
                                )}
                                {obj.video_url && (
                                  <div className="w-full mt-3 rounded-2xl overflow-hidden bg-black shadow-inner relative" style={{ aspectRatio: '16/9' }}>
                                    <iframe 
                                      src={`https://www.youtube.com/embed/${(obj.video_url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/) || [])[2]}`} 
                                      className="absolute top-0 left-0 w-full h-full"
                                      allowFullScreen
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botón de Historial */}
                            <button 
                              onClick={() => {
                                setExpandedObjectiveId(isExpanded ? null : obj.id);
                                if (!isExpanded) resetSegForm();
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/50 rounded-xl mt-4 transition-colors group/btn"
                            >
                              <div className="flex items-center gap-2 font-bold text-neutral-700 dark:text-neutral-300">
                                <MessageSquare size={18} className="text-blue-500" /> 
                                Historial de Seguimiento 
                                {objSeguimientos.length > 0 && (
                                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs ml-2">
                                    {objSeguimientos.length}
                                  </span>
                                )}
                              </div>
                              <div className="text-neutral-400 group-hover/btn:text-neutral-600 dark:group-hover/btn:text-neutral-300 transition-colors">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </div>
                            </button>

                            {/* Contenido del Historial */}
                            {isExpanded && (
                              <div className="mt-4 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                
                                {/* Lista (Timeline) */}
                                {objSeguimientos.length > 0 && (
                                  <div className="relative border-l-2 border-neutral-200 dark:border-neutral-700 ml-4 space-y-6">
                                    {objSeguimientos.map(seg => (
                                      <div key={seg.id} className="relative pl-6 group/seg">
                                        <div className={cn(
                                          "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-neutral-900 shadow-sm", 
                                          seg.cumplido ? "bg-emerald-500" : "bg-red-500"
                                        )} />
                                        
                                        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700/50 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors relative">
                                          <button 
                                            onClick={() => handleDeleteSeguimiento(seg.id)}
                                            className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover/seg:opacity-100 transition-all"
                                            title="Eliminar anotación"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                          
                                          <div className="flex justify-between items-center mb-3 pr-8">
                                            <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5"><Calendar size={12}/> {seg.fecha}</span>
                                            {seg.cumplido ? (
                                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1"><CheckCircle2 size={12}/> Cumplido</span>
                                            ) : (
                                              <span className="text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md flex items-center gap-1"><XCircle size={12}/> No Cumplido</span>
                                            )}
                                          </div>
                                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{seg.descripcion}</p>
                                          
                                          {seg.imagen_url && (
                                            <div className="mt-4">
                                              <a href={seg.imagen_url} target="_blank" rel="noopener noreferrer">
                                                <img src={seg.imagen_url} alt="Evidencia" className="h-28 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm hover:opacity-80 transition-opacity" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Formulario Nueva Anotación */}
                                <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                  <h4 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-blue-500" /> Añadir anotación al historial
                                  </h4>
                                  
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500">FECHA</label>
                                        <input
                                          type="date"
                                          value={segFecha}
                                          onChange={e => setSegFecha(e.target.value)}
                                          className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500">¿TAREA CUMPLIDA?</label>
                                        <div className="flex bg-neutral-50 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                          <button
                                            onClick={() => setSegCumplido(true)}
                                            className={cn("flex-1 py-1.5 rounded-lg text-sm font-bold transition-all", segCumplido ? "bg-emerald-500 text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800")}
                                          >
                                            Sí
                                          </button>
                                          <button
                                            onClick={() => setSegCumplido(false)}
                                            className={cn("flex-1 py-1.5 rounded-lg text-sm font-bold transition-all", !segCumplido ? "bg-red-500 text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800")}
                                          >
                                            No
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-neutral-500">DESCRIPCIÓN DE LA TAREA / SESIÓN</label>
                                      <textarea
                                        placeholder="Ej: Hoy hemos practicado el pase con la pierna izquierda..."
                                        value={segDescripcion}
                                        onChange={e => setSegDescripcion(e.target.value)}
                                        className="w-full h-24 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium resize-none"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-neutral-500">FOTO DE EVIDENCIA (OPCIONAL)</label>
                                      <div className="h-28">
                                        <ImageUploader 
                                          url={segImagenUrl}
                                          onUpload={setSegImagenUrl}
                                          onRemove={() => setSegImagenUrl(null)}
                                          bucket="archivos"
                                          label="Subir foto del entreno"
                                          className="h-full border-neutral-200 dark:border-neutral-700"
                                        />
                                      </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                      <button
                                        onClick={() => handleSaveSeguimiento(obj.id)}
                                        disabled={isSubmittingSeg || !segDescripcion.trim()}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                                      >
                                        {isSubmittingSeg ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                                        Guardar Anotación
                                      </button>
                                    </div>

                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW: CREATE */}
          {view === 'create' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Categoría</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value as any)}
                    className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-white appearance-none"
                  >
                    <option value="Deportivo">Deportivo (Técnico/Táctico/Físico)</option>
                    <option value="No deportivo">No deportivo (Psicológico/Nutricional/Entorno)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tipo de Objetivo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipoMejora('Mejorar')}
                    className={cn(
                      "p-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2",
                      tipoMejora === 'Mejorar' ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "border-transparent bg-neutral-100 dark:bg-neutral-900 text-neutral-500"
                    )}
                  >
                    <Activity size={18} /> Mejorar (Corregir)
                  </button>
                  <button
                    onClick={() => setTipoMejora('Potenciar')}
                    className={cn(
                      "p-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2",
                      tipoMejora === 'Potenciar' ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "border-transparent bg-neutral-100 dark:bg-neutral-900 text-neutral-500"
                    )}
                  >
                    <CheckCircle2 size={18} /> Potenciar (Fortalecer)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex justify-between">
                  <span>Descripción detallada</span>
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe exactamente qué debe conseguir el jugador..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full h-32 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-white resize-none"
                />
              </div>

              {/* Archivos adjuntos */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Archivos adjuntos (Opcional)</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Enlace a YouTube / Vídeo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Video className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      className="w-full pl-10 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Imagen (Mapa de calor, esquema...)</label>
                    <ImageUploader 
                      url={imagenUrl}
                      onUpload={setImagenUrl}
                      onRemove={() => setImagenUrl(null)}
                      bucket="archivos"
                      label="Adjuntar Imagen"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">PDF (Informe, dieta...)</label>
                    <FileUploader 
                      url={pdfUrl}
                      onUpload={setPdfUrl}
                      onRemove={() => setPdfUrl(null)}
                      bucket="archivos"
                      accept=".pdf"
                      label="Adjuntar PDF"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
        
        {/* Footer actions for CREATE view */}
        {view === 'create' && (
          <div className="p-6 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 shrink-0">
            <button
              onClick={() => setView('list')}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md",
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              )}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Guardar Objetivo
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
