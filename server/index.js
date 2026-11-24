import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAuthorizationUrl,
  buildDashboardData,
  exchangeAuthorizationCode,
  getChannel,
  getChannelAnalytics,
  getYouTubeConfig,
  getVideos,
  refreshAccessToken,
} from './youtube.js';
import { isLoopbackAddress, matchesOrigin } from './origin.js';
import { createTokenStore, getEncryptionKey } from './storage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const cookieName = 'social_dashboard_session';
const sessionLifetime = 60 * 24 * 60 * 60;
const stateLifetime = 10 * 60 * 1000;
const frontendOrigins = (
  process.env.FRONTEND_ORIGINS
  || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
).split(',').map((origin) => origin.trim()).filter(Boolean);
const authorizationStates = new Map();
const tokenStore = createTokenStore(
  path.join(root, '.data', 'youtube.enc.json'),
  () => getEncryptionKey(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY),
);
const credentialsStore = createTokenStore(
  path.join(root, '.data', 'youtube-config.enc.json'),
  () => getEncryptionKey(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY),
);
let config = getYouTubeConfig(process.env);

function getCookies(request) {
  return Object.fromEntries(
    (request.headers.cookie || '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name, value]) => name && value)
      .map(([name, ...value]) => [name, decodeURIComponent(value.join('='))]),
  );
}

function getSessionId(request) {
  return getCookies(request)[cookieName];
}

function setSessionCookie(response, sessionId) {
  response.cookie(cookieName, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionLifetime * 1000,
    path: '/api/youtube',
  });
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '')
    && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function getDateRange(request) {
  const today = new Date().toISOString().slice(0, 10);
  const end = request.query.end || today;
  const start = request.query.start
    || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (!validDate(start) || !validDate(end) || start > end) {
    const error = new Error('Choose a valid date range.');
    error.status = 400;
    throw error;
  }

  return { start, end };
}

function requireYouTubeSession(request, response, next) {
  const stored = tokenStore.get();
  if (!stored?.sessionId || getSessionId(request) !== stored.sessionId) {
    return response.status(401).json({ error: 'Connect YouTube to view channel data.' });
  }
  return next();
}

async function getValidToken() {
  const stored = tokenStore.get();
  if (!stored) {
    const error = new Error('Connect YouTube to view channel data.');
    error.status = 401;
    throw error;
  }

  if (stored.expiresAt && stored.expiresAt - Date.now() < 5 * 60 * 1000) {
    if (!stored.refreshToken) {
      const error = new Error('YouTube access expired. Disconnect and reconnect to grant offline access.');
      error.status = 401;
      throw error;
    }

    const refreshed = await refreshAccessToken(config, stored.refreshToken);
    const next = {
      ...stored,
      ...refreshed,
      refreshToken: refreshed.refreshToken || stored.refreshToken,
    };
    await tokenStore.save(next);
    return next;
  }

  return stored;
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use('/api', (request, response, next) => {
  response.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  next();
});

app.get('/api/youtube/status', (request, response) => {
  const stored = tokenStore.get();
  const authenticated = Boolean(
    stored?.sessionId && getSessionId(request) === stored.sessionId,
  );
  let encryptionKeyReady = true;
  try {
    getEncryptionKey(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY);
  } catch {
    encryptionKeyReady = false;
  }

  response.json({
    configured: config.configured && encryptionKeyReady,
    encryptionKeyReady,
    connected: Boolean(stored),
    authenticated,
    account: authenticated ? stored.channel : null,
    expiresAt: authenticated ? stored.expiresAt : null,
    redirectUri: config.redirectUri || `${request.get('origin') || `${request.protocol}://${request.get('host')}`}/api/youtube/callback`,
  });
});

app.post('/api/youtube/configure', async (request, response, next) => {
  if (!isLoopbackAddress(request.socket.remoteAddress)) {
    return response.status(403).json({ error: 'Credential setup is available only from this computer.' });
  }

  if (!matchesOrigin(request, frontendOrigins)) {
    return response.status(403).json({ error: 'Request origin was not allowed.' });
  }

  try {
    getEncryptionKey(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY);
  } catch {
    return response.status(503).json({
      error: 'Set YOUTUBE_TOKEN_ENCRYPTION_KEY in .env before saving credentials. This key encrypts the credentials on this server.',
    });
  }

  const origin = request.get('origin');
  let redirectUri;
  try {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid origin.');
    redirectUri = new URL('/api/youtube/callback', url).toString();
  } catch {
    return response.status(400).json({ error: 'The dashboard origin is invalid.' });
  }

  const submitted = request.body || {};
  const credentials = {
    apiKey: typeof submitted.apiKey === 'string' ? submitted.apiKey.trim() : '',
    clientId: typeof submitted.clientId === 'string' ? submitted.clientId.trim() : '',
    clientSecret: typeof submitted.clientSecret === 'string' ? submitted.clientSecret.trim() : '',
    redirectUri,
    apiVersion: process.env.YOUTUBE_API_VERSION || 'v3',
  };
  const nextConfig = getYouTubeConfig({
    YOUTUBE_API_KEY: credentials.apiKey,
    YOUTUBE_CLIENT_ID: credentials.clientId,
    YOUTUBE_CLIENT_SECRET: credentials.clientSecret,
    YOUTUBE_REDIRECT_URI: credentials.redirectUri,
    YOUTUBE_API_VERSION: credentials.apiVersion,
  });
  if (!nextConfig.configured) {
    return response.status(400).json({
      error: 'Enter the YouTube API key, Google OAuth client ID, and client secret.',
    });
  }

  try {
    const currentConfig = credentialsStore.get()?.credentials || getYouTubeConfig(process.env);
    const changed = currentConfig.apiKey !== credentials.apiKey
      || currentConfig.clientId !== credentials.clientId
      || currentConfig.clientSecret !== credentials.clientSecret
      || currentConfig.redirectUri !== credentials.redirectUri;
    await credentialsStore.save({ credentials });
    if (changed) await tokenStore.clear();
    config = nextConfig;
    return response.json({ configured: true, redirectUri });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/youtube/connect', (request, response, next) => {
  if (!config.configured || !process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY) {
    return response.status(503).json({
      error: 'Configure YouTube credentials in the dashboard or .env, then set the token encryption key.',
    });
  }

  try {
    getEncryptionKey(process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY);
    const sessionId = crypto.randomBytes(32).toString('hex');
    const state = crypto.randomBytes(32).toString('hex');
    for (const [key, value] of authorizationStates) {
      if (value.expiresAt < Date.now()) authorizationStates.delete(key);
    }
    authorizationStates.set(state, {
      sessionId,
      config,
      expiresAt: Date.now() + stateLifetime,
    });
    setSessionCookie(response, sessionId);
    return response.redirect(buildAuthorizationUrl(config, state));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/youtube/callback', async (request, response) => {
  const { code, state, error } = request.query;
  const pending = authorizationStates.get(state);
  authorizationStates.delete(state);

  if (error) return response.redirect('/?youtube=denied');
  if (
    !code
    || typeof code !== 'string'
    || !pending
    || pending.expiresAt < Date.now()
    || getSessionId(request) !== pending.sessionId
  ) {
    return response.redirect('/?youtube=error');
  }

  try {
    const token = await exchangeAuthorizationCode(pending.config, code);
    const refreshToken = token.refreshToken;
    if (!refreshToken) {
      throw new Error('Google did not return a refresh token. Revoke this app in your Google account and reconnect.');
    }

    const profile = await getChannel(pending.config, token.accessToken);
    await tokenStore.save({
      ...token,
      refreshToken,
      channel: profile,
      sessionId: pending.sessionId,
      followersHistory: [{
        date: new Date().toISOString().slice(0, 10),
        followers: profile.subscribers,
      }],
    });
    setSessionCookie(response, pending.sessionId);
    return response.redirect('/?youtube=connected');
  } catch (caught) {
    process.stderr.write('YouTube authorization callback failed.\n');
    return response.redirect('/?youtube=error');
  }
});

app.post('/api/youtube/disconnect', requireYouTubeSession, async (request, response, next) => {
  if (!matchesOrigin(request, frontendOrigins)) {
    return response.status(403).json({ error: 'Request origin was not allowed.' });
  }

  try {
    await tokenStore.clear();
    response.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/youtube',
    });
    return response.json({ connected: false });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/youtube/dashboard', requireYouTubeSession, async (request, response, next) => {
  try {
    const range = getDateRange(request);
    const stored = await getValidToken();
    const channel = await getChannel(config, stored.accessToken);
    const videos = await getVideos(config, stored.accessToken, channel.uploadsPlaylistId);
    let report = null;
    let analyticsError = null;
    try {
      report = await getChannelAnalytics(config, stored.accessToken, range.start, range.end);
    } catch (error) {
      process.stderr.write(`YouTube Analytics request failed: ${error.message}\n`);
      analyticsError = 'YouTube Analytics is temporarily unavailable. Video statistics are still available.';
    }
    const analyticsCheckedAt = new Date().toISOString();

    const today = new Date().toISOString().slice(0, 10);
    const followersHistory = [
      ...(stored.followersHistory || []).filter((item) => item.date !== today),
      { date: today, followers: channel.subscribers },
    ].slice(-90);
    await tokenStore.save({ ...stored, channel, followersHistory });

    return response.json(buildDashboardData({
      channel,
      videos,
      report,
      analyticsError,
      analyticsCheckedAt,
    }));
  } catch (error) {
    return next(error);
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
}

app.use('/api', (request, response) => {
  response.status(404).json({ error: 'API route not found.' });
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  const status = Number(error.status) || 500;
  const message = status >= 500
    ? 'YouTube data could not be loaded. Check API access and permissions, then try again.'
    : error.message;
  return response.status(status).json({ error: message });
});

if (process.env.NODE_ENV === 'production') {
  app.get('/{*path}', (request, response) => response.sendFile(path.join(root, 'dist', 'index.html')));
}

export async function startServer() {
  await tokenStore.load();
  const storedCredentials = await credentialsStore.load();
  if (storedCredentials?.credentials) {
    config = getYouTubeConfig({
      ...process.env,
      YOUTUBE_API_KEY: storedCredentials.credentials.apiKey,
      YOUTUBE_CLIENT_ID: storedCredentials.credentials.clientId,
      YOUTUBE_CLIENT_SECRET: storedCredentials.credentials.clientSecret,
      YOUTUBE_REDIRECT_URI: storedCredentials.credentials.redirectUri,
    });
  }
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '127.0.0.1';
  return app.listen(port, host, () => {
    process.stdout.write(`YouTube API server listening on http://${host}:${port}\n`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
