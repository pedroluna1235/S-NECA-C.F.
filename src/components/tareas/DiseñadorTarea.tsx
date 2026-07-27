import React, { useState, useRef, useCallback } from 'react';
import { 
  Save, X, Download, Loader2, MousePointer2, Type, Trash2, RotateCw, Copy
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';

type FieldType = 'F11' | 'F7' | 'MedioF11' | 'MedioF7' | 'SoloCesped';

type ElementType = 'player' | 'ball' | 'cone' | 'goal' | 'mini-goal' | 'hoop' | 'mannequin' | 'pole' | 'ladder' | 'fitball' | 'rebounder' | 'plyobox' | 'dumbbell' | 'hurdle' | 'shape' | 'text' | 'arrow' | 'line';

type CanvasElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  endX?: number; // for lines/arrows
  endY?: number;
  width?: number;
  height?: number;
  size?: number; // legacy
  color?: string;
  label?: string;      
  rotation?: number;
  shapeType?: 'rect' | 'circle' | 'triangle' | 'pentagon' | 'hexagon';
  isDashed?: boolean;
};

// --- Custom SVGs for Realistic Rendering ---

const SoccerBallSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e5e5e5" strokeWidth="2"/>
    <path d="M50 20 L30 35 L38 60 L62 60 L70 35 Z" fill="#222" />
    <path d="M50 20 L40 5 L60 5 Z" fill="#222" />
    <path d="M30 35 L5 30 L10 50 Z" fill="#222" />
    <path d="M70 35 L95 30 L90 50 Z" fill="#222" />
    <path d="M38 60 L20 85 L40 95 Z" fill="#222" />
    <path d="M62 60 L80 85 L60 95 Z" fill="#222" />
    <path d="M50 20 L50 0 M30 35 L15 20 M70 35 L85 20 M38 60 L25 75 M62 60 L75 75 M50 98 L50 85" stroke="#222" strokeWidth="3" fill="none"/>
  </svg>
);

const ConeSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" preserveAspectRatio="none">
    <defs>
      <linearGradient id={`cone-front-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="15%" stopColor={color} />
        <stop offset="100%" stopColor={`color-mix(in srgb, ${color} 80%, black)`} />
      </linearGradient>
    </defs>
    
    {/* Base shadow */}
    <ellipse cx="50" cy="72" rx="42" ry="16" fill="rgba(0,0,0,0.25)" />
    
    {/* Back slope */}
    <path d="M 8 68 A 42 15 0 0 1 92 68 L 65 35 A 15 5 0 0 0 35 35 Z" fill={`color-mix(in srgb, ${color} 65%, black)`} />
    
    {/* Front slope */}
    <path d="M 8 68 A 42 15 0 0 0 92 68 L 65 35 A 15 5 0 0 1 35 35 Z" fill={`url(#cone-front-${color})`} />
    
    {/* Inner hole */}
    <ellipse cx="50" cy="35" rx="15" ry="5" fill="rgba(0,0,0,0.2)" />
    
    {/* Inner hole depth (plastic thickness) */}
    <path d="M 35 35 A 15 5 0 0 0 65 35 L 62 38 A 12 4 0 0 1 38 38 Z" fill={`color-mix(in srgb, ${color} 40%, black)`} />
  </svg>
);

const HoopSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke={color} strokeWidth="6" />
    <ellipse cx="50" cy="50" rx="39" ry="39" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
  </svg>
);

const MannequinSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <rect x="25" y="90" width="50" height="10" fill="#333" rx="4" />
    <rect x="45" y="50" width="10" height="45" fill="#555" />
    <rect x="35" y="85" width="30" height="5" fill="#333" />
    <path d="M30 40 Q25 25 35 25 L65 25 Q75 25 70 40 L65 70 Q50 75 35 70 Z" fill={color} />
    <circle cx="50" cy="15" r="12" fill={color} />
    <path d="M30 40 Q25 25 35 25 L65 25 Q75 25 70 40 L65 70 Q50 75 35 70 Z" fill="rgba(0,0,0,0.1)" />
  </svg>
);

const GoalSVG = ({ isMini }: { isMini?: boolean }) => (
  <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-xl" preserveAspectRatio="none">
    <defs>
      <pattern id="net" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 10 M 0 0 L 10 10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect x="5" y="5" width="190" height="90" fill="url(#net)" />
    <rect x="5" y="5" width="190" height="90" fill="none" stroke="#fff" strokeWidth={isMini ? "6" : "8"} />
    <line x1="5" y1="5" x2="25" y2="95" stroke="#ccc" strokeWidth="3" />
    <line x1="195" y1="5" x2="175" y2="95" stroke="#ccc" strokeWidth="3" />
  </svg>
);

const LadderSVG = () => (
  <svg viewBox="0 0 300 60" className="w-full h-full drop-shadow-md" preserveAspectRatio="none">
    <rect x="0" y="5" width="300" height="4" fill="#222" />
    <rect x="0" y="51" width="300" height="4" fill="#222" />
    
    <rect x="5" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="45" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="85" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="125" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="165" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="205" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="245" y="5" width="8" height="50" fill="#eab308" rx="2" />
    <rect x="285" y="5" width="8" height="50" fill="#eab308" rx="2" />
  </svg>
);

const FitballSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
    <defs>
      <radialGradient id={`fitball-grad-${color}`} cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
        <stop offset="40%" stopColor={color} />
        <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill={`url(#fitball-grad-${color})`} />
    <path d="M15 30 Q50 45 85 30" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
    <path d="M8 50 Q50 65 92 50" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" />
    <path d="M15 70 Q50 85 85 70" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
  </svg>
);

const RebounderSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
    <defs>
      <pattern id="rebound-net" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M 6 0 L 0 6 M 0 0 L 6 6" fill="none" stroke="#333" strokeWidth="0.5"/>
      </pattern>
    </defs>
    {/* Legs */}
    <line x1="20" y1="90" x2="10" y2="20" stroke="#555" strokeWidth="5" strokeLinecap="round" />
    <line x1="80" y1="90" x2="90" y2="20" stroke="#555" strokeWidth="5" strokeLinecap="round" />
    {/* Frame and Net */}
    <polygon points="10,20 90,20 80,90 20,90" fill="url(#rebound-net)" />
    <polygon points="10,20 90,20 80,90 20,90" fill="none" stroke="#ef4444" strokeWidth="7" strokeLinejoin="round" />
    <polygon points="14,24 86,24 77,86 23,86" fill="none" stroke="#111" strokeWidth="2" />
  </svg>
);

const PlyoBoxSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" preserveAspectRatio="none">
    <rect x="5" y="15" width="90" height="80" fill="#1a1a1a" rx="4"/>
    <rect x="5" y="5" width="90" height="80" fill="#2d2d2d" rx="4"/>
    <rect x="5" y="5" width="90" height="80" fill="none" stroke="#555" strokeWidth="2" rx="4"/>
    <circle cx="50" cy="45" r="16" fill="#ef4444" />
    <circle cx="50" cy="45" r="14" fill="none" stroke="#fff" strokeWidth="1" />
    <text x="50" y="50" fontSize="14" fill="#fff" fontWeight="bold" textAnchor="middle">BOX</text>
  </svg>
);

const DumbbellSVG = () => (
  <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id="chrome-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#999" />
        <stop offset="50%" stopColor="#eee" />
        <stop offset="100%" stopColor="#666" />
      </linearGradient>
      <linearGradient id="rubber-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#333" />
        <stop offset="50%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#050505" />
      </linearGradient>
      <pattern id="knurling" width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M 0 4 L 4 0" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        <path d="M 0 0 L 4 4" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
      </pattern>
    </defs>
    
    {/* Handle */}
    <rect x="25" y="20" width="50" height="10" fill="url(#chrome-grad)" rx="2" />
    <rect x="30" y="20" width="40" height="10" fill="url(#knurling)" />

    {/* Left weight plates (hexagonal style) */}
    <polygon points="12,5 25,5 25,45 12,45" fill="url(#rubber-grad)" />
    <polygon points="4,12 12,5 12,45 4,38" fill="#222" />
    <polygon points="2,12 5,12 5,38 2,38" fill="#111" />

    {/* Right weight plates */}
    <polygon points="75,5 88,5 88,45 75,45" fill="url(#rubber-grad)" />
    <polygon points="88,5 96,12 96,38 88,45" fill="#222" />
    <polygon points="95,12 98,12 98,38 95,38" fill="#111" />
  </svg>
);

const HurdleSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-md">
    {/* Main Tube */}
    <path 
      d="M 28 35 L 18 48 L 25 15 L 75 15 L 82 48 L 72 35" 
      fill="none" 
      stroke={color} 
      strokeWidth="7" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Highlight for realism */}
    <path 
      d="M 25 17 L 75 17" 
      fill="none" 
      stroke="rgba(255,255,255,0.5)" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <path 
      d="M 23 25 L 19.5 40" 
      fill="none" 
      stroke="rgba(255,255,255,0.4)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <path 
      d="M 77 25 L 80.5 40" 
      fill="none" 
      stroke="rgba(255,255,255,0.4)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    
    {/* Black end caps */}
    <circle cx="28" cy="35" r="3" fill="#111" />
    <circle cx="72" cy="35" r="3" fill="#111" />
  </svg>
);

// --- Main Component ---

type DragMode = 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'move-start' | 'move-end' | null;

export function DiseñadorTarea({ 
  initialData, 
  onClose 
}: { 
  initialData?: any, 
  onClose: () => void 
}) {
  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [descripcion] = useState(initialData?.descripcion || '');
  const [tipo, setTipo] = useState(initialData?.configuracion_pizarra?.tipo || 'Activación');
  
  const [fieldType, setFieldType] = useState<FieldType>(initialData?.configuracion_pizarra?.fieldType || 'F11');
  const [elements, setElements] = useState<CanvasElement[]>(initialData?.configuracion_pizarra?.elements || []);
  
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [selectedTool, setSelectedTool] = useState<ElementType | 'pointer'>('pointer');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  
  const lastPosRef = useRef({ x: 0, y: 0 });

  const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const handleDownload = useCallback(async () => {
    if (pitchRef.current === null) return;
    try {
      setExporting(true);
      setSelectedElementId(null);
      await new Promise(r => setTimeout(r, 150)); 
      
      const el = pitchRef.current;
      const rect = el.getBoundingClientRect();
      
      const dataUrl = await toPng(el, { 
        cacheBust: true, 
        quality: 1, 
        pixelRatio: 2,
        width: rect.width,
        height: rect.height,
        style: {
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          maxWidth: 'none',
          maxHeight: 'none',
          margin: '0',
          transform: 'none'
        }
      });
      const link = document.createElement('a');
      link.download = `tarea-${titulo || 'sin-titulo'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Imagen descargada');
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar la imagen');
    } finally {
      setExporting(false);
    }
  }, [pitchRef, titulo]);

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error('Por favor, ingresa un título para la tarea');
      return;
    }
    
    try {
      setSaving(true);
      
      // Quitar selección para que no salgan los puntos blancos en la miniatura
      setSelectedElementId(null);
      await new Promise(r => setTimeout(r, 100));

      let thumbnail = null;
      if (pitchRef.current) {
        const el = pitchRef.current;
        const rect = el.getBoundingClientRect();
        try {
          thumbnail = await toPng(el, {
            cacheBust: true,
            quality: 0.6,
            pixelRatio: 0.5, // Baja resolución para miniatura
            width: rect.width,
            height: rect.height,
            style: {
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              maxWidth: 'none',
              maxHeight: 'none',
              margin: '0',
              transform: 'none'
            }
          });
        } catch (err) {
          console.warn('No se pudo generar la miniatura', err);
        }
      }

      const payload = {
        titulo,
        descripcion,
        configuracion_pizarra: { fieldType, elements, thumbnail, tipo }
      };

      if (initialData?.id) {
        const { error } = await supabase.from('tareas').update(payload).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Tarea actualizada');
      } else {
        const { error } = await supabase.from('tareas').insert([payload]);
        if (error) throw error;
        toast.success('Tarea guardada');
      }
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handlePitchClick = (e: React.MouseEvent) => {
    if (selectedTool === 'pointer' || !pitchRef.current) {
      if (e.target === pitchRef.current || (e.target as HTMLElement).id === 'pitch-svg-layer') {
        setSelectedElementId(null);
      }
      return;
    }

    const rect = pitchRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    const newEl: CanvasElement = { 
      id: genId(), type: selectedTool as ElementType, x, y, 
      color: '#ffffff', width: 30, height: 30, rotation: 0 
    };
    
    switch (selectedTool) {
      case 'player':
        newEl.width = 30; newEl.height = 30;
        newEl.label = '';
        newEl.color = '#ef4444';
        break;
      case 'ball':
        newEl.width = 20; newEl.height = 20;
        break;
      case 'cone':
        newEl.width = 20; newEl.height = 20;
        newEl.color = '#f97316';
        break;
      case 'goal':
        newEl.width = 120; newEl.height = 40;
        break;
      case 'mini-goal':
        newEl.width = 50; newEl.height = 25;
        break;
      case 'hoop':
        newEl.width = 30; newEl.height = 30;
        newEl.color = '#eab308';
        break;
      case 'mannequin':
        newEl.width = 25; newEl.height = 40;
        newEl.color = '#ef4444';
        break;
      case 'pole':
        newEl.width = 6; newEl.height = 40;
        newEl.color = '#fde047';
        break;
      case 'ladder':
        newEl.width = 150; newEl.height = 30;
        break;
      case 'fitball':
        newEl.width = 30; newEl.height = 30;
        newEl.color = '#3b82f6';
        break;
      case 'rebounder':
        newEl.width = 45; newEl.height = 45;
        break;
      case 'plyobox':
        newEl.width = 35; newEl.height = 35;
        break;
      case 'dumbbell':
        newEl.width = 40; newEl.height = 20;
        break;
      case 'hurdle':
        newEl.width = 40; newEl.height = 25;
        newEl.color = '#eab308';
        break;
      case 'shape':
        newEl.width = 60; newEl.height = 60;
        newEl.shapeType = 'rect';
        newEl.isDashed = false;
        break;
      case 'text':
        newEl.width = 100; newEl.height = 30;
        newEl.label = 'Texto aquí';
        newEl.color = '#ffffff';
        break;
      case 'arrow':
      case 'line':
        newEl.x = x - 5; 
        newEl.y = y;
        newEl.endX = x + 15;
        newEl.endY = y;
        newEl.color = '#ffffff';
        newEl.isDashed = selectedTool === 'arrow';
        break;
    }
    
    setElements([...elements, newEl]);
    setSelectedTool('pointer');
    setSelectedElementId(newEl.id);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, mode: DragMode = 'move') => {
    e.stopPropagation();
    if (selectedTool !== 'pointer') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(id);
    setDragMode(mode);
    setSelectedElementId(id);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragMode || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    const dx_pct = (dx / rect.width) * 100;
    const dy_pct = (dy / rect.height) * 100;

    setElements(prev => prev.map(el => {
      if (el.id !== draggingId) return el;
      
      let next = { ...el };

      if (dragMode === 'move') {
        next.x += dx_pct;
        next.y += dy_pct;
        if (next.endX !== undefined) next.endX += dx_pct;
        if (next.endY !== undefined) next.endY += dy_pct;
      } 
      else if (dragMode === 'move-start') {
        next.x += dx_pct;
        next.y += dy_pct;
      } 
      else if (dragMode === 'move-end') {
        if (next.endX !== undefined) next.endX += dx_pct;
        if (next.endY !== undefined) next.endY += dy_pct;
      } 
      else if (dragMode.startsWith('resize')) {
        let w = next.width || 30;
        let h = next.height || 30;
        let newW = w, newH = h;
        let actDx = 0, actDy = 0;

        if (dragMode === 'resize-br') {
            newW = Math.max(10, w + dx); actDx = newW - w;
            newH = Math.max(10, h + dy); actDy = newH - h;
            next.x += (actDx / rect.width * 100) / 2;
            next.y += (actDy / rect.height * 100) / 2;
        } else if (dragMode === 'resize-tl') {
            newW = Math.max(10, w - dx); actDx = w - newW;
            newH = Math.max(10, h - dy); actDy = h - newH;
            next.x -= (actDx / rect.width * 100) / 2;
            next.y -= (actDy / rect.height * 100) / 2;
        } else if (dragMode === 'resize-tr') {
            newW = Math.max(10, w + dx); actDx = newW - w;
            newH = Math.max(10, h - dy); actDy = h - newH;
            next.x += (actDx / rect.width * 100) / 2;
            next.y -= (actDy / rect.height * 100) / 2;
        } else if (dragMode === 'resize-bl') {
            newW = Math.max(10, w - dx); actDx = w - newW;
            newH = Math.max(10, h + dy); actDy = newH - h;
            next.x -= (actDx / rect.width * 100) / 2;
            next.y += (actDy / rect.height * 100) / 2;
        }
        next.width = newW;
        next.height = newH;
      }
      return next;
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingId(null);
      setDragMode(null);
    }
  };

  const handleDeleteElement = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = elements.find(el => el.id === id);
    if (!target) return;
    
    const duplicateId = genId();
    // Offset slightly so it doesn't overlap perfectly
    const duplicate = { ...target, id: duplicateId, x: target.x + 2, y: target.y + 2 };
    
    setElements(prev => [...prev, duplicate]);
    setSelectedElementId(duplicateId);
  };

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setElements(elements.map(el => el.id === selectedElementId ? { ...el, ...updates } : el));
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const pitchStyle = {
    backgroundImage: `repeating-linear-gradient(
      0deg,
      #32963a,
      #32963a 10%,
      #2b8732 10%,
      #2b8732 20%
    )`
  };

  // Render a resize handle
  const ResizeHandle = ({ elId, mode, x, y }: { elId: string, mode: DragMode, x: number, y: number }) => {
    const cursor = (mode === 'resize-tl' || mode === 'resize-br') ? 'nwse-resize' : 'nesw-resize';
    return (
      <div 
        className="absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-sm z-30"
        style={{ left: `calc(${x}% - 6px)`, top: `calc(${y}% - 6px)`, cursor }}
        onPointerDown={(e) => handlePointerDown(e, elId, mode)}
      />
    );
  };

  // Render line point handle
  const PointHandle = ({ elId, mode, x, y }: { elId: string, mode: DragMode, x: number, y: number }) => (
    <div 
      className="absolute w-4 h-4 bg-white border-2 border-blue-600 rounded-full z-30 shadow-md cursor-grab active:cursor-grabbing"
      style={{ left: `calc(${x}% - 8px)`, top: `calc(${y}% - 8px)` }}
      onPointerDown={(e) => handlePointerDown(e, elId, mode)}
    />
  );

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-900 flex flex-col font-sans">
      <header className="bg-neutral-950 border-b border-neutral-800 px-6 py-4 flex items-center justify-between shrink-0 text-white">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <X size={24} className="text-neutral-400" />
          </button>
          <div className="flex-1 max-w-xl flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Título de la tarea..." 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder:text-neutral-500"
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="bg-neutral-800 border-none rounded-lg text-sm px-3 py-1 text-white w-fit"
            >
              <option value="Activación">Activación</option>
              <option value="Rondo">Rondo</option>
              <option value="Posesión">Posesión</option>
              <option value="Juego lúdico">Juego lúdico</option>
              <option value="Juego de posición">Juego de posición</option>
              <option value="Físico">Físico</option>
              <option value="Minipartidos">Minipartidos</option>
              <option value="ABP">ABP</option>
              <option value="Finalizaciones">Finalizaciones</option>
              <option value="Partidos Modificados">Partidos Modificados</option>
            </select>
            <select 
                value={fieldType} 
                onChange={(e) => setFieldType(e.target.value as FieldType)}
                className="bg-neutral-800 border-none rounded-lg text-sm px-3 py-1 text-white w-fit"
              >
                <option value="F11">Fútbol 11</option>
                <option value="F7">Fútbol 7</option>
                <option value="MedioF11">Medio Campo F11</option>
                <option value="MedioF7">Medio Campo F7</option>
                <option value="SoloCesped">Solo Césped</option>
              </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span className="hidden sm:inline">Exportar PNG</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row relative overflow-hidden bg-neutral-900">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden p-4 gap-4 xl:gap-6">
        
        <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
        <div 

          ref={pitchRef}
          onClick={handlePitchClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`relative border-[6px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden touch-none ${selectedTool !== 'pointer' ? 'cursor-crosshair' : ''}`}
          style={{ 
            ...pitchStyle,
            width: '100%', 
            maxHeight: '100%',
            maxWidth: fieldType.startsWith('Medio') ? '600px' : '900px', 
            aspectRatio: fieldType.startsWith('Medio') ? '3/4' : '3/2',
            margin: '0 auto'
          }}
        >
          {/* Pitch Lines */}
          {fieldType !== 'SoloCesped' && (
             <div className="absolute inset-[10px] border-[3px] border-white/80 pointer-events-none z-0"></div>
          )}
          
          {/* F11 and F7 Lines */}
          {(fieldType === 'F11' || fieldType === 'F7') && (
            <>
              {/* Center Line and Circle */}
              <div className="absolute left-1/2 top-[10px] bottom-[10px] border-l-[3px] border-white/80 pointer-events-none z-0"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full border-[3px] border-white/80 pointer-events-none z-0"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 pointer-events-none z-0"></div>
              
              {/* Left Penalty Area */}
              <div className="absolute left-[10px] top-[22%] bottom-[22%] w-[16%] border-[3px] border-l-0 border-white/80 pointer-events-none z-0"></div>
              <div className="absolute left-[10px] top-[36%] bottom-[36%] w-[6%] border-[3px] border-l-0 border-white/80 pointer-events-none z-0"></div>
              <div className="absolute left-[14%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80 pointer-events-none z-0"></div>
              <div className="absolute left-[14%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] aspect-square rounded-full border-[3px] border-white/80 pointer-events-none clip-half-right z-0"></div>
              
              {/* Right Penalty Area */}
              <div className="absolute right-[10px] top-[22%] bottom-[22%] w-[16%] border-[3px] border-r-0 border-white/80 pointer-events-none z-0"></div>
              <div className="absolute right-[10px] top-[36%] bottom-[36%] w-[6%] border-[3px] border-r-0 border-white/80 pointer-events-none z-0"></div>
              <div className="absolute right-[14%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80 pointer-events-none z-0"></div>
              <div className="absolute right-[14%] top-1/2 translate-x-1/2 -translate-y-1/2 w-[15%] aspect-square rounded-full border-[3px] border-white/80 pointer-events-none clip-half-left z-0"></div>
            </>
          )}

          {/* MedioF11 and MedioF7 Lines (Vertical Half Pitch) */}
          {(fieldType === 'MedioF11' || fieldType === 'MedioF7') && (
            <>
              {/* Center circle at the top border */}
              <div className="absolute left-1/2 top-[10px] -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square rounded-full border-[3px] border-white/80 pointer-events-none z-0"></div>
              <div className="absolute left-1/2 top-[10px] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 pointer-events-none z-0"></div>
              
              {/* Bottom Penalty Area */}
              <div className="absolute bottom-[10px] left-[20%] right-[20%] h-[24%] border-[3px] border-b-0 border-white/80 pointer-events-none z-0"></div>
              <div className="absolute bottom-[10px] left-[35%] right-[35%] h-[8%] border-[3px] border-b-0 border-white/80 pointer-events-none z-0"></div>
              <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80 pointer-events-none z-0"></div>
              <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 translate-y-1/2 w-[22%] aspect-square rounded-full border-[3px] border-white/80 pointer-events-none clip-half-top z-0"></div>
            </>
          )}

          {/* Lines / Arrows Layer (SVG) */}
          <svg id="pitch-svg-layer" className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {/* Draw arrow markers */}
            <defs>
              {elements.filter(e => e.type === 'arrow').map(el => (
                <marker key={`marker-${el.id}`} id={`arrowhead-${el.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={el.color || '#fff'} />
                </marker>
              ))}
            </defs>
            {elements.filter(e => e.type === 'line' || e.type === 'arrow').map((el) => {
               const isSelected = selectedElementId === el.id;
               return (
                 <g key={el.id} className={selectedTool === 'pointer' ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-auto'}>
                    {isSelected && (
                      <line x1={`${el.x}%`} y1={`${el.y}%`} x2={`${el.endX}%`} y2={`${el.endY}%`} stroke="transparent" strokeWidth="20" onPointerDown={(e) => handlePointerDown(e, el.id)} />
                    )}
                    <line 
                      x1={`${el.x}%`} y1={`${el.y}%`} x2={`${el.endX}%`} y2={`${el.endY}%`} 
                      stroke={el.color || '#fff'} strokeWidth="4" 
                      strokeDasharray={el.isDashed ? "8,8" : "none"}
                      markerEnd={el.type === 'arrow' ? `url(#arrowhead-${el.id})` : undefined}
                      onPointerDown={(e) => handlePointerDown(e, el.id)}
                      className={isSelected ? "filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : ""}
                    />
                 </g>
               )
            })}
          </svg>

          {/* Render Elements */}
          {elements.map((el) => {
            const isSelected = selectedElementId === el.id;
            const width = el.width || el.size || 30;
            const height = el.height || el.size || 30;
            const isLine = el.type === 'line' || el.type === 'arrow';
            
            if (isLine) {
              if (isSelected && selectedTool === 'pointer') {
                 return (
                   <React.Fragment key={`handles-${el.id}`}>
                      <PointHandle elId={el.id} mode="move-start" x={el.x} y={el.y} />
                      <PointHandle elId={el.id} mode="move-end" x={el.endX!} y={el.endY!} />
                   </React.Fragment>
                 )
              }
              return null; // Lines themselves drawn in SVG
            }

            const style: React.CSSProperties = {
              left: `calc(${el.x}% - ${width/2}px)`, 
              top: `calc(${el.y}% - ${height/2}px)`, 
              width, height,
              transform: `rotate(${el.rotation || 0}deg)`
            };
            
            const baseZ = el.type === 'shape' ? 'z-0' : 'z-10';
            const selectedZ = el.type === 'shape' ? 'z-5' : 'z-20';
            const commonClasses = `absolute flex items-center justify-center touch-none ${selectedTool === 'pointer' ? 'cursor-grab active:cursor-grabbing' : ''} ${isSelected ? `ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent ${selectedZ}` : baseZ}`;

            let elementContent = null;
            if (el.type === 'player') {
              elementContent = <div className="w-full h-full rounded-full border-2 border-white shadow-lg font-bold text-white flex items-center justify-center" style={{ backgroundColor: el.color, fontSize: Math.max(10, Math.min(width, height)*0.5) }}>{el.label}</div>;
            } else if (el.type === 'ball') {
              elementContent = <SoccerBallSVG />;
            } else if (el.type === 'cone') {
              elementContent = <ConeSVG color={el.color || '#f97316'} />;
            } else if (el.type === 'goal' || el.type === 'mini-goal') {
              elementContent = <GoalSVG isMini={el.type === 'mini-goal'} />;
            } else if (el.type === 'hoop') {
              elementContent = <HoopSVG color={el.color || '#eab308'} />;
            } else if (el.type === 'mannequin') {
              elementContent = <MannequinSVG color={el.color || '#ef4444'} />;
            } else if (el.type === 'pole') {
              elementContent = <div className="w-full h-full rounded-full shadow-md border border-black/10" style={{ backgroundColor: el.color || '#fde047' }} />;
            } else if (el.type === 'ladder') {
              elementContent = <LadderSVG />;
            } else if (el.type === 'fitball') {
              elementContent = <FitballSVG color={el.color || '#3b82f6'} />;
            } else if (el.type === 'rebounder') {
              elementContent = <RebounderSVG />;
            } else if (el.type === 'plyobox') {
              elementContent = <PlyoBoxSVG />;
            } else if (el.type === 'dumbbell') {
              elementContent = <DumbbellSVG />;
            } else if (el.type === 'hurdle') {
              elementContent = <HurdleSVG color={el.color || '#eab308'} />;
            } else if (el.type === 'text') {
              elementContent = <div className="w-full h-full font-bold drop-shadow-md whitespace-nowrap" style={{ color: el.color || '#ffffff', fontSize: `${height}px` }}>{el.label || 'Texto'}</div>;
            } else if (el.type === 'shape') {
              if (el.shapeType === 'triangle' || el.shapeType === 'pentagon' || el.shapeType === 'hexagon') {
                 let clipPath = '';
                 let points = '';
                 if (el.shapeType === 'triangle') { clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'; points = '50,0 0,100 100,100'; }
                 else if (el.shapeType === 'pentagon') { clipPath = 'polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)'; points = '50,0 100,38 81,100 19,100 0,38'; }
                 else if (el.shapeType === 'hexagon') { clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'; points = '50,0 100,25 100,75 50,100 0,75 0,25'; }

                 elementContent = <div className="w-full h-full relative" style={{
                    clipPath,
                    backgroundColor: el.isDashed ? 'transparent' : (el.color || '#ffffff')
                 }}><svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none"><polygon points={points} fill={el.isDashed ? 'none' : (el.color || '#ffffff')} stroke={el.color || '#ffffff'} strokeWidth="4" strokeDasharray={el.isDashed ? "8,8" : "none"} vectorEffect="non-scaling-stroke" /></svg></div>;
              } else {
                 elementContent = <div className={`w-full h-full ${el.shapeType === 'circle' ? 'rounded-full' : ''} border-[4px] ${el.isDashed ? 'border-dashed' : ''} bg-opacity-30`} style={{ borderColor: el.color || '#ffffff', backgroundColor: el.isDashed ? 'transparent' : (el.color || '#ffffff') }} />;
              }
            }

            return (
              <React.Fragment key={el.id}>
                <div onPointerDown={(e) => handlePointerDown(e, el.id)} style={style} className={commonClasses}>
                  {elementContent}
                </div>
                {isSelected && selectedTool === 'pointer' && (
                  <>
                    <ResizeHandle elId={el.id} mode="resize-tl" x={el.x - (width/2/pitchRef.current!.getBoundingClientRect().width)*100} y={el.y - (height/2/pitchRef.current!.getBoundingClientRect().height)*100} />
                    <ResizeHandle elId={el.id} mode="resize-tr" x={el.x + (width/2/pitchRef.current!.getBoundingClientRect().width)*100} y={el.y - (height/2/pitchRef.current!.getBoundingClientRect().height)*100} />
                    <ResizeHandle elId={el.id} mode="resize-bl" x={el.x - (width/2/pitchRef.current!.getBoundingClientRect().width)*100} y={el.y + (height/2/pitchRef.current!.getBoundingClientRect().height)*100} />
                    <ResizeHandle elId={el.id} mode="resize-br" x={el.x + (width/2/pitchRef.current!.getBoundingClientRect().width)*100} y={el.y + (height/2/pitchRef.current!.getBoundingClientRect().height)*100} />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>
        </div>

        {/* Floating Bottom Toolbar (Dock) */}
        <div className="bg-neutral-800/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-1 z-50 overflow-x-auto max-w-full shrink-0">
          
          <ToolBtn icon={<MousePointer2 size={24} />} tool="pointer" current={selectedTool} set={setSelectedTool} title="Seleccionar/Mover" label="Mover" />
          <div className="w-px h-8 bg-neutral-700 mx-1 shrink-0"></div>
          
          <ToolBtn 
            icon={<div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">10</div>} 
            tool="player" current={selectedTool} set={setSelectedTool} title="Jugador" label="Jugador" 
          />
          <ToolBtn 
            icon={<div className="w-6 h-6"><SoccerBallSVG /></div>} 
            tool="ball" current={selectedTool} set={setSelectedTool} title="Balón" label="Balón"
          />
          
          <div className="w-px h-8 bg-neutral-700 mx-1 shrink-0"></div>
          
          <ToolBtn 
            icon={<div className="w-8 h-6"><GoalSVG /></div>} 
            tool="goal" current={selectedTool} set={setSelectedTool} title="Portería Normal" label="Portería"
          />
          <ToolBtn 
            icon={<div className="w-6 h-4"><GoalSVG isMini /></div>} 
            tool="mini-goal" current={selectedTool} set={setSelectedTool} title="Mini Portería" label="Mini"
          />
          <ToolBtn 
            icon={<div className="w-4 h-6"><MannequinSVG color="#ef4444" /></div>} 
            tool="mannequin" current={selectedTool} set={setSelectedTool} title="Muñeco" label="Muñeco"
          />
          <ToolBtn 
            icon={<div className="w-5 h-5"><ConeSVG color="#f97316" /></div>} 
            tool="cone" current={selectedTool} set={setSelectedTool} title="Cono" label="Cono"
          />
          <ToolBtn 
            icon={<div className="w-6 h-6"><HoopSVG color="#eab308" /></div>} 
            tool="hoop" current={selectedTool} set={setSelectedTool} title="Aro" label="Aro"
          />
          <ToolBtn 
            icon={<div className="w-1.5 h-6 bg-yellow-300 rounded-full border border-black/10 mx-auto"></div>} 
            tool="pole" current={selectedTool} set={setSelectedTool} title="Pica" label="Pica"
          />
          <ToolBtn 
            icon={<div className="w-6 h-3"><LadderSVG /></div>} 
            tool="ladder" current={selectedTool} set={setSelectedTool} title="Escalera" label="Escalera"
          />
          <ToolBtn 
            icon={<div className="w-5 h-5"><FitballSVG color="#3b82f6" /></div>} 
            tool="fitball" current={selectedTool} set={setSelectedTool} title="Fitball" label="Fitball"
          />
          <ToolBtn 
            icon={<div className="w-5 h-5"><RebounderSVG /></div>} 
            tool="rebounder" current={selectedTool} set={setSelectedTool} title="Reboteador" label="Rebote."
          />
          <ToolBtn 
            icon={<div className="w-5 h-5"><PlyoBoxSVG /></div>} 
            tool="plyobox" current={selectedTool} set={setSelectedTool} title="Cajón Pliometría" label="Cajón"
          />
          <ToolBtn 
            icon={<div className="w-6 h-3"><DumbbellSVG /></div>} 
            tool="dumbbell" current={selectedTool} set={setSelectedTool} title="Mancuerna" label="Pesa"
          />
          <ToolBtn 
            icon={<div className="w-6 h-4"><HurdleSVG color="#eab308" /></div>} 
            tool="hurdle" current={selectedTool} set={setSelectedTool} title="Valla" label="Valla"
          />
          
          <div className="w-px h-8 bg-neutral-700 mx-1 shrink-0"></div>
          <ToolBtn 
            icon={<div className="w-6 h-6 border-2 border-dashed border-white"></div>} 
            tool="shape" current={selectedTool} set={setSelectedTool} title="Forma" label="Forma"
          />
          <ToolBtn 
            icon={<div className="w-6 h-2 border-t-2 border-white relative mt-2"><div className="absolute right-[-2px] top-[-3px] w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-white"></div></div>} 
            tool="arrow" current={selectedTool} set={setSelectedTool} title="Flecha" label="Flecha"
          />
          <ToolBtn icon={<Type size={22} />} tool="text" current={selectedTool} set={setSelectedTool} title="Texto" label="Texto" />

        </div>

              </div>

        {/* Floating Property Panel for Selected Element */}
        {selectedElement && (
          <div className="xl:w-80 w-full bg-neutral-800 border-t xl:border-t-0 xl:border-l border-neutral-700 shadow-2xl p-4 shrink-0 overflow-y-auto max-h-[35vh] xl:max-h-none z-50 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Propiedades</h3>
              <button onClick={() => setSelectedElementId(null)} className="text-neutral-400 hover:text-white xl:hidden p-1 hover:bg-neutral-700 rounded transition-colors"><X size={16}/></button>
            </div>
            
            {/* Color Picker */}
            {['player', 'cone', 'hoop', 'mannequin', 'fitball', 'hurdle', 'shape', 'text', 'pole', 'line', 'arrow'].includes(selectedElement.type) && (
              <div className="flex flex-wrap gap-2">
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#eab308', '#f97316', '#a855f7', '#171717', '#ffffff'].map(c => (
                  <button 
                    key={c}
                    onClick={() => updateSelectedElement({ color: c })}
                    className={`w-6 h-6 rounded-full border-2 ${selectedElement.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            
            {/* Number/Text Input */}
            {['player', 'text'].includes(selectedElement.type) && (
              <div>
                 <label className="text-xs text-neutral-400 mb-1 block">
                   {selectedElement.type === 'player' ? 'Número' : 'Texto'}
                 </label>
                 <input 
                   type="text" 
                   value={selectedElement.label || ''}
                   onChange={(e) => updateSelectedElement({ label: e.target.value })}
                   maxLength={selectedElement.type === 'player' ? 3 : 50}
                   className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white text-sm focus:outline-none focus:border-neutral-500"
                 />
              </div>
            )}

            {/* Shape options */}
            {selectedElement.type === 'shape' && (
              <div className="flex flex-wrap gap-2 bg-neutral-900 p-2 rounded-lg">
                <button onClick={() => updateSelectedElement({ shapeType: 'rect' })} className={`flex-1 min-w-[3rem] p-1.5 rounded text-[10px] font-bold ${selectedElement.shapeType === 'rect' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>Rect</button>
                <button onClick={() => updateSelectedElement({ shapeType: 'circle' })} className={`flex-1 min-w-[3rem] p-1.5 rounded text-[10px] font-bold ${selectedElement.shapeType === 'circle' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>Circ</button>
                <button onClick={() => updateSelectedElement({ shapeType: 'triangle' })} className={`flex-1 min-w-[3rem] p-1.5 rounded text-[10px] font-bold ${selectedElement.shapeType === 'triangle' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>Trian</button>
                <button onClick={() => updateSelectedElement({ shapeType: 'pentagon' })} className={`flex-1 min-w-[3rem] p-1.5 rounded text-[10px] font-bold ${selectedElement.shapeType === 'pentagon' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>Pent</button>
                <button onClick={() => updateSelectedElement({ shapeType: 'hexagon' })} className={`flex-1 min-w-[3rem] p-1.5 rounded text-[10px] font-bold ${selectedElement.shapeType === 'hexagon' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>Hex</button>
              </div>
            )}
            
            {(selectedElement.type === 'shape' || selectedElement.type === 'line' || selectedElement.type === 'arrow') && (
               <button onClick={() => updateSelectedElement({ isDashed: !selectedElement.isDashed })} className={`w-full py-1.5 rounded text-xs font-bold ${selectedElement.isDashed ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-400'}`}>{selectedElement.type === 'shape' ? 'Borde Punteado' : 'Línea Punteada'}</button>
            )}

             {/* Rotation */}
             <div className="space-y-3">
              {selectedElement.type !== 'line' && selectedElement.type !== 'arrow' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 w-12 flex items-center gap-1"><RotateCw size={12}/> Giro</span>
                  <input type="range" min="0" max="360" value={selectedElement.rotation || 0} onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) })} className="flex-1 accent-blue-500" />
                </div>
              )}
             </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button 
                onClick={() => handleDuplicateElement(selectedElement.id)}
                className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 text-sm py-2 rounded transition-colors border border-blue-900/50"
              >
                <Copy size={16} /> Duplicar
              </button>
              <button 
                onClick={() => handleDeleteElement(selectedElement.id)}
                className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 text-sm py-2 rounded transition-colors border border-red-900/50"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        )}

        
      </main>
      <style>{`
        .clip-half-right {
          clip-path: polygon(65% 0, 100% 0, 100% 100%, 65% 100%);
        }
        .clip-half-left {
          clip-path: polygon(0 0, 35% 0, 35% 100%, 0 100%);
        }
        .clip-half-top {
          clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background-color: #525252;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

function ToolBtn({ icon, tool, current, set, title, label }: { icon: React.ReactNode, tool: any, current: any, set: any, title: string, label: string }) {
  const active = current === tool;
  return (
    <button
      title={title}
      onClick={() => set(tool)}
      className={`flex flex-col items-center justify-center gap-1 w-12 h-14 rounded-xl transition-all shrink-0 ${active ? 'bg-blue-600 shadow-inner' : 'hover:bg-neutral-700'}`}
    >
      <div className={`flex items-center justify-center flex-1 transition-transform ${active ? 'scale-110 drop-shadow-md' : 'text-neutral-400'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-medium tracking-tight ${active ? 'text-white' : 'text-neutral-400'}`}>{label}</span>
    </button>
  );
}
