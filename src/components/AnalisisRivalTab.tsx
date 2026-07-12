import { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Play, AlertCircle, Save, Video, Film, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';

interface AnalisisRivalTabProps {
  matchId: string;
}

interface EventoData {
  id?: string;
  partido_id: string;
  video_index: 1 | 2;
  tipo: 'Salida de balón' | 'Presión' | 'Elaboración' | 'Repliegue' | 'Contraataque' | 'Defensa zonal' | 'ABP';
  tiempo_segundos: number;
  descripcion: string;
  created_at?: string;
}

const EVENT_TYPES = [
  { tipo: 'Salida de balón', color: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white' },
  { tipo: 'Presión', color: 'bg-red-500 hover:bg-red-600', text: 'text-white' },
  { tipo: 'Elaboración', color: 'bg-blue-500 hover:bg-blue-600', text: 'text-white' },
  { tipo: 'Repliegue', color: 'bg-orange-500 hover:bg-orange-600', text: 'text-white' },
  { tipo: 'Contraataque', color: 'bg-yellow-400 hover:bg-yellow-500', text: 'text-neutral-900' },
  { tipo: 'Defensa zonal', color: 'bg-indigo-500 hover:bg-indigo-600', text: 'text-white' },
  { tipo: 'ABP', color: 'bg-purple-500 hover:bg-purple-600', text: 'text-white' },
] as const;

export function AnalisisRivalTab({ matchId }: AnalisisRivalTabProps) {
  const [loading, setLoading] = useState(true);
  const [savingVideos, setSavingVideos] = useState(false);
  const [eventos, setEventos] = useState<EventoData[]>([]);
  
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const [video1Url, setVideo1Url] = useState('');
  const [video2Url, setVideo2Url] = useState('');
  
  const [playingCutEnd, setPlayingCutEnd] = useState<number | null>(null);

  const [showXMLModal, setShowXMLModal] = useState(false);
  const [localVideo1Path, setLocalVideo1Path] = useState('');
  const [localVideo2Path, setLocalVideo2Path] = useState('');
  
  const player1Ref = useRef<any>(null);
  const player2Ref = useRef<any>(null);

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch URLs
      const { data: videoData, error: videoError } = await supabase
        .from('analisis_rival_videos')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (videoError && videoError.code !== 'PGRST116') throw videoError;
      
      if (videoData) {
        setVideo1Url(videoData.video1_url || '');
        setVideo2Url(videoData.video2_url || '');
      }

      // Fetch Eventos
      const { data: eventosData, error: eventosError } = await supabase
        .from('analisis_rival_eventos')
        .select('*')
        .eq('partido_id', matchId)
        .order('tiempo_segundos', { ascending: true });

      if (eventosError) throw eventosError;
      setEventos(eventosData || []);
      
    } catch (error) {
      console.error('Error fetching analisis rival data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const saveVideoUrls = async () => {
    try {
      setSavingVideos(true);
      const payload = {
        partido_id: matchId,
        video1_url: video1Url,
        video2_url: video2Url
      };

      const { data: existing } = await supabase
        .from('analisis_rival_videos')
        .select('partido_id')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('analisis_rival_videos')
          .update(payload)
          .eq('partido_id', matchId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('analisis_rival_videos')
          .insert([payload]);
        if (error) throw error;
      }
      toast.success('URLs guardadas');
    } catch (error) {
      console.error('Error saving video urls:', error);
      toast.error('Error al guardar las URLs. Asegúrate de haber ejecutado el SQL.');
    } finally {
      setSavingVideos(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddEvent = async (tipo: EventoData['tipo']) => {
    try {
      let currentTime = 0;
      const playerRef = activeVideo === 1 ? player1Ref : player2Ref;
      
      if (playerRef.current) {
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
        video_index: activeVideo,
        tipo,
        tiempo_segundos: Math.floor(currentTime),
        descripcion: `Evento de ${tipo}`,
      };

      const { data, error } = await supabase
        .from('analisis_rival_eventos')
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setEventos(prev => [...prev, data].sort((a, b) => a.tiempo_segundos - b.tiempo_segundos));
        toast.success(`Evento añadido al Vídeo ${activeVideo}`);
      }
    } catch (error: any) {
      console.error('Error adding event:', error);
      toast.error('Error al registrar el evento. Asegúrate de crear la tabla SQL.');
    }
  };

  const handleUpdateDescription = async (id: string, descripcion: string) => {
    try {
      setEventos(prev => prev.map(e => e.id === id ? { ...e, descripcion } : e));
      await supabase.from('analisis_rival_eventos').update({ descripcion }).eq('id', id);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      await supabase.from('analisis_rival_eventos').delete().eq('id', id);
      setEventos(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Vídeo', 'Tipo', 'Tiempo', 'Descripción', 'Enlace Local'];
    const rows = eventos.map(e => {
      const url = e.video_index === 1 ? video1Url : video2Url;
      return [
        `Video ${e.video_index}`,
        e.tipo,
        formatTime(e.tiempo_segundos),
        `"${(e.descripcion || '').replace(/"/g, '""')}"`,
        `"${url}#t=${Math.max(0, e.tiempo_segundos - 5)},${e.tiempo_segundos + 10}"`
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analisis_rival.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFCPXML = () => {
    setShowXMLModal(true);
  };

  const generateFinalFCPXML = () => {
    let clipsXML = '';
    let currentOffset = 0;

    let safePath1 = localVideo1Path.trim() || "/Users/pedroluna/Downloads/Segunda parte Santaella 1.mp4";
    if (!safePath1.startsWith("file://")) {
      safePath1 = "file://" + safePath1.split('/').map(encodeURIComponent).join('/');
    }

    let safePath2 = localVideo2Path.trim() || "/Users/pedroluna/Downloads/Segunda parte Santaella 2.mp4";
    if (!safePath2.startsWith("file://")) {
      safePath2 = "file://" + safePath2.split('/').map(encodeURIComponent).join('/');
    }

    const getSafeDuration = (ref: any) => {
      try {
        if (!ref.current) return 7200;
        if (typeof ref.current.getDuration === 'function') return Math.floor(ref.current.getDuration()) || 7200;
        if (ref.current.duration) return Math.floor(ref.current.duration) || 7200;
      } catch (e) {}
      return 7200;
    };

    const realDuration1 = getSafeDuration(player1Ref);
    const realDuration2 = getSafeDuration(player2Ref);

    const hasVideo1Events = eventos.some(e => e.video_index === 1);
    const hasVideo2Events = eventos.some(e => e.video_index === 2);

    let assetsXML = '';
    if (hasVideo1Events) {
      assetsXML += `\n        <asset id="r2" name="Video Original 1" src="${safePath1}" start="0s" duration="${realDuration1}s" hasVideo="1" format="r1" hasAudio="1"/>`;
    }
    if (hasVideo2Events) {
      assetsXML += `\n        <asset id="r3" name="Video Original 2" src="${safePath2}" start="0s" duration="${realDuration2}s" hasVideo="1" format="r1" hasAudio="1"/>`;
    }

    const mergedClips: any[] = [];
    const sortedEvents = [...eventos].sort((a, b) => {
      if (a.video_index !== b.video_index) return a.video_index - b.video_index;
      return a.tiempo_segundos - b.tiempo_segundos;
    });

    sortedEvents.forEach((e) => {
      const start = Math.max(0, e.tiempo_segundos - 5);
      const end = start + 15;
      const safeDesc = (e.descripcion || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const name = `V${e.video_index}: ${e.tipo} - ${safeDesc}`;
      const assetRef = e.video_index === 1 ? 'r2' : 'r3';
      
      if (mergedClips.length > 0) {
        const lastClip = mergedClips[mergedClips.length - 1];
        if (lastClip.assetRef === assetRef && start <= lastClip.end) {
          lastClip.end = Math.max(lastClip.end, end);
          lastClip.name += ` y ${e.tipo}`;
          return;
        }
      }
      mergedClips.push({ start, end, name, assetRef });
    });

    mergedClips.forEach((clip) => {
      const duration = clip.end - clip.start;
      clipsXML += `
                        <asset-clip name="${clip.name}" ref="${clip.assetRef}" offset="${currentOffset}s" duration="${duration}s" start="${clip.start}s" tcFormat="NDF"/>`;
      currentOffset += duration;
    });

    const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
    <resources>
        <format id="r1" name="FFVideoFormat1080p25" frameDuration="1/25s" width="1920" height="1080"/>${assetsXML}
    </resources>
    <library>
        <event name="Analisis Seneca">
            <project name="Cortes Rival">
                <sequence format="r1" tcStart="0s" tcFormat="NDF">
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
    link.setAttribute("download", "analisis_rival.fcpxml");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowXMLModal(false);
  };

  const exportFFmpegScript = () => {
    let script = `#!/bin/bash\n\n`;
    script += `# Script para descargar y unir los cortes automáticamente en Mac/Linux\n`;
    script += `# Asegúrate de tener instalados 'yt-dlp' y 'ffmpeg'\n`;
    script += `# En Mac puedes instalarlos con: brew install yt-dlp ffmpeg\n\n`;
    
    script += `mkdir -p cortes_temporales\ncd cortes_temporales\n\n`;
    
    const fileList: string[] = [];
    eventos.forEach((e, index) => {
      const start = Math.max(0, e.tiempo_segundos - 5);
      const startStr = formatTime(start);
      const endStr = formatTime(start + 15);
      const filename = `corte_${String(index).padStart(3, '0')}.mp4`;
      fileList.push(`file '${filename}'`);
      
      const url = e.video_index === 1 ? video1Url : video2Url;
      
      script += `echo "Descargando corte ${index + 1} de ${eventos.length}..."\n`;
      script += `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" --download-sections "*${startStr}-${endStr}" "${url}" -o "${filename}"\n`;
    });
    
    script += `\necho "Creando lista de concatenación..."\n`;
    script += `cat <<EOF > lista.txt\n${fileList.join('\n')}\nEOF\n\n`;
    
    script += `echo "Uniendo todos los cortes en analisis_rival.mp4..."\n`;
    script += `ffmpeg -f concat -safe 0 -i lista.txt -c copy ../analisis_rival.mp4\n\n`;
    
    script += `cd ..\nrm -rf cortes_temporales\n\n`;
    script += `echo "¡Proceso terminado con éxito! Tu vídeo es analisis_rival.mp4"\n`;

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(script);
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "generar_video_rival.sh");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlayCut = (segundos: number, videoIndex: 1 | 2) => {
    setActiveVideo(videoIndex);
    
    // Give state time to update and mount the right player if using tabs
    setTimeout(() => {
      const playerRef = videoIndex === 1 ? player1Ref : player2Ref;
      if (playerRef.current) {
        const start = Math.max(0, segundos - 5);
        const player = playerRef.current as any;
        player.currentTime = start;
        setPlayingCutEnd(segundos + 10);
        player.play();
      }
    }, 100);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }

  const activeUrl = activeVideo === 1 ? video1Url : video2Url;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px] animate-in fade-in duration-500">
      
      {/* Lado Izquierdo: Reproductor y Botones de Evento */}
      <div className="flex flex-col space-y-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          
          {/* Tabs Vídeo 1 / Vídeo 2 */}
          <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              onClick={() => setActiveVideo(1)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all",
                activeVideo === 1
                  ? "bg-white dark:bg-neutral-900 text-red-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
              )}
            >
              <Video size={16} />
              Vídeo 1
            </button>
            <button
              onClick={() => setActiveVideo(2)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all",
                activeVideo === 2
                  ? "bg-white dark:bg-neutral-900 text-red-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
              )}
            >
              <Video size={16} />
              Vídeo 2
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={activeVideo === 1 ? video1Url : video2Url}
                onChange={(e) => activeVideo === 1 ? setVideo1Url(e.target.value) : setVideo2Url(e.target.value)}
                placeholder="Ej: https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
              />
              <button 
                onClick={saveVideoUrls}
                disabled={savingVideos}
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                {savingVideos ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              </button>
            </div>
          </div>

          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500">
            <div className={cn("w-full h-full", activeVideo !== 1 && "hidden")}>
              {video1Url && (
                <ReactPlayer
                  ref={player1Ref}
                  src={video1Url.trim()}
                  width="100%"
                  height="100%"
                  controls
                  onTimeUpdate={(e: any) => {
                    const currentTime = e.target.currentTime;
                    if (playingCutEnd && currentTime >= playingCutEnd) {
                      e.target.pause();
                      setPlayingCutEnd(null);
                    }
                  }}
                />
              )}
            </div>
            <div className={cn("w-full h-full", activeVideo !== 2 && "hidden")}>
              {video2Url && (
                <ReactPlayer
                  ref={player2Ref}
                  src={video2Url.trim()}
                  width="100%"
                  height="100%"
                  controls
                  onTimeUpdate={(e: any) => {
                    const currentTime = e.target.currentTime;
                    if (playingCutEnd && currentTime >= playingCutEnd) {
                      e.target.pause();
                      setPlayingCutEnd(null);
                    }
                  }}
                />
              )}
            </div>
            
            {!activeUrl && (
              <span className="font-medium text-sm absolute">Introduce la URL del vídeo {activeVideo} para visualizar</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="font-black text-lg text-neutral-900 dark:text-white uppercase flex items-center gap-2">
            Registrar en Vídeo {activeVideo}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {EVENT_TYPES.map((ev) => (
              <button
                key={ev.tipo}
                onClick={() => handleAddEvent(ev.tipo)}
                className={cn(
                  "py-3 rounded-2xl font-black text-sm shadow-sm transition-transform active:scale-95 flex flex-col items-center justify-center gap-1",
                  ev.color, ev.text
                )}
              >
                <span>{ev.tipo}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 text-center mt-2 flex items-center justify-center gap-1">
            <AlertCircle size={12}/> Se registrará un corte automático en el Vídeo {activeVideo}
          </p>
        </div>
      </div>

      {/* Lado Derecho: Historial */}
      <div className="flex flex-col bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <h3 className="font-black text-lg text-neutral-900 dark:text-white uppercase flex items-center gap-2">
            Historial de Análisis
            <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs py-1 px-2 rounded-full">{eventos.length}</span>
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={exportFFmpegScript}
              title="Descargar vídeo final MP4 (Script)"
              className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-2"
            >
              <Terminal size={18} />
              <span className="text-xs font-bold hidden sm:inline">Generar .MP4</span>
            </button>
            <button
              onClick={exportFCPXML}
              title="Exportar para DaVinci / Final Cut (FCPXML)"
              className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
            >
              <Film size={18} />
              <span className="text-xs font-bold hidden sm:inline">DaVinci</span>
            </button>
            <button
              onClick={exportCSV}
              title="Exportar CSV"
              className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <Download size={18} />
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
                  
                  <div className="flex flex-col items-center gap-2 w-28">
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold w-full text-center truncate", eventType?.color, eventType?.text)}>
                      {ev.tipo}
                    </span>
                    <button 
                      onClick={() => handlePlayCut(ev.tiempo_segundos, ev.video_index)}
                      className="flex items-center justify-center gap-1 text-sm font-black text-red-600 dark:text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Play size={14} className="fill-current"/> {formatTime(ev.tiempo_segundos)}
                    </button>
                    <span className="text-[10px] font-bold text-neutral-400">
                      VÍDEO {ev.video_index}
                    </span>
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

      {showXMLModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <Film className="text-red-500" />
              Vincular Vídeos Reales
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Introduce las rutas absolutas de los vídeos en tu Mac para que DaVinci Resolve pueda importarlos directamente.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">Ruta del Vídeo 1</label>
                <input 
                  type="text" 
                  value={localVideo1Path} 
                  onChange={(e) => setLocalVideo1Path(e.target.value)}
                  placeholder="/Users/pedroluna/Downloads/Segunda parte Santaella 1.mp4"
                  className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 focus:ring-red-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">Ruta del Vídeo 2</label>
                <input 
                  type="text" 
                  value={localVideo2Path} 
                  onChange={(e) => setLocalVideo2Path(e.target.value)}
                  placeholder="/Users/pedroluna/Downloads/Segunda parte Santaella 2.mp4"
                  className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl focus:ring-2 focus:ring-red-500 transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button onClick={() => setShowXMLModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                Cancelar
              </button>
              <button onClick={generateFinalFCPXML} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 transition-colors shadow-sm">
                Descargar FCPXML
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
