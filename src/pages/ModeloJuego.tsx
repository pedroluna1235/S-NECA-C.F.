import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Save, X, Loader2, BookOpen, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Aspecto {
  id: string;
  texto: string;
}

interface Contenido {
  id: string;
  titulo: string;
  tipo: string;
  aspectos: Aspecto[];
}

const POSICIONES_DEFAULT = [
  'Portero',
  'Defensa Central',
  'Lateral',
  'Pivote / Medio Centro',
  'Interior',
  'Extremo',
  'Delantero Centro'
];

export function ModeloJuego() {
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contenido' | 'posicion'>('contenido');

  // Edit/Create state for Contenido/Posicion
  const [editingContenidoId, setEditingContenidoId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');

  // Edit/Create state for Aspecto
  const [addingAspectoTo, setAddingAspectoTo] = useState<string | null>(null);
  const [newAspectoText, setNewAspectoText] = useState('');
  
  const [editingAspectoId, setEditingAspectoId] = useState<string | null>(null);
  const [editAspectoText, setEditAspectoText] = useState('');

  const fetchContenidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('modelo_juego')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error && error.code !== '42P01') throw error; // Ignore undefined table
      
      // Mapear datos viejos que no tienen tipo a 'contenido' por defecto
      const parsedData = (data || []).map((item: any) => ({
        ...item,
        tipo: item.tipo || 'contenido'
      }));
      setContenidos(parsedData);
      
    } catch (error) {
      console.error('Error fetching modelo juego:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContenidos();
  }, []);

  // Set first item expanded when changing tabs
  useEffect(() => {
    const items = contenidos.filter(c => c.tipo === activeTab);
    if (items.length > 0 && !items.some(i => i.id === expandedId)) {
      setExpandedId(items[0].id);
    }
  }, [activeTab, contenidos]);

  const handleAddContenido = async () => {
    if (!editTitulo.trim()) return;
    try {
      const nuevo = { titulo: editTitulo, tipo: activeTab, aspectos: [] };
      const { data, error } = await supabase
        .from('modelo_juego')
        .insert([nuevo])
        .select()
        .single();
        
      if (error) throw error;
      setContenidos([...contenidos, data]);
      setEditTitulo('');
      setExpandedId(data.id);
      toast.success(activeTab === 'contenido' ? 'Contenido creado' : 'Posición creada');
    } catch (error) {
      console.error('Error creando:', error);
      toast.error('Error al guardar. Comprueba que actualizaste la base de datos.');
    }
  };

  const handlePreloadPosiciones = async () => {
    try {
      setLoading(true);
      const nuevasPosiciones = POSICIONES_DEFAULT.map(pos => ({
        titulo: pos,
        tipo: 'posicion',
        aspectos: []
      }));
      
      const { data, error } = await supabase
        .from('modelo_juego')
        .insert(nuevasPosiciones)
        .select();
        
      if (error) throw error;
      setContenidos([...contenidos, ...(data || [])]);
      toast.success('Posiciones cargadas');
    } catch (error) {
      toast.error('Error cargando posiciones por defecto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContenido = async (id: string, newTitulo: string) => {
    try {
      const { error } = await supabase
        .from('modelo_juego')
        .update({ titulo: newTitulo })
        .eq('id', id);
        
      if (error) throw error;
      setContenidos(contenidos.map(c => c.id === id ? { ...c, titulo: newTitulo } : c));
      setEditingContenidoId(null);
      toast.success('Título actualizado');
    } catch (error) {
      console.error('Error actualizando:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteContenido = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este elemento completo?')) return;
    try {
      const { error } = await supabase.from('modelo_juego').delete().eq('id', id);
      if (error) throw error;
      setContenidos(contenidos.filter(c => c.id !== id));
      toast.success('Eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleAddAspecto = async (contenidoId: string) => {
    if (!newAspectoText.trim()) return;
    const contenido = contenidos.find(c => c.id === contenidoId);
    if (!contenido) return;

    const newAspecto = { id: crypto.randomUUID(), texto: newAspectoText };
    const newAspectos = [...(contenido.aspectos || []), newAspecto];

    try {
      const { error } = await supabase
        .from('modelo_juego')
        .update({ aspectos: newAspectos })
        .eq('id', contenidoId);
        
      if (error) throw error;
      setContenidos(contenidos.map(c => c.id === contenidoId ? { ...c, aspectos: newAspectos } : c));
      setAddingAspectoTo(null);
      setNewAspectoText('');
      toast.success('Aspecto añadido');
    } catch (error) {
      toast.error('Error al añadir aspecto');
    }
  };

  const handleUpdateAspecto = async (contenidoId: string, aspectoId: string, newText: string) => {
    const contenido = contenidos.find(c => c.id === contenidoId);
    if (!contenido) return;

    const newAspectos = contenido.aspectos.map(a => a.id === aspectoId ? { ...a, texto: newText } : a);

    try {
      const { error } = await supabase
        .from('modelo_juego')
        .update({ aspectos: newAspectos })
        .eq('id', contenidoId);
        
      if (error) throw error;
      setContenidos(contenidos.map(c => c.id === contenidoId ? { ...c, aspectos: newAspectos } : c));
      setEditingAspectoId(null);
    } catch (error) {
      toast.error('Error al actualizar aspecto');
    }
  };

  const handleDeleteAspecto = async (contenidoId: string, aspectoId: string) => {
    const contenido = contenidos.find(c => c.id === contenidoId);
    if (!contenido) return;

    const newAspectos = contenido.aspectos.filter(a => a.id !== aspectoId);

    try {
      const { error } = await supabase
        .from('modelo_juego')
        .update({ aspectos: newAspectos })
        .eq('id', contenidoId);
        
      if (error) throw error;
      setContenidos(contenidos.map(c => c.id === contenidoId ? { ...c, aspectos: newAspectos } : c));
    } catch (error) {
      toast.error('Error al eliminar aspecto');
    }
  };

  const filteredItems = contenidos.filter(c => c.tipo === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-red-600 dark:text-red-500" />
            Modelo de Juego
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Define los contenidos tácticos y los aspectos a incidir en cada posición
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 min-h-[500px] flex flex-col">
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <button
            onClick={() => setActiveTab('contenido')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${
              activeTab === 'contenido'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            <BookOpen size={18} />
            Contenidos Tácticos
          </button>
          <button
            onClick={() => setActiveTab('posicion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${
              activeTab === 'posicion'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            <Users size={18} />
            Por Posiciones
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-4">
            
            {activeTab === 'posicion' && filteredItems.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-2">Aún no hay posiciones</h3>
                <p className="text-blue-600 dark:text-blue-400 mb-4 text-sm">Puedes crear las tuyas propias o cargar una lista estándar (Portero, Central, etc.)</p>
                <button
                  onClick={handlePreloadPosiciones}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
                >
                  Cargar posiciones estándar
                </button>
              </div>
            )}

            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-all"
              >
                {/* Header (Accordion Toggle) */}
                <div 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex-1">
                    {editingContenidoId === item.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitulo}
                          onChange={(e) => setEditTitulo(e.target.value)}
                          className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateContenido(item.id, editTitulo);
                            if (e.key === 'Escape') setEditingContenidoId(null);
                          }}
                        />
                        <button onClick={() => handleUpdateContenido(item.id, editTitulo)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingContenidoId(null)} className="p-1.5 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        {item.titulo}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingContenidoId !== item.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTitulo(item.titulo);
                            setEditingContenidoId(item.id);
                          }}
                          className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteContenido(item.id, e)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <div className="p-1">
                      {expandedId === item.id ? <ChevronUp size={20} className="text-neutral-500" /> : <ChevronDown size={20} className="text-neutral-500" />}
                    </div>
                  </div>
                </div>

                {/* Aspectos Body */}
                {expandedId === item.id && (
                  <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                    <h4 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                      Aspectos a incidir
                    </h4>
                    
                    <div className="space-y-3">
                      {item.aspectos && item.aspectos.map((aspecto, index) => (
                        <div key={aspecto.id} className="flex items-start gap-3 group">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </span>
                          
                          <div className="flex-1">
                            {editingAspectoId === aspecto.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editAspectoText}
                                  onChange={(e) => setEditAspectoText(e.target.value)}
                                  className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateAspecto(item.id, aspecto.id, editAspectoText);
                                    if (e.key === 'Escape') setEditingAspectoId(null);
                                  }}
                                />
                                <button onClick={() => handleUpdateAspecto(item.id, aspecto.id, editAspectoText)} className="p-1.5 text-green-600">
                                  <Save size={16} />
                                </button>
                                <button onClick={() => setEditingAspectoId(null)} className="p-1.5 text-neutral-400">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg p-3">
                                {aspecto.texto}
                              </div>
                            )}
                          </div>
                          
                          {editingAspectoId !== aspecto.id && (
                            <div className="flex flex-col sm:flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditAspectoText(aspecto.texto);
                                  setEditingAspectoId(aspecto.id);
                                }}
                                className="p-1.5 text-neutral-400 hover:text-blue-600 rounded-md"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAspecto(item.id, aspecto.id)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {addingAspectoTo === item.id ? (
                        <div className="flex items-center gap-3 mt-4">
                           <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center text-xs font-bold">
                            +
                          </span>
                          <input
                            type="text"
                            value={newAspectoText}
                            onChange={(e) => setNewAspectoText(e.target.value)}
                            placeholder="Escribe el nuevo aspecto..."
                            className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddAspecto(item.id);
                              if (e.key === 'Escape') setAddingAspectoTo(null);
                            }}
                          />
                          <button onClick={() => handleAddAspecto(item.id)} className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setAddingAspectoTo(null)} className="p-2 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingAspectoTo(item.id);
                            setNewAspectoText('');
                          }}
                          className="mt-4 text-sm font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Plus size={16} />
                          Añadir aspecto
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Añadir nuevo elemento (Contenido o Posición) */}
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-5 mt-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  placeholder={activeTab === 'contenido' ? "Nuevo contenido (ej: Salida de balón...)" : "Nueva posición (ej: Carrilero...)"}
                  className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddContenido();
                  }}
                />
                <button
                  onClick={handleAddContenido}
                  disabled={!editTitulo.trim()}
                  className="flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-all"
                >
                  <Plus size={18} />
                  <span>Añadir {activeTab === 'contenido' ? 'Contenido' : 'Posición'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
