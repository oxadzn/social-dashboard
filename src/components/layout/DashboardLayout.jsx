// Page shell: header slot + responsive content area.
export default function DashboardLayout({ title, actions, children }) {
  return (
    <div className="shell">
      <header className="shell__header">
        <h1>{title}</h1>
        <div className="shell__actions">{actions}</div>
      </header>
      <main className="grid">{children}</main>
    </div>
  );
}
