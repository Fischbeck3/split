// Build and publishing checks use the artwork paths the renderer actually uses.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {themeById} from '../site/js/core.js';
import {SCENE_ART} from '../site/js/draw.js';
import {assertContentReady, THEME_READINESS, isCampaignReady} from '../site/js/content-readiness.js';

export async function checkCalendarContent(plan, {read = readFile} = {}){
  for (const [id, campaign] of Object.entries(plan.campaigns)){
    if (campaign.status === 'published' && !isCampaignReady(id)) throw new Error('Campaign content is not built and approved: ' + id);
  }
  const seen = new Set();
  for (const [date, entry] of Object.entries(plan.days)){
    assertContentReady(entry, date);
    if (seen.has(entry.themeId)) continue;
    seen.add(entry.themeId);
    const theme = themeById(entry.themeId), approved = THEME_READINESS[entry.themeId];
    if (!theme || theme.scene !== approved.scene || !SCENE_ART[theme.scene]){
      throw new Error(date + ': approved theme does not match its built scene: ' + entry.themeId);
    }
    const url = new URL(SCENE_ART[theme.scene].url);
    let bytes;
    try { bytes = await read(url); }
    catch { throw new Error(date + ': missing scene artwork for ' + entry.themeId + ': ' + url.pathname); }
    if (!bytes?.length) throw new Error(date + ': empty scene artwork for ' + entry.themeId);
    if (createHash('sha256').update(bytes).digest('hex') !== approved.artworkSha256){
      throw new Error(date + ': scene artwork changed since approval for ' + entry.themeId + '. Review it before scheduling.');
    }
  }
}
