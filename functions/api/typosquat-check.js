// GET /api/typosquat-check?ecosystem=npm&package=lodas
//
// Checks a package name against a curated list of well-known npm/PyPI
// packages using Damerau-Levenshtein edit distance. Flags names that
// are suspiciously close (1-2 edits) to a popular package -- the
// classic typosquatting pattern (publish "lodas" hoping someone
// fat-fingers "npm install lodas" instead of "lodash").
//
// The reference list is a curated ~200-name list of genuinely
// well-known packages per ecosystem, not a scraped "top N by
// downloads" feed -- deliberately smaller and hand-maintained rather
// than exhaustive, since typosquatting attacks specifically target
// the most famous names, and a stale or noisy "top 5000" list would
// produce more false positives than a focused one. This is a real
// tradeoff, not hidden: the list needs periodic manual review to stay
// current, and won't catch typos of a mid-popularity package.
//
// Complements vulnerability-check: "is this exact package/version
// vulnerable" plus "does this package name itself look like a typo
// of something popular" together cover two different supply-chain
// risks with the same underlying question -- should I trust this
// dependency name I'm about to install.

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 10) return false;
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });
  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

function damerauLevenshtein(a, b) {
  const al = a.length, bl = b.length;
  if (Math.abs(al - bl) > 3) return 99; // trop différent, pas la peine de calculer
  const d = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) d[i][0] = i;
  for (let j = 0; j <= bl; j++) d[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[al][bl];
}

// Listes organisées manuellement -- paquets véritablement emblématiques,
// pas un flux "top N par téléchargements" (voir note en tête de fichier).
const POPULAR = {
  npm: [
    'react', 'react-dom', 'vue', 'angular', 'svelte', 'jquery', 'lodash', 'underscore',
    'express', 'koa', 'fastify', 'next', 'nuxt', 'gatsby', 'webpack', 'vite', 'rollup',
    'babel', 'typescript', 'eslint', 'prettier', 'jest', 'mocha', 'chai', 'cypress',
    'axios', 'request', 'node-fetch', 'got', 'superagent', 'cross-env', 'dotenv',
    'moment', 'dayjs', 'date-fns', 'chalk', 'commander', 'yargs', 'inquirer',
    'redux', 'mobx', 'zustand', 'rxjs', 'immer', 'formik', 'yup', 'zod', 'joi',
    'classnames', 'clsx', 'styled-components', 'emotion', 'tailwindcss', 'sass',
    'nodemon', 'pm2', 'concurrently', 'husky', 'lint-staged', 'semantic-release',
    'uuid', 'nanoid', 'shortid', 'bcrypt', 'bcryptjs', 'jsonwebtoken', 'passport',
    'mongoose', 'sequelize', 'prisma', 'typeorm', 'knex', 'pg', 'mysql', 'mysql2',
    'redis', 'ioredis', 'socket.io', 'ws', 'graphql', 'apollo-server', 'body-parser',
    'cors', 'helmet', 'morgan', 'multer', 'compression', 'cookie-parser',
    'react-router', 'react-router-dom', 'vue-router', 'vuex', 'pinia',
    'webpack-cli', 'webpack-dev-server', 'babel-loader', 'css-loader', 'style-loader',
    'eslint-config-airbnb', 'eslint-plugin-react', 'stylelint', 'postcss', 'autoprefixer',
    'lerna', 'nx', 'turbo', 'rimraf', 'glob', 'minimist', 'yargs-parser',
    'debug', 'winston', 'pino', 'bunyan', 'colors', 'kleur',
    'left-pad', 'is-odd', 'is-even', 'is-array', 'is-number', 'is-string',
    'semver', 'validator', 'xss', 'sanitize-html', 'dompurify',
    'puppeteer', 'playwright', 'selenium-webdriver', 'cheerio', 'jsdom',
    'sharp', 'jimp', 'canvas', 'pdfkit', 'pdf-lib', 'exceljs', 'xlsx',
    'aws-sdk', '@aws-sdk/client-s3', 'firebase', 'firebase-admin', 'stripe',
    'nodemailer', 'sendgrid', 'twilio', 'openai', 'langchain',
  ],
  PyPI: [
    'requests', 'urllib3', 'numpy', 'pandas', 'scipy', 'matplotlib', 'seaborn',
    'scikit-learn', 'tensorflow', 'torch', 'pytorch', 'keras', 'transformers',
    'flask', 'django', 'fastapi', 'starlette', 'uvicorn', 'gunicorn', 'tornado',
    'sqlalchemy', 'alembic', 'psycopg2', 'pymongo', 'redis', 'celery',
    'pytest', 'unittest2', 'nose', 'tox', 'coverage', 'mock',
    'setuptools', 'pip', 'wheel', 'twine', 'virtualenv', 'pipenv', 'poetry',
    'boto3', 'botocore', 'awscli', 'google-cloud-storage', 'azure-storage-blob',
    'pillow', 'opencv-python', 'imageio', 'scikit-image',
    'beautifulsoup4', 'lxml', 'scrapy', 'selenium', 'playwright',
    'pyyaml', 'toml', 'jsonschema', 'marshmallow', 'pydantic',
    'click', 'argparse', 'typer', 'rich', 'colorama', 'tqdm',
    'cryptography', 'pyjwt', 'bcrypt', 'passlib', 'paramiko',
    'jinja2', 'markupsafe', 'werkzeug', 'itsdangerous',
    'python-dateutil', 'pytz', 'arrow', 'pendulum',
    'six', 'attrs', 'dataclasses', 'typing-extensions',
    'openai', 'langchain', 'anthropic', 'huggingface-hub',
    'matplotlib', 'plotly', 'bokeh', 'streamlit', 'gradio',
    'black', 'flake8', 'pylint', 'mypy', 'isort', 'autopep8',
    'gevent', 'greenlet', 'asyncio', 'aiohttp', 'httpx',
    'django-rest-framework', 'djangorestframework', 'graphene',
  ],
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'typosquat-check');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const pkg = (searchParams.get('package') || '').trim().toLowerCase();
  const ecosystemRaw = (searchParams.get('ecosystem') || '').trim();
  const ecosystem = ecosystemRaw.toLowerCase() === 'npm' ? 'npm'
    : ['pypi', 'python', 'pip'].includes(ecosystemRaw.toLowerCase()) ? 'PyPI'
    : null;

  if (!pkg || !ecosystemRaw) {
    return new Response(JSON.stringify({
      usage: 'GET /api/typosquat-check?ecosystem=npm&package=lodas',
      note: 'Checks the package name against a curated list of well-known packages using edit distance. Supported ecosystems: npm, PyPI.',
      list_size: { npm: POPULAR.npm.length, PyPI: POPULAR.PyPI.length },
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  if (!ecosystem) {
    return new Response(JSON.stringify({ error: `Unsupported ecosystem "${ecosystemRaw}". Supported: npm, PyPI.` }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const list = POPULAR[ecosystem];
  const matches = [];
  for (const name of list) {
    const d = damerauLevenshtein(pkg, name);
    if (d > 0 && d <= 2) matches.push({ name, distance: d });
  }
  matches.sort((a, b) => a.distance - b.distance);

  const exactMatch = list.includes(pkg);

  return new Response(JSON.stringify({
    package: pkg,
    ecosystem,
    is_known_popular_package: exactMatch,
    suspicious: !exactMatch && matches.length > 0,
    similar_to: matches.slice(0, 5),
    note: exactMatch
      ? 'This name IS one of the well-known packages checked against -- not a typo.'
      : matches.length > 0
        ? 'Name is within edit-distance 2 of a well-known package. Verify this is the package you meant to install, not a look-alike.'
        : 'No close match to any well-known package on this curated list. This does NOT mean the package is safe -- only that it does not resemble a famous name. Pair with vulnerability-check for known CVEs.',
    source: `Curated list of ~${list.length} well-known ${ecosystem} packages, checked via Damerau-Levenshtein edit distance (transpositions, omissions, insertions, substitutions). Not an exhaustive top-N-by-downloads feed.`,
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() } });
}
