const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
const googleTokenUrl = 'https://oauth2.googleapis.com/token';
const youtubeApiUrl = 'https://www.googleapis.com/youtube';
const analyticsApiUrl = 'https://youtubeanalytics.googleapis.com/v2/reports';
const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

export function getYouTubeConfig(env) {
  const config = {
    apiKey: env.YOUTUBE_API_KEY,
    clientId: env.YOUTUBE_CLIENT_ID,
    clientSecret: env.YOUTUBE_CLIENT_SECRET,
    redirectUri: env.YOUTUBE_REDIRECT_URI,
    apiVersion: env.YOUTUBE_API_VERSION || 'v3',
  };
  return {
    ...config,
    configured: Boolean(
      config.apiKey
      && config.clientId
      && config.clientSecret
      && config.redirectUri,
    ),
  };
}

export function buildAuthorizationUrl(config, state) {
  const url = new URL(googleAuthUrl);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  return url.toString();
}

async function readJsonResponse(response) {
  const body = await response.json();
  if (!response.ok || body.error) {
    const message = body.error?.message
      || body.error_description
      || `Google API returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function exchangeAuthorizationCode(config, code) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  });
  const token = await readJsonResponse(await fetch(googleTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }));
  const expiresIn = Number(token.expires_in);
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : null,
  };
}

export async function refreshAccessToken(config, refreshToken) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const token = await readJsonResponse(await fetch(googleTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }));
  const expiresIn = Number(token.expires_in);
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token || refreshToken,
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : null,
  };
}

async function youtubeRequest(config, accessToken, resource, params = {}) {
  const url = new URL(`${youtubeApiUrl}/${config.apiVersion}/${resource}`);
  url.searchParams.set('key', config.apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return readJsonResponse(await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }));
}

async function analyticsRequest(config, accessToken, params) {
  const url = new URL(analyticsApiUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return readJsonResponse(await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }));
}

export async function getChannel(config, accessToken) {
  const response = await youtubeRequest(config, accessToken, 'channels', {
    part: 'snippet,statistics,contentDetails',
    mine: 'true',
  });
  const channel = response.items?.[0];
  if (!channel) {
    const error = new Error('No YouTube channel was found for this Google account.');
    error.status = 404;
    throw error;
  }

  return {
    id: channel.id,
    title: channel.snippet?.title || 'YouTube channel',
    thumbnail: channel.snippet?.thumbnails?.high?.url
      || channel.snippet?.thumbnails?.medium?.url
      || channel.snippet?.thumbnails?.default?.url
      || null,
    subscribers: channel.statistics?.hiddenSubscriberCount
      ? null
      : Number(channel.statistics?.subscriberCount ?? 0),
    totalViews: channel.statistics?.viewCount === undefined
      ? null
      : Number(channel.statistics.viewCount),
    videoCount: channel.statistics?.videoCount === undefined
      ? null
      : Number(channel.statistics.videoCount),
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
  };
}

export async function getVideos(config, accessToken, playlistId) {
  if (!playlistId) return [];

  const videoIds = [];
  let pageToken;
  let keepReading = true;

  while (keepReading) {
    const page = await youtubeRequest(config, accessToken, 'playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
      ...(pageToken ? { pageToken } : {}),
    });
    const pageItems = page.items || [];
    for (const item of pageItems) {
      const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (id) videoIds.push(id);
    }

    pageToken = page.nextPageToken;
    keepReading = Boolean(pageToken);
  }

  const videos = [];
  for (let index = 0; index < videoIds.length; index += 50) {
    const response = await youtubeRequest(config, accessToken, 'videos', {
      part: 'snippet,statistics',
      id: videoIds.slice(index, index + 50).join(','),
    });
    videos.push(...(response.items || []));
  }

  return videos.map((video) => {
    const publishedAt = video.snippet?.publishedAt;
    const statistics = video.statistics || {};
    const likes = statistics.likeCount === undefined ? null : Number(statistics.likeCount);
    const comments = statistics.commentCount === undefined ? null : Number(statistics.commentCount);
    return {
      id: video.id,
      title: video.snippet?.title || 'Untitled video',
      platform: 'YouTube',
      date: publishedAt?.slice(0, 10),
      views: statistics.viewCount === undefined ? null : Number(statistics.viewCount),
      likes,
      comments,
      shares: null,
      interactions: likes === null || comments === null ? null : likes + comments,
      permalink: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`,
    };
  });
}

export async function getChannelAnalytics(config, accessToken, start, end) {
  return analyticsRequest(config, accessToken, {
    ids: 'channel==MINE',
    startDate: start,
    endDate: end,
    metrics: 'views,likes,comments,subscribersGained,subscribersLost,estimatedMinutesWatched,averageViewDuration',
    dimensions: 'day',
    sort: 'day',
  });
}

function getReportValue(row, indexes, name) {
  const index = indexes[name];
  return index === undefined ? 0 : Number(row[index] || 0);
}

export function buildDashboardData({ channel, videos, report, analyticsError = null }) {
  const analyticsReport = report || { columnHeaders: [], rows: [] };
  const indexes = Object.fromEntries(
    (analyticsReport.columnHeaders || []).map((column, index) => [column.name, index]),
  );
  const rows = (analyticsReport.rows || []).map((row) => {
    const rawDate = String(row[indexes.day] || '');
    const date = /^\d{8}$/.test(rawDate)
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;
    return {
      date,
      views: getReportValue(row, indexes, 'views'),
      likes: getReportValue(row, indexes, 'likes'),
      comments: getReportValue(row, indexes, 'comments'),
      subscribersGained: getReportValue(row, indexes, 'subscribersGained'),
      subscribersLost: getReportValue(row, indexes, 'subscribersLost'),
      estimatedMinutesWatched: getReportValue(row, indexes, 'estimatedMinutesWatched'),
      averageViewDuration: getReportValue(row, indexes, 'averageViewDuration'),
    };
  }).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date));
  const sum = (key) => rows.reduce((total, row) => total + row[key], 0);

  return {
    channel,
    overview: [
      { id: 'subscribers', label: 'Subscribers', value: channel.subscribers },
      { id: 'channel_views', label: 'Channel views', value: channel.totalViews },
      { id: 'video_count', label: 'Videos', value: channel.videoCount },
      { id: 'period_views', label: 'Views', value: sum('views') },
      { id: 'likes', label: 'Likes in range', value: analyticsError ? null : sum('likes') },
      { id: 'comments', label: 'Comments in range', value: analyticsError ? null : sum('comments') },
    ],
    reach: analyticsError ? null : sum('estimatedMinutesWatched'),
    subscribers: rows.map((row) => ({
      date: row.date,
      subscribers: row.subscribersGained - row.subscribersLost,
    })),
    engagement: rows.map((row) => ({
      date: row.date,
      likes: row.likes,
      comments: row.comments,
    })),
    posts: videos,
    analytics: rows,
    analyticsError,
  };
}
