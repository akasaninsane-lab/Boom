import React from 'react';
import { Activity, Trophy, Percent, Zap, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'matches',
      label: t('matchesTab'),
      icon: Activity,
    },
    {
      id: 'standings',
      label: t('standingsTab'),
      icon: Trophy,
    },
    {
      id: 'odds',
      label: t('oddsTab'),
      icon: Percent,
    },
    {
      id: 'tactics',
      label: t('tactics'),
      icon: Zap,
    },
    {
      id: 'injuries',
      label: t('injuryLab'),
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl py-1.5 px-2">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 ${
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] leading-tight tracking-tight text-center font-medium truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
