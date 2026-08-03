import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Zap, TrendingUp, Shield, Flame, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TeamLogo } from './TeamLogo';

interface TacticalLabProps {
  teams: Record<string, Team>;
  defaultHomeTeamId?: string;
  defaultAwayTeamId?: string;
}

export const TacticalLab: React.FC<TacticalLabProps> = ({
  teams,
  defaultHomeTeamId,
  defaultAwayTeamId,
}) => {
  const { t } = useLanguage();
  const teamList = Object.values(teams) as Team[];
  const [homeTeamId, setHomeTeamId] = useState(defaultHomeTeamId || teamList[0]?.id || 'ARS');
  const [awayTeamId, setAwayTeamId] = useState(defaultAwayTeamId || teamList[1]?.id || 'MCI');

  const home = teams[homeTeamId] || teamList[0];
  const away = teams[awayTeamId] || teamList[1];

  const formationsList = [
    '4-3-3 Attacking',
    '4-2-3-1 Double Pivot',
    '3-5-2 Wing-backs',
    '3-2-4-1 Box Midfield',
    '4-4-2 Diamond',
    '5-3-2 Low Block',
  ];

  const [homeFormation, setHomeFormation] = useState(home.tactics.formation);
  const [awayFormation, setAwayFormation] = useState(away.tactics.formation);

  const [homePressing, setHomePressing] = useState(home.tactics.pressingIntensity);
  const [awayPressing, setAwayPressing] = useState(away.tactics.pressingIntensity);

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    setHomeFormation(home.tactics.formation);
    setHomePressing(home.tactics.pressingIntensity);
  }, [homeTeamId]);

  useEffect(() => {
    setAwayFormation(away.tactics.formation);
    setAwayPressing(away.tactics.pressingIntensity);
  }, [awayTeamId]);

  const handleAnalyze = () => {
    setLoadingAnalysis(true);
    fetch('/api/tactics/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeFormation,
        awayFormation,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.analysis) setAiAnalysis(data.analysis);
      })
      .catch((err) => console.warn('Tactical analysis error:', err))
      .finally(() => setLoadingAnalysis(false));
  };

  useEffect(() => {
    handleAnalyze();
  }, [homeTeamId, awayTeamId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>{t('tacticsTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('tacticsSubtitle')}
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loadingAnalysis}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center space-x-2 transition shadow-sm whitespace-nowrap"
        >
          {loadingAnalysis ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{t('reAnalyze')}</span>
        </button>
      </div>

      {/* Team & Formation Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Tactical Configuration */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <TeamLogo team={home} size="xs" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{home.name} (HOME)</span>
            </div>
            <span className="text-xs text-slate-400">Manager: {home.tactics.manager}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Select Team</label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              >
                {teamList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Formation</label>
              <select
                value={homeFormation}
                onChange={(e) => setHomeFormation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              >
                {formationsList.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                <span>Pressing Intensity</span>
                <span className="font-mono text-emerald-400">{homePressing}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="98"
                value={homePressing}
                onChange={(e) => setHomePressing(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-white block">Key Strengths:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                {home.tactics.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Away Tactical Configuration */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <TeamLogo team={away} size="xs" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{away.name} (AWAY)</span>
            </div>
            <span className="text-xs text-slate-400">Manager: {away.tactics.manager}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Select Team</label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              >
                {teamList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Formation</label>
              <select
                value={awayFormation}
                onChange={(e) => setAwayFormation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              >
                {formationsList.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                <span>Pressing Intensity</span>
                <span className="font-mono text-indigo-400">{awayPressing}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="98"
                value={awayPressing}
                onChange={(e) => setAwayPressing(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-white block">Key Strengths:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                {away.tactics.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pitch Canvas Representation */}
      <div className="relative bg-emerald-950/80 border-2 border-emerald-800/80 rounded-2xl p-6 overflow-hidden shadow-2xl min-h-[300px] flex flex-col justify-between">
        {/* Pitch Lines background */}
        <div className="absolute inset-0 border-b-2 border-emerald-700/40 my-auto pointer-events-none"></div>
        <div className="absolute inset-x-0 mx-auto top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-emerald-700/40 pointer-events-none"></div>

        {/* Pitch Labels */}
        <div className="relative z-10 flex justify-between items-center text-xs font-bold text-emerald-300 tracking-widest uppercase">
          <span className="bg-emerald-900/80 px-3 py-1 rounded-md border border-emerald-700">
            {home.name} ({homeFormation})
          </span>
          <span className="bg-emerald-900/80 px-3 py-1 rounded-md border border-emerald-700">
            {away.name} ({awayFormation})
          </span>
        </div>

        {/* Tactical Pitch Nodes / Dots */}
        <div className="relative z-10 grid grid-cols-2 gap-8 my-10">
          <div className="flex justify-around items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/80 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-emerald-400/30">
              GK
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/80 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-emerald-400/30">
              DEF
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/80 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-emerald-400/30">
              MID
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/80 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-emerald-400/30">
              FWD
            </div>
          </div>

          <div className="flex justify-around items-center flex-row-reverse">
            <div className="w-10 h-10 rounded-full bg-indigo-500/80 text-white font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-indigo-400/30">
              GK
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/80 text-white font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-indigo-400/30">
              DEF
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/80 text-white font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-indigo-400/30">
              MID
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/80 text-white font-extrabold flex items-center justify-center text-xs shadow-lg ring-4 ring-indigo-400/30">
              FWD
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center text-xs text-emerald-300 font-mono">
          Interactive Tactical Zone: High-press clash in half-spaces expected
        </div>
      </div>

      {/* AI Tactical Breakdown Cards */}
      {aiAnalysis && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>AI Tactical Matchup Insights</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-cyan-400 block uppercase">Pressing & Midfield Battle</span>
              <p className="text-slate-300">{aiAnalysis.pressBattle}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-cyan-400 block uppercase">Wing Overloads</span>
              <p className="text-slate-300">{aiAnalysis.wingOverloads}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400 block uppercase">Defensive Space Exploitation</span>
              <p className="text-slate-300">{aiAnalysis.defensiveVulnerability}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block uppercase">Tactical Recommendation</span>
              <p className="text-slate-300">{aiAnalysis.tacticalRecommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
