import { Match, PlayerInjury, PredictionResult, Team } from '../types';

/**
 * Football Match Prediction Engine using Elo Ratings, Expected Goals (xG),
 * Form Weighting, Home Advantage Factor, and Squad Availability Penalties.
 */
export function calculateMatchPrediction(
  match: Match,
  activeInjuries: PlayerInjury[] = []
): PredictionResult {
  const home = match.homeTeam;
  const away = match.awayTeam;

  // 1. Calculate Injury & Missing Player Penalties
  const homeMissing = activeInjuries.filter(
    (inj) => inj.teamId === home.id && (inj.status === 'Out' || inj.status === 'Doubtful')
  );
  const awayMissing = activeInjuries.filter(
    (inj) => inj.teamId === away.id && (inj.status === 'Out' || inj.status === 'Doubtful')
  );

  let homeAttackImpactSum = 0;
  let homeDefenseImpactSum = 0;
  homeMissing.forEach((inj) => {
    const statusMult = inj.status === 'Out' ? 1.0 : 0.5;
    homeAttackImpactSum += inj.attackImpactPct * statusMult;
    homeDefenseImpactSum += inj.defenseImpactPct * statusMult;
  });

  let awayAttackImpactSum = 0;
  let awayDefenseImpactSum = 0;
  awayMissing.forEach((inj) => {
    const statusMult = inj.status === 'Out' ? 1.0 : 0.5;
    awayAttackImpactSum += inj.attackImpactPct * statusMult;
    awayDefenseImpactSum += inj.defenseImpactPct * statusMult;
  });

  // Base availability score (%)
  const homeAvailabilityPct = Math.max(50, 100 + homeAttackImpactSum + homeDefenseImpactSum);
  const awayAvailabilityPct = Math.max(50, 100 + awayAttackImpactSum + awayDefenseImpactSum);

  // 2. Base Expected Goals (xG) calculation
  const HOME_ADVANTAGE_XG = 0.25;
  let baseHomeXG = home.stats.xGPerMatch * 0.6 + (away.stats.xGAPerMatch * 0.4) + HOME_ADVANTAGE_XG;
  let baseAwayXG = away.stats.xGPerMatch * 0.6 + (home.stats.xGAPerMatch * 0.4);

  // Apply injury modifiers to xG
  baseHomeXG = Math.max(0.2, baseHomeXG * (1 + homeAttackImpactSum / 100) * (1 - awayDefenseImpactSum / 200));
  baseAwayXG = Math.max(0.2, baseAwayXG * (1 + awayAttackImpactSum / 100) * (1 - homeDefenseImpactSum / 200));

  // Round xG
  const homeXG = Number(baseHomeXG.toFixed(2));
  const awayXG = Number(baseAwayXG.toFixed(2));

  // 3. Form Factor (Last 5 games)
  const calcFormScore = (form: ('W' | 'D' | 'L')[]) => {
    const map = { W: 3, D: 1, L: 0 };
    return form.reduce((acc, curr) => acc + map[curr], 0) / 15; // 0 to 1
  };
  const homeForm = calcFormScore(home.form);
  const awayForm = calcFormScore(away.form);

  // 4. Elo Probability Calculation
  const ELO_HOME_BONUS = 65; // Home field advantage
  const eloDiff = home.stats.eloRating + ELO_HOME_BONUS - away.stats.eloRating;
  const baseEloHomeProb = 1 / (1 + Math.pow(10, -eloDiff / 400));

  // Blend Elo + xG + Form
  const xGTotal = homeXG + awayXG;
  const rawHomeShare = xGTotal > 0 ? homeXG / xGTotal : 0.5;

  let blendedHomeWin = (baseEloHomeProb * 0.45) + (rawHomeShare * 0.45) + ((homeForm - awayForm) * 0.10);
  blendedHomeWin = Math.max(0.1, Math.min(0.85, blendedHomeWin));

  // Draw probability derived from xG closeness & typical low-scoring tendencies
  const xGDiff = Math.abs(homeXG - awayXG);
  let drawProb = 0.28 - Math.min(0.12, xGDiff * 0.08);
  if (xGTotal < 2.0) drawProb += 0.05; // Low scoring matches draw more often

  const remainingProb = 1 - drawProb;
  const homeWinProb = Math.round(blendedHomeWin * remainingProb * 100);
  const awayWinProb = Math.round((1 - blendedHomeWin) * remainingProb * 100);
  const drawProbPct = 100 - homeWinProb - awayWinProb;

  // 5. BTTS & Over/Under 2.5 Goals
  // Poisson approximation
  const pHomeGoal = 1 - Math.exp(-homeXG);
  const pAwayGoal = 1 - Math.exp(-awayXG);
  const bttsProbability = Math.round(pHomeGoal * pAwayGoal * 100);

  // Over 2.5 estimate based on Poisson
  const lambda = homeXG + awayXG;
  // P(X <= 2) for Poisson with mean lambda = e^-lambda * (1 + lambda + lambda^2/2)
  const pUnder25 = Math.exp(-lambda) * (1 + lambda + (lambda * lambda) / 2);
  const over25Probability = Math.min(95, Math.max(10, Math.round((1 - pUnder25) * 100)));

  // 6. Most likely scorelines
  const mostLikelyScores = generatePoissonScores(homeXG, awayXG);

  // 7. Value Bet Detection
  const bookmakerHomeWinOdds = match.odds.homeWin;
  const aiHomeWinProbDecimal = homeWinProb / 100;
  const impliedBookieProb = 1 / bookmakerHomeWinOdds;
  const expectedValuePct = Number(((aiHomeWinProbDecimal * bookmakerHomeWinOdds - 1) * 100).toFixed(1));

  let recommendedBet = `${home.shortName} Win`;
  let recOdds = match.odds.homeWin;
  let recAiProb = homeWinProb;

  if (expectedValuePct < 0 && awayWinProb / 100 * match.odds.awayWin > 1.05) {
    recommendedBet = `${away.shortName} Win`;
    recOdds = match.odds.awayWin;
    recAiProb = awayWinProb;
  } else if (over25Probability > 62) {
    recommendedBet = 'Over 2.5 Goals';
    recOdds = match.odds.over25;
    recAiProb = over25Probability;
  } else if (bttsProbability > 65) {
    recommendedBet = 'Both Teams To Score (Yes)';
    recOdds = match.odds.bttsYes;
    recAiProb = bttsProbability;
  }

  const confidenceScore = Math.min(98, Math.max(55, Math.round(Math.abs(homeWinProb - awayWinProb) * 0.8 + 55)));

  return {
    matchId: match.id,
    calculatedAt: new Date().toISOString(),
    probabilities: {
      homeWin: homeWinProb,
      draw: drawProbPct,
      awayWin: awayWinProb,
    },
    expectedScoreline: {
      home: homeXG,
      away: awayXG,
    },
    mostLikelyScores,
    expectedGoals: {
      homeXG,
      awayXG,
    },
    bttsProbability,
    over25Probability,
    confidenceScore,
    confidenceRating: confidenceScore > 78 ? 'High' : confidenceScore > 65 ? 'Medium' : 'Low',
    squadAvailability: {
      homeAvailabilityPct: Math.round(homeAvailabilityPct),
      awayAvailabilityPct: Math.round(awayAvailabilityPct),
      homeMissingImpact: homeMissing.map((i) => `${i.name} (${i.status}): ${i.notes}`),
      awayMissingImpact: awayMissing.map((i) => `${i.name} (${i.status}): ${i.notes}`),
    },
    tacticalAnalysis: {
      keyBattles: [
        {
          title: `${home.keyPlayers[0]?.name || 'Home Winger'} vs ${away.keyPlayers[3]?.name || 'Away Fullback'}`,
          description: `Key 1v1 duel in the flank. ${home.keyPlayers[0]?.name} averages ${home.keyPlayers[0]?.goals} goals and will test ${away.shortName}'s wing transition defense.`,
          advantageTeam: homeXG > awayXG ? 'home' : 'away',
        },
        {
          title: `Midfield Pressing Battle (${home.tactics.formation} vs ${away.tactics.formation})`,
          description: `${home.shortName} (${home.tactics.pressingIntensity}% press intensity) against ${away.shortName}'s build-up speed (${away.tactics.buildUpSpeed}%).`,
          advantageTeam: 'neutral',
        },
      ],
      tacticalVerdict: `${home.name}'s ${home.tactics.styleName} meets ${away.name}'s ${away.tactics.styleName}. ${
        homeXG > awayXG ? `${home.shortName} holds xG dominance at home.` : `${away.shortName} carries potent threat on counter attacks.`
      }`,
      exploitableSpaceHome: `Space behind inverted fullbacks during high transition build-up.`,
      exploitableSpaceAway: `Half-spaces between central midfield and defensive line.`,
      pressMatchupResult: `${home.shortName} expected to trigger mid-block traps against ${away.shortName}'s distribution.`,
    },
    valueInsight: {
      recommendedBet,
      bookmakerOdds: recOdds,
      impliedProb: Number(((1 / recOdds) * 100).toFixed(1)),
      aiProb: recAiProb,
      expectedValuePct,
      riskLevel: expectedValuePct > 8 ? 'Low' : expectedValuePct > 2 ? 'Medium' : 'High',
      rationale: `AI calculates a ${recAiProb}% probability versus market implied ${(100 / recOdds).toFixed(
        1
      )}%. EV is ${expectedValuePct > 0 ? '+' : ''}${expectedValuePct}%.`,
    },
    summaryTip: `${home.shortName} expected xG of ${homeXG} vs ${away.shortName} ${awayXG}. Key factor: ${
      homeMissing.length > 0 ? `${home.shortName} missing key players.` : `${away.shortName} squad availability at ${awayAvailabilityPct}%.`
    }`,
  };
}

function generatePoissonScores(lambda1: number, lambda2: number): { score: string; probability: number }[] {
  const poisson = (k: number, lambda: number) => {
    let factorial = 1;
    for (let i = 1; i <= k; i++) factorial *= i;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
  };

  const scores: { score: string; probability: number }[] = [];
  let totalProb = 0;

  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 4; a++) {
      const p = poisson(h, lambda1) * poisson(a, lambda2);
      scores.push({
        score: `${h}-${a}`,
        probability: p,
      });
      totalProb += p;
    }
  }

  // Normalize
  return scores
    .map((item) => ({
      score: item.score,
      probability: Math.round((item.probability / totalProb) * 100),
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
}
