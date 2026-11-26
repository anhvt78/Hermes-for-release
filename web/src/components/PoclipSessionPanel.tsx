import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { ShellNavScope } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// Fallback strings khi locale không có khối session (tất cả locale trừ vi/en)
const FALLBACK = {
  heading: "Poclip session",
  signedInAs: "Signed in: {name}",
  roleChairman: "Chairman",
  roleDeptHead: "Dept. head",
  roleReadonly: "Read-only",
  changePassword: "Change password",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm new password",
  passwordMismatch: "Passwords do not match.",
  passwordTooShort: "New password must be at least 8 characters.",
  passwordChanged: "Password changed.",
  changeFailed: "Could not change password.",
  signOut: "Sign out",
};

const ROLE_LABEL_KEYS = {
  chu_tich: "roleChairman",
  truong_phong: "roleDeptHead",
  chi_xem: "roleReadonly",
} as const;

interface Props {
  scope: ShellNavScope;
}

export function PoclipSessionPanel({ scope }: Props) {
  const { t } = useI18n();
  const s = t.session ?? FALLBACK;

  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const account = scope.account;
  const roleLabelKey = account
    ? (ROLE_LABEL_KEYS[account.role as keyof typeof ROLE_LABEL_KEYS] ?? null)
    : null;
  const roleLabel = roleLabelKey ? s[roleLabelKey] : (account?.role ?? "");
  const displayName = account?.full_name ?? account?.username ?? "";
  const signedInLine = s.signedInAs.replace("{name}", displayName);

  const resetPwForm = () => {
    setCurPw("");
    setNewPw("");
    setConfirmPw("");
    setPwMsg(null);
    setPwBusy(false);
  };

  const openPwForm = () => {
    resetPwForm();
    setPwOpen(true);
  };

  const closePwForm = () => {
    setPwOpen(false);
    resetPwForm();
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: s.passwordMismatch });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: s.passwordTooShort });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch(scope.change_password_path, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      if (res.ok) {
        setPwMsg({ ok: true, text: s.passwordChanged });
        setCurPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(closePwForm, 1500);
      } else {
        let errText = s.changeFailed;
        try {
          const body = await res.json();
          if (body?.detail?.message_vi || body?.detail?.message_en) {
            errText = body.detail.message_vi ?? body.detail.message_en;
          }
        } catch { /* non-JSON error */ }
        setPwMsg({ ok: false, text: errText });
      }
    } catch {
      setPwMsg({ ok: false, text: s.changeFailed });
    } finally {
      setPwBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(scope.logout_path, { method: "POST", credentials: "same-origin" });
    } catch { /* ignore network error */ }
    try {
      localStorage.removeItem("hermes-poclip-session");
    } catch { /* ignore */ }
    window.location.assign("/poclip-login");
  };

  return (
    <div
      data-poclip-session-panel
      className={cn(
        "shrink-0 flex flex-col",
        "border-t border-current/10",
        "text-xs",
      )}
    >
      {account && (
        <div className="px-4 py-2 font-sans text-text-secondary leading-snug">
          <span className="block truncate font-sans text-xs text-text-tertiary">{s.heading}</span>
          <span className="block truncate">{signedInLine}</span>
          <span className="block truncate opacity-70">{roleLabel}</span>
        </div>
      )}

      {pwOpen ? (
        <div className="flex flex-col gap-1 px-4 pb-2">
          <input
            type="password"
            placeholder={s.currentPassword}
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            disabled={pwBusy}
            className={cn(
              "rounded border border-current/20 bg-transparent px-2 py-1",
              "font-sans text-xs text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-1 focus:ring-midground/40",
            )}
          />
          <input
            type="password"
            placeholder={s.newPassword}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            disabled={pwBusy}
            className={cn(
              "rounded border border-current/20 bg-transparent px-2 py-1",
              "font-sans text-xs text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-1 focus:ring-midground/40",
            )}
          />
          <input
            type="password"
            placeholder={s.confirmPassword}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            disabled={pwBusy}
            className={cn(
              "rounded border border-current/20 bg-transparent px-2 py-1",
              "font-sans text-xs text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-1 focus:ring-midground/40",
            )}
          />
          {pwMsg && (
            <p
              className={cn(
                "text-xs leading-tight",
                pwMsg.ok ? "text-green-500" : "text-red-500",
              )}
            >
              {pwMsg.text}
            </p>
          )}
          <div className="flex gap-1 pt-0.5">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={pwBusy}
              className={cn(
                "flex-1 rounded px-2 py-1",
                "font-sans text-xs tracking-wide",
                "bg-midground/10 hover:bg-midground/20 text-text-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {pwBusy ? "…" : s.changePassword}
            </button>
            <button
              type="button"
              onClick={closePwForm}
              disabled={pwBusy}
              className={cn(
                "rounded px-2 py-1",
                "font-sans text-xs tracking-wide",
                "bg-transparent hover:bg-midground/10 text-text-secondary",
              )}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={openPwForm}
            className={cn(
              "px-4 py-1.5 text-left",
              "font-sans text-xs tracking-[0.08em] text-text-secondary",
              "hover:text-midground transition-colors",
            )}
          >
            {s.changePassword}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "px-4 py-1.5 text-left",
              "font-sans text-xs tracking-[0.08em] text-text-secondary",
              "hover:text-midground transition-colors",
            )}
          >
            {s.signOut}
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex shrink-0 items-center gap-2",
          "px-3 py-2",
          "border-t border-current/20",
        )}
      >
        <ThemeSwitcher collapsed={false} dropUp />
        <LanguageSwitcher collapsed={false} dropUp />
      </div>
    </div>
  );
}
