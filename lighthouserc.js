module.exports = {
  ci: {
    collect: {
      // Eleventy serves the site with its /pkd-digest/ pathPrefix, exactly as shipped.
      startServerCommand: 'bunx eleventy --serve --port=8931',
      startServerReadyPattern: 'Server at',
      startServerReadyTimeout: 60000,
      url: [
        'http://localhost:8931/pkd-digest/',
        'http://localhost:8931/pkd-digest/digest/',
        'http://localhost:8931/pkd-digest/pt/digest/',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
