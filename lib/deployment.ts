export function getSiteOrigin(fallback = 'https://seyfert.dev'): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;

  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return fallback;
}

export const isPreviewDeployment =
  process.env.DEPLOYMENT_ENV === 'preview' || process.env.VERCEL_ENV === 'preview';
