import React, { useState, useEffect } from 'react';
import { X, User, Trophy, Award, CheckCircle, Shield, Globe, Sparkles, Heart, Save, Star, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { UserPrediction } from '../types';
import { TEAMS } from '../data/mockFootballData';
import { TeamLogo } from './TeamLogo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictions: UserPrediction[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  predictions,
}) => {
  const { lang, setLang, t } = useLanguage();

  const [userName, setUserName] = useState<string>('');
  const [favTeam, setFavTeam] = useState<string>('');
  const [favPlayer, setFavPlayer] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedName = localStorage.getItem('footy_user_name') || 'Aung Aung';
    const savedTeam = localStorage.getItem('footy_fav_team') || 'Arsenal';
    const savedPlayer = localStorage.getItem('footy_fav_player') || 'Bukayo Saka';
    const savedTheme = (localStorage.getItem('footy_theme') as 'dark' | 'light') || 'dark';

    setUserName(savedName);
    setFavTeam(savedTeam);
    setFavPlayer(savedPlayer);
    setTheme(savedTheme);
  }, [isOpen]);

  const handleThemeToggle = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('footy_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('footy_user_name', userName.trim() || 'Aung Aung');
    localStorage.setItem('footy_fav_team', favTeam.trim() || 'Arsenal');
    localStorage.setItem('footy_fav_player', favPlayer.trim() || 'Bukayo Saka');

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  // Find matching team object if available for logo
  const matchingTeam = Object.values(TEAMS).find(
    (team) => team.name.toLowerCase() === favTeam.toLowerCase() || team.shortName.toLowerCase() === favTeam.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-inner">
              {matchingTeam ? (
                <TeamLogo team={matchingTeam} size="md" />
              ) : (
                <User className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                {userName || 'User Profile'}
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-emerald-400 font-medium">{t('tacticalRank')}</span>
                {favTeam && (
                  <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700">
                    ⚽ {favTeam}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {savedSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center space-x-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{t('profileSaved')}</span>
            </div>
          )}

          {/* User Details Form */}
          <form onSubmit={handleSaveProfile} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-2 pb-1 border-b border-slate-800">
              <User className="w-4 h-4 text-emerald-400" />
              <span>{t('editProfile')}</span>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium block text-[11px]">
                {t('userName')}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Aung Aung"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Favorite Team Input */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium block text-[11px] flex items-center space-x-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>{t('favTeam')}</span>
              </label>
              <select
                value={favTeam}
                onChange={(e) => setFavTeam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {Object.values(TEAMS).map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name} ({team.league})
                  </option>
                ))}
              </select>
            </div>

            {/* Favorite Player Input */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium block text-[11px] flex items-center space-x-1">
                <Star className="w-3 h-3 text-amber-400" />
                <span>{t('favPlayer')}</span>
              </label>
              <input
                type="text"
                value={favPlayer}
                onChange={(e) => setFavPlayer(e.target.value)}
                placeholder="e.g. Bukayo Saka / Erling Haaland"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center space-x-2 mt-2 shadow-md shadow-emerald-950/40"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveProfile')}</span>
            </button>
          </form>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1">
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {predictions.length}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {t('totalPredictions')}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1">
              <div className="text-xl font-bold text-amber-400 font-mono">
                78.5%
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {t('accuracyRate')}
              </div>
            </div>
          </div>

          {/* Badges / Achievements */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{t('tacticalBadges')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center space-x-1">
                <Award className="w-3.5 h-3.5" />
                <span>xG Master</span>
              </span>

              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Derby Expert</span>
              </span>

              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Top Analyst</span>
              </span>
            </div>
          </div>

          {/* Display & Readability Theme Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{t('displayTheme')}</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Outdoor Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {t('lightModeDesc')}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleThemeToggle('dark')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition border flex items-center justify-center space-x-2 ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white border-slate-600 shadow-sm font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('darkMode')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeToggle('light')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition border flex items-center justify-center space-x-2 ${
                  theme === 'light'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-bold'
                    : 'bg-slate-900 text-amber-400 border-slate-800 hover:text-amber-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t('lightMode')}</span>
              </button>
            </div>
          </div>

          {/* Language Preference */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>{t('selectLanguage')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setLang('en')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                  lang === 'en'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                English (EN)
              </button>

              <button
                onClick={() => setLang('my')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                  lang === 'my'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                မြန်မာ (MY)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500 shrink-0">
          Power By AK Account ID: AK-882910 • {t('memberSince')}
        </div>
      </div>
    </div>
  );
};
