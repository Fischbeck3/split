// Prepare a reviewed release for the day the domain is connected. Does not deploy
// or change DNS. --check prints the plan without changing files.
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const CONFIG = new URL('../site/js/config.js', import.meta.url);
const INDEX = new URL('../site/index.html', import.meta.url);

function replaceOne(source, pattern, replacement, name){
  if ((source.match(new RegExp(pattern.source, 'g')) || []).length !== 1){
    throw new Error('Expected one ' + name + '; no launch files were changed.');
  }
  return source.replace(pattern, replacement);
}

export function planLaunch(date, config, html){
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number(date.slice(0, 4)) < 2000){
    throw new Error('Use a real launch date in YYYY-MM-DD format.');
  }
  const parsed = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date){
    throw new Error('Use a real launch date in YYYY-MM-DD format.');
  }
  const originalDate = /export const LAUNCH = ['"]([^'"]+)['"];/.exec(config)?.[1];
  const ready = /export const LAUNCH_READY = true;/.test(config);
  if (ready && date !== originalDate){
    throw new Error('The launch date is already fixed at ' + originalDate + '. Changing it would renumber existing challenges.');
  }
  const address = /export const SITE_URL = ['"]([^'"]+)['"];/.exec(config)?.[1];
  const url = new URL(address);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash){
    throw new Error('SITE_URL must be a public HTTPS address without credentials, query, or hash.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  config = replaceOne(config, /export const LAUNCH = ['"][^'"]+['"];/,
    "export const LAUNCH = '" + date + "';", 'launch date');
  config = replaceOne(config, /export const LAUNCH_READY = (?:true|false);/,
    'export const LAUNCH_READY = true;', 'launch flag');
  html = replaceOne(html, /<link rel="canonical" href="[^"]*">/,
    '<link rel="canonical" href="' + url.href + '">', 'canonical URL');
  html = replaceOne(html, /<meta property="og:url" content="[^"]*">/,
    '<meta property="og:url" content="' + url.href + '">', 'social URL');
  html = replaceOne(html, /<meta property="og:image" content="[^"]*">/,
    '<meta property="og:image" content="' + new URL('og.jpg?v=memories1', url).href + '">', 'social image');
  return {config, html, date, url: url.href};
}

async function main(){
  const [date, ...options] = process.argv.slice(2);
  if (!date || options.some(value => value !== '--check') || options.length > 1){
    throw new Error('Usage: npm run prepare-launch -- YYYY-MM-DD [--check]');
  }
  const [config, html] = await Promise.all([readFile(CONFIG, 'utf8'), readFile(INDEX, 'utf8')]);
  const plan = planLaunch(date, config, html);
  if (options.includes('--check')){
    console.log('Launch plan: ' + plan.url + ' · Day 1 on ' + plan.date + ' at local midnight. No files changed.');
    return;
  }
  await writeFile(CONFIG, plan.config);
  await writeFile(INDEX, plan.html);
  console.log('Prepared ' + plan.url + ' · Day 1: ' + plan.date + '.');
  console.log('Run npm test, review the diff, and release after domain ownership, DNS, and HTTPS are verified.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
