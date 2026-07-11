import { useState, useEffect } from 'react';
import { Save, Loader2, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ImageUploader } from './ImageUploader';

interface ABPTabProps {
  matchId: string;
}

interface ABPData {
  id?: string;
  partido_id: string;
  tipo: 'Ofensivo' | 'Defensivo';
  corner1_img_url: string | null;
  corner1_detalle: string;
  corner1_video_url: string;
  corner2_img_url: string | null;
  corner2_detalle: string;
  corner2_video_url: string;
  corner3_img_url: string | null;
  corner3_detalle: string;
  corner3_video_url: string;
  corner4_img_url: string | null;
  corner4_detalle: string;
  corner4_video_url: string;
}

export function ABPTab({ matchId }: ABPTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState<'Ofensivo' | 'Defensivo'>('Ofensivo');
  
  const [dataOfensivo, setDataOfensivo] = useState<ABPData | null>(null);
  const [dataDefensivo, setDataDefensivo] = useState<ABPData | null>(null);

  useEffect(() => {
    const fetchABP = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('abp_partido')
          .select('*')
          .eq('partido_id', matchId);

        if (error) throw error;

        const ofen = data?.find(d => d.tipo === 'Ofensivo');
        const def = data?.find(d => d.tipo === 'Defensivo');
        
        if (ofen) setDataOfensivo(ofen);
        if (def) setDataDefensivo(def);

      } catch (error) {
        console.error('Error fetching ABP:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchABP();
  }, [matchId]);

  const currentData = (tipo === 'Ofensivo' ? dataOfensivo : dataDefensivo) || {
    partido_id: matchId, tipo,
    corner1_img_url: null, corner1_detalle: '', corner1_video_url: '',
    corner2_img_url: null, corner2_detalle: '', corner2_video_url: '',
    corner3_img_url: null, corner3_detalle: '', corner3_video_url: '',
    corner4_img_url: null, corner4_detalle: '', corner4_video_url: '',
  };

  const updateCurrentData = (updates: Partial<ABPData>) => {
    if (tipo === 'Ofensivo') {
      setDataOfensivo(prev => ({ ...prev, ...updates } as ABPData));
    } else {
      setDataDefensivo(prev => ({ ...prev, ...updates } as ABPData));
    }
  };

  const handleInputChange = (cornerIndex: number, field: string, value: string) => {
    updateCurrentData({ [`corner${cornerIndex}_${field}`]: value });
  };

  const handleImageChange = (cornerIndex: number, url: string | null) => {
    updateCurrentData({ [`corner${cornerIndex}_img_url`]: url });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...currentData, partido_id: matchId, tipo };
      
      if (payload.id) {
        const { error } = await supabase.from('abp_partido').update(payload).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('abp_partido').insert([payload]).select().single();
        if (error) throw error;
        if (data) {
          if (tipo === 'Ofensivo') setDataOfensivo(data);
          else setDataDefensivo(data);
        }
      }
      alert('ABP guardado correctamente');
    } catch (error) {
      console.error('Error saving ABP:', error);
      alert('Error al guardar ABP');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }

  const renderCorner = (index: number) => (
    <div key={index} className="flex flex-col space-y-4 bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800">
      <h4 className="font-black text-lg text-neutral-900 dark:text-white uppercase">CÓRNER {index}</h4>
      
      <ImageUploader 
        bucket="partidos" 
        url={currentData[`corner${index}_img_url` as keyof ABPData] as string}
        onUpload={(url) => handleImageChange(index, url)}
        onRemove={() => handleImageChange(index, null)}
        label="Esquema Táctico"
        className="aspect-[4/3]"
      />

      <div className="space-y-1">
        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Detalle imagen</label>
        <input
          type="text"
          value={currentData[`corner${index}_detalle` as keyof ABPData] as string || ''}
          onChange={(e) => handleInputChange(index, 'detalle', e.target.value)}
          placeholder="Añade un detalle..."
          className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
          <Video size={14} className="text-red-500"/> URL Vimeo/YouTube
        </label>
        <input
          type="text"
          value={currentData[`corner${index}_video_url` as keyof ABPData] as string || ''}
          onChange={(e) => handleInputChange(index, 'video_url', e.target.value)}
          placeholder="URL del vídeo..."
          className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      
      {/* Top Bar: Switch and Save Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        
        {/* Switch */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-full sm:w-auto">
          {(['Ofensivo', 'Defensivo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all",
                tipo === t 
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" 
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70"
        >
          <span className={cn("flex items-center gap-2", !saving && "hidden")}><Loader2 size={18} className="animate-spin" /><span>Guardando...</span></span>
          <span className={cn(saving && "hidden")}><Save size={18} /><span>Guardar {tipo}</span></span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(num => renderCorner(num))}
      </div>
    </div>
  );
}
