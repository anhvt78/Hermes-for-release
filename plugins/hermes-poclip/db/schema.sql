-- hermes_poclip/db/schema.sql
-- Migration 001: hermes-poclip schema toàn bộ (ADR-01: PostgreSQL → SQLite)
-- 18 bảng theo thứ tự phụ thuộc
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================================
-- 1. MEETING TABLES (E.3)
-- Thứ tự: templates → meetings → sessions → members → turns
--         → minutes → action_items → watchdog_events
-- ============================================================

CREATE TABLE IF NOT EXISTS meeting_templates (
    id                              TEXT    PRIMARY KEY,
    template_type                   TEXT    NOT NULL UNIQUE
                                            CHECK(template_type IN ('standup','project','incident','strategy','recurring','retrospective')),
    template_name                   TEXT    NOT NULL,
    description                     TEXT,
    default_duration_minutes        INTEGER NOT NULL DEFAULT 30
                                            CHECK(default_duration_minutes BETWEEN 10 AND 180),
    speaking_mode                   TEXT    NOT NULL DEFAULT 'round_robin'
                                            CHECK(speaking_mode IN ('round_robin','random_free','hybrid')),
    discussion_rounds               INTEGER NOT NULL DEFAULT 2
                                            CHECK(discussion_rounds BETWEEN 0 AND 5),
    max_duration_minutes            INTEGER CHECK(max_duration_minutes IS NULL OR (max_duration_minutes BETWEEN 1 AND 1440)),
    stop_early_when                 TEXT    NOT NULL DEFAULT 'none'
                                            CHECK(stop_early_when IN ('consensus','chairman','none')),
    turn_timeout_seconds            INTEGER NOT NULL DEFAULT 180
                                            CHECK(turn_timeout_seconds BETWEEN 60 AND 420),
    allow_pass                      INTEGER NOT NULL DEFAULT 1,
    pass_conditions                 TEXT    CHECK(json_valid(pass_conditions)),
    speaking_priority               TEXT    NOT NULL DEFAULT 'by_role'
                                            CHECK(speaking_priority IN ('by_role','by_list','free')),
    priority_role_order             TEXT    CHECK(json_valid(priority_role_order)),
    quorum_type                     TEXT    NOT NULL DEFAULT 'count'
                                            CHECK(quorum_type IN ('count','percentage')),
    quorum_value                    REAL    NOT NULL DEFAULT 2,
    watchdog_enabled                INTEGER NOT NULL DEFAULT 1,
    watchdog_agent_timeout_sec      INTEGER NOT NULL DEFAULT 300,
    watchdog_session_timeout_sec    INTEGER NOT NULL DEFAULT 5400,
    watchdog_action                 TEXT    NOT NULL DEFAULT 'auto_pass'
                                            CHECK(watchdog_action IN ('auto_pass','pause_session','escalate')),
    chair_fallback                  TEXT    NOT NULL DEFAULT 'next_agent'
                                            CHECK(chair_fallback IN ('next_agent','pause_session')),
    kanban_bridge_mode              TEXT    NOT NULL DEFAULT 'manual'
                                            CHECK(kanban_bridge_mode IN ('auto','manual','disabled')),
    cron_expression                 TEXT,
    config_json                     TEXT    CHECK(json_valid(config_json)),
    is_active                       INTEGER NOT NULL DEFAULT 1,
    created_by                      TEXT    NOT NULL,
    created_at                      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_templates_type   ON meeting_templates (template_type);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_active ON meeting_templates (is_active);

-- ----

CREATE TABLE IF NOT EXISTS meetings (
    id                      TEXT    PRIMARY KEY,
    template_id             TEXT    NOT NULL REFERENCES meeting_templates(id),
    meeting_type            TEXT    NOT NULL,
    title                   TEXT    NOT NULL,
    description             TEXT,
    objective               TEXT,
    convened_by             TEXT    NOT NULL,
    content_chair_id        TEXT    NOT NULL,
    scheduled_start_at      TEXT,
    scheduled_end_at        TEXT,
    actual_start_at         TEXT,
    actual_end_at           TEXT,
    attachments             TEXT    CHECK(json_valid(attachments)),
    config_override         TEXT    CHECK(json_valid(config_override)),
    status                  TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK(status IN ('draft','in_progress','cancelled','completed')),
    risk_tier               TEXT    CHECK(risk_tier IN ('T0','T1','T2','T3')),
    related_goal_id         TEXT,
    related_kanban_board_id TEXT,
    tags                    TEXT    CHECK(json_valid(tags)),
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_template_id ON meetings (template_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status      ON meetings (status);

-- ----
-- meeting_sessions tham chiếu meeting_turns (circular FK — nullable, OK trong SQLite)

CREATE TABLE IF NOT EXISTS meeting_sessions (
    id                      TEXT    PRIMARY KEY,
    meeting_id              TEXT    NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    session_number          INTEGER NOT NULL DEFAULT 1,
    status                  TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK(status IN ('draft','invited','quorum_met','in_progress','discussing','summarizing','decided','closed','suspended','cancelled')),
    opened_at               TEXT,
    closed_at               TEXT,
    paused_at               TEXT,
    resumed_at              TEXT,
    quorum_required         INTEGER NOT NULL,
    quorum_reached_at       TEXT,
    quorum_member_count     INTEGER,
    current_round           INTEGER NOT NULL DEFAULT 0,
    total_rounds_planned    INTEGER NOT NULL,
    current_turn_id         TEXT    REFERENCES meeting_turns(id),
    effective_config        TEXT    NOT NULL CHECK(json_valid(effective_config)),
    outcome_summary         TEXT,
    outcome_citations_json  TEXT,
    is_adjourned            INTEGER NOT NULL DEFAULT 0,
    adjourned_reason        TEXT,
    invited_at              TEXT,
    cancelled_at            TEXT,
    cancelled_reason        TEXT,
    controller_state        TEXT    CHECK(json_valid(controller_state)),
    summarize_error          TEXT,
    summarize_attempts       INTEGER NOT NULL DEFAULT 0,
    max_duration_minutes    INTEGER,
    stop_early_when         TEXT,
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(meeting_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_meeting_id ON meeting_sessions (meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_status     ON meeting_sessions (status);

-- ----

CREATE TABLE IF NOT EXISTS meeting_members (
    id                          TEXT    PRIMARY KEY,
    session_id                  TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    meeting_id                  TEXT    NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    member_id                   TEXT    NOT NULL,
    member_name                 TEXT    NOT NULL,
    member_type                 TEXT    NOT NULL DEFAULT 'agent'
                                        CHECK(member_type IN ('agent','human')),
    role                        TEXT    NOT NULL DEFAULT 'member'
                                        CHECK(role IN ('content_chair','pm','lead','member','observer')),
    human_notification_sent     INTEGER DEFAULT 0,
    human_notification_channel  TEXT    CHECK(human_notification_channel IN ('telegram','dashboard','none')),
    can_request_floor           INTEGER DEFAULT 0,
    invitation_sent_at          TEXT,
    invitation_status           TEXT    NOT NULL DEFAULT 'pending'
                                        CHECK(invitation_status IN ('pending','accepted','declined','no_response')),
    joined_at                   TEXT,
    left_at                     TEXT,
    attendance_status           TEXT    CHECK(attendance_status IN ('present','absent','late','left_early')),
    is_active                   INTEGER NOT NULL DEFAULT 1,
    last_heartbeat_at           TEXT,
    turns_taken                 INTEGER NOT NULL DEFAULT 0,
    turns_passed                INTEGER NOT NULL DEFAULT 0,
    turns_timeout               INTEGER NOT NULL DEFAULT 0,
    speaking_order              INTEGER,
    created_at                  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at                  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(session_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_members_session_id ON meeting_members (session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_members_meeting_id ON meeting_members (meeting_id);

-- ----

CREATE TABLE IF NOT EXISTS meeting_turns (
    id                      TEXT    PRIMARY KEY,
    session_id              TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    meeting_id              TEXT    NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    round_number            INTEGER NOT NULL,
    turn_sequence           INTEGER NOT NULL,
    turn_sequence_in_round  INTEGER NOT NULL,
    member_id               TEXT    NOT NULL REFERENCES meeting_members(id),
    speaker_agent_id        TEXT    NOT NULL,
    yielded_to_human        TEXT    REFERENCES meeting_members(id),
    yield_reason            TEXT,
    scheduled_at            TEXT    NOT NULL,
    started_at              TEXT,
    ended_at                TEXT,
    duration_seconds        INTEGER,
    turn_result             TEXT    NOT NULL DEFAULT 'waiting'
                                    CHECK(turn_result IN ('waiting','notified','speaking','done','passed','timeout','skipped')),
    content                 TEXT,
    content_type            TEXT    NOT NULL DEFAULT 'text'
                                    CHECK(content_type IN ('text','structured','empty')),
    structured_content      TEXT    CHECK(json_valid(structured_content)),
    is_decision             INTEGER NOT NULL DEFAULT 0,
    is_action_item_source   INTEGER NOT NULL DEFAULT 0,
    is_key_point            INTEGER NOT NULL DEFAULT 0,
    pass_reason             TEXT,
    contribution_quality    TEXT,
    quality_retries         INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(session_id, turn_sequence)
);

CREATE INDEX IF NOT EXISTS idx_meeting_turns_session_id ON meeting_turns (session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_turns_member_id  ON meeting_turns (member_id);

CREATE TABLE IF NOT EXISTS meeting_round_summaries (
    id              TEXT    PRIMARY KEY,
    session_id      TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    round_number    INTEGER NOT NULL,
    summary_text    TEXT,
    status          TEXT    NOT NULL DEFAULT 'ok' CHECK(status IN ('ok','failed')),
    error           TEXT,
    model_profile   TEXT,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(session_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_meeting_round_summaries_session_id
    ON meeting_round_summaries (session_id);

-- ----

CREATE TABLE IF NOT EXISTS meeting_minutes (
    id                      TEXT    PRIMARY KEY,
    session_id              TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    meeting_id              TEXT    NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    version                 INTEGER NOT NULL DEFAULT 1,
    status                  TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK(status IN ('draft','under_review','finalized','amended')),
    summary_text            TEXT,
    full_minutes_markdown   TEXT,
    structured_minutes      TEXT    CHECK(json_valid(structured_minutes)),
    total_turns             INTEGER,
    total_decisions         INTEGER,
    total_action_items      INTEGER,
    total_open_items        INTEGER,
    open_items              TEXT    CHECK(json_valid(open_items)),
    finalized_by            TEXT,
    finalized_at            TEXT,
    generated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(session_id, version)
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_session_id ON meeting_minutes (session_id);

-- ----

CREATE TABLE IF NOT EXISTS meeting_action_items (
    id                      TEXT    PRIMARY KEY,
    meeting_id              TEXT    NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    session_id              TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    minutes_id              TEXT    REFERENCES meeting_minutes(id),
    source_turn_id          TEXT    REFERENCES meeting_turns(id),
    title                   TEXT    NOT NULL,
    description             TEXT,
    action_type             TEXT    NOT NULL DEFAULT 'task'
                                    CHECK(action_type IN ('task','decision_implementation','follow_up','escalation')),
    assignee_id             TEXT,
    assignee_name           TEXT,
    assigned_by             TEXT,
    due_date                TEXT,
    priority                TEXT    NOT NULL DEFAULT 'medium'
                                    CHECK(priority IN ('critical','high','medium','low')),
    status                  TEXT    NOT NULL DEFAULT 'open'
                                    CHECK(status IN ('open','in_progress','completed','rejected','deferred')),
    completed_at            TEXT,
    completion_note         TEXT,
    kanban_task_id          TEXT,
    kanban_board_id         TEXT,
    kanban_synced_at        TEXT,
    kanban_bridge_mode_used TEXT    CHECK(kanban_bridge_mode_used IN ('auto','manual')),
    last_status_update_at   TEXT,
    last_status_update_by   TEXT,
    notes                   TEXT    CHECK(json_valid(notes)),
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_id  ON meeting_action_items (meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_assignee_id ON meeting_action_items (assignee_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_status      ON meeting_action_items (status);

-- ----

CREATE TABLE IF NOT EXISTS meeting_watchdog_events (
    id                  TEXT    PRIMARY KEY,
    session_id          TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    meeting_id          TEXT    NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    event_type          TEXT    NOT NULL
                                CHECK(event_type IN ('agent_timeout','agent_dead','session_timeout','turn_manager_stuck','chair_unresponsive','quorum_lost','manual_intervention')),
    severity            TEXT    NOT NULL DEFAULT 'warning'
                                CHECK(severity IN ('info','warning','critical')),
    affected_member_id  TEXT    REFERENCES meeting_members(id),
    affected_turn_id    TEXT    REFERENCES meeting_turns(id),
    affected_agent_id   TEXT,
    detected_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    description         TEXT    NOT NULL,
    context_data        TEXT    CHECK(json_valid(context_data)),
    action_taken        TEXT    NOT NULL
                                CHECK(action_taken IN ('auto_pass','pause_session','escalate','skip_turn','notify_admin','no_action','resume_session')),
    action_result       TEXT    CHECK(action_result IN ('success','failed','partial')),
    action_detail       TEXT,
    escalated_to        TEXT,
    escalated_at        TEXT,
    resolved_at         TEXT,
    resolved_by         TEXT,
    resolution_note     TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_watchdog_events_session_id  ON meeting_watchdog_events (session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_watchdog_events_event_type  ON meeting_watchdog_events (event_type);

-- meeting_schedules: lịch tự động triệu tập họp theo cron (v40).
-- Mỗi dòng = 1 lịch định kỳ; scheduler nền quét mỗi ~30s và tự tạo meeting khi tới hạn.
CREATE TABLE IF NOT EXISTS meeting_schedules (
    id                      TEXT    PRIMARY KEY,
    name                    TEXT    NOT NULL,
    template_type           TEXT    NOT NULL,
    cron_expression         TEXT    NOT NULL,
    convened_by             TEXT    NOT NULL DEFAULT 'system',
    content_chair_id        TEXT,
    members_json            TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(members_json)),
    config_override_json    TEXT    CHECK(config_override_json IS NULL OR json_valid(config_override_json)),
    is_enabled              INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0,1)),
    is_default              INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0,1)),
    last_run_at             TEXT,
    last_meeting_id         TEXT,
    last_error              TEXT,
    created_by              TEXT    NOT NULL DEFAULT 'system',
    created_at              TEXT    NOT NULL,
    updated_at              TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meeting_schedules_enabled ON meeting_schedules (is_enabled);

-- meeting_conflict_log: v58 — ghi vết mọi hành động xử lý trùng lịch họp.
CREATE TABLE IF NOT EXISTS meeting_conflict_log (
    id           TEXT PRIMARY KEY,
    company_id   TEXT NOT NULL DEFAULT 'default',
    detected_at  TEXT NOT NULL,
    action       TEXT NOT NULL CHECK(action IN ('create','merge','defer','skip','alert','resume','replan_proposal')),
    reason       TEXT NOT NULL DEFAULT '',
    schedule_id  TEXT,
    meeting_id   TEXT,
    session_id   TEXT,
    actor        TEXT NOT NULL DEFAULT 'system',
    conflict_refs TEXT,
    result       TEXT NOT NULL DEFAULT '',
    details_json TEXT,
    before_json  TEXT,
    after_json   TEXT,
    notified     INTEGER NOT NULL DEFAULT 1 CHECK(notified IN (0,1)),
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meeting_conflict_log_at       ON meeting_conflict_log (detected_at);
CREATE INDEX IF NOT EXISTS idx_meeting_conflict_log_schedule ON meeting_conflict_log (schedule_id);

-- meeting_conflict_replan_proposals: v58 — đề xuất lên lịch lại khi dời quá nhiều lần.
CREATE TABLE IF NOT EXISTS meeting_conflict_replan_proposals (
    id             TEXT PRIMARY KEY,
    schedule_id    TEXT NOT NULL,
    schedule_name  TEXT NOT NULL DEFAULT '',
    defer_count    INTEGER NOT NULL DEFAULT 0,
    window_start   TEXT,
    reason         TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK(status IN ('pending','accepted','rejected')),
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
);

-- ============================================================
-- 2. AUDIT TABLES (G.1)
-- Thứ tự: audit_log → audit_findings → whistleblowing_tips
-- (audit_log.finding_id → audit_findings: nullable FK, OK)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id        TEXT    NOT NULL UNIQUE,
    event_time      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    event_type      TEXT    NOT NULL
                            CHECK(event_type IN ('scheduled_check','spot_check','reconcile_finance','reconcile_report','whistleblowing_tip','agent_flagged','ceo_override_attempt','policy_check','dlq_review')),
    target_scope    TEXT    NOT NULL,
    target_agent    TEXT,
    report_period   TEXT,
    source_reported TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(source_reported)),
    source_actual   TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(source_actual)),
    discrepancy     TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(discrepancy)),
    result          TEXT    NOT NULL
                            CHECK(result IN ('pass','discrepancy','critical','pending_review')),
    severity        TEXT    CHECK(severity IN ('info','warn','critical')),
    finding_id      TEXT    REFERENCES audit_findings(finding_id),
    evidence_hash   TEXT,
    prev_hash       TEXT,
    created_by      TEXT    NOT NULL DEFAULT 'audit_agent',
    notes           TEXT,
    related_task_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_result     ON audit_log (result);
-- TB-04: bổ sung index theo spec §1.1
CREATE INDEX IF NOT EXISTS idx_audit_log_time     ON audit_log (event_time DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target   ON audit_log (target_agent);
CREATE INDEX IF NOT EXISTS idx_audit_log_type     ON audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log (severity);
-- TD-06: task trace index
CREATE INDEX IF NOT EXISTS idx_audit_log_task ON audit_log(related_task_id);

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_update BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log là append-only'); END;

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_delete BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log là append-only'); END;

-- v82: chặn INSERT OR REPLACE ghi đè (REPLACE xoá ngầm dòng trùng khoá mà không chạy trigger BEFORE DELETE khi recursive_triggers=0)
CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_replace BEFORE INSERT ON audit_log
WHEN EXISTS (SELECT 1 FROM audit_log WHERE audit_id = NEW.audit_id)
BEGIN SELECT RAISE(ABORT, 'audit_log là append-only'); END;

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_replace_id BEFORE INSERT ON audit_log
WHEN NEW.id IS NOT NULL AND EXISTS (SELECT 1 FROM audit_log WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'audit_log là append-only'); END;

-- ----

CREATE TABLE IF NOT EXISTS audit_findings (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    finding_id          TEXT    NOT NULL UNIQUE,
    audit_log_id        INTEGER REFERENCES audit_log(id),
    found_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    severity            TEXT    NOT NULL CHECK(severity IN ('info','warn','critical')),
    category            TEXT    NOT NULL CHECK(category IN ('financial_mismatch','report_vs_log','policy_violation','unauthorized_action','prompt_injection_suspect','budget_overshoot','other')),
    description         TEXT    NOT NULL,
    evidence            TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(evidence)),
    impact_estimate     TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(impact_estimate)),
    status              TEXT    NOT NULL DEFAULT 'open'
                                CHECK(status IN ('open','investigating','reported_to_chairman','resolved','dismissed')),
    reported_to         TEXT    DEFAULT 'chu_tich',
    reported_at         TEXT,
    chairman_decision   TEXT    CHECK(chairman_decision IN ('halt_agent','investigate','dismiss','config_change')),
    resolution_note     TEXT,
    resolved_at         TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_status   ON audit_findings (status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings (severity);
-- TB-04: bổ sung index theo spec §1.1
CREATE INDEX IF NOT EXISTS idx_findings_status ON audit_findings (status);
CREATE INDEX IF NOT EXISTS idx_findings_sev    ON audit_findings (severity);
CREATE INDEX IF NOT EXISTS idx_findings_time   ON audit_findings (found_at DESC);

-- ----

CREATE TABLE IF NOT EXISTS whistleblowing_tips (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tip_id          TEXT    NOT NULL UNIQUE,
    received_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    channel         TEXT    NOT NULL CHECK(channel IN ('telegram_anon','web_anon','email_anon','internal_agent')),
    subject         TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    target_agent    TEXT,
    category        TEXT    CHECK(category IN ('fraud','data_leak','policy_violation','budget_misuse','prompt_injection','harassment','other')),
    status          TEXT    NOT NULL DEFAULT 'received'
                            CHECK(status IN ('received','investigating','finding_created','dismissed','closed')),
    finding_id      TEXT    REFERENCES audit_findings(finding_id),
    reviewed_by     TEXT    DEFAULT 'audit_agent',
    reviewed_at     TEXT,
    closed_at       TEXT,
    anonymous       INTEGER NOT NULL DEFAULT 1,
    reporter_contact TEXT,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_whistleblowing_tips_status ON whistleblowing_tips (status);
-- TB-04: bổ sung index theo spec §1.1
CREATE INDEX IF NOT EXISTS idx_tips_status ON whistleblowing_tips (status);
CREATE INDEX IF NOT EXISTS idx_tips_time   ON whistleblowing_tips (received_at DESC);

-- ============================================================
-- 3. TASK CONTRACTS (G.2)
-- ============================================================

CREATE TABLE IF NOT EXISTS task_contracts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id             TEXT    NOT NULL UNIQUE,
    contract_version    TEXT    NOT NULL DEFAULT '1.0',
    responsible         TEXT    NOT NULL,
    accountable         TEXT    NOT NULL,
    consulted           TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(consulted)),
    informed            TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(informed)),
    raci_chain          TEXT    NOT NULL,
    work_type           TEXT    NOT NULL CHECK(work_type IN ('analysis','design','code','review','report','operation','other')),
    dod_checklist       TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(dod_checklist)),
    evidence_required   TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(evidence_required)),
    risk_tier           TEXT    CHECK(risk_tier IN ('T0','T1','T2','T3')),
    deadline            TEXT,
    priority            INTEGER NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
    status              TEXT    NOT NULL DEFAULT 'draft'
                                CHECK(status IN ('draft','assigned','in_progress','pending_review','done','rejected')),
    self_check_passed   INTEGER CHECK(self_check_passed IS NULL OR self_check_passed IN (0,1)),
    reviewer            TEXT,
    reviewed_at         TEXT,
    evidence_links      TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(evidence_links)),
    reject_reason       TEXT,
    done_at             TEXT,
    title               TEXT,
    description         TEXT,
    created_by          TEXT,
    goal_id             TEXT    REFERENCES goals(id) ON DELETE SET NULL,
    correlation_id      TEXT,
    kanban_task_id      TEXT,
    kanban_board_id     TEXT,
    kanban_synced_at    TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CONSTRAINT chk_no_self_done CHECK (responsible != accountable)
);

-- TB-05: index theo spec §1.1 G.2
CREATE INDEX IF NOT EXISTS idx_contracts_task   ON task_contracts (task_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON task_contracts (status);
CREATE INDEX IF NOT EXISTS idx_contracts_work   ON task_contracts (work_type);
-- legacy indexes (giữ để tương thích)
CREATE INDEX IF NOT EXISTS idx_task_contracts_status      ON task_contracts (status);
CREATE INDEX IF NOT EXISTS idx_task_contracts_responsible ON task_contracts (responsible);
-- TD-01: goal_id index
CREATE INDEX IF NOT EXISTS idx_contracts_goal ON task_contracts (goal_id);
-- TD-06: correlation_id index
CREATE INDEX IF NOT EXISTS idx_contracts_correlation ON task_contracts(correlation_id);
-- v41: idx_contracts_kanban được tạo bởi _patch_task_kanban_links_v41 SAU KHI cột được thêm.

-- ============================================================
-- 4. A2A EVENTS (G.3) — thêm cột risk_tier theo spec T0-02
-- ============================================================

CREATE TABLE IF NOT EXISTS a2a_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id        TEXT    NOT NULL UNIQUE,
    correlation_id  TEXT    NOT NULL,
    version         TEXT    NOT NULL DEFAULT '1.2',
    source_agent    TEXT    NOT NULL,
    target_agent    TEXT    NOT NULL,
    topic           TEXT    NOT NULL,
    reply_to        TEXT,
    timestamp_utc   TEXT    NOT NULL,
    sla_deadline    TEXT    NOT NULL,
    processed_at    TEXT,
    priority        TEXT    NOT NULL DEFAULT 'normal'
                            CHECK(priority IN ('critical','high','normal','low')),
    payload_type    TEXT    NOT NULL,
    payload_json    TEXT    NOT NULL CHECK(json_valid(payload_json)),
    ref_id          TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','delivered','processing','processed','failed','dlq','expired')),
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    last_error      TEXT,
    signature       TEXT    NOT NULL,
    signature_valid INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT    NOT NULL DEFAULT '',
    tags            TEXT    DEFAULT '[]' CHECK(json_valid(tags)),
    ttl_seconds     INTEGER NOT NULL DEFAULT 300,
    risk_tier       TEXT    NOT NULL DEFAULT 'T1'
                            CHECK(risk_tier IN ('T0','T1','T2','T3')),
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_a2a_events_topic         ON a2a_events (topic, status, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_a2a_events_correlation   ON a2a_events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_a2a_events_source        ON a2a_events (source_agent, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_a2a_events_target        ON a2a_events (target_agent, status);
CREATE INDEX IF NOT EXISTS idx_a2a_events_tier_sla      ON a2a_events (risk_tier, sla_deadline) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_a2a_events_dlq           ON a2a_events (status, created_at) WHERE status = 'dlq';

CREATE TRIGGER IF NOT EXISTS trg_a2a_events_updated_at
    AFTER UPDATE ON a2a_events
BEGIN
    UPDATE a2a_events SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE VIEW IF NOT EXISTS v_sla_breached AS
SELECT event_id, topic, source_agent, target_agent,
       risk_tier, sla_deadline,
       (julianday('now') - julianday(sla_deadline)) * 86400 AS overdue_seconds,
       retry_count
FROM   a2a_events
WHERE  status IN ('pending', 'delivered', 'processing')
  AND  sla_deadline < strftime('%Y-%m-%dT%H:%M:%fZ','now')
ORDER  BY risk_tier DESC, overdue_seconds DESC;

CREATE VIEW IF NOT EXISTS v_dlq_summary AS
SELECT topic, source_agent, COUNT(*) AS failed_count,
       MAX(created_at) AS latest_failure,
       MIN(created_at) AS earliest_failure
FROM   a2a_events
WHERE  status = 'dlq'
GROUP  BY topic, source_agent
ORDER  BY failed_count DESC;

-- ============================================================
-- 4b. SỔ BÀN GIAO (HANDOVER LEDGER)
-- Ghi nhận nghiệp vụ chuyển giao sự kiện giữa đơn vị gửi và đơn vị nhận theo luồng.
-- KHÁC a2a_events: bảng này là SỔ NGHIỆP VỤ (ai gửi → ai nhận, trạng thái SLA),
-- còn a2a_events là hàng đợi vận chuyển kỹ thuật (SQLite at-least-once delivery).
-- ============================================================

CREATE TABLE IF NOT EXISTS handover_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id        TEXT    NOT NULL UNIQUE,
    topic           TEXT    NOT NULL,
    producer_unit   TEXT    NOT NULL,
    consumer_unit   TEXT    NOT NULL,
    risk_tier       TEXT    NOT NULL DEFAULT 'T1'
                            CHECK(risk_tier IN ('T0','T1','T2','T3')),
    sla_seconds     INTEGER,
    created_at      TEXT    NOT NULL,
    sla_deadline    TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','delivered','processing','processed','failed','dlq','expired')),
    acknowledged_at TEXT,
    completed_at    TEXT,
    ref_type        TEXT,
    ref_id          TEXT,
    correlation_id  TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    payload_json    TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(payload_json)),
    unit_resolved   INTEGER NOT NULL DEFAULT 1 CHECK(unit_resolved IN (0,1)),
    recorded_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_handover_topic_time  ON handover_events (topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handover_consumer    ON handover_events (consumer_unit, status);
CREATE INDEX IF NOT EXISTS idx_handover_producer    ON handover_events (producer_unit, status);
CREATE INDEX IF NOT EXISTS idx_handover_deadline    ON handover_events (sla_deadline) WHERE status IN ('pending','delivered','processing');
CREATE INDEX IF NOT EXISTS idx_handover_correlation ON handover_events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_handover_ref         ON handover_events (ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_handover_unresolved  ON handover_events (unit_resolved, topic) WHERE unit_resolved = 0;

CREATE TRIGGER IF NOT EXISTS trg_handover_events_updated_at
    AFTER UPDATE ON handover_events
BEGIN
    UPDATE handover_events SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE VIEW IF NOT EXISTS v_handover_sla_breached AS
SELECT event_id, topic, producer_unit, consumer_unit, risk_tier, sla_deadline,
       (julianday('now') - julianday(sla_deadline)) * 86400 AS overdue_seconds,
       status, retry_count
FROM   handover_events
WHERE  status IN ('pending','delivered','processing')
  AND  sla_deadline IS NOT NULL
  AND  julianday(sla_deadline) < julianday('now')
ORDER  BY risk_tier DESC, overdue_seconds DESC;

-- ============================================================
-- 5. CONFLICT ESCALATIONS (G.3.4)
-- ============================================================

CREATE TABLE IF NOT EXISTS conflict_escalations (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    conflict_id             TEXT    NOT NULL UNIQUE,
    correlation_id          TEXT,
    initiator_cluster       TEXT    NOT NULL,
    respondent_cluster      TEXT    NOT NULL,
    conflict_type           TEXT    NOT NULL CHECK(conflict_type IN ('resource','priority','veto','data_inconsistency')),
    status                  TEXT    NOT NULL DEFAULT 'step1_negotiating'
                                    CHECK(status IN ('step1_negotiating','step2_ceo_review','step3_chairman_hitl','resolved','timeout_expired')),
    step1_started_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    step1_deadline          TEXT    NOT NULL,
    step2_started_at        TEXT,
    step2_deadline          TEXT,
    step3_notified_at       TEXT,
    resolved_at             TEXT,
    conflict_summary        TEXT    NOT NULL,
    proposal_a_json         TEXT    NOT NULL CHECK(json_valid(proposal_a_json)),
    proposal_b_json         TEXT    NOT NULL CHECK(json_valid(proposal_b_json)),
    priority_rules_used     TEXT    CHECK(json_valid(priority_rules_used)),
    resolution_level        TEXT    CHECK(resolution_level IN ('auto_negotiation','ceo_decision','chairman_decision')),
    resolution_json         TEXT    CHECK(json_valid(resolution_json)),
    resolved_by             TEXT,
    resolution_rationale    TEXT,
    risk_tier               TEXT    NOT NULL DEFAULT 'T1' CHECK(risk_tier IN ('T0','T1','T2','T3')),
    auto_freeze             INTEGER NOT NULL DEFAULT 0,
    tags                    TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(tags)),
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_conflict_escalations_status    ON conflict_escalations (status);
CREATE INDEX IF NOT EXISTS idx_conflict_escalations_risk_tier ON conflict_escalations (risk_tier);
CREATE INDEX IF NOT EXISTS idx_conflict_status  ON conflict_escalations (status, step1_deadline);
CREATE INDEX IF NOT EXISTS idx_conflict_cluster ON conflict_escalations (initiator_cluster, status);
CREATE INDEX IF NOT EXISTS idx_conflict_tier    ON conflict_escalations (risk_tier, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_conflict_updated_at
    AFTER UPDATE ON conflict_escalations
BEGIN
    UPDATE conflict_escalations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

-- ============================================================
-- 6. WEEKLY REPORTS (G.4)
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_reports (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id               TEXT    NOT NULL UNIQUE,
    year                    INTEGER NOT NULL,
    week_number             INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 53),
    period_start            TEXT    NOT NULL,
    period_end              TEXT    NOT NULL,
    generated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    generated_by            TEXT    NOT NULL DEFAULT 'ceo_agent',
    cluster_kpi             TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(cluster_kpi)),
    budget_summary          TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(budget_summary)),
    total_revenue_vnd       INTEGER,
    total_token_cost_vnd    INTEGER,
    total_tokens            INTEGER,
    optimization_proposals  TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(optimization_proposals)),
    risks_next_week         TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(risks_next_week)),
    status                  TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK(status IN ('draft','submitted','reviewed','approved','archived')),
    pending_spotchk         INTEGER NOT NULL DEFAULT 0,
    spotchk_result          TEXT    CHECK(spotchk_result IN ('clear','flagged','pending')),
    spotchk_note            TEXT,
    submitted_at            TEXT,
    submitted_to            TEXT,
    reviewed_by             TEXT,
    approved_by             TEXT,
    approved_at             TEXT,
    chairman_notes          TEXT,
    raw_data_hash           TEXT,
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON weekly_reports (status);

CREATE TRIGGER IF NOT EXISTS trg_weekly_reports_updated_at
    AFTER UPDATE ON weekly_reports
    FOR EACH ROW
    BEGIN
        UPDATE weekly_reports SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
        WHERE id = OLD.id;
    END;

-- ============================================================
-- 7. MONTHLY REPORTS (G.4) — TD-11 Phase 3 flat shape per spec §1.1
-- ============================================================

CREATE TABLE IF NOT EXISTS monthly_reports (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id               TEXT    NOT NULL UNIQUE,
    year                    INTEGER NOT NULL,
    month                   INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    period_start            TEXT    NOT NULL,
    period_end              TEXT    NOT NULL,
    generated_at            TEXT    NOT NULL,
    generated_by            TEXT    NOT NULL DEFAULT 'ceo_agent',
    audited_by              TEXT    DEFAULT 'audit_agent',
    audit_passed            INTEGER CHECK(audit_passed IN (0,1)),
    revenue_vnd             INTEGER NOT NULL,
    cogs_vnd                INTEGER DEFAULT 0,
    gross_profit_vnd        INTEGER,
    gross_margin_pct        REAL,
    opex_vnd                INTEGER NOT NULL,
    opex_breakdown          TEXT    DEFAULT '{}' CHECK(json_valid(opex_breakdown)),
    net_profit_vnd          INTEGER,
    net_margin_pct          REAL,
    cash_on_hand_vnd        INTEGER,
    burn_rate_daily_vnd     INTEGER,
    runway_days             INTEGER,
    runway_months           REAL,
    total_tokens            INTEGER,
    total_token_cost_vnd    INTEGER,
    token_cost_revenue_pct  REAL,
    system_uptime_pct       REAL,
    system_error_rate_pct   REAL,
    total_incidents         INTEGER,
    auto_resolved_pct       REAL,
    retention_rate_pct      REAL,
    new_customers           INTEGER,
    churned_customers       INTEGER,
    roas_by_cluster         TEXT    DEFAULT '{}' CHECK(json_valid(roas_by_cluster)),
    ceo_okr_review          TEXT    DEFAULT '{}' CHECK(json_valid(ceo_okr_review)),
    ceo_self_rating         INTEGER CHECK(ceo_self_rating BETWEEN 1 AND 10),
    chairman_ceo_rating     INTEGER CHECK(chairman_ceo_rating BETWEEN 1 AND 10),
    status                  TEXT    NOT NULL DEFAULT 'draft'
                            CHECK(status IN ('draft','audit_pending','audit_done','submitted','approved','archived')),
    submitted_at            TEXT,
    audit_note              TEXT,
    raw_data_hash           TEXT,
    created_at              TEXT    NOT NULL,
    updated_at              TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_year_month ON monthly_reports(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_status ON monthly_reports (status);

-- ============================================================
-- 8. DIRECTIVES (F.2)
-- ============================================================

CREATE TABLE IF NOT EXISTS directives (
    directive_id            TEXT    PRIMARY KEY,
    channel                 TEXT    NOT NULL,
    direction               TEXT    NOT NULL DEFAULT 'inbound'
                                    CHECK(direction IN ('inbound','outbound')),
    from_actor              TEXT    NOT NULL,
    to_unit                 TEXT,
    to_profile              TEXT,
    type                    TEXT    NOT NULL CHECK(type IN ('new','adjust','info')),
    priority                INTEGER NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
    risk_tier               TEXT    CHECK(risk_tier IS NULL OR risk_tier IN ('T0','T1','T2','T3')),
    payload                 TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(payload)),
    raw_message             TEXT,
    ref_type                TEXT    CHECK(ref_type IN ('task','directive')),
    ref_id                  TEXT,
    status                  TEXT    NOT NULL DEFAULT 'received'
                                    CHECK(status IN ('received','ack_sent','in_progress','waiting_review','adjustment_requested','approved','rejected','auto_closed','done','escalated','cancelled','error')),
    ack_status              TEXT    NOT NULL DEFAULT 'awaiting'
                                    CHECK(ack_status IN ('awaiting','sent','failed','n/a')),
    delivery_status         TEXT    CHECK(delivery_status IN ('pending','sent','failed','delivered')),
    closed_by               TEXT,
    error_info              TEXT    CHECK(json_valid(error_info)),
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    acked_at                TEXT,
    ack_timeout_at          TEXT,
    processing_timeout_at   TEXT,
    closed_at               TEXT
);

CREATE INDEX IF NOT EXISTS idx_directives_status     ON directives (status);
CREATE INDEX IF NOT EXISTS idx_directives_from_actor ON directives (from_actor);
-- TB-01: index theo spec §1.1
CREATE INDEX IF NOT EXISTS idx_dir_to_unit     ON directives (to_unit, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dir_to_profile  ON directives (to_profile, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dir_from_actor  ON directives (from_actor, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dir_ack_pending ON directives (ack_status, ack_timeout_at)
    WHERE ack_status = 'awaiting';
CREATE INDEX IF NOT EXISTS idx_dir_ref         ON directives (ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_dir_channel_ts  ON directives (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dir_status_prio ON directives (status, priority, created_at)
    WHERE status IN ('received','ack_sent','in_progress');

-- ============================================================
-- 9. COMM LOG (F.4) — append-only (2 trigger ngăn UPDATE/DELETE)
-- ============================================================

CREATE TABLE IF NOT EXISTS comm_log (
    event_id        TEXT    PRIMARY KEY,
    ts              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    direction       TEXT    NOT NULL CHECK(direction IN ('human_to_agent','agent_to_human','agent_to_agent')),
    channel         TEXT    NOT NULL CHECK(channel IN ('telegram','dashboard','bus','kanban','cron','api','system','email','webhook','portal')), -- Đồng bộ với hermes_poclip/comm/channels.py (COMM_CHANNELS)
    from_actor      TEXT    NOT NULL,
    to_actor        TEXT    NOT NULL,
    event_type      TEXT    NOT NULL CHECK(event_type IN ('directive','ack','report','approval','rejection','adjustment_request','info_response','machine_event','digest','escalation','timeout_warning','cancellation','state_change','system','correction')),
    summary         TEXT    NOT NULL CHECK(length(summary) <= 500),
    payload_hash    TEXT,
    ref_type        TEXT    CHECK(ref_type IN ('directive','task','board','incident','report')),
    ref_id          TEXT,
    parent_event    TEXT    REFERENCES comm_log(event_id),
    status          TEXT    NOT NULL DEFAULT 'logged'
                            CHECK(status IN ('logged','verified','archived')),
    logged_by       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_log_ts         ON comm_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_ref        ON comm_log (ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_comm_log_channel    ON comm_log (channel, direction);
-- TB-01: index bổ sung theo spec §1.1
CREATE INDEX IF NOT EXISTS idx_comm_log_from_actor ON comm_log (from_actor, ts DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_to_actor   ON comm_log (to_actor, ts DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_event_type ON comm_log (event_type, ts DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_parent     ON comm_log (parent_event)
    WHERE parent_event IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_comm_log_no_update
    BEFORE UPDATE ON comm_log
BEGIN
    SELECT RAISE(ABORT, 'comm_log là append-only — không được sửa');
END;

CREATE TRIGGER IF NOT EXISTS trg_comm_log_no_delete
    BEFORE DELETE ON comm_log
BEGIN
    SELECT RAISE(ABORT, 'comm_log là append-only — không được xóa');
END;

-- ============================================================
-- 10. TOOL POLICY (TC-04) — tool_policies + policy_events
-- ============================================================

CREATE TABLE IF NOT EXISTS tool_policies (
    id              TEXT    PRIMARY KEY,
    profile_id      TEXT    NOT NULL,
    provider        TEXT,
    tool_pattern    TEXT    NOT NULL,
    policy_action   TEXT    NOT NULL CHECK(policy_action IN ('allow','deny')),
    scope           TEXT    NOT NULL DEFAULT 'agent' CHECK(scope IN ('agent','provider','profile','group')),
    layer_priority  INTEGER NOT NULL DEFAULT 100,
    policy_revision TEXT    NOT NULL DEFAULT '1.0',
    note            TEXT,
    active          INTEGER NOT NULL DEFAULT 1,
    created_by      TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS policy_events (
    id                  TEXT    PRIMARY KEY,
    agent_id            TEXT    NOT NULL,
    tool_name           TEXT    NOT NULL,
    action_taken        TEXT    NOT NULL CHECK(action_taken IN ('allowed','denied')),
    matched_policy_id   TEXT,
    policy_revision     TEXT,
    decision_reason     TEXT    NOT NULL,
    session_id          TEXT,
    matched_layer       INTEGER,
    tool_call_id        TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_tool_policies_profile ON tool_policies (profile_id, active, layer_priority);
CREATE INDEX IF NOT EXISTS idx_policy_events_agent   ON policy_events (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_events_denied  ON policy_events (action_taken, created_at DESC) WHERE action_taken = 'denied';

-- ============================================================
-- 11. A2A ALLOWLIST (TC-05) — a2a_grants
-- ============================================================

CREATE TABLE IF NOT EXISTS a2a_grants (
    id                  TEXT    PRIMARY KEY,
    from_profile        TEXT    NOT NULL,
    to_profile          TEXT    NOT NULL,
    direction           TEXT    NOT NULL DEFAULT 'unidirectional'
                                    CHECK(direction IN ('unidirectional','bidirectional')),
    allowed_operations  TEXT    NOT NULL DEFAULT '["kanban_comment","delegate_task","send_message"]'
                                    CHECK(json_valid(allowed_operations)),
    note                TEXT,
    granted_by          TEXT    NOT NULL,
    active              INTEGER NOT NULL DEFAULT 1,
    expires_at          TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_a2a_grants_unique ON a2a_grants (from_profile, to_profile, direction) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_a2a_grants_from ON a2a_grants (from_profile, active);
CREATE INDEX IF NOT EXISTS idx_a2a_grants_to   ON a2a_grants (to_profile, active);

-- ============================================================
-- 12. SANDBOX (TC-06) — sandbox_config
-- ============================================================

CREATE TABLE IF NOT EXISTS sandbox_config (
    id                  TEXT    PRIMARY KEY,
    profile_id          TEXT    NOT NULL UNIQUE,
    sandbox_mode        TEXT    NOT NULL DEFAULT 'off'
                                CHECK(sandbox_mode IN ('off','non-main','all')),
    backend             TEXT    NOT NULL DEFAULT 'local',
    workspace_access    TEXT    NOT NULL DEFAULT 'none'
                                CHECK(workspace_access IN ('none','ro','rw')),
    tools_policy_json   TEXT    DEFAULT '{}'
                                CHECK(tools_policy_json IS NULL OR json_valid(tools_policy_json)),
    prune_on_exit       INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_sandbox_config_profile ON sandbox_config (profile_id);

-- ============================================================
-- 13. APPROVAL REQUESTS (TC-07) — approval_requests (WhatNeedsMe queue D4)
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_requests (
    id                      TEXT    PRIMARY KEY,
    directive_id            TEXT,
    task_id                 TEXT,
    correlation_id          TEXT    NOT NULL,
    request_type            TEXT    NOT NULL,
    requester_agent_id      TEXT    NOT NULL,
    risk_tier               TEXT    NOT NULL
                                    CHECK(risk_tier IN ('T0','T1','T2','T3')),
    goal_ancestry           TEXT    CHECK(goal_ancestry IS NULL OR json_valid(goal_ancestry)),
    budget_remaining        REAL,
    evidence_summary        TEXT    CHECK(evidence_summary IS NULL OR json_valid(evidence_summary)),
    verdict_summary         TEXT    CHECK(verdict_summary IS NULL OR json_valid(verdict_summary)),
    affected_summary        TEXT,
    status                  TEXT    NOT NULL DEFAULT 'pending'
                                    CHECK(status IN ('pending','compliance_reviewing','awaiting_chairman','approved','rejected','changes_requested','escalated','expired')),
    compliance_verdict      TEXT    CHECK(compliance_verdict IN ('approved','rejected','uncertain') OR compliance_verdict IS NULL),
    compliance_checked_at   TEXT,
    compliance_agent_id     TEXT,
    chairman_decision       TEXT    CHECK(chairman_decision IN ('approved','rejected','changes_requested','escalated') OR chairman_decision IS NULL),
    chairman_decided_at     TEXT,
    decision_reason         TEXT,
    sla_deadline            TEXT    NOT NULL,
    escalation_count        INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_apr_status_tier ON approval_requests (status, risk_tier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apr_task        ON approval_requests (task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_apr_pending_sla ON approval_requests (sla_deadline) WHERE status IN ('pending','compliance_reviewing','awaiting_chairman');

CREATE TRIGGER IF NOT EXISTS trg_apr_updated_at
    AFTER UPDATE ON approval_requests
BEGIN
    UPDATE approval_requests SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

-- ============================================================
-- 14. CHANNEL BINDINGS (TC-08) — map kênh → profile/role
-- ============================================================

CREATE TABLE IF NOT EXISTS channel_bindings (
    id              TEXT    PRIMARY KEY,
    channel         TEXT    NOT NULL,
    profile_id      TEXT    NOT NULL,
    role            TEXT,
    peer_id         TEXT,
    guild_id        TEXT,
    team_id         TEXT,
    active          INTEGER NOT NULL DEFAULT 1,
    note            TEXT,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_channel_bindings_channel ON channel_bindings (channel, active);
CREATE INDEX IF NOT EXISTS idx_channel_bindings_profile  ON channel_bindings (profile_id, active);

-- ============================================================
-- 15. POLICY AUDIT LOG (TC-08) — audit mọi thay đổi policy qua UI
-- ============================================================

CREATE TABLE IF NOT EXISTS policy_audit_log (
    id                  TEXT    PRIMARY KEY,
    policy_type         TEXT    NOT NULL CHECK(policy_type IN ('tool_policy','a2a_grant','sandbox','channel_binding','tool_approval_rule')),
    policy_id           TEXT    NOT NULL,
    action              TEXT    NOT NULL CHECK(action IN ('create','update','delete','activate','deactivate')),
    before_json         TEXT    CHECK(before_json IS NULL OR json_valid(before_json)),
    after_json          TEXT    CHECK(after_json IS NULL OR json_valid(after_json)),
    changed_by          TEXT    NOT NULL,
    policy_revision     TEXT    NOT NULL,
    requires_approval   INTEGER NOT NULL DEFAULT 0,
    approval_request_id TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_policy_audit_log_type   ON policy_audit_log (policy_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_audit_log_policy ON policy_audit_log (policy_id, created_at DESC);

-- ============================================================
-- 15b. POLICY SUGGESTIONS — đề xuất mặc định (draft) chờ Chủ tịch duyệt
-- ============================================================

CREATE TABLE IF NOT EXISTS policy_suggestions (
    id                TEXT    PRIMARY KEY,
    policy_type       TEXT    NOT NULL
                              CHECK(policy_type IN ('tool_policy','a2a_grant','sandbox','channel_binding')),
    target_key        TEXT    NOT NULL,
    payload_json      TEXT    NOT NULL CHECK(json_valid(payload_json)),
    rationale_key     TEXT    NOT NULL,
    rationale_params  TEXT    NOT NULL DEFAULT '{}'
                              CHECK(json_valid(rationale_params)),
    status            TEXT    NOT NULL DEFAULT 'draft'
                              CHECK(status IN ('draft','approved','rejected')),
    source            TEXT    NOT NULL DEFAULT 'model',
    applied_id        TEXT,
    decided_by        TEXT,
    decided_at        TEXT,
    applied_at        TEXT,
    created_at        TEXT    NOT NULL,
    updated_at        TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_suggestions_target
    ON policy_suggestions (policy_type, target_key);
CREATE INDEX IF NOT EXISTS idx_policy_suggestions_status
    ON policy_suggestions (status);

-- ============================================================
-- 16. NOTIFICATION PREFERENCES (F.5.7) — TB-02
-- subscribe/mute per owner; scope_type topic/task/agent/board/global
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id          TEXT    PRIMARY KEY,
    owner_id    TEXT    NOT NULL,
    scope_type  TEXT    NOT NULL
                        CHECK(scope_type IN ('topic','task','agent','board','global')),
    scope_id    TEXT,
    action      TEXT    NOT NULL
                        CHECK(action IN ('subscribe','mute')),
    expires_at  TEXT,
    created_at  TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_scope ON notification_preferences(owner_id, scope_type, scope_id);

-- ============================================================
-- 17. DIRECTIVE LIFECYCLE (TB-02) — lịch sử chuyển trạng thái directive
-- Bảng [BỔ SUNG] — không ghi đè directives.status; nguồn truy vết đầy đủ
-- ============================================================

CREATE TABLE IF NOT EXISTS directive_lifecycle (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    directive_id    TEXT    NOT NULL REFERENCES directives(directive_id),
    from_status     TEXT    NOT NULL,
    to_status       TEXT    NOT NULL,
    reason          TEXT,
    actor           TEXT    NOT NULL,
    ts              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_dir_lifecycle_directive ON directive_lifecycle(directive_id);

-- ============================================================
-- 18. DIGEST QUEUE (TB-03) — hàng đợi sự kiện chờ gộp vào digest
-- ============================================================

CREATE TABLE IF NOT EXISTS digest_queue (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id                TEXT    NOT NULL,
    digest_type             TEXT    NOT NULL CHECK(digest_type IN ('daily','weekly')),
    event_ref               TEXT    NOT NULL,
    event_summary           TEXT    NOT NULL,
    priority                INTEGER NOT NULL DEFAULT 3,
    queued_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    included_in_digest_id   TEXT
);

CREATE INDEX IF NOT EXISTS idx_digest_queue_owner   ON digest_queue (owner_id);
CREATE INDEX IF NOT EXISTS idx_digest_queue_pending ON digest_queue (included_in_digest_id)
    WHERE included_in_digest_id IS NULL;

-- ============================================================
-- 19. GOAL TREE (D2 TD-01) — cây mục tiêu 4 cấp
-- ============================================================

CREATE TABLE IF NOT EXISTS goals (
    id                   TEXT    PRIMARY KEY,
    title                TEXT    NOT NULL,
    description          TEXT,
    level                TEXT    NOT NULL CHECK(level IN ('company','initiative','outcome','task')),
    parent_id            TEXT    REFERENCES goals(id) ON DELETE SET NULL,
    owner                TEXT    NOT NULL,
    status               TEXT    NOT NULL DEFAULT 'planned'
                                 CHECK(status IN ('planned','active','achieved','cancelled')),
    priority_at_genesis  INTEGER NOT NULL DEFAULT 1
                                 CHECK(priority_at_genesis IN (0,1,2,3)),
    budget_allocated_usd REAL    DEFAULT 0.0,
    progress_pct         REAL    DEFAULT 0.0 CHECK(progress_pct BETWEEN 0 AND 100),
    done_when            TEXT,
    evidence_url         TEXT,
    goal_metadata        TEXT    CHECK(json_valid(goal_metadata)),
    created_at           TEXT    NOT NULL,
    updated_at           TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_owner  ON goals(owner);
CREATE INDEX IF NOT EXISTS idx_goals_level  ON goals(level);

-- ============================================================
-- [GOAL TREE] GOAL PROPOSALS + CHANGE LOG (v33)
-- CEO Agent đề xuất bộ mục tiêu ban đầu; Chủ tịch duyệt/từ chối.
-- ============================================================

CREATE TABLE IF NOT EXISTS goal_proposals (
    id                 TEXT    PRIMARY KEY,
    company_id         TEXT    NOT NULL DEFAULT 'default',
    batch_id           TEXT    NOT NULL,
    proposal_type      TEXT    NOT NULL CHECK(proposal_type IN ('create','update')),
    source             TEXT    NOT NULL DEFAULT 'ceo_agent'
                               CHECK(source IN ('ceo_agent','template','chairman')),
    level              TEXT    NOT NULL CHECK(level IN ('company','initiative','outcome','task')),
    target_goal_id     TEXT    REFERENCES goals(id) ON DELETE CASCADE,
    parent_proposal_id TEXT    REFERENCES goal_proposals(id) ON DELETE SET NULL,
    parent_goal_id     TEXT    REFERENCES goals(id) ON DELETE SET NULL,
    created_goal_id    TEXT    REFERENCES goals(id) ON DELETE SET NULL,
    payload            TEXT    NOT NULL CHECK(json_valid(payload)),
    diff_json          TEXT    CHECK(diff_json IS NULL OR json_valid(diff_json)),
    status             TEXT    NOT NULL DEFAULT 'pending'
                               CHECK(status IN ('pending','approved','rejected')),
    reason             TEXT,
    created_at         TEXT    NOT NULL,
    decided_at         TEXT,
    decided_by         TEXT
);

CREATE INDEX IF NOT EXISTS idx_goal_proposals_batch  ON goal_proposals(batch_id);
CREATE INDEX IF NOT EXISTS idx_goal_proposals_status ON goal_proposals(status);
CREATE INDEX IF NOT EXISTS idx_goal_proposals_target ON goal_proposals(target_goal_id);

CREATE TABLE IF NOT EXISTS goal_change_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    at            TEXT    NOT NULL,
    actor         TEXT    NOT NULL,
    action        TEXT    NOT NULL
                          CHECK(action IN ('approve_proposal','reject_proposal',
                                           'goal_created','goal_updated','ceo_suggested')),
    goal_id       TEXT,
    proposal_id   TEXT,
    field_changes TEXT    CHECK(field_changes IS NULL OR json_valid(field_changes)),
    note          TEXT
);

CREATE TRIGGER IF NOT EXISTS trg_goal_change_log_no_update
    BEFORE UPDATE ON goal_change_log
BEGIN
    SELECT RAISE(ABORT, 'goal_change_log là append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_goal_change_log_no_delete
    BEFORE DELETE ON goal_change_log
BEGIN
    SELECT RAISE(ABORT, 'goal_change_log là append-only');
END;

CREATE INDEX IF NOT EXISTS idx_goal_change_log_goal ON goal_change_log(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_change_log_at   ON goal_change_log(at DESC);

-- Thẻ Kanban gắn vào mục tiêu (12/11/2026): công việc thật của công ty chạy trên thẻ Kanban, không phải «hợp đồng việc».
-- MỖI THẺ thuộc tối đa MỘT mục tiêu (gắn thẻ vào mục tiêu khác = chuyển). Thẻ con (liên kết cha→con trong Kanban) tự thuộc mục tiêu của thẻ cha
-- khi không có gắn riêng; tiến độ mục tiêu = thẻ đã xong / tổng thẻ thuộc nó (xem goals/card_links.py). Không khoá ngoại sang Kanban (mỗi bảng Kanban là một tệp riêng).
CREATE TABLE IF NOT EXISTS goal_card_links (
    goal_id    TEXT NOT NULL,
    board      TEXT NOT NULL,
    task_id    TEXT NOT NULL,
    linked_at  TEXT NOT NULL,
    linked_by  TEXT NOT NULL DEFAULT 'chu_tich',
    source     TEXT NOT NULL DEFAULT 'manual',
    PRIMARY KEY (goal_id, board, task_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_card_links_card ON goal_card_links(board, task_id);
CREATE INDEX IF NOT EXISTS idx_goal_card_links_goal ON goal_card_links(goal_id);

-- ============================================================
-- 20. BUDGET (D3 TD-02) — budget_policies + task_runs + revenue_records
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_policies (
    id                      TEXT    PRIMARY KEY,
    scope_type              TEXT    NOT NULL CHECK(scope_type IN ('agent','cluster','company')),
    scope_id                TEXT,
    window                  TEXT    NOT NULL DEFAULT 'monthly'
                                    CHECK(window IN ('daily','weekly','monthly','per_task')),
    amount_usd              REAL    NOT NULL CHECK(amount_usd > 0),
    soft_limit_pct          REAL    NOT NULL DEFAULT 70.0
                                    CHECK(soft_limit_pct BETWEEN 0 AND 100),
    hard_limit_pct          REAL    NOT NULL DEFAULT 100.0
                                    CHECK(hard_limit_pct BETWEEN 0 AND 100),
    hard_stop_enabled       INTEGER NOT NULL DEFAULT 1,
    emergency_stop_active   INTEGER NOT NULL DEFAULT 0,
    emergency_stop_reason   TEXT,
    emergency_stop_at       TEXT,
    notes                   TEXT,
    created_by              TEXT    NOT NULL,
    created_at              TEXT    NOT NULL,
    updated_at              TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budget_scope ON budget_policies(scope_type, scope_id);

-- task_runs: chi phí mỗi lần agent chạy task (tạo mới — bảng này không tồn tại trước TD-02)
CREATE TABLE IF NOT EXISTS task_runs (
    id          TEXT    PRIMARY KEY,
    task_id     TEXT,
    agent_id    TEXT    NOT NULL,
    cluster     TEXT,
    started_at  TEXT    NOT NULL,
    finished_at TEXT,
    status      TEXT    NOT NULL DEFAULT 'completed'
                        CHECK(status IN ('running','completed','failed','paused','blocked')),
    cost_usd    REAL    NOT NULL DEFAULT 0.0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    model       TEXT,
    created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_runs_agent   ON task_runs(agent_id, started_at);
CREATE INDEX IF NOT EXISTS idx_task_runs_cost    ON task_runs(cost_usd);
CREATE INDEX IF NOT EXISTS idx_task_runs_cluster ON task_runs(cluster);

-- revenue_records: doanh thu theo cluster, nhận qua POST /api/v1/budget/revenue
CREATE TABLE IF NOT EXISTS revenue_records (
    id           TEXT    PRIMARY KEY,
    cluster      TEXT    NOT NULL,
    amount_usd   REAL    NOT NULL,
    period_start TEXT    NOT NULL,
    period_end   TEXT    NOT NULL,
    source       TEXT    NOT NULL DEFAULT 'finance-agent',
    created_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rev_cluster ON revenue_records(cluster, period_start);

-- ============================================================
-- 21. ORG CHART (D1 TD-03) — org_nodes + veto_scope
-- ============================================================

-- org_nodes: org-lite registry nội bộ (TD-03) — profile_id đồng nhất agent_id trong config/agents/*.json + 'chu_tich'
-- TD-05 v19: thêm 5 cột lifecycle (lifecycle_stage, base_model, benchmark_record, shadow_mode_record, wizard_step_completed)
-- TD-07 v21: thêm knowledge_baseline (JSON) cho D0.3 Company Genesis Wizard
-- v30: thêm paused_at (Tạm dừng/Bật lại — có chủ đích TÁCH KHỎI active/lifecycle_stage
-- dùng cho "retired": paused là trạng thái đảo ngược được, agent vẫn hiện trong
-- cây tổ chức, khác retired là một chiều + bị ẩn khỏi cây)
CREATE TABLE IF NOT EXISTS org_nodes (
    profile_id              TEXT    PRIMARY KEY,
    role                    TEXT    NOT NULL DEFAULT 'member',
    org_unit                TEXT,
    manager_id              TEXT    REFERENCES org_nodes(profile_id) ON DELETE SET NULL,
    heartbeat_status        TEXT    NOT NULL DEFAULT 'ngủ'
                                        CHECK(heartbeat_status IN ('thức','ngủ','stale')),
    last_heartbeat_at       TEXT,
    active                  INTEGER NOT NULL DEFAULT 1,
    note                    TEXT,
    created_at              TEXT    NOT NULL,
    updated_at              TEXT    NOT NULL,
    lifecycle_stage         TEXT    NOT NULL DEFAULT 'design'
                                        CHECK(lifecycle_stage IN ('design','sandbox_benchmark','shadow_mode',
                                            'independent_operation','review','retired')),
    base_model              TEXT,
    benchmark_record        TEXT,
    shadow_mode_record      TEXT,
    wizard_step_completed   INTEGER NOT NULL DEFAULT 0
                                        CHECK(wizard_step_completed BETWEEN 0 AND 6),
    knowledge_baseline      TEXT    CHECK(knowledge_baseline IS NULL OR json_valid(knowledge_baseline)),
    paused_at               TEXT
);

CREATE INDEX IF NOT EXISTS idx_org_manager   ON org_nodes(manager_id);
CREATE INDEX IF NOT EXISTS idx_org_unit      ON org_nodes(org_unit);
CREATE INDEX IF NOT EXISTS idx_org_heartbeat ON org_nodes(heartbeat_status);

-- veto_scope: quyền VETO Compliance/Audit (TD-03)
CREATE TABLE IF NOT EXISTS veto_scope (
    id             TEXT    PRIMARY KEY,
    profile_id     TEXT    NOT NULL REFERENCES org_nodes(profile_id) ON DELETE CASCADE,
    veto_type      TEXT    NOT NULL CHECK(veto_type IN ('compliance','audit')),
    target_cluster TEXT    NOT NULL,
    active         INTEGER NOT NULL DEFAULT 1,
    note           TEXT,
    created_at     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_veto_profile ON veto_scope(profile_id);
CREATE INDEX IF NOT EXISTS idx_veto_cluster ON veto_scope(target_cluster);

-- ============================================================
-- 22. COMPANY GENESIS WIZARD (D0 TD-07) — genesis_sessions
-- ============================================================

-- genesis_sessions: lưu trạng thái phiên wizard thành lập công ty (chạy đúng 1 lần per company_id)
CREATE TABLE IF NOT EXISTS genesis_sessions (
    id                      TEXT    PRIMARY KEY,
    company_id              TEXT    NOT NULL,
    status                  TEXT    NOT NULL DEFAULT 'in_progress'
                                    CHECK(status IN ('in_progress','completed','abandoned')),
    step_current            TEXT    NOT NULL DEFAULT 'D0.1_interview',
    interview_answers       TEXT    CHECK(json_valid(interview_answers)),
    strategy_doc            TEXT,
    ceo_agent_decision      INTEGER CHECK(ceo_agent_decision IN (0,1)),
    ceo_threshold_clusters  INTEGER NOT NULL DEFAULT 3,
    knowledge_baseline_loaded INTEGER NOT NULL DEFAULT 0
                                    CHECK(knowledge_baseline_loaded IN (0,1)),
    variable_clusters_json  TEXT    CHECK(json_valid(variable_clusters_json)),
    onboarding_queue_json   TEXT    CHECK(json_valid(onboarding_queue_json)),
    chairman_confirmed_at   TEXT,
    ceo_chat_json           TEXT    CHECK(json_valid(ceo_chat_json)),
    created_at              TEXT    NOT NULL,
    updated_at              TEXT    NOT NULL
);

CREATE TRIGGER IF NOT EXISTS trg_genesis_sessions_updated_at
    AFTER UPDATE ON genesis_sessions
    FOR EACH ROW
    BEGIN
        UPDATE genesis_sessions SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
        WHERE id = OLD.id;
    END;

CREATE INDEX IF NOT EXISTS idx_genesis_company ON genesis_sessions(company_id, status);

-- ============================================================
-- 22. TASK VERDICTS (TD-08) — task_verdicts approval T0-T3
-- ============================================================

CREATE TABLE IF NOT EXISTS task_verdicts (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id               TEXT    NOT NULL,
    verdict_type          TEXT    NOT NULL
                                  CHECK(verdict_type IN
                                        ('process_evidence','correctness_evidence','self_check','reviewer_check')),
    submitted_by          TEXT    NOT NULL,
    content               TEXT    NOT NULL CHECK(json_valid(content)),
    verdict               TEXT    CHECK(verdict IN ('pass','fail','pending')),
    risk_tier             TEXT    NOT NULL CHECK(risk_tier IN ('T0','T1','T2','T3')),
    approval_required_by  TEXT,
    approved_by           TEXT,
    approved_at           TEXT,
    created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY(task_id) REFERENCES task_contracts(task_id)
);

CREATE INDEX IF NOT EXISTS idx_verdicts_task    ON task_verdicts(task_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_verdict ON task_verdicts(verdict);

-- ============================================================
-- 23. BINDING ROUTING + RBAC-lite (TD-09)
-- ============================================================

-- agent_channel_bindings: AgentBindingMatch routing table — priority-ordered channel dispatch (TD-09)
CREATE TABLE IF NOT EXISTS agent_channel_bindings (
    id           TEXT    PRIMARY KEY,
    agent_id     TEXT    NOT NULL,
    binding_type TEXT    NOT NULL CHECK(binding_type IN ('route','acp')),
    channel      TEXT    NOT NULL,
    account_id   TEXT    DEFAULT '*',
    peer         TEXT,
    guild_id     TEXT,
    team_id      TEXT,
    roles        TEXT    DEFAULT '[]' CHECK(json_valid(roles)),
    priority     INTEGER NOT NULL DEFAULT 0,
    active       INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
    created_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bindings_agent   ON agent_channel_bindings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bindings_channel ON agent_channel_bindings(channel);

-- rbac_board_permissions: RBAC-lite per board/column/card — agent permission grants (TD-09)
CREATE TABLE IF NOT EXISTS rbac_board_permissions (
    id            TEXT    PRIMARY KEY,
    agent_id      TEXT    NOT NULL,
    resource_type TEXT    NOT NULL CHECK(resource_type IN ('board','column','card')),
    resource_id   TEXT    NOT NULL,
    permission    TEXT    NOT NULL CHECK(permission IN ('read','write','admin','none')),
    granted_by    TEXT    NOT NULL,
    created_at    TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rbac_unique ON rbac_board_permissions(agent_id, resource_type, resource_id);

-- ============================================================
-- 24. C5/C6 EXTENSION (TD-10) — heartbeat + tool ACL + orchestration sessions
-- ============================================================

-- heartbeat_run_records: C6c cron job body results (one row per run)
CREATE TABLE IF NOT EXISTS heartbeat_run_records (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id                TEXT    NOT NULL,
    run_at                  TEXT    NOT NULL,
    active_hours_matched    INTEGER CHECK(active_hours_matched IN (0,1)),
    direct_policy           TEXT    CHECK(direct_policy IN ('allow','block')),
    prompt_sent             INTEGER CHECK(prompt_sent IN (0,1)),
    result                  TEXT    CHECK(result IS NULL OR json_valid(result)),
    created_at              TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_heartbeat_agent ON heartbeat_run_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_run   ON heartbeat_run_records(run_at);

-- tool_acl_overrides: C6d per-agent per-tool ACL override (timeout, host, workspace, subagent deny)
CREATE TABLE IF NOT EXISTS tool_acl_overrides (
    id              TEXT    PRIMARY KEY,
    agent_id        TEXT    NOT NULL,
    tool_name       TEXT    NOT NULL,
    timeout_seconds INTEGER,
    host            TEXT    CHECK(host IN ('auto','sandbox','gateway','node')),
    workspace_only  INTEGER CHECK(workspace_only IN (0,1)),
    deny_subagent   INTEGER NOT NULL DEFAULT 0 CHECK(deny_subagent IN (0,1)),
    created_at      TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_acl_unique ON tool_acl_overrides(agent_id, tool_name);

-- orchestration_sessions: C6a spawn tracking (max_concurrent + max_spawn_depth enforcement + visible mode)
CREATE TABLE IF NOT EXISTS orchestration_sessions (
    session_id          TEXT    PRIMARY KEY,
    agent_id            TEXT    NOT NULL,
    mode                TEXT    NOT NULL CHECK(mode IN ('run','session','visible')),
    parent_session_id   TEXT,
    task_context        TEXT    CHECK(task_context IS NULL OR json_valid(task_context)),
    status              TEXT    NOT NULL DEFAULT 'running'
                                CHECK(status IN ('running','completed','failed')),
    created_at          TEXT    NOT NULL,
    finished_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_orchsess_agent  ON orchestration_sessions(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_orchsess_parent ON orchestration_sessions(parent_session_id);

-- ============================================================
-- 19. DAILY DIGEST LOG (G.4.2) — TD-11 Phase 1
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_digest_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    digest_id       TEXT    NOT NULL UNIQUE,
    generated_at    TEXT    NOT NULL,
    generated_by    TEXT    NOT NULL DEFAULT 'ea_agent',
    period_from     TEXT    NOT NULL,
    period_to       TEXT    NOT NULL,
    payload         TEXT    NOT NULL CHECK(json_valid(payload)),
    sent_channels   TEXT    DEFAULT '[]' CHECK(json_valid(sent_channels)),
    sent_at         TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    digest_checksum TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','sent','failed')),
    alert_triggered INTEGER DEFAULT 0 CHECK(alert_triggered IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_digest_status    ON daily_digest_log(status);
CREATE INDEX IF NOT EXISTS idx_digest_generated ON daily_digest_log(generated_at);

-- ============================================================
-- 20. QUARTERLY DECISIONS (G.4.5) — TD-11 Phase 4
-- ============================================================

CREATE TABLE IF NOT EXISTS quarterly_decisions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_id     TEXT    NOT NULL UNIQUE,
    quarter         TEXT    NOT NULL,
    meeting_date    TEXT    NOT NULL,
    okr_achieved_pct REAL,
    chairman_rating  INTEGER CHECK(chairman_rating BETWEEN 1 AND 10),
    audit_rating     INTEGER CHECK(audit_rating BETWEEN 1 AND 10),
    expansion_decisions TEXT DEFAULT '[]' CHECK(json_valid(expansion_decisions)),
    adjustment_decisions TEXT DEFAULT '[]' CHECK(json_valid(adjustment_decisions)),
    next_quarter_okr TEXT   DEFAULT '{}' CHECK(json_valid(next_quarter_okr)),
    action_items    TEXT    DEFAULT '[]' CHECK(json_valid(action_items)),
    structural_diagnosis TEXT DEFAULT '[]' CHECK(json_valid(structural_diagnosis)),
    created_at      TEXT    NOT NULL
);

-- ============================================================
-- 25. API 3D (BS v28): agent_profiles + agent_provisioning
--     + agent_spatial_state + chat_messages
-- ============================================================

-- agent_profiles: tầng "có não" (profile Hermes thật / mô phỏng có cấu hình)
CREATE TABLE IF NOT EXISTS agent_profiles (
    profile_id              TEXT    PRIMARY KEY,
    name                    TEXT    NOT NULL,
    role                    TEXT    NOT NULL DEFAULT 'member',
    org_unit                TEXT,
    manager_id              TEXT,               -- app đảm bảo tồn tại org_nodes (không FK cứng, xem §2)
    profile_type            TEXT    NOT NULL DEFAULT 'hermes_profile'
                                    CHECK(profile_type IN ('hermes_profile','simulated')),
    model_provider          TEXT,
    model_name              TEXT,
    api_key_scope           TEXT    NOT NULL DEFAULT 'system'
                                    CHECK(api_key_scope IN ('system','profile')),
    soul_mode               TEXT    CHECK(soul_mode IN ('template_id','free_text')),
    soul_template_id        TEXT,
    soul_content            TEXT,               -- ≤20.000 ký tự (app validate)
    skills_json             TEXT    DEFAULT '[]' CHECK(json_valid(skills_json)),
    role_capabilities_json  TEXT    DEFAULT '{}' CHECK(json_valid(role_capabilities_json)),
    clone_from              TEXT,
    gateway_enabled         INTEGER NOT NULL DEFAULT 0 CHECK(gateway_enabled IN (0,1)),
    gateway_telegram        INTEGER NOT NULL DEFAULT 0 CHECK(gateway_telegram IN (0,1)),
    channels_json           TEXT    DEFAULT '["kanban","api"]' CHECK(json_valid(channels_json)),
    provisioning_status     TEXT    NOT NULL DEFAULT 'none'
                                    CHECK(provisioning_status IN ('none','queued','running','ready','failed')),
    gateway_status          TEXT    NOT NULL DEFAULT 'inactive'
                                    CHECK(gateway_status IN ('inactive','starting','active','error')),
    created_by              TEXT    NOT NULL,
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_type ON agent_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_manager ON agent_profiles(manager_id)
    WHERE manager_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_agent_profiles_updated_at
    AFTER UPDATE ON agent_profiles
    FOR EACH ROW
    BEGIN
        UPDATE agent_profiles SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE profile_id = OLD.profile_id;
    END;

-- agent_provisioning: job provisioning bất đồng bộ (BS-02 poll + guard ≤3 job)
CREATE TABLE IF NOT EXISTS agent_provisioning (
    provisioning_id     TEXT    PRIMARY KEY,    -- prefix 'apv_' do app sinh
    profile_id          TEXT    NOT NULL,
    status              TEXT    NOT NULL DEFAULT 'queued'
                                    CHECK(status IN ('queued','running','ready','failed')),
    phase               TEXT    CHECK(phase IN ('creating_profile','configuring_model',
                                    'writing_soul','installing_skills','starting_gateway')),
    step_detail         TEXT,
    error               TEXT,
    cleanup_on_fail     INTEGER NOT NULL DEFAULT 1 CHECK(cleanup_on_fail IN (0,1)),
    started_at          TEXT,
    finished_at         TEXT,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_provisioning_profile ON agent_provisioning(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_provisioning_status ON agent_provisioning(status)
    WHERE status IN ('queued','running');       -- đếm PROVISIONING_BUSY ≤3

CREATE TRIGGER IF NOT EXISTS trg_agent_provisioning_updated_at
    AFTER UPDATE ON agent_provisioning
    FOR EACH ROW
    BEGIN
        UPDATE agent_provisioning SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE provisioning_id = OLD.provisioning_id;
    END;

-- agent_spatial_state: trạng thái không gian 3D (BS-07 PATCH, BS-08 GET, BS-09 ?room_id)
CREATE TABLE IF NOT EXISTS agent_spatial_state (
    profile_id      TEXT    PRIMARY KEY,
    room_id         TEXT,
    position_x      REAL    NOT NULL DEFAULT 0.0,
    position_y      REAL    NOT NULL DEFAULT 0.0,
    position_z      REAL    NOT NULL DEFAULT 0.0,
    heading         REAL    NOT NULL DEFAULT 0.0,
    action          TEXT    NOT NULL DEFAULT 'idle',   -- app validate (spec không đóng list)
    activity        TEXT,
    action_target   TEXT,
    updated_by      TEXT    NOT NULL DEFAULT '3d',
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_spatial_state_room ON agent_spatial_state(room_id)
    WHERE room_id IS NOT NULL;
-- KHÔNG trigger updated_at: mọi PATCH phải set updated_at tường minh (SSE thứ tự đúng)

-- chat_messages: tin nhắn 2 chiều actor ↔ agent (BS-05 POST, BS-06 history/replay)
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id      TEXT    PRIMARY KEY,        -- prefix 'msg_' do app sinh
    thread_id       TEXT,                       -- NULL = hội thoại 1-1 không nhóm
    channel         TEXT    NOT NULL DEFAULT '3d',  -- kênh vật lý: 3d|telegram|api|kanban|system (mở, như directives.channel)
    from_profile    TEXT    NOT NULL,
    to_profile      TEXT    NOT NULL,
    kind            TEXT    NOT NULL DEFAULT 'text'
                            CHECK(kind IN ('text','directive','result','system')),
    body            TEXT    NOT NULL,
    source          TEXT    NOT NULL DEFAULT '3d'
                            CHECK(source IN ('3d','gateway','kanban','simulated')),
    meta_json       TEXT    DEFAULT '{}' CHECK(json_valid(meta_json)),  -- directive_id, ...
    status          TEXT    NOT NULL DEFAULT 'queued'
                            CHECK(status IN ('queued','delivered','error')),
    error           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_to_ts ON chat_messages(to_profile, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_from_ts ON chat_messages(from_profile, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id, created_at DESC)
    WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status)
    WHERE status = 'queued';                    -- dispatcher pickup queue

CREATE TRIGGER IF NOT EXISTS trg_chat_messages_no_delete
    BEFORE DELETE ON chat_messages
BEGIN
    SELECT RAISE(ABORT, 'chat_messages là append-only — không được xóa');
END;

-- ============================================================
-- [THONG BAO] v34 — một nguồn tổng hợp việc cần Chủ tịch chú ý
-- Mỗi vấn đề CHỈ 1 dòng (dedup_key UNIQUE); tự đóng khi vấn đề hết (resolved_at).
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id             TEXT    PRIMARY KEY,
    owner_id       TEXT    NOT NULL DEFAULT 'chu_tich',
    kind           TEXT    NOT NULL CHECK(kind IN ('approval','goal','task_due','monitor_alert')),
    subkind        TEXT    NOT NULL DEFAULT '',
    severity       TEXT    NOT NULL DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
    title          TEXT    NOT NULL,
    title_key      TEXT    NOT NULL,
    body           TEXT    NOT NULL DEFAULT '',
    payload        TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(payload)),
    target_screen  TEXT    NOT NULL
                           CHECK(target_screen IN ('approval-queue','goal-tree','task-trace','monitoring','customer-portal','projects')),
    target_type    TEXT    NOT NULL,
    target_id      TEXT,
    dedup_key      TEXT    NOT NULL UNIQUE,
    source_ref     TEXT,
    created_at     TEXT    NOT NULL,
    updated_at     TEXT    NOT NULL,
    read_at        TEXT,
    resolved_at    TEXT,
    resolve_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(owner_id, resolved_at, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_kind   ON notifications(kind, resolved_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);

-- ============================================================
-- [KANBAN-PROPOSAL] v41 — đề xuất bảng Kanban chờ Chủ tịch duyệt
-- Không tự tạo khi cài; chỉ sinh SAU khi genesis hoàn tất hoặc luồng được duyệt.
-- Cơ chế chữ ký (signature): sha256(prefix + "\n" + sorted(flows)) lấy 12 hex đầu
--   → chạy lại không nhân đôi nếu cùng tập luồng.
-- ============================================================
CREATE TABLE IF NOT EXISTS kanban_board_proposals (
    id                 TEXT PRIMARY KEY,
    company_id         TEXT NOT NULL DEFAULT '',
    company_prefix     TEXT NOT NULL DEFAULT '',
    signature          TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','approved','rejected','superseded')),
    trigger_source     TEXT NOT NULL DEFAULT '',
    flow_count         INTEGER NOT NULL DEFAULT 0,
    flows_json         TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(flows_json)),
    groups_json        TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(groups_json)),
    skipped_json       TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(skipped_json)),
    unclassified_json  TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(unclassified_json)),
    created_json       TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(created_json)),
    existing_json      TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(existing_json)),
    map_path           TEXT NOT NULL DEFAULT '',
    decide_reason      TEXT,
    decided_by         TEXT,
    decided_at         TEXT,
    applied_at         TEXT,
    apply_error        TEXT,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kanban_board_proposals_status ON kanban_board_proposals (status);
CREATE INDEX IF NOT EXISTS idx_kanban_board_proposals_sig    ON kanban_board_proposals (signature);

-- ============================================================
-- v43: DIGEST SCHEDULER RUNS (in-process digest scheduler)
-- ============================================================

CREATE TABLE IF NOT EXISTS digest_scheduler_runs (
    id                  TEXT    PRIMARY KEY,
    company_id          TEXT    NOT NULL DEFAULT 'default',
    company_name        TEXT,
    kind                TEXT    NOT NULL CHECK(kind IN ('daily','weekly')),
    period_key          TEXT    NOT NULL,
    scheduled_for       TEXT    NOT NULL,
    report_period_start TEXT,
    report_period_end   TEXT,
    status              TEXT    NOT NULL DEFAULT 'pending'
                                CHECK(status IN ('pending','sent','fallback','failed','skipped','missed')),
    channels_json       TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(channels_json)),
    digest_id           TEXT,
    attempt_count       INTEGER NOT NULL DEFAULT 0,
    started_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    last_attempt_at     TEXT,
    finished_at         TEXT,
    actor               TEXT    NOT NULL DEFAULT 'scheduler',
    token_source        TEXT,
    error_code          TEXT,
    error_message       TEXT,
    note                TEXT,
    UNIQUE (kind, period_key)
);

CREATE INDEX IF NOT EXISTS idx_dsr_kind_period   ON digest_scheduler_runs (kind, period_key);
CREATE INDEX IF NOT EXISTS idx_dsr_status        ON digest_scheduler_runs (status);
CREATE INDEX IF NOT EXISTS idx_dsr_company       ON digest_scheduler_runs (company_id, status);
CREATE INDEX IF NOT EXISTS idx_dsr_scheduled_for ON digest_scheduler_runs (scheduled_for DESC);

-- ============================================================
-- v46: CUSTOMER PORTAL — cổng trao đổi 2 chiều với khách bên ngoài
-- (làm rõ yêu cầu + nghiệm thu giao diện/sản phẩm qua liên kết bí mật)
-- Ranh giới bảo mật: token bí mật trong URL (sha256 hexdigest lưu vào DB,
-- token thô không bao giờ lưu hay log). Khách không cần tài khoản nội bộ.
-- Tất cả bảng có company_id TEXT NOT NULL DEFAULT 'default'.
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_accounts (
    id             TEXT    PRIMARY KEY,
    company_id     TEXT    NOT NULL DEFAULT 'default',
    name           TEXT    NOT NULL,
    contact_name   TEXT,
    contact_email  TEXT,
    contact_phone  TEXT,
    channel        TEXT    NOT NULL DEFAULT 'portal'
                           CHECK(channel IN ('portal','email','telegram','zalo','other')),
    channel_ref    TEXT,
    external_ref   TEXT,
    status         TEXT    NOT NULL DEFAULT 'active'
                           CHECK(status IN ('active','archived')),
    created_at     TEXT    NOT NULL,
    updated_at     TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_ext_ref
    ON customer_accounts (company_id, external_ref)
    WHERE external_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_threads (
    id               TEXT    PRIMARY KEY,
    company_id       TEXT    NOT NULL DEFAULT 'default',
    customer_id      TEXT    NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
    subject          TEXT    NOT NULL,
    related_kind     TEXT    NOT NULL DEFAULT 'request'
                             CHECK(related_kind IN ('request','project','review','other')),
    related_id       TEXT,
    status           TEXT    NOT NULL DEFAULT 'open'
                             CHECK(status IN ('open','awaiting_customer','awaiting_staff','closed')),
    responsible_dept TEXT    NOT NULL DEFAULT '',
    opened_by        TEXT    NOT NULL DEFAULT 'system',
    created_at       TEXT    NOT NULL,
    updated_at       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_threads_company
    ON customer_threads (company_id, related_kind, related_id);

CREATE TABLE IF NOT EXISTS customer_messages (
    id                  TEXT    PRIMARY KEY,
    thread_id           TEXT    NOT NULL REFERENCES customer_threads(id) ON DELETE CASCADE,
    company_id          TEXT    NOT NULL DEFAULT 'default',
    direction           TEXT    NOT NULL CHECK(direction IN ('in','out')),
    author_kind         TEXT    NOT NULL CHECK(author_kind IN ('customer','staff','system')),
    author_ref          TEXT    NOT NULL DEFAULT '',
    body                TEXT    NOT NULL,
    payload             TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(payload)),
    visible_to_customer INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_messages_thread
    ON customer_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customer_messages_visible
    ON customer_messages (company_id, visible_to_customer);

CREATE TABLE IF NOT EXISTS customer_portal_tokens (
    id             TEXT    PRIMARY KEY,
    company_id     TEXT    NOT NULL DEFAULT 'default',
    token_hash     TEXT    NOT NULL UNIQUE,
    purpose        TEXT    NOT NULL CHECK(purpose IN ('review','thread')),
    scope_kind     TEXT    NOT NULL,
    scope_id       TEXT    NOT NULL,
    customer_id    TEXT,
    thread_id      TEXT,
    single_use     INTEGER NOT NULL DEFAULT 1,
    max_uses       INTEGER NOT NULL DEFAULT 1,
    use_count      INTEGER NOT NULL DEFAULT 0,
    expires_at     TEXT    NOT NULL,
    revoked_at     TEXT,
    public_payload TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(public_payload)),
    label          TEXT    NOT NULL DEFAULT '',
    created_by     TEXT    NOT NULL DEFAULT 'system',
    created_at     TEXT    NOT NULL,
    last_used_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_hash
    ON customer_portal_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_scope
    ON customer_portal_tokens (scope_kind, scope_id);

CREATE TABLE IF NOT EXISTS customer_reviews (
    id               TEXT    PRIMARY KEY,
    company_id       TEXT    NOT NULL DEFAULT 'default',
    token_id         TEXT,
    customer_id      TEXT,
    scope_kind       TEXT    NOT NULL,
    scope_id         TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'pending'
                             CHECK(status IN ('pending','approved','changes_requested','cancelled')),
    decided_at       TEXT,
    decided_by       TEXT,
    decision_note    TEXT,
    round_no         INTEGER NOT NULL DEFAULT 1,
    responsible_dept TEXT    NOT NULL DEFAULT '',
    requested_by     TEXT    NOT NULL DEFAULT '',
    created_at       TEXT    NOT NULL,
    updated_at       TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_scope
    ON customer_reviews (scope_kind, scope_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_company_status
    ON customer_reviews (company_id, status);

CREATE TABLE IF NOT EXISTS customer_portal_events (
    id              TEXT    PRIMARY KEY,
    company_id      TEXT    NOT NULL DEFAULT 'default',
    token_id        TEXT,
    customer_id     TEXT,
    action          TEXT    NOT NULL,
    scope_kind      TEXT    NOT NULL DEFAULT '',
    scope_id        TEXT    NOT NULL DEFAULT '',
    outcome         TEXT    NOT NULL,
    http_status     INTEGER NOT NULL,
    detail          TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(detail)),
    actor_ip_hash   TEXT    NOT NULL DEFAULT '',
    user_agent_hash TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cpe_company_created
    ON customer_portal_events (company_id, created_at DESC);

-- ============================================================
-- v48: NHỊP TIM VÒNG NỀN — runner_heartbeats + runner_silence_events
-- Nguồn sự thật đọc được từ bên ngoài tiến trình (DB read-only).
-- Không dùng CHECK(json_valid(...)) để tránh bẫy sqlite 3.37 NULL.
-- ============================================================

CREATE TABLE IF NOT EXISTS runner_heartbeats (
    kind          TEXT PRIMARY KEY,
    last_at       TEXT,
    last_ok_at    TEXT,
    last_error_at TEXT,
    last_detail   TEXT,
    last_pid      INTEGER,
    updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS runner_silence_events (
    id                TEXT PRIMARY KEY,
    kind              TEXT NOT NULL,
    started_at        TEXT,
    ended_at          TEXT,
    duration_seconds  INTEGER,
    detected_at       TEXT,
    detected_by       TEXT,
    threshold_seconds INTEGER,
    notified_at       TEXT,
    notify_channel    TEXT,
    notify_detail     TEXT,
    evidence_json     TEXT
);
CREATE INDEX IF NOT EXISTS idx_rse_kind_started ON runner_silence_events (kind, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpe_token
    ON customer_portal_events (token_id);
CREATE INDEX IF NOT EXISTS idx_cpe_ip_created
    ON customer_portal_events (actor_ip_hash, created_at);

-- ============================================================
-- v49: GIAO NHẬN ĐA KÊNH + NHIỀU NGƯỜI NHẬN + LEO THANG CẢNH BÁO
-- ============================================================

-- notification_preferences mở rộng: scope_type += incident_class, severity;
-- cột channels (danh sách kênh theo thứ tự ưu tiên); cột company_id.
-- (Bảng được recreate bởi migration v49 để thêm CHECK constraint mới.)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id          TEXT    PRIMARY KEY,
    owner_id    TEXT    NOT NULL,
    scope_type  TEXT    NOT NULL
                CHECK(scope_type IN ('topic','task','agent','board','global',
                                     'incident_class','severity')),
    scope_id    TEXT,
    action      TEXT    NOT NULL
                CHECK(action IN ('subscribe','mute')),
    channels    TEXT    NOT NULL DEFAULT '["dashboard"]'
                CHECK(json_valid(channels)),
    company_id  TEXT    NOT NULL DEFAULT 'default',
    expires_at  TEXT,
    created_at  TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_scope
    ON notification_preferences(owner_id, scope_type, scope_id);

-- Cột giao nhận thêm vào notifications (được thêm bởi migration v49 ALTER TABLE).
-- Schema mới (fresh DB) đã bao gồm sẵn.
-- ALTER TABLE notifications ADD COLUMN delivered_at TEXT;
-- ALTER TABLE notifications ADD COLUMN delivery_state TEXT NOT NULL DEFAULT 'pending';
-- ALTER TABLE notifications ADD COLUMN escalation_level INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE notifications ADD COLUMN escalated_at TEXT;
-- ALTER TABLE notifications ADD COLUMN escalation_reason TEXT;

-- Sổ ghi vết giao nhận — 1 dòng = 1 lần thử gửi 1 kênh cho 1 người nhận.
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id              TEXT    PRIMARY KEY,
    notification_id TEXT    NOT NULL REFERENCES notifications(id),
    owner_id        TEXT    NOT NULL,
    channel         TEXT    NOT NULL,
    target          TEXT,
    status          TEXT    NOT NULL CHECK(status IN ('sent','failed')),
    attempts        INTEGER NOT NULL DEFAULT 1,
    is_fallback     INTEGER NOT NULL DEFAULT 0,
    last_error      TEXT,
    attempted_at    TEXT    NOT NULL,
    sent_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_notif_del_notification
    ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_del_owner
    ON notification_deliveries(owner_id, sent_at);

-- ============================================================
-- v50: PROJECTS — Luồng giao dự án end-to-end 10 bước
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id              TEXT    PRIMARY KEY,
    company_id      TEXT    NOT NULL DEFAULT 'default',
    code            TEXT    NOT NULL,
    title           TEXT    NOT NULL,
    description     TEXT    NOT NULL DEFAULT '',
    customer_id     TEXT    REFERENCES customer_accounts(id) ON DELETE SET NULL,
    request_ref     TEXT    NOT NULL DEFAULT '',
    thread_id       TEXT,
    current_step    TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'active'
                            CHECK(status IN ('active','completed','cancelled','on_hold')),
    owner_dept      TEXT    NOT NULL DEFAULT '',
    started_at      TEXT    NOT NULL,
    due_at          TEXT,
    completed_at    TEXT,
    created_by      TEXT    NOT NULL DEFAULT 'system',
    created_at      TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL,
    UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_projects_company_status
    ON projects (company_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_customer
    ON projects (customer_id);

CREATE TRIGGER IF NOT EXISTS trg_projects_updated_at
    AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS project_steps (
    id               TEXT    PRIMARY KEY,
    project_id       TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id       TEXT    NOT NULL DEFAULT 'default',
    step_no          INTEGER NOT NULL,
    step_key         TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'pending'
                             CHECK(status IN ('pending','in_progress','waiting_customer','blocked','done','cancelled')),
    responsible_dept TEXT    NOT NULL DEFAULT '',
    responsible_actor TEXT   NOT NULL DEFAULT '',
    due_at           TEXT,
    started_at       TEXT,
    completed_at     TEXT,
    kanban_task_id   TEXT,
    kanban_board     TEXT,
    artifact_ref     TEXT    NOT NULL DEFAULT '',
    note             TEXT    NOT NULL DEFAULT '',
    round_no         INTEGER NOT NULL DEFAULT 1,
    created_at       TEXT    NOT NULL,
    updated_at       TEXT    NOT NULL,
    UNIQUE(project_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_project_steps_company_status
    ON project_steps (company_id, status, due_at);

CREATE TRIGGER IF NOT EXISTS trg_project_steps_updated_at
    AFTER UPDATE ON project_steps
BEGIN
    UPDATE project_steps SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS project_proposals (
    id                  TEXT    PRIMARY KEY,
    project_id          TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id          TEXT    NOT NULL DEFAULT 'default',
    round_no            INTEGER NOT NULL DEFAULT 1,
    status              TEXT    NOT NULL DEFAULT 'draft'
                                CHECK(status IN ('draft','submitted','approved','rejected','changes_requested')),
    summary             TEXT    NOT NULL DEFAULT '',
    features            TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(features)),
    scope               TEXT    NOT NULL DEFAULT '',
    assumptions         TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(assumptions)),
    risks               TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(risks)),
    approval_request_id TEXT,
    submitted_by        TEXT    NOT NULL DEFAULT '',
    submitted_at        TEXT,
    decided_by          TEXT,
    decided_at          TEXT,
    decision_note       TEXT,
    rework_due_at       TEXT,
    rework_assignee     TEXT    NOT NULL DEFAULT '',
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL,
    UNIQUE(project_id, round_no)
);

CREATE INDEX IF NOT EXISTS idx_project_proposals_approval
    ON project_proposals (approval_request_id);

CREATE TRIGGER IF NOT EXISTS trg_project_proposals_updated_at
    AFTER UPDATE ON project_proposals
BEGIN
    UPDATE project_proposals SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS project_events (
    id          TEXT    PRIMARY KEY,
    project_id  TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id  TEXT    NOT NULL DEFAULT 'default',
    event_type  TEXT    NOT NULL,
    from_step   TEXT    NOT NULL DEFAULT '',
    to_step     TEXT    NOT NULL DEFAULT '',
    actor       TEXT    NOT NULL DEFAULT 'system',
    detail      TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(detail)),
    created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_events_project
    ON project_events (project_id, created_at);

-- ============================================================
-- v55: Human Accounts — đa người dùng đăng nhập (RBAC)
-- ============================================================

CREATE TABLE IF NOT EXISTS human_accounts (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    full_name     TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('chu_tich','truong_phong','chi_xem')),
    org_unit      TEXT,
    profile_id    TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
    is_root       INTEGER NOT NULL DEFAULT 0 CHECK(is_root IN (0,1)),
    created_by    TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL,
    password_changed_at TEXT,
    note          TEXT,
    expires_at    TEXT,
    lock_reason   TEXT CHECK(lock_reason IN (NULL,'expired','revoked')),
    locked_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_human_accounts_role ON human_accounts(role, is_active);

CREATE TABLE IF NOT EXISTS human_sessions (
    token_hash  TEXT PRIMARY KEY,
    account_id  TEXT NOT NULL,
    username    TEXT NOT NULL,
    role        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    revoked_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_human_sessions_account ON human_sessions(account_id);

CREATE TABLE IF NOT EXISTS human_activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    at          TEXT NOT NULL,
    username    TEXT NOT NULL,
    account_id  TEXT,
    role        TEXT NOT NULL,
    action      TEXT NOT NULL,
    resource    TEXT,
    resource_id TEXT,
    result      TEXT NOT NULL CHECK(result IN ('allow','deny')),
    detail      TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(detail))
);
CREATE INDEX IF NOT EXISTS idx_human_activity_at ON human_activity_log(at DESC);
CREATE INDEX IF NOT EXISTS idx_human_activity_user ON human_activity_log(username, at DESC);

-- ============================================================
-- v56. API KEYS — khoá ngoài có vết + hạn dùng
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    key_prefix  TEXT    NOT NULL,
    key_hash    TEXT    NOT NULL UNIQUE,
    status      TEXT    NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active','paused','revoked')),
    created_by  TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    expires_at  TEXT,
    last_used_at TEXT,
    use_count   INTEGER NOT NULL DEFAULT 0,
    revoked_by  TEXT,
    revoked_at  TEXT,
    paused_at   TEXT,
    resumed_at  TEXT,
    note        TEXT,
    scope       TEXT    NOT NULL DEFAULT 'read_write'
                        CHECK(scope IN ('read_only','read_write'))
);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(name);

CREATE TABLE IF NOT EXISTS api_key_audit (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    at          TEXT    NOT NULL,
    api_key_id  TEXT,
    key_name    TEXT    NOT NULL,
    action      TEXT    NOT NULL CHECK(action IN ('create','revoke','pause','resume','extend','import')),
    actor       TEXT    NOT NULL,
    actor_role  TEXT    NOT NULL,
    detail      TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(detail))
);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_key ON api_key_audit(api_key_id, at DESC);

-- ============================================================
-- v61: ACCOUNT EXPIRY ALERTS — cảnh báo hạn dùng tài khoản chỉ xem
-- ============================================================

CREATE TABLE IF NOT EXISTS account_expiry_alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_date  TEXT NOT NULL,
    account_id  TEXT NOT NULL,
    username    TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    days_left   INTEGER NOT NULL,
    expires_at  TEXT NOT NULL,
    message_vi  TEXT NOT NULL,
    message_en  TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    UNIQUE(alert_date, account_id)
);
CREATE INDEX IF NOT EXISTS idx_account_expiry_alerts_date ON account_expiry_alerts(alert_date DESC);

-- v63: CONSENSUS DETECT — đánh giá đồng thuận tự động theo từng lượt
CREATE TABLE IF NOT EXISTS meeting_consensus_checks (
    id            TEXT    PRIMARY KEY,
    session_id    TEXT    NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    turn_id       TEXT    NOT NULL REFERENCES meeting_turns(id) ON DELETE CASCADE,
    round_number  INTEGER,
    member_name   TEXT,
    co_y_moi      INTEGER NOT NULL,
    co_phan_doi   INTEGER NOT NULL,
    nguon         TEXT    NOT NULL CHECK(nguon IN ('model','pass','skip','empty','timeout','model_error')),
    ly_do         TEXT,
    trich_dan     TEXT,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(session_id, turn_id)
);
CREATE INDEX IF NOT EXISTS idx_meeting_consensus_checks_session
    ON meeting_consensus_checks (session_id, created_at);

-- ============================================================
-- v65: AI LOG VIEW AUDIT — vết kiểm toán việc xem nhật ký AI (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_log_view_audit (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    viewer        TEXT    NOT NULL,
    role          TEXT    NOT NULL,
    action        TEXT    NOT NULL CHECK(action IN ('view_profiles','view_sessions','view_turns','search','export','view_exchanges','view_audit','deny','grant')),
    target_profile TEXT,
    target_ref    TEXT,
    ip_hash       TEXT,
    detail_json   TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(detail_json))
);
CREATE INDEX IF NOT EXISTS idx_ai_log_view_at ON ai_log_view_audit(at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_view_viewer ON ai_log_view_audit(viewer, at DESC);
CREATE TRIGGER IF NOT EXISTS trg_ai_log_view_no_update BEFORE UPDATE ON ai_log_view_audit
BEGIN SELECT RAISE(ABORT, 'ai_log_view_audit là append-only'); END;
CREATE TRIGGER IF NOT EXISTS trg_ai_log_view_no_delete BEFORE DELETE ON ai_log_view_audit
BEGIN SELECT RAISE(ABORT, 'ai_log_view_audit là append-only'); END;

-- ============================================================
-- v66: XIN PHÉP TRƯỚC KHI DÙNG CÔNG CỤ — luật + yêu cầu (trạng thái duyệt nằm ở approval_requests)
-- ============================================================

CREATE TABLE IF NOT EXISTS tool_approval_rules (
    id              TEXT    PRIMARY KEY,
    profile_id      TEXT    NOT NULL DEFAULT '*',
    tool_pattern    TEXT    NOT NULL,
    conditions_json TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(conditions_json)),
    risk_tier       TEXT    NOT NULL DEFAULT 'T1' CHECK(risk_tier IN ('T1','T2','T3')),
    valid_hours     INTEGER NOT NULL DEFAULT 24 CHECK(valid_hours BETWEEN 1 AND 168),
    note            TEXT,
    active          INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
    created_by      TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tool_approval_rules_active ON tool_approval_rules (active, tool_pattern);

CREATE TABLE IF NOT EXISTS tool_approval_requests (
    id            TEXT    PRIMARY KEY,
    approval_id   TEXT    NOT NULL UNIQUE,
    rule_id       TEXT,
    agent_id      TEXT    NOT NULL,
    tool_name     TEXT    NOT NULL,
    fingerprint   TEXT    NOT NULL,
    args_preview  TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(args_preview)),
    status        TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open','used')),
    valid_hours   INTEGER NOT NULL DEFAULT 24,
    session_id    TEXT,
    task_id       TEXT,
    created_at    TEXT    NOT NULL,
    used_at       TEXT,
    args_full     TEXT,
    matched_json  TEXT
);
CREATE INDEX IF NOT EXISTS idx_tool_approval_requests_fp ON tool_approval_requests (agent_id, fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_approval_requests_created ON tool_approval_requests (created_at DESC);

-- ============================================================
-- v67: LÝ DO CHO/CHẶN TỪNG LỆNH — policy_events.tool_call_id (ghép với nhật ký AI) + sự kiện cổng xin phép theo từng lệnh
-- (chỉ mục trên policy_events.tool_call_id được tạo trong _patch_why_allowed_v67 vì CSDL cũ chưa có cột lúc chạy tệp này)
-- ============================================================

CREATE TABLE IF NOT EXISTS tool_approval_events (
    id            TEXT    PRIMARY KEY,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    agent_id      TEXT    NOT NULL,
    tool_name     TEXT    NOT NULL,
    session_id    TEXT,
    tool_call_id  TEXT,
    approval_id   TEXT    NOT NULL,
    rule_id       TEXT,
    state         TEXT    NOT NULL CHECK(state IN ('requested','waiting','rejected','used')),
    detail_json   TEXT
);
CREATE INDEX IF NOT EXISTS idx_tool_approval_events_call ON tool_approval_events (session_id, tool_call_id);
CREATE INDEX IF NOT EXISTS idx_tool_approval_events_apr ON tool_approval_events (approval_id);

-- ============================================================
-- v68: RÀ SOÁT CHẤT LƯỢNG NHÂN VIÊN AI THEO QUÝ — sổ quyết định (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_quality_reviews (
    id            TEXT    PRIMARY KEY,
    profile_id    TEXT    NOT NULL,
    decision      TEXT    NOT NULL CHECK(decision IN ('keep','retest','retire')),
    note          TEXT,
    decided_by    TEXT    NOT NULL,
    decided_role  TEXT    NOT NULL,
    decided_at    TEXT    NOT NULL,
    snapshot_json TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(snapshot_json)),
    effect_json   TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(effect_json))
);
CREATE INDEX IF NOT EXISTS idx_agent_quality_reviews_profile ON agent_quality_reviews (profile_id, decided_at DESC);
CREATE TRIGGER IF NOT EXISTS trg_agent_quality_reviews_no_update BEFORE UPDATE ON agent_quality_reviews
BEGIN SELECT RAISE(ABORT, 'agent_quality_reviews là append-only'); END;
CREATE TRIGGER IF NOT EXISTS trg_agent_quality_reviews_no_delete BEFORE DELETE ON agent_quality_reviews
BEGIN SELECT RAISE(ABORT, 'agent_quality_reviews là append-only'); END;

-- ============================================================
-- v69: nhất quán cấu hình agent + nhiệm vụ thường kỳ do Chủ tịch khai báo + kiểm tra năng lực + chất lượng lượt họp
-- (cột mới của meeting_turns nằm trong CREATE TABLE meeting_turns và được thêm cho CSDL cũ trong _patch_v69)
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_effect_failures (
    apr_id      TEXT    PRIMARY KEY,
    code        TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS cfg_standing_duties (
    id          TEXT    PRIMARY KEY,
    assignee    TEXT    NOT NULL,
    title       TEXT    NOT NULL,
    instruction TEXT    NOT NULL,
    every       TEXT    NOT NULL DEFAULT 'week' CHECK(every IN ('day','week')),
    enabled     INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
    created_by  TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS benchmark_cases (
    id          TEXT    PRIMARY KEY,
    scope       TEXT    NOT NULL DEFAULT 'role' CHECK(scope IN ('role','agent')),
    scope_id    TEXT    NOT NULL,
    category    TEXT    NOT NULL CHECK(category IN ('accuracy','scope','injection')),
    title       TEXT    NOT NULL,
    prompt      TEXT    NOT NULL,
    check_type  TEXT    NOT NULL CHECK(check_type IN ('contains_any','contains_all','not_contains','regex','refuses')),
    check_value TEXT    NOT NULL DEFAULT '[]',
    active      INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
    created_by  TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_benchmark_cases_scope ON benchmark_cases (scope, scope_id, active);

CREATE TABLE IF NOT EXISTS benchmark_runs (
    id            TEXT    PRIMARY KEY,
    profile_id    TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'running' CHECK(status IN ('running','done','error')),
    started_at    TEXT    NOT NULL,
    finished_at   TEXT,
    cases_total   INTEGER NOT NULL DEFAULT 0,
    metrics_json  TEXT    NOT NULL DEFAULT '{}' CHECK(json_valid(metrics_json)),
    details_json  TEXT    NOT NULL DEFAULT '[]' CHECK(json_valid(details_json)),
    passed        INTEGER,
    run_by        TEXT    NOT NULL,
    error         TEXT
);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_profile ON benchmark_runs (profile_id, started_at DESC);

-- v71: kênh báo thẳng Chủ tịch + kênh tố giác

CREATE TABLE IF NOT EXISTS chairman_alerts (
    id                     TEXT PRIMARY KEY,
    source                 TEXT NOT NULL,
    severity               TEXT NOT NULL CHECK(severity IN ('warning','critical')),
    title                  TEXT NOT NULL,
    body                   TEXT NOT NULL,
    ref                    TEXT,
    detected_at            TEXT,
    respond_within_minutes INTEGER NOT NULL DEFAULT 60,
    created_at             TEXT NOT NULL,
    acked_at               TEXT,
    acked_by               TEXT,
    dedup_key              TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_chairman_alerts_open ON chairman_alerts (acked_at, created_at);

CREATE TABLE IF NOT EXISTS whistleblower_tips (
    id                 TEXT PRIMARY KEY,
    reporter_hash      TEXT NOT NULL,
    content            TEXT NOT NULL,
    has_evidence       INTEGER NOT NULL DEFAULT 0,
    group_id           TEXT,
    status             TEXT NOT NULL CHECK(status IN ('queued','escalated','duplicate','rate_limited')),
    created_at         TEXT NOT NULL,
    forwarded_event_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_wb_tips_reporter ON whistleblower_tips (reporter_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_wb_tips_group ON whistleblower_tips (group_id);

-- v72: đóng băng quyền ghi của nhân viên

CREATE TABLE IF NOT EXISTS agent_freezes (
    id         TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    reason     TEXT NOT NULL,
    evidence   TEXT,
    frozen_by  TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','lifted','expired')),
    lifted_at  TEXT,
    lifted_by  TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_freezes_active ON agent_freezes (profile_id, status);
