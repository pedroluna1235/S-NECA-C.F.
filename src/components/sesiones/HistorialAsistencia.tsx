import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X as XIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Sesion } from '../../pages/Sesiones';

interface Jugador {
  id: string;
  nombre: string;
  dorsal: number | null;
}

interface HistorialAsistenciaProps {
  sesiones: Sesion[];
}

export function HistorialAsistencia({ sesiones }: HistorialAsistenciaProps) {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJugadores = async () => {
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('id, nombre, dorsal')
          .order('nombre');
        
        if (error) throw error;
        setJugadores(data || []);
      } catch (err) {
        console.error('Error cargando jugadores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJugadores();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-600 w-8 h-8" />
      </div>
    );
  }

  // Ordenar sesiones cronológicamente (más antigua primero) para mostrar de izquierda a derecha
  const sesionesOrdenadas = [...sesiones].sort((a, b) => 
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  return (
    <div className="overflow-x-auto bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <tr>
            <th className="sticky left-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-4 font-semibold text-neutral-900 dark:text-white border-r border-neutral-200 dark:border-neutral-800 shadow-[1px_0_0_0_#e5e5e5] dark:shadow-[1px_0_0_0_#262626]">
              Jugador
            </th>
            {sesionesOrdenadas.map((sesion, index) => {
              const numSesion = index + 1;
              return (
                <th key={sesion.id} className="px-4 py-4 font-semibold text-neutral-900 dark:text-white text-center min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {format(parseISO(sesion.fecha), "dd MMM", { locale: es })}
                    </span>
                    <span title={sesion.titulo} className="truncate max-w-[100px]">
                      S{numSesion}
                    </span>
                  </div>
                </th>
              );
            })}
            <th className="px-6 py-4 font-bold text-red-600 dark:text-red-500 text-center border-l border-neutral-200 dark:border-neutral-800">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {jugadores.map((jugador) => {
            // Calcular total de asistencias
            const totalAsistencias = sesionesOrdenadas.filter(
              s => s.asistentes && s.asistentes.includes(jugador.id)
            ).length;
            
            const porcentaje = sesionesOrdenadas.length > 0 
              ? Math.round((totalAsistencias / sesionesOrdenadas.length) * 100) 
              : 0;

            return (
              <tr key={jugador.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                <td className="sticky left-0 z-10 bg-white dark:bg-neutral-950 px-6 py-3 font-medium text-neutral-900 dark:text-white border-r border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-[1px_0_0_0_#e5e5e5] dark:shadow-[1px_0_0_0_#262626] group-hover:bg-neutral-50 dark:group-hover:bg-neutral-900">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {jugador.dorsal || '-'}
                  </div>
                  {jugador.nombre}
                </td>
                
                {sesionesOrdenadas.map((sesion) => {
                  const asistio = sesion.asistentes?.includes(jugador.id);
                  return (
                    <td key={sesion.id} className="px-4 py-3 text-center">
                      {asistio ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-500">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                          <XIcon size={14} strokeWidth={2} />
                        </div>
                      )}
                    </td>
                  );
                })}

                <td className="px-6 py-3 text-center border-l border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {totalAsistencias} <span className="text-neutral-400 font-normal text-xs">/ {sesionesOrdenadas.length}</span>
                    </span>
                    <span className={`text-xs font-medium ${porcentaje >= 80 ? 'text-green-600' : porcentaje >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {porcentaje}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
          
          {jugadores.length === 0 && (
            <tr>
              <td colSpan={sesionesOrdenadas.length + 2} className="px-6 py-8 text-center text-neutral-500">
                No hay jugadores registrados en el equipo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
