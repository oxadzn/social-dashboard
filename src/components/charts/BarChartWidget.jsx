import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import withLoading from '../../hoc/withLoading';

function BarChartWidget({ title, data, xKey, bars }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {data.length === 0 ? <div className="chart-empty">There’s not enough data in this date range yet.</div> : (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: -12 }} barGap={2}>
              <CartesianGrid stroke="#eeece5" vertical={false} />
              <XAxis
                dataKey={xKey}
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                tick={{ fill: '#8a8b81', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={12}
              />
              <YAxis tick={{ fill: '#8a8b81', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} width={42} />
              <Tooltip
                labelFormatter={(value) => format(parseISO(value), 'EEEE, MMMM d')}
                formatter={(value, name) => [Number(value).toLocaleString(), name]}
                contentStyle={{ border: '1px solid #e4e0d5', borderRadius: 8, boxShadow: '0 8px 24px #26281b14', fontSize: 12 }}
              />
              {bars.map((bar) => (
                <Bar key={bar.key} dataKey={bar.key} name={bar.name || bar.key} fill={bar.color} radius={[3, 3, 0, 0]} maxBarSize={10} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="chart-legend">
        {bars.map((bar) => <span key={bar.key}><i style={{ backgroundColor: bar.color }} />{bar.name || bar.key}</span>)}
      </div>
    </section>
  );
}

export default withLoading(BarChartWidget);
