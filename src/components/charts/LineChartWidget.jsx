import { format, parseISO } from 'date-fns';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import withLoading from '../../hoc/withLoading';

function LineChartWidget({ title, data, xKey, lines }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {data.length === 0 ? <div className="chart-empty">There’s not enough data in this date range yet.</div> : (
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
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
              <YAxis tick={{ fill: '#8a8b81', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} width={48} />
              <Tooltip
                labelFormatter={(value) => format(parseISO(value), 'EEEE, MMMM d')}
                formatter={(value, name) => [Number(value).toLocaleString(), name]}
                contentStyle={{ border: '1px solid #e4e0d5', borderRadius: 8, boxShadow: '0 8px 24px #26281b14', fontSize: 12 }}
              />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name || line.key}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default withLoading(LineChartWidget);
