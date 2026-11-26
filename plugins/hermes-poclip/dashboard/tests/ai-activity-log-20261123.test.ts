import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatDuration, hasPickedProfile, sessionRefLabel, sortProfiles } from "../src/lib/aiActivityFilters";

// Tab «Nhật ký hoạt động AI» — đợt rà soát 23/11/2026

function findSrc(relPath: string): string {
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`không tìm thấy ${relPath}`);
}

describe("hồ sơ: xếp theo hoạt động gần nhất", () => {
  it("gần nhất lên đầu; chưa có hoạt động xuống cuối; bằng nhau thì nhiều phiên hơn trước", () => {
    const items = [
      { id: "a", session_count: 194, last_activity: "2026-11-23T12:25:27.342Z" },
      { id: "b", session_count: 1, last_activity: "2026-11-10T06:51:32.831Z" },
      { id: "c", session_count: 434, last_activity: "2026-11-23T13:11:31.241Z" },
      { id: "d", session_count: 5, last_activity: null },
      { id: "e", session_count: 9, last_activity: "2026-11-10T06:51:32.831Z" },
    ];
    assert.deepEqual(sortProfiles(items).map((x) => x.id), ["c", "a", "e", "b", "d"]);
    assert.equal(items[0].id, "a", "không đổi mảng gốc");
  });
  it("hasPickedProfile: «all»/rỗng = chưa chọn", () => {
    assert.equal(hasPickedProfile("all"), false);
    assert.equal(hasPickedProfile(""), false);
    assert.equal(hasPickedProfile(null), false);
    assert.equal(hasPickedProfile("ceo-agent"), true);
  });
});

describe("thời lượng và mã phiên", () => {
  const u = { sec: "giây", min: "phút", hour: "giờ" };
  it("formatDuration", () => {
    assert.equal(formatDuration("2026-11-23T13:11:31Z", "2026-11-23T13:11:36Z", u), "5 giây");
    assert.equal(formatDuration("2026-11-23T13:00:00Z", "2026-11-23T13:03:20Z", u), "3 phút 20 giây");
    assert.equal(formatDuration("2026-11-23T13:00:00Z", "2026-11-23T14:05:00Z", u), "1 giờ 5 phút");
    assert.equal(formatDuration("2026-11-23T13:00:00Z", "2026-11-23T14:00:00Z", u), "1 giờ");
    assert.equal(formatDuration(null, "2026-11-23T14:00:00Z", u), "—");
    assert.equal(formatDuration("2026-11-23T14:00:00Z", "2026-11-23T13:00:00Z", u), "—");
  });
  it("sessionRefLabel: mã phiên → «Phiên <giờ>»; mã lạ giữ nguyên", () => {
    assert.equal(sessionRefLabel("20261123_122517_4c4b27", (iso) => `<${iso}>`, "Phiên"), "Phiên <2026-11-23T12:25:17Z>");
    assert.equal(sessionRefLabel("abc", (i) => i, "Phiên"), "abc");
    assert.equal(sessionRefLabel(null, (i) => i, "Phiên"), "");
  });
});

describe("trang Nhật ký hoạt động AI: bố cục và chữ", () => {
  // Tên tệp trong git là «AIActivityLog.tsx» (Windows không phân biệt hoa/thường nên trên máy này thấy «AiActivityLog.tsx»)
  const page = fs.readFileSync(findSrc("src/pages/AIActivityLog.tsx"), "utf-8");
  const vi = fs.readFileSync(findSrc("src/i18n/vi.ts"), "utf-8");
  it("ô «Hồ sơ» hiện tên người, mặc định người hoạt động gần nhất; «Tất cả hồ sơ» là lựa chọn chủ động", () => {
    assert.ok(page.includes("sortProfiles(profilesData?.items || [])"));
    assert.ok(page.includes("{personLabel(t, p.id)} ({p.session_count}"));
    assert.ok(!page.includes("{p.label} ({p.session_count}"));
    assert.ok(page.includes("pickedAll ? null : (profiles[0]?.id ?? null)"));
    assert.ok(page.includes("data-ai-log-pick-hint"));
  });
  it("ẩn lượt thử thất bại: bật sẵn, gửi hide_empty cho máy chủ, báo số đã ẩn", () => {
    assert.ok(page.includes("useState(true)"));
    assert.ok(page.includes('"&hide_empty=true"'));
    assert.ok(page.includes("data-ai-log-hide-empty"));
    assert.ok(page.includes("al.hiddenEmptyNote("));
  });
  it("bảng phiên có cột lệnh đã gọi + thời lượng", () => {
    assert.ok(page.includes("{al.toolCallsCol}"));
    assert.ok(page.includes("formatDuration(s.started_at, s.ended_at, dur)"));
  });
  it("mở phiên hiện «Phiên lúc … của <tên>», không còn «ID phiên … | Hồ sơ …» thô", () => {
    assert.ok(page.includes("data-ai-log-session-title"));
    assert.ok(!page.includes("{al.sessionId}: {sessionId} | {al.profile}: {profile}"));
  });
  it("giờ phiên lấy từ dòng vừa bấm (không dùng số giây thô của API chi tiết); báo khi mục trao đổi chạm trần 500", () => {
    assert.ok(page.includes("startedAt={openStarted}"));
    assert.ok(page.includes("onOpenSession(s.id, profile, s.started_at)"));
    assert.ok(!page.includes("turnsData?.session?.started_at"));
    assert.ok(page.includes("data-ai-log-exch-truncated"));
  });
  it("nút «Mở» đứng đầu dòng bảng phiên; ô hồ sơ không rộng quá khung", () => {
    const head = page.indexOf("<th style={thL}>{al.startedAt}</th>");
    assert.ok(page.lastIndexOf('<th style={{ padding: "0.35rem 0.5rem" }}></th>', head) > page.indexOf("<thead>", page.indexOf("function SessionsView")));
    assert.ok(page.includes('width: "min(100%, 360px)"'));
  });
  it("kết quả tìm, vết xem: tên người/vai trò thay mã; mọi bảng nằm trong khung cuộn ngang", () => {
    assert.ok(page.includes("title={item.profile}>{personLabel(t, item.profile)}"));
    assert.ok(page.includes("{personLabel(t, item.viewer)}") || page.includes(">{personLabel(t, item.viewer)}</td>"));
    assert.ok((page.match(/overflowX: "auto"/g) ?? []).length >= 4);
  });
  it("bộ lọc có hiệu lực ngay; đầu trang h2; nút xuất cỡ nhỏ", () => {
    assert.ok(page.includes("applyNow({ from:"));
    assert.ok(page.includes("applyNow({ kind:"));
    assert.ok(page.includes("<h2 style={{ margin: 0 }}>{al.title}</h2>"));
    assert.ok(!page.includes("<h1"));
    assert.ok(page.includes('data-ai-log-export="csv"'));
  });
  it("chữ tiếng Việt: tên 3 mục con, nhãn trao đổi, mô tả không còn «phân quyền»/«agent»", () => {
    const start = vi.indexOf("  aiActivityLog: {");
    const block = vi.slice(start, vi.indexOf("  // ── Trang Xuất, nhập công ty", start));
    const shown = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
    assert.ok(shown.includes("Ai đã xem nhật ký này"));
    assert.ok(shown.includes("Tin nhắn giữa nhân viên AI"));
    assert.ok(shown.includes("Bình luận trên thẻ việc"));
    for (const bad of ["phân quyền", "Tin nhắn agent", "Bình luận Kanban", "prompt", "cá nhân AI"]) {
      assert.ok(!shown.some((s) => s.includes(bad)), bad);
    }
  });
});
