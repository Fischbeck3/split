#!/usr/bin/env node
// Official request/query schemas:
// https://posthog.com/docs/api/dashboards
// https://posthog.com/docs/api/insights
// https://github.com/PostHog/posthog/blob/master/frontend/src/queries/schema/schema-general.ts
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export async function loadDashboard(){
  return JSON.parse(await readFile(new URL('./posthog-dashboard.json', import.meta.url), 'utf8'));
}

export async function provisionDashboard({host = 'https://us.posthog.com', projectId, personalKey, fetchImpl = fetch, log = console.log}){
  const origin = new URL(host);
  if (!['https://us.posthog.com', 'https://eu.posthog.com'].includes(origin.origin) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password){
    throw new Error('POSTHOG_APP_HOST must be https://us.posthog.com or https://eu.posthog.com.');
  }
  if (!/^[1-9]\d*$/.test(String(projectId || ''))) throw new Error('POSTHOG_PROJECT_ID must be a positive project ID.');
  if (!/^phx_\S+$/.test(personalKey || '')) throw new Error('POSTHOG_PERSONAL_API_KEY must be a personal API key (phx_), supplied through the environment.');
  const plan = await loadDashboard();
  const base = `/api/projects/${projectId}/`;
  async function request(path, method = 'GET', body){
    const url = new URL(path, origin);
    if (url.origin !== origin.origin || !url.pathname.startsWith(base)) throw new Error('Refusing an API URL outside this PostHog project.');
    const response = await fetchImpl(url.href, {
      method, redirect:'error', signal:AbortSignal.timeout(30000),
      headers:{'Authorization':`Bearer ${personalKey}`, 'Content-Type':'application/json'},
      ...(body === undefined ? {} : {body:JSON.stringify(body)})
    });
    // Never print response bodies: project responses can contain private keys.
    if (!response.ok) throw new Error(`PostHog ${method} ${url.pathname} failed (HTTP ${response.status}).`);
    return response.json();
  }
  async function find(resource, name, tag){
    let next = `${base}${resource}/?limit=100${resource === 'insights' ? '&include_dashboards=true' : ''}`;
    const matches = [];
    const seen = new Set();
    while (next){
      if (seen.has(next)) throw new Error('PostHog returned a pagination loop.');
      seen.add(next);
      const page = await request(next);
      if (!Array.isArray(page.results)) throw new Error('PostHog returned an unexpected list response.');
      matches.push(...page.results.filter(item => !item.deleted && item.tags?.includes(tag)));
      next = page.next;
    }
    if (matches.length > 1) throw new Error(`More than one managed ${resource} matches "${name}". Resolve the duplicate in PostHog before running again.`);
    return matches[0];
  }
  const marker = plan.dashboard.tags[0];
  const existing = await find('dashboards', plan.dashboard.name, marker);
  const dashboardBody = {...plan.dashboard, tags:[...new Set([...(existing?.tags || []), ...plan.dashboard.tags])]};
  const dashboard = await request(`${base}dashboards/${existing ? `${existing.id}/` : ''}`, existing ? 'PATCH' : 'POST', dashboardBody);
  if (!Number.isInteger(dashboard.id) || dashboard.id < 1) throw new Error('PostHog did not return a dashboard ID.');
  for (const insight of plan.insights){
    const previous = await find('insights', insight.name, insight.tags[0]);
    await request(`${base}insights/${previous ? `${previous.id}/` : ''}`, previous ? 'PATCH' : 'POST', {
      ...insight,
      tags:[...new Set([...(previous?.tags || []), ...insight.tags])],
      dashboards:[...new Set([...(previous?.dashboards || []), dashboard.id])]
    });
    log(`${previous ? 'Updated' : 'Created'}: ${insight.name}`);
  }
  const url = `${origin.origin}/project/${projectId}/dashboard/${dashboard.id}`;
  log(`Dashboard: ${url}`);
  log(`Project timezone must be ${plan.timezone} (Settings > Project > General). Browser local_play_date and challenge_date are separate event properties.`);
  return {id:dashboard.id, url};
}

async function main(){
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--dry-run', '--apply', '--help'].includes(args[0])) throw new Error('Use --dry-run, --apply, or --help.');
  if (args[0] === '--help'){
    console.log(`Preview: node scripts/provision-posthog-dashboard.js --dry-run
Apply:   node scripts/provision-posthog-dashboard.js --apply

Apply reads POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY from the environment.
POSTHOG_APP_HOST defaults to https://us.posthog.com; use https://eu.posthog.com for EU.
Personal key scopes: dashboard:read, dashboard:write, insight:read, insight:write.
Set the project timezone to America/Phoenix before reading daily charts.
The phc_ public capture key belongs in site configuration, never here.
Reruns update only the dashboard and insights marked dailysplit:* and resume partial setup.
The JSON contains API payloads, not a documented PostHog UI import format.`);
  } else if (args[0] === '--dry-run'){
    console.log(JSON.stringify(await loadDashboard(), null, 2));
  } else {
    await provisionDashboard({host:process.env.POSTHOG_APP_HOST, projectId:process.env.POSTHOG_PROJECT_ID, personalKey:process.env.POSTHOG_PERSONAL_API_KEY});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href){
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
