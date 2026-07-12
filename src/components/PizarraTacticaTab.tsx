import { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PizarraTacticaTabProps {
  matchId: string;
}

interface Position {
  id: number;
  x: number;
  y: number;
}

const DEFAULT_RED_POSITIONS: Position[] = Array.from({ length: 7 }).map((_, i) => ({
  id: i + 1,
  x: 5,
  y: 15 + i * 12, // Spread vertically on the left
}));

const DEFAULT_BLACK_POSITIONS: Position[] = Array.from({ length: 7 }).map((_, i) => ({
  id: i + 8, // Unique IDs across both arrays
  x: 95,
  y: 15 + i * 12, // Spread vertically on the right
}));

export function PizarraTacticaTab({ matchId }: PizarraTacticaTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);
  
  const [redTokens, setRedTokens] = useState<Position[]>(DEFAULT_RED_POSITIONS);
  const [blackTokens, setBlackTokens] = useState<Position[]>(DEFAULT_BLACK_POSITIONS);
  
  const [draggingToken, setDraggingToken] = useState<{ id: number, type: 'red' | 'black' } | null>(null);
  
  const pitchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pizarra_tactica')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setHasRecord(true);
        if (data.fichas_rojas) setRedTokens(data.fichas_rojas);
        if (data.fichas_negras) setBlackTokens(data.fichas_negras);
      }
    } catch (error) {
      console.error('Error fetching pizarra:', error);
      toast.error('Error al cargar la pizarra táctica');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        partido_id: matchId,
        fichas_rojas: redTokens,
        fichas_negras: blackTokens
      };

      if (hasRecord) {
        const { error } = await supabase
          .from('pizarra_tactica')
          .update(payload)
          .eq('partido_id', matchId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pizarra_tactica')
          .insert([payload]);
        if (error) throw error;
        setHasRecord(true);
      }
      toast.success('Pizarra guardada correctamente');
    } catch (error) {
      console.error('Error saving pizarra:', error);
      toast.error('Error al guardar. ¿Has creado la tabla SQL?');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Quieres volver a colocar todas las fichas en su posición inicial?')) {
      setRedTokens(DEFAULT_RED_POSITIONS);
      setBlackTokens(DEFAULT_BLACK_POSITIONS);
    }
  };

  // --- Lógica de Arrastre (Drag & Drop) ---
  const handlePointerDown = (e: React.PointerEvent, id: number, type: 'red' | 'black') => {
    e.preventDefault(); // Prevent text selection or scrolling while dragging
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingToken({ id, type });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingToken || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    
    // Calcular posición en porcentajes relativa al campo
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Limitar al área visible
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    if (draggingToken.type === 'red') {
      setRedTokens(prev => prev.map(t => t.id === draggingToken.id ? { ...t, x, y } : t));
    } else {
      setBlackTokens(prev => prev.map(t => t.id === draggingToken.id ? { ...t, x, y } : t));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingToken) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingToken(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Controles Superiores */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Pizarra Táctica (Fútbol 7)</h2>
          <p className="text-neutral-500 mt-1">Arrastra las fichas libremente para diseñar la estrategia del partido.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleReset}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95"
          >
            <RotateCcw size={18} />
            <span>Restablecer</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Terreno de Juego (Pizarra CSS) */}
      <div 
        className="relative w-full aspect-[4/3] sm:aspect-[3/2] bg-emerald-600 rounded-xl overflow-hidden shadow-inner cursor-crosshair touch-none border-4 border-white dark:border-neutral-900"
        ref={pitchRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Líneas del campo (Fútbol 7) */}
        <div className="absolute inset-4 border-2 border-white/70 pointer-events-none"></div> {/* Línea de banda */}
        <div className="absolute left-1/2 top-4 bottom-4 w-0 border-l-2 border-white/70 pointer-events-none"></div> {/* Medio campo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/70 pointer-events-none"></div> {/* Círculo central */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/70 pointer-events-none"></div> {/* Punto central */}
        
        {/* Áreas izquierda */}
        <div className="absolute left-4 top-[20%] bottom-[20%] w-[15%] border-2 border-l-0 border-white/70 pointer-events-none"></div>
        <div className="absolute left-[15%] top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 rounded-full bg-white/70 pointer-events-none"></div> {/* Penalti */}
        
        {/* Áreas derecha */}
        <div className="absolute right-4 top-[20%] bottom-[20%] w-[15%] border-2 border-r-0 border-white/70 pointer-events-none"></div>
        <div className="absolute right-[15%] top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rounded-full bg-white/70 pointer-events-none"></div> {/* Penalti */}


        {/* Fichas Rojas */}
        {redTokens.map(token => (
          <div
            key={token.id}
            onPointerDown={(e) => handlePointerDown(e, token.id, 'red')}
            style={{ 
              left: `calc(${token.x}% - 14px)`, 
              top: `calc(${token.y}% - 14px)` 
            }}
            className="absolute w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded-full border-2 border-white shadow-lg shadow-black/40 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-75 touch-none"
          >
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full pointer-events-none" />
          </div>
        ))}

        {/* Fichas Negras */}
        {blackTokens.map(token => (
          <div
            key={token.id}
            onPointerDown={(e) => handlePointerDown(e, token.id, 'black')}
            style={{ 
              left: `calc(${token.x}% - 14px)`, 
              top: `calc(${token.y}% - 14px)` 
            }}
            className="absolute w-7 h-7 sm:w-8 sm:h-8 bg-neutral-900 rounded-full border-2 border-white shadow-lg shadow-black/40 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-75 touch-none"
          >
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full pointer-events-none" />
          </div>
        ))}

      </div>

    </div>
  );
}
