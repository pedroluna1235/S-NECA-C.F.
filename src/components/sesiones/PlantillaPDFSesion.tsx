import React from 'react';
import type { DatosDisenoSesion, TareaSesion } from '../../types/sesion';

interface PlantillaPDFSesionProps {
  datos: DatosDisenoSesion;
}

// Estilos base garantizados para evitar problemas de html2canvas con oklch o hojas de estilo externas
const styles = {
  outerContainer: {
    position: 'absolute' as const,
    top: '-9999px',
    left: '-9999px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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

  const imageMaxHeight = isFullWidth 
    ? (isVeryCompact ? 'max-h-28' : isCompact ? 'max-h-36' : 'max-h-44')
    : (isVeryCompact ? 'max-h-24' : isCompact ? 'max-h-28' : 'max-h-32');

  const imageMaxHeightPx = isFullWidth 
    ? (isVeryCompact ? '112px' : isCompact ? '144px' : '176px')
    : (isVeryCompact ? '96px' : isCompact ? '112px' : '128px');

  const textDescClass = isVeryCompact ? 'text-[9.5px]' : isCompact ? 'text-[10px]' : 'text-[11px]';
  const textMetaClass = isVeryCompact ? 'text-[9px]' : isCompact ? 'text-[9.5px]' : 'text-[10px]';
  const textDescFontSize = isVeryCompact ? '9.5px' : isCompact ? '10px' : '11px';
  const textMetaFontSize = isVeryCompact ? '9px' : isCompact ? '9.5px' : '10px';

  return (
    <div 
      className="border text-xs flex" 
      style={{ display: 'flex', border: '1px solid #000000', fontSize: '12px', ...styles.borderBlack, ...styles.bgWhite }}
    >
      {/* TIEMPO */}
      <div 
        className="w-9 border-r flex flex-col items-center justify-center p-1 font-bold text-xs flex-shrink-0" 
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
          ...styles.borderBlack, 
          ...styles.bgWhite 
        }}
      >
        <span>{tarea.tiempo}'</span>
      </div>

      {/* CONTENIDO */}
      <div 
        className="flex-1 p-2 flex flex-col justify-start" 
        style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', ...styles.bgWhite }}
      >
        <div 
          className="font-bold mb-1 uppercase text-xs leading-tight tracking-wide" 
          style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', fontSize: '12px', lineHeight: 1.25, letterSpacing: '0.025em', color: '#111827' }}
        >
          {tarea.titulo}
        </div>
        
        {tarea.descripcion && (
          <div 
            className={`whitespace-pre-wrap ${textDescClass} leading-snug`} 
            style={{ whiteSpace: 'pre-wrap', fontSize: textDescFontSize, lineHeight: 1.375, color: '#1f2937' }}
          >
            {tarea.descripcion}
          </div>
        )}

        {/* METADATOS: JUNTOS, SIN HUECOS EN MEDIO */}
        <div 
          className={`mt-1 flex flex-col gap-0.5 ${textMetaClass} leading-tight`}
          style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: textMetaFontSize, lineHeight: 1.25 }}
        >
          {tarea.equipos && (
            <div>
              <span className="font-bold" style={{ fontWeight: 'bold', color: '#000000' }}>Equipos:</span> <span style={{ color: '#111827' }}>{tarea.equipos}</span>
            </div>
          )}

          {tarea.variables && (
            <div style={styles.textGray700}>
              <span className="font-bold italic" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Variables:</span> <span className="italic" style={{ fontStyle: 'italic' }}>{tarea.variables}</span>
            </div>
          )}

          {tarea.responsabilidades && (
            <div style={styles.textGray700}>
              <span className="font-bold italic" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Responsabilidades:</span> <span className="italic" style={{ fontStyle: 'italic' }}>{tarea.responsabilidades}</span>
            </div>
          )}

          {tarea.roles && (
            <div style={styles.textGray700}>
              <span className="font-bold" style={{ fontWeight: 'bold' }}>Roles CT:</span> <span>{tarea.roles}</span>
            </div>
          )}

          {tarea.reflexion && (
            <div>
              <span className="font-bold" style={{ fontWeight: 'bold', color: '#000000' }}>Reflexión:</span> <span className="font-medium" style={{ fontWeight: 500, color: '#111827' }}>{tarea.reflexion}</span>
            </div>
          )}
        </div>
      </div>

      {/* CAMPO / IMAGEN Y OBJETIVO INDIVIDUAL */}
      <div 
        className={`${isFullWidth ? 'w-56' : 'w-44'} border-l p-1.5 flex flex-col items-center justify-between gap-1 flex-shrink-0`} 
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
          ...styles.borderBlack, 
          ...styles.bgGreen 
        }}
      >
        <div 
          className="flex-1 flex items-center justify-center w-full min-h-0"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0 }}
        >
          {tarea.imagen_url ? (
            <img 
              src={tarea.imagen_url} 
              alt="Tarea" 
              className={`max-w-full ${imageMaxHeight} object-contain`} 
              style={{ maxWidth: '100%', maxHeight: imageMaxHeightPx, objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <span className="text-[10px]" style={{ fontSize: '10px', ...styles.textGray400 }}>Sin imagen</span>
          )}
        </div>
        
        {tarea.objetivo_individual && (
          <div 
            className="w-full p-1 border text-[8.5px] text-center leading-tight flex-shrink-0" 
            style={{ 
              width: '100%', 
              padding: '4px', 
              border: '1px solid #000000', 
              fontSize: '8.5px', 
              textAlign: 'center', 
              lineHeight: 1.25, 
              flexShrink: 0, 
              ...styles.borderBlack, 
              ...styles.bgWhite 
            }}
          >
            <span 
              className="font-bold block mb-0.5 text-[7.5px] uppercase tracking-wider" 
              style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px', fontSize: '7.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000' }}
            >
              OBJETIVO INDIVIDUAL
            </span>
            <span className="font-medium" style={{ fontWeight: 500, color: '#1f2937' }}>{tarea.objetivo_individual}</span>
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
        className="font-sans"
        style={styles.outerContainer}
      >
        {/* ==================== PÁGINA 1 ==================== */}
        <div className="pdf-page" style={styles.page}>
          {/* CABECERA */}
          <div 
            className="flex justify-between items-stretch mb-2"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '8px' }}
          >
            <div 
              className="flex-shrink-0 w-24 flex flex-col items-center justify-center border p-1" 
              style={{ 
                flexShrink: 0, 
                width: '96px', 
                minWidth: '96px', 
                maxWidth: '96px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '1px solid #000000', 
                padding: '4px', 
                ...styles.borderBlack, 
                ...styles.bgWhite 
              }}
            >
              <img 
                src="/logo.png" 
                alt="SÉNECA C.F." 
                className="w-20 h-auto max-h-16 object-contain" 
                style={{ width: '80px', height: 'auto', maxHeight: '64px', objectFit: 'contain', display: 'block' }}
              />
            </div>
            
            <div 
              className="flex-1 ml-3 border text-xs flex flex-col justify-between" 
              style={{ flex: 1, marginLeft: '12px', border: '1px solid #000000', fontSize: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', ...styles.borderBlack }}
            >
              <div 
                className="grid grid-cols-4 border-b flex-1" 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid #000000', flex: 1, ...styles.borderBlack }}
              >
                <div 
                  className="col-span-1 border-r py-0.5 px-1.5 font-bold text-center flex items-center justify-center uppercase text-[10px]" 
                  style={{ gridColumn: 'span 1 / span 1', borderRight: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '10px', ...styles.borderBlack, ...styles.bgGray }}
                >
                  OBJETIVO
                </div>
                <div 
                  className="col-span-3 py-0.5 px-2 text-center flex items-center justify-center font-medium text-[11px]"
                  style={{ gridColumn: 'span 3 / span 3', padding: '2px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '11px', color: '#000000' }}
                >
                  {datos.cabecera.objetivo || '-'}
                </div>
              </div>
              <div 
                className="grid grid-cols-4 border-b flex-1" 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderBottom: '1px solid #000000', flex: 1, ...styles.borderBlack }}
              >
                <div 
                  className="col-span-1 border-r py-0.5 px-1.5 font-bold text-center flex items-center justify-center uppercase text-[10px]" 
                  style={{ gridColumn: 'span 1 / span 1', borderRight: '1px solid #000000', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '10px', ...styles.borderBlack, ...styles.bgGray }}
                >
                  PRINCIPIOS
                </div>
                <div 
                  className="col-span-3 py-0.5 px-2 text-center flex items-center justify-center font-medium text-[11px]"
                  style={{ gridColumn: 'span 3 / span 3', padding: '2px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '11px', color: '#000000' }}
                >
                  {datos.cabecera.principios || '-'}
                </div>
              </div>
              
              <div 
                className="grid grid-cols-4 flex-1" 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', flex: 1, ...styles.borderBlack }}
              >
                <div 
                  className="py-0.5 px-1.5 border-r font-bold text-center flex items-center justify-center uppercase text-[9.5px]" 
                  style={{ padding: '2px 6px', borderRight: '1px solid #000000', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '9.5px', ...styles.borderBlack, ...styles.bgGray }}
                >
                  MICROCICLO
                </div>
                <div 
                  className="py-0.5 px-1.5 border-r text-center flex items-center justify-center font-bold text-sm" 
                  style={{ padding: '2px 6px', borderRight: '1px solid #000000', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', ...styles.borderBlack }}
                >
                  {datos.cabecera.microcicloNum}
                </div>
                <div 
                  className="py-0.5 px-1.5 border-r font-bold text-center flex items-center justify-center uppercase text-[9.5px]" 
                  style={{ padding: '2px 6px', borderRight: '1px solid #000000', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', fontSize: '9.5px', ...styles.borderBlack, ...styles.bgGray }}
                >
                  FECHA
                </div>
                <div 
                  className="py-0.5 px-1.5 text-center flex flex-col items-center justify-center leading-tight"
                  style={{ padding: '2px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.25 }}
                >
                  <span className="font-medium text-[11px]" style={{ fontWeight: 500, fontSize: '11px' }}>{datos.cabecera.fecha}</span>
                  <span className="text-[9.5px]" style={{ fontSize: '9.5px', color: '#52525b' }}>{datos.cabecera.hora}</span>
                </div>
              </div>
            </div>

            <div 
              className="ml-3 w-24 border text-xs flex flex-col" 
              style={{ marginLeft: '12px', width: '96px', minWidth: '96px', maxWidth: '96px', border: '1px solid #000000', fontSize: '12px', display: 'flex', flexDirection: 'column', flexShrink: 0, ...styles.borderBlack }}
            >
               <div 
                 className="border-b py-0.5 px-1 font-bold text-center text-[9.5px]" 
                 style={{ borderBottom: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '9.5px', ...styles.borderBlack, ...styles.bgGray }}
               >
                 SESIÓN
               </div>
               <div 
                 className="py-1 text-center font-bold text-xl flex-1 flex items-center justify-center"
                 style={{ padding: '4px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               >
                 {datos.cabecera.sesionNum}
               </div>
            </div>
          </div>

          {/* MATERIAL */}
          <div 
            className="border mb-2 text-xs" 
            style={{ border: '1px solid #000000', marginBottom: '8px', fontSize: '12px', ...styles.borderBlack }}
          >
            <div 
              className="border-b py-0.5 px-1 font-bold text-center text-[9.5px]" 
              style={{ borderBottom: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '9.5px', ...styles.borderBlack, ...styles.bgGray }}
            >
              MATERIAL
            </div>
            <div 
              className="grid grid-cols-10 text-center text-[8.5px] font-bold border-b" 
              style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', textAlign: 'center', fontSize: '8.5px', fontWeight: 'bold', borderBottom: '1px solid #000000', ...styles.borderBlack, ...styles.bgWhite }}
            >
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>BALONES</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>PETOS 1</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>PETOS 2</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>PETOS 3</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>CONOS</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>AROS</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>BANCOS</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>FITBALL</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>PICAS</div>
              <div className="py-0.5" style={{ padding: '2px 0' }}>PORTERÍAS</div>
            </div>
            <div 
              className="grid grid-cols-10 text-center text-[10px] font-semibold"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', textAlign: 'center', fontSize: '10px', fontWeight: 600 }}
            >
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.balones || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.petos1 || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.petos2 || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.petos3 || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.conos || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.aros || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.bancos || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.fitball || ''}</div>
              <div className="border-r py-0.5" style={{ borderRight: '1px solid #000000', padding: '2px 0', ...styles.borderBlack }}>{datos.material.picas || ''}</div>
              <div className="py-0.5" style={{ padding: '2px 0' }}>{datos.material.porterias || ''}</div>
            </div>
          </div>

          {/* CUERPO PRINCIPAL PÁGINA 1: TAREAS + JUGADORES */}
          <div 
            className="flex gap-2.5 flex-1 min-h-0"
            style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}
          >
            {/* TAREAS PÁGINA 1 */}
            <div 
              className="flex-1 flex flex-col gap-1.5 min-h-0"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}
            >
              {page1Tareas.map((tarea, index) => (
                <TareaCard key={index} tarea={tarea} isFullWidth={false} compactLevel={compactLevel} />
              ))}
              
              {/* KPIS (si caben en página 1) */}
              {kpisOnPage1 && datos.kpis && (
                <div 
                  className="border text-xs flex flex-col flex-shrink-0" 
                  style={{ border: '1px solid #000000', fontSize: '12px', display: 'flex', flexDirection: 'column', flexShrink: 0, ...styles.borderBlack }}
                >
                  <div 
                    className="border-b py-0.5 px-2 font-bold text-center text-[9px]" 
                    style={{ borderBottom: '1px solid #000000', padding: '2px 8px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px', ...styles.borderBlack, ...styles.bgGray }}
                  >
                    KPIS
                  </div>
                  <div 
                    className="p-1.5 whitespace-pre-wrap text-[10px] leading-tight" 
                    style={{ padding: '6px', whiteSpace: 'pre-wrap', fontSize: '10px', lineHeight: 1.25, ...styles.bgWhite }}
                  >
                    {datos.kpis}
                  </div>
                </div>
              )}
            </div>

            {/* JUGADORES */}
            <div 
              className="w-44 text-xs flex flex-col flex-shrink-0"
              style={{ width: '176px', minWidth: '176px', maxWidth: '176px', fontSize: '12px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
            >
              <div className="border" style={{ border: '1px solid #000000', ...styles.borderBlack }}>
                <div 
                  className="border-b py-1 px-1 font-bold text-center text-[10px]" 
                  style={{ borderBottom: '1px solid #000000', padding: '4px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', ...styles.borderBlack, ...styles.bgGray }}
                >
                  JUGADORES DISPONIBLES
                </div>
                <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
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
                      style={{
                        borderBottom: '1px solid #000000',
                        padding: '4px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        lineHeight: 1.25,
                        textAlign: 'center',
                        textDecoration: !jugador.disponible ? 'line-through' : 'none',
                        ...(!jugador.disponible 
                          ? { ...styles.borderBlack, ...styles.bgRed, ...styles.textRed }
                          : { ...styles.borderBlack, ...styles.bgWhite, ...(jugador.manual ? { color: '#2563eb' } : {}) })
                      }}
                    >
                      <span className="font-bold mr-1" style={{ fontWeight: 'bold', marginRight: '4px' }}>{index + 1}.</span>
                      <span className="font-medium whitespace-normal break-words" style={{ fontWeight: 500, whiteSpace: 'normal', wordBreak: 'break-word' }}>{jugador.nombre.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SESIONES INDIVIDUALES */}
              {datos.sesionesIndividuales && datos.sesionesIndividuales.length > 0 && (
                <div className="border mt-2" style={{ border: '1px solid #000000', marginTop: '8px', ...styles.borderBlack }}>
                  <div 
                    className="border-b py-0.5 px-1 font-bold text-center text-[10px]" 
                    style={{ borderBottom: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', ...styles.borderBlack, ...styles.bgGray }}
                  >
                    SESIÓN INDIVIDUAL
                  </div>
                  <div className="flex flex-col p-1 gap-1" style={{ display: 'flex', flexDirection: 'column', padding: '4px', gap: '4px', ...styles.bgWhite }}>
                    {datos.sesionesIndividuales.map((sesionInd) => (
                      <div key={sesionInd.id} className="text-[10px]" style={{ fontSize: '10px' }}>
                        <div className="font-bold leading-tight" style={{ fontWeight: 'bold', lineHeight: 1.25 }}>{sesionInd.nombres.toUpperCase()}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {sesionInd.video && <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', borderColor: '#BFDBFE', borderWidth: '1px', borderStyle: 'solid', padding: '1px 4px', borderRadius: '4px', fontSize: '8px', fontWeight: 600 }} className="px-1 py-0.2 rounded text-[8px] font-semibold">VÍDEO</span>}
                          {sesionInd.entrenamiento && <span style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0', borderWidth: '1px', borderStyle: 'solid', padding: '1px 4px', borderRadius: '4px', fontSize: '8px', fontWeight: 600 }} className="px-1 py-0.2 rounded text-[8px] font-semibold">ENTRENO</span>}
                          {sesionInd.charla && <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', borderColor: '#E9D5FF', borderWidth: '1px', borderStyle: 'solid', padding: '1px 4px', borderRadius: '4px', fontSize: '8px', fontWeight: 600 }} className="px-1 py-0.2 rounded text-[8px] font-semibold">CHARLA</span>}
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
            <div 
              className="flex justify-between items-center border mb-2.5 p-1.5 text-xs" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #000000', marginBottom: '10px', padding: '6px', fontSize: '12px', ...styles.borderBlack }}
            >
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo.png" alt="SÉNECA C.F." className="w-7 h-7 object-contain" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <span className="font-bold text-xs" style={{ fontWeight: 'bold', fontSize: '12px', color: '#000000' }}>SÉNECA C.F.</span>
                <span style={{ color: '#9ca3af' }}>|</span>
                <span className="font-semibold text-xs" style={{ fontWeight: 600, fontSize: '12px', color: '#000000' }}>SESIÓN {datos.cabecera.sesionNum}</span>
                {datos.cabecera.objetivo && (
                  <>
                    <span style={{ color: '#9ca3af' }}>-</span>
                    <span className="font-medium text-[11px]" style={{ fontWeight: 500, fontSize: '11px', color: '#374151' }}>{datos.cabecera.objetivo}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[10px]" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500, fontSize: '10px', color: '#4b5563' }}>
                <span>Microciclo: <strong style={{ color: '#000000' }}>{datos.cabecera.microcicloNum}</strong></span>
                <span>{datos.cabecera.fecha} {datos.cabecera.hora}</span>
              </div>
            </div>

            {/* TAREAS PÁGINA ADICIONAL (A ANCHO COMPLETO) */}
            <div className="flex flex-col gap-3 flex-1 min-h-0" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
              {page.tareas.map((tarea, tIdx) => (
                <TareaCard key={tIdx} tarea={tarea} isFullWidth={true} compactLevel={compactLevel} />
              ))}

              {/* KPIS */}
              {page.hasKpis && datos.kpis && (
                <div className="border text-xs flex flex-col" style={{ border: '1px solid #000000', fontSize: '12px', display: 'flex', flexDirection: 'column', ...styles.borderBlack }}>
                  <div className="border-b py-0.5 px-2 font-bold text-center text-[10px]" style={{ borderBottom: '1px solid #000000', padding: '2px 8px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px', ...styles.borderBlack, ...styles.bgGray }}>
                    KPIS
                  </div>
                  <div className="p-2.5 whitespace-pre-wrap text-[11px] leading-relaxed" style={{ padding: '10px', whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: 1.625, ...styles.bgWhite }}>
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
