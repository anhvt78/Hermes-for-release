import { Typography } from "@nous-research/ui/ui/components/typography/index";
import type { StatusResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { footerVersionText } from "@/lib/footerVersion";

/** Chân thanh bên của Hermes+: bên trái là SỐ HIỆU BẢN PHÁT HÀNH Hermes+ (vd 2026.11.12-1), bên phải là tên sản phẩm (không còn «Nous Research»). */
export function SidebarFooter({ status }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2",
        "px-5 py-2.5",
        "border-t border-current/10",
      )}
    >
      <Typography
        className="font-mono-ui text-xs tabular-nums tracking-[0.08em] text-text-tertiary lowercase"
      >
        {footerVersionText(status)}
      </Typography>

      <span className="font-sans text-display text-xs tracking-[0.12em] text-midground">Hermes+</span>
    </div>
  );
}

interface SidebarFooterProps {
  status: StatusResponse | null;
}
