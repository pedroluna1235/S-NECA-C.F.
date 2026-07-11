import { useState, useEffect } from 'react';
import { Save, Loader2, Presentation, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { BadgeSelector } from './BadgeSelector';

interface InformeRivalTabProps {
  matchId: string;
}

interface InformeData {
  id?: string;
  partido_id: string;
  salida_balon: string | null;
  presion: string | null;
  bloque: string | null;
  linea_defensiva: string | null;
  transicion_ofensiva: string | null;
  transicion_defensiva: string | null;
  google_slides_url: string | null;
  vimeo_youtube_url: string | null;
}

const BADGE_CONFIG = {
  salida_balon: { label: 'Salida de Balón', options: ['En corto', 'En largo', 'Mixto'] },
  presion: { label: 'Presión', options: ['Alta', 'Media', 'Baja'] },
  bloque: { label: 'Bloque', options: ['Alto', 'Medio', 'Bajo'] },
  linea_defensiva: { label: 'Línea Defensiva', options: ['Alta', 'Media', 'Baja'] },
  transicion_ofensiva: { label: 'Transición Ofensiva', options: ['Directa', 'Posesión'] },
  transicion_defensiva: { label: 'Transición Defensiva', options: ['Presión Inmediata', 'Repliegue'] },
};

export function InformeRivalTab({ matchId }: InformeRivalTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [informeId, setInformeId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<InformeData>({
    partido_id: matchId,
    salida_balon: null,
    presion: null,
    bloque: null,
    linea_defensiva: null,
    transicion_ofensiva: null,
    transicion_defensiva: null,
    google_slides_url: '',
    vimeo_youtube_url: '',
  });

  useEffect(() => {
    const fetchInforme = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('informe_rival')
          .select('*')
          .eq('partido_id', matchId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
          throw error;
        }

        if (data) {
          setInformeId(data.id);
          setFormData({
            ...data,
            salida_balon: data.salida_balon?.[0] || null,
            presion: data.presion?.[0] || null,
            bloque: data.bloque?.[0] || null,
            linea_defensiva: data.linea_defensiva?.[0] || null,
            transicion_ofensiva: data.transicion_ofensiva?.[0] || null,
            transicion_defensiva: data.transicion_defensiva?.[0] || null,
            google_slides_url: data.google_slides_url || '',
            vimeo_youtube_url: data.vimeo_youtube_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching informe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInforme();
  }, [matchId]);

  const handleBadgeChange = (key: keyof InformeData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        salida_balon: formData.salida_balon ? [formData.salida_balon] : null,
        presion: formData.presion ? [formData.presion] : null,
        bloque: formData.bloque ? [formData.bloque] : null,
        linea_defensiva: formData.linea_defensiva ? [formData.linea_defensiva] : null,
        transicion_ofensiva: formData.transicion_ofensiva ? [formData.transicion_ofensiva] : null,
        transicion_defensiva: formData.transicion_defensiva ? [formData.transicion_defensiva] : null,
        google_slides_url: formData.google_slides_url || null,
        vimeo_youtube_url: formData.vimeo_youtube_url || null,
      };

      if (informeId) {
        // Update
        const { error } = await supabase
          .from('informe_rival')
          .update(payload)
          .eq('id', informeId);
        
        if (error) throw error;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('informe_rival')
          .insert([payload])
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setInformeId(data.id);
        }
      }
      
      alert('Informe guardado correctamente');
    } catch (error) {
      console.error('Error saving informe:', error);
      alert('Error al guardar el informe');
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract embed url for youtube/vimeo or slides
  const getEmbedUrl = (url: string | null, type: 'video' | 'slides') => {
    if (!url) return null;
    
    if (type === 'video') {
      if (url.includes('youtube.com/watch?v=')) {
        return url.replace('watch?v=', 'embed/');
      }
      if (url.includes('youtu.be/')) {
        return url.replace('youtu.be/', 'youtube.com/embed/');
      }
      if (url.includes('vimeo.com/')) {
        const id = url.split('/').pop();
        return `https://player.vimeo.com/video/${id}`;
      }
    }
    
    if (type === 'slides' && url.includes('docs.google.com/presentation')) {
      // If it ends with /edit... replace with /embed...
      if (url.includes('/edit')) {
        return url.substring(0, url.indexOf('/edit')) + '/embed?start=false&loop=false&delayms=3000';
      }
      return url;
    }
    
    return url;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      
      {/* Floating Save Button */}
      <div className="absolute top-0 right-0 z-10 hidden sm:block">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70"
        >
          <span className={cn("flex items-center gap-2", !saving && "hidden")}>
            <Loader2 size={18} className="animate-spin" />
            <span>Guardando...</span>
          </span>
          <span className={cn(saving && "hidden")}>
            <Save size={18} />
            <span>Guardar Informe</span>
          </span>
        </button>
      </div>

      <section>
        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-6">Características del Rival</h3>
        
        <div className="space-y-6 bg-neutral-50 dark:bg-neutral-900/50 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800">
          {(Object.keys(BADGE_CONFIG) as Array<keyof typeof BADGE_CONFIG>).map((key) => (
            <BadgeSelector
              key={key}
              label={BADGE_CONFIG[key].label}
              options={BADGE_CONFIG[key].options}
              selectedOption={formData[key] as string}
              onChange={(val) => handleBadgeChange(key, val)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-6">Contenido Multimedia</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Slides */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
              <Presentation size={20} className="text-red-500" />
              <span>Presentación Google Slides</span>
            </div>
            
            <input 
              type="text" 
              name="google_slides_url"
              value={formData.google_slides_url || ''}
              onChange={handleInputChange}
              placeholder="Pega el enlace de Google Slides aquí..."
              className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
            />
            
            <div className="w-full aspect-video bg-neutral-100 dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 overflow-hidden relative flex items-center justify-center">
              {formData.google_slides_url ? (
                <iframe 
                  src={getEmbedUrl(formData.google_slides_url, 'slides') || ''}
                  className="w-full h-full absolute inset-0"
                  allowFullScreen
                />
              ) : (
                <span className="text-neutral-400 font-medium">Previsualización de Slides</span>
              )}
            </div>
          </div>

          {/* Columna Derecha: Video */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
              <Video size={20} className="text-red-500" />
              <span>Vídeo Vimeo / YouTube</span>
            </div>
            
            <input 
              type="text" 
              name="vimeo_youtube_url"
              value={formData.vimeo_youtube_url || ''}
              onChange={handleInputChange}
              placeholder="Pega el enlace de Vimeo o YouTube aquí..."
              className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
            />
            
            <div className="w-full aspect-video bg-neutral-100 dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 overflow-hidden relative flex items-center justify-center">
              {formData.vimeo_youtube_url ? (
                <iframe 
                  src={getEmbedUrl(formData.vimeo_youtube_url, 'video') || ''}
                  className="w-full h-full absolute inset-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <span className="text-neutral-400 font-medium">Previsualización de Vídeo</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Save Button */}
      <div className="sm:hidden fixed bottom-6 left-6 right-6 z-20">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70"
        >
          <span className={cn("flex items-center gap-2", !saving && "hidden")}>
            <Loader2 size={20} className="animate-spin" />
            <span>Guardando...</span>
          </span>
          <span className={cn(saving && "hidden")}>
            <Save size={20} />
            <span>Guardar Informe</span>
          </span>
        </button>
      </div>
    </div>
  );
}
