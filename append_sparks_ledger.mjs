#!/usr/bin/env node
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

const dir = process.cwd();
const signalsPath = join(dir, 'x-signal.ndjson');
const marketPath = join(dir, 'market_state.json');
const treasuryPath = join(dir, 'treasury-state.json');
const auditDir = join(dir, 'audit');
const ledgerPath = join(auditDir, 'sparks.ndjson');

// Ensure audit dir
if (!existsSync(auditDir)) {
  mkdirSync(auditDir, { recursive: true });
}

// Read signals
let signals = [];
try {
  const signalsData = readFileSync(signalsPath, 'utf8');
  const lines = signalsData.trim().split('\n').filter(Boolean);
  signals = lines.slice(-10).map(line => {
    const sig = JSON.parse(line);
    sig.scoreNum = parseFloat(sig.score);
    return sig;
  });
} catch (e) {
  console.error('Error reading signals:', e.message);
  process.exit(1);
}

if (signals.length === 0) {
  console.log(JSON.stringify({ok: false, error: 'No signals found'}));
  process.exit(1);
}

// Compute highScore
const highScore = Math.max(...signals.map(s => s.scoreNum));
const topSignal = signals.reduce((max, s) => s.scoreNum > max.scoreNum ? s : max, signals[0]);
const source = topSignal.feed;
const top_feed = source;
const top_score = highScore.toFixed(2);

// Market state
let vol_bucket = 'LOW';
let liq = 'unknown';
let structure = 'unknown';
let updated_at = new Date().toISOString();
try {
  const marketData = readFileSync(marketPath, 'utf8');
  const market = JSON.parse(marketData);
  vol_bucket = market.vol_bucket || 'LOW';
  liq = market.liq || 'unknown';
  structure = market.structure || 'unknown';
  updated_at = market.updated_at || updated_at;
} catch (e) {
  // No market_state.json, default
}

// Treasury state stub
let mode = 'Neutral';
let riskTier = 'Active(10% cap)';
try {
  const treasuryData = readFileSync(treasuryPath, 'utf8');
  const treasury = JSON.parse(treasuryData);
  // Stub as per task
} catch (e) {
  // Ok
}

// Sparks condition
const threshold = 1.2;
const isHighScore = highScore >= threshold;
const isHighVol = vol_bucket === 'HIGH';
const sparks = isHighScore || isHighVol;
const reason = sparks ? (isHighScore ? `highScore>=${threshold}` : `vol=HIGH`) : 'none';

// Check previous state from ledger
let prevSparks = false;
try {
  if (existsSync(ledgerPath)) {
    const ledgerData = readFileSync(ledgerPath, 'utf8');
    const lines = ledgerData.trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      const lastEntry = JSON.parse(lines[lines.length - 1]);
      prevSparks = !!lastEntry.sparks;
    }
  }
} catch (e) {
  // No ledger
}

const edge = sparks && !prevSparks;
if (!edge) {
  console.log(JSON.stringify({ok: true, appended: 0, sparks, prevSparks, highScore, vol_bucket, reason}));
  process.exit(0);
}

// New event
const ts_triggered = new Date().toISOString();
const hashStr = `${ts_triggered}|${source}|${reason}|${threshold}`;
const event_id = createHash('sha256').update(hashStr, 'utf8').digest('hex');

const signals_health = `${signals.filter(s => s.scoreNum >= threshold).length}/10`;
const market_health = 'healthy'; // stub

const row = {
  kind: 'sparks_edge',
  ts_triggered,
  sparks: true,
  source,
  reason,
  threshold,
  mode,
  riskTier,
  vol_bucket,
  liq,
  structure,
  top_score,
  top_feed,
  signals_health,
  market_health,
  updated_at,
  event_id
};

// Dedupe vs last 200
let appended = 0;
try {
  let recentLines = [];
  if (existsSync(ledgerPath)) {
    const ledgerData = readFileSync(ledgerPath, 'utf8');
    const allLines = ledgerData.trim().split('\n').filter(Boolean);
    recentLines = allLines.slice(-200).map(l => JSON.parse(l));
  }
  const isDupe = recentLines.some(l => l.event_id === event_id);
  if (!isDupe) {
    appendFileSync(ledgerPath, JSON.stringify(row) + '\n', 'utf8');
    appended = 1;
  }
} catch (e) {
  console.error('Append error:', e.message);
  process.exit(1);
}

console.log(JSON.stringify({ok: true, appended, row}));
