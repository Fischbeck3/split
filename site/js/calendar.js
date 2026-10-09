import {LAUNCH, SITE_URL} from './config.js';
import {THEMES, themeById, themeForDay, dayKey} from './core.js';
import {CALENDAR} from './calendar-data.js';
import {addDateDays, createCalendarFeed, getCampaignForDate, getPublishedEntry, isDateKey,
  keyToDayNumber, latestLiveDate, normalizeCalendarPlan, validateCalendarPlan} from './content-calendar.js';
import {analyticsUrlForDate, ANALYTICS_DASHBOARD_URL, THEME_ANALYTICS_URL} from './calendar-analytics.js';

const STORAGE_KEY = 'split.content-calendar.v1';
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const atNoon = date => new Date(date + 'T12:00:00Z');
const format = (date, options) => new Intl.DateTimeFormat('en-US', {...options, timeZone:'UTC'}).format(atNoon(date));
const longDate = date => format(date, {weekday:'long', month:'long', day:'numeric', year:'numeric'});
const shortDate = date => format(date, {month:'short', day:'numeric'});
const monthKey = date => date.slice(0, 7) + '-01';
const weekStart = date => addDateDays(date, -atNoon(date).getUTCDay());
const themeIds = THEMES.map(theme => theme.id);

/** Browser proposals cannot publish days or change already live proposals. */
export function validateBrowserPlan(input, {baseline = CALENDAR, now = new Date()} = {}){
  const plan = validateCalendarPlan(input, {baseline, now, themeIds});
  const source = normalizeCalendarPlan(baseline), live = latestLiveDate(now);
  if (!same(plan.days, source.days)) throw new Error('Keep the published lineup unchanged. Put proposed glasses in drafts.');
  for (const [id, campaign] of Object.entries(source.campaigns)){
    if ((campaign.status === 'published' || campaign.startDate <= live) && !same(plan.campaigns[id], campaign)){
      throw new Error('Keep published and already live runs unchanged: ' + campaign.name + '.');
    }
  }
  for (const [id, campaign] of Object.entries(plan.campaigns)){
    if (campaign.status === 'published' && !same(campaign, source.campaigns[id])){
      throw new Error('A browser plan cannot publish a run. Keep ' + campaign.name + ' as a draft.');
    }
    if (!source.campaigns[id] && campaign.startDate <= live) throw new Error('New runs must start after the globally live date, ' + live + '.');
  }
  for (const date of new Set([...Object.keys(plan.drafts), ...Object.keys(source.drafts)])){
    if (date <= live && !same(plan.drafts[date], source.drafts[date])){
      throw new Error('Draft edits must be after the globally live date, ' + live + '.');
    }
  }
  return plan;
}

function shiftedMonth(date, offset){
  const value = atNoon(date), day = value.getUTCDate();
  value.setUTCDate(1); value.setUTCMonth(value.getUTCMonth() + offset);
  const end = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, end));
  return value.toISOString().slice(0, 10);
}

function initCalendar(){
  const $ = id => document.getElementById(id);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const announce = (message, error = false) => {
    $('pageStatus').textContent = message;
    $('pageStatus').dataset.error = String(error);
  };
  let plan = normalizeCalendarPlan(CALENDAR), storageError = false;
  let startupMessage = 'Published lineup loaded. Drafts are proposals; saving here does not publish them.';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      plan = validateBrowserPlan(JSON.parse(saved));
      startupMessage = 'Your browser plan is restored. Draft changes still need review and release.';
    }
  } catch (error) {
    storageError = true;
    startupMessage = 'The saved browser plan could not be loaded. The source lineup is shown; the saved copy has been left untouched. ' + error.message;
  }
  const localToday = () => dayKey(new Date());
  let selected = localToday() < LAUNCH ? LAUNCH : localToday();
  const search = new URLSearchParams(window.location.search);
  if (isDateKey(search.get('date')) && search.get('date') >= LAUNCH) selected = search.get('date');
  else if (plan.campaigns[search.get('campaign')]) selected = plan.campaigns[search.get('campaign')].startDate;
  let viewDate = selected, view = window.matchMedia?.('(max-width: 650px)').matches ? 'week' : 'month';
  const future = date => date > latestLiveDate();
  const actual = date => {
    if (date < LAUNCH) return null;
    const entry = getPublishedEntry(date);
    return {entry, theme:themeById(entry?.themeId) || themeForDay(keyToDayNumber(date)),
      status:date <= latestLiveDate() ? 'Released' : entry ? 'Scheduled' : 'Automatic rotation'};
  };
  const save = (candidate, message) => {
    try {
      candidate.updatedAt = new Date().toISOString();
      plan = validateBrowserPlan(candidate);
      let persisted = true;
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); storageError = false; }
      catch { persisted = false; storageError = true; }
      render();
      announce(message + (persisted ? ' Saved in this browser. Export the plan for review.' : ' Browser storage is unavailable. Export now to keep this plan.'), !persisted);
      return true;
    } catch (error) { announce(error.message, true); return false; }
  };
  const select = (date, {focus = false, reveal = false} = {}) => {
    if (!isDateKey(date) || date < LAUNCH) return;
    selected = date; viewDate = date; render();
    if (focus) $('monthGrid').querySelector('[aria-selected="true"]')?.focus();
    if (reveal) $('dayInspector').scrollIntoView({block:'start', behavior:'auto'});
  };

  function renderGrid(){
    const start = view === 'month' ? weekStart(monthKey(viewDate)) : weekStart(viewDate);
    const count = view === 'month' ? 42 : 7, end = addDateDays(start, count - 1);
    const grid = $('monthGrid'); grid.replaceChildren(); grid.dataset.view = view;
    grid.setAttribute('aria-rowcount', view === 'month' ? '7' : '7');
    grid.setAttribute('aria-colcount', view === 'month' ? '7' : '1');
    const title = view === 'month' ? format(viewDate, {month:'long', year:'numeric'}) : shortDate(start) + ' – ' + shortDate(end);
    $('monthTitle').textContent = title;
    grid.setAttribute('aria-label', title + ', daily glass calendar');
    $('previousMonth').setAttribute('aria-label', 'Previous ' + view);
    $('nextMonth').setAttribute('aria-label', 'Next ' + view);
    $('previousMonth').disabled = (view === 'month' ? monthKey(viewDate) <= monthKey(LAUNCH) : start <= weekStart(LAUNCH));
    $('monthView').setAttribute('aria-pressed', String(view === 'month'));
    $('weekView').setAttribute('aria-pressed', String(view === 'week'));
    if (view === 'month') {
      const row = element('div', 'calendar-row'); row.setAttribute('role', 'row');
      for (const label of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
        const node = element('span', 'week-label', label); node.setAttribute('role', 'columnheader'); row.append(node);
      }
      grid.append(row);
    }
    let row;
    for (let i = 0; i < count; i++){
      if (view === 'week' || i % 7 === 0){ row = element('div', 'calendar-row'); row.setAttribute('role', 'row'); grid.append(row); }
      const date = addDateDays(start, i), live = actual(date), draft = plan.drafts[date];
      if (!live) {
        const empty = element('div', 'day-cell'); empty.dataset.empty = 'true'; empty.setAttribute('role', 'gridcell');
        empty.setAttribute('aria-label', longDate(date) + ', before launch'); empty.append(element('span', 'day-number', String(atNoon(date).getUTCDate()))); row.append(empty); continue;
      }
      const cell = element('button', 'day-cell'); cell.type = 'button'; cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-selected', String(date === selected)); cell.tabIndex = date === selected ? 0 : -1;
      cell.dataset.date = date; cell.dataset.outside = String(monthKey(date) !== monthKey(viewDate));
      cell.dataset.today = String(date === localToday());
      cell.setAttribute('aria-label', longDate(date) + '. ' + live.theme.name + ', ' + live.theme.label + '. ' + live.status +
        (draft ? '. Draft proposal: ' + themeById(draft.themeId).name + '.' : '.'));
      cell.append(element('span', 'day-weekday', format(date, {weekday:'short'})), element('span', 'day-number', String(atNoon(date).getUTCDate())),
        element('span', 'day-drink', live.theme.name), element('span', 'day-place', live.theme.label));
      if (draft) cell.append(element('span', 'day-draft', 'Draft: ' + themeById(draft.themeId).name));
      else cell.append(element('span', 'day-note', live.status === 'Automatic rotation' ? 'Rotation' : live.status));
      cell.addEventListener('click', () => select(date));
      cell.addEventListener('keydown', event => {
        let next;
        switch (event.key){
          case 'ArrowLeft': next = addDateDays(date, -1); break;
          case 'ArrowRight': next = addDateDays(date, 1); break;
          case 'ArrowUp': next = addDateDays(date, view === 'week' ? -1 : -7); break;
          case 'ArrowDown': next = addDateDays(date, view === 'week' ? 1 : 7); break;
          case 'Home': next = weekStart(date); break;
          case 'End': next = addDateDays(weekStart(date), 6); break;
          case 'PageUp': next = shiftedMonth(date, -1); break;
          case 'PageDown': next = shiftedMonth(date, 1); break;
          default: return;
        }
        event.preventDefault(); select(next < LAUNCH ? LAUNCH : next, {focus:true});
      });
      row.append(cell);
    }
    // A selected day may sit outside the visible month after navigation.
    if (!grid.querySelector('[tabindex="0"]')) grid.querySelector('button')?.setAttribute('tabindex', '0');
    $('monthRuns').replaceChildren();
    for (const campaign of Object.values(plan.campaigns)){
      if (campaign.startDate > end || campaign.endDate < start) continue;
      const item = element('div', 'month-run'); item.dataset.draft = String(campaign.status === 'draft');
      item.append(element('strong', '', campaign.name + (campaign.status === 'draft' ? ' · draft' : '')), element('span', '', shortDate(campaign.startDate) + '–' + shortDate(campaign.endDate)));
      $('monthRuns').append(item);
    }
    $('calendarVersion').textContent = 'Lineup v' + CALENDAR.version;
  }

  function renderInspector(){
    const live = actual(selected), draft = plan.drafts[selected], editable = future(selected);
    const campaign = getCampaignForDate(selected);
    $('selectedDate').textContent = longDate(selected);
    $('selectedStatus').textContent = live.status + (draft ? ' · draft proposal below' : ' · daily lineup');
    $('selectedDrink').textContent = live.theme.name;
    $('selectedPlace').textContent = live.theme.label + (live.theme.location ? ' · ' + live.theme.location : '');
    $('selectedVessel').textContent = live.theme.vessel.charAt(0).toUpperCase() + live.theme.vessel.slice(1);
    $('selectedNumber').textContent = '#' + String(keyToDayNumber(selected)).padStart(3, '0');
    $('selectedRun').textContent = campaign?.name || 'Standalone rotation';
    $('previewLink').href = SITE_URL + '#day' + keyToDayNumber(selected);
    $('previewNote').textContent = draft ? 'This preview shows the current lineup, before your proposal. Preview sips never save a daily result.' : 'Preview sips never save a daily result.';
    $('draftTheme').value = draft?.themeId || live.theme.id;
    $('draftCampaign').replaceChildren(new Option('A standalone day', 'none'));
    for (const [id, run] of Object.entries(plan.campaigns)){
      if (selected >= run.startDate && selected <= run.endDate) $('draftCampaign').append(new Option(run.name + (run.status === 'draft' ? ' · draft' : ''), id));
    }
    $('draftCampaign').value = draft?.campaignId || 'none';
    $('draftNotes').value = draft?.notes || '';
    $('draftFields').disabled = !editable;
    $('draftBoundary').textContent = editable ? 'A browser draft only. The daily game keeps its current lineup until review and release.' :
      'This date is already live somewhere in the world. Draft editing starts after ' + latestLiveDate() + ' (UTC+14).';
    $('selectedReview').hidden = !draft;
    $('clearDraft').disabled = !editable;
    $('reviewText').textContent = draft ? live.theme.name + ' → ' + themeById(draft.themeId).name + '. ' +
      (draft.campaignId === 'none' ? 'Standalone proposal.' : plan.campaigns[draft.campaignId].name + ' proposal.') : '';
    $('reviewNotes').textContent = draft?.notes || 'No notes added.';
    $('dayAnalytics').href = analyticsUrlForDate(selected);
  }

  function renderPlans(){
    const drafts = Object.entries(plan.drafts), draftRuns = Object.entries(plan.campaigns).filter(([, value]) => value.status === 'draft');
    const changed = new Set([...Object.keys(plan.drafts), ...Object.keys(CALENDAR.drafts)]);
    const changedDays = [...changed].filter(date => !same(plan.drafts[date], CALENDAR.drafts[date])).length;
    const changedRuns = [...new Set([...Object.keys(plan.campaigns), ...Object.keys(CALENDAR.campaigns)])].filter(id =>
      !same(plan.campaigns[id], CALENDAR.campaigns[id])).length;
    $('planSummary').textContent = drafts.length + ' draft dates and ' + draftRuns.length + ' draft ' + (draftRuns.length === 1 ? 'run' : 'runs') + '. ' +
      (changedDays || changedRuns ? changedDays + ' dates and ' + changedRuns + ' runs changed in this browser.' : 'No browser changes yet. Source proposals are shown.') +
      (storageError ? ' Export to keep changes while browser storage is unavailable.' : '');
    $('reviewSummary').textContent = 'Review all ' + drafts.length + ' draft dates';
    $('allDrafts').replaceChildren();
    if (!drafts.length) $('allDrafts').append(element('p', 'small-note', 'There are no draft dates. Choose a future day or create a run.'));
    for (const [date, draft] of drafts){
      const row = element('div', 'draft-review-row'), button = element('button', 'text-button', shortDate(date) + ', ' + date.slice(0, 4) + ' · ' + themeById(draft.themeId).name);
      button.type = 'button'; button.addEventListener('click', () => select(date, {reveal:true}));
      row.append(button, element('p', '', 'Current lineup: ' + actual(date).theme.name + '. ' + (draft.campaignId === 'none' ? 'Standalone draft.' : plan.campaigns[draft.campaignId].name + '.')));
      if (draft.notes) row.append(element('p', '', draft.notes));
      $('allDrafts').append(row);
    }
    $('campaignList').replaceChildren();
    for (const [id, run] of Object.entries(plan.campaigns)){
      const row = element('article', 'campaign-row');
      row.append(element('h3', '', run.name), element('p', 'run-dates', longDate(run.startDate) + ' – ' + longDate(run.endDate)),
        element('p', 'run-status', run.status === 'published' ? 'Published lineup' : 'Draft run · not published'));
      if (run.notes) row.append(element('p', '', run.notes));
      const open = element('button', 'text-button', 'See these dates'); open.type = 'button'; open.addEventListener('click', () => select(run.startDate, {reveal:true})); row.append(open);
      if (run.status === 'draft' && future(run.startDate)){
        const remove = element('button', 'text-button run-remove', 'Remove draft run'); remove.type = 'button';
        remove.addEventListener('click', () => {
          const candidate = clone(plan); delete candidate.campaigns[id];
          for (const [date, draft] of Object.entries(candidate.drafts)) if (draft.campaignId === id) delete candidate.drafts[date];
          save(candidate, run.name + ' and its draft dates removed.');
        }); row.append(remove);
      }
      $('campaignList').append(row);
    }
    $('campaignStart').min = addDateDays(latestLiveDate(), 1);
    $('campaignEnd').min = $('campaignStart').value || $('campaignStart').min;
  }
  function render(){ renderGrid(); renderInspector(); renderPlans(); }

  for (const theme of THEMES) $('draftTheme').append(new Option(theme.name + ' · ' + theme.label, theme.id));
  $('previousMonth').addEventListener('click', () => {
    const date = view === 'month' ? shiftedMonth(selected, -1) : addDateDays(selected, -7);
    select(date < LAUNCH ? LAUNCH : date);
  });
  $('nextMonth').addEventListener('click', () => select(view === 'month' ? shiftedMonth(selected, 1) : addDateDays(selected, 7)));
  $('todayButton').addEventListener('click', () => select(localToday() < LAUNCH ? LAUNCH : localToday()));
  $('monthView').addEventListener('click', () => { view = 'month'; renderGrid(); });
  $('weekView').addEventListener('click', () => { view = 'week'; renderGrid(); });
  $('draftForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!future(selected)) { announce('Choose a date after ' + latestLiveDate() + ' for a draft.', true); renderInspector(); return; }
    const candidate = clone(plan);
    candidate.drafts[selected] = {themeId:$('draftTheme').value, campaignId:$('draftCampaign').value, notes:$('draftNotes').value.trim()};
    save(candidate, 'Draft saved for ' + shortDate(selected) + '.');
  });
  $('clearDraft').addEventListener('click', () => {
    if (!future(selected)) { announce('Already live proposals are locked.', true); return; }
    const candidate = clone(plan); delete candidate.drafts[selected]; save(candidate, 'Draft removed for ' + shortDate(selected) + '.');
  });
  $('campaignStart').addEventListener('change', () => { $('campaignEnd').min = $('campaignStart').value || addDateDays(latestLiveDate(), 1); });
  $('campaignName').addEventListener('input', () => {
    if ($('campaignId').dataset.edited !== 'true') $('campaignId').value = $('campaignName').value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
  });
  $('campaignId').addEventListener('input', () => { $('campaignId').dataset.edited = 'true'; });
  $('campaignForm').addEventListener('submit', event => {
    event.preventDefault();
    const id = $('campaignId').value.trim(), startDate = $('campaignStart').value, endDate = $('campaignEnd').value;
    try {
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(id) || id === 'none') throw new Error('Use a run ID starting with a lowercase letter, followed by letters, numbers, or hyphens.');
      if (Object.hasOwn(plan.campaigns, id)) throw new Error('That run ID already exists. Use a new ID.');
      if (!isDateKey(startDate) || !isDateKey(endDate) || !future(startDate) || endDate < startDate) throw new Error('Choose a future run with its last day on or after its first day.');
      if (keyToDayNumber(endDate) - keyToDayNumber(startDate) > 365) throw new Error('Keep each run within one year. Longer seasons can use several runs.');
      const candidate = clone(plan);
      candidate.campaigns[id] = {name:$('campaignName').value.trim(), startDate, endDate, status:'draft', notes:$('campaignNotes').value.trim()};
      for (let date = startDate; date <= endDate; date = addDateDays(date, 1)){
        candidate.drafts[date] = {...candidate.drafts[date], themeId:candidate.drafts[date]?.themeId || actual(date).theme.id,
          campaignId:id, notes:candidate.drafts[date]?.notes || 'Planning placeholder using the existing glass. Glasses and artwork still need review.'};
      }
      if (save(candidate, 'Draft run created. Its glasses are existing placeholders until you choose them.')) {
        $('campaignForm').reset(); delete $('campaignId').dataset.edited; select(startDate);
      }
    } catch (error) { announce(error.message, true); }
  });

  function download(contents, type, filename){
    const url = URL.createObjectURL(new Blob([contents], {type})), anchor = element('a');
    anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('exportPlan').addEventListener('click', () => {
    try {
      const valid = validateBrowserPlan(plan);
      download(JSON.stringify(valid, null, 2) + '\n', 'application/json', 'split-calendar-plan-' + localToday() + '.json');
      announce('Plan exported for review. Publishing requires a reviewed site release.');
    } catch (error) { announce(error.message, true); }
  });
  $('importPlan').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a plan smaller than 1 MB.');
      const candidate = validateBrowserPlan(JSON.parse(await file.text()));
      save(candidate, 'Plan imported as browser drafts. The published lineup stays as released.');
    } catch (error) { announce('The plan was not imported. ' + error.message, true); }
    finally { event.target.value = ''; }
  });
  $('downloadLocalFeed').addEventListener('click', () => {
    try {
      const valid = validateBrowserPlan(plan);
      const endDate = [addDateDays(localToday() < LAUNCH ? LAUNCH : localToday(), 366), ...Object.keys(valid.drafts), ...Object.values(valid.campaigns).map(run => run.endDate)].sort().at(-1);
      const feed = createCalendarFeed({startDate:LAUNCH, endDate, plan:valid, includeDrafts:true,
        resolveTheme:(date, themeId) => themeById(themeId) || themeForDay(keyToDayNumber(date))});
      download(feed, 'text/calendar;charset=utf-8', 'split-browser-plan-' + localToday() + '.ics');
      announce('Planning snapshot downloaded. This file includes browser drafts; subscription feeds update after review and release.');
    } catch (error) { announce('Calendar could not be downloaded. ' + error.message, true); }
  });
  for (const [name, filename] of [['Live', 'calendar.ics'], ['Planning', 'calendar-planning.ics']]){
    const url = new URL(filename, SITE_URL).href;
    $('subscribe' + name).href = url.replace(/^https?:/, 'webcal:');
    $('download' + name).href = url;
    $(name === 'Live' ? 'liveFeedUrl' : 'planningFeedUrl').value = url;
    $(name === 'Live' ? 'liveFeedUrl' : 'planningFeedUrl').addEventListener('click', event => event.target.select());
  }
  $('themeAnalytics').href = THEME_ANALYTICS_URL;
  $('performanceDashboard').href = ANALYTICS_DASHBOARD_URL;
  render(); announce(startupMessage, storageError);
}

if (typeof document !== 'undefined') initCalendar();
