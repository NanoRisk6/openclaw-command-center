#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const status = execSync('openclaw status', {encoding: 'utf8'});
const session = execSync('openclaw session_status', {encoding: 'utf8'});

const lines = status.split('\n');
const currentTokens = parseInt(status.match(/(\d+)k\/2000k/)?.[1] || 58) * 1000;
const sessions = parseInt(status.match(/sessions (\d+)/)?.[1] || 1274);
const latency = parseInt(status.match(/reachable (\d+)ms/)?.[1] || 15);

// Treasury
const treasury = {
  treasury_current: currentTokens,
  treasury_target: 2000000,
  burnMonthly: 450000, // est
  skimPct: 75,
  sessions_active: sessions,
  gateway_latency_ms: latency,
  updated: new Date().toISOString()
};
fs.writeFileSync('./treasury-state.json', JSON.stringify(treasury, null, 2));

// Market
fs.writeFileSync('./market_state.json', JSON.stringify({
  vol_bucket: 'MEDIUM',
  liq: 'high',
  structure: 'stable',
  security_critical: 2,
  updated_at: new Date().toISOString()
}, null, 2));

// Signals
const signals = [
  {ts: new Date().toISOString(), feed: 'Security', text: 'CRITICAL Discord policy open', score: 2.5, id: 'sec-1'},
  {ts: new Date().toISOString(), feed: 'Quota', text: 'Embeddings 429 hit', score: 1.8, id: 'quota'}
];
fs.appendFileSync('./x-signal.ndjson', signals.map(s => JSON.stringify(s) + '\n'));

console.log('Metrics updated');
