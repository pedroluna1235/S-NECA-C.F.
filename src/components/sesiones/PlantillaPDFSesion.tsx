import React from 'react';
import type { DatosDisenoSesion } from '../../types/sesion';

interface PlantillaPDFSesionProps {
  datos: DatosDisenoSesion;
}

// Estilos base para evitar problemas de html2canvas con oklch de Tailwind v4
const styles = {
  container: { width: '800px', minHeight: '1123px', position: 'absolute' as const, top: '-9999px', left: '-9999px', backgroundColor: '#ffffff', color: '#000000' },
  borderBlack: { borderColor: '#000000' },
  bgGray: { backgroundColor: '#e5e7eb' },
  bgWhite: { backgroundColor: '#ffffff' },
  bgGreen: { backgroundColor: '#f0fdf4' },
  bgRed: { backgroundColor: '#fecaca' },
  textRed: { color: '#991b1b' },
  textGray700: { color: '#374151' },
  textGray400: { color: '#9ca3af' },
};

export const PlantillaPDFSesion = React.forwardRef<HTMLDivElement, PlantillaPDFSesionProps>(
  ({ datos }, ref) => {
    return (
      <div 
        ref={ref}
        id="plantilla-pdf-sesion"
        className="p-8 font-sans"
        style={styles.container}
      >
        {/* CABECERA */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-shrink-0 w-32 flex flex-col items-center justify-center">
            <img src="/logo.png" alt="SÉNECA C.F." className="w-24 h-auto object-contain" />
          </div>
          
          <div className="flex-1 ml-4 border text-sm flex flex-col" style={styles.borderBlack}>
            <div className="grid grid-cols-1 border-b flex-1" style={styles.borderBlack}>
              <div className="grid grid-cols-4 border-b" style={styles.borderBlack}>
                <div className="col-span-1 border-r p-2 font-bold text-center flex items-center justify-center uppercase" style={{ ...styles.borderBlack, ...styles.bgGray }}>OBJETIVO</div>
                <div className="col-span-3 p-2 text-center flex items-center justify-center font-medium">{datos.cabecera.objetivo || '-'}</div>
              </div>
              <div className="grid grid-cols-4" style={styles.borderBlack}>
                <div className="col-span-1 border-r p-2 font-bold text-center flex items-center justify-center uppercase" style={{ ...styles.borderBlack, ...styles.bgGray }}>PRINCIPIOS</div>
                <div className="col-span-3 p-2 text-center flex items-center justify-center font-medium">{datos.cabecera.principios || '-'}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 border-t" style={styles.borderBlack}>
              <div className="p-2 border-r font-bold text-center flex items-center justify-center" style={{ ...styles.borderBlack, ...styles.bgGray }}>MICROCICLO</div>
              <div className="p-2 border-r text-center flex items-center justify-center font-bold text-lg" style={styles.borderBlack}>{datos.cabecera.microcicloNum}</div>
              <div className="p-2 border-r font-bold text-center flex items-center justify-center" style={{ ...styles.borderBlack, ...styles.bgGray }}>FECHA</div>
              <div className="p-2 text-center flex flex-col items-center justify-center leading-tight">
                <span className="font-medium">{datos.cabecera.fecha}</span>
                <span className="text-xs" style={{ color: '#52525b' }}>{datos.cabecera.hora}</span>
              </div>
            </div>
          </div>

          <div className="ml-4 w-32 border text-sm flex flex-col" style={styles.borderBlack}>
             <div className="border-b p-2 font-bold text-center" style={{ ...styles.borderBlack, ...styles.bgGray }}>SESIÓN</div>
             <div className="p-4 text-center font-bold text-3xl flex-1 flex items-center justify-center">{datos.cabecera.sesionNum}</div>
          </div>
        </div>

        {/* MATERIAL */}
        <div className="border mb-4 text-sm" style={styles.borderBlack}>
          <div className="border-b p-1 font-bold text-center" style={{ ...styles.borderBlack, ...styles.bgGray }}>MATERIAL</div>
          <div className="grid grid-cols-10 text-center text-xs font-bold border-b" style={{ ...styles.borderBlack, ...styles.bgWhite }}>
            <div className="border-r p-1" style={styles.borderBlack}>BALONES</div>
            <div className="border-r p-1" style={styles.borderBlack}>PETOS 1</div>
            <div className="border-r p-1" style={styles.borderBlack}>PETOS 2</div>
            <div className="border-r p-1" style={styles.borderBlack}>PETOS 3</div>
            <div className="border-r p-1" style={styles.borderBlack}>CONOS</div>
            <div className="border-r p-1" style={styles.borderBlack}>AROS</div>
            <div className="border-r p-1" style={styles.borderBlack}>BANCOS</div>
            <div className="border-r p-1" style={styles.borderBlack}>FITBALL</div>
            <div className="border-r p-1" style={styles.borderBlack}>PICAS</div>
            <div className="p-1">PORTERÍAS</div>
          </div>
          <div className="grid grid-cols-10 text-center text-sm">
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.balones || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.petos1 || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.petos2 || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.petos3 || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.conos || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.aros || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.bancos || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.fitball || ''}</div>
            <div className="border-r p-1" style={styles.borderBlack}>{datos.material.picas || ''}</div>
            <div className="p-1">{datos.material.porterias || ''}</div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* TAREAS */}
          <div className="flex-1 flex flex-col gap-4">
            {datos.tareas.map((tarea, index) => (
              <div key={index} className="border text-sm flex" style={styles.borderBlack}>
                <div className="w-12 border-r flex flex-col items-center justify-center p-2 font-bold" style={{ ...styles.borderBlack, ...styles.bgWhite }}>
                  {tarea.tiempo}'
                </div>
                <div className="flex-1 p-2 flex flex-col" style={styles.bgWhite}>
                  <div className="font-bold mb-2 uppercase text-base">{tarea.titulo}</div>
                  <div className="whitespace-pre-wrap flex-1 leading-relaxed">{tarea.descripcion}</div>
                  
                  {tarea.equipos && (
                    <div className="mt-3">
                      <span className="font-bold">Equipos:</span> {tarea.equipos}
                    </div>
                  )}
                  {tarea.variables && (
                    <div className="mt-3" style={styles.textGray700}>
                      <span className="font-bold italic">Variables:</span> <span className="italic">{tarea.variables}</span>
                    </div>
                  )}
                  {tarea.roles && (
                    <div className="mt-3" style={styles.textGray700}>
                      <span className="font-bold">Roles CT:</span> {tarea.roles}
                    </div>
                  )}
                  {tarea.reflexion && (
                    <div className="mt-3">
                      <span className="font-bold">Reflexión:</span> <span className="font-medium">{tarea.reflexion}</span>
                    </div>
                  )}
                </div>
                <div className="w-64 border-l p-1 flex items-center justify-center" style={{ ...styles.borderBlack, ...styles.bgGreen }}>
                  {tarea.imagen_url ? (
                    <img src={tarea.imagen_url} alt="Tarea" className="max-w-full max-h-48 object-contain" />
                  ) : (
                    <span style={styles.textGray400}>Sin imagen</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* JUGADORES */}
          <div className="w-48 text-sm">
            <div className="border" style={styles.borderBlack}>
              <div className="border-b p-1 font-bold text-center" style={{ ...styles.borderBlack, ...styles.bgGray }}>JUGADORES DISPONIBLES</div>
              <div className="flex flex-col">
                {datos.jugadores.map((jugador, index) => (
                  <div 
                    key={jugador.id} 
                    className={`border-b py-2 px-2 flex items-center justify-center text-xs leading-normal text-center ${
                      !jugador.disponible ? 'line-through' : ''
                    }`}
                    style={
                      !jugador.disponible 
                        ? { ...styles.borderBlack, ...styles.bgRed, ...styles.textRed }
                        : { ...styles.borderBlack, ...styles.bgWhite }
                    }
                  >
                    <span className="font-bold mr-1.5">{index + 1}.</span>
                    <span className="font-medium whitespace-normal break-words">{jugador.nombre.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PlantillaPDFSesion.displayName = 'PlantillaPDFSesion';
