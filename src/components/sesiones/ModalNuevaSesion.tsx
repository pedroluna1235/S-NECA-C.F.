import { useState, useRef } from 'react';
import { X, Upload, File as FileIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ModalNuevaSesionProps {
  fecha: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalNuevaSesion({ fecha, onClose, onSuccess }: ModalNuevaSesionProps) {
  const [titulo, setTitulo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor, selecciona un archivo PDF válido.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !file) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Subir archivo a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `sesiones/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('PDF_SESIONES')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('PDF_SESIONES')
        .getPublicUrl(filePath);

      // 2. Insertar registro en la base de datos
      // Formateamos la fecha a YYYY-MM-DD para la base de datos respetando la zona horaria local
      const fechaLocalString = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      const { error: insertError } = await supabase
        .from('sesiones')
        .insert([
          {
            fecha: fechaLocalString,
            titulo: titulo.trim(),
            pdf_url: publicUrl,
            observaciones: observaciones.trim() || null
          }
        ]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error al guardar la sesión:', err);
      setError(err.message || 'Error al guardar la sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Nueva Sesión
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Fecha Seleccionada
            </label>
            <div className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 font-medium">
              {fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Título de la Sesión
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Entrenamiento Táctico Defensivo"
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white transition-shadow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Observaciones (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Incidencias, jugadores destacados, notas..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 dark:text-white transition-shadow resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Archivo PDF
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                file 
                  ? 'border-red-500 bg-red-50 dark:bg-red-500/10' 
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500">
                    <FileIcon size={24} />
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1 px-4">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2 text-neutral-500 dark:text-neutral-400">
                  <Upload size={32} />
                  <p className="text-sm font-medium">Haz clic para seleccionar el PDF</p>
                  <p className="text-xs">Solo formato .pdf</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !titulo || !file}
              className="px-5 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
