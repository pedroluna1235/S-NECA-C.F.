import { useState, useEffect } from 'react';
import { X, Video, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { type Player } from './PlayerCard';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: () => void;
}

const getYoutubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function VideoModal({ isOpen, onClose, player, onSuccess }: VideoModalProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      setVideoUrl(player.video_url || '');
      setIsEditing(!player.video_url); 
    }
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ video_url: videoUrl })
        .eq('id', player.id);

      if (error) throw error;
      onSuccess();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Error al guardar el vídeo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const videoId = getYoutubeVideoId(videoUrl);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
              <Video size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Vídeo Destacado</h2>
              <p className="text-sm text-neutral-500">{player.nombre}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isEditing && videoUrl ? (
            <div className="space-y-6">
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner relative">
                {videoId ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${videoId}`} 
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">URL de vídeo no válida</div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 border border-neutral-200 dark:border-neutral-700"
                >
                  Cambiar vídeo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-8">
              <div className="text-center max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Añadir enlace de YouTube</h3>
                <p className="text-sm text-neutral-500">Pega el enlace del vídeo de *highlights* o jugadas destacadas de {player.nombre}.</p>
              </div>
              
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                {player.video_url && (
                  <button
                    onClick={() => {
                      setVideoUrl(player.video_url || '');
                      setIsEditing(false);
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!videoUrl || isSubmitting}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md",
                    !videoUrl || isSubmitting
                      ? "bg-red-400 cursor-not-allowed" 
                      : "bg-red-600 hover:bg-red-700 active:scale-95"
                  )}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Guardar y Ver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
