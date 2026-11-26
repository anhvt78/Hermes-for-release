import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prettyAlertBody } from "../src/lib/alertText";

const NL = String.fromCharCode(10);

describe("prettyAlertBody — dịch nhãn kỹ thuật thô trong cảnh báo (21/11/2026)", () => {
  it("bản thử -31 hiện thô «type: decision_request / Question id: Q1 / Source card: …» → tiếng Việt", () => {
    const raw = ["type: decision_request", "question_id: Q1", "source_card: t_b4fa2b2a", "source_dossier: t_279d4ce3"].join(NL);
    assert.equal(prettyAlertBody(raw), ["Loại: yêu cầu quyết định", "Mã câu hỏi: Q1", "Thẻ nguồn: t_b4fa2b2a", "Hồ sơ nguồn: t_279d4ce3"].join(NL));
  });

  it("khoá không có gạch dưới nhưng đã biết (quarter, proposals, pattern, evidence…) cũng được dịch", () => {
    assert.equal(prettyAlertBody("quarter: 2026-Q4"), "Quý: 2026-Q4");
    assert.equal(prettyAlertBody("proposals: Giao HR rà quy định"), "Đề xuất: Giao HR rà quy định");
    assert.equal(prettyAlertBody("evidence: số liệu 20/8"), "Bằng chứng: số liệu 20/8");
  });

  it("khoá tiếng Việt không dấu của nhân viên (mau_hinh, hai_phuong_an, da_lam…) có nhãn có dấu", () => {
    assert.equal(prettyAlertBody("mau_hinh: lặp lại"), "Mẫu hình: lặp lại");
    assert.equal(prettyAlertBody("hai_phuong_an: A hoặc B"), "Hai phương án: A hoặc B");
    assert.equal(prettyAlertBody("da_lam: đã rà"), "Đã làm: đã rà");
  });

  it("giá trị mã chỉ dịch ở khoá Loại / Mức độ; nơi khác giữ nguyên", () => {
    assert.equal(prettyAlertBody("severity: warn"), "Mức độ: cảnh báo");
    assert.equal(prettyAlertBody("card: decision_request"), "Thẻ: decision_request");
    assert.equal(prettyAlertBody("type: something_new"), "Loại: something_new");   // giá trị lạ giữ nguyên
  });

  it("vẫn như cũ: khoá cũ đã biết, khoá lạ có gạch dưới, «http:» không đụng, bỏ dòng mã sự kiện", () => {
    assert.equal(prettyAlertBody("khop: 9"), "Khớp: 9");
    assert.equal(prettyAlertBody("cheo_kiem_8_the: ok"), "Cheo kiem 8 the: ok");
    assert.equal(prettyAlertBody("http: không phải khoá"), "http: không phải khoá");
    assert.equal(prettyAlertBody(["nội dung", "(mã sự kiện: ev_861ba4246b9e4e)"].join(NL)), "nội dung");
  });
});
