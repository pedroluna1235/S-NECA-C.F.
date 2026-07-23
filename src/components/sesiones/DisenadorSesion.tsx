import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Plus, Trash2, Save, ImageIcon, Calendar } from 'lucide-react';
import type { DatosDisenoSesion, TareaSesion } from '../../types/sesion';
import { PlantillaPDFSesion } from './PlantillaPDFSesion';
import { generateAndUploadPDF } from '../../lib/pdfGenerator';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface DisenadorSesionProps {
  onSesionGuardada: () => void;
}

export function DisenadorSesion({ onSesionGuardada }: DisenadorSesionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  const [datos, setDatos] = useState<DatosDisenoSesion>({
    cabecera: {
      objetivo: '',
      principios: '',
      microcicloNum: '1',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora: '16:00',
      sesionNum: '1'
    },
    material: {
      balones: 0,
      petos1: 0,
      petos2: 0,
      petos3: 0,
      conos: 0,
      aros: 0,
      bancos: 0,
      fitball: 0,
      picas: 0,
      porterias: 0
    },
    tareas: [],
    jugadores: []
  });

  useEffect(() => {
    const fetchJugadores = async () => {
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('id, nombre, dorsal')
          .order('dorsal', { ascending: true, nullsFirst: false });

        if (error) throw error;
        
        if (data) {
          setDatos(prev => ({
            ...prev,
            jugadores: data.map(j => ({
              id: j.id,
              nombre: j.nombre,
              disponible: true
            }))
          }));
        }
      } catch (error) {
        console.error('Error fetching jugadores:', error);
        toast.error('Error al cargar la plantilla');
      } finally {
        setLoading(false);
      }
    };
    fetchJugadores();
  }, []);

  const addTarea = () => {
    const nuevaTarea: TareaSesion = {
      id: Date.now().toString(),
      titulo: 'Nueva Tarea',
      tiempo: '10',
      equipos: '',
      descripcion: '',
      variables: '',
      roles: '',
      reflexion: '',
      imagen_url: ''
    };
    setDatos(prev => ({ ...prev, tareas: [...prev.tareas, nuevaTarea] }));
  };

  const updateTarea = (index: number, campo: keyof TareaSesion, valor: string) => {
    const nuevasTareas = [...datos.tareas];
    nuevasTareas[index] = { ...nuevasTareas[index], [campo]: valor };
    setDatos(prev => ({ ...prev, tareas: nuevasTareas }));
  };

  const removeTarea = (index: number) => {
    const nuevasTareas = [...datos.tareas];
    nuevasTareas.splice(index, 1);
    setDatos(prev => ({ ...prev, tareas: nuevasTareas }));
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateTarea(index, 'imagen_url', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!datos.cabecera.fecha || !datos.cabecera.sesionNum) {
      toast.error('Por favor, indica al menos la fecha y el número de sesión');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Generando PDF y guardando sesión...');
    
    try {
      // 1. Generar y subir PDF
      const pdfUrl = await generateAndUploadPDF('plantilla-pdf-sesion', `Sesion_${datos.cabecera.sesionNum}`);
      
      // 2. Guardar en Base de Datos
      const titulo = `Sesión ${datos.cabecera.sesionNum}${datos.cabecera.objetivo ? ` - ${datos.cabecera.objetivo}` : ''}`;
      
      const { error } = await supabase
        .from('sesiones')
        .insert([{
          fecha: datos.cabecera.fecha,
          titulo: titulo,
          pdf_url: pdfUrl,
          observaciones: 'Sesión diseñada automáticamente',
          datos_diseno: datos // Asumiendo que la columna existe. Si no, se ignorará o dará error.
        }]);

      if (error) {
        // Fallback si la columna datos_diseno no existe aún
        console.warn('Error inserting with datos_diseno, trying without it', error);
        const { error: fallbackError } = await supabase
          .from('sesiones')
          .insert([{
            fecha: datos.cabecera.fecha,
            titulo: titulo,
            pdf_url: pdfUrl,
            observaciones: 'Sesión diseñada automáticamente'
          }]);
        if (fallbackError) throw fallbackError;
      }

      toast.success('Sesión guardada correctamente', { id: loadingToast });
      onSesionGuardada();
    } catch (error: any) {
      console.error('Error al guardar sesión:', error);
      toast.error('Error al guardar: ' + error.message, { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="text-red-500"/> Información de la Sesión</h3>
        
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Objetivo de la sesión</label>
            <input type="text" value={datos.cabecera.objetivo} onChange={e => setDatos(d => ({...d, cabecera: {...d.cabecera, objetivo: e.target.value}}))} placeholder="Ej: Mejorar la salida de balón..." className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Principios</label>
            <input type="text" value={datos.cabecera.principios} onChange={e => setDatos(d => ({...d, cabecera: {...d.cabecera, principios: e.target.value}}))} placeholder="Ej: Atraer para liberar, Tercer hombre..." className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
             <label className="block text-sm font-medium mb-1">Fecha</label>
             <input type="date" value={datos.cabecera.fecha} onChange={e => setDatos(d => ({...d, cabecera: {...d.cabecera, fecha: e.target.value}}))} className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Hora</label>
             <input type="time" value={datos.cabecera.hora} onChange={e => setDatos(d => ({...d, cabecera: {...d.cabecera, hora: e.target.value}}))} className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Número de Sesión</label>
             <input type="text" value={datos.cabecera.sesionNum} onChange={e => setDatos(d => ({...d, cabecera: {...d.cabecera, sesionNum: e.target.value}}))} className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Microciclo</label>
             <input type="text" value={datos.cabecera.microcicloNum} onChange={e => setDatos(d => ({...d, cabecera: {...d.cabecera, microcicloNum: e.target.value}}))} className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">

        {/* MATERIAL */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-xl font-bold mb-4">Material</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.keys(datos.material).map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1 uppercase truncate" title={key}>{key}</label>
                <input 
                  type="number" 
                  min="0"
                  value={datos.material[key as keyof typeof datos.material]} 
                  onChange={e => setDatos(d => ({...d, material: {...d.material, [key]: parseInt(e.target.value) || 0}}))} 
                  className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800 text-center" 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* TAREAS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Tareas de la Sesión</h3>
            <button 
              onClick={addTarea}
              className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              <Plus size={18} /> Añadir Tarea
            </button>
          </div>

          {datos.tareas.map((tarea, index) => (
            <div key={tarea.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 relative group transition-all hover:shadow-md">
              <button 
                onClick={() => removeTarea(index)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar tarea"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Tipo / Título</label>
                      <input type="text" value={tarea.titulo} onChange={e => updateTarea(index, 'titulo', e.target.value)} placeholder="Ej: 1. ACTIVACIÓN" className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800 font-bold" />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium mb-1">Minutos</label>
                      <input type="number" value={tarea.tiempo} onChange={e => updateTarea(index, 'tiempo', e.target.value)} className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800 text-center" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción / Reglas</label>
                    <textarea value={tarea.descripcion} onChange={e => updateTarea(index, 'descripcion', e.target.value)} rows={3} className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800 resize-y"></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Equipos</label>
                      <input type="text" value={tarea.equipos} onChange={e => updateTarea(index, 'equipos', e.target.value)} placeholder="Ej: 4vs4 + 2 comodines" className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Variables</label>
                      <input type="text" value={tarea.variables} onChange={e => updateTarea(index, 'variables', e.target.value)} placeholder="Ej: A 2 toques, sin comodín..." className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Roles CT</label>
                      <input type="text" value={tarea.roles} onChange={e => updateTarea(index, 'roles', e.target.value)} placeholder="Ej: Primer mister pita, segundo corrige..." className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pregunta Reflexión</label>
                      <input type="text" value={tarea.reflexion} onChange={e => updateTarea(index, 'reflexion', e.target.value)} placeholder="Ej: ¿Dónde hay superioridad?" className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
                    </div>
                  </div>
                </div>

                {/* IMAGEN DE LA TAREA */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1">Imagen de la tarea</label>
                  <div className="flex-1 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl relative flex flex-col items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-900 group-hover:border-red-300 transition-colors">
                    {tarea.imagen_url ? (
                      <>
                        <img src={tarea.imagen_url} alt="Previsualización" className="absolute inset-0 w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100">
                            Cambiar Imagen
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(index, e)} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-neutral-400 hover:text-red-500 transition-colors p-6 text-center">
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-sm font-medium">Subir Imagen</span>
                        <span className="text-xs mt-1">Recomendado: 4:3 o 16:9</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(index, e)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {datos.tareas.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
              <p className="text-neutral-500 font-medium mb-4">No has añadido ninguna tarea a la sesión.</p>
              <button 
                onClick={addTarea}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                <Plus size={20} /> Empezar a diseñar
              </button>
            </div>
          )}
        </div>

        {/* JUGADORES (SIDEBAR) */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 h-fit sticky top-6">
          <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
            Jugadores
            <span className="text-sm font-normal text-neutral-500">
              {datos.jugadores.filter(j => j.disponible).length} / {datos.jugadores.length}
            </span>
          </h3>
          <p className="text-xs text-neutral-500 mb-4">Haz clic en un jugador para marcarlo como baja (ausente/lesionado).</p>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {datos.jugadores.map((jugador, i) => (
              <div 
                key={jugador.id}
                onClick={() => {
                  const nuevos = [...datos.jugadores];
                  nuevos[i].disponible = !nuevos[i].disponible;
                  setDatos(d => ({ ...d, jugadores: nuevos }));
                }}
                className={`p-2 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center justify-between border ${
                  jugador.disponible 
                    ? 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-red-300' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 opacity-80'
                }`}
              >
                <span className="truncate">{i+1}. {jugador.nombre}</span>
                {!jugador.disponible && <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded text-red-800 dark:text-red-100">BAJA</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOAT ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex justify-end items-center gap-4 z-40">
        <span className="text-sm text-neutral-500 font-medium">
          Asegúrate de haber añadido las imágenes antes de guardar.
        </span>
        <button
          onClick={handleSave}
          disabled={saving || datos.tareas.length === 0}
          className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Generando y Guardando...' : 'Guardar y Generar PDF'}
        </button>
      </div>

      {/* COMPONENTE OCULTO PARA EL PDF */}
      <PlantillaPDFSesion ref={pdfContainerRef} datos={datos} />
      
    </div>
  );
}
