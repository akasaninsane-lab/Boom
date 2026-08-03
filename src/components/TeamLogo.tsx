import React, { useState } from 'react';
import { Team } from '../types';

interface TeamLogoProps {
  team: {
    name?: string;
    code?: string;
    shortName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
  }[size];

  const logoSrc = team.logoUrl;
  const teamCode = team.code || team.shortName?.slice(0, 3) || 'TEAM';
  const bgColor = team.primaryColor || '#1e293b';

  return (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-700/50 bg-slate-900 p-1 ${sizeClasses} ${className}`}
      style={{ backgroundColor: logoSrc && !imgError ? '#0f172a' : bgColor }}
      title={team.name || teamCode}
    >
      {logoSrc && !imgError ? (
        <img
          src={logoSrc}
          alt={team.name || teamCode}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5"
        />
      ) : (
        <span className="font-extrabold text-white uppercase tracking-tighter drop-shadow-sm select-none">
          {teamCode}
        </span>
      )}
    </div>
  );
};
