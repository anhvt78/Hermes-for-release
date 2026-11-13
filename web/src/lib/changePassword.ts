// Kiểm tra và gửi yêu cầu đổi mật khẩu của tài khoản Poclip (dùng cho hộp thoại tài khoản).

export type PasswordCheck = "missingCurrent" | "tooShort" | "mismatch" | null;

/** Kiểm tra form trước khi gửi. Trả mã lỗi đầu tiên, hoặc null nếu hợp lệ. */
export function checkPasswordForm(current: string, next: string, confirm: string): PasswordCheck {
  if (!current) return "missingCurrent";
  if (next.length < 8) return "tooShort";
  if (next !== confirm) return "mismatch";
  return null;
}

/** Lấy thông điệp lỗi của máy chủ (tiếng Việt ưu tiên) nếu có. */
export function serverErrorMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: { message_vi?: string; message_en?: string } } | null)?.detail;
  return detail?.message_vi ?? detail?.message_en ?? fallback;
}

export async function postPasswordChange(
  path: string,
  current: string,
  next: string,
  fallbackError: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });
    if (res.ok) return { ok: true };
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* phản hồi không phải JSON */
    }
    return { ok: false, message: serverErrorMessage(body, fallbackError) };
  } catch {
    return { ok: false, message: fallbackError };
  }
}
