"""Hermes adapter for one QR-authenticated Zalo personal account."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import shutil
import subprocess
from contextlib import suppress
from pathlib import Path
from typing import Any, Optional

from gateway.config import Platform
from gateway.platforms.base import BasePlatformAdapter, MessageEvent, MessageType, SendResult

from .runtime import (HANDOFF_MARKER, PENDING_TYPING_INTERVAL_SECONDS, RESUME_PHRASES, StateStore, credential_identity, credential_path, kanban_db_paths, needs_handoff,
                      pending_kanban_chats, safe_id, split_text, status_notices_due)

logger = logging.getLogger(__name__)
SIDECAR_READY_TIMEOUT_SECONDS = 20


def _extra(config: Any) -> dict[str, Any]:
    return dict(getattr(config, "extra", {}) or {})


class ZaloPersonalAdapter(BasePlatformAdapter):
    # Bộ thông báo Kanban không gửi từng tin «✔ … done» của thẻ con vào chat Zalo (Chủ tịch 04/11/2026); người hỏi chỉ nhận câu trả lời cuối + tin trạng thái ngắn.
    suppress_kanban_pings = True

    def __init__(self, config: Any) -> None:
        super().__init__(config=config, platform=Platform("zalo_personal"))
        self.extra = _extra(config)
        self.state = StateStore()
        self.plugin_dir = Path(__file__).parent
        self.sidecar_file = self.plugin_dir / "sidecar" / "sidecar.mjs"
        self.process: asyncio.subprocess.Process | None = None
        self.reader_task: asyncio.Task | None = None
        self.pending_typing_task: asyncio.Task | None = None
        self.status_task: asyncio.Task | None = None
        self.ready = asyncio.Event()
        self.own_id = ""
        self.thread_types: dict[str, str] = {}
        self.pending: dict[str, asyncio.Future] = {}
        self.request_counter = 0

    @property
    def enforces_own_access_policy(self) -> bool:
        """DM/group allowlists are enforced before events reach Hermes."""
        return True

    async def connect(self, *, is_reconnect: bool = False) -> bool:
        if not credential_path().exists():
            self._set_fatal_error("not_logged_in", "Chưa đăng nhập Zalo; chạy `<profile> zalo_personal login`.", retryable=False)
            return False
        if not await asyncio.to_thread(self._ensure_dependencies):
            self._set_fatal_error("sidecar_dependencies", "Chưa cài được zca-js; chạy `<profile> zalo_personal install`.", retryable=False)
            return False
        # One Zalo session = one listener; the lock identity is the session itself, so two profiles that
        # share a credentials.json cannot both listen (gateway/AGENTS.md "Token locks").
        if not self._acquire_platform_lock("zalo_personal", credential_identity(), "Zalo personal session"):
            return False
        try:
            self.process = await asyncio.create_subprocess_exec(
                "node", str(self.sidecar_file), "serve", "--credentials", str(credential_path()),
                cwd=str(self.plugin_dir), stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            self.reader_task = asyncio.create_task(self._read_sidecar())
            await asyncio.wait_for(self.ready.wait(), timeout=SIDECAR_READY_TIMEOUT_SECONDS)
        except Exception as exc:
            await self._stop_sidecar()
            self._release_platform_lock()
            self._set_fatal_error("sidecar_start", f"Không khởi động được Zalo cá nhân: {exc}", retryable=True)
            return False
        self._mark_connected()
        self.pending_typing_task = asyncio.create_task(self._pending_typing_loop())
        self.status_task = asyncio.create_task(self._status_notice_loop())
        logger.info("Zalo personal connected account=%s", safe_id(self.own_id))
        return True

    async def disconnect(self) -> None:
        self._mark_disconnected()
        if self.status_task:
            self.status_task.cancel()
            with suppress(asyncio.CancelledError, Exception): await self.status_task
            self.status_task = None
        if self.pending_typing_task:
            self.pending_typing_task.cancel()
            with suppress(asyncio.CancelledError, Exception): await self.pending_typing_task
            self.pending_typing_task = None
        await self._stop_sidecar()
        self._release_platform_lock()
        self.state.close()

    def _thread_type(self, chat_id: str) -> str:
        """Loại cuộc chat: đã biết từ tin đến thì dùng; chưa biết (gửi chủ động, vd bản tin sáng vào nhóm, sau khi dịch vụ khởi động lại) thì nhóm nào có trong
        `allowed_groups` là «group», còn lại «user». Trước đây mặc định luôn là «user» nên gửi chủ động vào nhóm sẽ sai loại."""
        known = self.thread_types.get(chat_id)
        if known:
            return known
        groups = (getattr(self, "extra", None) or {}).get("allowed_groups", {}) or {}
        return "group" if isinstance(groups, dict) and str(chat_id) in {str(k) for k in groups} else "user"

    async def send(self, chat_id: str, content: str, reply_to: Optional[str] = None, metadata: Optional[dict[str, Any]] = None) -> SendResult:
        handoff = HANDOFF_MARKER in (content or "")
        visible = (content or "").replace(HANDOFF_MARKER, "").strip()
        sender_id = str((metadata or {}).get("sender_id") or "*")
        if handoff:
            self.state.pause(chat_id, sender_id)
        last_message_id = ""
        try:
            parts = [p for p in re.split(r"\s*<<<TIN-MOI>>>\s*", visible) if p.strip()] or [visible]       # bản tin sáng: mỗi mục một tin riêng
            for chunk in [c for part in parts for c in split_text(part)]:
                result = await self._request({"op": "send", "threadId": chat_id, "threadType": self._thread_type(chat_id), "text": chunk})
                message_id = str(result.get("messageId") or "")
                if message_id:
                    self.state.record_bot_message(message_id)
                    last_message_id = message_id
            return SendResult(success=True, message_id=last_message_id or None)
        except Exception as exc:
            logger.warning("Zalo personal send failed customer=%s error=%s", safe_id(chat_id), exc)
            return SendResult(success=False, error="Không gửi được phản hồi qua Zalo")

    async def send_typing(self, chat_id: str, metadata: Optional[dict[str, Any]] = None) -> None:
        """Hiện «đang soạn tin» trên Zalo trong lúc agent soạn câu trả lời (gateway gọi lại mỗi vài giây). Không bao giờ ném lỗi."""
        if not chat_id or not self.process or self.process.returncode is not None:
            return
        try:
            await self._request({"op": "typing", "threadId": chat_id, "threadType": self._thread_type(chat_id)})
        except Exception as exc:  # noqa: BLE001
            logger.debug("Zalo personal typing skipped customer=%s error=%s", safe_id(chat_id), exc)

    async def _pending_typing_loop(self) -> None:
        """Giữ «đang soạn tin» cho các cuộc chat đang chờ thẻ Kanban chưa xong (tối đa PENDING_TYPING_MAX_SECONDS kể từ lúc tạo thẻ). Không bao giờ làm sập adapter."""
        while True:
            try:
                await asyncio.sleep(PENDING_TYPING_INTERVAL_SECONDS)
                if not self.process or self.process.returncode is not None:
                    continue
                chats = await asyncio.to_thread(lambda: pending_kanban_chats(kanban_db_paths()))
                for chat_id, thread_type in chats.items():
                    self.thread_types.setdefault(chat_id, thread_type)
                    await self.send_typing(chat_id)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                logger.debug("Zalo personal pending typing skipped error=%r", exc)

    async def _status_notice_loop(self) -> None:
        """Mỗi phút: yêu cầu tư vấn nào chờ quá 15 / 30 phút mà chưa có kết quả thì nhắn đúng một tin trạng thái cho mức đó. Không bao giờ làm sập adapter."""
        while True:
            try:
                await asyncio.sleep(60)
                if not self.process or self.process.returncode is not None:
                    continue
                due = await asyncio.to_thread(lambda: status_notices_due(kanban_db_paths(), self.state))
                for item in due:
                    self.thread_types.setdefault(item["chat_id"], item["thread_type"])
                    result = await self.send(item["chat_id"], item["text"])
                    if result.success:
                        for task_id in item.get("task_ids") or [item["task_id"]]:
                            self.state.mark_notice(task_id, item["level"])
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                logger.debug("Zalo personal status notice skipped error=%r", exc)

    async def get_chat_info(self, chat_id: str) -> dict[str, Any]:
        return {"chat_id": chat_id, "type": self._thread_type(chat_id), "name": chat_id}

    async def _read_sidecar(self) -> None:
        assert self.process and self.process.stdout
        try:
            while line := await self.process.stdout.readline():
                try:
                    payload = json.loads(line.decode("utf-8"))
                except json.JSONDecodeError:
                    continue
                kind = payload.get("type")
                if kind == "ready":
                    self.own_id = str(payload.get("ownId") or "")
                    self.ready.set()
                elif kind == "result":
                    future = self.pending.pop(str(payload.get("id") or ""), None)
                    if future and not future.done():
                        future.set_result(payload)
                elif kind == "event":
                    await self._on_event(dict(payload.get("event") or {}))
                elif kind == "fatal":
                    logger.warning("Zalo personal sidecar fatal: %s", payload.get("error", "unknown"))
                    break
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.warning("Zalo personal sidecar reader ended: %s", exc)
        finally:
            for future in self.pending.values():
                if not future.done(): future.set_exception(RuntimeError("Zalo sidecar stopped"))
            self.pending.clear()
            if self.process and self.process.returncode is None and self.is_connected:
                self._set_fatal_error("sidecar_stopped", "Zalo sidecar đã dừng; gateway sẽ thử kết nối lại.", retryable=True)

    async def _on_event(self, event: dict[str, Any]) -> None:
        thread_id, thread_type = str(event.get("threadId") or ""), str(event.get("threadType") or "user")
        sender_id, message_id = str(event.get("senderId") or ""), str(event.get("messageId") or "")
        if not thread_id: return
        self.thread_types[thread_id] = thread_type
        if sender_id: self.state.record_peer(thread_id, thread_type, sender_id, str(event.get("displayName") or ""))
        if event.get("isSelf"):
            if not event.get("isBot") and not self.state.is_bot_message(message_id):
                self.state.pause(thread_id, "*")
                logger.info("Zalo personal manual takeover thread=%s", safe_id(thread_id))
            return
        if not sender_id or not self.state.claim_event(message_id): return
        if not self._allowed(event):
            logger.info("Zalo personal denied sender=%s thread=%s", safe_id(sender_id), safe_id(thread_id))
            return
        text = event.get("text") if event.get("isText") else None
        if text is None:
            self.state.pause(thread_id, sender_id)
            await self._send_fixed(thread_id, thread_type, "Mình đã nhận được nội dung và chuyển người phụ trách hỗ trợ trực tiếp nhé.")
            return
        text = str(text).strip()
        normalized = " ".join(text.lower().split())
        if normalized in RESUME_PHRASES:
            self.state.resume(thread_id, sender_id)
            await self._send_fixed(thread_id, thread_type, "Mình đã quay lại hỗ trợ. Anh/chị cần hỏi gì thêm ạ?")
            return
        if self.state.is_paused(thread_id, sender_id): return
        if needs_handoff(text, self.extra.get("handoff_terms")):      # extra.handoff_terms: danh sách tuỳ chỉnh; [] = tắt (agent tự xử lý mọi tin chữ)
            self.state.pause(thread_id, sender_id)
            await self._send_fixed(thread_id, thread_type, "Mình đã chuyển người phụ trách hỗ trợ trực tiếp. Anh/chị có thể nhắn thêm chi tiết tại đây nhé.")
            return
        source = self.build_source(
            chat_id=thread_id, chat_name=thread_id, chat_type="group" if thread_type == "group" else "dm",
            user_id=sender_id, user_name=str(event.get("displayName") or sender_id),
        )
        await self.handle_message(MessageEvent(text=text, message_type=MessageType.TEXT, source=source, raw_message=event, message_id=message_id))

    async def _send_fixed(self, thread_id: str, thread_type: str, text: str) -> None:
        try:
            result = await self._request({"op": "send", "threadId": thread_id, "threadType": thread_type, "text": text})
            self.state.record_bot_message(str(result.get("messageId") or ""))
        except Exception as exc:
            logger.warning("Zalo personal fixed reply failed thread=%s error=%s", safe_id(thread_id), repr(exc))      # repr: lỗi hết giờ có chuỗi rỗng, trước đây không đọc ra

    def _allowed(self, event: dict[str, Any]) -> bool:
        thread_type, thread_id, sender_id = str(event.get("threadType") or "user"), str(event.get("threadId") or ""), str(event.get("senderId") or "")
        if thread_type != "group":
            return sender_id in {str(item) for item in self.extra.get("allowed_users", [])}
        groups = self.extra.get("allowed_groups", {}) or {}
        group_config = groups.get(thread_id) if isinstance(groups, dict) else None
        if not isinstance(group_config, dict) or not group_config.get("enabled", False): return False
        return not group_config.get("require_mention", True) or self.own_id in {str(value) for value in event.get("mentions", [])}

    async def _request(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.process or not self.process.stdin or self.process.returncode is not None:
            raise RuntimeError("Zalo sidecar chưa sẵn sàng")
        self.request_counter += 1
        request_id = str(self.request_counter)
        future: asyncio.Future = asyncio.get_running_loop().create_future()
        self.pending[request_id] = future
        self.process.stdin.write((json.dumps({**payload, "id": request_id}, ensure_ascii=False) + "\n").encode("utf-8"))
        await self.process.stdin.drain()
        result = await asyncio.wait_for(future, timeout=30)
        if not result.get("ok"): raise RuntimeError(str(result.get("error") or "Zalo request failed"))
        return result

    async def _stop_sidecar(self) -> None:
        if self.reader_task:
            self.reader_task.cancel()
            with suppress(asyncio.CancelledError, Exception): await self.reader_task
            self.reader_task = None
        if self.process:
            if self.process.returncode is None:
                with suppress(Exception): self.process.terminate()
                with suppress(Exception): await asyncio.wait_for(self.process.wait(), timeout=5)
            self.process = None

    def _ensure_dependencies(self) -> bool:
        if not shutil.which("node") or not self.sidecar_file.exists(): return False
        if (self.plugin_dir / "node_modules" / "zca-js").exists(): return True
        npm = "npm.cmd" if os.name == "nt" else "npm"
        result = subprocess.run([npm, "ci", "--omit=dev", "--ignore-scripts"], cwd=self.plugin_dir, capture_output=True, text=True, timeout=180)
        if result.returncode != 0:
            logger.warning("Zalo personal dependency setup failed: %s", result.stderr[-300:])
            return False
        return (self.plugin_dir / "node_modules" / "zca-js").exists()


def check_requirements() -> bool:
    return shutil.which("node") is not None


def validate_config(config: Any) -> bool:
    return credential_path().exists()


def is_connected(config: Any) -> bool:
    return credential_path().exists()


def register(ctx: Any) -> None:
    ctx.register_platform(
        name="zalo_personal", label="Zalo Personal", adapter_factory=lambda config: ZaloPersonalAdapter(config),
        check_fn=check_requirements, validate_config=validate_config, is_connected=is_connected,
        max_message_length=1800, emoji="💬", pii_safe=True, allow_update_command=False,
        platform_hint="Bạn đang trả lời qua Zalo cá nhân. Trả lời ngắn gọn bằng tiếng Việt, không dùng Markdown phức tạp.",
    )
