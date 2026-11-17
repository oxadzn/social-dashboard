import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import withLoading from '../../hoc/withLoading';

// Generic bar chart. Props: title, data, xKey, bars = [{ key, color }]
function BarChartWidget({ title, data, xKey, bars }) {
  return (
    <div className="card">
      <h3 className="card__title">{title}</h3>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {bars.map((b) => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default withLoading(BarChartWidget);
