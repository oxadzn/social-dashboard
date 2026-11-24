import { useEffect, useState } from 'react';
import { configureYouTube } from '../../api/client';

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
  const [showCredentials, setShowCredentials] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [credentials, setCredentials] = useState({ apiKey: '', clientId: '', clientSecret: '' });
  const redirectUri = `${window.location.origin}/api/youtube/callback`;

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

  const saveCredentials = async (event) => {
    event.preventDefault();
    setSavingCredentials(true);
    setMessage('');
    try {
      await configureYouTube(credentials);
      setCredentials({ apiKey: '', clientId: '', clientSecret: '' });
      window.location.assign('/api/youtube/connect');
    } catch (caught) {
      setMessage(caught.response?.data?.error || 'Credentials could not be saved.');
      setSavingCredentials(false);
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

  const credentialForm = showCredentials && (
    <div className="youtube-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !savingCredentials) setShowCredentials(false);
    }}>
      <form className="youtube-credentials" onSubmit={saveCredentials} role="dialog" aria-modal="true" aria-label="YouTube credentials">
        <h2>Connect YouTube</h2>
        <p>Credentials are encrypted and saved on this server.</p>
        <label>
          YouTube Data API key
          <input
            type="password"
            autoComplete="off"
            required
            value={credentials.apiKey}
            onChange={(event) => setCredentials({ ...credentials, apiKey: event.target.value })}
          />
        </label>
        <label>
          Google OAuth client ID
          <input
            autoComplete="off"
            required
            value={credentials.clientId}
            onChange={(event) => setCredentials({ ...credentials, clientId: event.target.value })}
          />
        </label>
        <label>
          Google OAuth client secret
          <input
            type="password"
            autoComplete="new-password"
            required
            value={credentials.clientSecret}
            onChange={(event) => setCredentials({ ...credentials, clientSecret: event.target.value })}
          />
        </label>
        <div className="youtube-redirect">
          <span>Authorized redirect URI</span>
          <code>{redirectUri}</code>
          <span>Add this exact URI to your Google OAuth web client.</span>
        </div>
        {message && <span className="social-message social-message--error" role="alert">{message}</span>}
        {!status?.encryptionKeyReady && (
          <span className="social-message social-message--error" role="alert">
            Set YOUTUBE_TOKEN_ENCRYPTION_KEY in .env before saving credentials.
          </span>
        )}
        <div className="youtube-credentials__actions">
          <button className="social-button" type="button" onClick={() => setShowCredentials(false)} disabled={savingCredentials}>Cancel</button>
          <button className="social-button" type="submit" disabled={savingCredentials || !status?.encryptionKeyReady}>
            {savingCredentials ? 'Saving…' : 'Save and connect'}
          </button>
        </div>
      </form>
    </div>
  );

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
        <button className="social-button" type="button" onClick={() => setShowCredentials(true)}>Change credentials</button>
        {(dataError || message) && (
          <span className={`social-message${dataError ? ' social-message--error' : ''}`} role="status">
            {dataError || message}
          </span>
        )}
        {credentialForm}
      </div>
    );
  }

  return (
    <div className="social-connection">
      {status?.configured
        ? <>
          <a className="social-button" href="/api/youtube/connect">Connect YouTube</a>
          <button className="social-button" type="button" onClick={() => setShowCredentials(true)}>Change credentials</button>
        </>
        : <button className="social-button" type="button" onClick={() => setShowCredentials(true)}>Connect YouTube</button>}
      {message && <span className="social-message" role="status">{message}</span>}
      {credentialForm}
    </div>
  );
}
