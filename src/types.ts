export interface PlayerInjury {
  id: string;
  name: string;
  teamId: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  injuryType: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Out for Season';
  returnDate: string;
  importanceRating: number; // 1 - 10
  attackImpactPct: number; // e.g. -15
  defenseImpactPct: number; // e.g. -10
  status: 'Out' | 'Doubtful' | 'Suspended' | 'Fit';
  notes: string;
}

export interface TacticalSetup {
  formation: string; // e.g. "4-3-3 Attacking", "3-5-2 Wing-backs"
  styleName: string; // e.g. "Gegenpressing", "Possession Control", "Counter-Attack"
  pressingIntensity: number; // 1-100
  defensiveLineHeight: number; // 1-100
  buildUpSpeed: number; // 1-100
  strengths: string[];
  weaknesses: string[];
  manager: string;
}

export interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  avgPossession: number;
  xGPerMatch: number;
  xGAPerMatch: number;
  eloRating: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  code: string;
  league: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  form: ('W' | 'D' | 'L')[];
  stats: TeamStats;
  tactics: TacticalSetup;
  keyPlayers: {
    id: string;
    name: string;
    position: string;
    rating: number;
    goals: number;
    assists: number;
    isKeyStar?: boolean;
  }[];
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
}

export interface Match {
  id: string;
  league: string;
  leagueLogo?: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffTime: string; // ISO string
  status: 'upcoming' | 'live' | 'finished';
  currentMinute?: number;
  score?: {
    home: number;
    away: number;
  };
  venue: string;
  referee: string;
  weather: string;
  odds: MatchOdds;
}

export interface MatchupTacticalAnalysis {
  keyBattles: {
    title: string;
    description: string;
    advantageTeam: 'home' | 'away' | 'neutral';
  }[];
  tacticalVerdict: string;
  exploitableSpaceHome: string;
  exploitableSpaceAway: string;
  pressMatchupResult: string;
}

export interface PredictionResult {
  matchId: string;
  calculatedAt: string;
  probabilities: {
    homeWin: number; // e.g. 52
    draw: number;    // e.g. 26
    awayWin: number; // e.g. 22
  };
  expectedScoreline: {
    home: number; // e.g. 2.1
    away: number; // e.g. 1.0
  };
  mostLikelyScores: {
    score: string;
    probability: number;
  }[];
  expectedGoals: {
    homeXG: number;
    awayXG: number;
  };
  bttsProbability: number;
  over25Probability: number;
  confidenceScore: number; // 1-100
  confidenceRating: 'High' | 'Medium' | 'Low';
  
  // Injury effect breakdown
  squadAvailability: {
    homeAvailabilityPct: number;
    awayAvailabilityPct: number;
    homeMissingImpact: string[];
    awayMissingImpact: string[];
  };

  // Tactical breakdown from Gemini
  tacticalAnalysis: MatchupTacticalAnalysis;

  // Value bet insight
  valueInsight: {
    recommendedBet: string;
    bookmakerOdds: number;
    impliedProb: number;
    aiProb: number;
    expectedValuePct: number; // EV %
    riskLevel: 'Low' | 'Medium' | 'High';
    rationale: string;
  };

  summaryTip: string;
}

export interface UserPrediction {
  id: string;
  matchId: string;
  matchTitle: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  betSelection?: string;
  placedAt: string;
  pointsEarned?: number;
  status: 'Pending' | 'Correct Result' | 'Exact Score' | 'Incorrect';
}

export interface SimulationEvent {
  minute: number;
  team: 'home' | 'away' | 'neutral';
  eventType: 'goal' | 'shot_on_target' | 'shot_off' | 'yellow_card' | 'red_card' | 'tactical_sub' | 'var_check' | 'save';
  description: string;
  scoreAfter: { home: number; away: number };
  homeXG: number;
  awayXG: number;
}
