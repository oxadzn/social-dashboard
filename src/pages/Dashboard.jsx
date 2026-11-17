import useFetch from '../hooks/useFetch';
import useDateRange from '../hooks/useDateRange';
import { filterByRange } from '../utils/dates';
import { getEngagement, getFollowers, getOverview, getPosts, getSchedule } from '../api/client';

import DashboardLayout from '../components/layout/DashboardLayout';
import DateRangePicker from '../components/common/DateRangePicker';
import LastUpdated from '../components/common/LastUpdated';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MetricCard from '../components/cards/MetricCard';
import LineChartWidget from '../components/charts/LineChartWidget';
import BarChartWidget from '../components/charts/BarChartWidget';
import DataTable from '../components/tables/DataTable';
import ScheduleCalendar from '../components/calendar/ScheduleCalendar';

const POST_COLUMNS = [
  { key: 'title', label: 'Post' },
  { key: 'platform', label: 'Platform' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
];

export default function Dashboard() {
  const { range, setRange } = useDateRange(7);

  // Re-fetch whenever the date range changes (the deps array).
  const deps = [range.start, range.end];
  const overview   = useFetch(() => getOverview(range), deps);
  const engagement = useFetch(() => getEngagement(range), deps);
  const followers  = useFetch(() => getFollowers(range), deps);
  const posts      = useFetch(() => getPosts(range), deps);
  const schedule   = useFetch(() => getSchedule(range), []);

  return (
    <DashboardLayout
      title="Social dashboard"
      actions={
        <>
          <LastUpdated stamp={engagement.updatedAt} />
          <DateRangePicker range={range} onChange={setRange} />
        </>
      }
    >
      {/* Metric cards */}
      <section className="metrics">
        {(overview.data || []).map((m) => (
          <MetricCard key={m.id} {...m} />
        ))}
        {/* TODO: loading/error state for the cards (wrap in withLoading too) */}
      </section>

      {/* Charts */}
      <ErrorBoundary>
        <LineChartWidget
          title="Follower growth"
          loading={followers.loading} error={followers.error}
          data={filterByRange(followers.data, 'date', range)}
          xKey="date"
          lines={[{ key: 'followers', color: '#3d5afe' }]}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <BarChartWidget
          title="Engagement"
          loading={engagement.loading} error={engagement.error}
          data={filterByRange(engagement.data, 'date', range)}
          xKey="date"
          bars={[
            { key: 'likes', color: '#3d5afe' },
            { key: 'comments', color: '#00a88f' },
            { key: 'shares', color: '#f5a524' },
          ]}
        />
      </ErrorBoundary>

      {/* Table + calendar */}
      <ErrorBoundary>
        <DataTable
          title="Post performance"
          loading={posts.loading} error={posts.error}
          rows={filterByRange(posts.data, 'date', range)}
          columns={POST_COLUMNS}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <ScheduleCalendar loading={schedule.loading} error={schedule.error} items={schedule.data || []} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
