import {
  useState,
  useEffect,
  useMemo,
  type ComponentType,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { ChevronDown, Download, RotateCw } from "lucide-react";
import { ConfirmDialog } from "@nous-research/ui/ui/components/confirm-dialog";
import { sharedGatewayProfiles, sharedGatewayRestartDescription } from "@/lib/shared-gateway";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { StatusResponse, UpdateCheckResponse } from "@/lib/api";
import { api } from "@/lib/api";
import { useSystemActions } from "@/contexts/useSystemActions";
import type { SystemAction } from "@/contexts/system-actions-context";
import { gatewayLine, gatewayDotClass, SidebarSessionsLine } from "@/components/SidebarStatusStrip";
import { SidebarFooter } from "@/components/SidebarFooter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { PluginSlot } from "@/plugins";
import { SidebarTooltip, SidebarIconWithTooltip } from "@/components/SidebarShared";
import type { TooltipWarmRef } from "@/components/SidebarShared";

const LS_KEY = "hermes.sidebar.systemExpanded";

function readExpanded(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === "true";
  } catch {
    return false;
  }
}

function writeExpanded(val: boolean) {
  try {
    localStorage.setItem(LS_KEY, String(val));
  } catch {
    // localStorage may be blocked in private browsing
  }
}

export function SidebarSystemPanel({
  collapsed,
  onNavigate,
  status,
  tooltipWarmRef,
}: SidebarSystemPanelProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { activeAction, isBusy, isRunning, pendingAction, runAction } =
    useSystemActions();
  const canUpdateHermes = status?.can_update_hermes === true;
  // Phục vụ bởi cổng dùng chung: khởi động lại làm mọi bot trên máy này chớp tắt — nói rõ là cái nào (tính năng upstream 0.21).
  const sharedGateway = sharedGatewayProfiles(status);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
  const [updateConfirmInfo, setUpdateConfirmInfo] =
    useState<UpdateCheckResponse | null>(null);
  const [updateConfirmChecking, setUpdateConfirmChecking] = useState(false);
  // Số lần bấm «Kiểm tra lại» khi đã là bản mới nhất (từ lần 1 trở đi hỏi lại kho công khai, bỏ qua kết quả nhớ tạm)
  const [updateRecheck, setUpdateRecheck] = useState(0);
  const [expanded, setExpanded] = useState(readExpanded);

  useEffect(() => {
    if (!updateConfirmOpen) {
      setUpdateConfirmInfo(null);
      setUpdateRecheck(0);
      return;
    }
    let cancelled = false;
    setUpdateConfirmChecking(true);
    api
      .checkHermesUpdate(updateRecheck > 0)
      .then((info) => {
        if (!cancelled) setUpdateConfirmInfo(info);
      })
      .catch(() => {
        if (!cancelled) setUpdateConfirmInfo(null);
      })
      .finally(() => {
        if (!cancelled) setUpdateConfirmChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [updateConfirmOpen, updateRecheck]);

  // Bản cài Hermes+ đã là bản mới nhất: hộp chỉ để thông báo (nút «Đóng» + «Kiểm tra lại»), không mời «Cập nhật ngay»
  const updateUpToDate =
    !updateConfirmChecking &&
    updateConfirmInfo?.install_method === "hermes-plus" &&
    updateConfirmInfo.update_available === false;

  const updateConfirmDescription = useMemo(() => {
    if (updateConfirmInfo?.install_method === "hermes-plus") {
      // Đã là bản mới nhất (hoặc kho công khai không mới hơn bản đang chạy): nói rõ thay vì hỏi «cập nhật?»
      if (updateConfirmInfo.update_available === false && updateConfirmInfo.message) return updateConfirmInfo.message;
      const base = (
        t.status.plusUpdateConfirmMessage ??
        "Update Hermes+ to the latest release ({current}). The system backs up the database, installs the release and restarts the services; it rolls back automatically on failure."
      )
        .replace("{current}", updateConfirmInfo.current_version)
        .replace("{latest}", updateConfirmInfo.latest_release ?? "?");
      // Kho công khai chỉ có một commit nên «ghi chú» lấy từ RELEASE.json của bản mới; không có thì mới dùng tóm tắt commit
      const notes = updateConfirmInfo.latest_notes
        ? `Nội dung bản mới: ${updateConfirmInfo.latest_notes}`
        : (updateConfirmInfo.commits ?? []).slice(0, 5).map((c) => `• ${c.summary}`).join(" ");
      return notes ? `${base} ${notes}` : base;
    }
    if (updateConfirmInfo?.behind && updateConfirmInfo.behind > 0) {
      const cmd = updateConfirmInfo.update_command;
      const n = updateConfirmInfo.behind;
      return `This will run '${cmd}' and pull ${n} new commit${n === 1 ? "" : "s"}. Local code changes in the install directory can be overwritten. The gateway restarts when the update finishes.`;
    }
    const cmd = updateConfirmInfo?.update_command ?? "hermes update";
    return (
      t.status.updateHermesConfirmMessage ??
      `This will run '${cmd}'. Local code changes in the install directory can be overwritten. The gateway restarts when it finishes.`
    );
  }, [t.status.updateHermesConfirmMessage, updateConfirmInfo]);

  const items: SystemActionItem[] = [
    {
      action: "restart",
      icon: RotateCw,
      label: t.status.restartGateway,
      runningLabel: t.status.restartingGateway,
      spin: true,
    },
  ];
  if (canUpdateHermes) {
    items.push({
      action: "update",
      icon: Download,
      label: t.status.updateHermes,
      runningLabel: t.status.updatingHermes,
      spin: false,
    });
  }

  const handleClick = (action: SystemAction) => {
    if (isBusy) return;
    if (action === "restart") {
      setRestartConfirmOpen(true);
      return;
    }
    if (action === "update") {
      setUpdateConfirmOpen(true);
      return;
    }
    void runAction(action);
    navigate("/sessions");
    onNavigate();
  };

  const confirmRestart = () => {
    setRestartConfirmOpen(false);
    void runAction("restart");
    navigate("/sessions");
    onNavigate();
  };

  const confirmUpdate = () => {
    setUpdateConfirmOpen(false);
    void runAction("update");
    navigate("/sessions");
    onNavigate();
  };

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      writeExpanded(next);
      return next;
    });
  };

  // Compute gateway display values
  let gwColor: string;
  let gwAriaLabel: string;
  let gwLinkTitle: string;
  let gwTextContent: string;

  if (status === null) {
    gwColor = "bg-midground/20";
    gwAriaLabel = t.status.gateway;
    gwLinkTitle = t.status.gateway;
    gwTextContent = "";
  } else {
    const gw = gatewayLine(status, t);
    gwColor = gatewayDotClass(gw.tone);
    gwAriaLabel = `${t.status.gateway} ${gw.fullLabel}`;
    gwLinkTitle = `${t.app.statusOverview} — ${t.app.gatewayStatusLabel} ${gw.fullLabel}`;
    gwTextContent = `${t.app.gatewayLabel ?? "Gateway:"} ${gw.label}`;
  }

  const actionsList = (
    <ul className="flex flex-col">
      {items.map((item) => (
        <SystemActionButton
          key={item.action}
          collapsed={collapsed}
          disabled={
            isBusy &&
            !(
              pendingAction === item.action ||
              (activeAction === item.action && isRunning)
            )
          }
          tooltipWarmRef={tooltipWarmRef}
          isPending={pendingAction === item.action}
          isRunning={
            activeAction === item.action &&
            isRunning &&
            pendingAction !== item.action
          }
          item={item}
          onClick={() => handleClick(item.action)}
        />
      ))}
    </ul>
  );

  const themeLangRow = (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2",
        "px-3 py-2",
        "border-t border-current/20",
        collapsed
          ? "lg:flex-col lg:items-start lg:gap-3 lg:py-3"
          : "justify-between",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-2",
          collapsed && "lg:flex-col lg:items-start",
        )}
      >
        <PluginSlot name="header-right" />

        <SidebarIconWithTooltip
          collapsed={collapsed}
          label={t.theme?.switchTheme ?? "Switch theme"}
          tooltipWarmRef={tooltipWarmRef}
        >
          <ThemeSwitcher collapsed={collapsed} dropUp />
        </SidebarIconWithTooltip>

        <SidebarIconWithTooltip
          collapsed={collapsed}
          label={t.language.switchTo}
          tooltipWarmRef={tooltipWarmRef}
        >
          <LanguageSwitcher collapsed={collapsed} dropUp />
        </SidebarIconWithTooltip>
      </div>
    </div>
  );

  return (
    <>
      <div
        data-system-panel
        className={cn(
          "shrink-0 flex flex-col",
          "border-t border-current/10",
          "py-0.5",
        )}
      >
        {collapsed ? (
          // Rail mode header: only the gateway dot with tooltip
          <RailGatewayDot
            color={gwColor}
            ariaLabel={gwAriaLabel}
            tooltipWarmRef={tooltipWarmRef}
          />
        ) : (
          // Expanded sidebar header: dot + compact text + chevron toggle
          <div
            data-system-header
            className="flex items-center gap-2 px-5 py-1.5"
          >
            <span
              role="status"
              aria-label={gwAriaLabel}
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", gwColor)}
            />

            <div className="min-w-0 flex-1">
              {status === null ? (
                <div
                  aria-hidden
                  className="h-2 w-[80%] max-w-full animate-pulse rounded-sm bg-midground/10"
                />
              ) : (
                <Link
                  to="/sessions"
                  title={gwLinkTitle}
                  data-system-gateway-line
                  className={cn(
                    "block min-w-0 truncate",
                    "font-sans text-xs tracking-[0.08em] text-text-secondary",
                    "transition-colors hover:text-midground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-midground/40 focus-visible:ring-inset",
                  )}
                >
                  <span data-system-gateway-text>{gwTextContent}</span>
                </Link>
              )}
            </div>

            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="sidebar-system-body"
              aria-label={expanded ? t.common.collapse : t.common.expand}
              title={expanded ? t.common.collapse : t.common.expand}
              data-system-toggle
              onClick={toggleExpanded}
              className={cn(
                "shrink-0 rounded-sm",
                "text-text-tertiary transition-colors hover:text-midground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-midground/40",
              )}
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  expanded && "rotate-180",
                )}
              />
            </button>
          </div>
        )}

        {collapsed ? (
          // Rail mode: action buttons and theme/lang always visible outside collapse
          <>
            {actionsList}
            {themeLangRow}
          </>
        ) : (
          // Expanded sidebar: collapsible body
          expanded && (
            <div id="sidebar-system-body" data-system-body>
              <SidebarSessionsLine status={status} />
              {actionsList}
              {themeLangRow}
              <SidebarFooter status={status} />
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        cancelLabel={t.common.cancel}
        confirmLabel={sharedGateway ? "Restart all" : t.status.restartGateway}
        description={
          sharedGateway
            ? sharedGatewayRestartDescription(sharedGateway)
            : (t.status.restartGatewayConfirmMessage ??
              "This restarts the Hermes gateway process. Connected channels and active sessions will reconnect afterward.")
        }
        loading={pendingAction === "restart"}
        onCancel={() => setRestartConfirmOpen(false)}
        onConfirm={confirmRestart}
        open={restartConfirmOpen}
        title={
          sharedGateway
            ? "Restart the shared gateway?"
            : (t.status.restartGatewayConfirmTitle ?? `${t.status.restartGateway}?`)
        }
      />

      <ConfirmDialog
        cancelLabel={updateUpToDate ? t.common.close : t.common.cancel}
        confirmLabel={
          updateUpToDate
            ? (t.status.updateHermesRecheck ?? "Check again")
            : (t.status.updateHermesConfirmNow ?? "Update now")
        }
        description={
          updateConfirmChecking ? t.common.loading : updateConfirmDescription
        }
        loading={pendingAction === "update" || updateConfirmChecking}
        onCancel={() => setUpdateConfirmOpen(false)}
        onConfirm={updateUpToDate ? () => setUpdateRecheck((n) => n + 1) : confirmUpdate}
        open={updateConfirmOpen}
        title={
          t.status.updateHermesConfirmTitle ?? `${t.status.updateHermes}?`
        }
      />
    </>
  );
}

function RailGatewayDot({
  color,
  ariaLabel,
  tooltipWarmRef,
}: RailGatewayDotProps) {
  const [hovered, setHovered] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);

  const showTooltip = (
    event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>,
  ) => {
    setHovered(true);
    setTooltipAnchor(event.currentTarget);
  };
  const hideTooltip = () => {
    setHovered(false);
    setTooltipAnchor(null);
  };

  return (
    <div
      className="hidden lg:flex py-3 pl-[1.625rem]"
      role="status"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", color)} />

      {hovered && tooltipAnchor && (
        <SidebarTooltip
          anchor={tooltipAnchor}
          label={ariaLabel}
          warmRef={tooltipWarmRef}
        />
      )}
    </div>
  );
}

function SystemActionButton({
  collapsed,
  disabled,
  isPending,
  isRunning: isActionRunning,
  item,
  onClick,
  tooltipWarmRef,
}: SystemActionButtonProps) {
  const { icon: Icon, label, runningLabel, spin, action } = item;
  const [hovered, setHovered] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  const busy = isPending || isActionRunning;
  const displayLabel = isActionRunning ? runningLabel : label;
  const showTooltip = (
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
  ) => {
    setHovered(true);
    setTooltipAnchor(event.currentTarget);
  };
  const hideTooltip = () => {
    setHovered(false);
    setTooltipAnchor(null);
  };

  const liDataAttr =
    action === "restart"
      ? { "data-system-restart": true }
      : { "data-system-update": true };

  return (
    <li
      {...liDataAttr}
      onMouseEnter={collapsed ? showTooltip : undefined}
      onMouseLeave={collapsed ? hideTooltip : undefined}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        aria-busy={busy}
        aria-label={collapsed ? displayLabel : undefined}
        onFocus={collapsed ? showTooltip : undefined}
        onBlur={collapsed ? hideTooltip : undefined}
        type="button"
        className={cn(
          "group/action relative flex w-full items-start gap-3",
          "px-5 py-2.5",
          "font-sans text-display text-xs tracking-[0.1em]",
          "transition-colors cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-midground",
          busy
            ? "text-midground"
            : "text-text-secondary hover:text-midground",
          "disabled:text-text-disabled disabled:cursor-not-allowed",
        )}
      >
        {isPending ? (
          <Spinner className="shrink-0 text-[0.875rem]" />
        ) : isActionRunning && spin ? (
          <Spinner className="shrink-0 text-[0.875rem]" />
        ) : (
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              "mt-0.5",
              isActionRunning && !spin && "animate-pulse",
            )}
          />
        )}

        {/* Long labels (e.g. Turkish "Ağ Geçidini Yeniden Başlat", 179px vs
            177px of room) wrap instead of truncating — the System block must
            not show a "…". */}
        <span
          className={cn(
            "min-w-0 flex-1 transition-opacity duration-300",
            collapsed ? "lg:opacity-0" : "lg:opacity-100",
          )}
        >
          {displayLabel}
        </span>

        <span
          aria-hidden
          className="absolute inset-y-0.5 left-1.5 right-1.5 bg-midground opacity-0 pointer-events-none transition-opacity duration-200 group-hover/action:opacity-5"
        />

        {busy && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-px bg-midground"
          />
        )}
      </button>

      {collapsed && hovered && tooltipAnchor && (
        <SidebarTooltip
          anchor={tooltipAnchor}
          label={displayLabel}
          warmRef={tooltipWarmRef}
        />
      )}
    </li>
  );
}

interface RailGatewayDotProps {
  color: string;
  ariaLabel: string;
  tooltipWarmRef: TooltipWarmRef;
}

interface SidebarSystemPanelProps {
  collapsed: boolean;
  onNavigate: () => void;
  status: StatusResponse | null;
  tooltipWarmRef: TooltipWarmRef;
}

interface SystemActionButtonProps {
  collapsed: boolean;
  disabled: boolean;
  isPending: boolean;
  isRunning: boolean;
  item: SystemActionItem;
  onClick: () => void;
  tooltipWarmRef: TooltipWarmRef;
}

interface SystemActionItem {
  action: SystemAction;
  icon: ComponentType<{ className?: string }>;
  label: string;
  runningLabel: string;
  spin: boolean;
}
