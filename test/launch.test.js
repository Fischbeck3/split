import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {planLaunch} from '../scripts/prepare-launch.js';

const config = "export const SITE_URL = 'https://dailysplit.us/';\nexport const LAUNCH = '2026-10-08';\nexport const LAUNCH_READY = false;\n";
const html = '<link rel="canonical" href="https://old.example/">\n<meta property="og:url" content="https://old.example/">\n<meta property="og:image" content="https://old.example/og.png">';

test('launch preparation fixes one real date and synchronizes static share metadata', () => {
  const plan = planLaunch('2026-10-12', config, html);
  assert.match(plan.config, /LAUNCH = '2026-10-12'/);
  assert.match(plan.config, /LAUNCH_READY = true/);
  assert.doesNotMatch(plan.html, /old\.example/);
  assert.match(plan.html, /content="https:\/\/dailysplit\.us\/og\.jpg\?v=memories1"/);
  assert.deepEqual(planLaunch('2026-10-12', plan.config, plan.html), plan, 'same-day rerun is idempotent');
  assert.throws(() => planLaunch('2026-10-13', plan.config, plan.html), /renumber existing challenges/);
});

test('invalid dates and ambiguous metadata cannot produce a launch plan', () => {
  for (const date of ['', '2026-2-1', '2026-02-29', '2026-04-31', '2026-13-01']){
    assert.throws(() => planLaunch(date, config, html), /real launch date/);
  }
  assert.equal(planLaunch('2028-02-29', config, html).date, '2028-02-29');
  assert.throws(() => planLaunch('2026-10-12', config, html + '\n' + html), /no launch files were changed/);
});

test('the check command validates a release without changing the development calendar', () => {
  const configPath = new URL('../site/js/config.js', import.meta.url);
  const before = readFileSync(configPath, 'utf8');
  const currentDate = /export const LAUNCH = '([^']+)'/.exec(before)[1];
  const command = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/prepare-launch.js', import.meta.url)), currentDate, '--check'], {encoding: 'utf8'});
  assert.equal(command.status, 0, command.stderr);
  assert.match(command.stdout, /No files changed/);
  assert.equal(readFileSync(configPath, 'utf8'), before);
});
