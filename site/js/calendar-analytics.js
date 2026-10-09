// Completion-attributed conversions. A browser can contribute once per challenge.
// Project routes were verified with PostHog's generate-app-url tool.
export const ANALYTICS_DASHBOARD_URL = 'https://us.posthog.com/project/655684/dashboard/2191648';
export const THEME_ANALYTICS_URL = 'https://us.posthog.com/project/655684/dashboard/2192211';
const NEW_INSIGHT_URL = 'https://us.posthog.com/project/655684/insights/new';

// These released IDs have a known base glass, vessel and scene. Do not infer a
// historical holiday campaign or artwork version from a drink's name.
export const LEGACY_GLASS_ATTRIBUTION = Object.freeze({
  pub:{vessel:'tulip', scene:'pub'}, beach:{vessel:'bottle', scene:'beach'},
  munich:{vessel:'stein', scene:'munich'}, sapporo:{vessel:'tall', scene:'tokyo'},
  butterbeer:{vessel:'tulip', scene:'hogsmeade'}, peroni:{vessel:'tall', scene:'rome'},
  lager:{vessel:'nonic', scene:'bar'}, pale:{vessel:'tumbler', scene:'bar'},
  cider:{vessel:'tulip', scene:'bar'}, red:{vessel:'nonic', scene:'bar'},
  coffee:{vessel:'cup', scene:'bar'}, choc:{vessel:'mug', scene:'bar'},
  matcha:{vessel:'tumbler', scene:'bar'}, cola:{vessel:'tall', scene:'bar'}
});

const completion = "event = 'sip_completed' AND properties.new_record = true";
// JSON event properties can resolve as Variant/Dynamic in ClickHouse. Cast
// dimensions before aggregating so their results can be used as GROUP BY keys.
const textProperty = (name, fallback = "'Unknown'") => `coalesce(nullIf(toString(properties.${name}), ''), ${fallback})`;
function legacyProperty(name){
  const cases = Object.entries(LEGACY_GLASS_ATTRIBUTION).map(([id, data]) =>
    `WHEN properties.theme = '${id}' THEN '${name === 'glass_id' ? id : data[name]}'`).join('\n                ');
  return textProperty(name, `CASE\n                ${cases}\n                ELSE 'Unknown'\n            END`);
}
const attributed = (expression, name) => `argMinIf(${expression}, timestamp, ${completion}) AS ${name}`;

// {filters} expands the source's dateRange into timestamp bounds. Every query
// scans events once, then retains only browser/challenge groups with a finisher.
const browserChallenges = `SELECT
            distinct_id AS browser_id,
            toString(toDate(properties.challenge_date)) AS challenge_date,
            countIf(${completion}) AS eligible_completions,
            minIf(timestamp, ${completion}) AS completed_at,
            ${attributed(textProperty('theme'), 'theme')},
            ${attributed(legacyProperty('glass_id'), 'glass_id')},
            ${attributed(legacyProperty('vessel'), 'vessel')},
            ${attributed(legacyProperty('scene'), 'scene')},
            ${attributed(textProperty('visual_theme'), 'visual_theme')},
            ${attributed(textProperty('campaign_id', "'none'"), 'campaign_id')},
            ${attributed('coalesce(toInt(properties.campaign_day), 0)', 'campaign_day')},
            ${attributed(textProperty('schedule_version'), 'schedule_version')},
            groupArrayIf(timestamp,
                event IN ('result_shared', 'result_copied')
                AND properties.local_play_date = properties.challenge_date
            ) AS successful_share_times
        FROM events
        WHERE event IN ('sip_completed', 'result_shared', 'result_copied')
            AND properties.attempt_kind = 'daily'
            AND properties.counts = true
            AND properties.challenge_date IS NOT NULL
            AND toString(properties.challenge_date) != ''
            AND {filters}
        GROUP BY browser_id, challenge_date`;

const conversions = `SELECT
        browser_id AS browser_id,
        challenge_date AS challenge_date,
        theme AS theme,
        glass_id AS glass_id,
        vessel AS vessel,
        scene AS scene,
        visual_theme AS visual_theme,
        campaign_id AS campaign_id,
        campaign_day AS campaign_day,
        schedule_version AS schedule_version,
        arrayExists(shared_at -> shared_at > completed_at
            AND shared_at <= addHours(completed_at, 24), successful_share_times) AS converted,
        addHours(completed_at, 24) > now() AS partial_cohort
    FROM (
        ${browserChallenges}
    )
    WHERE eligible_completions > 0`;

const metrics = `count() AS finishers,
    countIf(converted) AS converters,
    1.0 * countIf(converted) / nullIf(count(), 0) AS share_rate,
    countIf(partial_cohort) AS partial_finishers,
    24 AS window_hours`;
const challengeColumns = ['challenge_date', 'theme', 'glass_id', 'vessel', 'scene', 'visual_theme', 'campaign_id', 'campaign_day', 'schedule_version'];
const metricColumns = ['finishers', 'converters', 'share_rate', 'partial_finishers', 'window_hours'];

function tableQuery(dimensions, {challenge = false} = {}){
  const fields = dimensions.map(name => `${name} AS ${name}`).join(',\n    ');
  const coverage = challenge ? '' : '\n    min(challenge_date) AS first_challenge_date,\n    max(challenge_date) AS last_challenge_date,';
  return {
    kind:'DataVisualizationNode',
    source:{kind:'HogQLQuery', query:`SELECT
    ${fields},${coverage}
    ${metrics}
FROM (
    ${conversions}
)
GROUP BY ${dimensions.join(', ')}
ORDER BY ${challenge ? 'challenge_date DESC, theme ASC' : 'finishers DESC'}
LIMIT 500`, filters:{dateRange:{date_from:'-90d', date_to:null}}},
    display:'ActionsTable',
    tableSettings:{columns:[...dimensions, ...(challenge ? [] : ['first_challenge_date', 'last_challenge_date']), ...metricColumns].map(column =>
      column === 'share_rate' ? {column, settings:{formatting:{style:'percent', decimalPlaces:1}}} : {column})}
  };
}

const description = 'Browser × challenge conversion: first daily counts=true, new_record=true completion → native handoff or copy after completion, within 24h, on the same local challenge date. Repeat shares count once. Attribution uses completion properties. Rates weight browser-challenge finishers; partial_finishers have an open 24h window. Dates follow challenges; event scan defaults to 90 days.';
export const CALENDAR_ANALYTICS_INSIGHTS = [
  {name:'Daily Split · share conversion by challenge', description, tags:['dailysplit:calendar-challenge-conversion'], query:tableQuery(challengeColumns, {challenge:true})},
  {name:'Daily Split · share conversion by glass', description, tags:['dailysplit:calendar-glass-conversion'], query:tableQuery(['glass_id', 'vessel'])},
  {name:'Daily Split · share conversion by visual theme', description, tags:['dailysplit:calendar-theme-conversion'], query:tableQuery(['visual_theme'])},
  {name:'Daily Split · share conversion by campaign', description, tags:['dailysplit:calendar-campaign-conversion'], query:tableQuery(['campaign_id'])}
];

function calendarDate(value){
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function analyticsQueryForDate(value){
  const date = calendarDate(value);
  if (!date) return null;
  const query = structuredClone(CALENDAR_ANALYTICS_INSIGHTS[0].query);
  // Local challenge dates span UTC dates in different regions. Widen the scan
  // on either side, while the exact event-property filter selects this challenge.
  query.source.filters = {
    dateRange:{date_from:new Date(date.getTime() - 86400000).toISOString(), date_to:new Date(date.getTime() + 2 * 86400000).toISOString()},
    properties:[{type:'event', key:'challenge_date', operator:'exact', value:[value]}]
  };
  return query;
}

export function analyticsUrlForDate(value){
  const query = analyticsQueryForDate(value);
  return query ? NEW_INSIGHT_URL + '#q=' + encodeURIComponent(JSON.stringify(query)) : THEME_ANALYTICS_URL;
}
