const navigation = [
  { label: 'Overview', href: '#overview' },
  { label: 'Content', href: '#content' },
  { label: 'Audience', href: '#audience' },
  { label: 'Schedule', href: '#schedule' },
];

export default function DashboardLayout({ title, actions, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Fieldnotes home">
          <span>fieldnotes<span className="brand__dot">.</span></span>
        </a>
        <nav className="sidebar-nav" aria-label="Dashboard sections">
          {navigation.map((item, index) => (
            <a className={`sidebar-nav__link${index === 0 ? ' is-active' : ''}`} href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="main-content" id="overview">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
          </div>
          <div className="page-actions">{actions}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
