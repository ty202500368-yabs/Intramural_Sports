import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useFetch(path, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path) && enabled);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!path || !enabled) {
      setLoading(false);
      return undefined;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    api
      .get(path)
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive) setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [path, enabled, nonce]);

  return { data, setData, loading, error, reload };
}
