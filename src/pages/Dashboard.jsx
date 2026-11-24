import { useEffect, useState } from 'react';
import useFetch from '../hooks/useFetch';
import useDateRange from '../hooks/useDateRange';
import { filterByRange } from '../utils/dates';
import {
  disconnectYouTube,
  getEngagement,
  getFollowers,
  getOverview,
  getYouTubeDashboard,
  getYouTubeStatus,
  getPlatforms,
  getPosts,
  getSchedule,
} from '../api/client';
import DashboardLayout from '../components/layout/DashboardLayout';
import DateRangePicker from '../components/common/DateRangePicker';
import YouTubeConnection from '../components/common/YouTubeConnection';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MetricCard from '../components/cards/MetricCard';
import PlatformPerformance from '../components/cards/PlatformPerformance';
import LineChartWidget from '../components/charts/LineChartWidget';
import BarChartWidget from '../components/charts/BarChartWidget';
import DataTable from '../components/tables/DataTable';
import ScheduleCalendar from '../components/calendar/ScheduleCalendar';

export default function Dashboard() {
  const { range, setRange, setPreset, activePreset } = useDateRange(7);
  const [statusVersion, setStatusVersion] = useState(0);
  const [liveVersion, setLiveVersion] = useState(0);
  const status = useFetch(getYouTubeStatus, [statusVersion]);
  const isLive = Boolean(status.data?.connected && status.data?.authenticated);
  const dateDeps = [isLive, range.start, range.end];
  const overview = useFetch(() => (isLive ? Promise.resolve(null) : getOverview(range)), dateDeps);
  const engagement = useFetch(() => (isLive ? Promise.resolve(null) : getEngagement(range)), dateDeps);
  const followers = useFetch(() => (isLive ? Promise.resolve(null) : getFollowers(range)), dateDeps);
  const posts = useFetch(() => (isLive ? Promise.resolve(null) : getPosts(range)), dateDeps);
  const schedule = useFetch(() => (isLive ? Promise.resolve([]) : getSchedule(range)), [isLive]);
  const platforms = useFetch(() => (isLive ? Promise.resolve([]) : getPlatforms()), [isLive]);
  const live = useFetch(
    () => (isLive ? getYouTubeDashboard(range) : Promise.resolve(null)),
    [...dateDeps, liveVersion],
  );

  useEffect(() => {
    if (!isLive) return undefined;
    const timer = setInterval(() => setLiveVersion((version) => version + 1), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  const liveData = live.data;
  const overviewData = isLive ? liveData?.overview : overview.data;
  const engagementData = isLive ? liveData?.engagement : engagement.data;
  const followersData = isLive ? liveData?.subscribers : followers.data;
  const postsData = isLive ? liveData?.posts : posts.data;
  const platformData = isLive
    ? [{ platform: 'YouTube', reach: liveData?.reach || 0 }]
    : platforms.data || [];
  const visiblePosts = isLive ? postsData : filterByRange(postsData, 'date', range);
  const visibleFollowers = filterByRange(followersData, 'date', range);
  const visibleEngagement = filterByRange(engagementData, 'date', range);
  const analyticsError = live.data?.analyticsError
    ? new Error(live.data.analyticsError)
    : null;
  const dataError = live.error?.response?.data?.error
    || (live.error ? 'YouTube data could not be loaded. Check Google API access and reconnect.' : null);
  const loading = isLive ? live.loading : overview.loading;

  const handleDisconnect = async () => {
    await disconnectYouTube();
    setLiveVersion((version) => version + 1);
    setStatusVersion((version) => version + 1);
  };

  return (
    <DashboardLayout
      title="Social overview"
      isLive={isLive}
      actions={
        <>
          <YouTubeConnection
            status={status.data}
            loading={status.loading}
            error={status.error}
            dataError={dataError}
            onRetry={() => setStatusVersion((version) => version + 1)}
            onDisconnect={handleDisconnect}
          />
          <DateRangePicker range={range} onChange={setRange} onPreset={setPreset} activePreset={activePreset} />
        </>
      }
    >
      <section className="metrics" aria-label="Key performance metrics">
        {loading && !overviewData
          ? <div className="metric-state">Gathering your latest numbers…</div>
          : (isLive ? live.error : overview.error) && !overviewData
            ? <div className="metric-state metric-state--error">Your metrics could not be loaded. Please try again.</div>
            : (overviewData || []).map((metric) => <MetricCard key={metric.id} {...metric} />)}
      </section>

      <div className="charts-grid">
        <ErrorBoundary>
          <LineChartWidget
            title={isLive ? 'Subscriber growth' : 'Follower growth'}
            loading={isLive ? live.loading : followers.loading}
            error={isLive ? live.error || analyticsError : followers.error}
            data={visibleFollowers}
            xKey="date"
            lines={[{
              key: isLive ? 'subscribers' : 'followers',
              color: '#66775B',
              name: isLive ? 'Net subscribers' : 'Followers',
              showDot: isLive,
            }]}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <BarChartWidget
            title={isLive ? 'Post engagement' : 'Engagement'}
            loading={isLive ? live.loading : engagement.loading}
            error={isLive ? live.error || analyticsError : engagement.error}
            data={visibleEngagement}
            xKey="date"
            bars={isLive ? [
              { key: 'likes', color: '#66775B', name: 'Likes' },
              { key: 'comments', color: '#A57955', name: 'Comments' },
            ] : [
              { key: 'likes', color: '#66775B', name: 'Likes' },
              { key: 'comments', color: '#A57955', name: 'Comments' },
              { key: 'shares', color: '#C8B486', name: 'Shares' },
            ]}
          />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <PlatformPerformance
          loading={isLive ? live.loading : platforms.loading}
          error={isLive ? live.error || analyticsError : platforms.error}
          platforms={isLive && analyticsError ? [] : platformData}
          title={isLive ? 'Watch time (minutes)' : undefined}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <DataTable
          loading={isLive ? live.loading : posts.loading}
          error={isLive ? live.error : posts.error}
          title={isLive ? 'Video performance' : 'Post performance'}
          rows={visiblePosts}
          platforms={platformData}
        />
      </ErrorBoundary>

      {!isLive && (
        <ErrorBoundary>
          <ScheduleCalendar loading={schedule.loading} error={schedule.error} items={schedule.data || []} />
        </ErrorBoundary>
      )}
    </DashboardLayout>
  );
}
