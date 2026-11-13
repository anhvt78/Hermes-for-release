import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { friendlyApiError, cleanServerSentence, errStatus, humanizeApiError } from "../src/lib/api-error";

// t giả lập tối thiểu để chạy friendlyApiError
const t = {
  common: {
    apiError: {
      errApiUnauthorized: "Not authorized.",
      errApiAccessDenied: "Chairman permission required.",
      errApiNotFound: "Resource not found.",
      errApiInvalid: "Invalid data.",
      errApiServer: "Server error. Please try again.",
      errApiNetwork: "Could not connect to server.",
      errApiGenericStatus: (s: string) => `Error (code ${s}).`,
    },
  },
  goalTree: {
    errApiGoalNotFound: "Goal not found.",
    errApiProposalNotFound: "Proposal not found.",
    errApiProposalAlreadyDecided: "Proposal already processed.",
    errApiProposalIncomplete: (fields: string) => `Missing fields: ${fields}.`,
    errApiParentProposalNotApproved: "Parent proposal not approved.",
    errApiCompanyGoalMustBeRoot: "Company goal must be root.",
    errApiParentGoalNotFound: "Parent goal not found.",
    errApiCircularGoalDependency: "Circular dependency.",
    errApiGoalHasChildren: "Goal has children.",
    errApiAccessDenied: "Chairman access denied.",
    errApiTaskNotFound: "Task not found.",
    errApiAgentNotProvisioned: "Agent not provisioned.",
    errApiBridge: (reason: string) => `Bridge error: ${reason}.`,
    errApiGenericStatus: (s: string) => `HTTP ${s} error.`,
  },
};

describe("friendlyApiError — ánh xạ lỗi API thành câu thân thiện", () => {
  it("500 body thô → errApiServer (không hiện JSON)", () => {
    const msg = friendlyApiError('500: {"detail":"no such table: goals"}', t);
    assert.equal(msg, t.common.apiError.errApiServer);
    assert.ok(!msg.includes("{"), "Không được chứa JSON");
    assert.ok(!msg.includes("no such table"), "Không được lộ lỗi kỹ thuật");
  });

  it("TypeError (Failed to fetch) → errApiNetwork", () => {
    const msg = friendlyApiError(new TypeError("Failed to fetch"), t);
    assert.equal(msg, t.common.apiError.errApiNetwork);
  });

  it("chuỗi 'Failed to fetch' → errApiNetwork", () => {
    const msg = friendlyApiError("Failed to fetch", t);
    assert.equal(msg, t.common.apiError.errApiNetwork);
  });

  it("401 → errApiUnauthorized", () => {
    const msg = friendlyApiError('401: {"detail":"Unauthorized"}', t);
    assert.equal(msg, t.common.apiError.errApiUnauthorized);
  });

  it("403 không có errorCode → goalTree.errApiAccessDenied", () => {
    const msg = friendlyApiError('403: {"detail":"Forbidden"}', t);
    assert.equal(msg, t.goalTree.errApiAccessDenied);
  });

  it("403 với errorCode AccessDenied → goalTree.errApiAccessDenied", () => {
    const msg = friendlyApiError('403: {"detail":{"error":"AccessDenied"}}', t);
    assert.equal(msg, t.goalTree.errApiAccessDenied);
  });

  it("404 → errApiNotFound", () => {
    const msg = friendlyApiError('404: {"detail":"Not Found"}', t);
    assert.equal(msg, t.common.apiError.errApiNotFound);
  });

  it("422 → errApiInvalid", () => {
    const msg = friendlyApiError('422: {"detail":"Validation error"}', t);
    assert.equal(msg, t.common.apiError.errApiInvalid);
  });

  it("502 → errApiServer", () => {
    const msg = friendlyApiError('502: {"detail":"Bad Gateway"}', t);
    assert.equal(msg, t.common.apiError.errApiServer);
  });

  it("503 → errApiServer", () => {
    const msg = friendlyApiError('503: {}', t);
    assert.equal(msg, t.common.apiError.errApiServer);
  });

  it("504 → errApiServer", () => {
    const msg = friendlyApiError('504: {}', t);
    assert.equal(msg, t.common.apiError.errApiServer);
  });

  it("mã lỗi GoalNotFound → goalTree.errApiGoalNotFound", () => {
    const msg = friendlyApiError('404: {"detail":{"error":"GoalNotFound"}}', t);
    assert.equal(msg, t.goalTree.errApiGoalNotFound);
  });

  it("mã lỗi ProposalIncomplete có missing_fields → câu dịch kèm tên trường", () => {
    const msg = friendlyApiError('422: {"detail":{"error":"ProposalIncomplete","missing_fields":["title","owner"]}}', t);
    assert.ok(msg.includes("title"), "Cần kèm tên trường thiếu");
    assert.ok(msg.includes("owner"), "Cần kèm tên trường thiếu");
  });

  it("mã lỗi TaskNotFound → goalTree.errApiTaskNotFound", () => {
    const msg = friendlyApiError('404: {"detail":{"error":"TaskNotFound"}}', t);
    assert.equal(msg, t.goalTree.errApiTaskNotFound);
  });

  it("mã lỗi AGENT_NOT_PROVISIONED → goalTree.errApiAgentNotProvisioned", () => {
    const msg = friendlyApiError('503: {"detail":{"error":"AGENT_NOT_PROVISIONED"}}', t);
    assert.equal(msg, t.goalTree.errApiAgentNotProvisioned);
  });

  it("mã lỗi BRIDGE_ERROR → goalTree.errApiBridge", () => {
    const msg = friendlyApiError('503: {"detail":{"error":"BRIDGE_ERROR","reason":"timeout"}}', t);
    assert.ok(msg.includes("Bridge"), "Cần dùng câu errApiBridge");
  });

  it("BRIDGE_ERROR có câu thân thiện → không đưa mã BRIDGE_ERROR cho người dùng", () => {
    const t2 = { ...t, goalTree: { ...t.goalTree, errApiBridgeUnavailable: "CEO chưa trả lời được, thử lại sau ít phút." } };
    const msg = friendlyApiError('502: {"detail":{"error":"BRIDGE_ERROR","message":"CEO Agent could not respond."}}', t2 as any);
    assert.equal(msg, "CEO chưa trả lời được, thử lại sau ít phút.");
    assert.ok(!msg.includes("BRIDGE_ERROR"));
  });

  it("PROVIDER_PAUSED → câu máy chủ gửi sẵn (nêu rõ hết số dư)", () => {
    const body = JSON.stringify({ detail: { error: "PROVIDER_PAUSED", message: "AI provider is out of balance.", message_vi: "Nhà cung cấp AI «deepseek» đang hết số dư.", message_en: "The AI provider is out of balance." } });
    const msg = friendlyApiError("502: " + body, t as any);
    assert.ok(msg.includes("hết số dư") || msg.includes("out of balance"), msg);
  });

  it("mã HTTP không xác định (418) → errApiGenericStatus (không lộ body)", () => {
    const msg = friendlyApiError('418: {"detail":"I am a teapot"}', t);
    assert.ok(msg.includes("418"), "Cần kèm mã HTTP");
    assert.ok(!msg.includes("teapot"), "Không được lộ body");
  });
});

// ── Lỗi từ lớp API mới của dashboard (ApiError): .message chỉ là câu, mã trạng thái nằm ở .status, thân phản hồi ở .body ──
class FakeApiError extends Error {
  constructor(message: string, public status: number, public body: string) { super(message); }
}
const tViet = { ...t, common: { apiError: { ...t.common.apiError, errApiConflict: "Xung đột, hãy tải lại.", errApiTooMany: "Quá nhanh." } } };

describe("friendlyApiError — lỗi ApiError (mã trạng thái ở .status)", () => {
  it("câu tiếng Việt của máy chủ được dùng thẳng, bỏ mã ở đầu câu", () => {
    const sentence = "KANBAN_PROPOSAL_STATE: đề xuất 'kbp_1' đã được thay bằng bản mới hơn nên không còn duyệt được.";
    const e = new FakeApiError(sentence, 409, JSON.stringify({ detail: { error: "ProposalStateError", message: sentence } }));
    assert.equal(friendlyApiError(e, tViet), "đề xuất 'kbp_1' đã được thay bằng bản mới hơn nên không còn duyệt được.");
  });

  it("câu tiếng Việt có mã ở cuối ([AGENT_EXISTS]) → bỏ mã, giữ lời giải thích; thân phản hồi dạng {error:{code,message}}", () => {
    const sentence = "Đã có nhân viên mã «sales-3». Hãy chọn mã khác. [AGENT_EXISTS]";
    const e = new FakeApiError(sentence, 409, JSON.stringify({ error: { code: "AGENT_EXISTS", message: sentence } }));
    assert.equal(friendlyApiError(e, tViet), "Đã có nhân viên mã «sales-3». Hãy chọn mã khác.");
  });

  it("409 chỉ có câu tiếng Anh → câu xung đột bằng tiếng Việt, không hiện «Không kết nối được máy chủ»", () => {
    const e = new FakeApiError("That change conflicts with the current state on the server.", 409, "{}");
    assert.equal(friendlyApiError(e, tViet), tViet.common.apiError.errApiConflict);
    assert.notEqual(friendlyApiError(e, tViet), t.common.apiError.errApiNetwork);
  });

  it("500 và 422 vẫn ra câu chung; trạng thái 0 là lỗi mạng", () => {
    assert.equal(friendlyApiError(new FakeApiError("The Hermes service hit an internal error.", 500, ""), tViet), t.common.apiError.errApiServer);
    assert.equal(friendlyApiError(new FakeApiError("Some of the entered values are not valid.", 422, ""), tViet), t.common.apiError.errApiInvalid);
    assert.equal(friendlyApiError(new FakeApiError("Hermes dashboard cannot reach the Hermes service.", 0, ""), tViet), t.common.apiError.errApiNetwork);
  });

  it("mã nghiệp vụ đã biết vẫn ưu tiên câu có sẵn", () => {
    const e = new FakeApiError("Goal not found", 404, JSON.stringify({ detail: { error: "GoalNotFound", message: "Goal not found" } }));
    assert.equal(friendlyApiError(e, tViet), t.goalTree.errApiGoalNotFound);
  });

  it("cleanServerSentence, errStatus và humanizeApiError (chạy một lần, giữ .status)", () => {
    assert.equal(cleanServerSentence("API_KEY_REQUIRED: cần khoá [API_KEY_REQUIRED]"), "cần khoá");
    assert.equal(errStatus(new FakeApiError("x", 403, "")), 403);
    assert.equal(errStatus(new Error("409: {}")), 409);
    const e = new FakeApiError("The server could not find what the dashboard asked for.", 404, "");
    humanizeApiError(e, tViet);
    assert.equal(e.message, t.common.apiError.errApiNotFound);
    assert.equal(e.status, 404);
    humanizeApiError(e, tViet);
    assert.equal(e.message, t.common.apiError.errApiNotFound);
  });
});

describe("friendlyApiError — câu đã thân thiện không bị dịch lần hai; 403 nói đúng lý do", () => {
  it("chuỗi đã là câu thân thiện (tiếng Anh) được giữ nguyên, không thành «Không kết nối được máy chủ»", () => {
    assert.equal(friendlyApiError("Role 'member' is required for this meeting.", t), "Role 'member' is required for this meeting.");
    assert.equal(friendlyApiError("Chairman permission required.", t), "Chairman permission required.");
  });

  it("chuỗi thô vẫn được dịch như cũ (mã đầu câu, JSON, lỗi mạng của trình duyệt)", () => {
    assert.equal(friendlyApiError('500: {"detail":"x"}', t), t.common.apiError.errApiServer);
    assert.equal(friendlyApiError("HTTP 502", t), t.common.apiError.errApiServer);
    assert.equal(friendlyApiError("NetworkError when attempting to fetch resource.", t), t.common.apiError.errApiNetwork);
    assert.equal(friendlyApiError("", t), t.common.apiError.errApiNetwork);
  });

  it("403 kèm lời giải thích của máy chủ → hiện lời giải thích, không dùng câu chung «Chỉ Chủ tịch…»", () => {
    const err: any = new Error("You are not allowed to do that on this dashboard.");
    err.status = 403;
    err.body = JSON.stringify({ detail: { error: "forbidden", required_role: "member", message_vi: "Cần vai trò 'member' trong cuộc họp này.", message_en: "Role 'member' is required for this meeting." } });
    const msg = friendlyApiError(err, t);
    assert.equal(msg, "Role 'member' is required for this meeting.");            // môi trường kiểm thử: ngôn ngữ en
    assert.notEqual(msg, t.goalTree.errApiAccessDenied);
  });

  it("đường đi đầy đủ: lỗi 403 → humanizeApiError → hook giữ chuỗi → trang gọi friendlyApiError(chuỗi) vẫn ra đúng câu", () => {
    const err: any = new Error("You are not allowed to do that on this dashboard.");
    err.status = 403;
    err.body = JSON.stringify({ detail: { error: "forbidden", message_vi: "Cần vai trò 'member' trong cuộc họp này.", message_en: "Role 'member' is required for this meeting." } });
    humanizeApiError(err, t);
    const fromHook: string = err.message;                                           // usePoclipFetch chỉ giữ .message
    assert.equal(friendlyApiError(fromHook, t), "Role 'member' is required for this meeting.");
  });

  it("403 mang mã AccessDenied vẫn dùng câu quyền Chủ tịch như cũ", () => {
    const err: any = new Error("403");
    err.status = 403;
    err.body = JSON.stringify({ detail: { error: "AccessDenied", message_vi: "x", message_en: "y" } });
    assert.equal(friendlyApiError(err, t), t.goalTree.errApiAccessDenied);
  });
});
