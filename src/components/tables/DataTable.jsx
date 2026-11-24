import { useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import withLoading from '../../hoc/withLoading';

const PAGE_SIZE = 5;

function DataTable({ title, rows = [], platforms = [] }) {
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
  const [platform, setPlatform] = useState('All platforms');
  const [page, setPage] = useState(0);

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => platform === 'All platforms' || row.platform === platform);
    return filtered.sort((a, b) => {
      const left = a[sort.key] ?? '';
      const right = b[sort.key] ?? '';
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right));
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [rows, platform, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const columns = [
    { key: 'title', label: 'Post', className: 'post-title-cell' },
    { key: 'platform', label: 'Platform' },
    { key: 'date', label: 'Published' },
    { key: 'views', label: 'Views', numeric: true },
    { key: 'likes', label: 'Likes', numeric: true },
    { key: 'comments', label: 'Comments', numeric: true },
    { key: 'shares', label: 'Shares', numeric: true },
    { key: 'interactions', label: 'Interactions', numeric: true },
  ];

  const sortBy = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  };

  const renderCell = (row, key) => {
    if (key === 'date') {
      const date = row.date ? parseISO(row.date) : null;
      return date && isValid(date) ? format(date, 'MMM d, yyyy') : '—';
    }
    if (key === 'interactions') {
      const interactions = row.interactions === undefined
        ? Number(row.likes || 0) + Number(row.comments || 0) + Number(row.shares || 0)
        : row.interactions;
      return interactions === null ? '—' : Number(interactions).toLocaleString();
    }
    if (['views', 'likes', 'comments', 'shares'].includes(key)) {
      return row[key] === null || row[key] === undefined ? '—' : Number(row[key]).toLocaleString();
    }
    if (key === 'platform') return row.platform;
    return row[key];
  };

  return (
    <section className="panel table-panel" id="content">
      <div className="panel-heading panel-heading--table">
        <h2>{title}</h2>
        <label className="select-wrap">
          <span className="sr-only">Filter by platform</span>
          <select
            value={platform}
            onChange={(event) => {
              setPlatform(event.target.value);
              setPage(0);
            }}
          >
            <option>All platforms</option>
            {platforms.map((item) => {
              const name = typeof item === 'string' ? item : item.platform;
              return <option key={name}>{name}</option>;
            })}
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table className="performance-table">
          <thead>
            <tr>{columns.map((column) => (
              <th className={column.numeric ? 'is-numeric' : ''} key={column.key} scope="col">
                <button className="sort-button" type="button" onClick={() => sortBy(column.key)}>
                  {column.label}
                  <span className="sort-mark" aria-hidden="true">
                    {sort.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </button>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr><td colSpan={columns.length} className="table-empty">No posts found for this selection.</td></tr>
            ) : visibleRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td className={`${column.numeric ? 'is-numeric' : ''} ${column.className || ''}`} key={column.key}>
                    {renderCell(row, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          Showing <strong>{filteredRows.length ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong> posts
        </span>
        <div className="pagination">
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Previous page">‹</button>
          <span>{page + 1} <span className="pagination__of">/ {pageCount}</span></span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} aria-label="Next page">›</button>
        </div>
      </div>
    </section>
  );
}

export default withLoading(DataTable);
