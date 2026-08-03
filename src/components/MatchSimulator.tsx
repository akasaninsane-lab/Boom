import React, { useState, useEffect } from 'react';
import { Match, SimulationEvent, Team } from '../types';
import { Play, Pause, RotateCcw, FastForward, Trophy, Flame, Activity, Zap, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TeamLogo } from './TeamLogo';

interface MatchSimulatorProps {
  matches: Match[];
  teams: Record<string, Team>;
  initialMatch?: Match | null;
}

export const MatchSimulator: React.FC<MatchSimulatorProps> = ({
  matches,
  teams,
  initialMatch,
}) => {
  const { t } = useLanguage();
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    initialMatch?.id || matches[0]?.id || 'm1'
  );

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  const [simulationEvents, setSimulationEvents] = useState<SimulationEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Playback state
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  // Fetch simulation data from backend endpoint `/api/simulate`
  const fetchSimulation = (match: Match) => {
    setLoading(true);
    setIsPlaying(false);
    setCurrentMinute(0);

    fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.simulation && Array.isArray(data.simulation)) {
          setSimulationEvents(data.simulation.sort((a, b) => a.minute - b.minute));
        }
      })
      .catch((err) => console.warn('Simulation error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedMatch) {
      fetchSimulation(selectedMatch);
    }
  }, [selectedMatchId]);

  // Timer interval for playback
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && currentMinute < 90) {
      timer = setInterval(() => {
        setCurrentMinute((prev) => {
          if (prev >= 90) {
            setIsPlaying(false);
            return 90;
          }
          return prev + 1;
        });
      }, 300 / speedMultiplier);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentMinute, speedMultiplier]);

  // Filter visible events up to current minute
  const visibleEvents = simulationEvents.filter((ev) => ev.minute <= currentMinute);

  // Latest score at current minute
  const latestEventWithScore = [...visibleEvents].reverse().find((ev) => ev.scoreAfter);
  const currentScore = latestEventWithScore
    ? latestEventWithScore.scoreAfter
    : { home: 0, away: 0 };

  const latestHomeXG = visibleEvents.length > 0 ? visibleEvents[visibleEvents.length - 1].homeXG : 0.0;
  const latestAwayXG = visibleEvents.length > 0 ? visibleEvents[visibleEvents.length - 1].awayXG : 0.0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>{t('simulatorTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('simulatorSubtitle')}
          </p>
        </div>

        {/* Match Picker */}
        <div className="w-full md:w-64">
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.homeTeam.shortName} vs {m.awayTeam.shortName} ({m.league})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Scoreboard & Playback Screen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Scoreboard Display */}
        <div className="grid grid-cols-7 items-center text-center bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
          {/* Home Team */}
          <div className="col-span-3 flex flex-col items-center">
            <TeamLogo team={selectedMatch.homeTeam} size="xl" className="mb-2 ring-4 ring-white/10 shadow-xl" />
            <span className="font-bold text-base text-white">{selectedMatch.homeTeam.name}</span>
            <span className="text-xs text-emerald-400 font-mono mt-1">xG: {latestHomeXG.toFixed(2)}</span>
          </div>

          {/* Current Score & Minute Counter */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="text-3xl font-extrabold text-white font-mono tracking-widest bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
              {currentScore.home} - {currentScore.away}
            </div>

            <div className="mt-2 flex items-center space-x-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>{currentMinute}'</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="col-span-3 flex flex-col items-center">
            <TeamLogo team={selectedMatch.awayTeam} size="xl" className="mb-2 ring-4 ring-white/10 shadow-xl" />
            <span className="font-bold text-base text-white">{selectedMatch.awayTeam.name}</span>
            <span className="text-xs text-indigo-400 font-mono mt-1">xG: {latestAwayXG.toFixed(2)}</span>
          </div>
        </div>

        {/* Playback Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>0' Kickoff</span>
            <span className="text-purple-400 font-bold">Minute {currentMinute} / 90'</span>
            <span>90' Full Time</span>
          </div>

          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${(currentMinute / 90) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Simulation Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentMinute >= 90}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-2 transition shadow-md shadow-purple-900/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : currentMinute >= 90 ? 'Finished' : 'Play Simulation'}</span>
            </button>

            <button
              onClick={() => {
                setCurrentMinute(0);
                setIsPlaying(false);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => {
                setCurrentMinute(90);
                setIsPlaying(false);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl transition border border-slate-700"
            >
              Skip to Full Time (90')
            </button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-500 text-[11px] px-2">Speed:</span>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  speedMultiplier === s
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Commentary Timeline Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span>Live Match Commentary Feed ({visibleEvents.length} events triggered)</span>
        </h3>

        {visibleEvents.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            Click 'Play Simulation' to start the match commentary stream...
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {visibleEvents.map((event, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-start space-x-3 text-xs animate-fadeIn"
              >
                <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 whitespace-nowrap">
                  {event.minute}'
                </span>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <span>
                      {event.eventType === 'goal'
                        ? '⚽ GOAL!'
                        : event.eventType === 'yellow_card'
                        ? '🟨 Yellow Card'
                        : event.eventType === 'red_card'
                        ? '🟥 Red Card'
                        : event.eventType === 'save'
                        ? '🧤 Great Save'
                        : '🎯 Shot'}
                    </span>
                    <span className="text-slate-500 font-normal">•</span>
                    <span className="text-slate-300 font-semibold">{event.description}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500 pt-1">
                    <span>
                      Score after: {event.scoreAfter.home} - {event.scoreAfter.away}
                    </span>
                    <span>|</span>
                    <span>
                      Cum xG: {selectedMatch.homeTeam.code} {event.homeXG.toFixed(2)} - {selectedMatch.awayTeam.code} {event.awayXG.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
