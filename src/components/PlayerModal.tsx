import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlayerModal({ isOpen, onClose, onSuccess }: PlayerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    dorsal: '',
    demarcacion: 'Portero',
    fecha_nacimiento: '',
  });

  const demarcaciones = ['Portero', 'Defensa', 'Centrocampista', 'Delantero'];

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let foto_url = null;
      const file = fileInputRef.current?.files?.[0];

      // 1. Subir foto si existe
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('FOTOS JUGADORES')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('FOTOS JUGADORES')
          .getPublicUrl(fileName);
          
        foto_url = publicUrlData.publicUrl;
      }

      // 2. Crear registro en BD
      const { error: insertError } = await supabase
        .from('jugadores')
        .insert([
          {
            nombre: formData.nombre,
            dorsal: formData.dorsal ? parseInt(formData.dorsal) : null,
            demarcacion: formData.demarcacion,
            fecha_nacimiento: formData.fecha_nacimiento || null,
            foto_url,
          }
        ]);

      if (insertError) {
        throw new Error(`Error al guardar jugador: ${insertError.message}`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Añadir Jugador</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
              {error}
            </div>
          )}

          {/* Subida de foto */}
          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative w-32 h-40 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/5 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-neutral-400 group-hover:text-red-500 mb-2 transition-colors" />
                  <span className="text-xs text-neutral-500 group-hover:text-red-600 font-medium text-center px-2">Subir Foto</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Nombre Completo *</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Dorsal</label>
                <input 
                  type="number" 
                  min="1" max="99"
                  className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  value={formData.dorsal}
                  onChange={e => setFormData({...formData, dorsal: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Demarcación</label>
                <select 
                  className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none"
                  value={formData.demarcacion}
                  onChange={e => setFormData({...formData, demarcacion: e.target.value})}
                >
                  {demarcaciones.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Fecha de Nacimiento</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                value={formData.fecha_nacimiento}
                onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-md",
                isSubmitting 
                  ? "bg-red-400 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Guardando...
                </>
              ) : (
                'Añadir Jugador'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
