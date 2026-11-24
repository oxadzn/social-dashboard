import { useEffect, useState } from 'react';

export default function YouTubeConnection({
  status,
  loading,
  error,
  dataError,
  onRetry,
  onDisconnect,
}) {
  const [message, setMessage] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('youtube');
    if (result === 'connected') setMessage('YouTube connected.');
    if (result === 'denied') setMessage('Google authorization was cancelled.');
    if (result === 'error') setMessage('YouTube authorization failed. Check Google Cloud settings and try again.');
    if (result) {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    }
  }, []);

  const disconnect = async () => {
    setDisconnecting(true);
    setMessage('');
    try {
      await onDisconnect();
      setMessage('YouTube disconnected.');
    } catch (caught) {
      setMessage(caught.response?.data?.error || 'YouTube could not be disconnected.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return <div className="social-connection"><span className="social-message">Checking YouTube…</span></div>;
  }

  if (error) {
    return (
      <div className="social-connection">
        <button className="social-button" type="button" onClick={onRetry}>Retry YouTube</button>
        <span className="social-message social-message--error">YouTube service is unavailable.</span>
      </div>
    );
  }

  if (status?.authenticated && status?.connected) {
    return (
      <div className="social-connection">
        {status.account?.thumbnail && (
          <img className="social-avatar" src={status.account.thumbnail} alt="" />
        )}
        <span className="social-account">{status.account?.title || 'YouTube channel'}</span>
        <button className="social-button" type="button" onClick={disconnect} disabled={disconnecting}>
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
        {(dataError || message) && (
          <span className={`social-message${dataError ? ' social-message--error' : ''}`} role="status">
            {dataError || message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="social-connection">
      {status?.configured
        ? <a className="social-button" href="/api/youtube/connect">Connect YouTube</a>
        : <button className="social-button" type="button" disabled>Connect YouTube</button>}
      {!status?.configured && (
        <span className="social-message">Add YouTube credentials to .env to enable.</span>
      )}
      {message && <span className="social-message" role="status">{message}</span>}
    </div>
  );
}
