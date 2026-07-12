import { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Play, AlertCircle, FileJson, Film } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import ReactPlayer from 'react-player';

interface EventosTabProps {
  matchId: string;
}

interface EventoData {
  id?: string;
  partido_id: string;
  tipo: 'Gol' | 'Ocasión' | 'Duelo' | 'Nota';
  tiempo_segundos: number;
  descripcion: string;
  video_url: string;
  created_at?: string;
}

const EVENT_TYPES = [
  { tipo: 'Gol', color: 'bg-red-500 hover:bg-red-600', text: 'text-white' },
  { tipo: 'Ocasión', color: 'bg-orange-500 hover:bg-orange-600', text: 'text-white' },
  { tipo: 'Duelo', color: 'bg-yellow-400 hover:bg-yellow-500', text: 'text-neutral-900' },
  { tipo: 'Nota', color: 'bg-blue-500 hover:bg-blue-600', text: 'text-white' },
] as const;

export function EventosTab({ matchId }: EventosTabProps) {
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [playingCutEnd, setPlayingCutEnd] = useState<number | null>(null);
  
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('eventos_partido')
          .select('*')
          .eq('partido_id', matchId)
          .order('tiempo_segundos', { ascending: true });

        if (error) throw error;
        setEventos(data || []);
        
        // Cargar url de vídeo si hay eventos
        if (data && data.length > 0 && data[0].video_url) {
          setVideoUrl(data[0].video_url);
        }
      } catch (error) {
        console.error('Error fetching eventos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [matchId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddEvent = async (tipo: EventoData['tipo']) => {
    try {
      let currentTime = 0;
      if (playerRef.current) {
        // En react-player v3 el ref devuelve un elemento tipo HTMLVideoElement
        currentTime = (playerRef.current as any).currentTime || 0;
      } else {
        const manual = prompt('Introduce el minuto exacto (ej. 45:30) o en segundos:');
        if (!manual) return;
        if (manual.includes(':')) {
          const [m, s] = manual.split(':');
          currentTime = parseInt(m) * 60 + parseInt(s);
        } else {
          currentTime = parseInt(manual);
        }
      }

      if (isNaN(currentTime)) return;

      const newEvent: EventoData = {
        partido_id: matchId,
        tipo,
        tiempo_segundos: Math.floor(currentTime),
        descripcion: `Evento de ${tipo}`,
        video_url: videoUrl
      };

      const { data, error } = await supabase
        .from('eventos_partido')
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setEventos(prev => [...prev, data].sort((a, b) => a.tiempo_segundos - b.tiempo_segundos));
      }
    } catch (error: any) {
      console.error('Error adding event:', error);
      alert('Error al registrar el evento: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleUpdateDescription = async (id: string, descripcion: string) => {
    try {
      setEventos(prev => prev.map(e => e.id === id ? { ...e, descripcion } : e));
      await supabase.from('eventos_partido').update({ descripcion }).eq('id', id);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      await supabase.from('eventos_partido').delete().eq('id', id);
      setEventos(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Tipo', 'Tiempo', 'Descripción', 'URL Video (Corte)'];
    const rows = eventos.map(e => [
      e.tipo,
      formatTime(e.tiempo_segundos),
      `"${e.descripcion.replace(/"/g, '""')}"`,
      `"${e.video_url}#t=${Math.max(0, e.tiempo_segundos - 5)},${e.tiempo_segundos + 10}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "eventos_partido.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(eventos, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "eventos_partido.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFCPXML = () => {
    let clipsXML = '';
    let currentOffset = 0;

    eventos.forEach((e) => {
      const start = Math.max(0, e.tiempo_segundos - 5);
      const duration = 15;
      clipsXML += `
                        <clip name="${e.tipo} - ${e.descripcion.replace(/&/g, '&amp;').replace(/</g, '&lt;')}" ref="r2" offset="${currentOffset}s" duration="${duration}s" start="${start}s"/>`;
      currentOffset += duration;
    });

    const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
    <resources>
        <format id="r1" name="FFVideoFormat1080p25" frameDuration="1/25s" width="1920" height="1080"/>
        <asset id="r2" name="Video Partido" src="file:///RUTA_DEL_VIDEO_DESCARGADO.mp4" start="0s" hasVideo="1" format="r1" hasAudio="1"/>
    </resources>
    <library>
        <event name="Analisis Seneca">
            <project name="Cortes Eventos">
                <sequence format="r1">
                    <spine>${clipsXML}
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>`;

    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(fcpxml);
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "cortes_eventos.fcpxml");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlayCut = (segundos: number) => {
    if (playerRef.current) {
      const start = Math.max(0, segundos - 5);
      const player = playerRef.current as any;
      player.currentTime = start;
      setPlayingCutEnd(segundos + 10);
      player.play();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px] animate-in fade-in duration-500">
      
      {/* Lado Izquierdo: Reproductor y Botones de Evento */}
      <div className="flex flex-col space-y-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">URL del Partido (YouTube/Vimeo)</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Ej: https://youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
            />
          </div>

          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500">
            {videoUrl ? (
              <ReactPlayer
                ref={playerRef}
                src={videoUrl.trim()}
                width="100%"
                height="100%"
                controls
                onTimeUpdate={(e: any) => {
                  const currentTime = e.target.currentTime;
                  if (playingCutEnd && currentTime >= playingCutEnd) {
                    const internalPlayer = (playerRef.current as any).getInternalPlayer();
                    if (internalPlayer?.pauseVideo) {
                      internalPlayer.pauseVideo();
                    } else if (internalPlayer?.pause) {
                      internalPlayer.pause();
                    } else {
                      e.target.pause();
                    }
                    setPlayingCutEnd(null);
                  }
                }}
              />
            ) : (
              <span className="font-medium text-sm">Introduce la URL del vídeo para visualizar</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="font-black text-lg text-neutral-900 dark:text-white uppercase">Registrar Evento</h3>
          <div className="grid grid-cols-2 gap-3">
            {EVENT_TYPES.map((ev) => (
              <button
                key={ev.tipo}
                onClick={() => handleAddEvent(ev.tipo)}
                className={cn(
                  "py-4 rounded-2xl font-black text-lg shadow-sm transition-transform active:scale-95 flex flex-col items-center justify-center gap-1",
                  ev.color, ev.text
                )}
              >
                <span>{ev.tipo}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 text-center mt-2 flex items-center justify-center gap-1">
            <AlertCircle size={12}/> Se registrará un corte automático (-5s a +10s)
          </p>
        </div>
      </div>

      {/* Lado Derecho: Historial */}
      <div className="flex flex-col bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <h3 className="font-black text-lg text-neutral-900 dark:text-white uppercase flex items-center gap-2">
            Historial de Eventos
            <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs py-1 px-2 rounded-full">{eventos.length}</span>
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={exportFCPXML}
              title="Exportar para iMovie / Final Cut (FCPXML)"
              className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
            >
              <Film size={18} />
              <span className="text-xs font-bold hidden sm:inline">iMovie</span>
            </button>
            <button
              onClick={exportCSV}
              title="Exportar CSV"
              className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <Download size={18} />
            </button>
            <button
              onClick={exportJSON}
              title="Descargar JSON"
              className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <FileJson size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {eventos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
              <AlertCircle size={32} />
              <p>No hay eventos registrados</p>
            </div>
          ) : (
            eventos.map((ev) => {
              const eventType = EVENT_TYPES.find(t => t.tipo === ev.tipo);
              return (
                <div key={ev.id} className="group flex gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800/50 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
                  
                  <div className="flex flex-col items-center gap-2">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold w-20 text-center", eventType?.color, eventType?.text)}>
                      {ev.tipo}
                    </span>
                    <button 
                      onClick={() => handlePlayCut(ev.tiempo_segundos)}
                      className="flex items-center justify-center gap-1 text-sm font-black text-red-600 dark:text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Play size={14} className="fill-current"/> {formatTime(ev.tiempo_segundos)}
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <input
                      type="text"
                      value={ev.descripcion}
                      onChange={(e) => handleUpdateDescription(ev.id!, e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                      placeholder="Añade una descripción..."
                    />
                  </div>

                  <button
                    onClick={() => handleDelete(ev.id!)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 transition-all self-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  );
}
