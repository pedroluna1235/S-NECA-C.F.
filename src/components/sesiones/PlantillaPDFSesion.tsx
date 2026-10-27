import React from 'react';
import type { DatosDisenoSesion, TareaSesion } from '../../types/sesion';

interface PlantillaPDFSesionProps {
  datos: DatosDisenoSesion;
}

// Estilos base garantizados e independientes de Tailwind / iframes
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
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  compactLevel?: 'normal' | 'compact' | 'very-compact';
}

const TareaCard: React.FC<TareaCardProps> = ({ 
  tarea, 
  isFullWidth = false, 
  compactLevel = 'normal' 
}) => {
  const isVeryCompact = compactLevel === 'very-compact';
  const isCompact = compactLevel === 'compact';

  const imageMaxHeightPx = isFullWidth 
    ? (isVeryCompact ? 112 : isCompact ? 144 : 176)
    : (isVeryCompact ? 96 : isCompact ? 112 : 128);

  const textDescFontSize = isVeryCompact ? '9.5px' : isCompact ? '10px' : '11px';
  const textMetaFontSize = isVeryCompact ? '9px' : isCompact ? '9.5px' : '10px';

  return (
    <div style={{ display: 'flex', border: '1px solid #000000', fontSize: '12px', ...styles.bgWhite }}>
      {/* TIEMPO */}
      <div 
        style={{ 
          width: '36px', 
          minWidth: '36px', 
          borderRight: '1px solid #000000', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '4px', 
          fontWeight: 'bold', 
          fontSize: '12px', 
          flexShrink: 0, 
          ...styles.bgWhite 
        }}
      >
        <span>{tarea.tiempo}'</span>
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', ...styles.bgWhite }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', fontSize: '12px', lineHeight: '1.2', letterSpacing: '0.025em', color: '#111827' }}>
          {tarea.titulo}
        </div>
        
        {tarea.descripcion && (
          <div style={{ whiteSpace: 'pre-wrap', fontSize: textDescFontSize, lineHeight: '1.35', color: '#1f2937' }}>
            {tarea.descripcion}
          </div>
        )}

        {/* METADATOS: JUNTOS, SIN HUECOS EN MEDIO */}
        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: textMetaFontSize, lineHeight: '1.25' }}>
          {tarea.equipos && (
            <div>
              <span style={{ fontWeight: 'bold', color: '#000000' }}>Equipos:</span> <span style={{ color: '#111827' }}>{tarea.equipos}</span>
            </div>
          )}

          {tarea.variables && (
            <div style={styles.textGray700}>
              <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Variables:</span> <span style={{ fontStyle: 'italic' }}>{tarea.variables}</span>
            </div>
          )}

          {tarea.responsabilidades && (
            <div style={styles.textGray700}>
              <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Responsabilidades:</span> <span style={{ fontStyle: 'italic' }}>{tarea.responsabilidades}</span>
            </div>
          )}

          {tarea.roles && (
            <div style={styles.textGray700}>
              <span style={{ fontWeight: 'bold' }}>Roles CT:</span> <span>{tarea.roles}</span>
            </div>
          )}

          {tarea.reflexion && (
            <div>
              <span style={{ fontWeight: 'bold', color: '#000000' }}>Reflexión:</span> <span style={{ fontWeight: 500, color: '#111827' }}>{tarea.reflexion}</span>
            </div>
          )}
        </div>
      </div>

      {/* CAMPO / IMAGEN Y OBJETIVO INDIVIDUAL */}
      <div 
        style={{ 
          width: isFullWidth ? '224px' : '176px', 
          minWidth: isFullWidth ? '224px' : '176px', 
          borderLeft: '1px solid #000000', 
          padding: '6px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '4px', 
          flexShrink: 0, 
          ...styles.bgGreen 
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0 }}>
          {tarea.imagen_url ? (
            <img 
              src={tarea.imagen_url} 
              alt="Tarea" 
              style={{ maxWidth: '100%', maxHeight: `${imageMaxHeightPx}px`, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: '10px', ...styles.textGray400 }}>Sin imagen</span>
          )}
        </div>
        
        {tarea.objetivo_individual && (
          <div 
            style={{ 
              width: '100%', 
              padding: '4px', 
              border: '1px solid #000000', 
              fontSize: '8.5px', 
              textAlign: 'center', 
              lineHeight: '1.2', 
              flexShrink: 0, 
              ...styles.bgWhite 
            }}
          >
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px', fontSize: '7.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000' }}>
              OBJETIVO INDIVIDUAL
            </span>
            <span style={{ fontWeight: 500, color: '#1f2937' }}>{tarea.objetivo_individual}</span>
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

    // Si hay hasta 4 tareas, caben todas de forma compacta en 1 sola página perfecta sin cortes ni huecos:
    let page1Tareas: TareaSesion[] = [];
    let remainingTareas: TareaSesion[] = [];
    let kpisOnPage1 = false;

    if (totalTareas <= 4) {
      page1Tareas = allTareas;
      remainingTareas = [];
      kpisOnPage1 = Boolean(datos.kpis);
    } else {
      page1Tareas = allTareas.slice(0, 3);
      remainingTareas = allTareas.slice(3);
      kpisOnPage1 = false;
    }

    const compactLevel: 'normal' | 'compact' | 'very-compact' = 
      totalTareas >= 4 ? 'very-compact' : totalTareas === 3 ? 'compact' : 'normal';

    // Páginas adicionales solo si hay más de 4 tareas o KPIs desbordados
    const additionalPages: { tareas: TareaSesion[]; hasKpis: boolean }[] = [];
    if (remainingTareas.length > 0 || (datos.kpis && !kpisOnPage1)) {
      if (remainingTareas.length === 0) {
        additionalPages.push({ tareas: [], hasKpis: true });
      } else {
        for (let i = 0; i < remainingTareas.length; i += 3) {
          const chunk = remainingTareas.slice(i, i + 3);
          const isLastChunk = i + 3 >= remainingTareas.length;
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
        style={styles.outerContainer}
      >
        {/* ==================== PÁGINA 1 ==================== */}
        <div className="pdf-page" style={styles.page}>
          {/* CABECERA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '8px' }}>
            <div 
              style={{ 
                width: '88px', 
                minWidth: '88px', 
                maxWidth: '88px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '1px solid #000000', 
                padding: '4px',
                flexShrink: 0,
                ...styles.bgWhite 
              }}
            >
              <img 
                src="/logo.png" 
                alt="SÉNECA C.F." 
                style={{ width: '74px', height: 'auto', maxHeight: '58px', objectFit: 'contain', display: 'block' }} 
              />
            </div>
            
            <div 
              style={{ 
                flex: 1, 
                marginLeft: '10px', 
                border: '1px solid #000000', 
                fontSize: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between' 
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid #000000', flex: 1 }}>
                <div style={{ gridColumn: 'span 1', borderRight: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '10px', ...styles.bgGray }}>
                  OBJETIVO
                </div>
                <div style={{ gridColumn: 'span 3', padding: '2px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '11px', color: '#000000' }}>
                  {datos.cabecera.objetivo || '-'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid #000000', flex: 1 }}>
                <div style={{ gridColumn: 'span 1', borderRight: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '10px', ...styles.bgGray }}>
                  PRINCIPIOS
                </div>
                <div style={{ gridColumn: 'span 3', padding: '2px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '11px', color: '#000000' }}>
                  {datos.cabecera.principios || '-'}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', flex: 1 }}>
                <div style={{ gridColumn: 'span 1', borderRight: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '9.5px', ...styles.bgGray }}>
                  MICROCICLO
                </div>
                <div style={{ gridColumn: 'span 1', borderRight: '1px solid #000000', padding: '2px 6px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: '#000000' }}>
                  {datos.cabecera.microcicloNum}
                </div>
                <div style={{ gridColumn: 'span 1', borderRight: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '9.5px', ...styles.bgGray }}>
                  FECHA
                </div>
                <div style={{ gridColumn: 'span 1', padding: '2px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                  <span style={{ fontWeight: 500, fontSize: '11px', color: '#000000' }}>{datos.cabecera.fecha}</span>
                  <span style={{ fontSize: '9.5px', color: '#52525b' }}>{datos.cabecera.hora}</span>
                </div>
              </div>
            </div>

            <div 
              style={{ 
                marginLeft: '10px', 
                width: '88px', 
                minWidth: '88px', 
                maxWidth: '88px', 
                border: '1px solid #000000', 
                fontSize: '12px', 
                display: 'flex', 
                flexDirection: 'column',
                flexShrink: 0
              }}
            >
               <div style={{ borderBottom: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '9.5px', ...styles.bgGray }}>
                 SESIÓN
               </div>
               <div style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '22px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000' }}>
                 {datos.cabecera.sesionNum}
               </div>
            </div>
          </div>

          {/* MATERIAL */}
          <div style={{ border: '1px solid #000000', marginBottom: '8px', fontSize: '12px' }}>
            <div style={{ borderBottom: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '9.5px', ...styles.bgGray }}>
              MATERIAL
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', textAlign: 'center', fontSize: '8.5px', fontWeight: 'bold', borderBottom: '1px solid #000000', ...styles.bgWhite }}>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>BALONES</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>PETOS 1</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>PETOS 2</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>PETOS 3</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>CONOS</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>AROS</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>BANCOS</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>FITBALL</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>PICAS</div>
              <div style={{ padding: '2px 0' }}>PORTERÍAS</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', textAlign: 'center', fontSize: '10px', fontWeight: 600 }}>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.balones || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.petos1 || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.petos2 || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.petos3 || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.conos || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.aros || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.bancos || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.fitball || ''}</div>
              <div style={{ borderRight: '1px solid #000000', padding: '2px 0' }}>{datos.material.picas || ''}</div>
              <div style={{ padding: '2px 0' }}>{datos.material.porterias || ''}</div>
            </div>
          </div>

          {/* CUERPO PRINCIPAL PÁGINA 1: TAREAS + JUGADORES */}
          <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>
            {/* TAREAS PÁGINA 1 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
              {page1Tareas.map((tarea, index) => (
                <TareaCard key={index} tarea={tarea} isFullWidth={false} compactLevel={compactLevel} />
              ))}
              
              {/* KPIS (si caben en página 1) */}
              {kpisOnPage1 && datos.kpis && (
                <div style={{ border: '1px solid #000000', fontSize: '12px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <div style={{ borderBottom: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px', ...styles.bgGray }}>
                    KPIS
                  </div>
                  <div style={{ padding: '6px', whiteSpace: 'pre-wrap', fontSize: '10px', lineHeight: '1.25', ...styles.bgWhite }}>
                    {datos.kpis}
                  </div>
                </div>
              )}
            </div>

            {/* JUGADORES */}
            <div style={{ width: '176px', minWidth: '176px', maxWidth: '176px', fontSize: '12px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ border: '1px solid #000000' }}>
                <div style={{ borderBottom: '1px solid #000000', padding: '4px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', ...styles.bgGray }}>
                  JUGADORES DISPONIBLES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {datos.jugadores.filter(j => {
                    const isHidden = j.nombre.toLowerCase().includes('javier valverde') || j.nombre.toLowerCase().includes('carlos gonzález') || j.nombre.toLowerCase().includes('carlos gonzalez');
                    if (isHidden) return j.disponible;
                    return true;
                  }).map((jugador, index) => (
                    <div 
                      key={jugador.id} 
                      style={{
                        borderBottom: '1px solid #000000',
                        padding: '3px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9.5px',
                        lineHeight: '1.2',
                        textAlign: 'center',
                        textDecoration: !jugador.disponible ? 'line-through' : 'none',
                        ...(!jugador.disponible 
                          ? { ...styles.bgRed, ...styles.textRed } 
                          : { ...styles.bgWhite, ...(jugador.manual ? { color: '#2563eb' } : { color: '#000000' }) })
                      }}
                    >
                      <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{index + 1}.</span>
                      <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{jugador.nombre.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SESIONES INDIVIDUALES */}
              {datos.sesionesIndividuales && datos.sesionesIndividuales.length > 0 && (
                <div style={{ border: '1px solid #000000', marginTop: '8px' }}>
                  <div style={{ borderBottom: '1px solid #000000', padding: '3px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', ...styles.bgGray }}>
                    SESIÓN INDIVIDUAL
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '4px', gap: '4px', ...styles.bgWhite }}>
                    {datos.sesionesIndividuales.map((sesionInd) => (
                      <div key={sesionInd.id} style={{ fontSize: '10px' }}>
                        <div style={{ fontWeight: 'bold', lineHeight: '1.2', color: '#000000' }}>{sesionInd.nombres.toUpperCase()}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {sesionInd.video && (
                            <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '1px 3px', borderRadius: '4px', fontSize: '8px', fontWeight: 600 }}>
                              VÍDEO
                            </span>
                          )}
                          {sesionInd.entrenamiento && (
                            <span style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '1px 3px', borderRadius: '4px', fontSize: '8px', fontWeight: 600 }}>
                              ENTRENO
                            </span>
                          )}
                          {sesionInd.charla && (
                            <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF', padding: '1px 3px', borderRadius: '4px', fontSize: '8px', fontWeight: 600 }}>
                              CHARLA
                            </span>
                          )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #000000', marginBottom: '10px', padding: '6px', fontSize: '12px', ...styles.bgWhite }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo.png" alt="SÉNECA C.F." style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#000000' }}>SÉNECA C.F.</span>
                <span style={{ color: '#9ca3af' }}>|</span>
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#000000' }}>SESIÓN {datos.cabecera.sesionNum}</span>
                {datos.cabecera.objetivo && (
                  <>
                    <span style={{ color: '#9ca3af' }}>-</span>
                    <span style={{ fontWeight: 500, fontSize: '11px', color: '#374151' }}>{datos.cabecera.objetivo}</span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500, fontSize: '10px', color: '#4b5563' }}>
                <span>Microciclo: <strong style={{ color: '#000000' }}>{datos.cabecera.microcicloNum}</strong></span>
                <span>{datos.cabecera.fecha} {datos.cabecera.hora}</span>
              </div>
            </div>

            {/* TAREAS PÁGINA ADICIONAL (A ANCHO COMPLETO) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
              {page.tareas.map((tarea, tIdx) => (
                <TareaCard key={tIdx} tarea={tarea} isFullWidth={true} compactLevel={compactLevel} />
              ))}

              {/* KPIS */}
              {page.hasKpis && datos.kpis && (
                <div style={{ border: '1px solid #000000', fontSize: '12px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px solid #000000', padding: '4px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', ...styles.bgGray }}>
                    KPIS
                  </div>
                  <div style={{ padding: '8px', whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.4', ...styles.bgWhite }}>
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
