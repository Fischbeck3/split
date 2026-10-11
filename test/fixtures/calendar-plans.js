// Future proposals belong in test fixtures, not in the shipped content calendar.
import {CALENDAR} from '../../site/js/calendar-data.js';

export function futureCalendar(){
  const plan = structuredClone(CALENDAR);
  // Keep proposal tests independent of later published content and approvals.
  plan.days = Object.fromEntries(Object.entries(plan.days).filter(([date]) => date <= '2026-10-14'));
  plan.campaigns = {'opening-2026':plan.campaigns['opening-2026']};
  plan.campaigns['unreviewed-holiday-2026'] = {name:'Unreviewed holiday week', startDate:'2026-10-25', endDate:'2026-10-31',
    status:'draft', notes:'Test proposal. Campaign artwork has not been approved.'};
  const ids = ['pub', 'butterbeer', 'peroni', 'sapporo', 'beach', 'butterbeer', 'munich'];
  for (let i = 0; i < ids.length; i++) {
    plan.drafts['2026-10-' + (25 + i)] = {themeId:ids[i], campaignId:'unreviewed-holiday-2026', notes:'Test proposal using a developed glass.'};
  }
  return plan;
}
