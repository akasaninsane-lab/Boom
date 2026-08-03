import React from 'react';
import { UserPrediction } from '../types';
import { Award, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MyPredictionsProps {
  predictions: UserPrediction[];
}

export const MyPredictions: React.FC<MyPredictionsProps> = ({ predictions }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header Banner & Stats */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 p-6 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>{t('trackerRank')}</span>
          </div>
          <h2 className="text-xl font-bold text-white font-display">{t('myPredictionsTitle')}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {t('myPredictionsSubtitle')}
          </p>
        </div>

        {/* User Stats Card */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-center">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-semibold">{t('totalPredictions')}</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{predictions.length}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-semibold">{t('pointsEarned')}</span>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              {predictions.reduce((acc, p) => acc + (p.pointsEarned || 0), 0)} pts
            </div>
          </div>
        </div>
      </div>

      {/* Predictions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>{t('loggedHistory')}</span>
        </h3>

        {predictions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs space-y-2">
            <p>{t('noPredictionsYet')}</p>
            <p className="text-slate-400">{t('predictionInstruction')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((pred) => (
              <div
                key={pred.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white text-sm block">{pred.matchTitle}</span>
                  <span className="text-slate-500 text-[10px] font-mono">
                    {t('loggedAt')} {new Date(pred.placedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block font-medium">{t('yourScore')}</span>
                    <span className="font-mono font-bold text-amber-400 text-base">
                      {pred.predictedHomeScore} - {pred.predictedAwayScore}
                    </span>
                  </div>

                  <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded font-semibold text-[11px]">
                    {pred.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
