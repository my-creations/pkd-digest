module.exports = {
  name: 'PKD Digest',
  namePt: 'Digest DRP',
  title: {
    en: 'PKD Digest — weekly cystic kidney disease digest',
    pt: 'Digest DRP — digest semanal sobre doença renal poliquística',
  },
  description: {
    en: 'Weekly bilingual EN+PT curated digest on cystic kidney disease for patients, families, and clinicians.',
    pt: 'Digest semanal bilingue EN+PT sobre doença renal quística para doentes, famílias e clínicos.',
  },
  url: 'https://my-creations.github.io',
  pathPrefix: process.env.ELEVENTY_PATH_PREFIX || '/pkd-digest/',
  repo: 'https://github.com/my-creations/pkd-digest',
  language: 'en',
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  buildYear: new Date().getFullYear(),
  contactEmail: 'pmrobalo@gmail.com',
};
