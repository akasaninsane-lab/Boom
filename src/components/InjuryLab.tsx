import React, { useState } from 'react';
import { PlayerInjury, Team } from '../types';
import { ShieldAlert, Plus, Activity, UserX, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TeamLogo } from './TeamLogo';

interface InjuryLabProps {
  injuries: PlayerInjury[];
  teams: Record<string, Team>;
  onAddInjury: (injury: PlayerInjury) => void;
  onUpdateInjuryStatus: (injuryId: string, status: PlayerInjury['status']) => void;
}

export const InjuryLab: React.FC<InjuryLabProps> = ({
  injuries,
  teams,
  onAddInjury,
  onUpdateInjuryStatus,
}) => {
  const { t } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Injury Form state
  const [playerName, setPlayerName] = useState('');
  const [teamId, setTeamId] = useState(Object.keys(teams)[0] || 'ARS');
  const [position, setPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('FWD');
  const [injuryType, setInjuryType] = useState('Hamstring Strain');
  const [severity, setSeverity] = useState<'Minor' | 'Moderate' | 'Severe' | 'Out for Season'>('Moderate');
  const [importance, setImportance] = useState(8.5);
  const [attackImpact, setAttackImpact] = useState(-15);
  const [defenseImpact, setDefenseImpact] = useState(-10);

  const filteredInjuries = injuries.filter(
    (inj) => selectedTeam === 'all' || inj.teamId === selectedTeam
  );

  const handleSubmitNewInjury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newInj: PlayerInjury = {
      id: `inj_${Date.now()}`,
      name: playerName,
      teamId,
      position,
      injuryType,
      severity,
      returnDate: 'Simulated',
      importanceRating: importance,
      attackImpactPct: attackImpact,
      defenseImpactPct: defenseImpact,
      status: 'Out',
      notes: `Simulated injury report: ${playerName} (${position}) rated ${importance}/10 importance.`,
    };

    onAddInjury(newInj);
    setPlayerName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>{t('injuryLabTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('injuryLabSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center space-x-2 transition shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addInjuryScenario')}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedTeam('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
            selectedTeam === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Teams ({injuries.length})
        </button>

        {(Object.values(teams) as Team[]).map((team) => {
          const count = injuries.filter((i) => i.teamId === team.id).length;
          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition whitespace-nowrap ${
                selectedTeam === team.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <span>{team.shortName}</span>
              {count > 0 && (
                <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Injury Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInjuries.map((injury) => {
          const team = teams[injury.teamId];
          return (
            <div
              key={injury.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition shadow-xl space-y-4"
            >
              <div>
                {/* Header: Team & Position */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <TeamLogo team={team || { code: injury.teamId }} size="xs" />
                    <span className="font-bold text-white">{team?.name || injury.teamId}</span>
                  </div>

                  <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    {injury.position}
                  </span>
                </div>

                {/* Player Name & Severity */}
                <div className="mt-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{injury.name}</h3>
                      <p className="text-xs text-rose-400 font-medium">{injury.injuryType}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        injury.severity === 'Out for Season'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : injury.severity === 'Severe'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      }`}
                    >
                      {injury.severity}
                    </span>
                  </div>
                </div>

                {/* Impact Metrics Matrix */}
                <div className="mt-4 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Player Squad Importance:</span>
                    <span className="font-mono font-bold text-amber-400">{injury.importanceRating} / 10</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Attack xG Penalty:</span>
                    <span className="font-mono font-bold text-rose-400">{injury.attackImpactPct}%</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Defensive Vulnerability:</span>
                    <span className="font-mono font-bold text-amber-400">{injury.defenseImpactPct}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  "{injury.notes}"
                </p>
              </div>

              {/* Status Toggle Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <div className="flex items-center space-x-1">
                  {(['Out', 'Doubtful', 'Fit'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateInjuryStatus(injury.id, st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        injury.status === st
                          ? st === 'Out'
                            ? 'bg-rose-600 text-white'
                            : st === 'Doubtful'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Simulating New Injury */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UserX className="w-5 h-5 text-amber-400" />
              <span>Simulate Player Injury Scenario</span>
            </h3>

            <form onSubmit={handleSubmitNewInjury} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bukayo Saka"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Team</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {(Object.values(teams) as Team[]).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="GK">GK (Goalkeeper)</option>
                    <option value="DEF">DEF (Defender)</option>
                    <option value="MID">MID (Midfielder)</option>
                    <option value="FWD">FWD (Forward)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Injury / Reason</label>
                <input
                  type="text"
                  value={injuryType}
                  onChange={(e) => setInjuryType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Importance (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={importance}
                    onChange={(e) => setImportance(parseFloat(e.target.value) || 5)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Attack Penalty %</label>
                  <input
                    type="number"
                    max="0"
                    min="-50"
                    value={attackImpact}
                    onChange={(e) => setAttackImpact(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Defense Penalty %</label>
                  <input
                    type="number"
                    max="0"
                    min="-50"
                    value={defenseImpact}
                    onChange={(e) => setDefenseImpact(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-md shadow-amber-900/30"
                >
                  Apply Simulated Injury
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
