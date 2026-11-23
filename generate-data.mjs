import { writeFileSync } from 'fs';

const start = new Date('2026-08-25');
const DOW_MULT = [0.78, 0.88, 1.08, 1.12, 1.10, 0.90, 0.72];

function rnd(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

const followers = [];
const engagement = [];
let fc = 21650;

for (let i = 0; i < 90; i++) {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  const date = d.toISOString().slice(0, 10);
  const dow = d.getDay();
  const m = DOW_MULT[dow];

  fc += rnd(28, 42);
  followers.push({ date, followers: fc });

  const baseL = 850 + i * 7.2;
  const baseC = 148 + i * 1.3;
  const baseS = 68 + i * 0.9;

  engagement.push({
    date,
    likes: Math.max(500, Math.round(baseL * m + rnd(-35, 35))),
    comments: Math.max(80, Math.round(baseC * m + rnd(-15, 15))),
    shares: Math.max(38, Math.round(baseS * m + rnd(-10, 10))),
  });
}

const platforms = ['Instagram', 'YouTube', 'X', 'LinkedIn', 'TikTok'];
const titles = [
  'Behind the scenes: launch week',
  '5 tips for better thumbnails',
  'Poll: which feature next?',
  'Customer story: Priya\'s studio',
  'How we grew to 20k followers',
  'New product sneak peek',
  'Team spotlight: meet the designers',
  'Weekly recap: top moments',
  'Q3 results and what\'s next',
  'Tutorial: setting up your profile',
  'Community shoutout Sunday',
  'Collab announcement',
  'Ask me anything — your questions',
  'Product update v2.1',
  'Case study: doubling reach in 30 days',
  'Trend watch: autumn aesthetics',
  'Reader mail: best comments this week',
  'Workflow tour — how we plan content',
  'Milestone: thank you for 24k!',
  'Year in review teaser',
];

const posts = [];
for (let i = 0; i < 20; i++) {
  const offset = rnd(0, 89);
  const d = new Date(start);
  d.setDate(start.getDate() + offset);
  const date = d.toISOString().slice(0, 10);
  const platform = platforms[i % platforms.length];
  const baseL = 600 + offset * 6;
  posts.push({
    id: i + 1,
    title: titles[i],
    platform,
    likes: rnd(baseL - 200, baseL + 300),
    comments: rnd(50, 220),
    shares: rnd(20, 150),
    date,
  });
}
posts.sort((a, b) => a.date.localeCompare(b.date));

const scheduleBase = new Date('2026-11-23');
const schedule = [
  { id: 101, title: 'Weekly tips reel', platform: 'Instagram', datetime: '2026-11-24T10:00:00' },
  { id: 102, title: 'Product update thread', platform: 'X', datetime: '2026-11-24T15:30:00' },
  { id: 103, title: 'Founder AMA teaser', platform: 'LinkedIn', datetime: '2026-11-26T09:00:00' },
  { id: 104, title: 'Behind-the-scenes clip', platform: 'TikTok', datetime: '2026-11-27T18:00:00' },
  { id: 105, title: 'Monthly recap video', platform: 'YouTube', datetime: '2026-11-28T12:00:00' },
  { id: 106, title: 'Community poll', platform: 'Instagram', datetime: '2026-11-29T11:00:00' },
  { id: 107, title: 'December preview post', platform: 'LinkedIn', datetime: '2026-11-30T09:30:00' },
  { id: 108, title: 'Tutorial short', platform: 'TikTok', datetime: '2026-12-01T17:00:00' },
  { id: 109, title: 'Subscriber milestone reel', platform: 'YouTube', datetime: '2026-12-02T14:00:00' },
  { id: 110, title: 'Week 1 highlights', platform: 'Instagram', datetime: '2026-12-05T10:00:00' },
];

const overview = [
  { id: 'followers', label: 'Total followers', value: fc, change: 3.2 },
  { id: 'impressions', label: 'Impressions', value: 183400, change: 7.8 },
  { id: 'likes', label: 'Total likes', value: 18920, change: 5.1 },
  { id: 'comments', label: 'Comments', value: 3104, change: -1.4 },
  { id: 'shares', label: 'Shares', value: 2642, change: 8.7 },
  { id: 'eng_rate', label: 'Eng. rate', value: 4.2, change: 0.3, suffix: '%' },
];

const platforms_dist = [
  { platform: 'Instagram', posts: 48, reach: 68400 },
  { platform: 'YouTube', posts: 22, reach: 54200 },
  { platform: 'TikTok', posts: 36, reach: 39800 },
  { platform: 'LinkedIn', posts: 18, reach: 12600 },
  { platform: 'X', posts: 31, reach: 8400 },
];

writeFileSync('public/api/followers.json', JSON.stringify(followers, null, 2));
writeFileSync('public/api/engagement.json', JSON.stringify(engagement, null, 2));
writeFileSync('public/api/posts.json', JSON.stringify(posts, null, 2));
writeFileSync('public/api/schedule.json', JSON.stringify(schedule, null, 2));
writeFileSync('public/api/overview.json', JSON.stringify(overview, null, 2));
writeFileSync('public/api/platforms.json', JSON.stringify(platforms_dist, null, 2));

console.log('Data generated. Final follower count:', fc);
