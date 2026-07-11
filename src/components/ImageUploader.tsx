import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ImageUploaderProps {
  url: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  bucket: string;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUploader({ url, onUpload, onRemove, bucket, folder = '', label = 'Subir Imagen', className }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrlData.publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen: ' + (error.message || String(error)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative group w-full aspect-video bg-neutral-100 dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center transition-colors", !url && "hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10", className)}>
      {url ? (
        <>
          <img src={url} alt={label} className="w-full h-full object-contain p-2" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-neutral-900/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-neutral-400 group-hover:text-red-500 mb-2 transition-colors" />
          )}
          <span className="text-sm font-medium text-neutral-500 group-hover:text-red-600 transition-colors">
            {uploading ? 'Subiendo...' : label}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
