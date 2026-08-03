import React, { useState } from 'react';
import { Match, PlayerInjury } from '../types';
import { calculateMatchPrediction } from '../services/predictionEngine';
import { Zap, Play, ShieldAlert, TrendingUp, Search, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TeamLogo } from './TeamLogo';

interface MatchCenterProps {
  matches: Match[];
  injuries: PlayerInjury[];
  onSelectMatch: (match: Match) => void;
  onSimulateMatch: (match: Match) => void;
  onOpenTactics: (match: Match) => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({
  matches,
  injuries,
  onSelectMatch,
  onSimulateMatch,
  onOpenTactics,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'live'>('all');

  const filteredMatches = matches.filter((m) => {
    const matchesQuery =
      m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.league.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {(['all', 'upcoming', 'live'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === status
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status === 'all' ? t('allMatches') : status === 'live' ? t('liveMatches') : t('upcomingMatches')}
            </button>
          ))}
        </div>
      </div>

      {/* Fixture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMatches.map((match) => {
          const prediction = calculateMatchPrediction(match, injuries);
          const homeMissing = injuries.filter((i) => i.teamId === match.homeTeam.id && i.status === 'Out');
          const awayMissing = injuries.filter((i) => i.teamId === match.awayTeam.id && i.status === 'Out');

          return (
            <div
              key={match.id}
              className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all duration-200"
            >
              <div>
                {/* Header: League & Status */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60 text-xs">
                  <span className="text-slate-400 font-medium truncate max-w-[180px]">{match.league}</span>
                  {match.status === 'live' ? (
                    <span className="text-rose-400 font-bold text-[10px] bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                      LIVE {match.currentMinute}'
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(match.kickoffTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                </div>

                {/* Match Scoreboard */}
                <div className="grid grid-cols-7 items-center my-4 text-center">
                  {/* Home */}
                  <div className="col-span-3 flex flex-col items-center">
                    <TeamLogo team={match.homeTeam} size="md" className="mb-1.5" />
                    <span className="font-bold text-xs text-white truncate max-w-full">{match.homeTeam.shortName}</span>
                    <div className="flex space-x-0.5 mt-1">
                      {match.homeTeam.form.map((f, i) => (
                        <span
                          key={i}
                          className={`text-[8px] font-mono font-bold px-1 rounded ${
                            f === 'W' ? 'text-emerald-400' : f === 'D' ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* VS / Score */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    {match.status === 'live' && match.score ? (
                      <div className="text-base font-extrabold text-amber-400 font-mono">
                        {match.score.home} - {match.score.away}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500">VS</span>
                    )}
                    <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      xG {prediction.expectedGoals.homeXG}-{prediction.expectedGoals.awayXG}
                    </span>
                  </div>

                  {/* Away */}
                  <div className="col-span-3 flex flex-col items-center">
                    <TeamLogo team={match.awayTeam} size="md" className="mb-1.5" />
                    <span className="font-bold text-xs text-white truncate max-w-full">{match.awayTeam.shortName}</span>
                    <div className="flex space-x-0.5 mt-1">
                      {match.awayTeam.form.map((f, i) => (
                        <span
                          key={i}
                          className={`text-[8px] font-mono font-bold px-1 rounded ${
                            f === 'W' ? 'text-emerald-400' : f === 'D' ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Win Probability */}
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">{t('winProbability')}</span>
                    <span>{t('confidence')}: <strong className="text-white">{prediction.confidenceScore}%</strong></span>
                  </div>

                  {/* Single bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${prediction.probabilities.homeWin}%` }}></div>
                    <div className="bg-slate-500 h-full" style={{ width: `${prediction.probabilities.draw}%` }}></div>
                    <div className="bg-indigo-500 h-full" style={{ width: `${prediction.probabilities.awayWin}%` }}></div>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-emerald-400">{match.homeTeam.code} {prediction.probabilities.homeWin}%</span>
                    <span className="text-slate-400">{t('draw')} {prediction.probabilities.draw}%</span>
                    <span className="text-indigo-400">{match.awayTeam.code} {prediction.probabilities.awayWin}%</span>
                  </div>
                </div>

                {/* Injury Line */}
                {(homeMissing.length > 0 || awayMissing.length > 0) && (
                  <div className="mt-2.5 flex items-center space-x-1.5 text-[10px] text-amber-400/90 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {t('outInjuries')}: {homeMissing.length > 0 && `${match.homeTeam.code} (${homeMissing[0].name})`} {awayMissing.length > 0 && `${match.awayTeam.code} (${awayMissing[0].name})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center space-x-2">
                <button
                  onClick={() => onSelectMatch(match)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t('analyzeAndPredict')}</span>
                </button>

                <button
                  onClick={() => onSimulateMatch(match)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs p-1.5 rounded-lg transition"
                  title="Simulate Match"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenTactics(match)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs p-1.5 rounded-lg transition"
                  title="Tactical Setup"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
