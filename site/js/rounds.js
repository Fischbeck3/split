// One daily glass, three deterministic sips. Storage and presentation belong to
// the caller; reservations prevent a later tab from replacing a recorded sip.
import {DRAIN_LEVEL, hashStr, scoreFromOffset} from './core.js';
import {stageCadence} from './sip-cadence.js';

export const ROUND_STAGES = Object.freeze([
  Object.freeze({label:'Sober', blur:0, sway:0, cadenceAmplitude:0, cadencePeriod:1}),
  Object.freeze({label:'Tipsy', blur:.3, sway:.6, cadenceAmplitude:.13, cadencePeriod:.92}),
  Object.freeze({label:'Drunk', blur:.7, sway:1.15, cadenceAmplitude:.24, cadencePeriod:.73})
]);

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const stageIndex = index => Number.isInteger(index) && index >= 0 && index < ROUND_STAGES.length ? index : 0;
const validToken = token => typeof token === 'string' && token.length > 0 && token.length <= 256 && token.trim() === token;
const structural = new Set(['version','num','theme','rounds','pending','done','bestIndex','__proto__','prototype','constructor']);

/** Preserve the released glass, target, base rate and seed. Only the staged
 * presentation and deterministic drinking cadence are added. */
export function roundParams(baseP, index = 0){
  const sipStage = stageIndex(index), stage = ROUND_STAGES[sipStage];
  const seed = hashStr('split-round:' + (baseP.key ?? baseP.num) + ':' + baseP.theme.id + ':' + sipStage);
  return {...baseP, sipStage, sipBlur:stage.blur, sipSway:stage.sway,
    sipCadenceAmplitude:stage.cadenceAmplitude, sipCadencePeriod:stage.cadencePeriod,
    sipCadencePhase:seed / 4294967296 * Math.PI * 2};
}

/** A fixed-time cadence gives every player the same later-sip difficulty.
 * The first sip is exactly the original pour; later rates stay within the
 * stage's amplitude bounds. Reduced motion never changes this calculation. */
export function roundRate(P, elapsed = 0){
  const rate = Number.isFinite(P?.K) ? Math.max(0, P.K) : 0;
  return rate * stageCadence(P, elapsed);
}

// Copy JSON-safe own fields rather than retaining storage object references.
// Deep, cyclic and non-finite extras cannot break saving an otherwise valid sip.
function serializable(value, seen = new Set(), depth = 0){
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'object' || depth > 6 || seen.has(value)) return undefined;
  seen.add(value);
  let output;
  if (Array.isArray(value)){
    output = value.slice(0, 128).map(item => serializable(item, seen, depth + 1) ?? null);
  } else {
    output = {};
    for (const [key, item] of Object.entries(value)){
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const copy = serializable(item, seen, depth + 1);
      if (copy !== undefined) output[key] = copy;
    }
  }
  seen.delete(value);
  return output;
}

function individualResult(input, target = 'the mark'){
  if (!object(input) || !Number.isFinite(input.score) || input.score < 0 || input.score > 100
    || !Number.isFinite(input.f) || !Number.isFinite(input.L) || input.L < 0 || input.L > DRAIN_LEVEL
    || (input.mode !== undefined && input.mode !== 'hold' && input.mode !== 'tilt')
    || (input.tone !== undefined && !['good','warn','miss'].includes(input.tone))
    || (input.label !== undefined && typeof input.label !== 'string')
    || (input.drained !== undefined && typeof input.drained !== 'boolean')
    || (input.abandoned !== undefined && typeof input.abandoned !== 'boolean')) return null;
  const result = {};
  try {
    for (const [key, item] of Object.entries(input)){
      if (structural.has(key)) continue;
      const copy = serializable(item);
      if (copy !== undefined) result[key] = copy;
    }
  } catch { return null; }
  const scored = scoreFromOffset(input.f, target);
  return {...result, score:input.score, f:input.f, L:input.L,
    mode:input.mode ?? 'hold', label:input.label ?? scored.label,
    tone:input.tone ?? scored.tone, drained:input.drained ?? false};
}

/** Best score wins; an equal later score keeps the earlier sip and its line.
 * This helper handles presentation arrays; record validation below rejects
 * malformed stored rounds instead of quietly granting replacement attempts. */
export function summarizeRounds(rounds = []){
  const clean = Array.isArray(rounds) ? rounds.slice(0, ROUND_STAGES.length).map(round => individualResult(round)).filter(Boolean) : [];
  let bestIndex = null;
  for (let index = 0; index < clean.length; index++){
    if (bestIndex === null || clean[index].score > clean[bestIndex].score) bestIndex = index;
  }
  return {...(bestIndex === null ? {} : clean[bestIndex]), version:2, rounds:clean,
    bestIndex, done:clean.length === ROUND_STAGES.length};
}

function recordFromRounds(rounds, P, pending = null){
  return {...summarizeRounds(rounds), num:P.num, theme:P.theme.id, pending};
}

/** The caller applies legacy migration only to today's record. Archived
 * one-sip results can stay in their original format and remain unchanged. */
export function normalizeRoundRecord(record, P){
  if (!object(P) || !object(P.theme) || typeof P.theme.id !== 'string' || !P.theme.id
    || !Number.isInteger(P.num)) return null;
  if (record === undefined || record === null) return recordFromRounds([], P);
  if (!object(record) || record.theme !== P.theme.id
    || (record.num !== undefined && record.num !== P.num)) return null;
  if (record.version === 2){
    if (!Array.isArray(record.rounds) || record.rounds.length > ROUND_STAGES.length) return null;
    const rounds = record.rounds.map(round => individualResult(round, P.theme.target));
    if (rounds.some(round => !round)) return null;
    let pending = null;
    if (record.pending !== undefined && record.pending !== null){
      if (!object(record.pending) || !validToken(record.pending.token)
        || record.pending.index !== rounds.length || rounds.length >= ROUND_STAGES.length) return null;
      pending = {token:record.pending.token, index:record.pending.index};
    }
    return recordFromRounds(rounds, P, pending);
  }
  // Do not mistake an unknown future schema or unfinished legacy reservation
  // for a new glass. A valid old completion is the first sober sip.
  if ((record.version !== undefined && record.version !== 1) || record.done !== true
    || record.rounds !== undefined || record.pending !== undefined) return null;
  const first = individualResult(record, P.theme.target);
  return first ? recordFromRounds([first], P) : null;
}

/** Persist this returned reservation before enabling Hold to drink. */
export function reserveRound(record, P, token){
  const normalized = normalizeRoundRecord(record, P);
  if (!normalized || normalized.done || normalized.pending || !validToken(token)) return {record:normalized, accepted:false};
  return {record:{...normalized, pending:{token, index:normalized.rounds.length}}, accepted:true};
}

/** Only the holder of the current persisted token can complete the next sip. */
export function completeRound(record, P, token, result){
  const normalized = normalizeRoundRecord(record, P), sip = individualResult(result, P?.theme?.target);
  if (!normalized || !sip || normalized.done || !normalized.pending || !validToken(token)
    || normalized.pending.token !== token) return {record:normalized, accepted:false};
  return {record:recordFromRounds([...normalized.rounds, sip], P), accepted:true};
}

/** A reload consumes an interrupted reservation, rather than allowing retries
 * until a good score. Its old token can no longer finish in another tab. */
export function recoverInterruptedRound(record, P){
  const normalized = normalizeRoundRecord(record, P);
  if (!normalized?.pending) return normalized;
  const missed = {score:0, f:2, L:DRAIN_LEVEL, drained:true, label:'Interrupted sip',
    tone:'miss', mode:'hold', abandoned:true};
  return recordFromRounds([...normalized.rounds, missed], P);
}
