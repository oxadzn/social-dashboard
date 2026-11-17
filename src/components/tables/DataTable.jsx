import withLoading from '../../hoc/withLoading';

// Generic table. Props:
//   title, rows, columns = [{ key: 'title', label: 'Post' }, ...]
// TODO: click a header to sort; add pagination
function DataTable({ title, rows, columns }) {
  return (
    <div className="card">
      <h3 className="card__title">{title}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="state">No posts in this date range.</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => <td key={c.key}>{row[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withLoading(DataTable);
