import React from 'react';
import type { DatosDisenoSesion, TareaSesion } from '../../types/sesion';

interface PlantillaPDFSesionProps {
  datos: DatosDisenoSesion;
}

// Estilos base para evitar problemas de html2canvas con oklch de Tailwind v4
const styles = {
  outerContainer: {
    position: 'absolute' as const,
    top: '-9999px',
    left: '-9999px',
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  page: {
    width: '800px',
    minHeight: '1131px',
    maxHeight: '1131px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#ffffff',
    color: '#000000',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '20px 24px',
  },
  borderBlack: { borderColor: '#000000' },
  bgGray: { backgroundColor: '#e5e7eb' },
  bgWhite: { backgroundColor: '#ffffff' },
  bgGreen: { backgroundColor: '#f0fdf4' },
  bgRed: { backgroundColor: '#fecaca' },
  textRed: { color: '#991b1b' },
  textGray700: { color: '#374151' },
  textGray400: { color: '#9ca3af' },
};

interface TareaCardProps {
  tarea: TareaSesion;
  isFullWidth?: boolean;
}

const TareaCard: React.FC<TareaCardProps> = ({ tarea, isFullWidth = false }) => {
  return (
    <div className="border text-xs flex" style={styles.borderBlack}>
      {/* TIEMPO */}
      <div 
        className="w-10 border-r flex flex-col items-center justify-center p-1 font-bold text-xs" 
        style={{ ...styles.borderBlack, ...styles.bgWhite }}
      >
        {tarea.tiempo}'
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-2 flex flex-col justify-start" style={styles.bgWhite}>
        <div className="font-bold mb-1 uppercase text-xs leading-tight tracking-wide" style={{ color: '#111827' }}>
          {tarea.titulo}
        </div>
        
        {tarea.descripcion && (
          <div className="whitespace-pre-wrap text-[11px] leading-tight" style={{ color: '#1f2937' }}>
            {tarea.descripcion}
          </div>
        )}

        {tarea.equipos && (
          <div className="mt-1.5 text-[10px] leading-tight">
            <span className="font-bold">Equipos:</span> <span style={{ color: '#111827' }}>{tarea.equipos}</span>
          </div>
        )}

        {tarea.variables && (
          <div className="mt-1.5 text-[10px] leading-tight" style={styles.textGray700}>
            <span className="font-bold italic">Variables:</span> <span className="italic">{tarea.variables}</span>
          </div>
        )}

        {tarea.responsabilidades && (
          <div className="mt-1.5 text-[10px] leading-tight" style={styles.textGray700}>
            <span className="font-bold italic">Responsabilidades:</span> <span className="italic">{tarea.responsabilidades}</span>
          </div>
        )}

        {tarea.roles && (
          <div className="mt-1.5 text-[10px] leading-tight" style={styles.textGray700}>
            <span className="font-bold">Roles CT:</span> <span>{tarea.roles}</span>
          </div>
        )}

        {tarea.reflexion && (
          <div className="mt-1.5 text-[10px] leading-tight">
            <span className="font-bold">Reflexión:</span> <span className="font-medium">{tarea.reflexion}</span>
          </div>
        )}
      </div>

      {/* CAMPO / IMAGEN Y OBJETIVO INDIVIDUAL */}
      <div 
        className={`${isFullWidth ? 'w-60' : 'w-48'} border-l p-1.5 flex flex-col items-center justify-between gap-1`} 
        style={{ ...styles.borderBlack, ...styles.bgGreen }}
      >
        <div className="flex-1 flex items-center justify-center w-full">
          {tarea.imagen_url ? (
            <img 
              src={tarea.imagen_url} 
              alt="Tarea" 
              className={`max-w-full ${isFullWidth ? 'max-h-32' : 'max-h-28'} object-contain`} 
            />
          ) : (
            <span className="text-[10px]" style={styles.textGray400}>Sin imagen</span>
          )}
        </div>
        
        {tarea.objetivo_individual && (
          <div 
            className="w-full p-1 border text-[9px] text-center leading-tight" 
            style={{ ...styles.borderBlack, ...styles.bgWhite }}
          >
            <span className="font-bold block mb-0.5 text-[8px] uppercase tracking-wider">OBJETIVO INDIVIDUAL</span>
            <span className="font-medium" style={{ color: '#1f2937' }}>{tarea.objetivo_individual}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const PlantillaPDFSesion = React.forwardRef<HTMLDivElement, PlantillaPDFSesionProps>(
  ({ datos }, ref) => {
    const allTareas = datos.tareas || [];
    const totalTareas = allTareas.length;

    // Distribución inteligente de tareas por página para evitar cortes y vacíos:
    // En Página 1 van hasta 2 tareas (índice 0 y 1) junto al material y plantilla de jugadores.
    const page1Tareas = allTareas.slice(0, 2);
    const remainingTareas = allTareas.slice(2);

    // Los KPIs van en la Página 1 si hay 1 tarea o si con 2 tareas el texto es conciso (<= 300 caracteres).
    // Si hay más tareas o los KPIs son largos, van con las tareas restantes en la página siguiente.
    let kpisOnPage1 = false;
    if (datos.kpis) {
      if (totalTareas <= 1) {
        kpisOnPage1 = true;
      } else if (totalTareas === 2 && datos.kpis.length <= 300) {
        kpisOnPage1 = true;
      }
    }

    // Páginas adicionales para tareas 3 en adelante o KPIs largos
    const additionalPages: { tareas: TareaSesion[]; hasKpis: boolean }[] = [];
    if (remainingTareas.length > 0 || (datos.kpis && !kpisOnPage1)) {
      if (remainingTareas.length === 0) {
        // Solo KPIs en página siguiente
        additionalPages.push({ tareas: [], hasKpis: true });
      } else {
        for (let i = 0; i < remainingTareas.length; i += 2) {
          const chunk = remainingTareas.slice(i, i + 2);
          const isLastChunk = i + 2 >= remainingTareas.length;
          additionalPages.push({
            tareas: chunk,
            hasKpis: isLastChunk && Boolean(datos.kpis && !kpisOnPage1)
          });
        }
      }
    }

    return (
      <div 
        ref={ref}
        id="plantilla-pdf-sesion"
        className="font-sans"
        style={styles.outerContainer}
      >
        {/* ==================== PÁGINA 1 ==================== */}
        <div className="pdf-page" style={styles.page}>
          {/* CABECERA */}
          <div className="flex justify-between items-stretch mb-2.5">
            <div className="flex-shrink-0 w-24 flex flex-col items-center justify-center border p-1" style={styles.borderBlack}>
              <img src="/logo.png" alt="SÉNECA C.F." className="w-20 h-auto max-h-20 object-contain" />
            </div>
            
            <div className="flex-1 ml-3 border text-xs flex flex-col justify-between" style={styles.borderBlack}>
              <div className="grid grid-cols-4 border-b flex-1" style={styles.borderBlack}>
                <div className="col-span-1 border-r py-1 px-1.5 font-bold text-center flex items-center justify-center uppercase text-[11px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>OBJETIVO</div>
                <div className="col-span-3 py-1 px-2 text-center flex items-center justify-center font-medium text-xs">{datos.cabecera.objetivo || '-'}</div>
              </div>
              <div className="grid grid-cols-4 border-b flex-1" style={styles.borderBlack}>
                <div className="col-span-1 border-r py-1 px-1.5 font-bold text-center flex items-center justify-center uppercase text-[11px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>PRINCIPIOS</div>
                <div className="col-span-3 py-1 px-2 text-center flex items-center justify-center font-medium text-xs">{datos.cabecera.principios || '-'}</div>
              </div>
              
              <div className="grid grid-cols-4 flex-1" style={styles.borderBlack}>
                <div className="py-1 px-1.5 border-r font-bold text-center flex items-center justify-center uppercase text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>MICROCICLO</div>
                <div className="py-1 px-1.5 border-r text-center flex items-center justify-center font-bold text-base" style={styles.borderBlack}>{datos.cabecera.microcicloNum}</div>
                <div className="py-1 px-1.5 border-r font-bold text-center flex items-center justify-center uppercase text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>FECHA</div>
                <div className="py-1 px-1.5 text-center flex flex-col items-center justify-center leading-tight">
                  <span className="font-medium text-xs">{datos.cabecera.fecha}</span>
                  <span className="text-[10px]" style={{ color: '#52525b' }}>{datos.cabecera.hora}</span>
                </div>
              </div>
            </div>

            <div className="ml-3 w-24 border text-xs flex flex-col" style={styles.borderBlack}>
               <div className="border-b py-1 px-1 font-bold text-center text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>SESIÓN</div>
               <div className="py-2 text-center font-bold text-2xl flex-1 flex items-center justify-center">{datos.cabecera.sesionNum}</div>
            </div>
          </div>

          {/* MATERIAL */}
          <div className="border mb-2.5 text-xs" style={styles.borderBlack}>
            <div className="border-b py-0.5 px-1 font-bold text-center text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>MATERIAL</div>
            <div className="grid grid-cols-10 text-center text-[9px] font-bold border-b" style={{ ...styles.borderBlack, ...styles.bgWhite }}>
              <div className="border-r py-0.5" style={styles.borderBlack}>BALONES</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>PETOS 1</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>PETOS 2</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>PETOS 3</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>CONOS</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>AROS</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>BANCOS</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>FITBALL</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>PICAS</div>
              <div className="py-0.5">PORTERÍAS</div>
            </div>
            <div className="grid grid-cols-10 text-center text-[11px] font-semibold">
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.balones || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.petos1 || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.petos2 || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.petos3 || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.conos || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.aros || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.bancos || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.fitball || ''}</div>
              <div className="border-r py-0.5" style={styles.borderBlack}>{datos.material.picas || ''}</div>
              <div className="py-0.5">{datos.material.porterias || ''}</div>
            </div>
          </div>

          {/* CUERPO PRINCIPAL PÁGINA 1: TAREAS + JUGADORES */}
          <div className="flex gap-3 flex-1 items-start">
            {/* TAREAS PÁGINA 1 */}
            <div className="flex-1 flex flex-col gap-2.5">
              {page1Tareas.map((tarea, index) => (
                <TareaCard key={index} tarea={tarea} isFullWidth={false} />
              ))}
              
              {/* KPIS (si caben en página 1) */}
              {kpisOnPage1 && datos.kpis && (
                <div className="border text-xs flex flex-col" style={styles.borderBlack}>
                  <div className="border-b py-0.5 px-2 font-bold text-center text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>
                    KPIS
                  </div>
                  <div className="p-2 whitespace-pre-wrap text-[11px] leading-snug" style={styles.bgWhite}>
                    {datos.kpis}
                  </div>
                </div>
              )}
            </div>

            {/* JUGADORES */}
            <div className="w-44 text-xs flex flex-col flex-shrink-0">
              <div className="border" style={styles.borderBlack}>
                <div className="border-b py-1 px-1 font-bold text-center text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>
                  JUGADORES DISPONIBLES
                </div>
                <div className="flex flex-col">
                  {datos.jugadores.filter(j => {
                    const isHidden = j.nombre.toLowerCase().includes('javier valverde') || j.nombre.toLowerCase().includes('carlos gonzález') || j.nombre.toLowerCase().includes('carlos gonzalez');
                    if (isHidden) return j.disponible;
                    return true;
                  }).map((jugador, index) => (
                    <div 
                      key={jugador.id} 
                      className={`border-b py-1 px-1.5 flex items-center justify-center text-[10px] leading-tight text-center ${
                        !jugador.disponible ? 'line-through' : ''
                      }`}
                      style={
                        !jugador.disponible 
                          ? { ...styles.borderBlack, ...styles.bgRed, ...styles.textRed }
                          : { ...styles.borderBlack, ...styles.bgWhite, ...(jugador.manual ? { color: '#2563eb' } : {}) }
                      }
                    >
                      <span className="font-bold mr-1">{index + 1}.</span>
                      <span className="font-medium whitespace-normal break-words">{jugador.nombre.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SESIONES INDIVIDUALES */}
              {datos.sesionesIndividuales && datos.sesionesIndividuales.length > 0 && (
                <div className="border mt-2" style={styles.borderBlack}>
                  <div className="border-b py-0.5 px-1 font-bold text-center text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>
                    SESIÓN INDIVIDUAL
                  </div>
                  <div className="flex flex-col p-1 gap-1" style={styles.bgWhite}>
                    {datos.sesionesIndividuales.map((sesionInd) => (
                      <div key={sesionInd.id} className="text-[10px]">
                        <div className="font-bold leading-tight">{sesionInd.nombres.toUpperCase()}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {sesionInd.video && <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', borderColor: '#BFDBFE', borderWidth: '1px', borderStyle: 'solid' }} className="px-1 py-0.2 rounded text-[8px] font-semibold">VÍDEO</span>}
                          {sesionInd.entrenamiento && <span style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0', borderWidth: '1px', borderStyle: 'solid' }} className="px-1 py-0.2 rounded text-[8px] font-semibold">ENTRENO</span>}
                          {sesionInd.charla && <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', borderColor: '#E9D5FF', borderWidth: '1px', borderStyle: 'solid' }} className="px-1 py-0.2 rounded text-[8px] font-semibold">CHARLA</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== PÁGINAS ADICIONALES ==================== */}
        {additionalPages.map((page, pIndex) => (
          <div key={pIndex} className="pdf-page" style={styles.page}>
            {/* CABECERA PÁGINA ADICIONAL */}
            <div className="flex justify-between items-center border mb-2.5 p-1.5 text-xs" style={styles.borderBlack}>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="SÉNECA C.F." className="w-7 h-7 object-contain" />
                <span className="font-bold text-xs" style={{ color: '#000000' }}>SÉNECA C.F.</span>
                <span style={{ color: '#9ca3af' }}>|</span>
                <span className="font-semibold text-xs" style={{ color: '#000000' }}>SESIÓN {datos.cabecera.sesionNum}</span>
                {datos.cabecera.objetivo && (
                  <>
                    <span style={{ color: '#9ca3af' }}>-</span>
                    <span className="font-medium text-[11px]" style={{ color: '#374151' }}>{datos.cabecera.objetivo}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[10px]" style={{ color: '#4b5563' }}>
                <span>Microciclo: <strong style={{ color: '#000000' }}>{datos.cabecera.microcicloNum}</strong></span>
                <span>{datos.cabecera.fecha} {datos.cabecera.hora}</span>
              </div>
            </div>

            {/* TAREAS PÁGINA ADICIONAL (A ANCHO COMPLETO) */}
            <div className="flex flex-col gap-2.5 flex-1">
              {page.tareas.map((tarea, tIdx) => (
                <TareaCard key={tIdx} tarea={tarea} isFullWidth={true} />
              ))}

              {/* KPIS */}
              {page.hasKpis && datos.kpis && (
                <div className="border text-xs flex flex-col" style={styles.borderBlack}>
                  <div className="border-b py-0.5 px-2 font-bold text-center text-[10px]" style={{ ...styles.borderBlack, ...styles.bgGray }}>
                    KPIS
                  </div>
                  <div className="p-2.5 whitespace-pre-wrap text-[11px] leading-relaxed" style={styles.bgWhite}>
                    {datos.kpis}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PlantillaPDFSesion.displayName = 'PlantillaPDFSesion';

