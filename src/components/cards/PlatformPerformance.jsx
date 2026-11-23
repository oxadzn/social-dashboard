import withLoading from '../../hoc/withLoading';

const colors = ['#65785a', '#b48a63', '#c4a86d', '#8e9b7e', '#a8a294'];

function PlatformPerformance({ platforms = [] }) {
  const maxReach = Math.max(...platforms.map((item) => item.reach), 1);

  return (
    <section className="panel platform-panel" id="audience">
      <div className="panel-heading">
        <h2>Platform reach</h2>
      </div>
      <div className="platform-list">
        {platforms.map((item, index) => (
          <div className="platform-row" key={item.platform}>
            <div className="platform-row__details">
              <div className="platform-row__top">
                <strong>{item.platform}</strong>
                <span>{Number(item.reach).toLocaleString()}</span>
              </div>
              <div className="platform-track">
                <span style={{ width: `${(item.reach / maxReach) * 100}%`, backgroundColor: colors[index % colors.length] }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default withLoading(PlatformPerformance);
