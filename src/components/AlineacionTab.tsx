import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, BrainCircuit, User, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Jugador {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string | null;
  foto_url: string | null;
}

type Sistema = '1-2-3-1' | '1-3-2-1' | '1-3-1-2' | '1-2-2-2';

interface PositionDef {
  id: string;
  label: string;
  top: number;
  left: number;
}

const SISTEMAS: Record<Sistema, PositionDef[]> = {
  '1-2-3-1': [
    { id: 'POR', label: 'POR', top: 90, left: 50 },
    { id: 'DFD', label: 'DFD', top: 75, left: 80 },
    { id: 'DFI', label: 'DFI', top: 75, left: 20 },
    { id: 'MCD', label: 'MCD', top: 55, left: 50 },
    { id: 'MD',  label: 'MD',  top: 40, left: 85 },
    { id: 'MI',  label: 'MI',  top: 40, left: 15 },
    { id: 'DC',  label: 'DC',  top: 15, left: 50 },
  ],
  '1-3-2-1': [
    { id: 'POR', label: 'POR', top: 90, left: 50 },
    { id: 'DFD', label: 'DFD', top: 75, left: 85 },
    { id: 'DFC', label: 'DFC', top: 75, left: 50 },
    { id: 'DFI', label: 'DFI', top: 75, left: 15 },
    { id: 'MC1', label: 'MC',  top: 45, left: 65 },
    { id: 'MC2', label: 'MC',  top: 45, left: 35 },
    { id: 'DC',  label: 'DC',  top: 15, left: 50 },
  ],
  '1-3-1-2': [
    { id: 'POR', label: 'POR', top: 90, left: 50 },
    { id: 'DFD', label: 'DFD', top: 75, left: 85 },
    { id: 'DFC', label: 'DFC', top: 75, left: 50 },
    { id: 'DFI', label: 'DFI', top: 75, left: 15 },
    { id: 'MC',  label: 'MC',  top: 50, left: 50 },
    { id: 'DC1', label: 'DC',  top: 15, left: 65 },
    { id: 'DC2', label: 'DC',  top: 15, left: 35 },
  ],
  '1-2-2-2': [
    { id: 'POR', label: 'POR', top: 90, left: 50 },
    { id: 'DFD', label: 'DFD', top: 75, left: 75 },
    { id: 'DFI', label: 'DFI', top: 75, left: 25 },
    { id: 'MD',  label: 'MD',  top: 45, left: 75 },
    { id: 'MI',  label: 'MI',  top: 45, left: 25 },
    { id: 'DC1', label: 'DC',  top: 15, left: 65 },
    { id: 'DC2', label: 'DC',  top: 15, left: 35 },
  ],
};

export function AlineacionTab() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sistema, setSistema] = useState<Sistema>('1-2-3-1');
  const [alineacion, setAlineacion] = useState<Record<string, Jugador | null>>({});
  
  const [sistemaRival, setSistemaRival] = useState<Sistema>('1-3-2-1');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analisis, setAnalisis] = useState<string | null>(null);

  const [jugadorAnalizado, setJugadorAnalizado] = useState<Jugador | null>(null);
  const [isAnalyzingJugador, setIsAnalyzingJugador] = useState(false);
  const [analisisPlayer, setAnalisisPlayer] = useState<{conBalon: string[], sinBalon: string[], duelos: string[]} | null>(null);

  // Drag and drop state
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null); // 'bench' or position id

  useEffect(() => {
    fetchJugadores();
  }, []);

  const fetchJugadores = async () => {
    try {
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('dorsal', { ascending: true });
      if (error) throw error;
      setJugadores(data || []);
    } catch (error) {
      console.error('Error fetching jugadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, playerId: string, source: string) => {
    setDraggedPlayerId(playerId);
    setDragSource(source);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToPosition = (e: React.DragEvent, positionId: string) => {
    e.preventDefault();
    if (!draggedPlayerId) return;

    const player = jugadores.find(j => j.id === draggedPlayerId);
    if (!player) return;

    setAlineacion(prev => {
      const newAlin = { ...prev };
      
      // If dropping into a position that already has a player, we swap or return it to bench
      const existingPlayerInTarget = newAlin[positionId];
      
      // Remove player from its previous position if it was already on the pitch
      if (dragSource && dragSource !== 'bench') {
        newAlin[dragSource] = existingPlayerInTarget || null;
      }
      
      // Assign player to new position
      newAlin[positionId] = player;
      
      return newAlin;
    });
    
    setDraggedPlayerId(null);
    setDragSource(null);
  };

  const handleDropToBench = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPlayerId || !dragSource || dragSource === 'bench') return;

    setAlineacion(prev => {
      const newAlin = { ...prev };
      newAlin[dragSource] = null;
      return newAlin;
    });

    setDraggedPlayerId(null);
    setDragSource(null);
  };

  const analizarIA = () => {
    setIsAnalyzing(true);
    // Simulate AI API call
    setTimeout(() => {
      setAnalisis(`Análisis táctico: Nuestro **${sistema}** vs Rival **${sistemaRival}**:

**Ventajas del Emparejamiento:**
1. **Superioridad central:** Al poblar el mediocampo frente a su dibujo, aseguras superioridad numérica en la medular, facilitando la posesión y recuperación rápida.
2. **Amplitud controlada:** Tus jugadores de banda pueden hacer basculaciones rápidas para crear 2vs1 ofensivos si su sistema carece de ayudas.
3. **Bloque defensivo compacto:** Facilita transiciones defensivas rápidas impidiendo contragolpes por el centro.

**Desventajas del Emparejamiento:**
1. **Desgaste en bandas:** Requiere gran esfuerzo físico de los carrileros/extremos si el rival plantea un sistema ancho.
2. **Riesgo en amplitud rival:** Al enfrentarte a un ${sistemaRival}, podrías quedar en inferioridad numérica en los costados.
3. **Poca presencia en el área:** Al jugar con un único delantero, si no hay acompañamiento rápido, el '9' queda aislado contra sus defensas.`);
      setIsAnalyzing(false);
    }, 2000);
  };

  const analizarJugador = (jugador: Jugador) => {
    setJugadorAnalizado(jugador);
    setIsAnalyzingJugador(true);
    // Simulate AI API call
    setTimeout(() => {
      setAnalisisPlayer({
        conBalon: [
          'Combinar rápido en corto para superar líneas.',
          'Progresar conduciendo si hay espacio libre.',
          'Buscar el cambio de orientación al extremo opuesto.'
        ],
        sinBalon: [
          'Mantener la línea defensiva junta y compacta.',
          'Saltar a presionar si el rival recibe de espaldas.',
          'Cobertura inmediata al lateral si sube al ataque.'
        ],
        duelos: [
          'Fuerte en el juego aéreo defensivo.',
          'Anticipación en pases filtrados por el centro.'
        ]
      });
      setIsAnalyzingJugador(false);
    }, 1500);
  };

  const getJugadoresBanquillo = () => {
    const onPitchIds = Object.values(alineacion).filter(Boolean).map(j => j!.id);
    return jugadores.filter(j => !onPitchIds.includes(j.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  const banquillo = getJugadoresBanquillo();
  const posiciones = SISTEMAS[sistema];

  // When system changes, we might need to clear positions that no longer exist, but for simplicity we keep them in state. They just won't render.
  
  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in h-full">
      {/* Left Column: Tactics Board & System Selector */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top bar with selector and AI button */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 min-w-28">Nuestro Sist.:</label>
              <div className="flex bg-white dark:bg-neutral-900 rounded-xl p-1 shadow-sm border border-neutral-200 dark:border-neutral-800">
                {(Object.keys(SISTEMAS) as Sistema[]).map(sys => (
                  <button
                    key={sys}
                    onClick={() => setSistema(sys)}
                    className={cn(
                      "px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all",
                      sistema === sys 
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    )}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 min-w-28 text-red-600 dark:text-red-400">Sistema Rival:</label>
              <div className="flex bg-white dark:bg-neutral-900 rounded-xl p-1 shadow-sm border border-neutral-200 dark:border-neutral-800">
                {(Object.keys(SISTEMAS) as Sistema[]).map(sys => (
                  <button
                    key={`rival-${sys}`}
                    onClick={() => setSistemaRival(sys)}
                    className={cn(
                      "px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all",
                      sistemaRival === sys 
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    )}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={analizarIA}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2 sm:mt-0"
          >
            <span className="flex items-center justify-center w-[18px] h-[18px]">
              {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
            </span>
            <span>Analizar IA</span>
          </button>
        </div>

        {/* Pitch Area */}
        <div className="relative w-full max-w-md mx-auto aspect-[2/3] bg-green-600 rounded-lg overflow-hidden border-4 border-green-700 shadow-inner flex-shrink-0"
             style={{
               backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 100px)`
             }}>
          
          {/* Pitch Lines */}
          <div className="absolute inset-4 border-2 border-white/50 rounded" />
          <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/50 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/80 rounded-full" />
          
          {/* Penalty areas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-white/50 border-b-0" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-white/50 border-t-0" />
          
          {/* Goal areas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/4 h-[8%] border-2 border-white/50 border-b-0" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/4 h-[8%] border-2 border-white/50 border-t-0" />

          {/* Goal semi-circles */}
          <div className="absolute bottom-[calc(16.66%+4px)] left-1/2 -translate-x-1/2 w-12 h-6 border-2 border-white/50 rounded-t-full border-b-0" />
          <div className="absolute top-[calc(16.66%+4px)] left-1/2 -translate-x-1/2 w-12 h-6 border-2 border-white/50 rounded-b-full border-t-0" />

          {/* Drop zones & Players (Our Team) */}
          {posiciones.map((pos) => {
            const player = alineacion[pos.id];
            
            return (
              <div
                key={pos.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToPosition(e, pos.id)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition-all z-20",
                  player ? "border-white/20 bg-neutral-900/90" : "border-dashed border-white/60 bg-white/10 backdrop-blur-sm"
                )}
                style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
              >
                {player ? (
                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, player.id, pos.id)}
                    onClick={() => analizarJugador(player)}
                    className="w-full h-full rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group overflow-hidden relative"
                  >
                    {player.foto_url ? (
                       <img src={player.foto_url} alt={player.nombre} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                       <User size={20} className="text-white/80" />
                    )}
                    {/* Dark overlay with number */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                       {player.dorsal && <span className="text-white font-black text-[15px] leading-none">{player.dorsal}</span>}
                    </div>
                    {/* Name tag */}
                    <div className="absolute -bottom-5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-30" translate="no">
                      {player.nombre.split(' ')[0]}
                    </div>
                  </div>
                ) : (
                  <span className="text-white/70 font-bold text-[10px]" translate="no">{pos.label}</span>
                )}
              </div>
            );
          })}

          {/* Rival Team Positions (Mirrored) */}
          {SISTEMAS[sistemaRival].map((pos) => {
            return (
              <div
                key={`rival-${pos.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center border-2 border-red-500/50 bg-red-600/20 backdrop-blur-sm shadow-sm transition-all z-10 opacity-70"
                style={{ 
                  top: `${100 - pos.top}%`, 
                  left: `${100 - pos.left}%` 
                }}
              >
                <span className="text-red-100 font-bold text-[8px]" translate="no">{pos.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Bench and Analysis */}
      <div className="w-full xl:w-80 flex flex-col gap-4">
        
        {/* Analysis Panel */}
        {analisis && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/50 p-4 rounded-2xl relative shadow-sm">
            <button 
              onClick={() => setAnalisis(null)}
              className="absolute top-3 right-3 text-violet-500 hover:text-violet-700 bg-violet-100 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:text-violet-100 p-1 rounded-full"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 mb-3 text-violet-700 dark:text-violet-400 font-bold">
              <BrainCircuit size={20} />
              <h3>Análisis Táctico IA</h3>
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {analisis.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('**Ventajas') || line.startsWith('**Desventajas') ? 'font-bold mt-2 text-violet-900 dark:text-violet-200' : ''}>
                  {line.replace(/\*\*/g, '')}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Player Analysis Panel */}
        {jugadorAnalizado && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl relative shadow-sm">
            <button 
              onClick={() => { setJugadorAnalizado(null); setAnalisisPlayer(null); }}
              className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:hover:text-neutral-200 p-1 rounded-full"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4 pr-6">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex items-center justify-center border-2 border-neutral-100 dark:border-neutral-800">
                {jugadorAnalizado.foto_url ? (
                  <img src={jugadorAnalizado.foto_url} alt={jugadorAnalizado.nombre} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-neutral-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">{jugadorAnalizado.nombre}</h3>
                <span className="text-[10px] font-bold text-neutral-500 uppercase">{jugadorAnalizado.demarcacion || 'Jugador'} - {sistema}</span>
              </div>
            </div>
            
            {isAnalyzingJugador ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <span className="text-xs text-neutral-500 font-medium">Analizando con IA...</span>
              </div>
            ) : analisisPlayer ? (
              <div className="space-y-3">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800/30">
                  <h4 className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1">⚽ CON BALÓN</h4>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 pl-4 list-disc marker:text-blue-400">
                    {analisisPlayer.conBalon.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-100 dark:border-orange-800/30">
                  <h4 className="text-[10px] font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-1">🛡️ SIN BALÓN</h4>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 pl-4 list-disc marker:text-orange-400">
                    {analisisPlayer.sinBalon.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-900/10 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
                  <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">⚔️ DUELOS CLAVE</h4>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 pl-4 list-disc marker:text-slate-400">
                    {analisisPlayer.duelos.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Bench / Jugadores Disponibles */}
        <div 
          className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-sm min-h-[300px]"
          onDragOver={handleDragOver}
          onDrop={handleDropToBench}
        >
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
              Banquillo
              <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs px-2 py-1 rounded-full">
                {banquillo.length} disp.
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Arrastra los jugadores al campo</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
            {banquillo.length === 0 ? (
              <div className="text-center text-neutral-400 text-sm py-10">
                Todos los jugadores están en el campo.
              </div>
            ) : (
              Object.entries(
                banquillo.reduce((acc, jugador) => {
                  const pos = jugador.demarcacion || 'Sin posición';
                  if (!acc[pos]) acc[pos] = [];
                  acc[pos].push(jugador);
                  return acc;
                }, {} as Record<string, Jugador[]>)
              ).map(([posicion, jugadoresGrupo]) => (
                <div key={posicion} className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider pl-1 border-b border-neutral-200 dark:border-neutral-800 pb-1">{posicion}</h4>
                  {jugadoresGrupo.map(jugador => (
                    <div
                      key={jugador.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, jugador.id, 'bench')}
                      className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-grab active:cursor-grabbing transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-white dark:border-neutral-600 shadow-sm">
                        {jugador.foto_url ? (
                          <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                          {jugador.nombre}
                        </p>
                        <p className="text-xs text-neutral-500 flex gap-2">
                          {jugador.dorsal && <span>#{jugador.dorsal}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
