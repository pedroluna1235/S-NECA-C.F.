import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalNuevaSesion } from './ModalNuevaSesion';
import type { Sesion } from '../../pages/Sesiones';

interface CalendarioSesionesProps {
  sesiones: Sesion[];
  onSesionAdded: () => void;
}

export function CalendarioSesiones({ sesiones, onSesionAdded }: CalendarioSesionesProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const getSesionesParaDia = (day: Date) => {
    return sesiones.filter(s => isSameDay(parseISO(s.fecha), day));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white capitalize">
          {format(currentDate, dateFormat, { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center font-semibold text-sm text-neutral-500 dark:text-neutral-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1">
        {days.map((day, i) => {
          const daySesiones = getSesionesParaDia(day);
          const hasSesiones = daySesiones.length > 0;
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[80px] sm:min-h-[100px] p-2 rounded-xl border flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                ${!isCurrentMonth ? 'opacity-40 bg-neutral-50 dark:bg-neutral-900/50 border-transparent' : 'bg-white dark:bg-neutral-950 border-neutral-100 dark:border-neutral-800'}
                ${isToday(day) ? 'ring-2 ring-red-500 border-transparent' : ''}
                hover:border-red-300 dark:hover:border-red-500/50
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-red-600 text-white' : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {hasSesiones && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col gap-1 mt-1">
                {daySesiones.map((sesion) => (
                  <div 
                    key={sesion.id} 
                    className="text-xs truncate bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-1 rounded-md border border-red-100 dark:border-red-500/20"
                    title={sesion.titulo}
                  >
                    {sesion.titulo}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && selectedDate && (
        <ModalNuevaSesion
          fecha={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            onSesionAdded();
          }}
        />
      )}
    </div>
  );
}
