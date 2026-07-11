import { useState } from 'react';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  url: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  bucket: string;
  folder?: string;
  label?: string;
  accept?: string;
  className?: string;
}

export function FileUploader({ url, onUpload, onRemove, bucket, folder = '', label = 'Subir Archivo', accept = '*', className }: FileUploaderProps) {
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
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo: ' + (error.message || String(error)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative group w-full bg-neutral-100 dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center transition-colors", !url && "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10", className)}>
      {url ? (
        <div className="flex items-center justify-between w-full p-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
              <FileText size={24} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300 truncate">Documento subido</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate">
                Ver archivo
              </a>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 bg-white/90 dark:bg-neutral-800 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
            title="Eliminar archivo"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full cursor-pointer p-6 text-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 mb-2 transition-colors" />
          )}
          <span className="text-sm font-medium text-neutral-500 group-hover:text-blue-600 transition-colors">
            {uploading ? 'Subiendo...' : label}
          </span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
