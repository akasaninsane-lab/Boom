import React, { useState } from 'react';
import { Match, PlayerInjury } from '../types';
import { calculateMatchPrediction } from '../services/predictionEngine';
import { Flame, Calculator, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ValueBetCalculatorProps {
  matches: Match[];
  injuries: PlayerInjury[];
}

export const ValueBetCalculator: React.FC<ValueBetCalculatorProps> = ({
  matches,
  injuries,
}) => {
  const { t } = useLanguage();
  const [stake, setStake] = useState<number>(50);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>{t('valueTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('valueSubtitle')}
          </p>
        </div>

        {/* Stake Input */}
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-3">
          <Calculator className="w-4 h-4 text-amber-400" />
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-medium">{t('bankrollStake')}</label>
            <input
              type="number"
              min="1"
              max="10000"
              value={stake}
              onChange={(e) => setStake(Math.max(1, parseInt(e.target.value) || 10))}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-xs font-mono font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Value Bets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Match Fixture</th>
                <th className="p-4">Selection</th>
                <th className="p-4">Bookie Odds</th>
                <th className="p-4">Implied Prob</th>
                <th className="p-4">AI Prob</th>
                <th className="p-4">Expected Value (+EV)</th>
                <th className="p-4">Est. Return (${stake} stake)</th>
                <th className="p-4">Risk Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {matches.map((match) => {
                const pred = calculateMatchPrediction(match, injuries);
                const vi = pred.valueInsight;
                const returnAmt = (stake * vi.bookmakerOdds).toFixed(2);
                const profit = (stake * vi.bookmakerOdds - stake).toFixed(2);

                return (
                  <tr key={match.id} className="hover:bg-slate-850/60 transition">
                    <td className="p-4 font-bold text-white">
                      <div>
                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">{match.league}</span>
                    </td>

                    <td className="p-4 font-bold text-emerald-400">{vi.recommendedBet}</td>

                    <td className="p-4 font-mono font-bold text-amber-400 text-sm">{vi.bookmakerOdds}</td>

                    <td className="p-4 font-mono text-slate-400">{vi.impliedProb}%</td>

                    <td className="p-4 font-mono font-bold text-emerald-300">{vi.aiProb}%</td>

                    <td className="p-4">
                      <span
                        className={`font-mono font-bold px-2 py-1 rounded text-xs ${
                          vi.expectedValuePct > 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {vi.expectedValuePct > 0 ? '+' : ''}
                        {vi.expectedValuePct}%
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-white">
                      ${returnAmt}{' '}
                      <span className="text-[10px] text-emerald-400 font-normal">(+${profit})</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          vi.riskLevel === 'Low'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : vi.riskLevel === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {vi.riskLevel} Risk
                      </span>
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
