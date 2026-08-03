import React, { useState } from 'react';
import { TEAMS } from '../data/mockFootballData';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { Team } from '../types';
import { TeamLogo } from './TeamLogo';

interface LeagueStandingsProps {
  selectedLeague: string;
  onSelectTeam?: (teamId: string) => void;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({
  selectedLeague,
  onSelectTeam,
}) => {
  const { t } = useLanguage();
  const [activeLeagueFilter, setActiveLeagueFilter] = useState<string>(
    selectedLeague === 'all' ? 'Premier League' : selectedLeague
  );

  const teamList = (Object.values(TEAMS) as Team[]).filter((team) => {
    if (activeLeagueFilter === 'UEFA Champions League') {
      return ['RMA', 'MCI', 'BAY', 'ARS', 'BAR', 'INT', 'PSG', 'LEV'].includes(team.id);
    }
    if (activeLeagueFilter === 'all') return true;
    return team.league === activeLeagueFilter;
  });

  // Sort by Points -> Goal Difference -> Goals Scored
  const sortedTeams = [...teamList].sort((a, b) => {
    const ptsA = a.stats.won * 3 + a.stats.drawn;
    const ptsB = b.stats.won * 3 + b.stats.drawn;
    if (ptsB !== ptsA) return ptsB - ptsA;

    const gdA = a.stats.goalsScored - a.stats.goalsConceded;
    const gdB = b.stats.goalsScored - b.stats.goalsConceded;
    if (gdB !== gdA) return gdB - gdA;

    return b.stats.goalsScored - a.stats.goalsScored;
  }).slice(0, 8); // Always display Top 8 teams for each league

  const leagues = [
    { id: 'Premier League', name: t('premierLeague') },
    { id: 'La Liga', name: t('laLiga') },
    { id: 'Serie A', name: t('serieA') },
    { id: 'Bundesliga', name: t('bundesliga') },
    { id: 'Ligue 1', name: t('ligue1') },
    { id: 'UEFA Champions League', name: t('championsLeague') },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                {t('leagueStandings')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('standingsSubtitle')}
              </p>
            </div>
          </div>

          {/* League Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {leagues.map((lg) => (
              <button
                key={lg.id}
                onClick={() => setActiveLeagueFilter(lg.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeLeagueFilter === lg.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {lg.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">{t('pos')}</th>
                <th className="py-3.5 px-4">{t('teamName')}</th>
                <th className="py-3.5 px-3 text-center">{t('played')}</th>
                <th className="py-3.5 px-3 text-center">{t('won')}</th>
                <th className="py-3.5 px-3 text-center">{t('drawn')}</th>
                <th className="py-3.5 px-3 text-center">{t('lost')}</th>
                <th className="py-3.5 px-3 text-center hidden sm:table-cell">{t('goalsFor')}</th>
                <th className="py-3.5 px-3 text-center hidden sm:table-cell">{t('goalsAgainst')}</th>
                <th className="py-3.5 px-3 text-center">{t('goalDiff')}</th>
                <th className="py-3.5 px-4 text-center text-emerald-400 font-bold">{t('points')}</th>
                <th className="py-3.5 px-4 hidden md:table-cell">{t('form')}</th>
                <th className="py-3.5 px-4 text-right hidden lg:table-cell">{t('elo')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedTeams.map((team, index) => {
                const pos = index + 1;
                const gd = team.stats.goalsScored - team.stats.goalsConceded;
                const pts = team.stats.won * 3 + team.stats.drawn;

                // Qualification color accents
                let posColor = 'text-slate-400';
                let posBg = 'bg-slate-800/40';
                if (pos <= 4) {
                  posColor = 'text-emerald-400 font-bold';
                  posBg = 'bg-emerald-500/10 border border-emerald-500/20';
                } else if (pos === 5) {
                  posColor = 'text-sky-400 font-bold';
                  posBg = 'bg-sky-500/10 border border-sky-500/20';
                }

                return (
                  <tr
                    key={team.id}
                    onClick={() => onSelectTeam && onSelectTeam(team.id)}
                    className="hover:bg-slate-800/50 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${posBg} ${posColor}`}
                      >
                        {pos}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white flex items-center space-x-3">
                      <TeamLogo team={team} size="xs" />
                      <span className="group-hover:text-emerald-400 transition">
                        {team.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal hidden lg:inline">
                        ({team.tactics.formation})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 font-medium">
                      {team.stats.played}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">
                      {team.stats.won}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      {team.stats.drawn}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      {team.stats.lost}
                    </td>
                    <td className="py-3 px-3 text-center hidden sm:table-cell text-slate-400">
                      {team.stats.goalsScored}
                    </td>
                    <td className="py-3 px-3 text-center hidden sm:table-cell text-slate-400">
                      {team.stats.goalsConceded}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">
                      <span
                        className={
                          gd > 0
                            ? 'text-emerald-400'
                            : gd < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {gd > 0 ? `+${gd}` : gd}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white text-sm bg-slate-950/40">
                      {pts}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center space-x-1">
                        {team.form.map((res, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              res === 'W'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : res === 'D'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right hidden lg:table-cell font-mono text-slate-400">
                      {team.stats.eloRating}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
