import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data from an API call with loading / error state and a reload function.
 *   const { data, loading, error, reload } = useApiData(() => service.list(params), [params]);
 * `fetcher` must return the API envelope; `data` is envelope.data, `meta` is envelope.meta.
 */
export default function useApiData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null, errorCode: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, errorCode: null }));
    try {
      const res = await fetcherRef.current();
      setState({ data: res?.data ?? null, meta: res?.meta ?? null, loading: false, error: null, errorCode: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message || 'Request failed', errorCode: err.code || null }));
    }
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}
