import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { Zalo, ThreadType, LoginQRCallbackEventType } from "zca-js";
import { normalizeMessage, publicGroup } from "./protocol.mjs";

const [, , mode, ...args] = process.argv;
const valueOf = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const credentialsFile = valueOf("--credentials");
const qrFile = valueOf("--qr-path");
const groupLink = valueOf("--link");

function emit(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function atomicWrite(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value), { encoding: "utf8", mode: 0o600 });
  await fs.rename(temp, file);
}

async function loggedInApi() {
  if (!credentialsFile) throw new Error("missing credentials path");
  const credentials = JSON.parse(await fs.readFile(credentialsFile, "utf8"));
  return new Zalo().login(credentials);
}

async function login() {
  if (!credentialsFile || !qrFile) throw new Error("missing login paths");
  const zalo = new Zalo();
  const api = await zalo.loginQR({ qrPath: qrFile }, async (event) => {
    if (event.type === LoginQRCallbackEventType.QRCodeGenerated) {
      await event.actions.saveToFile(qrFile);
      emit({ type: "qr", path: qrFile });
    }
    if (event.type === LoginQRCallbackEventType.QRCodeScanned) emit({ type: "scanned" });
    if (event.type === LoginQRCallbackEventType.GotLoginInfo) await atomicWrite(credentialsFile, event.data);
  });
  emit({ type: "logged_in", ownId: String(api.getOwnId()) });
}

async function groups() {
  const api = await loggedInApi();
  const all = await api.getAllGroups();
  const ids = Object.keys(all?.gridVerMap ?? {});
  const details = ids.length ? await api.getGroupInfo(ids) : { gridInfoMap: {} };
  const infoMap = details?.gridInfoMap ?? {};
  emit({ type: "groups", groups: ids.map((id) => publicGroup(id, infoMap[id])).sort((a, b) => a.name.localeCompare(b.name, "vi")) });
}

async function resolveGroup() {
  if (!groupLink) throw new Error("missing Zalo group link");
  const api = await loggedInApi();
  const detail = await api.getGroupLinkInfo({ link: groupLink });
  emit({ type: "group", group: publicGroup(detail.groupId, detail) });
}

async function serve() {
  const api = await loggedInApi();
  const ownId = String(api.getOwnId());
  const sentIds = new Set();
  api.listener.on("message", (message) => {
    const payload = normalizeMessage(message);
    payload.event.isBot = payload.event.isSelf && sentIds.has(payload.event.messageId);
    emit(payload);
  });
  api.listener.on("connected", () => emit({ type: "status", status: "connected" }));
  api.listener.on("closed", (code, reason) => emit({ type: "status", status: "closed", code, reason: String(reason ?? "") }));
  api.listener.on("error", (error) => emit({ type: "status", status: "error", error: String(error?.message ?? error) }));
  api.listener.start({ retryOnClose: true });
  emit({ type: "ready", ownId });

  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  input.on("line", async (line) => {
    let request;
    try { request = JSON.parse(line); } catch { return; }
    try {
      if (request.op === "send") {
        const threadType = request.threadType === "group" ? ThreadType.Group : ThreadType.User;
        const result = await api.sendMessage({ msg: String(request.text ?? "") }, String(request.threadId), threadType);
        const messageId = String(result?.message?.msgId ?? "");
        if (messageId) sentIds.add(messageId);
        emit({ type: "result", id: request.id, ok: true, messageId });
      } else if (request.op === "typing") {
        // Báo «đang soạn tin» cho người nhận; lỗi (hạn mức, mất mạng) chỉ trả ok:false, không làm sập bộ lắng nghe.
        const threadType = request.threadType === "group" ? ThreadType.Group : ThreadType.User;
        await api.sendTypingEvent(String(request.threadId), threadType);
        emit({ type: "result", id: request.id, ok: true });
      } else if (request.op === "stop") {
        api.listener.stop();
        emit({ type: "result", id: request.id, ok: true });
        process.exit(0);
      } else {
        emit({ type: "result", id: request.id, ok: false, error: "unsupported operation" });
      }
    } catch (error) {
      emit({ type: "result", id: request.id, ok: false, error: String(error?.message ?? error) });
    }
  });
}

try {
  if (mode === "login") await login();
  else if (mode === "groups") await groups();
  else if (mode === "resolve-group") await resolveGroup();
  else if (mode === "serve") await serve();
  else throw new Error("usage: sidecar.mjs login|groups|resolve-group|serve");
} catch (error) {
  emit({ type: "fatal", error: String(error?.message ?? error) });
  process.exitCode = 1;
}
