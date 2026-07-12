import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, ExternalLink, FileText, CalendarDays, Edit2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ModalEditarObservaciones } from './ModalEditarObservaciones';
import type { Sesion } from '../../pages/Sesiones';

interface HistorialSesionesProps {
  sesiones: Sesion[];
  onSesionDeleted: () => void;
}

export function HistorialSesiones({ sesiones, onSesionDeleted }: HistorialSesionesProps) {
  const [editingSesion, setEditingSesion] = useState<Sesion | null>(null);
  
  const handleDelete = async (id: string, pdfUrl: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Intentar eliminar el archivo de Storage primero
      if (pdfUrl) {
        try {
          const urlObj = new URL(pdfUrl);
          const pathParts = urlObj.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          // Asumiendo que el archivo está en la carpeta 'sesiones'
          const filePath = `sesiones/${fileName}`;
          
          await supabase.storage
            .from('PDF_SESIONES')
            .remove([filePath]);
        } catch (e) {
          console.warn('No se pudo eliminar el PDF de Storage, puede que no exista o la URL sea inválida.', e);
        }
      }

      // Eliminar registro de la base de datos
      const { error } = await supabase
        .from('sesiones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      onSesionDeleted();
    } catch (error) {
      console.error('Error al eliminar la sesión:', error);
      alert('Hubo un error al eliminar la sesión.');
    }
  };

  if (sesiones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay sesiones registradas</p>
        <p className="text-sm">Añade una nueva sesión desde el calendario.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sesiones.map((sesion, index) => {
        // Calculamos el número de sesión de forma visual e independiente de la BD,
        // para que al eliminar sesiones antiguas, la numeración se reorganice sin saltos.
        // Como están ordenadas de más reciente a más antigua (descendente),
        // la más antigua tiene el índice sesiones.length - 1, que será la #1.
        const numSesion = sesiones.length - index;
        const fechaFormat = format(parseISO(sesion.fecha), "dd 'de' MMMM, yyyy", { locale: es });

        return (
          <div 
            key={sesion.id}
            className="bg-white dark:bg-neutral-950 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Sesión #{numSesion}
              </span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingSesion(sesion)}
                  className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-500 p-2 transition-colors"
                  title="Editar observaciones"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(sesion.id, sesion.pdf_url)}
                  className="text-neutral-400 hover:text-red-600 dark:hover:text-red-500 p-2 transition-colors"
                  title="Eliminar sesión"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2 flex-1">
              {sesion.titulo}
            </h3>

            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              <CalendarDays size={16} />
              <span className="capitalize">{fechaFormat}</span>
            </div>

            {sesion.observaciones && (
              <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 italic flex-1 overflow-y-auto">
                {sesion.observaciones}
              </div>
            )}
            
            {sesion.asistentes && sesion.asistentes.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                  <Users size={14} />
                  {sesion.asistentes.length} Asistentes
                </span>
              </div>
            )}
            
            <a
              href={sesion.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-xl font-medium transition-colors"
            >
              <FileText size={18} />
              Ver PDF
              <ExternalLink size={16} className="ml-1" />
            </a>
          </div>
        );
      })}
      
      {editingSesion && (
        <ModalEditarObservaciones
          sesion={editingSesion}
          onClose={() => setEditingSesion(null)}
          onSuccess={() => {
            setEditingSesion(null);
            onSesionDeleted(); // Reutilizamos el callback para recargar la lista
          }}
        />
      )}
    </div>
  );
}
