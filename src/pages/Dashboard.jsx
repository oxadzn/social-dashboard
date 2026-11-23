import useFetch from '../hooks/useFetch';
import useDateRange from '../hooks/useDateRange';
import { filterByRange } from '../utils/dates';
import {
  getEngagement,
  getFollowers,
  getOverview,
  getPlatforms,
  getPosts,
  getSchedule,
} from '../api/client';
import DashboardLayout from '../components/layout/DashboardLayout';
import DateRangePicker from '../components/common/DateRangePicker';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MetricCard from '../components/cards/MetricCard';
import PlatformPerformance from '../components/cards/PlatformPerformance';
import LineChartWidget from '../components/charts/LineChartWidget';
import BarChartWidget from '../components/charts/BarChartWidget';
import DataTable from '../components/tables/DataTable';
import ScheduleCalendar from '../components/calendar/ScheduleCalendar';

export default function Dashboard() {
  const { range, setRange, setPreset, activePreset } = useDateRange(7);
  const deps = [range.start, range.end];
  const overview = useFetch(() => getOverview(range), deps);
  const engagement = useFetch(() => getEngagement(range), deps);
  const followers = useFetch(() => getFollowers(range), deps);
  const posts = useFetch(() => getPosts(range), deps);
  const schedule = useFetch(() => getSchedule(range), []);
  const platforms = useFetch(getPlatforms, []);

  const filteredPosts = filterByRange(posts.data, 'date', range);
  const visibleFollowers = filterByRange(followers.data, 'date', range);
  const visibleEngagement = filterByRange(engagement.data, 'date', range);

  return (
    <DashboardLayout
      title="Social overview"
      actions={
        <DateRangePicker range={range} onChange={setRange} onPreset={setPreset} activePreset={activePreset} />
      }
    >
      <section className="metrics" aria-label="Key performance metrics">
        {overview.loading && !overview.data
          ? <div className="metric-state">Gathering your latest numbers…</div>
          : overview.error && !overview.data
            ? <div className="metric-state metric-state--error">Your metrics could not be loaded. Please try again.</div>
            : (overview.data || []).map((metric) => <MetricCard key={metric.id} {...metric} />)}
      </section>

      <div className="charts-grid">
        <ErrorBoundary>
          <LineChartWidget
            title="Follower growth"
            loading={followers.loading}
            error={followers.error}
            data={visibleFollowers}
            xKey="date"
            lines={[{ key: 'followers', color: '#66775B', name: 'Followers' }]}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <BarChartWidget
            title="Engagement"
            loading={engagement.loading}
            error={engagement.error}
            data={visibleEngagement}
            xKey="date"
            bars={[
              { key: 'likes', color: '#66775B', name: 'Likes' },
              { key: 'comments', color: '#A57955', name: 'Comments' },
              { key: 'shares', color: '#C8B486', name: 'Shares' },
            ]}
          />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <PlatformPerformance loading={platforms.loading} error={platforms.error} platforms={platforms.data || []} />
      </ErrorBoundary>

      <ErrorBoundary>
        <DataTable loading={posts.loading} error={posts.error} title="Post performance" rows={filteredPosts} platforms={platforms.data || []} />
      </ErrorBoundary>

      <ErrorBoundary>
        <ScheduleCalendar loading={schedule.loading} error={schedule.error} items={schedule.data || []} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
