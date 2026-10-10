// A shared sip is a self-reported benchmark, never a verified score or a new daily attempt.
import {dayParams, keyForDay, scoreFromOffset, startLevel, DRAIN_LEVEL} from './core.js';
import {isCalendarDateKey} from './challenge.js';

const FIELDS = ['vs', 'f', 'glass', 'sip', 'empty'];
const KINDS = new Set(['daily', 'practice', 'preview', 'archive', 'archive-saved']);
const OFFSET = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/;
const ROUND_SCORES = /^(?:0|[1-9]\d{0,2}),(?:0|[1-9]\d{0,2}),(?:0|[1-9]\d{0,2})$/;

/** Accept only an explicit matching glass. Invalid links may recover to today, but their sip must not follow. */
export function readFriendChallenge({search = '', hash = '', key, num, theme} = {}){
  if (typeof search !== 'string' || search.length > 2048 || typeof hash !== 'string' || hash.length > 32) return null;
  if (!Number.isInteger(num) || num < 1 || !isCalendarDateKey(key) || key !== keyForDay(num) || !theme?.id) return null;
  const params = new URLSearchParams(search);
  if (FIELDS.some(field => params.getAll(field).length !== 1)) return null;
  const rawRounds = params.getAll('rounds');
  if (rawRounds.length > 1 || (rawRounds.length && !ROUND_SCORES.test(rawRounds[0]))) return null;
  const dates = params.getAll('day');
  const preview = /^#day(\d{1,4})$/.exec(hash);
  if (preview){
    if (Number(preview[1]) !== num || num > 9999 || dates.length) return null;
  } else {
    if (hash.startsWith('#day') || dates.length !== 1 || !isCalendarDateKey(dates[0]) || dates[0] !== key) return null;
  }
  const P = dayParams(num);
  if (P.theme.id !== theme.id || params.get('glass') !== theme.id) return null;
  const rawScore = params.get('vs'), rawOffset = params.get('f'), kind = params.get('sip'), rawEmpty = params.get('empty');
  if (!/^(?:0|[1-9]\d{0,2})$/.test(rawScore) || Number(rawScore) > 100) return null;
  if (rawOffset.length > 32 || !OFFSET.test(rawOffset) || !KINDS.has(kind) || !/^[01]$/.test(rawEmpty)) return null;
  if (Boolean(preview) !== (kind === 'preview')) return null;
  const score = Number(rawScore), f = Number(rawOffset), drained = rawEmpty === '1';
  if (!Number.isFinite(f) || Math.abs(f) > 20) return null;
  const rounds = rawRounds.length ? rawRounds[0].split(',').map(Number) : null;
  if (rounds && (rounds.some(value => value > 100) || Math.round(rounds.reduce((sum, value) => sum + value, 0) / 3) !== score)) return null;
  const bestScore = rounds ? Math.max(...rounds) : score;
  const averageFields = rounds ? {scoring:'average', rounds, bestScore} : {};
  if (drained){
    if (f !== 2 || bestScore !== 0) return null;
    return {score, f, L: DRAIN_LEVEL, drained, kind, ...averageFields};
  }
  const L = P.markY + f * P.markH;
  // The seed defines both the mark and the physical range. A URL cannot reroll the pour.
  // Older daily records stored only four offset decimals; one score point can straddle that rounding boundary.
  if (L < startLevel(P.theme) - 1e-12 || L >= DRAIN_LEVEL || Math.abs(scoreFromOffset(f, theme.target).score - bestScore) > 1) return null;
  return {score, f, L, drained, kind, ...averageFields};
}

/** Keep the comparison about these two supplied sips, without implying a leaderboard or identity check. */
export function comparisonCopy(friend, result){
  const completedScores = result?.version === 2 && result.done === true && Array.isArray(result.rounds) && result.rounds.length === 3 &&
    result.rounds.every(sip => Number.isInteger(sip?.score) && sip.score >= 0 && sip.score <= 100) ? result.rounds.map(sip => sip.score) : null;
  const resultScore = completedScores ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / 3) : result?.score;
  if (!friend || !result || !Number.isInteger(friend.score) || !Number.isInteger(resultScore) ||
      friend.score < 0 || friend.score > 100 || resultScore < 0 || resultScore > 100) return null;
  const delta = resultScore - friend.score;
  const status = delta > 0 ? 'win' : delta < 0 ? 'lose' : 'tie';
  const subject = friend.scoring === 'average' ? 'average' : 'sip';
  const label = status === 'win' ? 'Beat shared ' + subject : status === 'lose' ? 'Shared ' + subject + ' wins' : 'Matched shared ' + subject;
  const points = Math.abs(delta) + (Math.abs(delta) === 1 ? ' point' : ' points');
  const text = status === 'win' ? 'You beat the shared ' + subject + ' by ' + points + '.' :
    status === 'lose' ? 'The shared ' + subject + ' finished ' + points + ' ahead.' : 'Same ' + (subject === 'average' ? 'average' : 'score') + '. You matched the shared ' + subject + '.';
  return {text, status, label, delta};
}
