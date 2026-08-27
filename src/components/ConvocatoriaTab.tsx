import { useState, useEffect } from 'react';
import { Save, Loader2, FileDown, Clock, MapPin, Shirt, Users, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface ConvocatoriaTabProps {
  matchId: string;
}

interface Jugador {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string;
  foto_url: string | null;
}

interface MatchDetails {
  fecha: string;
  condicion: string;
  lugar: string;
  jornada: string | null;
  rival: { 
    nombre: string;
    escudo_url: string | null;
  };
}

// Helper to convert image URL to base64 using Canvas (fixes EXIF rotation issues)
const getBase64ImageFromUrl = (imageUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required for CORS
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 300;
      const MAX_HEIGHT = 300;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = Math.round((width * MAX_HEIGHT) / height);
        height = MAX_HEIGHT;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          console.error("Canvas toDataURL error:", e);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn("Could not load image for PDF:", imageUrl);
      resolve(null);
    };
    // If it's a local path, avoid cache issues or just use it. For remote, append a timestamp if cache causes CORS issues, but usually fine.
    img.src = imageUrl;
  });
};

const getWatermarkBase64 = (imageUrl: string, opacity: number = 0.08): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // We don't need it to be huge, 800px is enough for a watermark
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.globalAlpha = opacity;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};

export function ConvocatoriaTab({ matchId }: ConvocatoriaTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [convocatoriaId, setConvocatoriaId] = useState<string | null>(null);
  
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [selectedJugadores, setSelectedJugadores] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    hora_partido: '',
    hora_citacion: '',
    lugar_citacion: '',
    indumentaria: '',
    observaciones: '',
    como_ir: '',
  });

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Match Details
      const { data: matchData, error: matchError } = await supabase
        .from('partidos')
        .select('fecha, condicion, lugar, jornada, rival:equipos(nombre, escudo_url)')
        .eq('id', matchId)
        .single();
        
      if (matchError) throw matchError;
      setMatchDetails(matchData as unknown as MatchDetails);

      // Fetch Jugadores
      const { data: jugadoresData, error: jugadoresError } = await supabase
        .from('jugadores')
        .select('id, nombre, dorsal, demarcacion, foto_url')
        .order('dorsal', { ascending: true });
        
      if (jugadoresError) throw jugadoresError;
      setJugadores(jugadoresData || []);

      // Fetch Convocatoria if exists
      const { data: convData, error: convError } = await supabase
        .from('convocatoria')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (convError && convError.code !== 'PGRST116') throw convError;

      if (convData) {
        setConvocatoriaId(convData.id);
        setFormData({
          hora_partido: convData.hora_partido || '',
          hora_citacion: convData.hora_citacion || '',
          lugar_citacion: convData.lugar_citacion || '',
          indumentaria: convData.indumentaria || '',
          observaciones: convData.observaciones || '',
          como_ir: convData.como_ir || '',
        });
        setSelectedJugadores(convData.jugadores_ids || []);
      } else {
        // Preset with match location if available
        setFormData(prev => ({
          ...prev,
          lugar_citacion: matchData?.lugar || ''
        }));
      }

    } catch (error) {
      console.error('Error loading convocatoria data:', error);
      toast.error('Error al cargar la convocatoria');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleJugador = (id: string) => {
    setSelectedJugadores(prev => 
      prev.includes(id) 
        ? prev.filter(jId => jId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => setSelectedJugadores(jugadores.map(j => j.id));
  const deselectAll = () => setSelectedJugadores([]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        partido_id: matchId,
        ...formData,
        jugadores_ids: selectedJugadores
      };

      if (convocatoriaId) {
        const { error } = await supabase
          .from('convocatoria')
          .update(payload)
          .eq('id', convocatoriaId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('convocatoria')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) setConvocatoriaId(data.id);
      }
      
      toast.success('Convocatoria guardada correctamente');
    } catch (error) {
      console.error('Error saving convocatoria:', error);
      toast.error('Error al guardar la convocatoria. Asegúrate de haber ejecutado el SQL para las observaciones.');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!matchDetails) return;
    
    try {
      setGeneratingPdf(true);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // --- HEADER ---
      // Add red header strip
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageWidth, 42, 'F');
      
      // Add Watermark
      const watermarkBase64 = await getWatermarkBase64('/logo.png', 0.12);
      if (watermarkBase64) {
        try {
          const wmSize = 140;
          const wmX = (pageWidth - wmSize) / 2;
          // Place it vertically centered in the lower part of the page
          const wmY = 120;
          doc.addImage(watermarkBase64, 'PNG', wmX, wmY, wmSize, wmSize);
        } catch (e) {
          console.error("Error adding watermark:", e);
        }
      }
      
      // Load and add Logos
      const localLogoBase64 = await getBase64ImageFromUrl('/logo.png');
      const rivalLogoBase64 = matchDetails.rival?.escudo_url ? await getBase64ImageFromUrl(matchDetails.rival.escudo_url) : null;
      
      const isLocal = matchDetails.condicion !== 'Visitante';
      
      if (localLogoBase64) {
        try {
          doc.addImage(localLogoBase64, 'PNG', isLocal ? 14 : pageWidth - 30, 8, 25, 25);
        } catch (e) {
          console.error("Error adding local logo:", e);
        }
      }
      if (rivalLogoBase64) {
        try {
          doc.addImage(rivalLogoBase64, 'PNG', !isLocal ? 14 : pageWidth - 30, 8, 25, 25);
        } catch (e) {
          console.error("Error adding rival logo:", e);
        }
      }
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CONVOCATORIA OFICIAL", pageWidth / 2, 14, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      
      let matchTitle = isLocal ? `SÉNECA C.F. vs ${matchDetails.rival?.nombre}` : `${matchDetails.rival?.nombre} vs SÉNECA C.F.`;
      doc.text(matchTitle, pageWidth / 2, 22, { align: 'center' });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      if (matchDetails.jornada) {
        doc.text(matchDetails.jornada, pageWidth / 2, 29, { align: 'center' });
      }
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Prebenjamín A - ADN Rojinegro", pageWidth / 2, 36, { align: 'center' });
      
      // --- INFO BOX ---
      let currentY = 50;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const dateFormatted = new Date(matchDetails.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      doc.text(`Fecha: ${dateFormatted}`, 14, currentY);
      doc.text(`Condición: ${matchDetails.condicion || 'Local'}`, 100, currentY);
      currentY += 8;
      
      // Call-up details box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      
      const hasObservaciones = formData.observaciones && formData.observaciones.trim() !== '';
      const hasComoIr = formData.como_ir && formData.como_ir.trim() !== '';
      
      let boxHeight = 45;
      if (hasComoIr) boxHeight += 10;
      if (hasObservaciones) boxHeight += 20;
      
      doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 3, 3, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.text("Detalles de la Citación:", 18, currentY + 10);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Hora de citación: ${formData.hora_citacion || 'Por definir'}`, 18, currentY + 18);
      doc.text(`Lugar de citación: ${formData.lugar_citacion || 'Por definir'}`, 18, currentY + 26);
      doc.text(`Hora del partido: ${formData.hora_partido || 'Por definir'}`, 100, currentY + 18);
      doc.text(`Indumentaria: ${formData.indumentaria || 'Oficial'}`, 18, currentY + 34);
      
      let nextLineY = currentY + 44;
      
      if (hasComoIr) {
        doc.setFont("helvetica", "bold");
        doc.text("Cómo ir:", 18, nextLineY);
        doc.setFont("helvetica", "normal");
        
        doc.setTextColor(37, 99, 235); // Blue color for link
        doc.textWithLink("Abrir ubicación en Google Maps", 36, nextLineY, { url: formData.como_ir });
        doc.setTextColor(0, 0, 0); // Reset color
        
        nextLineY += 10;
      }
      
      if (hasObservaciones) {
        doc.setFont("helvetica", "bold");
        doc.text("Observaciones:", 18, nextLineY);
        doc.setFont("helvetica", "normal");
        
        // Split long text into multiple lines
        const obsLines = doc.splitTextToSize(formData.observaciones, pageWidth - 36);
        doc.text(obsLines, 18, nextLineY + 7);
      }
      
      currentY += boxHeight + 15;
      
      // --- PLAYERS SECTION ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Jugadores Convocados (${selectedJugadores.length})`, 14, currentY);
      currentY += 10;
      
      const convocados = jugadores.filter(j => selectedJugadores.includes(j.id));
      const posiciones = ['Portero', 'Defensa', 'Centrocampista', 'Delantero'];
      
      // Pre-load all player images to Base64 to avoid rendering issues
      const playerImages: Record<string, string | null> = {};
      const imagePromises = convocados.map(async (j) => {
        if (j.foto_url) {
          const b64 = await getBase64ImageFromUrl(j.foto_url);
          playerImages[j.id] = b64;
        } else {
          playerImages[j.id] = null;
        }
      });
      await Promise.all(imagePromises);
      
      // Draw grid
      const cols = 5;
      const colWidth = (pageWidth - 28) / cols;
      
      for (const pos of posiciones) {
        const jugadoresPos = convocados.filter(j => j.demarcacion === pos);
        if (jugadoresPos.length > 0) {
          
          // Check page bounds before drawing position header
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(220, 38, 38);
          doc.text(pos.toUpperCase() + 'S', 14, currentY);
          currentY += 6;
          
          let currentColumn = 0;
          let rowMaxHeight = 28; // height allocated for a row of players
          
          for (let i = 0; i < jugadoresPos.length; i++) {
            const jugador = jugadoresPos[i];
            
            // If new row needed, increment Y and reset column
            if (currentColumn >= cols) {
              currentColumn = 0;
              currentY += rowMaxHeight;
              
              if (currentY > 270) {
                doc.addPage();
                currentY = 20;
              }
            }
            
            const xPos = 14 + (currentColumn * colWidth);
            
            // Draw photo or placeholder
            const photoB64 = playerImages[jugador.id];
            if (photoB64) {
              try {
                doc.addImage(photoB64, 'PNG', xPos, currentY, 16, 16);
              } catch (e) {
                // fallback if drawing fails
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(240, 240, 240);
                doc.rect(xPos, currentY, 16, 16, 'FD');
              }
            } else {
              // Placeholder rectangle
              doc.setDrawColor(200, 200, 200);
              doc.setFillColor(240, 240, 240);
              doc.rect(xPos, currentY, 16, 16, 'FD');
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(7);
              doc.text("Sin foto", xPos + 8, currentY + 9, { align: 'center' });
            }
            
            // Draw Name and Dorsal
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            
            // Shorten name if too long (take first 2 parts usually)
            const nameParts = jugador.nombre.split(' ');
            const shortName = nameParts.length > 2 ? `${nameParts[0]} ${nameParts[1]}` : jugador.nombre;
            
            doc.text(shortName, xPos, currentY + 20, { maxWidth: colWidth - 2 });
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text(`Dorsal: ${jugador.dorsal || '-'}`, xPos, currentY + 24);
            
            currentColumn++;
          }
          
          // Move Y down for the next position group
          currentY += rowMaxHeight + 2;
        }
      }
      
      doc.save(`Convocatoria_SenecaCF_vs_${matchDetails.rival?.nombre}.pdf`);
      toast.success("PDF generado con éxito");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Desconocido";
      toast.error(`Hubo un error al generar el PDF: ${errorMessage}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  const groupedJugadores = {
    Portero: jugadores.filter(j => j.demarcacion === 'Portero'),
    Defensa: jugadores.filter(j => j.demarcacion === 'Defensa'),
    Centrocampista: jugadores.filter(j => j.demarcacion === 'Centrocampista'),
    Delantero: jugadores.filter(j => j.demarcacion === 'Delantero'),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Convocatoria</h2>
          <p className="text-neutral-500 mt-1">Configura la citación, las observaciones y genera el informe.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={generatePDF}
            disabled={generatingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {generatingPdf ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileDown size={18} />
            )}
            {generatingPdf ? "Generando..." : "Generar PDF"}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-70"
          >
            <span className={cn("flex items-center gap-2", !saving && "hidden")}>
              <Loader2 size={18} className="animate-spin" />
              <span>Guardando...</span>
            </span>
            <span className={cn(saving && "hidden")}>
              <Save size={18} />
              <span>Guardar</span>
            </span>
          </button>
        </div>
      </div>

      {/* DETAILS FORM */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="text-red-500" size={20} />
          Datos de la Citación
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Hora del Partido</label>
            <input 
              type="time" 
              name="hora_partido"
              value={formData.hora_partido}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Hora de Citación</label>
            <input 
              type="time" 
              name="hora_citacion"
              value={formData.hora_citacion}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <MapPin size={16} className="text-neutral-400" />
              Lugar de Citación
            </label>
            <input 
              type="text" 
              name="lugar_citacion"
              value={formData.lugar_citacion}
              onChange={handleInputChange}
              placeholder="Ej: Vestuario, Puerta Norte..."
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Shirt size={16} className="text-neutral-400" />
              Indumentaria y Materiales
            </label>
            <input 
              type="text" 
              name="indumentaria"
              value={formData.indumentaria}
              onChange={handleInputChange}
              placeholder="Ej: Ropa de paseo, botas de taco..."
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Como Ir */}
        <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-6">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <MapPin size={16} className="text-neutral-400" />
            Cómo ir (Enlace a Google Maps u otros)
          </label>
          <input 
            type="url"
            name="como_ir"
            value={formData.como_ir}
            onChange={handleInputChange}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
          />
        </div>

        {/* Observaciones */}
        <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <FileText size={16} className="text-neutral-400" />
            Observaciones Adicionales
          </label>
          <textarea 
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            placeholder="Ej: Todos los jugadores deben llevar su DNI original. Estar 10 minutos antes de la hora acordada..."
            rows={3}
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium resize-none"
          />
        </div>
      </div>

      {/* PLAYERS SELECTION */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="text-red-500" size={20} />
            Jugadores Convocados
            <span className="bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm py-1 px-3 rounded-full ml-2">
              {selectedJugadores.length}
            </span>
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={selectAll}
              className="text-sm font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
            >
              Seleccionar Todos
            </button>
            <button 
              onClick={deselectAll}
              className="text-sm font-bold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedJugadores).map(([posicion, jugadoresPos]) => {
            if (jugadoresPos.length === 0) return null;
            return (
              <div key={posicion}>
                <h4 className="text-sm font-black text-neutral-400 uppercase tracking-wider mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  {posicion}s
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {jugadoresPos.map(jugador => {
                    const isSelected = selectedJugadores.includes(jugador.id);
                    return (
                      <button
                        key={jugador.id}
                        onClick={() => toggleJugador(jugador.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group",
                          isSelected 
                            ? "border-red-500 bg-red-50/50 dark:bg-red-500/10 shadow-sm" 
                            : "border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        )}
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 relative flex items-center justify-center">
                          {jugador.foto_url ? (
                            <img 
                              src={jugador.foto_url} 
                              alt={jugador.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users size={20} className="text-neutral-400" />
                          )}
                          {/* Selection indicator overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px]">
                              <CheckCircle2 className="text-red-500 drop-shadow-md" size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-bold text-sm truncate transition-colors",
                            isSelected ? "text-red-700 dark:text-red-400" : "text-neutral-700 dark:text-neutral-300"
                          )}>
                            {jugador.nombre}
                          </p>
                          {jugador.dorsal && (
                            <p className="text-xs font-medium text-neutral-500 mt-0.5">Dorsal {jugador.dorsal}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
