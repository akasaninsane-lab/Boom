import React from 'react';
import { MessageSquare, User, Globe, Trophy, Activity, ShieldAlert, Percent } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import akLogo from '../assets/images/ak_football_logo_1785711161137.jpg';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
  onOpenAIScout: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedLeague,
  setSelectedLeague,
  onOpenAIScout,
  onOpenProfile,
}) => {
  const { lang, setLang, t } = useLanguage();

  const leagues = [
    { id: 'all', name: t('allLeagues') },
    { id: 'UEFA Champions League', name: t('championsLeague') },
    { id: 'Premier League', name: t('premierLeague') },
    { id: 'La Liga', name: t('laLiga') },
    { id: 'Bundesliga', name: t('bundesliga') },
    { id: 'Serie A', name: t('serieA') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sm:gap-6">
        {/* Logo & Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer shrink-0"
          onClick={() => setActiveTab('matches')}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md bg-slate-950 flex items-center justify-center shrink-0">
            <img
              src={akLogo}
              alt="Power By AK Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
              Power By <span className="text-emerald-400">AK</span>
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] px-2.5 py-1 rounded-lg font-semibold w-fit shadow-inner">
              {t('aiEngineStatus')}
            </span>
          </div>
        </div>

        {/* Right Header Actions (AI Scout, Language & Profile) */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* AI Scout Button */}
          <button
            onClick={onOpenAIScout}
            className="flex items-center space-x-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs px-3.5 py-2 rounded-xl font-semibold transition shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{t('aiScout')}</span>
          </button>

          {/* Quick Language Toggle */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                lang === 'en' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('my')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                lang === 'my' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              မြန်မာ
            </button>
          </div>

          {/* User Profile Area in Top Corner */}
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 px-3 py-1.5 rounded-xl transition text-xs font-semibold group"
            title={t('userProfile')}
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden md:inline text-slate-200 group-hover:text-white">
              {t('profile')}
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-md border border-emerald-500/30 font-mono">
              Lv.4
            </span>
          </button>
        </div>
      </div>

      {/* League Filters Horizontal Scroll Bar */}
      <div className="bg-slate-950 px-4 sm:px-6 lg:px-8 py-2 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                selectedLeague === league.id
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
