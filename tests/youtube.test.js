import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { isLoopbackAddress, matchesOrigin } from '../server/origin.js';
import {
  buildAuthorizationUrl,
  buildDashboardData,
  exchangeAuthorizationCode,
  getChannel,
  getChannelAnalytics,
  getYouTubeConfig,
  getVideos,
  refreshAccessToken,
} from '../server/youtube.js';
import { decryptStore, encryptStore, getEncryptionKey } from '../server/storage.js';

const config = {
  apiKey: 'test-api-key',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:5173/api/youtube/callback',
  apiVersion: 'v3',
};

test('builds Google OAuth authorization URL with read-only scopes and state', () => {
  const url = new URL(buildAuthorizationUrl(config, 'random-state'));

  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.pathname, '/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'), config.clientId);
  assert.equal(url.searchParams.get('redirect_uri'), config.redirectUri);
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('state'), 'random-state');
  assert.deepEqual(url.searchParams.get('scope').split(' '), [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
  ]);
});

test('requires a Data API key, OAuth client credentials, and redirect URI', () => {
  assert.equal(getYouTubeConfig({
    YOUTUBE_API_KEY: 'key',
    YOUTUBE_CLIENT_ID: 'client',
    YOUTUBE_CLIENT_SECRET: 'secret',
    YOUTUBE_REDIRECT_URI: 'http://localhost:5173/api/youtube/callback',
  }).configured, true);
  assert.equal(getYouTubeConfig({}).configured, false);
});

test('exchanges the OAuth code server-side and returns refresh token metadata', async () => {
  const originalFetch = globalThis.fetch;
  let url;
  let body;
  globalThis.fetch = async (target, options) => {
    url = new URL(target);
    body = new URLSearchParams(options.body);
    return {
      ok: true,
      json: async () => ({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      }),
    };
  };

  try {
    const token = await exchangeAuthorizationCode(config, 'one-time-code');

    assert.equal(url.origin, 'https://oauth2.googleapis.com');
    assert.equal(body.get('client_id'), config.clientId);
    assert.equal(body.get('client_secret'), config.clientSecret);
    assert.equal(body.get('code'), 'one-time-code');
    assert.equal(body.get('grant_type'), 'authorization_code');
    assert.equal(body.get('redirect_uri'), config.redirectUri);
    assert.equal(token.accessToken, 'access-token');
    assert.equal(token.refreshToken, 'refresh-token');
    assert.ok(token.expiresAt > Date.now());
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('refreshes OAuth access tokens while preserving a refresh token if not rotated', async () => {
  const originalFetch = globalThis.fetch;
  let body;
  globalThis.fetch = async (target, options) => {
    body = new URLSearchParams(options.body);
    return {
      ok: true,
      json: async () => ({ access_token: 'refreshed-token', expires_in: 3600 }),
    };
  };

  try {
    const token = await refreshAccessToken(config, 'saved-refresh-token');
    assert.equal(body.get('grant_type'), 'refresh_token');
    assert.equal(body.get('refresh_token'), 'saved-refresh-token');
    assert.equal(token.accessToken, 'refreshed-token');
    assert.equal(token.refreshToken, 'saved-refresh-token');
    assert.ok(token.expiresAt > Date.now());
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reads channel identity and statistics from the authenticated Data API', async () => {
  const originalFetch = globalThis.fetch;
  let url;
  let headers;
  globalThis.fetch = async (target, options) => {
    url = new URL(target);
    headers = options.headers;
    return {
      ok: true,
      json: async () => ({
        items: [{
          id: 'channel-1',
          snippet: { title: 'Fieldnotes', thumbnails: { high: { url: 'https://img.example/channel.jpg' } } },
          statistics: { subscriberCount: '42', viewCount: '1200', videoCount: '7' },
          contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } },
        }],
      }),
    };
  };

  try {
    const channel = await getChannel(config, 'access-token');
    assert.equal(url.origin, 'https://www.googleapis.com');
    assert.equal(url.pathname, '/youtube/v3/channels');
    assert.equal(url.searchParams.get('mine'), 'true');
    assert.equal(url.searchParams.get('key'), config.apiKey);
    assert.equal(headers.Authorization, 'Bearer access-token');
    assert.equal(channel.title, 'Fieldnotes');
    assert.equal(channel.subscribers, 42);
    assert.equal(channel.totalViews, 1200);
    assert.equal(channel.videoCount, 7);
    assert.equal(channel.uploadsPlaylistId, 'uploads-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('uses Analytics reports and maps metrics for all uploaded videos', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (target, options) => {
    const url = new URL(target);
    calls.push({ url, options });
    if (url.pathname === '/v2/reports') {
      return {
        ok: true,
        json: async () => ({
          columnHeaders: [
            { name: 'day' },
            { name: 'views' },
            { name: 'likes' },
            { name: 'comments' },
            { name: 'subscribersGained' },
            { name: 'subscribersLost' },
            { name: 'estimatedMinutesWatched' },
            { name: 'averageViewDuration' },
          ],
          rows: [['20261123', 100, 8, 2, 3, 1, 150, 90]],
        }),
      };
    }

    if (url.pathname.endsWith('/playlistItems') && !url.searchParams.has('pageToken')) {
      return {
        ok: true,
        json: async () => ({
          items: [{
            contentDetails: { videoId: 'video-1', videoPublishedAt: '2026-11-23T12:00:00Z' },
            snippet: { publishedAt: '2026-11-23T12:00:00Z' },
          }],
          nextPageToken: 'older-videos',
        }),
      };
    }

    if (url.pathname.endsWith('/playlistItems')) {
      return {
        ok: true,
        json: async () => ({
          items: [{
            contentDetails: { videoId: 'old-video', videoPublishedAt: '2012-01-01T12:00:00Z' },
            snippet: { publishedAt: '2012-01-01T12:00:00Z' },
          }],
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({
        items: url.searchParams.get('id').split(',').map((id) => ({
          id,
          snippet: {
            title: id === 'old-video' ? 'Old video' : 'A real video',
            publishedAt: id === 'old-video'
              ? '2012-01-01T12:00:00Z'
              : '2026-11-23T12:00:00Z',
          },
          statistics: { viewCount: '100', likeCount: '8', commentCount: '2' },
        })),
      }),
    };
  };

  try {
    const report = await getChannelAnalytics(config, 'access-token', '2026-11-23', '2026-11-23');
    const videos = await getVideos(config, 'access-token', 'uploads-1');
    const data = buildDashboardData({
      channel: {
        id: 'channel-1',
        title: 'Fieldnotes',
        subscribers: 42,
        totalViews: 1200,
        videoCount: 7,
      },
      videos,
      report,
    });

    assert.equal(calls[0].url.origin, 'https://youtubeanalytics.googleapis.com');
    assert.equal(calls[0].options.cache, 'no-store');
    assert.equal(calls[0].url.searchParams.get('ids'), 'channel==MINE');
    assert.ok(calls[0].url.searchParams.get('metrics').includes('subscribersGained'));
    assert.equal(calls[0].options.headers.Authorization, 'Bearer access-token');
    assert.equal(calls[1].url.searchParams.get('key'), config.apiKey);
    assert.equal(calls[1].options.cache, 'no-store');
    assert.equal(calls[1].url.searchParams.get('pageToken'), null);
    assert.equal(calls[2].url.searchParams.get('pageToken'), 'older-videos');
    assert.equal(calls[3].options.cache, 'no-store');
    assert.equal(calls[3].url.pathname, '/youtube/v3/videos');
    assert.equal(calls[3].url.searchParams.get('part'), 'snippet,statistics');
    assert.equal(calls.some(({ url }) => url.pathname.endsWith('/commentThreads')), false);
    assert.ok(calls.some(({ url }) => (url.searchParams.get('id') || '').includes('old-video')));
    assert.deepEqual(data.subscribers, [{ date: '2026-11-23', subscribers: 2 }]);
    assert.deepEqual(data.engagement, [{ date: '2026-11-23', likes: 8, comments: 2 }]);
    assert.equal(data.reach, 150);
    assert.equal(data.overview.find((metric) => metric.id === 'likes').value, 8);
    assert.equal(data.overview.find((metric) => metric.id === 'comments').value, 2);
    assert.equal(data.posts[0].views, 100);
    assert.equal(data.posts[0].likes, 8);
    assert.equal(data.posts[0].comments, 2);
    assert.ok(data.posts.some((video) => video.id === 'old-video' && video.date === '2012-01-01'));
    assert.equal(data.overview.find((metric) => metric.id === 'channel_views').value, 1200);
    assert.equal(data.analyticsThroughDate, '2026-11-23');
    assert.equal(data.analyticsCheckedAt, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not substitute lifetime video counts when the Analytics API is unavailable', () => {
  const data = buildDashboardData({
    channel: { id: 'channel-1', title: 'Fieldnotes', subscribers: 42, totalViews: 1200, videoCount: 1 },
    videos: [{
      id: 'video-1',
      title: 'A real video',
      platform: 'YouTube',
      date: '2026-11-23',
      views: 100,
      likes: 14,
      comments: 3,
      interactions: 17,
    }],
    report: null,
    analyticsError: 'Analytics unavailable',
  });

  assert.equal(data.overview.find((metric) => metric.id === 'likes').value, null);
  assert.equal(data.overview.find((metric) => metric.id === 'comments').value, null);
  assert.equal(data.reach, null);
  assert.deepEqual(data.engagement, []);
  assert.equal(data.analyticsError, 'Analytics unavailable');
});

test('does not report hidden channel subscribers or unavailable video interactions as zero', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      items: [{
        id: 'channel-1',
        snippet: { title: 'Fieldnotes' },
        statistics: { hiddenSubscriberCount: true },
      }],
    }),
  });

  try {
    const channel = await getChannel(config, 'access-token');
    const data = buildDashboardData({
      channel,
      videos: [{
        id: 'video-1',
        title: 'Video',
        platform: 'YouTube',
        date: '2026-11-23',
        views: null,
        likes: null,
        comments: null,
        interactions: null,
      }],
      report: { columnHeaders: [], rows: [] },
    });

    assert.equal(channel.subscribers, null);
    assert.equal(channel.totalViews, null);
    assert.equal(data.overview[0].value, null);
    assert.equal(data.posts[0].interactions, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('encrypts tokens and rejects tampered ciphertext', () => {
  const key = randomBytes(32);
  const tokenData = { accessToken: 'secret-token', refreshToken: 'refresh-token' };
  const encrypted = encryptStore(tokenData, key);

  assert.equal(encrypted.includes('secret-token'), false);
  assert.deepEqual(decryptStore(encrypted, key), tokenData);
  assert.throws(() => decryptStore(encrypted, randomBytes(32)));
});

test('accepts a 32-byte encryption key encoded in hex or base64 only', () => {
  const bytes = randomBytes(32);

  assert.deepEqual(getEncryptionKey(bytes.toString('hex')), bytes);
  assert.deepEqual(getEncryptionKey(bytes.toString('base64')), bytes);
  assert.throws(() => getEncryptionKey('not-a-key'), /32 random bytes/);
});

test('allows only exact explicitly configured frontend origins', () => {
  const makeRequest = (origin, host = '127.0.0.1:3001') => ({
    secure: false,
    get(name) {
      if (name === 'origin') return origin;
      if (name === 'host') return host;
      return undefined;
    },
  });

  assert.equal(matchesOrigin(makeRequest('http://localhost:5173'), ['http://localhost:5173']), true);
  assert.equal(matchesOrigin(makeRequest('https://attacker.example'), ['http://localhost:5173']), false);
  assert.equal(matchesOrigin(makeRequest('http://localhost:5173')), false);
  assert.equal(matchesOrigin(makeRequest('http://127.0.0.1:3001', '127.0.0.1:3001'), []), false);
  assert.equal(matchesOrigin(makeRequest('http://localhost:5173/'), ['http://localhost:5173']), false);
});

test('recognizes only loopback client addresses for credential setup', () => {
  assert.equal(isLoopbackAddress('127.0.0.1'), true);
  assert.equal(isLoopbackAddress('127.22.1.5'), true);
  assert.equal(isLoopbackAddress('::1'), true);
  assert.equal(isLoopbackAddress('::ffff:127.0.0.1'), true);
  assert.equal(isLoopbackAddress('192.168.1.20'), false);
  assert.equal(isLoopbackAddress(''), false);
});
