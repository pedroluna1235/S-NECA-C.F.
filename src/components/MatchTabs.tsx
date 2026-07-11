import { useState } from 'react';
import { cn } from '../lib/utils';
import { type Match } from './MatchCard';
import { InformeRivalTab } from './InformeRivalTab';
import { AlineacionTab } from './AlineacionTab';

interface MatchTabsProps {
  match: Match;
}

type TabId = 'informe' | 'alineacion' | 'plan' | 'abp' | 'eventos';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'informe', label: 'Informe rival' },
  { id: 'alineacion', label: 'Alineación' },
  { id: 'plan', label: 'Plan de partido' },
  { id: 'abp', label: 'ABP' },
  { id: 'eventos', label: 'Eventos' },
];

export function MatchTabs({ match }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('informe');

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
        {activeTab === 'informe' && <InformeRivalTab matchId={match.id} />}
        
        {activeTab === 'alineacion' && <AlineacionTab />}
        
        {activeTab === 'plan' && (
          <div className="flex items-center justify-center h-64 text-neutral-500 font-medium border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
            Plan de partido - Próximamente
          </div>
        )}
        
        {activeTab === 'abp' && (
          <div className="flex items-center justify-center h-64 text-neutral-500 font-medium border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
            Acciones a Balón Parado - Próximamente
          </div>
        )}
        
        {activeTab === 'eventos' && (
          <div className="flex items-center justify-center h-64 text-neutral-500 font-medium border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
            Eventos - Próximamente
          </div>
        )}
      </div>
    </div>
  );
}
