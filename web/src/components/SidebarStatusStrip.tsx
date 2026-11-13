import { Link } from "react-router";
import type { StatusResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { en } from "@/i18n/en";

export function gatewayLine(
  status: StatusResponse,
  t: ReturnType<typeof useI18n>["t"],
): { label: string; fullLabel: string; tone: string } {
  const g = t.app.gatewayStrip;

  // Alive but housekeeping stopped stamping the heartbeat: 'Running' would be a lie (upstream v0.21).
  if (status.gateway_heartbeat_stale_s != null) {
    const label = g.heartbeatStale ?? en.app.gatewayStrip.heartbeatStale!;
    return { label, fullLabel: label, tone: "text-destructive" };
  }
  // Live: some channels offline; retained on a dead PID = watchdog hard-exited a wedged process (upstream v0.21).
  if (status.gateway_state === "degraded") {
    const label = g.degraded ?? en.app.gatewayStrip.degraded!;
    return { label, fullLabel: label, tone: status.gateway_running ? "text-warning" : "text-destructive" };
  }

  if (status.gateway_running || status.gateway_state === "running") {
    return { label: g.running, fullLabel: g.running, tone: "text-success" };
  }

  if (status.gateway_state === "starting") {
    return { label: g.starting, fullLabel: g.starting, tone: "text-warning" };
  }
  if (status.gateway_state === "startup_failed") {
    return { label: g.failed, fullLabel: g.failed, tone: "text-destructive" };
  }

  if (status.gateways && status.gateways.length > 0) {
    const count = String(status.gateways.length);
    // Short form (status + count) fits one line in the 256px sidebar; the
    // full "N gateways running" wording is kept for title/aria-label so no
    // information is lost.
    const label = g.runningMultiple.replace("{count}", count);
    const fullLabel = g.runningMultipleFull.replace("{count}", count);
    return { label, fullLabel, tone: "text-success" };
  }

  if (status.gateway_state === "stopped") {
    return { label: g.stopped, fullLabel: g.stopped, tone: "text-muted-foreground" };
  }
  return { label: g.off, fullLabel: g.off, tone: "text-muted-foreground" };
}

export function gatewayCompactText(
  status: StatusResponse,
  t: ReturnType<typeof useI18n>["t"],
): string {
  return `${t.app.gatewayLabel ?? "Gateway:"} ${gatewayLine(status, t).label}`;
}

export function gatewayDotClass(tone: string): string {
  const map: Record<string, string> = {
    "text-success": "bg-success",
    "text-warning": "bg-warning",
    "text-destructive": "bg-destructive",
    "text-muted-foreground": "bg-muted-foreground",
  };
  return map[tone] ?? "bg-muted-foreground";
}

export function SidebarSessionsLine({ status }: { status: StatusResponse | null }) {
  const { t } = useI18n();

  if (status === null) {
    return (
      <div className="px-5 py-1" aria-hidden>
        <div className="h-2 w-[80%] max-w-full animate-pulse rounded-sm bg-midground/10" />
      </div>
    );
  }

  return (
    <Link
      to="/sessions"
      title={t.app.statusOverview}
      className={cn(
        "block text-left",
        "px-5 py-0.5",
        "text-text-secondary",
        "transition-colors hover:text-midground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-midground/40",
        "focus-visible:ring-inset",
      )}
    >
      <div className="flex flex-row flex-wrap gap-x-3 gap-y-0.5 font-sans text-xs leading-snug tracking-[0.08em]">
        <span className="min-w-0">
          <span className="text-text-tertiary">{t.app.activeSessionsLabel}</span>{" "}
          <span className="tabular-nums text-text-secondary">
            {status.active_sessions}
          </span>
        </span>
      </div>
    </Link>
  );
}
