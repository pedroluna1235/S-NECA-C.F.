import { useState } from 'react';
import { cn } from '../lib/utils';
import { type Match } from './MatchCard';
import { AnalisisRivalTab } from './AnalisisRivalTab';
import { InformeRivalTab } from './InformeRivalTab';
import { AlineacionTab } from './AlineacionTab';
import { PlanPartidoTab } from './PlanPartidoTab';
import { ABPTab } from './ABPTab';
import { ConvocatoriaTab } from './ConvocatoriaTab';
import { EventosTab } from './EventosTab';

interface MatchTabsProps {
  match: Match;
}

type TabId = 'analisis_rival' | 'informe' | 'alineacion' | 'plan' | 'abp' | 'convocatoria' | 'eventos';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'analisis_rival', label: 'Análisis de rival' },
  { id: 'informe', label: 'Informe rival' },
  { id: 'alineacion', label: 'Alineación' },
  { id: 'plan', label: 'Plan de partido' },
  { id: 'abp', label: 'ABP' },
  { id: 'convocatoria', label: 'Convocatoria' },
  { id: 'eventos', label: 'Eventos' },
];

export function MatchTabs({ match }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('analisis_rival');

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2",
              activeTab === tab.id 
                ? "border-red-600 text-red-600 bg-white dark:bg-neutral-900" 
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'analisis_rival' && <AnalisisRivalTab matchId={match.id} />}
        
        {activeTab === 'informe' && <InformeRivalTab matchId={match.id} />}
        
        {activeTab === 'alineacion' && <AlineacionTab matchId={match.id} />}
        
        {activeTab === 'plan' && <PlanPartidoTab matchId={match.id} />}
        
        {activeTab === 'abp' && <ABPTab matchId={match.id} />}
        
        {activeTab === 'convocatoria' && <ConvocatoriaTab matchId={match.id} />}
        
        {activeTab === 'eventos' && <EventosTab matchId={match.id} />}
      </div>
    </div>
  );
}
