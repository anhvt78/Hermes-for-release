import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { cn } from "@/lib/utils";
import { fetchJSON } from "@/lib/api";
import { useI18n } from "@/i18n";
import { en } from "@/i18n/en";

const POCLIP_PATH = "/hermes-poclip";
const NOTIF_DEST = POCLIP_PATH + "?tab=notifications";
const NOTIF_CHANGED_EVENT = "poclip-notifications-changed";
const POLL_INTERVAL_MS = 30000;

interface Props {
  enabled: boolean;
  className?: string;
}

export function HostNotificationsBell({ enabled, className }: Props) {
  const { t } = useI18n();
  const n = (t.notifications ?? en.notifications)!;
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = () => {
      fetchJSON<{ unread: number }>(
        "/api/plugins/hermes-poclip/api/v1/notifications/count",
      )
        .then((data) => {
          if (!cancelled) {
            setUnread(data.unread);
            setError(false);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);

    const onChanged = () => load();
    window.addEventListener(NOTIF_CHANGED_EVENT, onChanged);

    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(NOTIF_CHANGED_EVENT, onChanged);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;

  const handleClick = () => {
    const inPlugin =
      location.pathname === POCLIP_PATH ||
      location.pathname.startsWith(POCLIP_PATH + "/");
    if (inPlugin) {
      window.location.assign(NOTIF_DEST);
    } else {
      navigate(NOTIF_DEST);
    }
  };

  const ariaLabel = error
    ? n.bellError
    : unread !== null && unread > 0
      ? n.bellAriaLabel.replace("{count}", String(unread))
      : n.bellAriaLabelEmpty;

  return (
    <div className={cn("relative", className)}>
      <Button
        ghost
        size="icon"
        onClick={handleClick}
        aria-label={ariaLabel}
        title={error ? n.bellError : n.bellHint}
        className="text-text-secondary hover:text-midground"
        data-host-notif-bell="true"
        data-host-notif-error={error ? "true" : undefined}
        data-host-notif-unread={
          error ? "unknown" : unread !== null ? String(unread) : undefined
        }
      >
        <Bell className="h-4 w-4" />
      </Button>
      {!error && unread !== null && unread > 0 && (
        <span
          data-host-notif-badge="true"
          className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground"
        >
          {String(unread)}
        </span>
      )}
    </div>
  );
}
