(() => {
  // src/lib/react-shim.ts
  var SDK = window.__HERMES_PLUGIN_SDK__;
  var React = SDK.React;
  var react_shim_default = React;
  var useState = SDK.hooks.useState;
  var useEffect = SDK.hooks.useEffect;
  var useCallback = SDK.hooks.useCallback;
  var useMemo = SDK.hooks.useMemo;
  var useRef = SDK.hooks.useRef;
  var useContext = SDK.hooks.useContext;
  var createContext = SDK.hooks.createContext;

  // src/lib/sdk.ts
  var SDK2 = window.__HERMES_PLUGIN_SDK__;
  var {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Button,
    Input,
    Label,
    Select,
    SelectOption,
    Separator,
    Tabs,
    TabsList,
    TabsTrigger
  } = SDK2.components;
  var fetchJSON = SDK2.fetchJSON;
  var cn = SDK2.utils.cn;
  var timeAgo = SDK2.utils.timeAgo;
  var isoTimeAgo = SDK2.utils.isoTimeAgo;

  // ../../hermes-poclip/dashboard/src/i18n/label-groups.en.ts
  var labelGroupsEn = {
    // Nhãn dự phòng khi mã không tìm thấy trong bảng — dùng bởi resolveLabelOrCode.
    unknown: "Unknown",
    // Vòng đời nhân sự (lifecycle_stage của agent profile).
    lifecycle: {
      design: "Design",
      sandbox_benchmark: "Sandbox Benchmark",
      shadow_mode: "Shadow Mode",
      independent_operation: "Independent Operation",
      review: "Under Review",
      retired: "Retired"
    },
    // Hướng trao đổi A2A (direction trong a2a_grants).
    a2aDirection: {
      unidirectional: "Unidirectional",
      bidirectional: "Bidirectional"
    },
    // Chế độ sandbox (sandbox_mode).
    sandboxMode: {
      off: "Off",
      "non-main": "Non-main only",
      all: "All"
    },
    // Backend sandbox (sandbox_backend).
    sandboxBackend: {
      local: "Local machine",
      docker: "In Docker",
      ssh: "Remote via SSH",
      modal: "Modal (cloud)"
    },
    // Trạng thái phiên họp (meeting session status).
    sessionStatus: {
      draft: "Draft",
      invited: "Invited",
      quorum_met: "Quorum Met",
      in_progress: "In Progress",
      discussing: "Discussing",
      summarizing: "Summarizing",
      decided: "Decided",
      closed: "Closed",
      suspended: "Suspended",
      cancelled: "Cancelled",
      scheduled: "Scheduled",
      failed: "Failed",
      paused: "Paused"
    },
    budgetScope: {
      agent: "AI Staff",
      cluster: "Cluster",
      company: "Company"
    },
    // Trạng thái công việc Kanban (work / task status).
    workStatus: {
      todo: "To Do",
      ready: "Ready",
      running: "Running",
      blocked: "Blocked",
      done: "Done",
      archived: "Archived",
      draft: "Draft",
      assigned: "Assigned",
      in_progress: "In Progress",
      pending_review: "Pending Review",
      review: "Under Review",
      triage: "Triage",
      escalated: "Escalated",
      cancelled: "Cancelled",
      failed: "Failed",
      queued: "Queued",
      paused: "Paused",
      rejected: "Rejected",
      scheduled: "Scheduled",
      backlog: "Backlog",
      claimed: "Claimed",
      in_review: "In Review"
    },
    // Trạng thái mục tiêu (goals.status).
    goalStatus: {
      planned: "Planned",
      active: "Active",
      achieved: "Achieved",
      cancelled: "Cancelled"
    },
    // Cấp độ mục tiêu (goals.level).
    goalLevel: {
      company: "Company",
      initiative: "Initiative",
      outcome: "Outcome",
      task: "Task"
    },
    // Loại mẫu họp (template_type của MeetingTemplate).
    meetingTemplateType: {
      standup: "Stand-up",
      project: "Project Review",
      incident: "Incident Response",
      strategy: "Strategy Session",
      recurring: "Recurring",
      retrospective: "Retrospective"
    },
    // Cách phát biểu trong phiên họp (speaking_mode của MeetingTemplate).
    speakingMode: {
      round_robin: "Round Robin",
      hybrid: "Hybrid",
      random_free: "Free speaking"
    },
    // Hướng và loại thao tác A2A event (a2a_events.status CHECK).
    a2aOperation: {
      kanban_comment: "Comment on work card",
      delegate_task: "Delegate work to another AI",
      send_message: "Send message"
    },
    // Trạng thái sự kiện A2A (a2a_events.status CHECK).
    a2aEventStatus: {
      pending: "Pending send",
      delivered: "Delivered",
      processing: "Processing",
      processed: "Processed",
      failed: "Send failed",
      dlq: "Stuck in dead-letter queue",
      expired: "Expired"
    },
    // Quyền truy cập workspace (sandbox_config.workspace_access CHECK).
    workspaceAccess: {
      none: "No workspace access",
      ro: "Read-only workspace",
      rw: "Read and write workspace"
    },
    // Trạng thái cuộc họp (meetings.status CHECK — 3 mã: khác sessionStatus).
    meetingStatus: {
      draft: "Draft",
      in_progress: "In Progress",
      cancelled: "Cancelled",
      completed: "Completed"
    },
    // Mức ưu tiên action item trong cuộc họp.
    actionPriority: {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low"
    },
    // Trạng thái action item (meeting_action_items.status).
    actionItemStatus: {
      open: "Open",
      in_progress: "In Progress",
      completed: "Completed",
      rejected: "Rejected",
      deferred: "Deferred"
    },
    // Nhịp tim agent (heartbeat_status: thức/ngủ/stale).
    heartbeatStatus: {
      "th\u1EE9c": "Working",
      "ng\u1EE7": "Idle",
      stale: "No heartbeat"
    },
    // Loại thông báo (4 mã) — khớp NOTIFICATION_KIND.
    notificationKind: {
      approval: "Pending approvals",
      goal: "Goals to review",
      task_due: "Tasks due or overdue",
      monitor_alert: "System alerts"
    },
    // Mức nghiêm trọng thông báo (3 mã) — khớp NOTIFICATION_SEVERITY.
    notificationSeverity: {
      info: "Info",
      warning: "Needs attention",
      critical: "Critical"
    },
    // Vai trò thành viên trong cuộc họp (meeting_members.role).
    meetingMemberRole: {
      content_chair: "Content Chair",
      pm: "Project Manager",
      lead: "Team Lead",
      member: "Member",
      observer: "Observer"
    },
    // Trạng thái lời mời họp (meeting_members.invitation_status).
    invitationStatus: {
      pending: "Pending",
      accepted: "Accepted",
      declined: "Declined",
      no_response: "No Response"
    },
    // Kết quả lượt phát biểu (meeting_turns.turn_result).
    turnResult: {
      waiting: "Waiting",
      notified: "Notified",
      speaking: "Speaking",
      done: "Done",
      passed: "Passed",
      timeout: "Timed Out",
      skipped: "Skipped",
      // Human turn awaiting input
      awaiting_human: "Awaiting human input",
      // Legacy timeout/skipped for human turns (data before human input UI)
      human_legacy_timeout: "Timed Out (legacy \u2014 before human input UI)"
    },
    // Member type: human or AI agent
    memberType: {
      human: "human",
      agent: "AI"
    },
    // Nhãn HIỂN THỊ của profile id "chu_tich" — id gửi API/lưu DB vẫn là "chu_tich".
    profileDisplay: {
      chu_tich: "Chairman"
    },
    // Câu giải thích khi RÊ CHUỘT vào badge trạng thái cuộc họp (meetings.status).
    meetingStatusHelp: {
      draft: "Meeting status: just created, still editable (title/objective/config).",
      in_progress: "Meeting status: a session has been opened and is in progress (not finished yet).",
      cancelled: "Meeting status: cancelled \u2014 soft-deleted, kept for the record.",
      completed: "Meeting status: fully finished its lifecycle."
    },
    // Câu giải thích khi RÊ CHUỘT vào badge trạng thái phiên họp (meeting_sessions.status).
    sessionStatusHelp: {
      draft: "Session status: created, invitations not sent yet.",
      invited: "Session status: invitations sent, waiting for members to confirm (quorum).",
      quorum_met: "Session status: enough members confirmed \u2014 ready to open.",
      in_progress: "Session status: the meeting is running.",
      discussing: "Session status: members are taking turns speaking in the current round.",
      summarizing: "Session status: discussion ended, minutes are being drafted.",
      decided: "Session status: a decision/conclusion was reached.",
      closed: "Session status: fully closed, minutes finalized.",
      suspended: "Session status: paused mid-meeting by the convener.",
      cancelled: "Session status: this session was cancelled."
    },
    // Câu giải thích khi RÊ CHUỘT vào badge trạng thái việc cần làm (meeting_action_items.status).
    actionItemStatusHelp: {
      open: "Not started yet.",
      in_progress: "Being worked on.",
      completed: "Done.",
      rejected: "Declined \u2014 won't be done.",
      deferred: "Postponed for later."
    },
    // Severity / priority level shared by findings table and Kanban priority column.
    levelName: {
      "1": "High",
      "2": "Medium",
      "3": "Low"
    },
    // Nhãn wildcard cho cụm/phòng ban: '*' = tất cả cụm.
    clusterWildcard: "All clusters",
    // Nhãn hiển thị 35 mã sự kiện/chủ đề liên phòng.
    eventTopic: {
      "lead.qualified": "Qualified lead",
      "lead.nurture_needed": "Lead needs nurturing",
      "customer.tier_upgraded": "Customer tier upgraded",
      "order.completed": "Order completed",
      "incident.system_bug": "System bug incident",
      "incident.critical": "Critical incident",
      "content.review_requested": "Content review requested",
      "compliance.veto": "Compliance veto",
      "compliance.legal_consult": "Legal consultation requested",
      "report.financial_periodic": "Periodic financial report",
      "compliance.anomaly_detected": "Compliance anomaly detected",
      "budget.approval_needed": "Budget approval needed",
      "budget.soft_limit_reached": "Budget soft limit reached",
      "budget.hard_limit_breached": "Budget hard limit breached",
      "hr.onboarding_provision": "New hire provisioning",
      "hr.role_change": "Role change",
      "agent.golive_approved": "Agent go-live approved",
      "agent.benchmark_passed": "Agent benchmark passed",
      "agent.shadow_mode_cleared": "Agent shadow mode cleared",
      "training.plan_ready": "Training plan ready",
      "training.retrain_completed": "Retraining completed",
      "audit.findings": "Audit findings",
      "audit.anomaly_critical": "Critical audit anomaly",
      "audit.weekly_spotcheck_flag": "Weekly spot-check flag",
      "product.release_deployed": "Release deployed",
      "report.okr_weekly_update": "Weekly OKR update",
      "whistleblowing.tip_received": "Whistleblowing tip received",
      "meeting.decision_recorded": "Meeting decision recorded",
      "meeting.convene_requested": "Meeting convene requested",
      "meeting.schedule_triggered": "Meeting schedule triggered",
      "meeting.turn.started": "Meeting turn started",
      "meeting.turn.submitted": "Meeting turn submitted",
      "meeting.closed": "Meeting closed",
      "meeting.invitations_sent": "Meeting invitations sent",
      "org.structural_pattern_detected": "Org structural pattern detected"
    },
    // Nhãn tường minh cho các mã người đã biết.
    personLabels: {
      chu_tich: "Chairman",
      "ceo-agent": "CEO",
      "audit-agent": "Auditor",
      "compliance-agent": "Compliance Officer",
      "ops-agent": "Operations staff",
      "hr-lead-agent": "Head of HR",
      "ba-agent": "Business analyst assistant",
      "as-agent": "Coordinator assistant",
      chairman_human: "Chairman (human)",
      external_anonymous: "External (anonymous)"
    },
    // Hàm suy luận nhãn người theo mẫu id (lead/worker).
    personPattern: {
      lead: (cum) => "Head of " + cum,
      worker: (cum, so) => "Staff " + cum + " &" + so,
      workerPlain: (so) => "Staff #" + so
    },
    topicPattern: {
      reportToExecutive: (unitLabel) => "Report to Executive \u2014 " + unitLabel
    },
    // Chu kỳ ngân sách (budget_policies.window CHECK).
    budgetWindow: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      per_task: "Per task"
    },
    // Hành động chính sách công cụ (tool_policies.policy_action CHECK).
    policyAction: {
      allow: "Allow",
      deny: "Deny"
    },
    // Phạm vi chính sách công cụ (tool_policies.scope CHECK).
    toolPolicyScope: {
      agent: "Agent",
      provider: "Provider",
      profile: "Profile",
      group: "Group"
    }
  };

  // src/i18n/en.ts
  var en = {
    page: {
      title: "Meeting Room",
      subtitle: "Convene agent/human meetings, watch sessions run, and manage the action items they produce."
    },
    filter: {
      actingAs: "Acting as",
      meetingStatusLabel: "Meeting Status",
      templateLabel: "Template",
      all: "All",
      selectProfile: "\u2014 select a profile \u2014",
      otherManual: "Other (type manually)\u2026",
      backToList: "\u21A9 list",
      memberIdPlaceholder: "e.g. chu_tich"
    },
    btn: {
      refresh: "\u21BB Refresh",
      newMeeting: "+ New Meeting"
    },
    notice: {
      actingNotice: "Choose who you're acting as above before creating a meeting or opening one's details \u2014 the system uses this to check what you're allowed to do (e.g. only the convener can edit or cancel a meeting)."
    },
    data: {
      loading: "Loading\u2026",
      errorPrefix: "Error: ",
      noMeetings: "No meetings yet.",
      selectMeeting: "\u2190 Select a meeting to view sessions, members, and action items."
    },
    card: {
      convenedBy: "Convened by ",
      badgeMeeting: "meeting: ",
      badgeSession: "session: "
    },
    detail: {
      meetingId: "Meeting ID",
      convener: "Convener",
      contentChair: "Content Chair",
      scheduledStart: "Scheduled Start",
      objective: "Objective",
      created: "Created",
      sessions: "Sessions",
      transcript: "Transcript",
      minutes: "Minutes",
      members: "Members",
      actionItems: "Action Items",
      noSession: "No session yet.",
      noMembers: "No members invited.",
      noActionItems: "No action items yet \u2014 generated once the session's minutes are recorded.",
      sessionFinished: "Session finished \u2014 see action items below.",
      sessionCancelled: "Session was cancelled.",
      waitingQuorum: "Waiting for quorum \u2014 meetings created with at least 1 member auto-confirm immediately; this one likely has none invited yet.",
      sessionLine: (so, x, y, a, b) => `#${so} \u2014 round ${x}/${y} \u2014 quorum ${a}/${b}`,
      turnLine: (n, name) => `[Round ${n}] ${name}`
    },
    sessionBtn: {
      openSession: "\u25B6 Open Session",
      advanceNow: "\u23ED Advance now",
      suspend: "\u23F8 Suspend",
      consensus: "\u2713 Consensus Reached",
      chairStop: "\u23F9 Chair Early Stop",
      resume: "\u25B6 Resume",
      cancelSession: "\u2717 Cancel",
      live: "\u25CF Live",
      liveHelp: "Auto-advancing every ~4s while this page is open \u2014 see MeetingRoom.tsx TA-05-LIVE"
    },
    toast: {
      meetingCreated: "Meeting created",
      sessionOpened: "Session opened",
      advanced: "Advanced",
      sessionSuspended: "Session suspended",
      consensusRecorded: "Consensus recorded",
      meetingEndedEarly: "Meeting ended early",
      sessionResumed: "Session resumed",
      sessionCancelledToast: "Session cancelled",
      actionItemUpdated: "Action item updated",
      genericError: "Error"
    },
    actionItem: {
      unassigned: "unassigned",
      notBridged: "not bridged",
      kanbanPrefix: "Kanban: "
    },
    modal: {
      newMeetingTitle: "New Meeting",
      templateField: "Template",
      titleField: "Title",
      titlePlaceholder: "e.g. Weekly project sync",
      objectiveField: "Objective",
      objectivePlaceholder: "What should this meeting decide or unblock?",
      scheduledField: "Scheduled Start (optional)",
      scheduledPlaceholder: "e.g. 2026-09-15T14:00 (leave empty for unscheduled)",
      convenerYou: "Convener (you)",
      membersField: "Members",
      memberIdPlaceholderShort: "member_id",
      displayNamePlaceholder: "display name",
      pickFromOrgHelp: "Pick from the organization's profile list instead",
      noTemplatesNotice: "No meeting templates are set up yet, so a meeting can't be created. Ask an administrator to run the default template setup.",
      addMember: "+ Add member",
      cancel: "Cancel",
      createMeeting: "Create Meeting",
      creating: "Creating\u2026"
    },
    err: {
      needMemberId: "Enter your Member ID first",
      noTemplate: "No meeting template is available yet \u2014 nothing to select. This usually means the system's default templates haven't been set up.",
      needTitle: "Title is required",
      createFailed: "Failed to create meeting"
    },
    // ── Tooltip text for status badges (3 separate vocabularies on one page) ────
    meetingStatusHelp: {
      draft: "Meeting status: just created, still editable (title/objective/config).",
      cancelled: "Meeting status: cancelled \u2014 soft-deleted, kept for the record.",
      completed: "Meeting status: fully finished its lifecycle."
    },
    sessionStatusHelp: {
      draft: "Session status: created, invitations not sent yet.",
      invited: "Session status: invitations sent, waiting for members to confirm (quorum).",
      quorum_met: "Session status: enough members confirmed \u2014 ready to open.",
      in_progress: "Session status: the meeting is running.",
      discussing: "Session status: members are taking turns speaking in the current round.",
      summarizing: "Session status: discussion ended, minutes are being drafted.",
      decided: "Session status: a decision/conclusion was reached.",
      closed: "Session status: fully closed, minutes finalized.",
      suspended: "Session status: paused mid-meeting by the convener.",
      cancelled: "Session status: this session was cancelled."
    },
    actionItemStatusHelp: {
      open: "Not started yet.",
      in_progress: "Being worked on.",
      completed: "Done.",
      rejected: "Declined \u2014 won't be done.",
      deferred: "Postponed for later."
    },
    redirect: {
      notice: "The meeting screen has been merged into the Company area. This standalone page is no longer used \u2014 redirecting\u2026",
      openLink: "Open the meeting screen in Company"
    },
    labelGroups: labelGroupsEn
  };

  // src/i18n/vi.ts
  var vi = {
    page: {
      title: "Ph\xF2ng h\u1ECDp",
      subtitle: "T\u1ED5 ch\u1EE9c cu\u1ED9c h\u1ECDp gi\u1EEFa nh\xE2n s\u1EF1 AI v\xE0 ng\u01B0\u1EDDi th\u1EADt, theo d\xF5i phi\xEAn h\u1ECDp \u0111ang di\u1EC5n ra v\xE0 x\u1EED l\xFD vi\u1EC7c c\u1EA7n l\xE0m sau cu\u1ED9c h\u1ECDp."
    },
    filter: {
      actingAs: "\u0110ang thao t\xE1c v\u1EDBi t\u01B0 c\xE1ch",
      meetingStatusLabel: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp",
      templateLabel: "M\u1EABu h\u1ECDp",
      all: "T\u1EA5t c\u1EA3",
      selectProfile: "\u2014 ch\u1ECDn m\u1ED9t h\u1ED3 s\u01A1 \u2014",
      otherManual: "Kh\xE1c (t\u1EF1 nh\u1EADp)\u2026",
      backToList: "\u21A9 danh s\xE1ch",
      memberIdPlaceholder: "v\xED d\u1EE5: chu_tich"
    },
    btn: {
      refresh: "\u21BB T\u1EA3i l\u1EA1i",
      newMeeting: "+ Cu\u1ED9c h\u1ECDp m\u1EDBi"
    },
    notice: {
      actingNotice: "H\xE3y ch\u1ECDn ng\u01B0\u1EDDi b\u1EA1n \u0111ang thao t\xE1c v\u1EDBi t\u01B0 c\xE1ch tr\u01B0\u1EDBc khi t\u1EA1o cu\u1ED9c h\u1ECDp ho\u1EB7c m\u1EDF chi ti\u1EBFt cu\u1ED9c h\u1ECDp \u2014 h\u1EC7 th\u1ED1ng d\xF9ng th\xF4ng tin n\xE0y \u0111\u1EC3 ki\u1EC3m tra quy\u1EC1n c\u1EE7a b\u1EA1n (v\xED d\u1EE5: ch\u1EC9 ng\u01B0\u1EDDi tri\u1EC7u t\u1EADp m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa ho\u1EB7c hu\u1EF7 cu\u1ED9c h\u1ECDp)."
    },
    data: {
      loading: "\u0110ang t\u1EA3i\u2026",
      errorPrefix: "L\u1ED7i: ",
      noMeetings: "Ch\u01B0a c\xF3 cu\u1ED9c h\u1ECDp n\xE0o.",
      selectMeeting: "\u2190 Ch\u1ECDn m\u1ED9t cu\u1ED9c h\u1ECDp \u0111\u1EC3 xem phi\xEAn h\u1ECDp, th\xE0nh vi\xEAn v\xE0 vi\u1EC7c c\u1EA7n l\xE0m."
    },
    card: {
      convenedBy: "Ng\u01B0\u1EDDi tri\u1EC7u t\u1EADp: ",
      badgeMeeting: "Cu\u1ED9c h\u1ECDp: ",
      badgeSession: "Phi\xEAn: "
    },
    detail: {
      meetingId: "M\xE3 cu\u1ED9c h\u1ECDp",
      convener: "Ng\u01B0\u1EDDi tri\u1EC7u t\u1EADp",
      contentChair: "Ch\u1EE7 t\u1ECDa n\u1ED9i dung",
      scheduledStart: "B\u1EAFt \u0111\u1EA7u d\u1EF1 ki\u1EBFn",
      objective: "M\u1EE5c ti\xEAu",
      created: "\u0110\xE3 t\u1EA1o",
      sessions: "Phi\xEAn h\u1ECDp",
      transcript: "B\u1EA3n ghi ph\xE1t bi\u1EC3u",
      minutes: "Bi\xEAn b\u1EA3n",
      members: "Th\xE0nh vi\xEAn",
      actionItems: "Vi\u1EC7c c\u1EA7n l\xE0m",
      noSession: "Ch\u01B0a c\xF3 phi\xEAn h\u1ECDp n\xE0o.",
      noMembers: "Ch\u01B0a m\u1EDDi th\xE0nh vi\xEAn n\xE0o.",
      noActionItems: "Ch\u01B0a c\xF3 vi\u1EC7c c\u1EA7n l\xE0m \u2014 s\u1EBD \u0111\u01B0\u1EE3c t\u1EA1o sau khi bi\xEAn b\u1EA3n phi\xEAn h\u1ECDp \u0111\u01B0\u1EE3c ghi nh\u1EADn.",
      sessionFinished: "Phi\xEAn h\u1ECDp \u0111\xE3 k\u1EBFt th\xFAc \u2014 xem vi\u1EC7c c\u1EA7n l\xE0m b\xEAn d\u01B0\u1EDBi.",
      sessionCancelled: "Phi\xEAn h\u1ECDp n\xE0y \u0111\xE3 b\u1ECB hu\u1EF7.",
      waitingQuorum: "\u0110ang ch\u1EDD \u0111\u1EE7 s\u1ED1 ng\u01B0\u1EDDi d\u1EF1 \u2014 cu\u1ED9c h\u1ECDp c\xF3 \xEDt nh\u1EA5t 1 th\xE0nh vi\xEAn s\u1EBD t\u1EF1 x\xE1c nh\u1EADn ngay; phi\xEAn n\xE0y c\xF3 th\u1EC3 ch\u01B0a m\u1EDDi ai.",
      sessionLine: (so, x, y, a, b) => `#${so} \u2014 v\xF2ng ${x}/${y} \u2014 s\u1ED1 ng\u01B0\u1EDDi d\u1EF1 ${a}/${b}`,
      turnLine: (n, name) => `[V\xF2ng ${n}] ${name}`
    },
    sessionBtn: {
      openSession: "\u25B6 M\u1EDF phi\xEAn h\u1ECDp",
      advanceNow: "\u23ED Chuy\u1EC3n b\u01B0\u1EDBc ngay",
      suspend: "\u23F8 T\u1EA1m d\u1EEBng",
      consensus: "\u2713 \u0110\xE3 \u0111\u1EA1t \u0111\u1ED3ng thu\u1EADn",
      chairStop: "\u23F9 Ch\u1EE7 t\u1ECBch d\u1EEBng s\u1EDBm",
      resume: "\u25B6 Ti\u1EBFp t\u1EE5c",
      cancelSession: "\u2717 Hu\u1EF7 phi\xEAn",
      live: "\u25CF \u0110ang di\u1EC5n ra",
      liveHelp: "T\u1EF1 \u0111\u1ED9ng chuy\u1EC3n b\u01B0\u1EDBc kho\u1EA3ng 4 gi\xE2y m\u1ED9t l\u1EA7n khi trang n\xE0y \u0111ang m\u1EDF."
    },
    toast: {
      meetingCreated: "\u0110\xE3 t\u1EA1o cu\u1ED9c h\u1ECDp",
      sessionOpened: "\u0110\xE3 m\u1EDF phi\xEAn h\u1ECDp",
      advanced: "\u0110\xE3 chuy\u1EC3n b\u01B0\u1EDBc",
      sessionSuspended: "\u0110\xE3 t\u1EA1m d\u1EEBng phi\xEAn h\u1ECDp",
      consensusRecorded: "\u0110\xE3 ghi nh\u1EADn \u0111\u1ED3ng thu\u1EADn",
      meetingEndedEarly: "Cu\u1ED9c h\u1ECDp \u0111\xE3 k\u1EBFt th\xFAc s\u1EDBm",
      sessionResumed: "\u0110\xE3 ti\u1EBFp t\u1EE5c phi\xEAn h\u1ECDp",
      sessionCancelledToast: "\u0110\xE3 hu\u1EF7 phi\xEAn h\u1ECDp",
      actionItemUpdated: "\u0110\xE3 c\u1EADp nh\u1EADt vi\u1EC7c c\u1EA7n l\xE0m",
      genericError: "L\u1ED7i"
    },
    actionItem: {
      unassigned: "ch\u01B0a giao ai",
      notBridged: "ch\u01B0a n\u1ED1i vi\u1EC7c",
      kanbanPrefix: "Vi\u1EC7c tr\xEAn b\u1EA3ng: "
    },
    modal: {
      newMeetingTitle: "Cu\u1ED9c h\u1ECDp m\u1EDBi",
      templateField: "M\u1EABu h\u1ECDp",
      titleField: "Ti\xEAu \u0111\u1EC1",
      titlePlaceholder: "v\xED d\u1EE5: H\u1ECDp \u0111\u1ED3ng b\u1ED9 d\u1EF1 \xE1n tu\u1EA7n",
      objectiveField: "M\u1EE5c ti\xEAu",
      objectivePlaceholder: "Cu\u1ED9c h\u1ECDp n\xE0y c\u1EA7n quy\u1EBFt \u0111\u1ECBnh ho\u1EB7c g\u1EE1 v\u01B0\u1EDBng \u0111i\u1EC1u g\xEC?",
      scheduledField: "B\u1EAFt \u0111\u1EA7u d\u1EF1 ki\u1EBFn (kh\xF4ng b\u1EAFt bu\u1ED9c)",
      scheduledPlaceholder: "v\xED d\u1EE5: 2026-09-15T14:00 (\u0111\u1EC3 tr\u1ED1ng n\u1EBFu ch\u01B0a h\u1EB9n gi\u1EDD)",
      convenerYou: "Ng\u01B0\u1EDDi tri\u1EC7u t\u1EADp (b\u1EA1n)",
      membersField: "Th\xE0nh vi\xEAn",
      memberIdPlaceholderShort: "m\xE3 th\xE0nh vi\xEAn",
      displayNamePlaceholder: "t\xEAn hi\u1EC3n th\u1ECB",
      pickFromOrgHelp: "Ch\u1ECDn t\u1EEB danh s\xE1ch h\u1ED3 s\u01A1 c\u1EE7a t\u1ED5 ch\u1EE9c",
      noTemplatesNotice: "Ch\u01B0a thi\u1EBFt l\u1EADp m\u1EABu h\u1ECDp n\xE0o n\xEAn ch\u01B0a t\u1EA1o \u0111\u01B0\u1EE3c cu\u1ED9c h\u1ECDp. H\xE3y \u0111\u1EC1 ngh\u1ECB qu\u1EA3n tr\u1ECB vi\xEAn ch\u1EA1y thi\u1EBFt l\u1EADp m\u1EABu h\u1ECDp m\u1EB7c \u0111\u1ECBnh.",
      addMember: "+ Th\xEAm th\xE0nh vi\xEAn",
      cancel: "Hu\u1EF7",
      createMeeting: "T\u1EA1o cu\u1ED9c h\u1ECDp",
      creating: "\u0110ang t\u1EA1o\u2026"
    },
    err: {
      needMemberId: "H\xE3y ch\u1ECDn ng\u01B0\u1EDDi b\u1EA1n \u0111ang thao t\xE1c v\u1EDBi t\u01B0 c\xE1ch tr\u01B0\u1EDBc",
      noTemplate: "Ch\u01B0a c\xF3 m\u1EABu h\u1ECDp n\xE0o \u0111\u1EC3 ch\u1ECDn. Th\u01B0\u1EDDng l\xE0 do h\u1EC7 th\u1ED1ng ch\u01B0a thi\u1EBFt l\u1EADp m\u1EABu h\u1ECDp m\u1EB7c \u0111\u1ECBnh.",
      needTitle: "Ph\u1EA3i nh\u1EADp ti\xEAu \u0111\u1EC1",
      createFailed: "T\u1EA1o cu\u1ED9c h\u1ECDp th\u1EA5t b\u1EA1i"
    },
    // ── Tooltip cho huy hiệu trạng thái ─────────────────────────────────────────
    meetingStatusHelp: {
      draft: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: v\u1EEBa t\u1EA1o, v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c ti\xEAu \u0111\u1EC1, m\u1EE5c ti\xEAu v\xE0 c\u1EA5u h\xECnh.",
      cancelled: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: \u0111\xE3 hu\u1EF7 \u2014 kh\xF4ng di\u1EC5n ra n\u1EEFa nh\u01B0ng v\u1EABn l\u01B0u l\u1EA1i \u0111\u1EC3 tra c\u1EE9u.",
      completed: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: \u0111\xE3 k\u1EBFt th\xFAc tr\u1ECDn v\u1EB9n \u2014 h\u1ECDp xong v\xE0 bi\xEAn b\u1EA3n \u0111\xE3 \u0111\u01B0\u1EE3c ch\u1ED1t."
    },
    sessionStatusHelp: {
      draft: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: v\u1EEBa t\u1EA1o, ch\u01B0a g\u1EEDi l\u1EDDi m\u1EDDi cho th\xE0nh vi\xEAn.",
      invited: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 g\u1EEDi l\u1EDDi m\u1EDDi, \u0111ang ch\u1EDD th\xE0nh vi\xEAn x\xE1c nh\u1EADn cho \u0111\u1EE7 s\u1ED1 ng\u01B0\u1EDDi t\u1ED1i thi\u1EC3u.",
      quorum_met: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 \u0111\u1EE7 s\u1ED1 th\xE0nh vi\xEAn x\xE1c nh\u1EADn, c\xF3 th\u1EC3 b\u1EAFt \u0111\u1EA7u h\u1ECDp.",
      in_progress: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: phi\xEAn h\u1ECDp \u0111ang di\u1EC5n ra.",
      discussing: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: c\xE1c th\xE0nh vi\xEAn \u0111ang l\u1EA7n l\u01B0\u1EE3t ph\xE1t bi\u1EC3u trong v\xF2ng hi\u1EC7n t\u1EA1i.",
      summarizing: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 th\u1EA3o lu\u1EADn xong, \u0111ang so\u1EA1n bi\xEAn b\u1EA3n.",
      decided: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 c\xF3 k\u1EBFt lu\u1EADn ho\u1EB7c quy\u1EBFt \u0111\u1ECBnh.",
      closed: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 k\u1EBFt th\xFAc ho\xE0n to\xE0n, bi\xEAn b\u1EA3n \u0111\xE3 ch\u1ED1t.",
      suspended: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: ng\u01B0\u1EDDi tri\u1EC7u t\u1EADp t\u1EA1m d\u1EEBng gi\u1EEFa ch\u1EEBng.",
      cancelled: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: phi\xEAn h\u1ECDp n\xE0y \u0111\xE3 b\u1ECB hu\u1EF7."
    },
    actionItemStatusHelp: {
      open: "Vi\u1EC7c ch\u01B0a b\u1EAFt \u0111\u1EA7u.",
      in_progress: "\u0110ang \u0111\u01B0\u1EE3c th\u1EF1c hi\u1EC7n.",
      completed: "\u0110\xE3 ho\xE0n th\xE0nh.",
      rejected: "Kh\xF4ng th\u1EF1c hi\u1EC7n \u2014 \u0111\xE3 b\u1ECB t\u1EEB ch\u1ED1i.",
      deferred: "T\u1EA1m ho\xE3n, s\u1EBD l\xE0m sau."
    },
    redirect: {
      notice: "M\xE0n h\u1ECDp \u0111\xE3 \u0111\u01B0\u1EE3c g\u1ED9p v\u1EC1 khu C\xF4ng ty. Trang ri\xEAng n\xE0y kh\xF4ng c\xF2n d\xF9ng n\u1EEFa \u2014 \u0111ang chuy\u1EC3n h\u01B0\u1EDBng\u2026",
      openLink: "M\u1EDF m\xE0n h\u1ECDp trong khu C\xF4ng ty"
    }
  };

  // ../../hermes-poclip/dashboard/src/i18n/label-groups.vi.ts
  var labelGroupsVi = {
    unknown: "Ch\u01B0a x\xE1c \u0111\u1ECBnh",
    lifecycle: {
      design: "Thi\u1EBFt k\u1EBF",
      sandbox_benchmark: "\u0110o ki\u1EC3m trong m\xF4i tr\u01B0\u1EDDng c\xE1ch ly",
      shadow_mode: "Ch\u1EA1y b\xF3ng",
      independent_operation: "V\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp",
      review: "Ch\u1EDD \u0111\xE1nh gi\xE1 l\u1EA1i",
      retired: "\u0110\xE3 ngh\u1EC9"
    },
    a2aDirection: {
      unidirectional: "M\u1ED9t chi\u1EC1u",
      bidirectional: "Hai chi\u1EC1u"
    },
    sandboxMode: {
      off: "T\u1EAFt",
      "non-main": "B\u1EADt ngo\xE0i lu\u1ED3ng ch\xEDnh",
      all: "B\u1EADt to\xE0n b\u1ED9"
    },
    sandboxBackend: {
      local: "M\xE1y c\u1EE5c b\u1ED9",
      docker: "Trong Docker",
      ssh: "M\xE1y t\u1EEB xa qua SSH",
      modal: "Modal (\u0111\xE1m m\xE2y)"
    },
    sessionStatus: {
      draft: "B\u1EA3n nh\xE1p",
      invited: "\u0110\xE3 m\u1EDDi",
      quorum_met: "\u0110\u1EE7 s\u1ED1 ng\u01B0\u1EDDi d\u1EF1",
      in_progress: "\u0110ang di\u1EC5n ra",
      discussing: "\u0110ang th\u1EA3o lu\u1EADn",
      summarizing: "\u0110ang t\u1ED5ng h\u1EE3p bi\xEAn b\u1EA3n",
      decided: "\u0110\xE3 c\xF3 quy\u1EBFt \u0111\u1ECBnh",
      closed: "\u0110\xE3 \u0111\xF3ng",
      suspended: "T\u1EA1m d\u1EEBng",
      cancelled: "\u0110\xE3 hu\u1EF7",
      scheduled: "\u0110\xE3 l\xEAn l\u1ECBch",
      failed: "Th\u1EA5t b\u1EA1i",
      paused: "T\u1EA1m d\u1EEBng"
    },
    budgetScope: {
      agent: "Nh\xE2n vi\xEAn AI",
      cluster: "C\u1EE5m",
      company: "C\xF4ng ty"
    },
    workStatus: {
      todo: "Ch\u1EDD l\xE0m",
      ready: "S\u1EB5n s\xE0ng",
      running: "\u0110ang ch\u1EA1y",
      blocked: "\u0110ang t\u1EAFc",
      done: "Ho\xE0n t\u1EA5t",
      archived: "\u0110\xE3 l\u01B0u tr\u1EEF",
      draft: "B\u1EA3n nh\xE1p",
      assigned: "\u0110\xE3 giao vi\u1EC7c",
      in_progress: "\u0110ang th\u1EF1c hi\u1EC7n",
      pending_review: "Ch\u1EDD duy\u1EC7t",
      review: "Ch\u1EDD duy\u1EC7t",
      triage: "Ch\u1EDD ph\xE2n lo\u1EA1i",
      escalated: "\u0110\xE3 leo thang",
      cancelled: "\u0110\xE3 hu\u1EF7",
      failed: "Th\u1EA5t b\u1EA1i",
      queued: "\u0110ang x\u1EBFp h\xE0ng",
      paused: "T\u1EA1m d\u1EEBng",
      rejected: "B\u1ECB t\u1EEB ch\u1ED1i",
      scheduled: "\u0110\xE3 l\xEAn l\u1ECBch",
      backlog: "Ch\u1EDD x\u1EBFp l\u1ECBch",
      claimed: "\u0110\xE3 nh\u1EADn vi\u1EC7c",
      in_review: "\u0110ang xem x\xE9t"
    },
    goalStatus: {
      planned: "\u0110\xE3 l\u1EADp k\u1EBF ho\u1EA1ch",
      active: "\u0110ang th\u1EF1c hi\u1EC7n",
      achieved: "\u0110\xE3 \u0111\u1EA1t \u0111\u01B0\u1EE3c",
      cancelled: "\u0110\xE3 hu\u1EF7"
    },
    goalLevel: {
      company: "C\u1EA5p c\xF4ng ty",
      initiative: "S\xE1ng ki\u1EBFn",
      outcome: "K\u1EBFt qu\u1EA3",
      task: "C\xF4ng vi\u1EC7c"
    },
    meetingTemplateType: {
      standup: "H\u1ECDp giao ban \u0111\u1EA7u ng\xE0y",
      project: "\u0110\xE1nh gi\xE1 d\u1EF1 \xE1n",
      incident: "X\u1EED l\xFD s\u1EF1 c\u1ED1",
      strategy: "H\u1ECDp chi\u1EBFn l\u01B0\u1EE3c",
      recurring: "H\u1ECDp \u0111\u1ECBnh k\u1EF3",
      retrospective: "H\u1ECDp T\u1ED5ng k\u1EBFt & R\xFAt kinh nghi\u1EC7m"
    },
    speakingMode: {
      round_robin: "L\u1EA7n l\u01B0\u1EE3t",
      hybrid: "K\u1EBFt h\u1EE3p",
      random_free: "Ph\xE1t bi\u1EC3u t\u1EF1 do"
    },
    a2aOperation: {
      kanban_comment: "B\xECnh lu\u1EADn tr\xEAn th\u1EBB c\xF4ng vi\u1EC7c",
      delegate_task: "Giao vi\u1EC7c cho nh\xE2n s\u1EF1 AI kh\xE1c",
      send_message: "G\u1EEDi tin nh\u1EAFn"
    },
    a2aEventStatus: {
      pending: "Ch\u1EDD g\u1EEDi",
      delivered: "\u0110\xE3 g\u1EEDi",
      processing: "\u0110ang x\u1EED l\xFD",
      processed: "\u0110\xE3 x\u1EED l\xFD",
      failed: "G\u1EEDi th\u1EA5t b\u1EA1i",
      dlq: "K\u1EB9t \u1EDF h\xE0ng \u0111\u1EE3i l\u1ED7i",
      expired: "H\u1EBFt h\u1EA1n"
    },
    workspaceAccess: {
      none: "Kh\xF4ng truy c\u1EADp th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
      ro: "Ch\u1EC9 \u0111\u1ECDc th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
      rw: "\u0110\u1ECDc v\xE0 ghi th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c"
    },
    meetingStatus: {
      draft: "B\u1EA3n nh\xE1p",
      in_progress: "\u0110ang di\u1EC5n ra",
      cancelled: "\u0110\xE3 hu\u1EF7",
      completed: "\u0110\xE3 k\u1EBFt th\xFAc"
    },
    actionPriority: {
      critical: "Kh\u1EA9n c\u1EA5p",
      high: "Cao",
      medium: "Trung b\xECnh",
      low: "Th\u1EA5p"
    },
    actionItemStatus: {
      open: "Ch\u01B0a x\u1EED l\xFD",
      in_progress: "\u0110ang th\u1EF1c hi\u1EC7n",
      completed: "\u0110\xE3 xong",
      rejected: "T\u1EEB ch\u1ED1i",
      deferred: "Ho\xE3n"
    },
    heartbeatStatus: {
      "th\u1EE9c": "\u0110ang l\xE0m vi\u1EC7c",
      "ng\u1EE7": "\u0110ang ngh\u1EC9",
      stale: "M\u1EA5t nh\u1ECBp tim"
    },
    // Loại thông báo (4 mã) — khớp NOTIFICATION_KIND.
    notificationKind: {
      approval: "Phi\u1EBFu ch\u1EDD duy\u1EC7t",
      goal: "M\u1EE5c ti\xEAu c\u1EA7n r\xE0 so\xE1t",
      task_due: "Vi\u1EC7c t\u1EDBi h\u1EA1n ho\u1EB7c qu\xE1 h\u1EA1n",
      monitor_alert: "C\u1EA3nh b\xE1o h\u1EC7 th\u1ED1ng"
    },
    // Mức nghiêm trọng thông báo (3 mã) — khớp NOTIFICATION_SEVERITY.
    notificationSeverity: {
      info: "B\xECnh th\u01B0\u1EDDng",
      warning: "C\u1EA7n ch\xFA \xFD",
      critical: "Nghi\xEAm tr\u1ECDng"
    },
    meetingMemberRole: {
      content_chair: "Ch\u1EE7 t\u1ECDa n\u1ED9i dung",
      pm: "Qu\u1EA3n l\xFD d\u1EF1 \xE1n",
      lead: "Tr\u01B0\u1EDFng nh\xF3m",
      member: "Th\xE0nh vi\xEAn",
      observer: "Quan s\xE1t vi\xEAn"
    },
    invitationStatus: {
      pending: "Ch\u1EDD ph\u1EA3n h\u1ED3i",
      accepted: "\u0110\xE3 \u0111\u1ED3ng \xFD",
      declined: "\u0110\xE3 t\u1EEB ch\u1ED1i",
      no_response: "Kh\xF4ng ph\u1EA3n h\u1ED3i"
    },
    turnResult: {
      waiting: "Ch\u1EDD l\u01B0\u1EE3t",
      notified: "\u0110\xE3 b\xE1o",
      speaking: "\u0110ang ph\xE1t bi\u1EC3u",
      done: "\u0110\xE3 xong",
      passed: "B\u1ECF l\u01B0\u1EE3t",
      timeout: "Qu\xE1 th\u1EDDi gian",
      skipped: "B\u1ECF qua",
      // Lượt người đang chờ nhập (notified/speaking + human)
      awaiting_human: "Ch\u1EDD ng\u01B0\u1EDDi ph\xE1t bi\u1EC3u",
      // Lượt timeout/skipped của người (dữ liệu cũ trước khi có ô nhập)
      human_legacy_timeout: "Qu\xE1 th\u1EDDi gian (d\u1EEF li\u1EC7u c\u0169 \u2014 tr\u01B0\u1EDBc khi c\xF3 \xF4 nh\u1EADp \xFD ki\u1EBFn cho ng\u01B0\u1EDDi)"
    },
    // Loại thành viên (member_type): người hoặc AI
    memberType: {
      human: "ng\u01B0\u1EDDi",
      agent: "AI"
    },
    // Nhãn HIỂN THỊ của profile id "chu_tich" — id gửi API/lưu DB vẫn là "chu_tich".
    profileDisplay: {
      chu_tich: "Ch\u1EE7 t\u1ECBch"
    },
    // Câu giải thích khi RÊ CHUỘT vào badge trạng thái cuộc họp (meetings.status).
    meetingStatusHelp: {
      draft: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: v\u1EEBa t\u1EA1o, v\u1EABn s\u1EEDa \u0111\u01B0\u1EE3c ti\xEAu \u0111\u1EC1, m\u1EE5c ti\xEAu v\xE0 c\u1EA5u h\xECnh.",
      in_progress: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: phi\xEAn \u0111\xE3 \u0111\u01B0\u1EE3c m\u1EDF v\xE0 \u0111ang di\u1EC5n ra (ch\u01B0a k\u1EBFt th\xFAc).",
      cancelled: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: \u0111\xE3 hu\u1EF7 \u2014 kh\xF4ng di\u1EC5n ra n\u1EEFa nh\u01B0ng v\u1EABn l\u01B0u l\u1EA1i \u0111\u1EC3 tra c\u1EE9u.",
      completed: "Tr\u1EA1ng th\xE1i cu\u1ED9c h\u1ECDp: \u0111\xE3 k\u1EBFt th\xFAc tr\u1ECDn v\u1EB9n \u2014 h\u1ECDp xong v\xE0 bi\xEAn b\u1EA3n \u0111\xE3 \u0111\u01B0\u1EE3c ch\u1ED1t."
    },
    // Câu giải thích khi RÊ CHUỘT vào badge trạng thái phiên họp (meeting_sessions.status).
    sessionStatusHelp: {
      draft: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: v\u1EEBa t\u1EA1o, ch\u01B0a g\u1EEDi l\u1EDDi m\u1EDDi cho th\xE0nh vi\xEAn.",
      invited: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 g\u1EEDi l\u1EDDi m\u1EDDi, \u0111ang ch\u1EDD th\xE0nh vi\xEAn x\xE1c nh\u1EADn cho \u0111\u1EE7 s\u1ED1 ng\u01B0\u1EDDi t\u1ED1i thi\u1EC3u.",
      quorum_met: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 \u0111\u1EE7 s\u1ED1 th\xE0nh vi\xEAn x\xE1c nh\u1EADn, c\xF3 th\u1EC3 b\u1EAFt \u0111\u1EA7u h\u1ECDp.",
      in_progress: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: phi\xEAn h\u1ECDp \u0111ang di\u1EC5n ra.",
      discussing: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: c\xE1c th\xE0nh vi\xEAn \u0111ang l\u1EA7n l\u01B0\u1EE3t ph\xE1t bi\u1EC3u trong v\xF2ng hi\u1EC7n t\u1EA1i.",
      summarizing: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 th\u1EA3o lu\u1EADn xong, \u0111ang so\u1EA1n bi\xEAn b\u1EA3n.",
      decided: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 c\xF3 k\u1EBFt lu\u1EADn ho\u1EB7c quy\u1EBFt \u0111\u1ECBnh.",
      closed: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: \u0111\xE3 k\u1EBFt th\xFAc ho\xE0n to\xE0n, bi\xEAn b\u1EA3n \u0111\xE3 ch\u1ED1t.",
      suspended: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: ng\u01B0\u1EDDi tri\u1EC7u t\u1EADp t\u1EA1m d\u1EEBng gi\u1EEFa ch\u1EEBng.",
      cancelled: "Tr\u1EA1ng th\xE1i phi\xEAn h\u1ECDp: phi\xEAn h\u1ECDp n\xE0y \u0111\xE3 b\u1ECB hu\u1EF7."
    },
    // Câu giải thích khi RÊ CHUỘT vào badge trạng thái việc cần làm (meeting_action_items.status).
    actionItemStatusHelp: {
      open: "Vi\u1EC7c ch\u01B0a b\u1EAFt \u0111\u1EA7u.",
      in_progress: "\u0110ang \u0111\u01B0\u1EE3c th\u1EF1c hi\u1EC7n.",
      completed: "\u0110\xE3 ho\xE0n th\xE0nh.",
      rejected: "Kh\xF4ng th\u1EF1c hi\u1EC7n \u2014 \u0111\xE3 b\u1ECB t\u1EEB ch\u1ED1i.",
      deferred: "T\u1EA1m ho\xE3n, s\u1EBD l\xE0m sau."
    },
    // Mức nghiêm trọng / mức ưu tiên dạng số (dùng chung cho cột Mức và cột Ưu tiên).
    levelName: {
      "1": "Cao",
      "2": "Trung b\xECnh",
      "3": "Th\u1EA5p"
    },
    clusterWildcard: "T\u1EA5t c\u1EA3 c\xE1c c\u1EE5m",
    eventTopic: {
      "lead.qualified": "Kh\xE1ch h\xE0ng ti\u1EC1m n\u0103ng \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n",
      "lead.nurture_needed": "Kh\xE1ch h\xE0ng ti\u1EC1m n\u0103ng c\u1EA7n nu\xF4i d\u01B0\u1EE1ng",
      "customer.tier_upgraded": "Kh\xE1ch h\xE0ng \u0111\u01B0\u1EE3c n\xE2ng h\u1EA1ng",
      "order.completed": "\u0110\u01A1n h\xE0ng \u0111\xE3 ho\xE0n t\u1EA5t",
      "incident.system_bug": "S\u1EF1 c\u1ED1 l\u1ED7i h\u1EC7 th\u1ED1ng",
      "incident.critical": "S\u1EF1 c\u1ED1 nghi\xEAm tr\u1ECDng",
      "content.review_requested": "Y\xEAu c\u1EA7u duy\u1EC7t n\u1ED9i dung",
      "compliance.veto": "Tu\xE2n th\u1EE7 ra quy\u1EBFt \u0111\u1ECBnh ph\u1EE7 quy\u1EBFt",
      "compliance.legal_consult": "Y\xEAu c\u1EA7u t\u01B0 v\u1EA5n ph\xE1p l\xFD",
      "report.financial_periodic": "B\xE1o c\xE1o t\xE0i ch\xEDnh \u0111\u1ECBnh k\u1EF3",
      "compliance.anomaly_detected": "Ph\xE1t hi\u1EC7n b\u1EA5t th\u01B0\u1EDDng (tu\xE2n th\u1EE7)",
      "budget.approval_needed": "Ng\xE2n s\xE1ch c\u1EA7n ph\xEA duy\u1EC7t",
      "budget.soft_limit_reached": "Ch\u1EA1m h\u1EA1n m\u1EE9c m\u1EC1m ng\xE2n s\xE1ch",
      "budget.hard_limit_breached": "V\u01B0\u1EE3t h\u1EA1n m\u1EE9c c\u1EE9ng ng\xE2n s\xE1ch",
      "hr.onboarding_provision": "C\u1EA5p ph\xE1t h\u1ED3 s\u01A1 nh\xE2n s\u1EF1 m\u1EDBi",
      "hr.role_change": "Thay \u0111\u1ED5i vai tr\xF2 nh\xE2n s\u1EF1",
      "agent.golive_approved": "Agent \u0111\u01B0\u1EE3c duy\u1EC7t v\u1EADn h\xE0nh ch\xEDnh th\u1EE9c",
      "agent.benchmark_passed": "Agent \u0111\u1EA1t ki\u1EC3m \u0111\u1ECBnh n\u0103ng l\u1EF1c",
      "agent.shadow_mode_cleared": "Agent ho\xE0n t\u1EA5t ch\u1EBF \u0111\u1ED9 ch\u1EA1y b\xF3ng",
      "training.plan_ready": "K\u1EBF ho\u1EA1ch \u0111\xE0o t\u1EA1o \u0111\xE3 s\u1EB5n s\xE0ng",
      "training.retrain_completed": "Ho\xE0n t\u1EA5t \u0111\xE0o t\u1EA1o l\u1EA1i",
      "audit.findings": "Ph\xE1t hi\u1EC7n c\u1EE7a ki\u1EC3m to\xE1n",
      "audit.anomaly_critical": "B\u1EA5t th\u01B0\u1EDDng nghi\xEAm tr\u1ECDng (ki\u1EC3m to\xE1n)",
      "audit.weekly_spotcheck_flag": "C\u1EDD ki\u1EC3m tra \u0111\u1ED9t xu\u1EA5t tu\u1EA7n",
      "product.release_deployed": "B\u1EA3n ph\xE1t h\xE0nh \u0111\xE3 tri\u1EC3n khai",
      "report.okr_weekly_update": "C\u1EADp nh\u1EADt OKR tu\u1EA7n",
      "whistleblowing.tip_received": "Ti\u1EBFp nh\u1EADn t\u1ED1 gi\xE1c",
      "meeting.decision_recorded": "Ghi nh\u1EADn quy\u1EBFt \u0111\u1ECBnh cu\u1ED9c h\u1ECDp",
      "meeting.convene_requested": "Y\xEAu c\u1EA7u tri\u1EC7u t\u1EADp cu\u1ED9c h\u1ECDp",
      "meeting.schedule_triggered": "K\xEDch ho\u1EA1t l\u1ECBch h\u1ECDp",
      "meeting.turn.started": "B\u1EAFt \u0111\u1EA7u l\u01B0\u1EE3t ph\xE1t bi\u1EC3u",
      "meeting.turn.submitted": "N\u1ED9p l\u01B0\u1EE3t ph\xE1t bi\u1EC3u",
      "meeting.closed": "Cu\u1ED9c h\u1ECDp \u0111\xE3 k\u1EBFt th\xFAc",
      "meeting.invitations_sent": "\u0110\xE3 g\u1EEDi th\u01B0 m\u1EDDi h\u1ECDp",
      "org.structural_pattern_detected": "Ph\xE1t hi\u1EC7n m\u1EABu b\u1EA5t th\u01B0\u1EDDng v\u1EC1 c\u01A1 c\u1EA5u t\u1ED5 ch\u1EE9c"
    },
    personLabels: {
      chu_tich: "Ch\u1EE7 t\u1ECBch",
      "ceo-agent": "CEO",
      "audit-agent": "Ki\u1EC3m to\xE1n vi\xEAn",
      "compliance-agent": "Ki\u1EC3m so\xE1t vi\xEAn tu\xE2n th\u1EE7",
      "ops-agent": "Nh\xE2n vi\xEAn v\u1EADn h\xE0nh",
      "hr-lead-agent": "Tr\u01B0\u1EDFng ph\xF2ng Nh\xE2n s\u1EF1",
      "ba-agent": "Tr\u1EE3 l\xFD nghi\u1EC7p v\u1EE5",
      "as-agent": "Tr\u1EE3 l\xFD \u0111i\u1EC1u ph\u1ED1i",
      chairman_human: "Ch\u1EE7 t\u1ECBch (ng\u01B0\u1EDDi)",
      external_anonymous: "B\xEAn ngo\xE0i (\u1EA9n danh)"
    },
    personPattern: {
      lead: (cum) => "Tr\u01B0\u1EDFng ph\xF2ng " + cum,
      worker: (cum, so) => "Nh\xE2n vi\xEAn " + cum + " #" + so,
      workerPlain: (so) => "Nh\xE2n vi\xEAn #" + so
    },
    topicPattern: {
      reportToExecutive: (unitLabel) => "B\xE1o c\xE1o l\xEAn Ban \u0111i\u1EC1u h\xE0nh \u2014 " + unitLabel
    },
    // Chu kỳ ngân sách (budget_policies.window CHECK).
    budgetWindow: {
      daily: "H\xE0ng ng\xE0y",
      weekly: "H\xE0ng tu\u1EA7n",
      monthly: "H\xE0ng th\xE1ng",
      per_task: "Theo t\u1EEBng vi\u1EC7c"
    },
    // Hành động chính sách công cụ (tool_policies.policy_action CHECK).
    policyAction: {
      allow: "Cho ph\xE9p",
      deny: "Ch\u1EB7n"
    },
    // Phạm vi chính sách công cụ (tool_policies.scope CHECK).
    toolPolicyScope: {
      agent: "Agent",
      provider: "Nh\xE0 cung c\u1EA5p",
      profile: "H\u1ED3 s\u01A1",
      group: "Nh\xF3m"
    }
  };

  // src/i18n/dictionaries.ts
  var DICTS = { en, vi };
  var SUPPORTED_LOCALES = ["en", "vi"];
  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function merge(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) {
      return override === void 0 ? base : override;
    }
    const out = { ...base };
    for (const key of Object.keys(override)) {
      out[key] = merge(base[key], override[key]);
    }
    return out;
  }
  function buildDict(locale) {
    const labelGroups = locale === "vi" ? labelGroupsVi : labelGroupsEn;
    const base = { ...en, labelGroups };
    const override = DICTS[locale] ?? {};
    return merge(base, override);
  }

  // src/i18n/index.ts
  var FALLBACK_LOCALE = "en";
  var cache = {};
  function dictFor(locale) {
    if (!cache[locale]) {
      cache[locale] = buildDict(locale);
    }
    return cache[locale];
  }
  function currentLocale() {
    try {
      if (typeof SDK2?.useI18n === "function") {
        const ctx = SDK2.useI18n();
        if (ctx && typeof ctx.locale === "string") return ctx.locale;
      }
    } catch {
    }
    return FALLBACK_LOCALE;
  }
  function useT() {
    const locale = currentLocale();
    return dictFor(SUPPORTED_LOCALES.includes(locale) ? locale : FALLBACK_LOCALE);
  }

  // src/lib/theme.ts
  var BUTTON_CSS = `
[data-poclip-fields] .pc-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  box-sizing: border-box; min-height: 36px; padding: 8px 14px;
  border: 1px solid transparent; border-radius: 8px; background: transparent;
  font: inherit; font-size: 0.85rem; font-weight: 600; line-height: 1.2;
  color: var(--color-foreground, #ffe6cb); cursor: pointer; white-space: nowrap;
  text-decoration: none; -webkit-user-select: none; user-select: none;
  transition: background-color .12s ease, border-color .12s ease, color .12s ease;
}
[data-poclip-fields] .pc-btn--sm { min-height: 32px; padding: 6px 10px; font-size: 0.8rem; }
[data-poclip-fields] .pc-btn--icon { padding: 6px; min-width: 32px; }
[data-poclip-fields] .pc-btn--inline {
  display: inline; min-height: 0; padding: 0; border-color: transparent;
  background: transparent; font-size: inherit; color: var(--color-primary, #4fd1c5);
}
[data-poclip-fields] .pc-btn--inline:hover:not(:disabled) { text-decoration: underline; }
[data-poclip-fields] .pc-btn--primary {
  background: var(--color-primary, #4fd1c5);
  color: var(--color-primary-foreground, #041c1c);
  border-color: var(--color-primary, #4fd1c5);
}
[data-poclip-fields] .pc-btn--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary, #4fd1c5) 85%, white);
  border-color: color-mix(in srgb, var(--color-primary, #4fd1c5) 85%, white);
}
[data-poclip-fields] .pc-btn--secondary {
  background: color-mix(in srgb, var(--midground-base, #ffe6cb) 10%, transparent);
  color: var(--color-foreground, #ffe6cb);
  border-color: color-mix(in srgb, var(--midground-base, #ffe6cb) 45%, transparent);
}
[data-poclip-fields] .pc-btn--secondary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--midground-base, #ffe6cb) 22%, transparent);
}
[data-poclip-fields] .pc-btn--danger {
  background: color-mix(in srgb, var(--color-destructive, #f87171) 14%, transparent);
  color: color-mix(in srgb, var(--color-destructive, #f87171) 80%, white);
  border-color: color-mix(in srgb, var(--color-destructive, #f87171) 80%, white);
}
[data-poclip-fields] .pc-btn--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-destructive, #f87171) 26%, transparent);
}
[data-poclip-fields] .pc-btn--link {
  background: transparent; border-color: transparent; min-height: 32px;
  color: var(--color-primary, #4fd1c5); text-decoration: underline; text-underline-offset: 2px;
}
[data-poclip-fields] .pc-btn:focus-visible {
  outline: 2px solid var(--color-foreground, #ffe6cb); outline-offset: 2px;
}
[data-poclip-fields] .pc-btn:active:not(:disabled) { transform: translateY(1px); }
[data-poclip-fields] .pc-btn:disabled, [data-poclip-fields] .pc-btn[aria-disabled="true"] {
  opacity: .5; cursor: not-allowed;
}
[data-poclip-fields] .pc-btn[data-loading="true"] { opacity: .75; pointer-events: none; }
[data-poclip-fields] .pc-btn[data-loading="true"]::after {
  content: ""; width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: pc-btn-spin .7s linear infinite;
}
@keyframes pc-btn-spin { to { transform: rotate(360deg); } }
`;
  var HEADING_CSS = `
[data-poclip-fields] h1 { font-size: 1.4rem; font-weight: 700; }
[data-poclip-fields] h2 { font-size: 1.2rem; font-weight: 700; }
[data-poclip-fields] h3 { font-size: 1.05rem; font-weight: 700; }
[data-poclip-fields] h4 { font-size: 0.95rem; font-weight: 700; }
[data-poclip-fields] strong { font-weight: 700; }
`;

  // src/index.tsx
  var TARGET = "/hermes-poclip?tab=meeting-room";
  function HermesPoclipMeetingApp() {
    const t = useT();
    react_shim_default.useEffect(() => {
      window.location.replace(TARGET);
    }, []);
    return /* @__PURE__ */ react_shim_default.createElement("div", { "data-poclip-fields": "", "data-meeting-merged-redirect": "true", style: { padding: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement("style", null, BUTTON_CSS + HEADING_CSS), /* @__PURE__ */ react_shim_default.createElement("p", null, t.redirect.notice), /* @__PURE__ */ react_shim_default.createElement("a", { href: TARGET }, t.redirect.openLink));
  }
  window.__HERMES_PLUGINS__.register("hermes-poclip-meeting", HermesPoclipMeetingApp);
})();
