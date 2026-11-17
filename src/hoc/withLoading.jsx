// Higher-order component: another "mixin replacement".
// Wrap any widget and it gets loading + error states for free.
//
//   const ChartWithLoading = withLoading(LineChartWidget);
//   <ChartWithLoading loading={loading} error={error} data={data} ... />
export default function withLoading(Wrapped) {
  return function WithLoading({ loading, error, ...props }) {
    if (loading) return <div className="state state--loading">Loading…</div>;
    if (error) return <div className="state state--error">Couldn’t load data. Check your connection and try again.</div>;
    return <Wrapped {...props} />;
  };
}
