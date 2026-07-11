import { useState, useEffect } from 'react';
import { Save, Loader2, Video, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ImageUploader } from './ImageUploader';

interface PlanPartidoTabProps {
  matchId: string;
}

interface PlanData {
  id?: string;
  partido_id: string;
  ataque_notas: string;
  ataque_video_url: string;
  ataque_img1_url: string | null;
  ataque_img2_url: string | null;
  ataque_img3_url: string | null;
  ataque_pdf_url: string;
  defensa_notas: string;
  defensa_video_url: string;
  defensa_img1_url: string | null;
  defensa_img2_url: string | null;
  defensa_img3_url: string | null;
  defensa_pdf_url: string;
  transiciones_notas: string;
  transiciones_video_url: string;
  transiciones_img1_url: string | null;
  transiciones_img2_url: string | null;
  transiciones_img3_url: string | null;
  transiciones_pdf_url: string;
}

type Fases = 'ataque' | 'defensa' | 'transiciones';

export function PlanPartidoTab({ matchId }: PlanPartidoTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PlanData>({
    partido_id: matchId,
    ataque_notas: '', ataque_video_url: '', ataque_img1_url: null, ataque_img2_url: null, ataque_img3_url: null, ataque_pdf_url: '',
    defensa_notas: '', defensa_video_url: '', defensa_img1_url: null, defensa_img2_url: null, defensa_img3_url: null, defensa_pdf_url: '',
    transiciones_notas: '', transiciones_video_url: '', transiciones_img1_url: null, transiciones_img2_url: null, transiciones_img3_url: null, transiciones_pdf_url: ''
  });

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('plan_partido')
          .select('*')
          .eq('partido_id', matchId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setPlanId(data.id);
          setFormData({
            ...formData,
            ...data,
            ataque_notas: data.ataque_notas || '',
            ataque_video_url: data.ataque_video_url || '',
            ataque_pdf_url: data.ataque_pdf_url || '',
            defensa_notas: data.defensa_notas || '',
            defensa_video_url: data.defensa_video_url || '',
            defensa_pdf_url: data.defensa_pdf_url || '',
            transiciones_notas: data.transiciones_notas || '',
            transiciones_video_url: data.transiciones_video_url || '',
            transiciones_pdf_url: data.transiciones_pdf_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [matchId]);

  const handleInputChange = (fase: Fases, field: string, value: string) => {
    setFormData(prev => ({ ...prev, [`${fase}_${field}`]: value }));
  };

  const handleImageChange = (fase: Fases, index: number, url: string | null) => {
    setFormData(prev => ({ ...prev, [`${fase}_img${index}_url`]: url }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (planId) {
        const { error } = await supabase.from('plan_partido').update(formData).eq('id', planId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('plan_partido').insert([formData]).select().single();
        if (error) throw error;
        if (data) setPlanId(data.id);
      }
      alert('Plan de partido guardado correctamente');
    } catch (error: any) {
      console.error('Error saving plan:', error);
      alert('Error al guardar el plan de partido: ' + (error.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
  }

  const Column = ({ title, fase, icon }: { title: string, fase: Fases, icon: React.ReactNode }) => (
    <div className="flex flex-col space-y-4 bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-sm text-red-500">
          {icon}
        </div>
        <h4 className="font-black text-lg text-neutral-900 dark:text-white uppercase">{title}</h4>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Notas abiertas</label>
        <textarea
          value={formData[`${fase}_notas` as keyof PlanData] as string}
          onChange={(e) => handleInputChange(fase, 'notas', e.target.value)}
          placeholder={`Escribe aquí las notas para ${title.toLowerCase()}...`}
          className="w-full h-32 px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
          <Video size={14} className="text-red-500"/> Vídeo (Vimeo/YouTube)
        </label>
        <input
          type="text"
          value={formData[`${fase}_video_url` as keyof PlanData] as string}
          onChange={(e) => handleInputChange(fase, 'video_url', e.target.value)}
          placeholder="URL del vídeo..."
          className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <ImageUploader 
          bucket="partidos" 
          url={formData[`${fase}_img1_url` as keyof PlanData] as string}
          onUpload={(url) => handleImageChange(fase, 1, url)}
          onRemove={() => handleImageChange(fase, 1, null)}
          label="Imagen 1"
          className="aspect-square"
        />
        <ImageUploader 
          bucket="partidos" 
          url={formData[`${fase}_img2_url` as keyof PlanData] as string}
          onUpload={(url) => handleImageChange(fase, 2, url)}
          onRemove={() => handleImageChange(fase, 2, null)}
          label="Imagen 2"
          className="aspect-square"
        />
        <ImageUploader 
          bucket="partidos" 
          url={formData[`${fase}_img3_url` as keyof PlanData] as string}
          onUpload={(url) => handleImageChange(fase, 3, url)}
          onRemove={() => handleImageChange(fase, 3, null)}
          label="Imagen 3"
          className="col-span-2 aspect-[2/1]"
        />
      </div>

      <div className="space-y-1 pt-2">
        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
          <FileText size={14} className="text-red-500"/> PDF (Google Drive)
        </label>
        <input
          type="text"
          value={formData[`${fase}_pdf_url` as keyof PlanData] as string}
          onChange={(e) => handleInputChange(fase, 'pdf_url', e.target.value)}
          placeholder="URL del PDF..."
          className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      <div className="absolute top-0 right-0 z-10 hidden sm:block">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70"
        >
          <span className={cn("flex items-center gap-2", !saving && "hidden")}><Loader2 size={18} className="animate-spin" /><span>Guardando...</span></span>
          <span className={cn(saving && "hidden")}><Save size={18} /><span>Guardar Plan</span></span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-12 sm:pt-0">
        <Column title="Ataque" fase="ataque" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 12l4-4M12 12l-4 4M12 12l4 4M12 12l-4-4"/></svg>} />
        <Column title="Defensa" fase="defensa" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
        <Column title="Transiciones" fase="transiciones" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>} />
      </div>

      <div className="sm:hidden fixed bottom-6 left-6 right-6 z-20">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70"
        >
          <span className={cn("flex items-center gap-2", !saving && "hidden")}><Loader2 size={20} className="animate-spin" /><span>Guardando...</span></span>
          <span className={cn(saving && "hidden")}><Save size={20} /><span>Guardar Plan</span></span>
        </button>
      </div>
    </div>
  );
}
