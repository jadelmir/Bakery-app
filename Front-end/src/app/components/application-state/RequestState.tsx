import * as React from "react";

import { Button } from "../ui/button";

export type ConnectivityEvidence = "browser-offline" | "adapter-connection-failure";
export type RetryAction = () => void | Promise<void>;

export type RequestState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "ready" }
  | { status: "empty"; title?: string; message?: string }
  | { status: "error"; title?: string; message?: string; retry?: RetryAction }
  | {
      status: "offline";
      connectivity: ConnectivityEvidence;
      title?: string;
      message?: string;
      retry?: RetryAction;
    };

type PresentationProps = {
  title?: string;
  message?: string;
  retry?: RetryAction;
};

function RetryButton({ retry }: { retry: RetryAction }) {
  const [retrying, setRetrying] = React.useState(false);
  const onClick = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };
  return <Button type="button" onClick={onClick} disabled={retrying}>{retrying ? "Retrying…" : "Retry"}</Button>;
}

export function PendingState({ message = "Loading…" }: { message?: string }) {
  return <section role="status" aria-live="polite" aria-label="Loading"><p>{message}</p></section>;
}

export function EmptyState({ title = "Nothing here yet", message }: Omit<PresentationProps, "retry">) {
  return <section role="status" aria-live="polite"><h2>{title}</h2>{message && <p>{message}</p>}</section>;
}

export function ErrorState({ title = "We couldn't load this", message = "Please try again.", retry }: PresentationProps) {
  return <section role="alert" aria-live="assertive"><h2>{title}</h2><p>{message}</p>{retry && <RetryButton retry={retry} />}</section>;
}

/** This component is only reachable from an explicit offline request outcome. */
export function OfflineState({ title = "Connection lost", message = "Check your connection and try again.", retry }: PresentationProps) {
  return <section role="alert" aria-live="assertive"><h2>{title}</h2><p>{message}</p>{retry && <RetryButton retry={retry} />}</section>;
}

export function IdleState({ message = "Ready to load." }: { message?: string }) {
  return <section role="status" aria-live="polite"><p>{message}</p></section>;
}

export function RequestStateView({ state, children }: { state: RequestState; children: React.ReactNode }) {
  switch (state.status) {
    case "idle":
      return <IdleState message={state.message} />;
    case "loading":
      return <PendingState message={state.message} />;
    case "empty":
      return <EmptyState title={state.title} message={state.message} />;
    case "error":
      return <ErrorState title={state.title} message={state.message} retry={state.retry} />;
    case "offline":
      return <OfflineState title={state.title} message={state.message} retry={state.retry} />;
    case "ready":
      return <>{children}</>;
  }
}
