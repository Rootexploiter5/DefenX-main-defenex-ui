import { useCallback, useEffect, useRef, useState } from "react";

export interface PollState<T> { data: T | null; error: string | null; loading: boolean; refresh: () => void }

/** Fetches immediately, then every `ms`. Keeps last good data on transient errors. */
export function usePoll<T>(fn: () => Promise<T>, ms: number, deps: unknown[] = []): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    run();
    const id = setInterval(run, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, run, ...deps]);

  return { data, error, loading, refresh: run };
}
