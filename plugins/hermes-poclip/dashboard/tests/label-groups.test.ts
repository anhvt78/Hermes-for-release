import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { labelGroupsEn } from "../src/i18n/label-groups.en";
import { labelGroupsVi } from "../src/i18n/label-groups.vi";
import { en } from "../src/i18n/en";
import { vi } from "../src/i18n/vi";
import {
  formatLabelIn,
  MEETING_MEMBER_ROLE,
  ACTION_PRIORITY,
  INVITATION_STATUS,
  TURN_RESULT,
  MEETING_TEMPLATE_TYPE,
} from "../src/lib/label-table";

// ── Tham chiếu giống nhau — đảm bảo en/vi dùng đúng object đã tách ────────────

describe("labelGroups — reference equality", () => {
  it("en.labelGroups === labelGroupsEn (cùng tham chiếu, không copy)", () => {
    assert.strictEqual((en as any).labelGroups, labelGroupsEn);
  });
  it("vi.labelGroups === labelGroupsVi (cùng tham chiếu, không copy)", () => {
    assert.strictEqual((vi as any).labelGroups, labelGroupsVi);
  });
});

// ── Giá trị THẮNG — kiểm tra Table (A) thắng, không bị ghi đè bởi Table (B) ──

describe("labelGroups — WINNING values (Table A must win)", () => {
  it('vi: standup = "Họp giao ban đầu ngày" (không phải "Họp giao ban")', () => {
    assert.equal(labelGroupsVi.meetingTemplateType.standup, "Họp giao ban đầu ngày");
  });
  it('vi: project = "Đánh giá dự án" (không phải "Họp dự án")', () => {
    assert.equal(labelGroupsVi.meetingTemplateType.project, "Đánh giá dự án");
  });
  it('vi: incident = "Xử lý sự cố" (không phải "Họp khẩn cấp")', () => {
    assert.equal(labelGroupsVi.meetingTemplateType.incident, "Xử lý sự cố");
  });
  it('vi: recurring = "Họp định kỳ" (không phải "Họp thường kỳ")', () => {
    assert.equal(labelGroupsVi.meetingTemplateType.recurring, "Họp định kỳ");
  });
  it('vi: retrospective = "Họp Tổng kết & Rút kinh nghiệm" (không phải lowercase)', () => {
    assert.equal(labelGroupsVi.meetingTemplateType.retrospective, "Họp Tổng kết & Rút kinh nghiệm");
  });
  it('en: standup = "Stand-up"', () => {
    assert.equal(labelGroupsEn.meetingTemplateType.standup, "Stand-up");
  });
  it('en: project = "Project Review"', () => {
    assert.equal(labelGroupsEn.meetingTemplateType.project, "Project Review");
  });
  it('en: incident = "Incident Response"', () => {
    assert.equal(labelGroupsEn.meetingTemplateType.incident, "Incident Response");
  });
});

// ── sessionStatus: 13 mã (bao gồm scheduled/failed/paused thêm từ bảng B) ────

describe("labelGroups.sessionStatus — 13 mã đủ", () => {
  const EXPECTED = ["draft","invited","quorum_met","in_progress","discussing","summarizing","decided","closed","suspended","cancelled","scheduled","failed","paused"];
  for (const code of EXPECTED) {
    it(`vi: sessionStatus.${code} có nhãn`, () => {
      assert.ok(typeof (labelGroupsVi.sessionStatus as any)[code] === "string");
    });
    it(`en: sessionStatus.${code} có nhãn`, () => {
      assert.ok(typeof (labelGroupsEn.sessionStatus as any)[code] === "string");
    });
  }
});

// ── Descriptors mới — MEETING_MEMBER_ROLE, ACTION_PRIORITY, INVITATION_STATUS, TURN_RESULT, MEETING_TEMPLATE_TYPE ──

describe("formatLabelIn — new descriptors", () => {
  it("MEETING_MEMBER_ROLE: content_chair -> Chủ tọa nội dung (vi)", () => {
    assert.equal(formatLabelIn(vi as any, MEETING_MEMBER_ROLE, "content_chair"), "Chủ tọa nội dung");
  });
  it("MEETING_MEMBER_ROLE: observer -> Observer (en)", () => {
    assert.equal(formatLabelIn(en as any, MEETING_MEMBER_ROLE, "observer"), "Observer");
  });
  it("ACTION_PRIORITY: critical -> Khẩn cấp (vi)", () => {
    assert.equal(formatLabelIn(vi as any, ACTION_PRIORITY, "critical"), "Khẩn cấp");
  });
  it("ACTION_PRIORITY: low -> Low (en)", () => {
    assert.equal(formatLabelIn(en as any, ACTION_PRIORITY, "low"), "Low");
  });
  it("INVITATION_STATUS: accepted -> Đã đồng ý (vi)", () => {
    assert.equal(formatLabelIn(vi as any, INVITATION_STATUS, "accepted"), "Đã đồng ý");
  });
  it("INVITATION_STATUS: declined -> Declined (en)", () => {
    assert.equal(formatLabelIn(en as any, INVITATION_STATUS, "declined"), "Declined");
  });
  it("TURN_RESULT: speaking -> Đang phát biểu (vi)", () => {
    assert.equal(formatLabelIn(vi as any, TURN_RESULT, "speaking"), "Đang phát biểu");
  });
  it("TURN_RESULT: timeout -> Timed Out (en)", () => {
    assert.equal(formatLabelIn(en as any, TURN_RESULT, "timeout"), "Timed Out");
  });
  it("MEETING_TEMPLATE_TYPE: standup -> Họp giao ban đầu ngày (vi)", () => {
    assert.equal(formatLabelIn(vi as any, MEETING_TEMPLATE_TYPE, "standup"), "Họp giao ban đầu ngày");
  });
  it("MEETING_TEMPLATE_TYPE: retrospective -> Retrospective (en)", () => {
    assert.equal(formatLabelIn(en as any, MEETING_TEMPLATE_TYPE, "retrospective"), "Retrospective");
  });
  it("mã lạ -> Chưa xác định (<mã>) (vi)", () => {
    assert.equal(formatLabelIn(vi as any, MEETING_MEMBER_ROLE, "unknown_role_xyz"), "Chưa xác định (unknown_role_xyz)");
  });
  it("mã lạ -> Unknown (<mã>) (en)", () => {
    assert.equal(formatLabelIn(en as any, MEETING_MEMBER_ROLE, "unknown_role_xyz"), "Unknown (unknown_role_xyz)");
  });
  it("mã rỗng -> chuỗi rỗng", () => {
    assert.equal(formatLabelIn(vi as any, TURN_RESULT, ""), "");
  });
  it("mã null -> chuỗi rỗng", () => {
    assert.equal(formatLabelIn(vi as any, ACTION_PRIORITY, null), "");
  });
});

// ── Số lượng codes của các descriptor mới ────────────────────────────────────

describe("descriptors mới — codes count", () => {
  it("MEETING_MEMBER_ROLE có 5 codes", () => { assert.equal(MEETING_MEMBER_ROLE.codes.length, 5); });
  it("ACTION_PRIORITY có 4 codes", () => { assert.equal(ACTION_PRIORITY.codes.length, 4); });
  it("INVITATION_STATUS có 4 codes", () => { assert.equal(INVITATION_STATUS.codes.length, 4); });
  it("TURN_RESULT có 7 codes", () => { assert.equal(TURN_RESULT.codes.length, 7); });
  it("MEETING_TEMPLATE_TYPE có 6 codes", () => { assert.equal(MEETING_TEMPLATE_TYPE.codes.length, 6); });
});
