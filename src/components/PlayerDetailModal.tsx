import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, PlayCircle, FileText, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { type Player } from './PlayerCard';
import { differenceInYears } from 'date-fns';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { VideoModal } from './VideoModal';
import { ObjectiveModal } from './ObjectiveModal';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Target } from 'lucide-react';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: () => void;
}

const DEFAULT_STATS_GEN = { partidos: 0, titular: 0, goles: 0 };
const DEFAULT_STATS_CON_BALON = { pase_corto: 50, disparo: 50, vision: 50, control: 50, regate: 50 };
const DEFAULT_STATS_SIN_BALON = { presion: 50, recuperacion: 50, posicionamiento: 50, marcaje: 50, anticipacion: 50 };
const DEFAULT_STATS_FISICO = { velocidad: 50, salto: 50, agilidad: 50, resistencia: 50, fuerza: 50 };

export function PlayerDetailModal({ isOpen, onClose, player, onSuccess }: PlayerDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    if (!reportRef.current || !player) return;
    
    setIsGeneratingPdf(true);
    try {
      const node = reportRef.current;
      
      const imgData = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff',
        filter: (n) => {
          if (n instanceof HTMLElement && n.dataset.html2canvasIgnore === 'true') {
            return false;
          }
          return true;
        },
        style: {
          transform: 'none',
          margin: '0',
        }
      });
      
      // Averiguar si la imagen es vertical u horizontal para el PDF
      const tempPdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = tempPdf.getImageProperties(imgData);
      const isLandscape = imgProps.width > imgProps.height;
      
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular la escala
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;
      
      // Centrar
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Fondo
      const bgColor = document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff';
      pdf.setFillColor(bgColor);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${player.nombre.replace(/\s+/g, '_')}_Informe.pdf`);
    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF: ' + (error.message || String(error)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // State for editable stats
  const [gustos, setGustos] = useState('');
  const [statsGen, setStatsGen] = useState(DEFAULT_STATS_GEN);
  const [statsConBalon, setStatsConBalon] = useState(DEFAULT_STATS_CON_BALON);
  const [statsSinBalon, setStatsSinBalon] = useState(DEFAULT_STATS_SIN_BALON);
  const [statsFisico, setStatsFisico] = useState(DEFAULT_STATS_FISICO);

  useEffect(() => {
    if (isOpen && player) {
      setGustos(player.gustos || '');
      setStatsGen(player.estadisticas_generales || DEFAULT_STATS_GEN);
      setStatsConBalon(player.stats_con_balon || DEFAULT_STATS_CON_BALON);
      setStatsSinBalon(player.stats_sin_balon || DEFAULT_STATS_SIN_BALON);
      setStatsFisico(player.stats_fisico || DEFAULT_STATS_FISICO);
    }
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  let age: string | number = '-';
  if (player.fecha_nacimiento) {
    const parsedDate = new Date(player.fecha_nacimiento);
    if (!isNaN(parsedDate.getTime())) {
      age = differenceInYears(new Date(), parsedDate);
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({
          gustos,
          estadisticas_generales: statsGen,
          stats_con_balon: statsConBalon,
          stats_sin_balon: statsSinBalon,
          stats_fisico: statsFisico
        })
        .eq('id', player.id);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('Error al guardar las estadísticas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const conBalonData = [
    { subject: 'Pase corto', A: statsConBalon.pase_corto },
    { subject: 'Regate', A: statsConBalon.regate },
    { subject: 'Control', A: statsConBalon.control },
    { subject: 'Visión', A: statsConBalon.vision },
    { subject: 'Disparo', A: statsConBalon.disparo },
  ];

  const sinBalonData = [
    { subject: 'Presión', A: statsSinBalon.presion },
    { subject: 'Anticipación', A: statsSinBalon.anticipacion },
    { subject: 'Marcaje', A: statsSinBalon.marcaje },
    { subject: 'Posicionamiento', A: statsSinBalon.posicionamiento },
    { subject: 'Recuperación', A: statsSinBalon.recuperacion },
  ];

  const fisicoData = [
    { subject: 'Velocidad', A: statsFisico.velocidad },
    { subject: 'Resistencia', A: statsFisico.resistencia },
    { subject: 'Fuerza', A: statsFisico.fuerza },
    { subject: 'Salto', A: statsFisico.salto },
    { subject: 'Agilidad', A: statsFisico.agilidad },
  ];

  const getPositionAbbrev = (pos: string) => {
    switch (pos) {
      case 'Portero': return 'POR';
      case 'Defensa': return 'DEF';
      case 'Centrocampista': return 'CEN';
      case 'Delantero': return 'DEL';
      default: return pos.substring(0, 3).toUpperCase();
    }
  };

  const getBadgeColor = (pos: string) => {
    switch (pos) {
      case 'Portero': return 'bg-purple-500';
      case 'Defensa': return 'bg-blue-500';
      case 'Centrocampista': return 'bg-emerald-500';
      case 'Delantero': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const badgeColor = getBadgeColor(player.demarcacion);
  const abbrev = getPositionAbbrev(player.demarcacion);

  const renderRadar = (data: any[], color: string, fillColor: string) => (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e5e5" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Stats" dataKey="A" stroke={color} fill={fillColor} fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex p-4 sm:p-8 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div ref={reportRef} className="m-auto bg-neutral-50 dark:bg-neutral-950 rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          {/* Photo */}
          <div className="w-full md:w-1/3 min-h-[300px] bg-neutral-100 dark:bg-neutral-950/50 relative flex items-center justify-center p-4">
            {player.foto_url ? (
              <img src={player.foto_url} alt={player.nombre} className="w-full h-full object-contain drop-shadow-lg" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium">Sin foto</div>
            )}
            <div className="absolute bottom-4 left-4 z-10">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold text-white shadow-md ${badgeColor}`}>
                {abbrev}
              </span>
            </div>
          </div>

          {/* Info & Stats */}
          <div className="w-full md:w-2/3 p-8 relative">
            <button 
              onClick={onClose}
              data-html2canvas-ignore="true"
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-6">{player.nombre}</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex items-center gap-3 border border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center shadow-sm">
                  <span className="text-neutral-500 font-bold text-sm">POS</span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase">Posición</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{abbrev}</p>
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex items-center gap-3 border border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center shadow-sm">
                  <span className="text-neutral-500 font-bold text-sm">EDD</span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase">Edad</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{age} años</p>
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex items-center gap-3 border border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center shadow-sm">
                  <span className="text-neutral-500 font-bold text-sm">NAC</span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase">F. Nacimiento</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{player.fecha_nacimiento || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl flex items-center gap-3 border border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center shadow-sm">
                  <span className="text-neutral-500 font-bold text-sm">LAT</span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase">Lateralidad</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{player.lateralidad || 'No def.'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl text-center border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => setStatsGen({...statsGen, partidos: Math.max(0, statsGen.partidos - 1)})} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 shadow-sm text-neutral-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Minus size={14}/></button>
                  <input 
                    type="number" 
                    className="text-2xl font-black text-neutral-900 dark:text-white bg-transparent w-16 text-center focus:outline-none focus:bg-white dark:focus:bg-neutral-800 rounded-lg transition-colors" 
                    value={statsGen.partidos}
                    onChange={e => setStatsGen({...statsGen, partidos: parseInt(e.target.value) || 0})}
                  />
                  <button onClick={() => setStatsGen({...statsGen, partidos: statsGen.partidos + 1})} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 shadow-sm text-neutral-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Plus size={14}/></button>
                </div>
                <p className="text-xs text-neutral-500 font-bold uppercase mt-2">Partidos</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl text-center border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => setStatsGen({...statsGen, titular: Math.max(0, statsGen.titular - 1)})} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 shadow-sm text-neutral-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Minus size={14}/></button>
                  <input 
                    type="number" 
                    className="text-2xl font-black text-neutral-900 dark:text-white bg-transparent w-16 text-center focus:outline-none focus:bg-white dark:focus:bg-neutral-800 rounded-lg transition-colors" 
                    value={statsGen.titular}
                    onChange={e => setStatsGen({...statsGen, titular: parseInt(e.target.value) || 0})}
                  />
                  <button onClick={() => setStatsGen({...statsGen, titular: statsGen.titular + 1})} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-neutral-700 shadow-sm text-neutral-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Plus size={14}/></button>
                </div>
                <p className="text-xs text-neutral-500 font-bold uppercase mt-2">Titular</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl text-center border border-green-200 dark:border-green-800/50">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => setStatsGen({...statsGen, goles: Math.max(0, statsGen.goles - 1)})} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-green-900/50 shadow-sm text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors"><Minus size={14}/></button>
                  <input 
                    type="number" 
                    className="text-2xl font-black text-green-700 dark:text-green-500 bg-transparent w-16 text-center focus:outline-none focus:bg-white dark:focus:bg-green-900/50 rounded-lg transition-colors" 
                    value={statsGen.goles}
                    onChange={e => setStatsGen({...statsGen, goles: parseInt(e.target.value) || 0})}
                  />
                  <button onClick={() => setStatsGen({...statsGen, goles: statsGen.goles + 1})} className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-green-900/50 shadow-sm text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors"><Plus size={14}/></button>
                </div>
                <p className="text-xs text-green-600 dark:text-green-500 font-bold uppercase mt-2">Goles</p>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Gustos e Intereses</label>
              <textarea 
                placeholder="Ej: Le gusta jugar a los videojuegos, es muy competitivo, su equipo favorito es el Betis..."
                value={gustos}
                onChange={e => setGustos(e.target.value)}
                className="w-full h-24 p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-neutral-900 dark:text-white resize-none transition-all"
              />
            </div>

            <div className="flex gap-3" data-html2canvas-ignore="true">
              <button 
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <PlayCircle size={20} className="text-purple-600" /> Ver vídeo
              </button>
              <button 
                onClick={() => setIsObjectiveModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl font-bold transition-colors shadow-sm"
              >
                <Target size={20} /> Objetivo individual
              </button>
              <button 
                onClick={generatePdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />} 
                {isGeneratingPdf ? 'Generando...' : 'Crear informe'}
              </button>
            </div>
          </div>
        </div>

        {/* RADAR CHARTS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
          
          {/* Con Balón */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full">
            <h3 className="text-center font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest text-sm mb-4">Con Balón</h3>
            {renderRadar(conBalonData, '#a855f7', '#d8b4fe')}
            
            <div className="mt-8 space-y-4 flex-1">
              {Object.keys(statsConBalon).map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase">
                    <span>{key.replace('_', ' ')}</span>
                    <span className="text-neutral-900 dark:text-white">{statsConBalon[key as keyof typeof statsConBalon]}</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={statsConBalon[key as keyof typeof statsConBalon]}
                    onChange={e => setStatsConBalon({...statsConBalon, [key]: parseInt(e.target.value)})}
                    className="w-full accent-purple-500 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sin Balón */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full">
            <h3 className="text-center font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest text-sm mb-4">Sin Balón</h3>
            {renderRadar(sinBalonData, '#06b6d4', '#67e8f9')}
            
            <div className="mt-8 space-y-4 flex-1">
              {Object.keys(statsSinBalon).map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase">
                    <span>{key}</span>
                    <span className="text-neutral-900 dark:text-white">{statsSinBalon[key as keyof typeof statsSinBalon]}</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={statsSinBalon[key as keyof typeof statsSinBalon]}
                    onChange={e => setStatsSinBalon({...statsSinBalon, [key]: parseInt(e.target.value)})}
                    className="w-full accent-cyan-500 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Condición Física */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full">
            <h3 className="text-center font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest text-sm mb-4">Condición Física</h3>
            {renderRadar(fisicoData, '#f59e0b', '#fcd34d')}
            
            <div className="mt-8 space-y-4 flex-1">
              {Object.keys(statsFisico).map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase">
                    <span>{key}</span>
                    <span className="text-neutral-900 dark:text-white">{statsFisico[key as keyof typeof statsFisico]}</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={statsFisico[key as keyof typeof statsFisico]}
                    onChange={e => setStatsFisico({...statsFisico, [key]: parseInt(e.target.value)})}
                    className="w-full accent-amber-500 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-end" data-html2canvas-ignore="true">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md",
              isSubmitting 
                ? "bg-red-400 cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-700 hover:shadow-lg active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            <span>Guardar Cambios</span>
          </button>
        </div>

      </div>

      {/* Modal secundario de vídeo */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        player={player}
        onSuccess={onSuccess}
      />
      
      {/* Modal de objetivo individual */}
      <ObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={() => setIsObjectiveModalOpen(false)}
        player={player}
        onSuccess={onSuccess}
      />
    </div>
  );
}
