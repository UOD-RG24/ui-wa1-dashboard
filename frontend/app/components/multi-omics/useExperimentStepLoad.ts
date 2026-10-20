import { useEffect, useRef } from "react";

/** Run load once per experimentId; avoids refetch loops from unstable callback deps. */
export function useExperimentStepLoad(experimentId: string, load: () => Promise<void>) {
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    void loadRef.current();
  }, [experimentId]);
}

/** Keep latest callback without putting it in useCallback deps. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
