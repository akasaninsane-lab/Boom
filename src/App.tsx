import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MatchCenter } from './components/MatchCenter';
import { InjuryLab } from './components/InjuryLab';
import { TacticalLab } from './components/TacticalLab';
import { MatchSimulator } from './components/MatchSimulator';
import { MyPredictions } from './components/MyPredictions';
import { PredictionModal } from './components/PredictionModal';
import { AIScoutChat } from './components/AIScoutChat';
import { LeagueStandings } from './components/LeagueStandings';
import { OddsOverview } from './components/OddsOverview';
import { ProfileModal } from './components/ProfileModal';
import { BottomNav } from './components/BottomNav';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Match, PlayerInjury, UserPrediction } from './types';
import { INITIAL_INJURIES, INITIAL_MATCHES, TEAMS } from './data/mockFootballData';
import { Award, Zap } from 'lucide-react';

function AppMain() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('matches');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');

  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [injuries, setInjuries] = useState<PlayerInjury[]>(INITIAL_INJURIES);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);

  // Modals state
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<Match | null>(null);
  const [selectedMatchForTactics, setSelectedMatchForTactics] = useState<Match | null>(null);
  const [selectedMatchForSim, setSelectedMatchForSim] = useState<Match | null>(null);
  const [isAIScoutOpen, setIsAIScoutOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Initial theme & data sync
  useEffect(() => {
    const savedTheme = localStorage.getItem('footy_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    }

    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        if (data.matches) setMatches(data.matches);
      })
      .catch((err) => console.log('Using initial client matches:', err));

    fetch('/api/injuries')
      .then((res) => res.json())
      .then((data) => {
        if (data.injuries) setInjuries(data.injuries);
      })
      .catch((err) => console.log('Using initial client injuries:', err));
  }, []);

  const filteredMatches = matches.filter(
    (m) => selectedLeague === 'all' || m.league === selectedLeague
  );

  const handleAddInjury = (newInj: PlayerInjury) => {
    setInjuries((prev) => [newInj, ...prev]);
    // Sync with backend
    fetch('/api/injuries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInj),
    }).catch(() => {});
  };

  const handleUpdateInjuryStatus = (injuryId: string, status: PlayerInjury['status']) => {
    setInjuries((prev) =>
      prev.map((i) => (i.id === injuryId ? { ...i, status } : i))
    );
  };

  const handleSaveUserPrediction = (pred: UserPrediction) => {
    setUserPredictions((prev) => [pred, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLeague={selectedLeague}
        setSelectedLeague={setSelectedLeague}
        onOpenAIScout={() => setIsAIScoutOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
        {/* Sub Header Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span className="font-medium text-slate-400">
            {t('aiEngineStatus')}
          </span>

          <button
            onClick={() => setActiveTab('predictions')}
            className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition"
          >
            <Award className="w-4 h-4" />
            <span>{t('savedPredictions')} ({userPredictions.length})</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'matches' && (
          <MatchCenter
            matches={filteredMatches}
            injuries={injuries}
            onSelectMatch={(m) => setSelectedMatchForModal(m)}
            onSimulateMatch={(m) => {
              setSelectedMatchForSim(m);
              setActiveTab('simulator');
            }}
            onOpenTactics={(m) => {
              setSelectedMatchForTactics(m);
              setActiveTab('tactics');
            }}
          />
        )}

        {activeTab === 'standings' && (
          <LeagueStandings
            selectedLeague={selectedLeague}
          />
        )}

        {activeTab === 'odds' && (
          <OddsOverview
            matches={matches}
            injuries={injuries}
            onSelectMatch={(m) => setSelectedMatchForModal(m)}
          />
        )}

        {activeTab === 'injuries' && (
          <InjuryLab
            injuries={injuries}
            teams={TEAMS}
            onAddInjury={handleAddInjury}
            onUpdateInjuryStatus={handleUpdateInjuryStatus}
          />
        )}

        {activeTab === 'tactics' && (
          <TacticalLab
            teams={TEAMS}
            defaultHomeTeamId={selectedMatchForTactics?.homeTeam.id}
            defaultAwayTeamId={selectedMatchForTactics?.awayTeam.id}
          />
        )}

        {activeTab === 'simulator' && (
          <MatchSimulator
            matches={matches}
            teams={TEAMS}
            initialMatch={selectedMatchForSim}
          />
        )}

        {activeTab === 'predictions' && (
          <MyPredictions predictions={userPredictions} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 pb-28 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-slate-400 font-semibold">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Power By AK • Football Tactical Prediction Engine</span>
          </div>
          <p>
            Real-time player injury tracking, tactical formation analysis, Elo & Poisson probabilities, expected goals (xG) modeling, and value betting intelligence.
          </p>
        </div>
      </footer>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modals */}
      <PredictionModal
        match={selectedMatchForModal}
        injuries={injuries}
        onClose={() => setSelectedMatchForModal(null)}
        onSavePrediction={handleSaveUserPrediction}
      />

      <AIScoutChat
        isOpen={isAIScoutOpen}
        onClose={() => setIsAIScoutOpen(false)}
        matches={matches}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        predictions={userPredictions}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppMain />
    </LanguageProvider>
  );
}
