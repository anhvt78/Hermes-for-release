export function normalizeMessage(message) {
  const data = message?.data ?? {};
  const type = String(message?.type ?? "").toLowerCase();
  const threadType = type === "1" || type === "group" ? "group" : "user";
  const content = typeof data.content === "string" ? data.content : null;
  return {
    type: "event",
    event: {
      threadId: String(message?.threadId ?? ""),
      threadType,
      senderId: String(data.uidFrom ?? data.userId ?? ""),
      displayName: String(data.dName ?? ""),
      messageId: String(data.msgId ?? data.cliMsgId ?? ""),
      text: content,
      isText: content !== null,
      isSelf: Boolean(message?.isSelf),
      mentions: Array.isArray(data.mentions) ? data.mentions.map((item) => String(item.uid ?? "")) : [],
    },
  };
}

export function publicGroup(groupId, info = {}) {
  return {
    id: String(groupId),
    name: String(info.name ?? "(không rõ tên)"),
    memberCount: Number(info.totalMember ?? 0),
  };
}
