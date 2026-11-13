import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clusterLabel,
  clusterLabelWithCode,
  orgUnitLabel,
  orgUnitLabelOr,
  personLabel,
  personLabelNeutral,
  personLabelOr,
  personLabelWithCode,
  sameLabelText,
} from "../src/lib/display-labels";
import { clearServerNames, setServerNames } from "../src/lib/server-names";
import { vi } from "../src/i18n/vi";

// Lỗi thật (máy 218, công ty đầu tư): thẻ Trưởng phòng Kỹ thuật & Dòng tiền hiện «Chưa xác định (technical_research-lead-agent)»
// vì bảng nhãn cố định của giao diện chỉ biết 14 phòng của công ty mẫu. Tên đúng đã nằm trong dữ liệu và máy chủ gửi kèm.
describe("Cây tổ chức — tên nhân viên và tên phòng không có trong bảng nhãn cố định", () => {
  it("phòng lạ dùng tên phòng máy chủ gửi kèm, không hiện «Chưa xác định»", () => {
    assert.equal(orgUnitLabelOr(vi as any, "technical_research", "Kỹ thuật & Dòng tiền"), "Kỹ thuật & Dòng tiền");
  });

  it("nhân viên lạ dùng tên nhân viên máy chủ gửi kèm", () => {
    assert.equal(
      personLabelOr(vi as any, "technical_research-lead-agent", "Trưởng phòng Kỹ thuật & Dòng tiền"),
      "Trưởng phòng Kỹ thuật & Dòng tiền",
    );
    assert.equal(personLabelOr(vi as any, "technical-analysis-agent", "Kỹ thuật & Thời điểm"), "Kỹ thuật & Thời điểm");
  });

  it("phòng và nhân viên đã có trong bảng nhãn vẫn dùng nhãn của bảng", () => {
    assert.equal(orgUnitLabelOr(vi as any, "finance", "Tên khác"), (vi as any).clusters.finance);
    assert.equal(personLabelOr(vi as any, "ceo-agent", "Tên khác"), "CEO");
  });

  it("máy chủ không có tên thì vẫn như cũ (mã kèm trong ngoặc), không ném lỗi", () => {
    assert.equal(orgUnitLabelOr(vi as any, "zzz_unit", ""), "Chưa xác định (zzz_unit)");
    assert.equal(orgUnitLabelOr(vi as any, "zzz_unit", undefined), "Chưa xác định (zzz_unit)");
    assert.equal(orgUnitLabelOr(vi as any, null, "x"), "");
  });

  it("danh sách tên chung của máy chủ: mọi màn tra nhãn đều dùng khi bảng cố định không có mã", () => {
    try {
      setServerNames({
        people: { "red-team-agent": "Phản biện" },
        units: { risk_management: "Quản trị Rủi ro" },
      });
      assert.equal(personLabel(vi as any, "red-team-agent"), "Phản biện");
      assert.equal(personLabelNeutral(vi as any, "red-team-agent"), "Phản biện");
      assert.equal(personLabelWithCode(vi as any, "red-team-agent"), "Phản biện (red-team-agent)");
      assert.equal(orgUnitLabel(vi as any, "risk_management"), "Quản trị Rủi ro");
      assert.equal(clusterLabel(vi as any, "risk_management"), "Quản trị Rủi ro");
      assert.equal(clusterLabelWithCode(vi as any, "risk_management"), "Quản trị Rủi ro (risk_management)");
      // bảng cố định vẫn thắng
      assert.equal(personLabel(vi as any, "ceo-agent"), "CEO");
      // mã máy chủ cũng không biết thì giữ nhãn cũ
      assert.equal(personLabel(vi as any, "ghost-agent"), "Chưa xác định (ghost-agent)");
    } finally {
      clearServerNames();
    }
    assert.equal(personLabel(vi as any, "red-team-agent"), "Chưa xác định (red-team-agent)");
  });

  it("dữ liệu hỏng từ máy chủ không làm hỏng nhãn", () => {
    try {
      setServerNames({ people: { a: 5, b: "  ", c: null }, units: "x" });
      assert.equal(personLabel(vi as any, "a"), "Chưa xác định (a)");
      assert.equal(personLabel(vi as any, "b"), "Chưa xác định (b)");
      setServerNames(null);
      assert.equal(orgUnitLabel(vi as any, "zzz"), "Chưa xác định (zzz)");
    } finally {
      clearServerNames();
    }
  });

  it("nhãn thẻ chưa duyệt không dùng chữ «nháp» dễ hiểu nhầm là nhân viên chưa hoạt động", () => {
    assert.equal((vi as any).orgChart.draftCardBadge, "Chờ duyệt vai trò");
    assert.doesNotMatch(JSON.stringify((vi as any).orgChart.detail.roleCardSourceDraft), /nháp/i);
  });
});

// Lỗi thật (máy 218): thẻ Trưởng phòng hiện cùng một chuỗi hai lần vì tên hiển thị và chức danh trong thẻ vai trò giống hệt nhau.
describe("Cây tổ chức — không in cùng một chuỗi hai lần trong thẻ", () => {
  it("tên và chức danh giống nhau (bỏ khác khoảng trắng, hoa thường) thì coi là trùng", () => {
    assert.equal(sameLabelText("Trưởng phòng Khách hàng và Kỷ luật", "Trưởng phòng Khách hàng và Kỷ luật"), true);
    assert.equal(sameLabelText("Trưởng phòng  Khách hàng và Kỷ luật ", "trưởng phòng khách hàng và kỷ luật"), true);
  });

  it("khác nhau, hoặc rỗng, thì không coi là trùng", () => {
    assert.equal(sameLabelText("Chấm điểm & Định giá", "Bộ phận Định giá"), false);
    assert.equal(sameLabelText("", ""), false);
    assert.equal(sameLabelText(undefined, null), false);
    assert.equal(sameLabelText("CEO", "Trưởng phòng"), false);
  });
});
