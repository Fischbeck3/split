// The public address is prepared here; registration and DNS are separate launch steps.
export const SITE_URL = 'https://dailysplit.us/';
export const SOCIAL_IMAGE = 'og-opening-v2.jpg';

// The public calendar opened on October 9, 2026. Keep this date fixed:
// moving it would renumber existing challenges and shared results.
export const LAUNCH = '2026-10-09';
export const LAUNCH_READY = true;

// Public PostHog project token (phc_...), never a personal API key.
// A blank token disables analytics; local and preview hosts never send events.
export const POSTHOG_PROJECT_KEY = 'phc_w7WRMP8LjdnPSWqkLF7qZjhSmyqfh3fVZXVkNWMA4A3S';
export const POSTHOG_API_HOST = 'https://us.i.posthog.com';
export const ANALYTICS_HOSTNAMES = ['dailysplit.us', 'www.dailysplit.us'];
