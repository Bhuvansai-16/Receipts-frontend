import { useEffect, useState } from "react";
import { api, ApiError, subscribe, type ReceiptEvent, type RunResponse } from "../api";
import { fromEvents, fromEvidence, type Receipt } from "../receipt";

export interface RunView {
  res: RunResponse | null;
  events: ReceiptEvent[];
  receipt: Receipt | null;
  live: boolean;
  queued: boolean;
  elapsed: number | null;
  missing: boolean;
  error?: string;
}

/** A run: its stored state, then its live events until it finishes (then the stored evidence again). */
export function useRun(runId: string): RunView {
  const [res, setRes] = useState<RunResponse | null>(null);
  const [events, setEvents] = useState<ReceiptEvent[]>([]);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    let stop = () => {};
    setRes(null);
    setEvents([]);
    setMissing(false);
    setError(undefined);
    api
      .run(runId)
      .then((first) => {
        if (!alive) return;
        setRes(first);
        if (first.status !== "queued" && first.status !== "running") return;
        stop = subscribe(runId, (evs) => {
          if (!alive) return;
          setEvents(evs);
          if (evs[evs.length - 1]?.type === "done")
            api.run(runId).then((final) => alive && setRes(final), () => undefined);
        });
      })
      .catch((e: Error) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) setMissing(true);
        else setError(e.message);
      });
    return () => {
      alive = false;
      stop();
    };
  }, [runId]);

  const live = res?.status === "queued" || res?.status === "running";
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);

  const receipt = res ? (live ? fromEvents(events) : fromEvidence(res.evidence)) : null;
  const started = res?.evidence.started_at ? Date.parse(res.evidence.started_at) : NaN;
  return {
    res,
    events,
    receipt,
    live,
    queued: live && !events.some((e) => e.type === "status"),
    elapsed: Number.isNaN(started) ? null : Math.max(0, (now - started) / 1000),
    missing,
    error,
  };
}

/** Open a <details> section of the evidence and jump to it. */
export function reveal(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!(el instanceof HTMLDetailsElement)) return;
  el.open = true;
  // Instant jump: smooth scrolling depends on animation frames, which background tabs throttle to zero.
  el.scrollIntoView({ block: "start" });
  el.querySelector("summary")?.focus({ preventScroll: true });
}
