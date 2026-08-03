import { GoogleGenAI, Type } from '@google/genai';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_INJURIES, INITIAL_MATCHES, TEAMS } from './src/data/mockFootballData.js';
import { calculateMatchPrediction } from './src/services/predictionEngine.js';
import { Match, PlayerInjury } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data state
let matchesState: Match[] = [...INITIAL_MATCHES];
let injuriesState: PlayerInjury[] = [...INITIAL_INJURIES];

// Lazy Gemini AI initialization
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Routes

// 1. Get Matches
app.get('/api/matches', (req, res) => {
  const { league, status } = req.query;
  let result = [...matchesState];
  if (league && typeof league === 'string') {
    result = result.filter((m) => m.league.toLowerCase().includes(league.toLowerCase()));
  }
  if (status && typeof status === 'string') {
    result = result.filter((m) => m.status === status);
  }
  res.json({ matches: result });
});

// 2. Get Injuries
app.get('/api/injuries', (req, res) => {
  res.json({ injuries: injuriesState });
});

// 3. Add or update player injury
app.post('/api/injuries', (req, res) => {
  const newInjury: PlayerInjury = req.body;
  if (!newInjury.name || !newInjury.teamId) {
    return res.status(400).json({ error: 'Missing required player injury fields' });
  }
  
  const existingIndex = injuriesState.findIndex((i) => i.id === newInjury.id || (i.name === newInjury.name && i.teamId === newInjury.teamId));
  if (existingIndex >= 0) {
    injuriesState[existingIndex] = { ...injuriesState[existingIndex], ...newInjury };
  } else {
    newInjury.id = `inj_${Date.now()}`;
    injuriesState.push(newInjury);
  }
  res.json({ success: true, injuries: injuriesState });
});

// 4. Calculate Match Prediction with AI Enhancement
app.post('/api/predict', async (req, res) => {
  try {
    const { matchId, customInjuries } = req.body;
    const match = matchesState.find((m) => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const activeInjuries = customInjuries || injuriesState;
    const basePrediction = calculateMatchPrediction(match, activeInjuries);

    // Call Gemini for deep tactical commentary if API key available
    const ai = getGeminiAI();
    if (ai) {
      try {
        const prompt = `Analyze this upcoming football match as an expert tactical analyst:
Home Team: ${match.homeTeam.name} (${match.homeTeam.tactics.formation}, ${match.homeTeam.tactics.styleName})
Away Team: ${match.awayTeam.name} (${match.awayTeam.tactics.formation}, ${match.awayTeam.tactics.styleName})
Venue: ${match.venue}
Calculated AI Home Win Prob: ${basePrediction.probabilities.homeWin}%, Draw: ${basePrediction.probabilities.draw}%, Away Win: ${basePrediction.probabilities.awayWin}%
Expected Goals: ${match.homeTeam.name} ${basePrediction.expectedGoals.homeXG} - ${basePrediction.expectedGoals.awayXG} ${match.awayTeam.name}
Home Missing Players Impact: ${basePrediction.squadAvailability.homeMissingImpact.join('; ') || 'Full squad fit'}
Away Missing Players Impact: ${basePrediction.squadAvailability.awayMissingImpact.join('; ') || 'Full squad fit'}

Provide concise JSON with:
1. tacticalVerdict (2 sentences)
2. keyBattles (array of 2 objects with title, description, advantageTeam: 'home'|'away'|'neutral')
3. summaryTip (1 crisp betting/analytical tip)
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tacticalVerdict: { type: Type.STRING },
                summaryTip: { type: Type.STRING },
                keyBattles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      advantageTeam: { type: Type.STRING },
                    },
                    required: ['title', 'description', 'advantageTeam'],
                  },
                },
              },
              required: ['tacticalVerdict', 'summaryTip', 'keyBattles'],
            },
          },
        });

        if (response.text) {
          const aiParsed = JSON.parse(response.text.trim());
          if (aiParsed.tacticalVerdict) basePrediction.tacticalAnalysis.tacticalVerdict = aiParsed.tacticalVerdict;
          if (aiParsed.summaryTip) basePrediction.summaryTip = aiParsed.summaryTip;
          if (aiParsed.keyBattles && Array.isArray(aiParsed.keyBattles)) {
            basePrediction.tacticalAnalysis.keyBattles = aiParsed.keyBattles;
          }
        }
      } catch (geminiError: any) {
        console.log('Gemini API quota or rate limit reached in /api/predict, serving procedural prediction fallback.');
      }
    }

    res.json({ prediction: basePrediction });
  } catch (error: any) {
    console.error('Error in /api/predict:', error);
    res.status(500).json({ error: error.message || 'Internal prediction error' });
  }
});

// 5. Tactical Analysis & Formation Matchup Generator
app.post('/api/tactics/analyze', async (req, res) => {
  try {
    const { homeTeamId, awayTeamId, homeFormation, awayFormation } = req.body;
    const home = TEAMS[homeTeamId] || Object.values(TEAMS)[0];
    const away = TEAMS[awayTeamId] || Object.values(TEAMS)[1];

    const fallbackAnalysis = {
      matchupTitle: `${home.name} (${homeFormation || home.tactics.formation}) vs ${away.name} (${awayFormation || away.tactics.formation})`,
      pressBattle: `High pressing intensity of ${home.name} (${home.tactics.pressingIntensity}%) clashes with ${away.name}'s build up play.`,
      wingOverloads: `${home.name} looks to isolate wingers in 1v1 situations against ${away.name}'s lateral defenders.`,
      defensiveVulnerability: `Space left open behind high defensive line when pressing breaks down.`,
      tacticalRecommendation: `Exploit transitions through quick early passes into the half-spaces.`,
    };

    const ai = getGeminiAI();
    if (!ai) {
      return res.json({ analysis: fallbackAnalysis });
    }

    try {
      const prompt = `Conduct a deep tactical breakdown between:
Home: ${home.name} (${homeFormation || home.tactics.formation}, Style: ${home.tactics.styleName}, Manager: ${home.tactics.manager})
Away: ${away.name} (${awayFormation || away.tactics.formation}, Style: ${away.tactics.styleName}, Manager: ${away.tactics.manager})

Return JSON:
- matchupTitle
- pressBattle
- wingOverloads
- defensiveVulnerability
- tacticalRecommendation`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchupTitle: { type: Type.STRING },
              pressBattle: { type: Type.STRING },
              wingOverloads: { type: Type.STRING },
              defensiveVulnerability: { type: Type.STRING },
              tacticalRecommendation: { type: Type.STRING },
            },
            required: ['matchupTitle', 'pressBattle', 'wingOverloads', 'defensiveVulnerability', 'tacticalRecommendation'],
          },
        },
      });

      let parsed: any = {};
      if (response.text) {
        try {
          parsed = JSON.parse(response.text.trim());
        } catch (parseErr) {
          console.log('JSON parse error in /api/tactics/analyze, using fallback.');
        }
      }
      if (parsed && parsed.pressBattle && parsed.tacticalRecommendation) {
        return res.json({ analysis: parsed });
      }
      return res.json({ analysis: fallbackAnalysis });
    } catch (geminiErr) {
      console.log('Gemini rate limit or API error in /api/tactics/analyze, serving fallback.');
      return res.json({ analysis: fallbackAnalysis });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Live Match Simulation Engine Generator
app.post('/api/simulate', async (req, res) => {
  try {
    const { homeTeamId, awayTeamId } = req.body;
    const home = TEAMS[homeTeamId] || Object.values(TEAMS)[0];
    const away = TEAMS[awayTeamId] || Object.values(TEAMS)[1];

    const fallbackSimulation = [
      { minute: 4, team: 'home', eventType: 'shot_on_target', description: `${home.keyPlayers[0]?.name} tests keeper with low drive from edge of box.`, scoreAfter: { home: 0, away: 0 }, homeXG: 0.12, awayXG: 0.0 },
      { minute: 18, team: 'home', eventType: 'goal', description: `GOAL! ${home.keyPlayers[0]?.name} converts from close range after a pinpoint cross!`, scoreAfter: { home: 1, away: 0 }, homeXG: 0.88, awayXG: 0.05 },
      { minute: 34, team: 'away', eventType: 'yellow_card', description: `Tactical foul stopping counter-attack. Yellow card shown.`, scoreAfter: { home: 1, away: 0 }, homeXG: 0.88, awayXG: 0.15 },
      { minute: 52, team: 'away', eventType: 'goal', description: `GOAL! Equalizer! ${away.keyPlayers[0]?.name} fires into the top corner on the counter!`, scoreAfter: { home: 1, away: 1 }, homeXG: 0.95, awayXG: 0.82 },
      { minute: 78, team: 'home', eventType: 'shot_on_target', description: `Tremendous acrobatic save by keeper to tip ball over crossbar!`, scoreAfter: { home: 1, away: 1 }, homeXG: 1.45, awayXG: 0.95 },
      { minute: 89, team: 'home', eventType: 'goal', description: `LATE WINNER! Dramatic header from corner kick sends stadium into frenzy!`, scoreAfter: { home: 2, away: 1 }, homeXG: 2.15, awayXG: 0.95 },
    ];

    const ai = getGeminiAI();
    if (!ai) {
      return res.json({ simulation: fallbackSimulation });
    }

    try {
      const prompt = `Generate a realistic 6-event match simulation array for ${home.name} vs ${away.name}.
Return a JSON array of 6 objects with fields:
minute (number between 1 and 90),
team ('home'|'away'|'neutral'),
eventType ('goal'|'shot_on_target'|'shot_off'|'yellow_card'|'red_card'|'tactical_sub'|'save'),
description (string event commentary),
scoreAfter (object with home: number, away: number),
homeXG (number progressive cumulative xG),
awayXG (number progressive cumulative xG)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                minute: { type: Type.INTEGER },
                team: { type: Type.STRING },
                eventType: { type: Type.STRING },
                description: { type: Type.STRING },
                scoreAfter: {
                  type: Type.OBJECT,
                  properties: {
                    home: { type: Type.INTEGER },
                    away: { type: Type.INTEGER },
                  },
                  required: ['home', 'away'],
                },
                homeXG: { type: Type.NUMBER },
                awayXG: { type: Type.NUMBER },
              },
              required: ['minute', 'team', 'eventType', 'description', 'scoreAfter', 'homeXG', 'awayXG'],
            },
          },
        },
      });

      const simulation = JSON.parse(response.text?.trim() || '[]');
      return res.json({ simulation: simulation.length ? simulation : fallbackSimulation });
    } catch (geminiErr) {
      console.log('Gemini rate limit or API error in /api/simulate, serving fallback.');
      return res.json({ simulation: fallbackSimulation });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. AI Football Match Scout & Assistant
app.post('/api/scout', async (req, res) => {
  try {
    const { question, matchId } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const match = matchId ? matchesState.find((m) => m.id === matchId) : null;
    const ai = getGeminiAI();

    const fallbackAnswer = `FootyPredict Tactical Assistant:
Analyzing query for ${match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'general football analytics'}.
- Key Metrics: ${match ? `Home xG: ${match.homeTeam.stats.xGPerMatch}, Away xG: ${match.awayTeam.stats.xGPerMatch}` : 'Awaiting live match selection.'}
- Tactical Note: High pressing intensity and key squad availability impact win probabilities significantly.
- Recommendation: Review the Injury Lab to simulate player absence penalties before placing bets.`;

    if (!ai) {
      return res.json({ answer: fallbackAnswer });
    }

    try {
      const context = match
        ? `Selected Match: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.league}).
Home Form: ${match.homeTeam.form.join('-')}, xG: ${match.homeTeam.stats.xGPerMatch}.
Away Form: ${match.awayTeam.form.join('-')}, xG: ${match.awayTeam.stats.xGPerMatch}.`
        : 'General Football Analytics Query';

      const prompt = `You are Power By AK AI, a world-class football tactical analyst and betting intelligence bot.
Context: ${context}
User Question: ${question}

Provide an insightful, concise response with bullet points, tactical rationale, and key metrics where appropriate.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      return res.json({ answer: response.text || fallbackAnswer });
    } catch (geminiErr) {
      console.log('Gemini rate limit or API error in /api/scout, serving fallback.');
      return res.json({ answer: fallbackAnswer });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Server Initialization with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Football Prediction Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
