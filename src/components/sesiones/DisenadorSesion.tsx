import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Plus, Trash2, Save, ImageIcon, Calendar, Users, RotateCcw, CheckCircle2, Bookmark } from 'lucide-react';
import type { DatosDisenoSesion, TareaSesion } from '../../types/sesion';
import { PlantillaPDFSesion } from './PlantillaPDFSesion';
import { generateAndUploadPDF } from '../../lib/pdfGenerator';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DRAFT_STORAGE_KEY = 'seneca_sesion_diseno_draft';

export interface SesionDraftData {
  datos: DatosDisenoSesion;
  sesionIdToEdit?: string | null;
  timestamp: number;
  savedAt: string;
}

const isDraftMeaningful = (d?: DatosDisenoSesion | null) => {
  if (!d) return false;
  const hasObjetivo = Boolean(d.cabecera?.objetivo && d.cabecera.objetivo.trim().length > 0);
  const hasPrincipios = Boolean(d.cabecera?.principios && d.cabecera.principios.trim().length > 0);
  const hasTareas = Boolean(d.tareas && d.tareas.length > 0);
  const hasIndividuales = Boolean(d.sesionesIndividuales && d.sesionesIndividuales.length > 0);
  const hasKpis = Boolean(d.kpis && d.kpis.trim().length > 0);
  const hasMaterial = Boolean(d.material && Object.values(d.material).some(v => typeof v === 'number' && v > 0));
  return hasObjetivo || hasPrincipios || hasTareas || hasIndividuales || hasKpis || hasMaterial;
};

function saveDraftToStorage(draftData: SesionDraftData): boolean {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    return true;
  } catch (err) {
    try {
      // Si excede la cuota de localStorage por imágenes base64 grandes, guardamos texto y configuración
      const safeDraft: SesionDraftData = {
        ...draftData,
        datos: {
          ...draftData.datos,
          tareas: (draftData.datos.tareas || []).map(t => ({
            ...t,
            imagen_url: t.imagen_url && t.imagen_url.startsWith('data:') && t.imagen_url.length > 30000 ? '' : t.imagen_url
          }))
        }
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safeDraft));
      return true;
    } catch (innerErr) {
      console.error('Error al guardar borrador en localStorage:', innerErr);
      return false;
    }
  }
}

interface DisenadorSesionProps {
  onSesionGuardada: () => void;
  initialDatos?: DatosDisenoSesion;
  sesionIdToEdit?: string;
}

export function DisenadorSesion({ onSesionGuardada, initialDatos, sesionIdToEdit }: DisenadorSesionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nuevoJugadorNombre, setNuevoJugadorNombre] = useState('');

  // Estados para el sistema de recuperación y autoguardado de borrador
  const [availableDraft, setAvailableDraft] = useState<SesionDraftData | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [lastSavedText, setLastSavedText] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const isInitialMount = useRef(true);

  const addJugadorManual = () => {
    if (!nuevoJugadorNombre.trim()) return;
    setDatos(prev => ({
      ...prev,
      jugadores: [
        ...prev.jugadores,
        {
          id: Date.now().toString(),
          nombre: nuevoJugadorNombre.trim(),
          disponible: true,
          manual: true
        }
      ]
    }));
    setNuevoJugadorNombre('');
  };

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  const isHiddenPlayer = (nombre: string) => {
    const n = nombre.toLowerCase();
    return n.includes('javier valverde') || n.includes('carlos gonzález') || n.includes('carlos gonzalez');
  };

  const [datos, setDatos] = useState<DatosDisenoSesion>(initialDatos || {
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
    jugadores: [],
    sesionesIndividuales: [],
    kpis: ''
  });

  useEffect(() => {
    const fetchJugadores = async () => {
      // Si estamos editando, ya tenemos los jugadores en el estado inicial
      if (initialDatos && initialDatos.jugadores && initialDatos.jugadores.length > 0) {
        setLoading(false);
        return;
      }

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
              disponible: !isHiddenPlayer(j.nombre)
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
  }, [initialDatos]);

  // Comprobar si hay un borrador guardado en localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed: SesionDraftData = JSON.parse(raw);
        if (parsed?.datos && isDraftMeaningful(parsed.datos)) {
          // Si estamos editando una sesión guardada, comprobar que coincida la sesión o que sea nuevo diseño
          if (!sesionIdToEdit || parsed.sesionIdToEdit === sesionIdToEdit) {
            setAvailableDraft(parsed);
            setShowDraftBanner(true);
            setLastSavedText(`Borrador guardado (${parsed.savedAt})`);
          }
        }
      }
    } catch (e) {
      console.error('Error al leer borrador de localStorage:', e);
    }
  }, [sesionIdToEdit]);

  // Autoguardado continuo (debounced 800ms)
  useEffect(() => {
    if (loading) return;

    // En el primer render no sobreescribir borrador existente con el formulario vacío inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isDraftMeaningful(datos)) return;

    const timer = setTimeout(() => {
      const now = new Date();
      const timeFormatted = format(now, 'HH:mm:ss');
      const dateFormatted = format(now, 'dd/MM/yyyy');
      const draftData: SesionDraftData = {
        datos,
        sesionIdToEdit: sesionIdToEdit || null,
        timestamp: Date.now(),
        savedAt: `${dateFormatted} a las ${timeFormatted}`
      };

      const success = saveDraftToStorage(draftData);
      if (success) {
        setLastSavedText(`Guardado a las ${timeFormatted}`);
        setIsDirty(true);
        setAvailableDraft(draftData);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [datos, loading, sesionIdToEdit]);

  // Alerta de navegación accidental (atrás, cerrar pestaña, refrescar)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isDraftMeaningful(datos)) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios en el diseño de la sesión. Tu trabajo está guardado automáticamente en el borrador de tu navegador.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, datos]);

  const handleRestoreDraft = () => {
    if (!availableDraft) {
      toast.error('No se ha encontrado ningún borrador para recuperar');
      return;
    }
    setDatos(availableDraft.datos);
    setShowDraftBanner(false);
    setIsDirty(false);
    toast.success('¡Sesión recuperada con éxito!', {
      icon: '📋',
      duration: 3500
    });
  };

  const handleDiscardDraft = () => {
    if (window.confirm('¿Seguro que deseas descartar el borrador guardado? Esta acción no se puede deshacer.')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setAvailableDraft(null);
      setShowDraftBanner(false);
      setLastSavedText('');
      toast('Borrador descartado', { icon: '🗑️' });
    }
  };

  const handleManualSaveDraft = () => {
    const now = new Date();
    const timeFormatted = format(now, 'HH:mm:ss');
    const dateFormatted = format(now, 'dd/MM/yyyy');
    const draftData: SesionDraftData = {
      datos,
      sesionIdToEdit: sesionIdToEdit || null,
      timestamp: Date.now(),
      savedAt: `${dateFormatted} a las ${timeFormatted}`
    };

    saveDraftToStorage(draftData);
    setLastSavedText(`Guardado manual a las ${timeFormatted}`);
    setAvailableDraft(draftData);
    setIsDirty(false);
    toast.success('Borrador guardado en tu navegador', { icon: '💾' });
  };

  const handleResetForm = () => {
    if (window.confirm('¿Deseas reiniciar el diseño de la sesión y empezar de cero?')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setAvailableDraft(null);
      setShowDraftBanner(false);
      setDatos({
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
        jugadores: datos.jugadores.map(j => ({ ...j, disponible: !isHiddenPlayer(j.nombre) })),
        sesionesIndividuales: [],
        kpis: ''
      });
      setLastSavedText('');
      setIsDirty(false);
      toast('Diseñador reiniciado', { icon: '🔄' });
    }
  };

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
      objetivo_individual: '',
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

  const addSesionIndividual = () => {
    const nueva: import('../../types/sesion').SesionIndividual = {
      id: Date.now().toString(),
      nombres: '',
      video: false,
      entrenamiento: false,
      charla: false
    };
    setDatos(prev => ({ ...prev, sesionesIndividuales: [...(prev.sesionesIndividuales || []), nueva] }));
  };

  const updateSesionIndividual = (index: number, campo: keyof import('../../types/sesion').SesionIndividual, valor: any) => {
    const nuevas = [...(datos.sesionesIndividuales || [])];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    setDatos(prev => ({ ...prev, sesionesIndividuales: nuevas }));
  };

  const removeSesionIndividual = (index: number) => {
    const nuevas = [...(datos.sesionesIndividuales || [])];
    nuevas.splice(index, 1);
    setDatos(prev => ({ ...prev, sesionesIndividuales: nuevas }));
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
      
      let error;
      
      if (sesionIdToEdit) {
        const { error: updateError } = await supabase
          .from('sesiones')
          .update({
            fecha: datos.cabecera.fecha,
            titulo: titulo,
            pdf_url: pdfUrl,
            datos_diseno: datos
          })
          .eq('id', sesionIdToEdit);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('sesiones')
          .insert([{
            fecha: datos.cabecera.fecha,
            titulo: titulo,
            pdf_url: pdfUrl,
            observaciones: 'Sesión diseñada automáticamente',
            datos_diseno: datos
          }]);
        error = insertError;
      }

      if (error) {
        // Fallback si la columna datos_diseno no existe aún
        console.warn('Error saving with datos_diseno, trying without it', error);
        
        if (sesionIdToEdit) {
          const { error: fallbackError } = await supabase
            .from('sesiones')
            .update({
              fecha: datos.cabecera.fecha,
              titulo: titulo,
              pdf_url: pdfUrl
            })
            .eq('id', sesionIdToEdit);
          if (fallbackError) throw fallbackError;
        } else {
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
      }

      toast.success('Sesión guardada correctamente', { id: loadingToast });
      // Limpiar borrador tras guardado exitoso
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setAvailableDraft(null);
      setShowDraftBanner(false);
      setIsDirty(false);
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* BANNER DE RECUPERACIÓN DE BORRADOR */}
      {showDraftBanner && availableDraft && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700/70 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
                <RotateCcw className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-base">
                    ¿Deseas recuperar la sesión que estabas diseñando?
                  </h4>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                    Borrador detectado
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                  Se guardó automáticamente el <strong className="text-neutral-900 dark:text-white">{availableDraft.savedAt}</strong>
                  {availableDraft.datos.cabecera?.objetivo ? (
                    <> con objetivo <span className="italic font-medium text-neutral-800 dark:text-neutral-200">"{availableDraft.datos.cabecera.objetivo}"</span></>
                  ) : null}
                  {availableDraft.datos.tareas?.length ? (
                    <> y <strong className="text-neutral-900 dark:text-white">{availableDraft.datos.tareas.length} {availableDraft.datos.tareas.length === 1 ? 'tarea' : 'tareas'}</strong></>
                  ) : null}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition-all active:scale-95"
              >
                <RotateCcw size={16} />
                Recuperar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-red-500"/> Información de la Sesión
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {lastSavedText && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {lastSavedText}
              </span>
            )}
            {availableDraft && !showDraftBanner && (
              <button
                type="button"
                onClick={handleRestoreDraft}
                title="Recuperar los datos del último borrador guardado"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                <RotateCcw size={14} />
                Recuperar Borrador
              </button>
            )}
            <button
              type="button"
              onClick={handleManualSaveDraft}
              title="Guardar una copia de seguridad en este navegador"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Bookmark size={14} />
              Guardar Borrador
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              title="Limpiar campos y empezar una sesión nueva"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 size={14} />
              Empezar de cero
            </button>
          </div>
        </div>
        
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

      {/* SESIÓN INDIVIDUAL */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Users className="text-red-500" /> Sesión Individual</h3>
          <button 
            onClick={addSesionIndividual}
            className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
          >
            <Plus size={16} /> Añadir
          </button>
        </div>
        
        {(!datos.sesionesIndividuales || datos.sesionesIndividuales.length === 0) && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">No hay sesiones individuales programadas.</p>
        )}

        <div className="space-y-3">
          {datos.sesionesIndividuales?.map((sesionInd, idx) => (
            <div key={sesionInd.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-950">
              <div className="flex-1 w-full">
                <input 
                  type="text" 
                  value={sesionInd.nombres} 
                  onChange={e => updateSesionIndividual(idx, 'nombres', e.target.value)} 
                  placeholder="Nombre del jugador o jugadores..." 
                  className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-700" 
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={sesionInd.video} onChange={e => updateSesionIndividual(idx, 'video', e.target.checked)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                  Vídeo
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={sesionInd.entrenamiento} onChange={e => updateSesionIndividual(idx, 'entrenamiento', e.target.checked)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                  Entrenamiento
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={sesionInd.charla} onChange={e => updateSesionIndividual(idx, 'charla', e.target.checked)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                  Charla
                </label>
              </div>
              <button onClick={() => removeSesionIndividual(idx)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
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

                  <div>
                    <label className="block text-sm font-medium mb-1">Responsabilidades</label>
                    <input type="text" value={tarea.responsabilidades || ''} onChange={e => updateTarea(index, 'responsabilidades', e.target.value)} placeholder="Ej: Laterales cierran dentro, centrales fijan..." className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
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

                  <div>
                    <label className="block text-sm font-medium mb-1">Objetivo Individual</label>
                    <input type="text" value={tarea.objetivo_individual || ''} onChange={e => updateTarea(index, 'objetivo_individual', e.target.value)} placeholder="Ej: Que el extremo fije la marca..." className="w-full p-2 border rounded-lg dark:bg-neutral-950 dark:border-neutral-800" />
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

          {/* KPIS */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 mt-6">
            <h3 className="text-xl font-bold mb-4">KPIS</h3>
            <textarea
              value={datos.kpis || ''}
              onChange={e => setDatos(d => ({ ...d, kpis: e.target.value }))}
              placeholder="Escribe aquí los KPIs de la sesión..."
              rows={4}
              className="w-full p-3 border rounded-xl dark:bg-neutral-950 dark:border-neutral-800 resize-y focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            />
          </div>
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
          
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar mb-4">
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
                    ? (jugador.manual ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-red-300')
                    : (isHiddenPlayer(jugador.nombre) 
                        ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-500 opacity-60' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 opacity-80')
                }`}
              >
                <span className="truncate">{i+1}. {jugador.nombre}</span>
                <div className="flex items-center gap-2">
                  {jugador.manual && jugador.disponible && <span className="text-xs bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-100">EXTRA</span>}
                  {!jugador.disponible && !isHiddenPlayer(jugador.nombre) && <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded text-red-800 dark:text-red-100">BAJA</span>}
                  {!jugador.disponible && isHiddenPlayer(jugador.nombre) && <span className="text-xs bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">OCULTO</span>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Añadir Jugador Extra</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={nuevoJugadorNombre}
                onChange={e => setNuevoJugadorNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addJugadorManual()}
                placeholder="Nombre del jugador..." 
                className="flex-1 p-2 text-sm border rounded-lg bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-700 focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button 
                onClick={addJugadorManual}
                disabled={!nuevoJugadorNombre.trim()}
                className="bg-neutral-900 dark:bg-white text-white dark:text-black p-2 rounded-lg disabled:opacity-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FLOAT ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-3 z-40">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
          {lastSavedText ? (
            <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {lastSavedText}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
              Autoguardado activo
            </span>
          )}
          <button
            type="button"
            onClick={handleManualSaveDraft}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline underline-offset-2 transition-colors"
          >
            Guardar copia ahora
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="hidden md:inline text-xs text-neutral-500 font-medium">
            Asegúrate de haber añadido las imágenes antes de guardar.
          </span>
          <button
            onClick={handleSave}
            disabled={saving || datos.tareas.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Generando y Guardando...' : 'Guardar y Generar PDF'}
          </button>
        </div>
      </div>

      {/* COMPONENTE OCULTO PARA EL PDF */}
      <PlantillaPDFSesion ref={pdfContainerRef} datos={datos} />
      
    </div>
  );
}
