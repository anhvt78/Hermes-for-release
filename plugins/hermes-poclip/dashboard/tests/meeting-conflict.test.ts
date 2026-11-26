import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findMeetingConflicts, formatHHMM, pickConflictSource, shouldSendOnConflictWarn } from "../src/lib/meeting-conflict";
import type { MeetingForConflict, CandidateMeeting } from "../src/lib/meeting-conflict";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkMeeting(id: string, start: string, status = "draft"): MeetingForConflict {
  return { id, title: `Họp ${id}`, scheduled_start_at: start, status };
}

const DUR60 = (_m: MeetingForConflict): number | null => 60;

// ── findMeetingConflicts ─────────────────────────────────────────────────────

describe("findMeetingConflicts — có trùng", () => {
  it("candidate 10:00 gặp meeting 10:30 (cùng ngày, 60 phút mỗi cuộc)", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:30:00Z")], DUR60);
    assert.equal(result.length, 1);
    assert.equal(result[0].meeting_id, "m1");
    assert.ok(result[0].overlap_start.includes("10:30"), `overlap_start phải là 10:30: ${result[0].overlap_start}`);
  });

  it("candidate chứa trọn meeting nhỏ hơn → trùng", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 120 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:15:00Z")], DUR60);
    assert.equal(result.length, 1);
  });

  it("nhiều cuộc trùng → trả đủ danh sách", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const meetings = [
      mkMeeting("m1", "2026-10-05T10:30:00Z"),
      mkMeeting("m2", "2026-10-05T09:30:00Z"),
    ];
    const result = findMeetingConflicts(cand, meetings, DUR60);
    assert.equal(result.length, 2);
  });
});

describe("findMeetingConflicts — không trùng", () => {
  it("candidate 10:00-11:00, meeting 11:00-12:00 (tiếp giáp) → không trùng", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T11:00:00Z")], DUR60);
    assert.equal(result.length, 0);
  });

  it("candidate 11:00-12:00, meeting 09:00-10:00 (trước đó) → không trùng", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T11:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T09:00:00Z")], DUR60);
    assert.equal(result.length, 0);
  });

  it("khác ngày → không trùng", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-06T10:00:00Z")], DUR60);
    assert.equal(result.length, 0);
  });
});

describe("findMeetingConflicts — bỏ qua theo trạng thái", () => {
  it("cuộc đã huỷ (cancelled) → bỏ qua", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:00:00Z", "cancelled")], DUR60);
    assert.equal(result.length, 0);
  });

  it("cuộc đã kết thúc (completed) → bỏ qua", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:00:00Z", "completed")], DUR60);
    assert.equal(result.length, 0);
  });

  it("cuộc in_progress → tính vào trùng", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:00:00Z", "in_progress")], DUR60);
    assert.equal(result.length, 1);
  });
});

describe("findMeetingConflicts — excludeId", () => {
  it("bỏ qua đúng cuộc có excludeId", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    const meetings = [
      mkMeeting("m1", "2026-10-05T10:00:00Z"),
      mkMeeting("m2", "2026-10-05T10:30:00Z"),
    ];
    const result = findMeetingConflicts(cand, meetings, DUR60, "m1");
    assert.equal(result.length, 1);
    assert.equal(result[0].meeting_id, "m2");
  });
});

describe("findMeetingConflicts — edge cases", () => {
  it("candidate không có scheduled_start_at → trả []", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "" };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:00:00Z")], DUR60);
    assert.equal(result.length, 0);
  });

  it("candidate ISO không hợp lệ → trả []", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "not-a-date" };
    const result = findMeetingConflicts(cand, [mkMeeting("m1", "2026-10-05T10:00:00Z")], DUR60);
    assert.equal(result.length, 0);
  });

  it("danh sách meetings rỗng → trả []", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z", duration_minutes: 60 };
    assert.equal(findMeetingConflicts(cand, [], DUR60).length, 0);
  });

  it("getDurationMinutes trả null → mặc định 30 phút", () => {
    const cand: CandidateMeeting = { scheduled_start_at: "2026-10-05T10:00:00Z" };
    const meetings = [mkMeeting("m1", "2026-10-05T10:15:00Z")];
    const result = findMeetingConflicts(cand, meetings, () => null);
    assert.equal(result.length, 1, "30 + 30 phút phải trùng nhau");
  });
});

// ── pickConflictSource ────────────────────────────────────────────────────────

describe("pickConflictSource", () => {
  it("server has_conflict=true → trả 'server' dù không có client conflict", () => {
    assert.equal(pickConflictSource({ has_conflict: true }, []), "server");
  });

  it("server has_conflict=false, client có conflict → trả 'client'", () => {
    assert.equal(pickConflictSource({ has_conflict: false }, [{ meeting_id: "m1" }]), "client");
  });

  it("server null, client có conflict → trả 'client'", () => {
    assert.equal(pickConflictSource(null, [{ meeting_id: "m1" }]), "client");
  });

  it("cả hai đều rỗng → trả 'client' (mặc định)", () => {
    assert.equal(pickConflictSource(null, []), "client");
  });
});

// ── shouldSendOnConflictWarn ──────────────────────────────────────────────────

describe("shouldSendOnConflictWarn", () => {
  it("proceedWithConflict=true + source=server → true (phải gửi on_conflict=warn)", () => {
    assert.equal(shouldSendOnConflictWarn(true, "server"), true);
  });

  it("proceedWithConflict=true + source=client → false (không gửi on_conflict)", () => {
    assert.equal(shouldSendOnConflictWarn(true, "client"), false);
  });

  it("proceedWithConflict=false + source=server → false (chưa bấm 'Vẫn tạo')", () => {
    assert.equal(shouldSendOnConflictWarn(false, "server"), false);
  });

  it("proceedWithConflict=false + source=client → false", () => {
    assert.equal(shouldSendOnConflictWarn(false, "client"), false);
  });
});

// ── formatHHMM ────────────────────────────────────────────────────────────────

describe("formatHHMM", () => {
  it("ISO hợp lệ → trả chuỗi HH:MM", () => {
    const result = formatHHMM("2026-10-05T10:30:00Z");
    assert.ok(result.includes(":"), `phải chứa dấu ':': ${result}`);
    assert.equal(result.length, 5, `phải đúng 5 ký tự: ${result}`);
  });

  it("chuỗi rỗng hoặc không hợp lệ → trả nguyên chuỗi", () => {
    assert.equal(formatHHMM(""), "");
    assert.equal(formatHHMM("not-a-date"), "not-a-date");
  });
});
