import { useEffect, useState, type DependencyList } from 'react';

export function useRemote<T>(loader: (signal: AbortSignal) => Promise<T>, dependencies: DependencyList) {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify(dependencies) + ':' + revision;
  const [state, setState] = useState<{key: string; data: T | null; error: unknown; loading: boolean}>({key: '', data: null, error: null, loading: true});
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({key, data: null, error: null, loading: true});
    loader(controller.signal).then(data => {
      if (active) setState({key, data, error: null, loading: false});
    }).catch(error => {
      if (active && error?.name !== 'AbortError') setState({key, data: null, error, loading: false});
    });
    return () => { active = false; controller.abort(); };
  }, [key]);
  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : null,
    loading: state.key !== key || state.loading,
    reload: () => setRevision(value => value + 1),
  };
}
