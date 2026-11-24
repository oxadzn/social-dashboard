import axios from 'axios';

// All requests go through one axios instance.
// Right now it hits static JSON in /public/api. To use a real backend later,
// change baseURL (and drop the ".json" suffixes below).
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
});

// TODO: add a response interceptor for global error handling / logging

// `params` (start/end dates) are sent as a query string. Static JSON ignores them,
// so filtering by date range happens on the client for now (see utils/dates.js).
export const getOverview   = (params) => client.get('/overview.json',   { params }).then((r) => r.data);
export const getEngagement = (params) => client.get('/engagement.json', { params }).then((r) => r.data);
export const getFollowers  = (params) => client.get('/followers.json',  { params }).then((r) => r.data);
export const getPosts      = (params) => client.get('/posts.json',      { params }).then((r) => r.data);
export const getSchedule   = (params) => client.get('/schedule.json',   { params }).then((r) => r.data);
export const getPlatforms  = () => client.get('/platforms.json').then((r) => r.data);
export const getYouTubeStatus = () => client.get('/youtube/status').then((r) => r.data);
export const getYouTubeDashboard = (range) =>
  client.get('/youtube/dashboard', { params: range }).then((r) => r.data);
export const disconnectYouTube = () =>
  client.post('/youtube/disconnect').then((r) => r.data);
