import { Button } from "@nous-research/ui/ui/components/button";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn, themedBody } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { ShellNavScope } from "@/lib/api";
import { checkPasswordForm, postPasswordChange } from "@/lib/changePassword";

// Chuỗi dự phòng cho ngôn ngữ chưa có khối `session`
const FALLBACK = {
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
  accountTitle: "Account",
  accountSharedNote: "This password is used for both the sign-in page and the Company area.",
  missingCurrent: "Enter your current password.",
  close: "Close",
};

const ROLE_KEYS = {
  chu_tich: "roleChairman",
  truong_phong: "roleDeptHead",
  chi_xem: "roleReadonly",
} as const;

const inputClass = cn(
  "w-full rounded border border-current/20 bg-transparent px-2 py-1.5",
  "font-sans text-sm text-text-primary placeholder:text-text-tertiary",
  "focus:outline-none focus:ring-1 focus:ring-midground/40",
);

interface Props {
  open: boolean;
  onClose: () => void;
  scope: ShellNavScope;
}

/** Hộp thoại tài khoản: thông tin người đăng nhập + đổi mật khẩu. Mở khi bấm vào tên ở menu bên trái. */
export function AccountDialog({ open, onClose, scope }: Props) {
  const { t } = useI18n();
  const s = { ...FALLBACK, ...(t.session ?? {}) } as typeof FALLBACK;
  const dialogRef = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCur("");
    setNext("");
    setConfirm("");
    setMsg(null);
    setBusy(false);
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const account = scope.account;
  const roleKey = account ? ROLE_KEYS[account.role as keyof typeof ROLE_KEYS] : undefined;
  const roleLabel = roleKey ? s[roleKey] : (account?.role ?? "");
  const fullName = account?.full_name ?? "";
  const displayName = fullName && fullName !== roleLabel ? fullName : (account?.username ?? fullName);

  const submit = async () => {
    setMsg(null);
    const problem = checkPasswordForm(cur, next, confirm);
    if (problem) {
      const text =
        problem === "missingCurrent" ? s.missingCurrent : problem === "tooShort" ? s.passwordTooShort : s.passwordMismatch;
      setMsg({ ok: false, text });
      return;
    }
    setBusy(true);
    const res = await postPasswordChange(scope.change_password_path, cur, next, s.changeFailed);
    setBusy(false);
    if (res.ok) {
      setCur("");
      setNext("");
      setConfirm("");
      setMsg({ ok: true, text: s.passwordChanged });
      setTimeout(onClose, 1500);
    } else {
      setMsg({ ok: false, text: res.message ?? s.changeFailed });
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-dialog-title"
      data-account-dialog
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/85 p-4"
    >
      <div ref={dialogRef} className={cn(themedBody, "relative w-full max-w-sm border border-border bg-card shadow-2xl")}>
        <div className="flex items-start gap-3 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <h2 id="account-dialog-title" className="font-mondwest text-display text-base tracking-wider">
              {s.accountTitle}
            </h2>
            <p className="mt-1 truncate text-xs text-text-secondary">{s.signedInAs.replace("{name}", displayName)}</p>
            <p className="truncate text-xs opacity-70">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={s.close}
            className="shrink-0 rounded p-1 text-text-secondary hover:bg-current/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="flex flex-col gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <h3 className="text-xs tracking-[0.08em] text-text-secondary">{s.changePassword}</h3>
          <input
            type="password"
            autoComplete="current-password"
            placeholder={s.currentPassword}
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            disabled={busy}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder={s.newPassword}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={busy}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder={s.confirmPassword}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
            className={inputClass}
          />
          <p className="text-xs opacity-70">{s.accountSharedNote}</p>
          {msg && <p className={cn("text-xs leading-tight", msg.ok ? "text-green-500" : "text-red-500")}>{msg.text}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" outlined onClick={onClose} disabled={busy}>
              {s.close}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "…" : s.changePassword}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
