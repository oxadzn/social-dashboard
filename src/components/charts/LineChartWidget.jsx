import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import withLoading from '../../hoc/withLoading';

// Generic line chart. Props:
//   title, data, xKey, lines = [{ key: 'followers', color: '#3d5afe' }]
function LineChartWidget({ title, data, xKey, lines }) {
  return (
    <div className="card">
      <h3 className="card__title">{title}</h3>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {lines.map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default withLoading(LineChartWidget);
