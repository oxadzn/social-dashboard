import { useEffect, useState } from 'react';

/**
 * Shared data-fetching logic. This is what a "mixin" would have been in old React;
 * today the equivalent is a custom hook.
 *
 * useEffect here plays the role of the class lifecycle methods:
 *   - runs on mount            -> componentDidMount
 *   - re-runs when deps change -> componentDidUpdate
 *   - cleanup function         -> componentWillUnmount
 */
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false; // avoid setting state after unmount / stale responses
    setLoading(true);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
          setUpdatedAt(Date.now());
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, updatedAt };
}
