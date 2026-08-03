import React, { useState } from 'react';
import { Match, PlayerInjury } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Flame, Percent, TrendingUp, CheckCircle, Shield, Award } from 'lucide-react';
import { calculateMatchPrediction } from '../services/predictionEngine';
import { TeamLogo } from './TeamLogo';

interface OddsOverviewProps {
  matches: Match[];
  injuries: PlayerInjury[];
  onSelectMatch?: (match: Match) => void;
}

export const OddsOverview: React.FC<OddsOverviewProps> = ({
  matches,
  injuries,
  onSelectMatch,
}) => {
  const { t } = useLanguage();
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('all');

  const filteredMatches = matches.filter(
    (m) => selectedLeagueFilter === 'all' || m.league === selectedLeagueFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                {t('oddsTitle')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('oddsSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Odds List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.map((match) => {
          const pred = calculateMatchPrediction(match, injuries);
          const homeProb = pred.probabilities.homeWin;
          const drawProb = pred.probabilities.draw;
          const awayProb = pred.probabilities.awayWin;

          // Convert AI probabilities to fair decimal odds
          const aiHomeOdds = (100 / homeProb).toFixed(2);
          const aiDrawOdds = (100 / drawProb).toFixed(2);
          const aiAwayOdds = (100 / awayProb).toFixed(2);

          // Implied bookmaker probabilities
          const bookieHomeProb = Math.round((1 / match.odds.homeWin) * 100);
          const bookieDrawProb = Math.round((1 / match.odds.draw) * 100);
          const bookieAwayProb = Math.round((1 / match.odds.awayWin) * 100);

          // Calculate Value EV
          const evHome = ((homeProb / 100) * match.odds.homeWin - 1) * 100;
          const evAway = ((awayProb / 100) * match.odds.awayWin - 1) * 100;
          const isValueMatch = evHome > 5 || evAway > 5;

          return (
            <div
              key={match.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-sm"
            >
              {/* Top League & Value Tag */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {match.league}
                </span>

                {isValueMatch ? (
                  <span className="flex items-center space-x-1 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 text-[11px]">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{t('valueOpportunity')}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    {match.datetime}
                  </span>
                )}
              </div>

              {/* Matchup Header */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2.5">
                  <TeamLogo team={match.homeTeam} size="xs" />
                  <span className="font-bold text-white text-sm">
                    {match.homeTeam.name}
                  </span>
                </div>

                <span className="text-xs font-bold text-slate-500 px-2">VS</span>

                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-white text-sm">
                    {match.awayTeam.name}
                  </span>
                  <TeamLogo team={match.awayTeam} size="xs" />
                </div>
              </div>

              {/* 1X2 Market Odds Grid */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>{t('market1X2')}</span>
                  <span className="text-slate-500">{t('bookieVsAi')}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Home Win */}
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">
                      1 ({match.homeTeam.code})
                    </div>
                    <div className="text-emerald-400 font-bold text-base">
                      {match.odds.homeWin.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      AI: <span className="text-white font-medium">{homeProb}%</span> ({aiHomeOdds})
                    </div>
                  </div>

                  {/* Draw */}
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">
                      X ({t('draw')})
                    </div>
                    <div className="text-amber-400 font-bold text-base">
                      {match.odds.draw.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      AI: <span className="text-white font-medium">{drawProb}%</span> ({aiDrawOdds})
                    </div>
                  </div>

                  {/* Away Win */}
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">
                      2 ({match.awayTeam.code})
                    </div>
                    <div className="text-emerald-400 font-bold text-base">
                      {match.odds.awayWin.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      AI: <span className="text-white font-medium">{awayProb}%</span> ({aiAwayOdds})
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {onSelectMatch && (
                <button
                  onClick={() => onSelectMatch(match)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 border border-slate-700"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('analyzeAndPredict')}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
