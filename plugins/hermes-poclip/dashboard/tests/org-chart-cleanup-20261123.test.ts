import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseDraftGoal } from "../src/lib/draft-card";
import { actionLabel, waitLabel } from "../src/lib/org-escalation";
import { defaultCollapsedIds, shortUnitName } from "../src/lib/org-tree-view";

// «Cây tổ chức» — đợt rà soát 23/11/2026: dạng danh sách, thẻ nháp, câu leo thang, tên phòng

describe("parseDraftGoal — chuỗi mục tiêu của thẻ nháp (khớp draft_goal_of phía máy chủ)", () => {
  const withGoal = "(Thẻ nháp từ đề xuất đã duyệt) Trưởng phòng Thiết kế thuộc «design», báo cáo cho ceo-agent. Mục tiêu đề xuất: Điều phối nhóm thiết kế, chốt định hướng. Chỉ số đề xuất: Mọi dự án có định hướng ký trước; Mọi đầu ra qua phê bình. Chủ tịch cần xác nhận mục tiêu, đặt ngưỡng cho chỉ số và giới hạn quyền rồi lưu để duyệt.";
  it("rút đúng mục tiêu và chỉ số, bỏ câu mở đầu có mã và câu kết", () => {
    const r = parseDraftGoal(withGoal);
    assert.equal(r.kind, "proposal");
    assert.equal(r.goal, "Điều phối nhóm thiết kế, chốt định hướng.");
    assert.equal(r.kpis, "Mọi dự án có định hướng ký trước; Mọi đầu ra qua phê bình");
  });
  it("không có chỉ số vẫn rút được mục tiêu", () => {
    const r = parseDraftGoal("(Thẻ nháp từ đề xuất đã duyệt) A thuộc «x». Mục tiêu đề xuất: Làm việc A. Chủ tịch cần xác nhận mục tiêu.");
    assert.deepEqual([r.kind, r.goal, r.kpis], ["proposal", "Làm việc A.", ""]);
  });
  it("thẻ nháp tự sinh (chưa có mục tiêu) và thẻ thường", () => {
    assert.equal(parseDraftGoal("(Thẻ nháp tự sinh) A thuộc «x». Chưa có mục tiêu cụ thể — Chủ tịch cần bổ sung.").kind, "auto");
    assert.equal(parseDraftGoal("Điều phối nhóm thiết kế").kind, "none");
    assert.equal(parseDraftGoal(undefined).kind, "none");
  });
});

describe("câu leo thang bằng tiếng Việt", () => {
  it("mã hành động quen thuộc → nhãn; mã lạ dịch từng từ; câu chữ giữ nguyên", () => {
    assert.equal(actionLabel("escalate"), "chuyển lên");
    assert.equal(actionLabel("stop_and_escalate_immediately"), "dừng ngay và chuyển lên");
    assert.equal(actionLabel("stop_and_notify"), "dừng và báo");
    assert.equal(actionLabel("Báo cho trưởng phòng"), "Báo cho trưởng phòng");
    assert.equal(actionLabel(""), "");
  });
  it("thời gian chờ đọc được", () => {
    assert.equal(waitLabel(3600), "1 giờ");
    assert.equal(waitLabel(5400), "1,5 giờ");
    assert.equal(waitLabel(90), "2 phút");
    assert.equal(waitLabel(172800), "2 ngày");
    assert.equal(waitLabel(0), "");
  });
});

describe("sơ đồ: thu gọn mặc định và tên phòng", () => {
  const tree = [{ profile_id: "chu_tich", children: [
    { profile_id: "audit" },
    { profile_id: "ceo", children: [
      { profile_id: "design-lead", children: [{ profile_id: "w1" }, { profile_id: "w2" }] },
      { profile_id: "ops-lead" },
    ] },
  ] }];
  it("mở sẵn Chủ tịch → CEO → trưởng phòng; chỉ thu gọn nhánh nhân viên của trưởng phòng", () => {
    assert.deepEqual([...defaultCollapsedIds(tree)], ["design-lead"]);
  });
  it("bỏ phần tiếng Anh trong ngoặc cuối tên phòng", () => {
    assert.equal(shortUnitName("Thiết kế (Design Lead)"), "Thiết kế");
    assert.equal(shortUnitName("Khách hàng (Tiếp nhận)"), "Khách hàng (Tiếp nhận)");   // ngoặc tiếng Việt giữ nguyên
    assert.equal(shortUnitName("Nhân sự"), "Nhân sự");
  });
});

import { foldText } from "../src/lib/org-tree-view";

describe("ô tìm kiếm bỏ dấu tiếng Việt", () => {
  it("«thiet ke» khớp «Thiết kế»; chữ đ được gấp thành d", () => {
    assert.equal(foldText("Trưởng phòng Thiết kế"), "truong phong thiet ke");
    assert.ok(foldText("Đào tạo").includes("dao tao"));
    assert.equal(foldText(""), "");
  });
});
