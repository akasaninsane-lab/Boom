import React, { useState, useEffect } from 'react';
import { Match, PlayerInjury, PredictionResult, UserPrediction } from '../types';
import { calculateMatchPrediction } from '../services/predictionEngine';
import { X, Sparkles, ShieldAlert, Zap, TrendingUp, AlertTriangle, CheckCircle, BarChart2, Flame, Award } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface PredictionModalProps {
  match: Match | null;
  injuries: PlayerInjury[];
  onClose: () => void;
  onSavePrediction: (pred: UserPrediction) => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  match,
  injuries,
  onClose,
  onSavePrediction,
}) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(() =>
    match ? calculateMatchPrediction(match, injuries) : null
  );

  const [userHomeScore, setUserHomeScore] = useState(1);
  const [userAwayScore, setUserAwayScore] = useState(1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!match) return;
    // Fetch deeper AI prediction from backend API if available
    let isMounted = true;
    setLoadingAI(true);

    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: match.id, customInjuries: injuries }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.prediction) {
          setPrediction(data.prediction);
        }
      })
      .catch((err) => console.warn('Backend API fallback to local prediction engine:', err))
      .finally(() => {
        if (isMounted) setLoadingAI(false);
      });

    return () => {
      isMounted = false;
    };
  }, [match, injuries]);

  if (!match || !prediction) return null;

  const handleSave = () => {
    const userPred: UserPrediction = {
      id: `pred_${Date.now()}`,
      matchId: match.id,
      matchTitle: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
      predictedHomeScore: userHomeScore,
      predictedAwayScore: userAwayScore,
      placedAt: new Date().toISOString(),
      status: 'Pending',
    };
    onSavePrediction(userPred);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{match.league}</span>
              <h2 className="text-lg font-bold text-white font-display flex items-center space-x-2">
                <TeamLogo team={match.homeTeam} size="xs" />
                <span>{match.homeTeam.name} vs {match.awayTeam.name}</span>
                <TeamLogo team={match.awayTeam} size="xs" />
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Main Probabilities & Expected Scoreline Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            {/* Win Probabilities Bar & Donut representation */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Win Probabilities (Injury & Tactical Weighted)</span>
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                  {loadingAI ? 'Calculating...' : `Confidence: ${prediction.confidenceScore}%`}
                </span>
              </div>

              {/* Multi-segment Probability Bar */}
              <div className="space-y-2">
                <div className="h-6 w-full bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                  <div
                    className="bg-emerald-500 h-full flex items-center justify-center text-xs font-bold text-slate-950 transition-all duration-500"
                    style={{ width: `${prediction.probabilities.homeWin}%` }}
                  >
                    {prediction.probabilities.homeWin}%
                  </div>
                  <div
                    className="bg-amber-500 h-full flex items-center justify-center text-xs font-bold text-slate-950 transition-all duration-500"
                    style={{ width: `${prediction.probabilities.draw}%` }}
                  >
                    {prediction.probabilities.draw}%
                  </div>
                  <div
                    className="bg-indigo-500 h-full flex items-center justify-center text-xs font-bold text-slate-950 transition-all duration-500"
                    style={{ width: `${prediction.probabilities.awayWin}%` }}
                  >
                    {prediction.probabilities.awayWin}%
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center text-xs font-semibold pt-1">
                  <div className="text-emerald-400">{match.homeTeam.shortName} Win</div>
                  <div className="text-amber-400">Draw</div>
                  <div className="text-indigo-400">{match.awayTeam.shortName} Win</div>
                </div>
              </div>

              {/* xG & Expected Goals Comparison */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Home Expected Goals (xG)</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {prediction.expectedGoals.homeXG} <span className="text-xs text-slate-500 font-normal">goals</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Away Expected Goals (xG)</span>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
                    {prediction.expectedGoals.awayXG} <span className="text-xs text-slate-500 font-normal">goals</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Likely Scorelines (Poisson Matrix) */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
                Top Scorelines (Poisson)
              </span>
              <div className="space-y-2">
                {prediction.mostLikelyScores.map((sc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {sc.score}
                    </span>
                    <div className="flex-1 mx-3 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${sc.probability * 3}%` }}
                      ></div>
                    </div>
                    <span className="text-slate-400 font-mono">{sc.probability}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Squad Availability & Injury Impact Analysis */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Squad Availability & Injury Impact Matrix</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Squad Availability */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-white">{match.homeTeam.name}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {prediction.squadAvailability.homeAvailabilityPct}% Fit
                  </span>
                </div>
                {prediction.squadAvailability.homeMissingImpact.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-amber-300/90">
                    {prediction.squadAvailability.homeMissingImpact.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Full squad fit & available. No key injuries reported.</span>
                  </p>
                )}
              </div>

              {/* Away Squad Availability */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-white">{match.awayTeam.name}</span>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {prediction.squadAvailability.awayAvailabilityPct}% Fit
                  </span>
                </div>
                {prediction.squadAvailability.awayMissingImpact.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-amber-300/90">
                    {prediction.squadAvailability.awayMissingImpact.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Full squad fit & available. No key injuries reported.</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Tactical Verdict & Key Matchup Battles */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>AI Tactical Breakdown</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              {prediction.tacticalAnalysis.tacticalVerdict}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {prediction.tacticalAnalysis.keyBattles.map((battle, idx) => (
                <div key={idx} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>{battle.title}</span>
                    <span className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Adv: {battle.advantageTeam}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{battle.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Value Betting & EV Insight */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Value Odds Insight & EV Calculator</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                EV: +{prediction.valueInsight.expectedValuePct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Recommended Selection</span>
                <p className="font-bold text-white text-sm mt-0.5">{prediction.valueInsight.recommendedBet}</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Bookmaker Odds</span>
                <p className="font-bold text-amber-400 text-sm font-mono mt-0.5">{prediction.valueInsight.bookmakerOdds}</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">AI Calculated Prob</span>
                <p className="font-bold text-emerald-400 text-sm font-mono mt-0.5">{prediction.valueInsight.aiProb}%</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic">{prediction.valueInsight.rationale}</p>
          </div>

          {/* User Prediction Submission Form */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Log Your Prediction</span>
              </h3>
              <span className="text-xs text-slate-400">Earn 3 pts for Exact Score, 1 pt for Correct Result</span>
            </div>

            <div className="flex items-center justify-center space-x-6 py-2">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-300 block mb-1">{match.homeTeam.shortName}</span>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={userHomeScore}
                  onChange={(e) => setUserHomeScore(parseInt(e.target.value) || 0)}
                  className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <span className="text-lg font-bold text-slate-600">-</span>

              <div className="text-center">
                <span className="text-xs font-bold text-slate-300 block mb-1">{match.awayTeam.shortName}</span>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={userAwayScore}
                  onChange={(e) => setUserAwayScore(parseInt(e.target.value) || 0)}
                  className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Prediction Logged Successfully!</span>
                </span>
              )}
              <button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/30"
              >
                Submit & Log Prediction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
