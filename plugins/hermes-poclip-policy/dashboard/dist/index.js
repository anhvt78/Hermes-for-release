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
    SelectOption,
    Separator,
    Tabs,
    TabsList,
    TabsTrigger
  } = SDK2.components;
  var Select = SDK2.components.Select;
  var fetchJSON = SDK2.fetchJSON;
  var cn = SDK2.utils.cn;
  var timeAgo = SDK2.utils.timeAgo;
  var isoTimeAgo = SDK2.utils.isoTimeAgo;

  // src/lib/api.ts
  var API_BASE = "/api/plugins/hermes-poclip";
  function poclipUrl(path) {
    return `${API_BASE}${path}`;
  }
  function usePoclipFetch(path, deps = []) {
    const [state, setState] = useState({
      data: null,
      loading: path !== null,
      error: null
    });
    const [tick, setTick] = useState(0);
    const refetch = useCallback(() => setTick((t) => t + 1), []);
    useEffect(() => {
      if (path === null) return;
      let cancelled = false;
      setState((s) => ({ ...s, loading: true, error: null }));
      fetchJSON(poclipUrl(path)).then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      }).catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
      return () => {
        cancelled = true;
      };
    }, [path, tick, ...deps]);
    return { ...state, refetch };
  }
  async function fetchDetail(path) {
    return fetchJSON(poclipUrl(path));
  }
  async function poclipMutate(path, method, body, headers) {
    return fetchJSON(poclipUrl(path), {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body !== void 0 ? JSON.stringify(body) : void 0
    });
  }

  // src/i18n/en.ts
  var en = {
    // Nhãn 6 tab (PolicyConfig/index.tsx — SUB_TABS[].labelKey)
    tabs: {
      toolPolicy: "Tool Policy",
      a2aGrants: "A2A Grants",
      sandbox: "Sandbox",
      channelBindings: "Channel Bindings",
      routing: "Routing",
      operations: "Operations",
      toolApproval: "Approval before use"
    },
    // ── Nhãn dùng chung nhiều tab ──────────────────────────────────────────────
    common: {
      confirmDialogTitle: "Confirm",
      confirmDialogOk: "Confirm",
      pager: {
        first: "\xAB First",
        prev: "\u2039 Prev",
        next: "Next \u203A",
        last: "Last \xBB",
        goToPage: "Go to page",
        goBtn: "Go",
        perPage: "Rows per page",
        pagesLabel: (p, t) => `Page ${p}/${t}`,
        rangeLabel: (from, to, total) => `Showing ${from}\u2013${to} of ${total}`
      },
      refresh: "\u21BB Refresh",
      add: "+ Add",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      loading: "Loading\u2026",
      saving: "Saving\u2026",
      actions: "Actions",
      noData: "No data.",
      all: "All",
      codeTooltipLabel: "Original code",
      view: "View",
      update: "Update",
      revoke: "Revoke",
      noChange: "-- no change --",
      filterBtn: "Filter",
      pageFirst: "\xAB First",
      pagePrev: "\u2039 Prev",
      pageNext: "Next \u203A",
      pageLast: "Last \xBB",
      rowsPerPage: "Rows per page:",
      createBtn: "+ Create",
      pageInfo: (a, b, total, page, pages) => `showing ${a}\u2013${b} / ${total} (page ${page}/${pages})`,
      errNotFound: "Record not found (it may have been deleted)",
      errInvalidPattern: "Invalid tool pattern",
      errInvalidFieldValue: "Invalid value",
      errInvalidJsonField: "Invalid JSON value",
      validValues: "Valid values",
      errUnsupportedPlatform: "Unsupported platform",
      errDuplicateGrant: "This authorization already exists",
      errInvalidOperations: "Invalid operations list",
      errProfileNotFound: "Source/destination profile not found",
      errValidation: "Invalid data",
      errHttpStatus: (s) => `HTTP Error ${s}`,
      yes: "Yes",
      no: "No"
    },
    // ── ToolPolicyTab ──────────────────────────────────────────────────────────
    toolPolicy: {
      title: "Tool Policy Rules",
      filterProfileLabel: "Profile ID",
      filterPlaceholder: "Filter by profile_id",
      viewingProfile: (pid) => `Viewing from the Profiles page \u2014 profile: ${pid}`,
      colId: "ID",
      colProfileId: "profile_id",
      colToolPattern: "tool_pattern",
      colAction: "action",
      colScope: "scope",
      colPriority: "priority",
      colRevision: "revision",
      colActive: "active",
      noRules: "No rules.",
      addTitle: "Add New Rule",
      editTitle: "Edit Rule",
      labelProfileId: "profile_id *",
      labelToolPattern: "tool_pattern *",
      labelPolicyAction: "policy_action *",
      labelScope: "scope",
      labelLayerPriority: "layer_priority",
      labelNote: "note",
      labelActive: "active",
      toolPatternPlaceholder: "bash or group:terminal or *",
      profileIdPlaceholder: "* or agent_id",
      notePlaceholder: "Optional note",
      errRequired: "profile_id and tool_pattern are required",
      errPriorityInt: "Priority must be a non-negative whole number (\u2265 0).",
      confirmDelete: (id) => `Delete rule ${id}?`,
      confirmSave: (id) => `Save changes to rule ${id}?`,
      deleted: (id) => `Rule deleted: ${id}`,
      created: (id) => `Rule created: ${id}`,
      saved: (id, rev) => `Rule ${id} saved \u2014 revision ${rev}`,
      pendingT2: (aprId) => `Major change \u2014 pending T2 approval: ${aprId}`,
      pendingT2Notice: (aprId) => `\u23F3 Pending T2 approval \u2014 approval_request_id: ${aprId}`,
      pendingT2SaveMsg: (aprId) => `Major change awaiting T2 approval \u2014 approval_request_id: ${aprId}`,
      previewTitle: "Preview Policy",
      previewLabelProfile: "profile_id *",
      previewLabelTool: "tool_name *",
      previewProfilePlaceholder: "profile_id to check",
      previewToolPlaceholder: "tool name to check",
      previewErrRequired: "profile_id and tool_name are required",
      previewBtn: "\u25B6 Preview",
      previewAllowed: "\u2705 ALLOWED",
      previewDenied: "\u274C DENIED",
      previewRulePrefix: "Rule:"
    },
    // ── A2ATab ─────────────────────────────────────────────────────────────────
    a2a: {
      title: "A2A Grants",
      colId: "ID",
      colFromProfile: "from_profile",
      colToProfile: "to_profile",
      colDirection: "direction",
      colOperations: "operations",
      colActive: "active",
      colExpiresAt: "expires_at",
      noGrants: "No grants.",
      addTitle: "Add New Grant",
      labelFromProfile: "from_profile *",
      labelToProfile: "to_profile *",
      labelDirection: "direction",
      labelNote: "note",
      labelAllowedOps: "allowed_operations *",
      labelExpiresAt: "expires_at",
      expiresPlaceholder: "2026-12-31T23:59:00Z",
      fromPlaceholder: "source profile",
      toPlaceholder: "target profile",
      notePlaceholder: "Note",
      noExpiry: "no expiry",
      expired: "expired",
      errRequired: "from_profile and to_profile are required",
      created: (id) => `Grant created: ${id}`,
      confirmRevoke: (id) => `Revoke grant ${id}?`,
      revoked: (id) => `Grant revoked: ${id}`,
      pendingT2: (aprId) => `Pending T2 approval \u2014 approval_request_id: ${aprId}`,
      noEditNote: "An existing grant cannot be edited or extended. To change it, revoke it and create a new one.",
      opsAllLabel: "* (all operations)",
      historyTitle: "A2A Event History",
      historyNote: "Client-side filtering \u2014 backend supports topic/status/limit only.",
      historyColCreatedAt: "created_at",
      historyColTopic: "topic",
      historyColSource: "source_agent",
      historyColTarget: "target_agent",
      historyColStatus: "status",
      historyColRisk: "risk_tier",
      historyColRetry: "retry",
      historyFilterSourcePlaceholder: "Filter source/target agent",
      historyFilterTopicPlaceholder: "Filter topic",
      historyFilterStatusPlaceholder: "Filter status",
      historyNoData: "No A2A events.",
      historyShowBtn: "\u25BC Show A2A Event History",
      historyHideBtn: "\u25B2 Hide A2A Event History",
      historyRefreshBtn: "\u21BB Refresh history"
    },
    // ── SandboxTab ─────────────────────────────────────────────────────────────
    sandbox: {
      title: "Sandbox Config",
      viewTitle: "View Sandbox",
      updateTitle: "Update Sandbox",
      filterProfileLabel: "Profile ID",
      profilePlaceholder: "profile_id",
      viewBtn: "View",
      updateBtn: "Update",
      updateProfilePlaceholder: "profile_id to update",
      backendPlaceholder: (codes) => `valid values: ${codes}`,
      fieldId: "id",
      fieldProfileId: "profile_id",
      fieldSandboxMode: "sandbox_mode",
      fieldBackend: "backend",
      fieldWorkspaceAccess: "workspace_access",
      fieldPruneOnExit: "prune_on_exit",
      labelProfileId: "profile_id *",
      labelSandboxMode: "sandbox_mode",
      labelBackend: "backend",
      labelWorkspaceAccess: "workspace_access",
      inheritedNote: (rule) => `This person has no sandbox rule of their own \u2014 the rule that actually applies is: ${rule}.`,
      notFoundPrefix: "Not found:",
      errRequired: "Enter a profile_id",
      errNothingToChange: "Choose at least one setting to change.",
      confirmSave: (id) => `Change the sandbox settings of ${id}? The change takes effect (or goes to approval) immediately.`,
      saved: (pid) => `Sandbox updated for ${pid}`,
      pendingT2: (aprId) => `Major change \u2014 pending T2 approval: ${aprId}`
    },
    // ── ChannelBindingsTab ─────────────────────────────────────────────────────
    channelBindings: {
      title: "Channel Bindings",
      colId: "ID",
      colChannel: "channel",
      colProfileId: "profile_id",
      colRole: "role",
      colActive: "active",
      noBindings: "No channel bindings.",
      addTitle: "Add Channel Binding",
      editTitle: "Edit Channel Binding",
      labelChannel: "channel *",
      labelProfileId: "profile_id *",
      labelRole: "role",
      labelNote: "note",
      labelPeerId: "Contact ID",
      labelGuildId: "Discord server ID",
      labelTeamId: "Team ID",
      labelActive: "active",
      profileIdPlaceholder: "profile_id",
      rolePlaceholder: "e.g. admin / viewer",
      notePlaceholder: "Note",
      peerIdPlaceholder: "e.g. contact ID in the channel",
      guildIdPlaceholder: "e.g. Discord server ID",
      teamIdPlaceholder: "e.g. Slack or Teams team ID",
      errRequired: "profile_id is required",
      created: (id) => `Channel binding created: ${id}`,
      deleted: (id) => `Channel binding deleted: ${id}`,
      saved: (id) => `Channel binding saved: ${id}`,
      confirmDelete: (id) => `Delete channel binding ${id}?`,
      confirmSave: (id) => `Save changes to channel binding ${id}?`,
      errUnsupportedPlatform: "Unsupported platform",
      errNotFound: "Channel binding not found"
    },
    // ── AuditLogSection (PolicyConfig/index.tsx) ───────────────────────────────
    auditLog: {
      title: "Audit Log",
      filterLabel: "Policy type",
      colTime: "Time",
      colType: "Type",
      colPolicyId: "policy_id",
      colAction: "action",
      colChangedBy: "changed_by",
      colRevision: "revision",
      colNeedsApproval: "needs approval",
      notLoaded: "Not loaded yet\u2026",
      noEntries: "No log entries.",
      loadBtn: "\u21BB Load",
      detailsBtn: "Details",
      detailsTitle: "Details",
      beforeLabel: "Before",
      afterLabel: "After",
      rawJsonLabel: "Raw JSON (for reference)",
      friendlyFieldsLabel: "Translated values",
      approvalIdLabel: "approval_request_id:",
      t2Badge: "T2",
      backendLimitNote: (loaded) => `The table shows only the ${loaded} most recent records.`
    },
    // ── RoutingTab (src/pages/PolicyConfig/RoutingTab.tsx) ──
    routing: {
      title: "Who receives a directive (routing)",
      // Khối ghi chú tĩnh: thứ tự ưu tiên khớp directive trong hệ thống
      priorityOrderLabel: "How the system picks who receives a directive (in this order):",
      priorityOrder: (cb) => "1. @mention  \u2192  2. #hashtag  \u2192  3. " + cb + '  \u2192  4. keywords in the text  \u2192  5. default "general" unit',
      // Giải thích: keyword chỉ xét khi không có mention/hashtag/channel_binding
      priorityExplanation: (cb) => "Keywords are only used when the directive has no @mention, no #hashtag and does not match " + cb + ". When several units match, the unit with the SMALLER priority number is chosen first (ties: by code, alphabetically).",
      // Bảng danh sách
      colSlug: "slug",
      colDisplayName: "display_name",
      colPriority: "priority",
      colKeywordCount: "Number of keywords",
      colKeywords: "Matching keywords",
      colUpdatedAt: "updated_at",
      colUpdatedBy: "updated_by",
      colActions: "actions",
      noUnits: "No routing units.",
      noKeywords: "no keywords yet",
      noKeywordsTip: "This unit has no keywords, so directives never reach it by keyword. Click \xABEdit\xBB to add some, or use @unit / #unit-code in the directive.",
      loading: "Loading\u2026",
      // Tiêu đề form thêm / sửa
      addTitle: "Add Routing Unit",
      editTitle: "Edit Routing Unit",
      // Nhãn field
      labelSlug: "slug *",
      labelDisplayName: "display_name *",
      labelPriority: "priority (\u2265 0, smaller number is checked first) *",
      labelKeywords: "Matching keywords *",
      slugHint: "Lowercase, starts with a letter, digits/hyphens/underscores allowed \u2014 e.g. tech_product",
      displayNamePlaceholder: "Finance Department",
      keywordsPlaceholder: "technical\napi\nbackend",
      keywordsPlaceholderAdvanced: "^invoice\\s+\n^payment\\s+",
      // Nút
      btnAdd: "+ Add",
      btnSave: "Save",
      btnCancel: "Cancel",
      btnEdit: "Edit",
      btnDelete: "Delete",
      btnRefresh: "\u21BB Refresh",
      btnAddNew: "+ New unit",
      // Lỗi validate phía client
      errSlugFormat: "slug must start with a lowercase letter and contain only lowercase letters, digits, hyphens, or underscores (a-z, 0-9, -, _). Example: tech_product.",
      errPriorityInt: "priority must be a non-negative integer (\u2265 0).",
      errKeywordsEmpty: "At least one keyword is required.",
      errRegexInvalid: (pattern, msg) => `Invalid regex "${pattern}": ${msg}`,
      // Xác nhận xoá
      confirmDelete: (slug) => `Delete routing unit "${slug}"? This cannot be undone.`,
      // Hướng dẫn format textarea keywords
      keywordsFormatHint: "One word or phrase per line, e.g. technical. Matches whole words and ignores upper/lower case. A directive containing any of these words goes to this unit.",
      keywordsAdvancedHint: "Advanced mode: one regular expression (regex) per line, e.g. \\bapi\\b matches a whole word, ^invoice\\s+ matches the start of the text. Case-insensitive.",
      modeSimple: "Simple",
      modeAdvanced: "Advanced (regex)",
      advancedBadge: "advanced",
      advancedBadgeTip: "Advanced pattern (regular expression) \u2014 edit it in \xABAdvanced\xBB mode.",
      switchBlocked: "Some patterns are advanced and cannot be shown as plain words \u2014 stay in \xABAdvanced\xBB mode or remove/rewrite them."
    },
    // ── Label groups — mã kỹ thuật → nhãn hiển thị (dùng chung mọi tab) ──────────
    labelGroups: {
      unknown: "Unknown",
      lifecycle: {
        design: "Design",
        sandbox_benchmark: "Sandbox Benchmark",
        shadow_mode: "Supervised Trial",
        independent_operation: "Independent Operation",
        review: "Under Review",
        retired: "Retired"
      },
      a2aDirection: {
        unidirectional: "One-way",
        bidirectional: "Two-way"
      },
      a2aOperation: {
        kanban_comment: "Comment on task card",
        delegate_task: "Delegate task to another AI",
        send_message: "Send message"
      },
      sandboxMode: {
        off: "Off",
        "non-main": "Active (non-main flow)",
        all: "Active (all flows)"
      },
      sandboxBackend: {
        local: "Local machine",
        docker: "Docker container",
        ssh: "Remote machine via SSH",
        modal: "Modal (cloud)"
      },
      a2aEventStatus: {
        pending: "Pending send",
        delivered: "Delivered",
        processing: "Processing",
        processed: "Processed",
        failed: "Send failed",
        dlq: "Stuck in dead-letter queue",
        expired: "Expired"
      },
      riskTier: {
        T0: "Low",
        T1: "Medium",
        T2: "High",
        T3: "Very High"
      },
      workspaceAccess: {
        none: "No workspace access",
        ro: "Read-only workspace",
        rw: "Read and write workspace"
      },
      toolPolicyAction: {
        allow: "Allow",
        deny: "Deny"
      },
      toolPolicyScope: {
        agent: "Per AI agent",
        global: "System-wide",
        provider: "By provider",
        profile: "By profile",
        group: "By group"
      },
      channelRole: {
        admin: "Channel admin",
        viewer: "View only",
        independent_control: "Independent control"
      },
      active: {
        "1": "Active",
        "0": "Off",
        "true": "Active",
        "false": "Off"
      },
      policyType: {
        tool_policy: "Tool Policy",
        a2a_grant: "A2A Grants",
        sandbox: "Sandbox",
        channel_binding: "Channel Bindings",
        tool_approval_rule: "Approval rules"
      },
      auditAction: {
        create: "Create",
        update: "Update",
        delete: "Delete",
        activate: "Activate",
        deactivate: "Deactivate"
      },
      personLabels: {
        chu_tich: "Chairman",
        "ceo-agent": "CEO",
        "audit-agent": "Auditor",
        "compliance-agent": "Compliance Officer",
        "ops-agent": "Operations staff",
        "hr-lead-agent": "Head of HR",
        "ba-agent": "Business analyst assistant",
        "as-agent": "Coordinator assistant"
      },
      personPattern: {
        lead: (dept) => "Head of " + dept,
        worker: (dept, num) => "Staff " + dept + " #" + num,
        workerPlain: (num) => "Staff #" + num
      }
    },
    // ── Nhãn phòng / cụm (12 mã org_unit chuẩn) ─────────────────────────────────
    clusters: {
      hr_core: "HR",
      tech_product: "Tech & Product",
      customer_success: "Customer Success",
      infrastructure_ops: "Infrastructure & Ops",
      executive: "Executive",
      compliance: "Compliance",
      audit: "Internal Audit",
      finance: "Finance",
      marketing: "Marketing",
      sales: "Sales",
      qa: "QA",
      training: "Training"
    },
    // ── ChoiceField component strings ─────────────────────────────────────────
    orgScope: {
      unit: (name) => `Whole department: ${name}`,
      role: (name) => `Everyone with role: ${name}`,
      roleLead: "Department head",
      roleWorker: "Staff member"
    },
    choiceField: {
      customOptionLabel: "\u270F\uFE0F Other value \u2014 type manually\u2026",
      backToList: "\u21A9 Back to list",
      emptyHintDefault: "No options \u2014 type a value manually.",
      emptyHintPersonnel: "Personnel not loaded \u2014 type a profile ID.",
      emptyHintTools: "Tool patterns not loaded \u2014 type a pattern.",
      emptyHintChannel: "Type a channel platform.",
      emptyHintRole: "Type a role (e.g. admin or viewer).",
      emptyHintSlug: "Type a routing slug.",
      emptyHintTimezone: "Type a timezone (e.g. Asia/Ho_Chi_Minh).",
      emptyHintHours: "Type number of hours.",
      groupSuffix: "(group)",
      channelBoundSuffix: "(already bound)"
    },
    // ── SuggestionBlock (src/pages/PolicyConfig/SuggestionBlock.tsx) ──────────
    suggestions: {
      blockTitle: "Suggested Policies",
      pendingCount: (n) => `Waiting for ${n} suggestion${n !== 1 ? "s" : ""}`,
      btnGenerate: "Generate suggestions",
      btnApproveAll: "Approve all",
      confirmApproveAll: (n) => `Approve ALL ${n} waiting suggestions of THIS tab now? Only this tab's suggestions are approved \u2014 the other policy tabs are not affected. Rules take effect immediately. Review the list first if unsure.`,
      btnApprove: "Approve",
      btnReject: "Reject",
      btnEdit: "Edit",
      btnSave: "Save",
      btnCancel: "Cancel",
      statusDraft: "Draft",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      empty: "No suggestions for this section.",
      emptyHint: 'Click "Generate suggestions" to get started.',
      beforeNull: "None yet \u2014 will be created",
      beforeNullDone: "There was none \u2014 created by this approval",
      noPending: "No suggestions waiting.",
      showDecided: (n) => `Show ${n} handled suggestion(s)`,
      hideDecided: "Hide handled suggestions",
      beforeLabel: "Before",
      afterLabel: "After",
      toastGenerated: (n) => `Generated ${n} suggestion${n !== 1 ? "s" : ""}`,
      toastApprovedAll: "All draft suggestions approved",
      toastApprovedAllPartial: (ok, failed) => `Approved ${ok} suggestions, but ${failed} could not be applied \u2014 they stay in the waiting list.`,
      toastApproved: "Suggestion approved",
      toastRejected: "Suggestion rejected",
      toastSaved: "Suggestion saved",
      notesTitle: "System notes",
      paramStageLabel: "stage",
      rationale: {
        toolPolicyFromRoleCard: (agent, tool, scope, writeAccess) => `Agent ${agent} declared tool ${tool} (scope: ${scope}, write_access: ${writeAccess}) in its role card`,
        sandboxIndependentControl: (agent) => `Agent ${agent} operates independently \u2014 using an independent monitoring channel to maintain isolation`,
        sandboxIndependent: (agent) => `Agent ${agent} has been operating independently \u2014 allowing workspace write access`,
        sandboxNotIndependent: (agent) => `Agent ${agent} has not yet reached independent operation \u2014 enabling sandbox isolation with read-only workspace`,
        toolPolicyFromRoleBaseline: (agent, tool) => `Agent ${agent} has no role card \u2014 tool ${tool} is shared by every agent of the same role type, so it is suggested as a safe baseline`,
        toolPolicyDenyUnusedGroup: (target, group, members, role) => target.startsWith("role:") ? `All ${members} agents with role "${role}" have the "${group}" tool group turned off in their real configuration \u2014 block it for the whole role so agents added later do not get it automatically` : `${target} has the "${group}" tool group turned off in its real configuration \u2014 block it so it cannot be used by mistake`,
        a2aFromOrgLine: (manager, agent) => `${agent} reports to ${manager} in the organization chart \u2014 allow assigning work down and reporting up`,
        a2aFromFlow: (producerCluster, consumerCluster, direction, topicCount) => `Flow requires A2A communication: ${producerCluster} \u2192 ${consumerCluster} (direction: ${direction}, ${topicCount} topic${topicCount !== 1 ? "s" : ""})`,
        channelFromRoleCardTool: (agent, channel, toolName) => `Agent ${agent} uses tool ${toolName} which requires channel ${channel} to be bound`
      },
      note: {
        noToolsDeclared: (agent) => `Agent ${agent} has no tools declared in its role card \u2014 no tool policy rules generated`,
        noRoleCard: (profileId) => `Profile ${profileId} has no role card \u2014 no policy suggestions generated`,
        a2aNoRepresentative: (cluster, topic) => `Cluster ${cluster} has no representative agent for topic ${topic} \u2014 A2A grant not generated`,
        channelNotConfigured: () => `No channels are configured yet \u2014 channel binding suggestions cannot be generated. Please ask the Chairman to configure at least one channel first.`,
        channelNoDeclaration: (channel) => `Channel ${channel} has no agent declarations \u2014 no channel binding rules generated`
      },
      valueMissing: "Not set",
      valueYes: "Yes",
      valueNo: "No",
      field: {
        id: "ID",
        profile_id: "Profile ID",
        provider: "Provider",
        tool_pattern: "Tool pattern",
        policy_action: "Policy action",
        scope: "Scope",
        layer_priority: "Layer priority",
        policy_revision: "Revision",
        note: "Note",
        active: "Active",
        sandbox_mode: "Sandbox mode",
        backend: "Backend",
        workspace_access: "Workspace access",
        tool_scope: "Tool scope",
        write_access: "Write access",
        tools_policy_json: "Tools policy JSON",
        prune_on_exit: "Prune on exit",
        from_profile: "From profile",
        to_profile: "To profile",
        direction: "Direction",
        allowed_operations: "Allowed operations",
        expires_at: "Expires at",
        granted_by: "Granted by",
        created_by: "Created by",
        created_at: "Created at",
        updated_at: "Updated at",
        channel: "Channel",
        role: "Role",
        peer_id: "Contact ID",
        guild_id: "Discord server ID",
        team_id: "Team ID",
        tool_name: "Tool name"
      }
    },
    // ── OperationsTab (src/pages/PolicyConfig/OperationsTab.tsx) ──
    toolApproval: {
      title: "Approval before using a tool",
      intro: "Choose actions that an AI employee must get approved before doing. When it tries one, the system stops it and sends an approval request. The AI employee can do exactly that action once the request is approved.",
      howTitle: "How it works",
      howItems: [
        "The AI employee tries the action \u2014 the system stops it and files an approval request.",
        "The department head of that AI employee (or the President) approves or rejects it in the Approval Queue.",
        "If approved, the AI employee may repeat exactly the same action once, while the permit is still valid.",
        "If nobody decides in time (24 hours for level T1), the request expires and the AI employee must ask again."
      ],
      rulesTitle: "Approval rules",
      noRules: "No approval rules yet \u2014 AI employees only follow the Tool Policy.",
      colApplies: "Applies to",
      colTool: "Tool",
      colWhen: "When",
      colApprover: "Who approves",
      colPermit: "Permit valid for",
      colNote: "Note",
      colActive: "Status",
      allAgents: "All AI employees",
      always: "Every time this tool is used",
      joinAll: " and ",
      joinAny: " or ",
      permitHours: (n) => `${n} h, single use`,
      tiers: {
        T1: "Department head or President",
        T2: "Compliance + President",
        T3: "President only"
      },
      ops: {
        eq: "is",
        ne: "is not",
        contains: "contains",
        not_contains: "does not contain",
        in: "is one of",
        not_in: "is none of",
        gt: "is greater than",
        gte: "is at least",
        lt: "is less than",
        lte: "is at most",
        matches: "matches pattern",
        exists: "is present",
        not_exists: "is absent"
      },
      addTitle: "Add an approval rule",
      editTitle: "Edit approval rule",
      labelProfile: "Applies to",
      profilePlaceholder: "AI employee, department or role",
      labelTool: "Tool",
      toolPlaceholder: "Tool name or pattern (e.g. crm_write, kanban_*)",
      labelWhen: "Only when (optional)",
      whenHint: "Leave empty to require approval every time. Conditions look at what the AI employee is about to do (for example an amount).",
      addCondition: "+ Add condition",
      removeCondition: "Remove",
      fieldPlaceholder: "Field (e.g. amount)",
      valuePlaceholder: "Value",
      valuesPlaceholder: "Values, separated by commas",
      labelMode: "Rule applies when",
      modeAll: "all conditions are met",
      modeAny: "any condition is met",
      labelTier: "Who approves",
      labelHours: "Permit valid for (hours)",
      hoursHint: "After approval, the AI employee has this long to repeat the action once (1\u2013168 hours).",
      labelNote: "Note",
      notePlaceholder: "Why this needs approval",
      labelActive: "Status",
      errRequired: "Choose who the rule applies to and which tool.",
      errField: "Each condition needs a field name.",
      errValue: "Each condition needs a value.",
      errNumber: "A comparison with greater/less needs a number.",
      errTooMany: "At most 20 conditions per rule.",
      errHours: "Permit validity must be a whole number from 1 to 168 hours.",
      created: "Approval rule added.",
      saved: "Approval rule saved.",
      deleted: "Approval rule removed.",
      confirmDelete: "Remove this approval rule? AI employees will no longer need approval for it.",
      confirmSave: "Save changes to this approval rule?",
      previewTitle: "Try a rule",
      previewAgent: "AI employee",
      previewAgentPlaceholder: "Choose an AI employee",
      previewTool: "Tool",
      previewArgs: "Example of what it is about to do (JSON)",
      previewArgsPlaceholder: '{"amount": 20000000}',
      previewBtn: "Check",
      previewBadJson: "The example is not valid JSON.",
      previewErrRequired: "Choose an AI employee and a tool.",
      previewNeeds: (who) => `Approval needed \u2014 approver: ${who}`,
      previewNot: "No approval needed for this action.",
      requestsTitle: "Recent approval requests",
      requestsHint: "Decide on these requests in Company \u2192 Approval Queue.",
      noRequests: "No approval requests yet.",
      colTime: "Time",
      colAgent: "AI employee",
      colAction: "Tool",
      colContent: "What it wanted to do",
      colState: "Status",
      colDeadline: "Deadline / decision",
      showContent: "Show",
      states: {
        waiting: "Waiting for approval",
        approved: "Approved \u2014 not used yet",
        used: "Approved and used",
        rejected: "Rejected",
        expired: "Expired"
      }
    },
    operations: {
      title: "Operations Configuration",
      // Section A — Digest cadence
      sectionDigestCadence: "A \u2014 Digest Cadence",
      labelDailyCron: "Daily digest cron",
      labelWeeklyCron: "Weekly digest cron",
      labelTimezone: "Timezone (shared by daily & weekly)",
      presetDailyLabel: "Preset: daily 08:00",
      presetWeeklyLabel: "Preset: Mon 09:00",
      presetDaily: "0 8 * * *",
      presetWeekly: "0 9 * * 1",
      // Placeholder của 3 ô nhập — giá trị MẪU, không phải chuỗi để dịch, nhưng
      // vẫn phải là khoá i18n để không viết thẳng trong JSX (xem check:i18n).
      timezonePlaceholder: "Asia/Ho_Chi_Minh",
      // Section B — Escalation thresholds
      sectionEscalation: "B \u2014 Escalation Thresholds",
      labelReminderHours: "review.reminder_hours",
      labelEscalateHours: "review.escalate_hours",
      reminderHoursHint: "Hours until a reminder is sent (default: 24)",
      escalateHoursHint: "Hours until escalation is triggered (default: 72)",
      // Nút lưu dùng chung cho section A + B
      btnSave: "Save A + B",
      saving: "Saving\u2026",
      savedAt: (at) => `Saved at ${at}`,
      // Section C — Current digest schedule (read-only)
      sectionCurrentSchedule: "C \u2014 Current Digest Schedule",
      colType: "type",
      colCron: "cron",
      colTimezone: "timezone",
      colNextRun: "next_run_at",
      colSource: "source",
      daily: "daily",
      weekly: "weekly",
      notAvailable: "\u2014",
      btnRefresh: "\u21BB Refresh",
      // Section D — Reload config
      sectionReload: "D \u2014 Reload Configuration",
      btnReload: "Reload config",
      reloading: "Reloading\u2026",
      reloadOk: (epoch, at) => `\u2705 Config reloaded at ${at} (reload #${epoch})`,
      reloadFailed: "\u274C Reload failed.",
      // Lỗi validate phía client
      errCronInvalid: "Invalid cron expression \u2014 must be exactly 5 fields separated by spaces, each containing digits, *, /, ,, or -.",
      errTimezoneEmpty: "Timezone must not be empty.",
      errHoursPositive: "Must be a number greater than 0.",
      hoursLabel: (h) => `${h}h`
    }
  };

  // src/i18n/vi.ts
  var vi = {
    tabs: {
      toolPolicy: "Ch\xEDnh s\xE1ch c\xF4ng c\u1EE5",
      a2aGrants: "U\u1EF7 quy\u1EC1n A2A",
      sandbox: "M\xF4i tr\u01B0\u1EDDng c\xE1ch ly",
      channelBindings: "K\xEAnh li\xEAn k\u1EBFt",
      routing: "\u0110\u1ECBnh tuy\u1EBFn",
      operations: "V\u1EADn h\xE0nh",
      toolApproval: "Xin ph\xE9p tr\u01B0\u1EDBc khi d\xF9ng"
    },
    common: {
      confirmDialogTitle: "X\xE1c nh\u1EADn",
      confirmDialogOk: "\u0110\u1ED3ng \xFD",
      pager: {
        first: "\xAB \u0110\u1EA7u",
        prev: "\u2039 Tr\u01B0\u1EDBc",
        next: "Ti\u1EBFp \u203A",
        last: "Cu\u1ED1i \xBB",
        goToPage: "\u0110\u1EBFn trang",
        goBtn: "\u0110i",
        perPage: "S\u1ED1 d\xF2ng m\u1ED7i trang",
        pagesLabel: (p, t) => `Trang ${p}/${t}`,
        rangeLabel: (from, to, total) => `Hi\u1EC3n th\u1ECB ${from}\u2013${to} / ${total}`
      },
      refresh: "\u21BB L\xE0m m\u1EDBi",
      add: "+ Th\xEAm",
      edit: "S\u1EEDa",
      save: "L\u01B0u",
      cancel: "Hu\u1EF7",
      delete: "Xo\xE1",
      loading: "\u0110ang t\u1EA3i\u2026",
      saving: "\u0110ang l\u01B0u\u2026",
      actions: "Thao t\xE1c",
      noData: "Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u.",
      all: "T\u1EA5t c\u1EA3",
      codeTooltipLabel: "M\xE3 g\u1ED1c",
      view: "Xem",
      update: "C\u1EADp nh\u1EADt",
      revoke: "Thu h\u1ED3i",
      noChange: "-- kh\xF4ng \u0111\u1ED5i --",
      filterBtn: "L\u1ECDc",
      pageFirst: "\xAB \u0110\u1EA7u",
      pagePrev: "\u2039 Tr\u01B0\u1EDBc",
      pageNext: "Sau \u203A",
      pageLast: "Cu\u1ED1i \xBB",
      rowsPerPage: "D\xF2ng m\u1ED7i trang:",
      createBtn: "+ T\u1EA1o m\u1EDBi",
      pageInfo: (a, b, total, page, pages) => `hi\u1EC3n th\u1ECB ${a}\u2013${b} / ${total} (trang ${page}/${pages})`,
      errNotFound: "Kh\xF4ng t\xECm th\u1EA5y b\u1EA3n ghi (c\xF3 th\u1EC3 \u0111\xE3 b\u1ECB xo\xE1)",
      errInvalidPattern: "M\u1EABu c\xF4ng c\u1EE5 kh\xF4ng h\u1EE3p l\u1EC7",
      errInvalidFieldValue: "Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7",
      errInvalidJsonField: "Chu\u1ED7i JSON kh\xF4ng h\u1EE3p l\u1EC7",
      validValues: "Gi\xE1 tr\u1ECB h\u1EE3p l\u1EC7",
      errUnsupportedPlatform: "N\u1EC1n t\u1EA3ng kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3",
      errDuplicateGrant: "U\u1EF7 quy\u1EC1n n\xE0y \u0111\xE3 t\u1ED3n t\u1EA1i",
      errInvalidOperations: "Danh s\xE1ch thao t\xE1c kh\xF4ng h\u1EE3p l\u1EC7",
      errProfileNotFound: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 ngu\u1ED3n/\u0111\xEDch",
      errValidation: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
      errHttpStatus: (s) => `L\u1ED7i HTTP ${s}`,
      yes: "C\xF3",
      no: "Kh\xF4ng"
    },
    toolPolicy: {
      title: "Quy t\u1EAFc ch\xEDnh s\xE1ch c\xF4ng c\u1EE5",
      filterProfileLabel: "M\xE3 h\u1ED3 s\u01A1",
      filterPlaceholder: "L\u1ECDc theo m\xE3 h\u1ED3 s\u01A1",
      viewingProfile: (pid) => `Xem t\u1EEB trang H\u1ED3 s\u01A1 \u2014 h\u1ED3 s\u01A1: ${pid}`,
      colId: "ID",
      colProfileId: "M\xE3 h\u1ED3 s\u01A1",
      colToolPattern: "M\u1EABu c\xF4ng c\u1EE5",
      colAction: "H\xE0nh \u0111\u1ED9ng",
      colScope: "Ph\u1EA1m vi",
      colPriority: "\u0110\u1ED9 \u01B0u ti\xEAn",
      colRevision: "Phi\xEAn b\u1EA3n",
      colActive: "\u0110ang b\u1EADt",
      noRules: "Ch\u01B0a c\xF3 quy t\u1EAFc n\xE0o.",
      addTitle: "Th\xEAm quy t\u1EAFc m\u1EDBi",
      editTitle: "S\u1EEDa quy t\u1EAFc",
      labelProfileId: "M\xE3 h\u1ED3 s\u01A1 *",
      labelToolPattern: "M\u1EABu c\xF4ng c\u1EE5 *",
      labelPolicyAction: "H\xE0nh \u0111\u1ED9ng *",
      labelScope: "Ph\u1EA1m vi",
      labelLayerPriority: "\u0110\u1ED9 \u01B0u ti\xEAn t\u1EA7ng",
      labelNote: "Ghi ch\xFA",
      labelActive: "Tr\u1EA1ng th\xE1i",
      toolPatternPlaceholder: "bash ho\u1EB7c group:terminal ho\u1EB7c *",
      profileIdPlaceholder: "* ho\u1EB7c agent_id",
      notePlaceholder: "Ghi ch\xFA tu\u1EF3 ch\u1ECDn",
      errRequired: "M\xE3 h\u1ED3 s\u01A1 v\xE0 m\u1EABu c\xF4ng c\u1EE5 l\xE0 b\u1EAFt bu\u1ED9c",
      errPriorityInt: "\u0110\u1ED9 \u01B0u ti\xEAn ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn kh\xF4ng \xE2m (\u2265 0).",
      confirmDelete: (id) => `Xo\xE1 quy t\u1EAFc ${id}?`,
      confirmSave: (id) => `L\u01B0u thay \u0111\u1ED5i cho quy t\u1EAFc ${id}?`,
      deleted: (id) => `\u0110\xE3 xo\xE1 quy t\u1EAFc: ${id}`,
      created: (id) => `\u0110\xE3 t\u1EA1o quy t\u1EAFc: ${id}`,
      saved: (id, rev) => `\u0110\xE3 l\u01B0u quy t\u1EAFc ${id} \u2014 phi\xEAn b\u1EA3n ${rev}`,
      pendingT2: (aprId) => `Thay \u0111\u1ED5i l\u1EDBn \u2014 ch\u1EDD duy\u1EC7t T2: ${aprId}`,
      pendingT2Notice: (aprId) => `\u23F3 Ch\u1EDD duy\u1EC7t T2 \u2014 approval_request_id: ${aprId}`,
      pendingT2SaveMsg: (aprId) => `Thay \u0111\u1ED5i l\u1EDBn ch\u1EDD duy\u1EC7t T2 \u2014 approval_request_id: ${aprId}`,
      previewTitle: "Xem tr\u01B0\u1EDBc ch\xEDnh s\xE1ch",
      previewLabelProfile: "M\xE3 h\u1ED3 s\u01A1 *",
      previewLabelTool: "T\xEAn c\xF4ng c\u1EE5 *",
      previewProfilePlaceholder: "m\xE3 h\u1ED3 s\u01A1 c\u1EA7n ki\u1EC3m tra",
      previewToolPlaceholder: "t\xEAn c\xF4ng c\u1EE5 c\u1EA7n ki\u1EC3m tra",
      previewErrRequired: "M\xE3 h\u1ED3 s\u01A1 v\xE0 t\xEAn c\xF4ng c\u1EE5 l\xE0 b\u1EAFt bu\u1ED9c",
      previewBtn: "\u25B6 Xem tr\u01B0\u1EDBc",
      previewAllowed: "\u2705 \u0110\u01AF\u1EE2C PH\xC9P",
      previewDenied: "\u274C B\u1ECA T\u1EEA CH\u1ED0I",
      previewRulePrefix: "Quy t\u1EAFc:"
    },
    a2a: {
      title: "U\u1EF7 quy\u1EC1n A2A",
      colId: "ID",
      colFromProfile: "Nh\xE2n s\u1EF1 g\u1EEDi",
      colToProfile: "Nh\xE2n s\u1EF1 nh\u1EADn",
      colDirection: "H\u01B0\u1EDBng trao \u0111\u1ED5i",
      colOperations: "Thao t\xE1c \u0111\u01B0\u1EE3c ph\xE9p",
      colActive: "\u0110ang b\u1EADt",
      colExpiresAt: "H\u1EBFt h\u1EA1n",
      noGrants: "Ch\u01B0a c\xF3 u\u1EF7 quy\u1EC1n n\xE0o.",
      addTitle: "Th\xEAm u\u1EF7 quy\u1EC1n m\u1EDBi",
      labelFromProfile: "Nh\xE2n s\u1EF1 g\u1EEDi *",
      labelToProfile: "Nh\xE2n s\u1EF1 nh\u1EADn *",
      labelDirection: "H\u01B0\u1EDBng trao \u0111\u1ED5i",
      labelNote: "Ghi ch\xFA",
      labelAllowedOps: "Thao t\xE1c \u0111\u01B0\u1EE3c ph\xE9p *",
      labelExpiresAt: "H\u1EBFt h\u1EA1n",
      expiresPlaceholder: "2026-12-31T23:59:00Z",
      fromPlaceholder: "h\u1ED3 s\u01A1 ngu\u1ED3n",
      toPlaceholder: "h\u1ED3 s\u01A1 \u0111\xEDch",
      notePlaceholder: "Ghi ch\xFA",
      noExpiry: "kh\xF4ng h\u1EBFt h\u1EA1n",
      expired: "\u0111\xE3 h\u1EBFt h\u1EA1n",
      errRequired: "Nh\xE2n s\u1EF1 g\u1EEDi v\xE0 nh\xE2n s\u1EF1 nh\u1EADn l\xE0 b\u1EAFt bu\u1ED9c",
      created: (id) => `\u0110\xE3 t\u1EA1o u\u1EF7 quy\u1EC1n: ${id}`,
      confirmRevoke: (id) => `Thu h\u1ED3i u\u1EF7 quy\u1EC1n ${id}?`,
      revoked: (id) => `\u0110\xE3 thu h\u1ED3i u\u1EF7 quy\u1EC1n: ${id}`,
      pendingT2: (aprId) => `Ch\u1EDD duy\u1EC7t T2 \u2014 approval_request_id: ${aprId}`,
      noEditNote: "U\u1EF7 quy\u1EC1n \u0111\xE3 t\u1EA1o ch\u01B0a s\u1EEDa hay gia h\u1EA1n \u0111\u01B0\u1EE3c. Mu\u1ED1n \u0111\u1ED5i th\xEC thu h\u1ED3i r\u1ED3i t\u1EA1o l\u1EA1i.",
      opsAllLabel: "* (t\u1EA5t c\u1EA3 thao t\xE1c)",
      historyTitle: "L\u1ECBch s\u1EED s\u1EF1 ki\u1EC7n A2A",
      historyNote: "B\u1ED9 l\u1ECDc ch\u1EA1y \u1EDF ph\xEDa giao di\u1EC7n \u2014 backend ch\u1EC9 h\u1ED7 tr\u1EE3 topic/status/limit.",
      historyColCreatedAt: "Th\u1EDDi gian",
      historyColTopic: "Ch\u1EE7 \u0111\u1EC1",
      historyColSource: "Nh\xE2n s\u1EF1 ngu\u1ED3n",
      historyColTarget: "Nh\xE2n s\u1EF1 \u0111\xEDch",
      historyColStatus: "Tr\u1EA1ng th\xE1i",
      historyColRisk: "M\u1EE9c r\u1EE7i ro",
      historyColRetry: "S\u1ED1 l\u1EA7n th\u1EED",
      historyFilterSourcePlaceholder: "L\u1ECDc nh\xE2n s\u1EF1 ngu\u1ED3n/\u0111\xEDch",
      historyFilterTopicPlaceholder: "L\u1ECDc ch\u1EE7 \u0111\u1EC1",
      historyFilterStatusPlaceholder: "L\u1ECDc tr\u1EA1ng th\xE1i",
      historyNoData: "Kh\xF4ng c\xF3 s\u1EF1 ki\u1EC7n A2A n\xE0o.",
      historyShowBtn: "\u25BC Hi\u1EC7n l\u1ECBch s\u1EED s\u1EF1 ki\u1EC7n A2A",
      historyHideBtn: "\u25B2 \u1EA8n l\u1ECBch s\u1EED s\u1EF1 ki\u1EC7n A2A",
      historyRefreshBtn: "\u21BB L\xE0m m\u1EDBi l\u1ECBch s\u1EED"
    },
    sandbox: {
      title: "C\u1EA5u h\xECnh m\xF4i tr\u01B0\u1EDDng c\xE1ch ly",
      viewTitle: "Xem c\u1EA5u h\xECnh c\xE1ch ly",
      updateTitle: "C\u1EADp nh\u1EADt c\u1EA5u h\xECnh c\xE1ch ly",
      filterProfileLabel: "M\xE3 h\u1ED3 s\u01A1",
      profilePlaceholder: "m\xE3 h\u1ED3 s\u01A1",
      viewBtn: "Xem",
      updateBtn: "C\u1EADp nh\u1EADt",
      updateProfilePlaceholder: "m\xE3 h\u1ED3 s\u01A1 c\u1EA7n c\u1EADp nh\u1EADt",
      backendPlaceholder: (codes) => `gi\xE1 tr\u1ECB h\u1EE3p l\u1EC7: ${codes}`,
      fieldId: "M\xE3",
      fieldProfileId: "M\xE3 h\u1ED3 s\u01A1",
      fieldSandboxMode: "Ch\u1EBF \u0111\u1ED9 c\xE1ch ly",
      fieldBackend: "M\xF4i tr\u01B0\u1EDDng ch\u1EA1y",
      fieldWorkspaceAccess: "Quy\u1EC1n truy c\u1EADp th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
      fieldPruneOnExit: "D\u1ECDn d\u1EB9p khi tho\xE1t",
      labelProfileId: "M\xE3 h\u1ED3 s\u01A1 *",
      labelSandboxMode: "Ch\u1EBF \u0111\u1ED9 c\xE1ch ly",
      labelBackend: "M\xF4i tr\u01B0\u1EDDng ch\u1EA1y",
      labelWorkspaceAccess: "Quy\u1EC1n truy c\u1EADp th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
      inheritedNote: (rule) => `Nh\xE2n s\u1EF1 n\xE0y ch\u01B0a c\xF3 quy t\u1EAFc m\xF4i tr\u01B0\u1EDDng c\xE1ch ly ri\xEAng \u2014 quy t\u1EAFc \u0111ang th\u1EF1c s\u1EF1 \xE1p d\u1EE5ng l\xE0: ${rule}.`,
      notFoundPrefix: "Kh\xF4ng t\xECm th\u1EA5y:",
      errRequired: "Nh\u1EADp m\xE3 h\u1ED3 s\u01A1",
      errNothingToChange: "H\xE3y ch\u1ECDn \xEDt nh\u1EA5t m\u1ED9t thi\u1EBFt l\u1EADp c\u1EA7n thay \u0111\u1ED5i.",
      confirmSave: (id) => `\u0110\u1ED5i thi\u1EBFt l\u1EADp m\xF4i tr\u01B0\u1EDDng c\xE1ch ly c\u1EE7a ${id}? Thay \u0111\u1ED5i c\xF3 hi\u1EC7u l\u1EF1c ngay (ho\u1EB7c chuy\u1EC3n sang ch\u1EDD duy\u1EC7t).`,
      saved: (pid) => `\u0110\xE3 c\u1EADp nh\u1EADt m\xF4i tr\u01B0\u1EDDng c\xE1ch ly cho ${pid}`,
      pendingT2: (aprId) => `Thay \u0111\u1ED5i l\u1EDBn \u2014 ch\u1EDD duy\u1EC7t T2: ${aprId}`
    },
    channelBindings: {
      title: "Li\xEAn k\u1EBFt k\xEAnh",
      colId: "ID",
      colChannel: "K\xEAnh",
      colProfileId: "M\xE3 h\u1ED3 s\u01A1",
      colRole: "Vai tr\xF2",
      colActive: "\u0110ang b\u1EADt",
      noBindings: "Ch\u01B0a c\xF3 li\xEAn k\u1EBFt k\xEAnh n\xE0o.",
      addTitle: "Th\xEAm li\xEAn k\u1EBFt k\xEAnh",
      editTitle: "S\u1EEDa li\xEAn k\u1EBFt k\xEAnh",
      labelChannel: "K\xEAnh *",
      labelProfileId: "M\xE3 h\u1ED3 s\u01A1 *",
      labelRole: "Vai tr\xF2",
      labelNote: "Ghi ch\xFA",
      labelPeerId: "M\xE3 ng\u01B0\u1EDDi li\xEAn h\u1EC7",
      labelGuildId: "M\xE3 m\xE1y ch\u1EE7 Discord",
      labelTeamId: "M\xE3 nh\xF3m",
      labelActive: "Tr\u1EA1ng th\xE1i",
      profileIdPlaceholder: "m\xE3 h\u1ED3 s\u01A1",
      rolePlaceholder: "v\xED d\u1EE5: qu\u1EA3n tr\u1ECB / ch\u1EC9 xem",
      notePlaceholder: "Ghi ch\xFA",
      peerIdPlaceholder: "v\xED d\u1EE5: m\xE3 ng\u01B0\u1EDDi li\xEAn h\u1EC7 trong k\xEAnh",
      guildIdPlaceholder: "v\xED d\u1EE5: m\xE3 m\xE1y ch\u1EE7 Discord",
      teamIdPlaceholder: "v\xED d\u1EE5: m\xE3 nh\xF3m Slack ho\u1EB7c Teams",
      errRequired: "M\xE3 h\u1ED3 s\u01A1 l\xE0 b\u1EAFt bu\u1ED9c",
      created: (id) => `\u0110\xE3 t\u1EA1o li\xEAn k\u1EBFt k\xEAnh: ${id}`,
      deleted: (id) => `\u0110\xE3 xo\xE1 li\xEAn k\u1EBFt k\xEAnh: ${id}`,
      saved: (id) => `\u0110\xE3 l\u01B0u li\xEAn k\u1EBFt k\xEAnh: ${id}`,
      confirmDelete: (id) => `Xo\xE1 li\xEAn k\u1EBFt k\xEAnh ${id}?`,
      confirmSave: (id) => `L\u01B0u thay \u0111\u1ED5i cho li\xEAn k\u1EBFt k\xEAnh ${id}?`,
      errUnsupportedPlatform: "N\u1EC1n t\u1EA3ng kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3",
      errNotFound: "Kh\xF4ng t\xECm th\u1EA5y li\xEAn k\u1EBFt k\xEAnh"
    },
    auditLog: {
      title: "Nh\u1EADt k\xFD ki\u1EC3m to\xE1n",
      filterLabel: "Lo\u1EA1i ch\xEDnh s\xE1ch",
      colTime: "Th\u1EDDi gian",
      colType: "Lo\u1EA1i",
      colPolicyId: "M\xE3 ch\xEDnh s\xE1ch",
      colAction: "H\xE0nh \u0111\u1ED9ng",
      colChangedBy: "Ng\u01B0\u1EDDi thay \u0111\u1ED5i",
      colRevision: "Phi\xEAn b\u1EA3n",
      colNeedsApproval: "C\u1EA7n duy\u1EC7t",
      notLoaded: "Ch\u01B0a t\u1EA3i\u2026",
      noEntries: "Kh\xF4ng c\xF3 b\u1EA3n ghi n\xE0o.",
      loadBtn: "\u21BB T\u1EA3i",
      detailsBtn: "Chi ti\u1EBFt",
      detailsTitle: "Chi ti\u1EBFt",
      beforeLabel: "Tr\u01B0\u1EDBc",
      afterLabel: "Sau",
      rawJsonLabel: "JSON g\u1ED1c (\u0111\u1EC3 \u0111\u1ED1i chi\u1EBFu)",
      friendlyFieldsLabel: "Gi\xE1 tr\u1ECB \u0111\xE3 d\u1ECBch",
      approvalIdLabel: "approval_request_id:",
      t2Badge: "T2",
      backendLimitNote: (loaded) => `B\u1EA3ng ch\u1EC9 hi\u1EC7n ${loaded} b\u1EA3n ghi m\u1EDBi nh\u1EA5t.`
    },
    routing: {
      title: "Ph\xF2ng nh\u1EADn ch\u1EC9 th\u1ECB (\u0111\u1ECBnh tuy\u1EBFn)",
      priorityOrderLabel: "C\xE1ch h\u1EC7 th\u1ED1ng ch\u1ECDn ph\xF2ng nh\u1EADn m\u1ED9t ch\u1EC9 th\u1ECB (theo th\u1EE9 t\u1EF1):",
      priorityOrder: (cb) => "1. Nh\u1EAFc t\xEAn @\u2026  \u2192  2. Th\u1EBB #\u2026  \u2192  3. " + cb + "  \u2192  4. T\u1EEB kho\xE1 trong c\xE2u  \u2192  5. Ph\xF2ng \xABchung\xBB (m\u1EB7c \u0111\u1ECBnh)",
      priorityExplanation: (cb) => "Ch\u1EC9 khi ch\u1EC9 th\u1ECB kh\xF4ng c\xF3 nh\u1EAFc t\xEAn @, kh\xF4ng c\xF3 th\u1EBB # v\xE0 kh\xF4ng kh\u1EDBp " + cb + " th\xEC h\u1EC7 th\u1ED1ng m\u1EDBi t\xECm t\u1EEB kho\xE1 trong c\xE2u. Khi nhi\u1EC1u ph\xF2ng c\xF9ng kh\u1EDBp, ph\xF2ng c\xF3 \u0111\u1ED9 \u01B0u ti\xEAn l\xE0 S\u1ED0 NH\u1ECE H\u01A0N \u0111\u01B0\u1EE3c ch\u1ECDn tr\u01B0\u1EDBc (b\u1EB1ng nhau th\xEC x\xE9t theo m\xE3 \u0111\u1ECBnh tuy\u1EBFn, theo th\u1EE9 t\u1EF1 ch\u1EEF c\xE1i).",
      colSlug: "M\xE3 \u0111\u1ECBnh tuy\u1EBFn",
      colDisplayName: "T\xEAn hi\u1EC3n th\u1ECB",
      colPriority: "\u0110\u1ED9 \u01B0u ti\xEAn",
      colKeywordCount: "S\u1ED1 t\u1EEB kho\xE1",
      colKeywords: "T\u1EEB kho\xE1 nh\u1EADn di\u1EC7n",
      colUpdatedAt: "C\u1EADp nh\u1EADt l\xFAc",
      colUpdatedBy: "Ng\u01B0\u1EDDi c\u1EADp nh\u1EADt",
      colActions: "Thao t\xE1c",
      addTitle: "Th\xEAm \u0111\u01A1n v\u1ECB \u0111\u1ECBnh tuy\u1EBFn",
      editTitle: "S\u1EEDa \u0111\u01A1n v\u1ECB \u0111\u1ECBnh tuy\u1EBFn",
      labelSlug: "M\xE3 \u0111\u1ECBnh tuy\u1EBFn *",
      labelDisplayName: "T\xEAn hi\u1EC3n th\u1ECB *",
      labelPriority: "\u0110\u1ED9 \u01B0u ti\xEAn (\u2265 0, s\u1ED1 nh\u1ECF \u0111\u01B0\u1EE3c x\xE9t tr\u01B0\u1EDBc) *",
      labelKeywords: "T\u1EEB kho\xE1 nh\u1EADn di\u1EC7n *",
      slugHint: "Ch\u1EEF th\u01B0\u1EDDng, b\u1EAFt \u0111\u1EA7u b\u1EB1ng ch\u1EEF c\xE1i, cho ph\xE9p ch\u1EEF s\u1ED1, g\u1EA1ch ngang v\xE0 g\u1EA1ch d\u01B0\u1EDBi \u2014 v\xED d\u1EE5: tech_product",
      displayNamePlaceholder: "Ph\xF2ng T\xE0i ch\xEDnh",
      keywordsPlaceholder: "k\u1EF9 thu\u1EADt\napi\nbackend",
      keywordsPlaceholderAdvanced: "^invoice\\s+\n^payment\\s+",
      noUnits: "Ch\u01B0a c\xF3 \u0111\u01A1n v\u1ECB \u0111\u1ECBnh tuy\u1EBFn n\xE0o.",
      noKeywords: "ch\u01B0a c\xF3 t\u1EEB kho\xE1",
      noKeywordsTip: "Ph\xF2ng n\xE0y ch\u01B0a c\xF3 t\u1EEB kho\xE1 n\xEAn ch\u1EC9 th\u1ECB kh\xF4ng t\u1EF1 r\u01A1i v\xE0o \u0111\xE2y qua t\u1EEB kho\xE1. B\u1EA5m \xABS\u1EEDa\xBB \u0111\u1EC3 th\xEAm, ho\u1EB7c d\xF9ng @t\xEAn ph\xF2ng / #m\xE3 ph\xF2ng trong ch\u1EC9 th\u1ECB.",
      loading: "\u0110ang t\u1EA3i\u2026",
      btnAdd: "+ Th\xEAm",
      btnSave: "L\u01B0u",
      btnCancel: "Hu\u1EF7",
      btnEdit: "S\u1EEDa",
      btnDelete: "Xo\xE1",
      btnRefresh: "\u21BB L\xE0m m\u1EDBi",
      btnAddNew: "+ \u0110\u01A1n v\u1ECB m\u1EDBi",
      errSlugFormat: "M\xE3 \u0111\u1ECBnh tuy\u1EBFn ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng ch\u1EEF c\xE1i th\u01B0\u1EDDng v\xE0 ch\u1EC9 ch\u1EE9a ch\u1EEF th\u01B0\u1EDDng, ch\u1EEF s\u1ED1, g\u1EA1ch ngang ho\u1EB7c g\u1EA1ch d\u01B0\u1EDBi (a-z, 0-9, -, _). V\xED d\u1EE5 h\u1EE3p l\u1EC7: tech_product.",
      errPriorityInt: "\u0110\u1ED9 \u01B0u ti\xEAn ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn kh\xF4ng \xE2m (\u2265 0).",
      errKeywordsEmpty: "Ph\u1EA3i c\xF3 \xEDt nh\u1EA5t m\u1ED9t t\u1EEB kho\xE1.",
      errRegexInvalid: (pattern, msg) => `Regex kh\xF4ng h\u1EE3p l\u1EC7 "${pattern}": ${msg}`,
      confirmDelete: (slug) => `Xo\xE1 \u0111\u01A1n v\u1ECB \u0111\u1ECBnh tuy\u1EBFn "${slug}"? Thao t\xE1c n\xE0y kh\xF4ng th\u1EC3 ho\xE0n t\xE1c.`,
      keywordsFormatHint: "M\u1ED7i d\xF2ng m\u1ED9t t\u1EEB ho\u1EB7c c\u1EE5m t\u1EEB, v\xED d\u1EE5: k\u1EF9 thu\u1EADt. H\u1EC7 th\u1ED1ng kh\u1EDBp tr\u1ECDn t\u1EEB v\xE0 kh\xF4ng ph\xE2n bi\u1EC7t ch\u1EEF hoa/th\u01B0\u1EDDng. Ch\u1EC9 th\u1ECB ch\u1EE9a m\u1ED9t trong c\xE1c t\u1EEB n\xE0y s\u1EBD \u0111\u01B0\u1EE3c chuy\u1EC3n cho ph\xF2ng n\xE0y.",
      keywordsAdvancedHint: "Ch\u1EBF \u0111\u1ED9 n\xE2ng cao: m\u1ED7i d\xF2ng l\xE0 m\u1ED9t bi\u1EC3u th\u1EE9c ch\xEDnh quy (regex), v\xED d\u1EE5 \\bapi\\b kh\u1EDBp tr\u1ECDn t\u1EEB, ^invoice\\s+ kh\u1EDBp \u0111\u1EA7u c\xE2u. Kh\xF4ng ph\xE2n bi\u1EC7t ch\u1EEF hoa/th\u01B0\u1EDDng.",
      modeSimple: "\u0110\u01A1n gi\u1EA3n",
      modeAdvanced: "N\xE2ng cao (regex)",
      advancedBadge: "n\xE2ng cao",
      advancedBadgeTip: "M\u1EABu n\xE2ng cao (bi\u1EC3u th\u1EE9c ch\xEDnh quy) \u2014 s\u1EEDa \u1EDF ch\u1EBF \u0111\u1ED9 \xABN\xE2ng cao\xBB.",
      switchBlocked: "C\xF3 m\u1EABu n\xE2ng cao kh\xF4ng hi\u1EC7n \u0111\u01B0\u1EE3c d\u1EA1ng ch\u1EEF th\u01B0\u1EDDng \u2014 h\xE3y gi\u1EEF ch\u1EBF \u0111\u1ED9 \xABN\xE2ng cao\xBB ho\u1EB7c xo\xE1/vi\u1EBFt l\u1EA1i c\xE1c m\u1EABu \u0111\xF3."
    },
    suggestions: {
      blockTitle: "\u0110\u1EC1 xu\u1EA5t ch\xEDnh s\xE1ch",
      pendingCount: (n) => `\u0110ang ch\u1EDD ${n} \u0111\u1EC1 xu\u1EA5t`,
      btnGenerate: "Sinh g\u1EE3i \xFD",
      btnApproveAll: "Duy\u1EC7t t\u1EA5t c\u1EA3",
      confirmApproveAll: (n) => `Duy\u1EC7t T\u1EA4T C\u1EA2 ${n} \u0111\u1EC1 xu\u1EA5t \u0111ang ch\u1EDD c\u1EE7a M\u1EE4C N\xC0Y ngay b\xE2y gi\u1EDD? Ch\u1EC9 \u0111\u1EC1 xu\u1EA5t c\u1EE7a m\u1EE5c n\xE0y \u0111\u01B0\u1EE3c duy\u1EC7t \u2014 c\xE1c m\u1EE5c ch\xEDnh s\xE1ch kh\xE1c kh\xF4ng b\u1ECB \u1EA3nh h\u01B0\u1EDFng. Quy t\u1EAFc c\xF3 hi\u1EC7u l\u1EF1c ngay. N\u1EBFu ch\u01B0a ch\u1EAFc, h\xE3y xem danh s\xE1ch tr\u01B0\u1EDBc.`,
      btnApprove: "Duy\u1EC7t",
      btnReject: "B\u1ECF qua",
      btnEdit: "S\u1EEDa",
      btnSave: "L\u01B0u",
      btnCancel: "Hu\u1EF7",
      statusDraft: "\u0110ang ch\u1EDD",
      statusApproved: "\u0110\xE3 duy\u1EC7t",
      statusRejected: "\u0110\xE3 b\u1ECF qua",
      empty: "Ch\u01B0a c\xF3 \u0111\u1EC1 xu\u1EA5t n\xE0o cho m\u1EE5c n\xE0y.",
      emptyHint: 'B\u1EA5m "Sinh g\u1EE3i \xFD" \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u.',
      beforeNull: "Ch\u01B0a c\xF3 \u2014 s\u1EBD t\u1EA1o m\u1EDBi",
      beforeNullDone: "Tr\u01B0\u1EDBc \u0111\xF3 ch\u01B0a c\xF3 \u2014 \u0111\u01B0\u1EE3c t\u1EA1o b\u1EDFi l\u1EA7n duy\u1EC7t n\xE0y",
      noPending: "Kh\xF4ng c\xF3 \u0111\u1EC1 xu\u1EA5t n\xE0o \u0111ang ch\u1EDD.",
      showDecided: (n) => `Xem ${n} \u0111\u1EC1 xu\u1EA5t \u0111\xE3 x\u1EED l\xFD`,
      hideDecided: "\u1EA8n c\xE1c \u0111\u1EC1 xu\u1EA5t \u0111\xE3 x\u1EED l\xFD",
      beforeLabel: "Tr\u01B0\u1EDBc",
      afterLabel: "Sau",
      toastGenerated: (n) => `\u0110\xE3 sinh ${n} \u0111\u1EC1 xu\u1EA5t`,
      toastApprovedAll: "\u0110\xE3 duy\u1EC7t to\xE0n b\u1ED9 \u0111\u1EC1 xu\u1EA5t \u0111ang ch\u1EDD",
      toastApprovedAllPartial: (ok, failed) => `\u0110\xE3 duy\u1EC7t ${ok} \u0111\u1EC1 xu\u1EA5t, nh\u01B0ng ${failed} \u0111\u1EC1 xu\u1EA5t kh\xF4ng \xE1p d\u1EE5ng \u0111\u01B0\u1EE3c \u2014 v\u1EABn c\xF2n trong danh s\xE1ch ch\u1EDD.`,
      toastApproved: "\u0110\xE3 duy\u1EC7t \u0111\u1EC1 xu\u1EA5t",
      toastRejected: "\u0110\xE3 b\u1ECF qua \u0111\u1EC1 xu\u1EA5t",
      toastSaved: "\u0110\xE3 l\u01B0u \u0111\u1EC1 xu\u1EA5t",
      notesTitle: "Ghi ch\xFA h\u1EC7 th\u1ED1ng",
      paramStageLabel: "giai \u0111o\u1EA1n",
      rationale: {
        toolPolicyFromRoleCard: (agent, tool, scope, writeAccess) => `Nh\xE2n s\u1EF1 ${agent} \u0111\xE3 khai b\xE1o c\xF4ng c\u1EE5 ${tool} (ph\u1EA1m vi: ${scope}, quy\u1EC1n ghi: ${writeAccess}) trong th\u1EBB vai tr\xF2`,
        sandboxIndependentControl: (agent) => `Nh\xE2n s\u1EF1 ${agent} v\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp \u2014 d\xF9ng k\xEAnh gi\xE1m s\xE1t \u0111\u1ED9c l\u1EADp \u0111\u1EC3 duy tr\xEC c\xE1ch ly`,
        sandboxIndependent: (agent) => `Nh\xE2n s\u1EF1 ${agent} \u0111\xE3 v\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp \u2014 cho ph\xE9p ghi th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c`,
        sandboxNotIndependent: (agent) => `Nh\xE2n s\u1EF1 ${agent} ch\u01B0a \u0111\u1EA1t v\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp \u2014 b\u1EADt c\xE1ch ly, ch\u1EC9 \u0111\u1ECDc th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c`,
        toolPolicyFromRoleBaseline: (agent, tool) => `Nh\xE2n s\u1EF1 ${agent} ch\u01B0a c\xF3 th\u1EBB vai tr\xF2 \u2014 c\xF4ng c\u1EE5 ${tool} l\xE0 c\xF4ng c\u1EE5 chung c\u1EE7a m\u1ECDi nh\xE2n s\u1EF1 c\xF9ng lo\u1EA1i vai tr\xF2 n\xEAn \u0111\u01B0\u1EE3c g\u1EE3i \xFD l\xE0m m\u1EE9c c\u01A1 b\u1EA3n an to\xE0n`,
        toolPolicyDenyUnusedGroup: (target, group, members, role) => target.startsWith("role:") ? `C\u1EA3 ${members} nh\xE2n s\u1EF1 vai tr\xF2 "${role}" \u0111\u1EC1u \u0111ang T\u1EAET nh\xF3m c\xF4ng c\u1EE5 "${group}" trong c\u1EA5u h\xECnh th\u1EADt \u2014 ch\u1EB7n cho c\u1EA3 vai tr\xF2 \u0111\u1EC3 nh\xE2n s\u1EF1 th\xEAm sau n\xE0y kh\xF4ng t\u1EF1 c\xF3 nh\xF3m n\xE0y` : `${target} \u0111ang t\u1EAFt nh\xF3m c\xF4ng c\u1EE5 "${group}" trong c\u1EA5u h\xECnh th\u1EADt \u2014 ch\u1EB7n \u0111\u1EC3 kh\xF4ng b\u1ECB d\xF9ng nh\u1EA7m`,
        a2aFromOrgLine: (manager, agent) => `${agent} b\xE1o c\xE1o cho ${manager} trong s\u01A1 \u0111\u1ED3 t\u1ED5 ch\u1EE9c \u2014 cho ph\xE9p giao vi\u1EC7c xu\u1ED1ng v\xE0 b\xE1o c\xE1o l\xEAn`,
        a2aFromFlow: (producerCluster, consumerCluster, direction, topicCount) => `Lu\u1ED3ng y\xEAu c\u1EA7u trao \u0111\u1ED5i A2A: ${producerCluster} \u2192 ${consumerCluster} (h\u01B0\u1EDBng: ${direction}, ${topicCount} ch\u1EE7 \u0111\u1EC1)`,
        channelFromRoleCardTool: (agent, channel, toolName) => `Nh\xE2n s\u1EF1 ${agent} d\xF9ng c\xF4ng c\u1EE5 ${toolName} \u2014 c\u1EA7n g\u1EAFn k\xEAnh ${channel}`
      },
      note: {
        noToolsDeclared: (agent) => `Nh\xE2n s\u1EF1 ${agent} ch\u01B0a khai b\xE1o c\xF4ng c\u1EE5 n\xE0o trong th\u1EBB vai tr\xF2 \u2014 kh\xF4ng sinh quy t\u1EAFc ch\xEDnh s\xE1ch`,
        noRoleCard: (profileId) => `H\u1ED3 s\u01A1 ${profileId} ch\u01B0a c\xF3 th\u1EBB vai tr\xF2 n\xEAn ch\u01B0a g\u1EE3i \xFD \u0111\u01B0\u1EE3c ch\xEDnh s\xE1ch`,
        a2aNoRepresentative: (cluster, topic) => `Nh\xF3m ${cluster} ch\u01B0a c\xF3 nh\xE2n s\u1EF1 \u0111\u1EA1i di\u1EC7n cho ch\u1EE7 \u0111\u1EC1 ${topic} \u2014 kh\xF4ng sinh u\u1EF7 quy\u1EC1n A2A`,
        channelNotConfigured: () => `Ch\u01B0a c\xF3 k\xEAnh n\xE0o \u0111\u1EC3 g\u1EAFn \u2014 kh\xF4ng th\u1EC3 sinh \u0111\u1EC1 xu\u1EA5t li\xEAn k\u1EBFt k\xEAnh. Ch\u1EE7 t\u1ECBch vui l\xF2ng c\u1EA5u h\xECnh \xEDt nh\u1EA5t m\u1ED9t k\xEAnh tr\u01B0\u1EDBc.`,
        channelNoDeclaration: (channel) => `K\xEAnh ${channel} ch\u01B0a c\xF3 nh\xE2n s\u1EF1 khai b\xE1o \u2014 kh\xF4ng sinh quy t\u1EAFc li\xEAn k\u1EBFt k\xEAnh`
      },
      valueMissing: "Ch\u01B0a c\xF3",
      valueYes: "C\xF3",
      valueNo: "Kh\xF4ng",
      field: {
        id: "M\xE3",
        profile_id: "M\xE3 h\u1ED3 s\u01A1",
        provider: "Nh\xE0 cung c\u1EA5p",
        tool_pattern: "M\u1EABu c\xF4ng c\u1EE5",
        policy_action: "H\xE0nh \u0111\u1ED9ng ch\xEDnh s\xE1ch",
        scope: "Ph\u1EA1m vi",
        layer_priority: "\u0110\u1ED9 \u01B0u ti\xEAn t\u1EA7ng",
        policy_revision: "Phi\xEAn b\u1EA3n",
        note: "Ghi ch\xFA",
        active: "Tr\u1EA1ng th\xE1i",
        sandbox_mode: "Ch\u1EBF \u0111\u1ED9 c\xE1ch ly",
        backend: "M\xF4i tr\u01B0\u1EDDng ch\u1EA1y",
        workspace_access: "Quy\u1EC1n truy c\u1EADp th\u01B0 m\u1EE5c",
        tool_scope: "Ph\u1EA1m vi c\xF4ng c\u1EE5",
        write_access: "Quy\u1EC1n ghi",
        tools_policy_json: "JSON ch\xEDnh s\xE1ch c\xF4ng c\u1EE5",
        prune_on_exit: "D\u1ECDn d\u1EB9p khi tho\xE1t",
        from_profile: "H\u1ED3 s\u01A1 g\u1EEDi",
        to_profile: "H\u1ED3 s\u01A1 nh\u1EADn",
        direction: "H\u01B0\u1EDBng trao \u0111\u1ED5i",
        allowed_operations: "Thao t\xE1c \u0111\u01B0\u1EE3c ph\xE9p",
        expires_at: "H\u1EBFt h\u1EA1n l\xFAc",
        granted_by: "Ng\u01B0\u1EDDi c\u1EA5p",
        created_by: "Ng\u01B0\u1EDDi t\u1EA1o",
        created_at: "Th\u1EDDi \u0111i\u1EC3m t\u1EA1o",
        updated_at: "C\u1EADp nh\u1EADt l\xFAc",
        channel: "K\xEAnh",
        role: "Vai tr\xF2",
        peer_id: "M\xE3 ng\u01B0\u1EDDi li\xEAn h\u1EC7",
        guild_id: "M\xE3 m\xE1y ch\u1EE7 Discord",
        team_id: "M\xE3 nh\xF3m",
        tool_name: "T\xEAn c\xF4ng c\u1EE5"
      }
    },
    toolApproval: {
      title: "Xin ph\xE9p tr\u01B0\u1EDBc khi d\xF9ng c\xF4ng c\u1EE5",
      intro: "Ch\u1ECDn nh\u1EEFng vi\u1EC7c m\xE0 nh\xE2n vi\xEAn AI ph\u1EA3i \u0111\u01B0\u1EE3c duy\u1EC7t tr\u01B0\u1EDBc khi l\xE0m. Khi nh\xE2n vi\xEAn AI \u0111\u1ECBnh l\xE0m, h\u1EC7 th\u1ED1ng s\u1EBD d\u1EEBng l\u1EA1i v\xE0 g\u1EEDi m\u1ED9t phi\u1EBFu xin ph\xE9p. Duy\u1EC7t xong, nh\xE2n vi\xEAn AI m\u1EDBi \u0111\u01B0\u1EE3c l\xE0m \u0111\xFAng vi\u1EC7c \u0111\xF3.",
      howTitle: "C\xE1ch ho\u1EA1t \u0111\u1ED9ng",
      howItems: [
        "Nh\xE2n vi\xEAn AI \u0111\u1ECBnh l\xE0m vi\u1EC7c c\u1EA7n xin ph\xE9p \u2014 h\u1EC7 th\u1ED1ng d\u1EEBng l\u1EA1i v\xE0 g\u1EEDi phi\u1EBFu xin ph\xE9p.",
        "Tr\u01B0\u1EDFng ph\xF2ng c\u1EE7a nh\xE2n vi\xEAn AI \u0111\xF3 (ho\u1EB7c Ch\u1EE7 t\u1ECBch) \u0111\u1ED3ng \xFD ho\u1EB7c t\u1EEB ch\u1ED1i trong H\xE0ng ch\u1EDD duy\u1EC7t.",
        "N\u1EBFu \u0111\u1ED3ng \xFD, nh\xE2n vi\xEAn AI \u0111\u01B0\u1EE3c l\xE0m l\u1EA1i \u0111\xFAng vi\u1EC7c \u0111\xF3 m\u1ED9t l\u1EA7n, trong th\u1EDDi h\u1EA1n c\u1EE7a gi\u1EA5y ph\xE9p.",
        "N\u1EBFu qu\xE1 h\u1EA1n m\xE0 kh\xF4ng ai quy\u1EBFt \u0111\u1ECBnh (24 gi\u1EDD v\u1EDBi m\u1EE9c T1), phi\u1EBFu h\u1EBFt h\u1EA1n v\xE0 nh\xE2n vi\xEAn AI ph\u1EA3i xin l\u1EA1i."
      ],
      rulesTitle: "C\xE1c lu\u1EADt xin ph\xE9p",
      noRules: "Ch\u01B0a c\xF3 lu\u1EADt xin ph\xE9p n\xE0o \u2014 nh\xE2n vi\xEAn AI ch\u1EC9 theo Ch\xEDnh s\xE1ch c\xF4ng c\u1EE5.",
      colApplies: "\xC1p d\u1EE5ng cho",
      colTool: "C\xF4ng c\u1EE5",
      colWhen: "Khi n\xE0o",
      colApprover: "Ai duy\u1EC7t",
      colPermit: "Gi\u1EA5y ph\xE9p c\xF3 hi\u1EC7u l\u1EF1c",
      colNote: "Ghi ch\xFA",
      colActive: "Tr\u1EA1ng th\xE1i",
      allAgents: "T\u1EA5t c\u1EA3 nh\xE2n vi\xEAn AI",
      always: "M\u1ECDi l\u1EA7n d\xF9ng c\xF4ng c\u1EE5 n\xE0y",
      joinAll: " v\xE0 ",
      joinAny: " ho\u1EB7c ",
      permitHours: (n) => `${n} gi\u1EDD, d\xF9ng m\u1ED9t l\u1EA7n`,
      tiers: {
        T1: "Tr\u01B0\u1EDFng ph\xF2ng ho\u1EB7c Ch\u1EE7 t\u1ECBch",
        T2: "Tu\xE2n th\u1EE7 v\xE0 Ch\u1EE7 t\u1ECBch",
        T3: "Ch\u1EC9 Ch\u1EE7 t\u1ECBch"
      },
      ops: {
        eq: "l\xE0",
        ne: "kh\xF4ng ph\u1EA3i",
        contains: "c\xF3 ch\u1EE9a",
        not_contains: "kh\xF4ng ch\u1EE9a",
        in: "n\u1EB1m trong",
        not_in: "kh\xF4ng n\u1EB1m trong",
        gt: "l\u1EDBn h\u01A1n",
        gte: "l\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng",
        lt: "nh\u1ECF h\u01A1n",
        lte: "nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng",
        matches: "kh\u1EDBp m\u1EABu",
        exists: "c\xF3 xu\u1EA5t hi\u1EC7n",
        not_exists: "kh\xF4ng xu\u1EA5t hi\u1EC7n"
      },
      addTitle: "Th\xEAm lu\u1EADt xin ph\xE9p",
      editTitle: "S\u1EEDa lu\u1EADt xin ph\xE9p",
      labelProfile: "\xC1p d\u1EE5ng cho",
      profilePlaceholder: "Nh\xE2n vi\xEAn AI, ph\xF2ng ho\u1EB7c vai tr\xF2",
      labelTool: "C\xF4ng c\u1EE5",
      toolPlaceholder: "T\xEAn c\xF4ng c\u1EE5 ho\u1EB7c m\u1EABu (vd crm_write, kanban_*)",
      labelWhen: "Ch\u1EC9 khi (kh\xF4ng b\u1EAFt bu\u1ED9c)",
      whenHint: "\u0110\u1EC3 tr\u1ED1ng n\u1EBFu mu\u1ED1n l\u1EA7n n\xE0o c\u0169ng ph\u1EA3i xin ph\xE9p. \u0110i\u1EC1u ki\u1EC7n x\xE9t n\u1ED9i dung vi\u1EC7c nh\xE2n vi\xEAn AI \u0111\u1ECBnh l\xE0m (v\xED d\u1EE5 s\u1ED1 ti\u1EC1n).",
      addCondition: "+ Th\xEAm \u0111i\u1EC1u ki\u1EC7n",
      removeCondition: "X\xF3a",
      fieldPlaceholder: "Tr\u01B0\u1EDDng (vd amount)",
      valuePlaceholder: "Gi\xE1 tr\u1ECB",
      valuesPlaceholder: "C\xE1c gi\xE1 tr\u1ECB, c\xE1ch nhau b\u1EB1ng d\u1EA5u ph\u1EA9y",
      labelMode: "Lu\u1EADt \xE1p d\u1EE5ng khi",
      modeAll: "th\u1ECFa t\u1EA5t c\u1EA3 \u0111i\u1EC1u ki\u1EC7n",
      modeAny: "th\u1ECFa m\u1ED9t trong c\xE1c \u0111i\u1EC1u ki\u1EC7n",
      labelTier: "Ai duy\u1EC7t",
      labelHours: "Gi\u1EA5y ph\xE9p c\xF3 hi\u1EC7u l\u1EF1c (gi\u1EDD)",
      hoursHint: "Sau khi \u0111\u01B0\u1EE3c duy\u1EC7t, nh\xE2n vi\xEAn AI c\xF3 kho\u1EA3ng th\u1EDDi gian n\xE0y \u0111\u1EC3 l\xE0m l\u1EA1i \u0111\xFAng vi\u1EC7c \u0111\xF3 m\u1ED9t l\u1EA7n (1\u2013168 gi\u1EDD).",
      labelNote: "Ghi ch\xFA",
      notePlaceholder: "V\xEC sao vi\u1EC7c n\xE0y c\u1EA7n xin ph\xE9p",
      labelActive: "Tr\u1EA1ng th\xE1i",
      errRequired: "H\xE3y ch\u1ECDn lu\u1EADt \xE1p d\u1EE5ng cho ai v\xE0 cho c\xF4ng c\u1EE5 n\xE0o.",
      errField: "M\u1ED7i \u0111i\u1EC1u ki\u1EC7n c\u1EA7n c\xF3 t\xEAn tr\u01B0\u1EDDng.",
      errValue: "M\u1ED7i \u0111i\u1EC1u ki\u1EC7n c\u1EA7n c\xF3 gi\xE1 tr\u1ECB.",
      errNumber: "So s\xE1nh l\u1EDBn h\u01A1n/nh\u1ECF h\u01A1n c\u1EA7n m\u1ED9t con s\u1ED1.",
      errTooMany: "M\u1ED7i lu\u1EADt t\u1ED1i \u0111a 20 \u0111i\u1EC1u ki\u1EC7n.",
      errHours: "Hi\u1EC7u l\u1EF1c gi\u1EA5y ph\xE9p ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn t\u1EEB 1 \u0111\u1EBFn 168 gi\u1EDD.",
      created: "\u0110\xE3 th\xEAm lu\u1EADt xin ph\xE9p.",
      saved: "\u0110\xE3 l\u01B0u lu\u1EADt xin ph\xE9p.",
      deleted: "\u0110\xE3 g\u1EE1 lu\u1EADt xin ph\xE9p.",
      confirmDelete: "G\u1EE1 lu\u1EADt xin ph\xE9p n\xE0y? Nh\xE2n vi\xEAn AI s\u1EBD kh\xF4ng c\u1EA7n xin ph\xE9p theo lu\u1EADt n\xE0y n\u1EEFa.",
      confirmSave: "L\u01B0u thay \u0111\u1ED5i cho lu\u1EADt xin ph\xE9p n\xE0y?",
      previewTitle: "Th\u1EED lu\u1EADt",
      previewAgent: "Nh\xE2n vi\xEAn AI",
      previewAgentPlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn AI",
      previewTool: "C\xF4ng c\u1EE5",
      previewArgs: "V\xED d\u1EE5 vi\u1EC7c \u0111\u1ECBnh l\xE0m (JSON)",
      previewArgsPlaceholder: '{"amount": 20000000}',
      previewBtn: "Ki\u1EC3m tra",
      previewBadJson: "V\xED d\u1EE5 kh\xF4ng ph\u1EA3i JSON h\u1EE3p l\u1EC7.",
      previewErrRequired: "H\xE3y ch\u1ECDn nh\xE2n vi\xEAn AI v\xE0 c\xF4ng c\u1EE5.",
      previewNeeds: (who) => `C\u1EA7n xin ph\xE9p \u2014 ng\u01B0\u1EDDi duy\u1EC7t: ${who}`,
      previewNot: "Vi\u1EC7c n\xE0y kh\xF4ng c\u1EA7n xin ph\xE9p.",
      requestsTitle: "C\xE1c phi\u1EBFu xin ph\xE9p g\u1EA7n \u0111\xE2y",
      requestsHint: "Duy\u1EC7t c\xE1c phi\u1EBFu n\xE0y \u1EDF C\xF4ng ty \u2192 H\xE0ng ch\u1EDD duy\u1EC7t.",
      noRequests: "Ch\u01B0a c\xF3 phi\u1EBFu xin ph\xE9p n\xE0o.",
      colTime: "Th\u1EDDi gian",
      colAgent: "Nh\xE2n vi\xEAn AI",
      colAction: "C\xF4ng c\u1EE5",
      colContent: "Vi\u1EC7c \u0111\u1ECBnh l\xE0m",
      colState: "Tr\u1EA1ng th\xE1i",
      colDeadline: "H\u1EA1n / quy\u1EBFt \u0111\u1ECBnh",
      showContent: "Xem",
      states: {
        waiting: "\u0110ang ch\u1EDD duy\u1EC7t",
        approved: "\u0110\xE3 duy\u1EC7t \u2014 ch\u01B0a d\xF9ng",
        used: "\u0110\xE3 duy\u1EC7t v\xE0 \u0111\xE3 d\xF9ng",
        rejected: "B\u1ECB t\u1EEB ch\u1ED1i",
        expired: "\u0110\xE3 h\u1EBFt h\u1EA1n"
      }
    },
    operations: {
      title: "C\u1EA5u h\xECnh v\u1EADn h\xE0nh",
      sectionDigestCadence: "A \u2014 Nh\u1ECBp Digest",
      labelDailyCron: "Cron digest h\xE0ng ng\xE0y",
      labelWeeklyCron: "Cron digest h\xE0ng tu\u1EA7n",
      labelTimezone: "M\xFAi gi\u1EDD (d\xF9ng chung cho daily & weekly)",
      presetDailyLabel: "Preset: 08:00 h\xE0ng ng\xE0y",
      presetWeeklyLabel: "Preset: Th\u1EE9 Hai 09:00",
      // Giá trị mẫu kỹ thuật (cron/múi giờ) — giống nhau ở mọi ngôn ngữ.
      presetDaily: "0 8 * * *",
      presetWeekly: "0 9 * * 1",
      timezonePlaceholder: "Asia/Ho_Chi_Minh",
      sectionEscalation: "B \u2014 Ng\u01B0\u1EE1ng leo thang",
      labelReminderHours: "S\u1ED1 gi\u1EDD nh\u1EAFc nh\u1EDF",
      labelEscalateHours: "S\u1ED1 gi\u1EDD leo thang",
      reminderHoursHint: "S\u1ED1 gi\u1EDD tr\u01B0\u1EDBc khi g\u1EEDi nh\u1EAFc nh\u1EDF (m\u1EB7c \u0111\u1ECBnh: 24)",
      escalateHoursHint: "S\u1ED1 gi\u1EDD tr\u01B0\u1EDBc khi leo thang (m\u1EB7c \u0111\u1ECBnh: 72)",
      btnSave: "L\u01B0u A + B",
      saving: "\u0110ang l\u01B0u\u2026",
      savedAt: (at) => `\u0110\xE3 l\u01B0u l\xFAc ${at}`,
      sectionCurrentSchedule: "C \u2014 L\u1ECBch digest hi\u1EC7n t\u1EA1i",
      colType: "Lo\u1EA1i",
      colCron: "Cron",
      colTimezone: "M\xFAi gi\u1EDD",
      colNextRun: "L\u1EA7n ch\u1EA1y k\u1EBF ti\u1EBFp",
      colSource: "Ngu\u1ED3n",
      daily: "H\xE0ng ng\xE0y",
      weekly: "H\xE0ng tu\u1EA7n",
      notAvailable: "\u2014",
      btnRefresh: "\u21BB L\xE0m m\u1EDBi",
      sectionReload: "D \u2014 T\u1EA3i l\u1EA1i c\u1EA5u h\xECnh",
      btnReload: "T\u1EA3i l\u1EA1i c\u1EA5u h\xECnh",
      reloading: "\u0110ang t\u1EA3i l\u1EA1i\u2026",
      reloadOk: (epoch, at) => `\u2705 \u0110\xE3 t\u1EA3i l\u1EA1i c\u1EA5u h\xECnh l\xFAc ${at} (l\u1EA7n th\u1EE9 ${epoch})`,
      reloadFailed: "\u274C T\u1EA3i l\u1EA1i th\u1EA5t b\u1EA1i.",
      errCronInvalid: "Cron kh\xF4ng h\u1EE3p l\u1EC7 \u2014 ph\u1EA3i c\xF3 \u0111\xFAng 5 field ph\xE2n c\xE1ch b\u1EDFi d\u1EA5u c\xE1ch, m\u1ED7i field ch\u1EE9a ch\u1EEF s\u1ED1, *, /, , ho\u1EB7c -.",
      errTimezoneEmpty: "M\xFAi gi\u1EDD kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.",
      errHoursPositive: "Ph\u1EA3i l\xE0 s\u1ED1 l\u1EDBn h\u01A1n 0.",
      hoursLabel: (h) => `${h} gi\u1EDD`
    },
    // ── Bảng nhãn theo nhóm mã kỹ thuật ─────────────────────────────────────────
    labelGroups: {
      unknown: "Ch\u01B0a x\xE1c \u0111\u1ECBnh",
      lifecycle: {
        design: "Thi\u1EBFt k\u1EBF",
        sandbox_benchmark: "\u0110o ki\u1EC3m trong m\xF4i tr\u01B0\u1EDDng c\xE1ch ly",
        shadow_mode: "Th\u1EED vi\u1EC7c c\xF3 r\xE0 so\xE1t",
        independent_operation: "V\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp",
        review: "Ch\u1EDD \u0111\xE1nh gi\xE1 l\u1EA1i",
        retired: "\u0110\xE3 ngh\u1EC9"
      },
      a2aDirection: {
        unidirectional: "M\u1ED9t chi\u1EC1u",
        bidirectional: "Hai chi\u1EC1u"
      },
      a2aOperation: {
        kanban_comment: "B\xECnh lu\u1EADn tr\xEAn th\u1EBB c\xF4ng vi\u1EC7c",
        delegate_task: "Giao vi\u1EC7c cho nh\xE2n s\u1EF1 AI kh\xE1c",
        send_message: "G\u1EEDi tin nh\u1EAFn"
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
      a2aEventStatus: {
        pending: "Ch\u1EDD g\u1EEDi",
        delivered: "\u0110\xE3 g\u1EEDi",
        processing: "\u0110ang x\u1EED l\xFD",
        processed: "\u0110\xE3 x\u1EED l\xFD",
        failed: "G\u1EEDi th\u1EA5t b\u1EA1i",
        dlq: "K\u1EB9t \u1EDF h\xE0ng \u0111\u1EE3i l\u1ED7i",
        expired: "H\u1EBFt h\u1EA1n"
      },
      riskTier: {
        T0: "Th\u1EA5p",
        T1: "Trung b\xECnh",
        T2: "Cao",
        T3: "R\u1EA5t cao"
      },
      workspaceAccess: {
        none: "Kh\xF4ng truy c\u1EADp th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
        ro: "Ch\u1EC9 \u0111\u1ECDc th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
        rw: "\u0110\u1ECDc v\xE0 ghi th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c"
      },
      toolPolicyAction: {
        allow: "Cho ph\xE9p",
        deny: "C\u1EA5m"
      },
      toolPolicyScope: {
        agent: "Theo nh\xE2n s\u1EF1 AI",
        global: "To\xE0n h\u1EC7 th\u1ED1ng",
        provider: "Theo nh\xE0 cung c\u1EA5p",
        profile: "Theo h\u1ED3 s\u01A1",
        group: "Theo nh\xF3m"
      },
      channelRole: {
        admin: "Qu\u1EA3n tr\u1ECB k\xEAnh",
        viewer: "Ch\u1EC9 xem",
        independent_control: "Ki\u1EC3m so\xE1t \u0111\u1ED9c l\u1EADp"
      },
      active: {
        "1": "\u0110ang hi\u1EC7u l\u1EF1c",
        "0": "\u0110\xE3 t\u1EAFt",
        "true": "\u0110ang hi\u1EC7u l\u1EF1c",
        "false": "\u0110\xE3 t\u1EAFt"
      },
      policyType: {
        tool_policy: "Ch\xEDnh s\xE1ch c\xF4ng c\u1EE5",
        a2a_grant: "U\u1EF7 quy\u1EC1n A2A",
        sandbox: "M\xF4i tr\u01B0\u1EDDng c\xE1ch ly",
        channel_binding: "K\xEAnh li\xEAn k\u1EBFt",
        tool_approval_rule: "Lu\u1EADt xin ph\xE9p"
      },
      auditAction: {
        create: "T\u1EA1o m\u1EDBi",
        update: "C\u1EADp nh\u1EADt",
        delete: "Xo\xE1",
        activate: "K\xEDch ho\u1EA1t",
        deactivate: "V\xF4 hi\u1EC7u ho\xE1"
      },
      personLabels: {
        chu_tich: "Ch\u1EE7 t\u1ECBch",
        "ceo-agent": "CEO",
        "audit-agent": "Ki\u1EC3m to\xE1n vi\xEAn",
        "compliance-agent": "Ki\u1EC3m so\xE1t vi\xEAn tu\xE2n th\u1EE7",
        "ops-agent": "Nh\xE2n vi\xEAn v\u1EADn h\xE0nh",
        "hr-lead-agent": "Tr\u01B0\u1EDFng ph\xF2ng Nh\xE2n s\u1EF1",
        "ba-agent": "Tr\u1EE3 l\xFD nghi\u1EC7p v\u1EE5",
        "as-agent": "Tr\u1EE3 l\xFD \u0111i\u1EC1u ph\u1ED1i"
      },
      personPattern: {
        lead: (phong) => "Tr\u01B0\u1EDFng ph\xF2ng " + phong,
        worker: (phong, so) => "Nh\xE2n vi\xEAn " + phong + " #" + so,
        workerPlain: (so) => "Nh\xE2n vi\xEAn #" + so
      }
    },
    // ── Nhãn phòng / cụm ─────────────────────────────────────────────────────
    clusters: {
      hr_core: "Nh\xE2n s\u1EF1",
      tech_product: "K\u1EF9 thu\u1EADt & S\u1EA3n ph\u1EA9m",
      customer_success: "Ch\u0103m s\xF3c kh\xE1ch h\xE0ng",
      infrastructure_ops: "H\u1EA1 t\u1EA7ng & V\u1EADn h\xE0nh",
      executive: "\u0110i\u1EC1u h\xE0nh",
      compliance: "Tu\xE2n th\u1EE7",
      audit: "Ki\u1EC3m to\xE1n n\u1ED9i b\u1ED9",
      finance: "T\xE0i ch\xEDnh",
      marketing: "Marketing",
      sales: "Kinh doanh",
      qa: "QA",
      training: "\u0110\xE0o t\u1EA1o"
    },
    // ── ChoiceField component strings ─────────────────────────────────────────
    orgScope: {
      unit: (name) => `C\u1EA3 ph\xF2ng: ${name}`,
      role: (name) => `M\u1ECDi nh\xE2n s\u1EF1 c\xF3 vai tr\xF2: ${name}`,
      roleLead: "Tr\u01B0\u1EDFng ph\xF2ng",
      roleWorker: "Nh\xE2n vi\xEAn"
    },
    choiceField: {
      customOptionLabel: "\u270F\uFE0F Gi\xE1 tr\u1ECB kh\xE1c \u2014 nh\u1EADp tay\u2026",
      backToList: "\u21A9 Quay l\u1EA1i danh s\xE1ch",
      emptyHintDefault: "Ch\u01B0a c\xF3 l\u1EF1a ch\u1ECDn \u2014 nh\u1EADp gi\xE1 tr\u1ECB th\u1EE7 c\xF4ng.",
      emptyHintPersonnel: "Ch\u01B0a t\u1EA3i nh\xE2n s\u1EF1 \u2014 nh\u1EADp m\xE3 h\u1ED3 s\u01A1 th\u1EE7 c\xF4ng.",
      emptyHintTools: "Ch\u01B0a t\u1EA3i m\u1EABu c\xF4ng c\u1EE5 \u2014 nh\u1EADp th\u1EE7 c\xF4ng.",
      emptyHintChannel: "Nh\u1EADp t\xEAn n\u1EC1n t\u1EA3ng k\xEAnh.",
      emptyHintRole: "Nh\u1EADp vai tr\xF2 (v\xED d\u1EE5: admin ho\u1EB7c viewer).",
      emptyHintSlug: "Nh\u1EADp m\xE3 \u0111\u1ECBnh tuy\u1EBFn.",
      emptyHintTimezone: "Nh\u1EADp m\xFAi gi\u1EDD (v\xED d\u1EE5: Asia/Ho_Chi_Minh).",
      emptyHintHours: "Nh\u1EADp s\u1ED1 gi\u1EDD.",
      groupSuffix: "(nh\xF3m)",
      channelBoundSuffix: "(\u0111\xE3 g\u1EAFn)"
    }
  };

  // src/i18n/index.ts
  var FALLBACK_LOCALE = "en";
  var DICTS = { en, vi };
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
  var cache = {};
  function dictFor(locale) {
    if (!cache[locale]) {
      cache[locale] = merge(en, DICTS[locale] ?? {});
    }
    return cache[locale];
  }
  var rememberedLocale = FALLBACK_LOCALE;
  function currentLocale() {
    try {
      if (typeof SDK2?.useI18n === "function") {
        const ctx = SDK2.useI18n();
        if (ctx && typeof ctx.locale === "string") {
          rememberedLocale = ctx.locale;
          return ctx.locale;
        }
      }
    } catch {
    }
    return rememberedLocale;
  }
  function useT() {
    const locale = currentLocale();
    return dictFor(locale in DICTS ? locale : FALLBACK_LOCALE);
  }

  // src/lib/display-labels.ts
  var FIELD_LABEL_GROUPS = {
    policy_action: "toolPolicyAction",
    scope: "toolPolicyScope",
    direction: "a2aDirection",
    sandbox_mode: "sandboxMode",
    backend: "sandboxBackend",
    workspace_access: "workspaceAccess",
    role: "channelRole",
    active: "active",
    allowed_operations: "a2aOperation",
    lifecycle_stage: "lifecycle"
  };
  var FIELD_YESNO = /* @__PURE__ */ new Set(["prune_on_exit"]);
  function _resolveRaw(t, group, code) {
    const groups = t.labelGroups;
    const map = groups?.[group];
    if (!map) return void 0;
    return map[code];
  }
  function resolveLabelOrCode(t, group, code) {
    if (code === null || code === void 0 || code === "") return "";
    const label = _resolveRaw(t, group, code);
    if (label !== void 0) return label;
    const unknown = t.labelGroups?.unknown ?? "";
    return unknown ? `${unknown} (${code})` : code;
  }
  function codeTooltip(t, code) {
    if (!code) return "";
    const label = t.common?.codeTooltipLabel ?? "";
    return label ? `${label}: ${code}` : code;
  }
  function parseCodeList(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed.startsWith("[")) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
    }
    return null;
  }
  function resolveFieldValue(t, fieldKey, value) {
    if (FIELD_YESNO.has(fieldKey)) {
      const truthy = value === 1 || value === true || value === "1" || value === "true";
      const yes = t.common?.yes ?? "Yes";
      const no = t.common?.no ?? "No";
      return [{ text: truthy ? yes : no }];
    }
    if (fieldKey === "tools_policy_json") {
      if (value === null || value === void 0 || value === "" || value === "null") return [];
      if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return [];
      if (typeof value === "string" && (value.trim() === "{}" || value.trim() === "[]")) return [];
      return null;
    }
    const group = FIELD_LABEL_GROUPS[fieldKey];
    if (group === void 0) return null;
    if (value === null || value === void 0) return [];
    if (Array.isArray(value)) {
      return value.map((item) => {
        const code = String(item);
        return { text: resolveLabelOrCode(t, group, code), code, group };
      });
    }
    const parsedList = parseCodeList(value);
    if (parsedList !== null) {
      return parsedList.map((code) => ({ text: resolveLabelOrCode(t, group, code), code, group }));
    }
    const originalCode = String(value);
    let lookupCode = originalCode;
    if (fieldKey === "active") {
      if (value === 1 || value === true || value === "1" || value === "true") lookupCode = "1";
      else if (value === 0 || value === false || value === "0" || value === "false") lookupCode = "0";
    }
    return [{ text: resolveLabelOrCode(t, group, lookupCode), code: originalCode, group }];
  }

  // src/lib/choice-field.tsx
  var CUSTOM_SENTINEL = "__custom__";
  var hintStyle = {
    fontSize: "0.78em",
    color: "var(--color-muted-foreground)",
    marginTop: 2
  };
  function ChoiceField({
    name,
    label,
    value,
    onChange,
    options,
    placeholder,
    emptyHint,
    customLabel,
    style,
    disabled
  }) {
    const t = useT();
    const [isManual, setIsManual] = useState(false);
    const [lastSeen, setLastSeen] = useState(value);
    if (value !== lastSeen) {
      setLastSeen(value);
      if (value === "" && isManual) setIsManual(false);
    }
    const resolvedCustomLabel = customLabel ?? t.choiceField.customOptionLabel;
    const resolvedEmptyHint = emptyHint ?? t.choiceField.emptyHintDefault;
    const valueInOptions = options.some((o) => o.value === value);
    const effectiveOptions = value && !valueInOptions && options.length > 0 ? [...options, { value, label: value }] : options;
    const mode = options.length === 0 ? "empty" : isManual ? "manual" : "select";
    function handleSelectChange(v) {
      if (v === CUSTOM_SENTINEL) {
        setIsManual(true);
      } else {
        onChange(v);
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        "data-choice-field": name,
        "data-choice-mode": mode,
        "data-choice-value": value,
        "data-choice-option-count": String(effectiveOptions.length),
        style
      },
      label && /* @__PURE__ */ react_shim_default.createElement(Label, null, label),
      mode === "empty" && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          value,
          onChange: (e) => onChange(e.target.value),
          placeholder,
          disabled
        }
      ), resolvedEmptyHint && /* @__PURE__ */ react_shim_default.createElement("div", { style: hintStyle }, resolvedEmptyHint)),
      mode === "manual" && /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          value,
          onChange: (e) => onChange(e.target.value),
          placeholder,
          disabled,
          style: { flex: 1 }
        }
      ), /* @__PURE__ */ react_shim_default.createElement(
        "button",
        {
          type: "button",
          className: "pc-btn pc-btn--secondary pc-btn--sm",
          onClick: () => setIsManual(false),
          disabled
        },
        t.choiceField.backToList
      )),
      mode === "select" && /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value,
          onValueChange: handleSelectChange,
          disabled,
          placeholder
        },
        effectiveOptions.map((opt) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: opt.value, value: opt.value }, opt.label)),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: CUSTOM_SENTINEL }, resolvedCustomLabel)
      )
    );
  }

  // src/pages/PolicyConfig/shared.tsx
  function useToast() {
    const [toast, setToast] = useState(null);
    function show(text, error = false) {
      setToast({ text, error });
      setTimeout(() => setToast(null), error ? 8e3 : 4e3);
    }
    return { toast, show };
  }
  function ToastBanner({ toast }) {
    if (!toast) return null;
    return /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        role: toast.error ? "alert" : "status",
        style: {
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 999,
          maxWidth: "min(30rem, calc(100vw - 3rem))",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          padding: "0.6rem 1rem",
          borderRadius: 6,
          background: toast.error ? "var(--color-destructive)" : "var(--color-primary)",
          color: toast.error ? "var(--color-destructive-foreground)" : "var(--color-primary-foreground)"
        }
      },
      toast.text
    );
  }
  function ActiveBadge({ active }) {
    const t = useT();
    const code = active ? "1" : "0";
    const label = resolveLabelOrCode(t, "active", code);
    return active ? /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-success)" }, title: codeTooltip(t, code), "data-label-group": "active", "data-label-code": code }, "\u25CF ", label) : /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" }, title: codeTooltip(t, code), "data-label-group": "active", "data-label-code": code }, "\u25CB ", label);
  }
  function EnumValue({ group, code, strong }) {
    const t = useT();
    const el = /* @__PURE__ */ react_shim_default.createElement("span", { title: codeTooltip(t, code), "data-label-group": group, "data-label-code": code }, resolveLabelOrCode(t, group, code));
    return strong ? /* @__PURE__ */ react_shim_default.createElement("strong", null, el) : el;
  }
  function _renderFallback(sugg, v) {
    if (v === null || v === void 0) {
      return /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontStyle: "italic", color: "var(--color-muted-foreground)" } }, sugg.valueMissing ?? "\u2014");
    }
    if (typeof v === "boolean") return v ? sugg.valueYes ?? "Yes" : sugg.valueNo ?? "No";
    if (typeof v === "number") {
      try {
        return new Intl.NumberFormat("vi-VN").format(v);
      } catch {
        return String(v);
      }
    }
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join(", ");
    if (typeof v === "object") {
      return Object.entries(v).map(([ik, iv]) => `${ik}: ${typeof iv === "string" ? iv : JSON.stringify(iv)}`).join(", ");
    }
    return String(v);
  }
  function FieldValueRows({
    obj,
    hide,
    onlyKeys,
    compareWith
  }) {
    const t = useT();
    const sugg = t.suggestions;
    const fieldLabels = sugg.field;
    const entries = Object.entries(obj).filter(([k]) => (!hide || !hide.has(k)) && (!onlyKeys || onlyKeys.includes(k)));
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontFamily: "var(--theme-font-mono)", fontSize: "0.82em", lineHeight: 1.6 } }, entries.map(([k, v]) => {
      const items = resolveFieldValue(t, k, v);
      const changed = compareWith !== void 0 && JSON.stringify(compareWith?.[k] ?? null) !== JSON.stringify(v ?? null);
      return /* @__PURE__ */ react_shim_default.createElement("div", { key: k, "data-diff": changed ? "true" : void 0, style: changed ? { fontWeight: 700, color: "var(--color-primary, inherit)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, fieldLabels[k] ?? k, ":"), " ", items !== null ? items.length === 0 ? /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontStyle: "italic", color: "var(--color-muted-foreground)" } }, sugg.valueMissing) : items.map((item, idx) => /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, { key: idx }, idx > 0 && ", ", item.group ? /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: item.group, code: item.code ?? "" }) : item.text)) : _renderFallback(sugg, v));
    }));
  }
  function parseApiError(e, t) {
    const raw = e?.message ?? String(e);
    let httpStatus;
    let jsonStr = raw;
    const statusMatch = raw.match(/^(\d{3}):\s*([\s\S]*)$/);
    if (statusMatch) {
      httpStatus = Number(statusMatch[1]);
      jsonStr = statusMatch[2].trim();
    }
    try {
      const body = JSON.parse(jsonStr);
      const detail = body?.detail;
      if (Array.isArray(detail)) {
        const msgs = detail.map((d) => {
          const loc = Array.isArray(d.loc) && d.loc.length > 0 ? `[${d.loc.join("\u2192")}] ` : "";
          return loc + (d.msg || String(d));
        }).join("; ");
        const prefix = t?.common.errValidation ?? "Invalid data";
        return msgs ? `${prefix} \u2014 ${msgs}` : prefix;
      }
      if (typeof detail === "string") return detail;
      if (typeof detail === "object" && detail !== null) {
        const code = detail.error;
        const c = t?.common;
        if (code === "invalid_field_value" && detail.field) {
          const base = c?.errInvalidFieldValue ?? "Invalid value";
          const allowed = Array.isArray(detail.allowed) ? detail.allowed.join(", ") : "";
          const shown = JSON.stringify(detail.value);
          return allowed ? `${base} \u2014 [${detail.field}] ${shown} \xB7 ${c?.validValues ?? "Valid values"}: ${allowed}` : `${base} \u2014 [${detail.field}] ${shown}`;
        }
        if (code === "invalid_json_field" && detail.field) {
          const base = c?.errInvalidJsonField ?? "Invalid JSON value";
          return `${base} \u2014 [${detail.field}]`;
        }
        const hint = detail.hint ?? detail.message ?? detail.supported;
        const baseMsg = _resolveErrorCode(code, t);
        if (baseMsg !== void 0) {
          return hint ? `${baseMsg} \u2014 ${hint}` : baseMsg;
        }
        const statusMsg = httpStatus !== void 0 ? t?.common.errHttpStatus(httpStatus) ?? `HTTP Error ${httpStatus}` : "API Error";
        return hint ? `${statusMsg} \u2014 ${hint}` : statusMsg;
      }
    } catch {
    }
    return raw;
  }
  function _resolveErrorCode(code, t) {
    if (!code) return void 0;
    const c = t?.common;
    const map = {
      not_found: c?.errNotFound ?? "Record not found (it may have been deleted)",
      invalid_pattern: c?.errInvalidPattern ?? "Invalid tool pattern",
      unsupported_platform: c?.errUnsupportedPlatform ?? "Unsupported platform",
      duplicate_grant: c?.errDuplicateGrant ?? "This authorization already exists",
      invalid_operations: c?.errInvalidOperations ?? "Invalid operations list",
      profile_not_found: c?.errProfileNotFound ?? "Source/destination profile not found",
      validation: c?.errValidation ?? "Invalid data",
      invalid_field_value: c?.errInvalidFieldValue ?? "Invalid value",
      invalid_json_field: c?.errInvalidJsonField ?? "Invalid JSON value"
    };
    return map[code];
  }
  var formGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "0.75rem",
    alignItems: "end"
  };
  var tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
  var thStyle = { background: "var(--color-muted)", fontWeight: 600, textAlign: "left", padding: "0.5rem 0.6rem", borderBottom: "2px solid var(--color-border)" };
  var tdStyle = { padding: "0.45rem 0.6rem", borderBottom: "1px solid var(--color-border)" };

  // src/lib/theme.ts
  var NOTICE_VAR = {
    error: "--color-destructive",
    warning: "--color-warning",
    success: "--color-success",
    info: "--color-primary"
  };
  function tint(cssVar, pct) {
    return `color-mix(in srgb, var(${cssVar}) ${pct}%, transparent)`;
  }
  var FIELD_BORDER_COLOR = "color-mix(in srgb, var(--midground-base, #ffe6cb) 45%, transparent)";
  var FIELD_FOCUS_COLOR = "var(--color-foreground, #ffe6cb)";
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
  var FIELD_CSS = `
[data-poclip-fields] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
[data-poclip-fields] select,
[data-poclip-fields] textarea,
[data-poclip-fields] [role="combobox"] {
  box-sizing: border-box;
  border: 1px solid ${FIELD_BORDER_COLOR} !important;
  border-radius: 6px;
  background: var(--color-input, rgba(255, 230, 203, 0.06)) !important;
}
[data-poclip-fields] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus,
[data-poclip-fields] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus-visible,
[data-poclip-fields] select:focus,
[data-poclip-fields] select:focus-visible,
[data-poclip-fields] textarea:focus,
[data-poclip-fields] textarea:focus-visible,
[data-poclip-fields] [role="combobox"]:focus,
[data-poclip-fields] [role="combobox"]:focus-visible {
  outline: 2px solid ${FIELD_FOCUS_COLOR} !important;
  outline-offset: 1px;
  border-color: ${FIELD_FOCUS_COLOR} !important;
}
`;
  function noticeStyle(kind) {
    const v = NOTICE_VAR[kind];
    return {
      background: tint(v, 12),
      border: `1px solid ${tint(v, 35)}`,
      borderRadius: 8,
      padding: "0.75rem 1rem",
      color: `var(${v})`
    };
  }
  var mutedTextStyle = { color: "var(--color-muted-foreground)" };
  var cardStyle = {
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "1.25rem",
    background: "var(--color-card)"
  };
  var inputLikeStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: `1px solid ${FIELD_BORDER_COLOR}`,
    borderRadius: 6,
    background: "var(--color-input, transparent)",
    color: "var(--color-foreground)",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "0.9em"
  };

  // src/lib/vi-format.ts
  function formatDateTime(iso) {
    if (iso === null || iso === void 0 || iso === "") return "\u2014";
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return "\u2014";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh"
      }).format(d);
    } catch {
      return typeof iso === "string" ? iso : "\u2014";
    }
  }

  // src/lib/server-names.ts
  var names = { people: {}, units: {} };
  var version = 0;
  var listeners = /* @__PURE__ */ new Set();
  function clean(map) {
    const out = {};
    if (map && typeof map === "object") {
      for (const [k, v] of Object.entries(map)) {
        if (typeof v === "string" && v.trim()) out[k] = v.trim();
      }
    }
    return out;
  }
  function setServerNames(payload) {
    const p = payload && typeof payload === "object" ? payload : {};
    names = { people: clean(p.people), units: clean(p.units) };
    version += 1;
    listeners.forEach((f) => f());
  }
  function serverPersonName(id) {
    return id ? names.people[id] ?? "" : "";
  }
  function serverUnitName(code) {
    return code ? names.units[code] ?? "" : "";
  }
  function useServerNamesVersion() {
    const [v, setV] = useState(version);
    useEffect(() => {
      const f = () => setV(version);
      listeners.add(f);
      f();
      return () => {
        listeners.delete(f);
      };
    }, []);
    return v;
  }

  // src/lib/org-data.ts
  var SYSTEM_INDIVIDUAL_TOOLS = [
    "read_file",
    "write_file",
    "patch",
    "bash",
    "execute_code",
    "terminal",
    "web_search",
    "web_extract",
    "browser_navigate",
    "send_message",
    "kanban_comment",
    "kanban_create",
    "kanban_show",
    "kanban_complete",
    "kanban_heartbeat",
    "delegate_task"
  ];
  var SYSTEM_TOOL_GROUPS = [
    "group:plugins",
    "group:terminal",
    "group:web",
    "group:messaging",
    "group:kanban"
  ];
  var CHANNEL_PLATFORMS = [
    "telegram",
    "discord",
    "slack",
    "whatsapp",
    "email",
    "web",
    "line",
    "signal",
    "viber",
    "zalo",
    "messenger",
    "instagram",
    "tiktok",
    "x",
    "linkedin",
    "mastodon",
    "matrix",
    "irc",
    "sms",
    "phone",
    "teams",
    "webhook",
    "api",
    "console"
  ];
  var TIMEZONE_OPTIONS = [
    "Asia/Ho_Chi_Minh",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "UTC",
    "Europe/London",
    "America/New_York"
  ];
  var ESCALATION_HOURS = [4, 8, 12, 24, 48, 72];
  function flattenOrgTree(nodes) {
    const result = [];
    function walk(node) {
      result.push(node);
      if (Array.isArray(node.children)) node.children.forEach(walk);
    }
    nodes.forEach(walk);
    return result;
  }
  function deptLabel(t, orgUnit) {
    const c = t.clusters;
    return c[orgUnit] ?? (serverUnitName(orgUnit) || orgUnit);
  }
  function personLabel(t, id) {
    const labels = t.labelGroups.personLabels;
    if (labels[id]) return labels[id];
    const named = serverPersonName(id);
    if (named) return named;
    const leadM = id.match(/^(.+)-lead-agent$/);
    if (leadM) {
      return t.labelGroups.personPattern.lead(deptLabel(t, leadM[1]));
    }
    const workerM = id.match(/^(.+)-agent-(\d+)$/);
    if (workerM) {
      const num = String(parseInt(workerM[2], 10));
      const clusterLabel = t.clusters[workerM[1]];
      if (clusterLabel) return t.labelGroups.personPattern.worker(clusterLabel, num);
      return t.labelGroups.personPattern.workerPlain(num);
    }
    return `${t.labelGroups.unknown} (${id})`;
  }
  function buildToolOptions(t, toolPolicies, suggestionPayloads) {
    const seen = /* @__PURE__ */ new Set();
    const patterns = [];
    for (const tp of toolPolicies) {
      if (tp.tool_pattern && !seen.has(tp.tool_pattern)) {
        seen.add(tp.tool_pattern);
        patterns.push(tp.tool_pattern);
      }
    }
    for (const s of suggestionPayloads) {
      if (s.tool_pattern && !seen.has(s.tool_pattern)) {
        seen.add(s.tool_pattern);
        patterns.push(s.tool_pattern);
      }
    }
    for (const tool of SYSTEM_INDIVIDUAL_TOOLS) {
      if (!seen.has(tool)) {
        seen.add(tool);
        patterns.push(tool);
      }
    }
    patterns.sort();
    const groupSuffix = t.choiceField.groupSuffix;
    const groupOpts = SYSTEM_TOOL_GROUPS.filter((g) => !seen.has(g)).map((g) => ({
      value: g,
      label: `${g} ${groupSuffix}`
    }));
    return [
      ...patterns.map((p) => ({ value: p, label: p })),
      ...groupOpts
    ];
  }
  function buildChannelOptions(t, existingChannels) {
    const boundSet = new Set(existingChannels);
    const boundSuffix = t.choiceField.channelBoundSuffix;
    const extra = existingChannels.filter((ch) => !CHANNEL_PLATFORMS.includes(ch));
    return [...CHANNEL_PLATFORMS, ...extra].map((ch) => ({
      value: ch,
      label: boundSet.has(ch) ? `${ch} ${boundSuffix}` : ch
    }));
  }
  function buildChannelRoleOptions(t, existingRoles) {
    const base = [
      { value: "admin", label: resolveLabelOrCode(t, "channelRole", "admin") },
      { value: "viewer", label: resolveLabelOrCode(t, "channelRole", "viewer") }
    ];
    const seen = new Set(base.map((o) => o.value));
    const extra = [];
    for (const role of ["independent_control", ...existingRoles]) {
      if (!seen.has(role)) {
        seen.add(role);
        extra.push({ value: role, label: resolveLabelOrCode(t, "channelRole", role) });
      }
    }
    return [...base, ...extra];
  }
  function useOrgPersonOptions(includeHumanProfiles = false) {
    const t = useT();
    const nv = useServerNamesVersion();
    const { data } = usePoclipFetch("/api/v1/org/tree");
    const { data: humanData } = usePoclipFetch("/api/v1/org/human-profiles");
    return useMemo(() => {
      if (!data?.tree) return [];
      const humanIds = new Set(
        !includeHumanProfiles && humanData?.profile_ids?.length ? humanData.profile_ids : []
      );
      const nodes = flattenOrgTree(data.tree);
      const seen = /* @__PURE__ */ new Set();
      const result = [];
      for (const n of nodes) {
        if (humanIds.has(n.profile_id)) continue;
        if (!seen.has(n.profile_id)) {
          seen.add(n.profile_id);
          result.push({
            value: n.profile_id,
            label: `${personLabel(t, n.profile_id)} \u2014 ${deptLabel(t, n.org_unit)}`
          });
        }
      }
      return result;
    }, [data, humanData, t, includeHumanProfiles, nv]);
  }
  var SCOPE_RE = /^(unit|role):(.+)$/;
  function scopeLabel(t, id) {
    const m = SCOPE_RE.exec(id || "");
    if (!m) {
      const nm = id ? personLabel(t, id) : "";
      return nm && !nm.startsWith(t.labelGroups.unknown) ? `${nm} (${id})` : id;
    }
    const os = t.orgScope;
    if (m[1] === "unit") return `${os.unit(deptLabel(t, m[2]))} (${id})`;
    const roleName = m[2] === "lead" ? os.roleLead : m[2] === "worker" ? os.roleWorker : m[2];
    return `${os.role(roleName)} (${id})`;
  }
  function useOrgScopeOptions() {
    const t = useT();
    const persons = useOrgPersonOptions();
    const nv = useServerNamesVersion();
    const { data } = usePoclipFetch("/api/v1/org/tree");
    return useMemo(() => {
      const nodes = data?.tree ? flattenOrgTree(data.tree) : [];
      const units = Array.from(new Set(nodes.map((n) => n.org_unit).filter(Boolean))).sort();
      const roles = Array.from(new Set(nodes.map((n) => String(n.role ?? "")).filter((r) => r && r !== "chairman" && r !== "human"))).sort();
      const unitOptions = units.map((u) => ({ value: `unit:${u}`, label: scopeLabel(t, `unit:${u}`) }));
      const roleOptions = roles.map((r) => ({ value: `role:${r}`, label: scopeLabel(t, `role:${r}`) }));
      return [...unitOptions, ...roleOptions, ...persons];
    }, [data, persons, t, nv]);
  }
  function useToolPatternOptions() {
    const t = useT();
    const { data: policiesData } = usePoclipFetch(
      "/api/policy/tool-policies"
    );
    const { data: suggData } = usePoclipFetch(
      "/api/policy/suggestions?policy_type=tool_policy"
    );
    return useMemo(() => {
      const toolPolicies = policiesData?.items ?? [];
      const suggPayloads = (suggData?.items ?? []).filter((s) => s.policy_type === "tool_policy").map((s) => s.payload);
      return buildToolOptions(t, toolPolicies, suggPayloads);
    }, [policiesData, suggData, t]);
  }

  // src/lib/actor.ts
  var FALLBACK_ACTOR = "chairman_human";

  // src/lib/confirm.ts
  var queue = [];
  var listeners2 = /* @__PURE__ */ new Set();
  var nextId = 1;
  function notify() {
    for (const fn of Array.from(listeners2)) fn();
  }
  function subscribeConfirm(fn) {
    listeners2.add(fn);
    return () => {
      listeners2.delete(fn);
    };
  }
  function getPendingConfirm() {
    const head = queue[0];
    if (!head) return null;
    const { resolve: _resolve, ...pending } = head;
    return pending;
  }
  function enqueue(options) {
    return new Promise((resolve) => {
      queue.push({ ...options, id: nextId++, resolve: (ok, value) => resolve({ ok, value }) });
      notify();
    });
  }
  function confirmDialog(options) {
    if (listeners2.size === 0) {
      const w = typeof window !== "undefined" ? window : void 0;
      return Promise.resolve(w && typeof w.confirm === "function" ? w.confirm(options.message) : false);
    }
    return enqueue(options).then((r) => r.ok);
  }
  function resolveConfirm(id, ok, value) {
    const idx = queue.findIndex((q) => q.id === id);
    if (idx === -1) return;
    const [item] = queue.splice(idx, 1);
    item.resolve(ok, value);
    notify();
  }

  // src/lib/paging.ts
  var PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
  function clampPage(page, pages) {
    const p = Math.floor(Number(page));
    if (!Number.isFinite(p) || p < 1) return 1;
    return pages >= 1 && p > pages ? pages : p;
  }
  function pageRange(page, pageSize, total) {
    if (!total || total <= 0 || pageSize <= 0) return { from: 0, to: 0 };
    const p = Math.max(page, 1);
    return { from: Math.min((p - 1) * pageSize + 1, total), to: Math.min(p * pageSize, total) };
  }
  function pageCount(total, pageSize) {
    if (!total || total <= 0 || pageSize <= 0) return 1;
    return Math.ceil(total / pageSize);
  }
  function sliceAt(items, page, pageSize) {
    const pages = pageCount(items.length, pageSize);
    const cur = clampPage(page, pages);
    const offset = (cur - 1) * pageSize;
    return { slice: items.slice(offset, offset + pageSize), page: cur, pages, offset };
  }

  // src/components/PagedRows.tsx
  function Pager({
    page,
    pages,
    total,
    pageSize,
    onPage,
    onPageSize
  }) {
    const t = useT().common.pager;
    const [jump, setJump] = useState("");
    const { from, to } = pageRange(page, pageSize, total);
    const go = (p) => onPage(clampPage(p, pages));
    const doJump = () => {
      if (jump !== "") {
        go(Number(jump));
        setJump("");
      }
    };
    return /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        "data-poclip-pager": "",
        style: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", padding: "0.4rem 0" }
      },
      /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => go(1), disabled: page <= 1 }, t.first),
      /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => go(page - 1), disabled: page <= 1 }, t.prev),
      /* @__PURE__ */ react_shim_default.createElement("span", { style: mutedTextStyle }, t.pagesLabel(page, pages)),
      /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => go(page + 1), disabled: page >= pages }, t.next),
      /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => go(pages), disabled: page >= pages }, t.last),
      /* @__PURE__ */ react_shim_default.createElement("span", { style: mutedTextStyle }, t.rangeLabel(from, to, total)),
      /* @__PURE__ */ react_shim_default.createElement("label", { style: { ...mutedTextStyle, display: "flex", alignItems: "center", gap: "0.3rem" } }, t.goToPage, /* @__PURE__ */ react_shim_default.createElement(
        "input",
        {
          type: "number",
          min: 1,
          max: pages,
          value: jump,
          onChange: (e) => setJump(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") doJump();
          },
          style: { width: "4.5rem" }
        }
      ), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: doJump }, t.goBtn)),
      onPageSize && /* @__PURE__ */ react_shim_default.createElement("label", { style: { ...mutedTextStyle, display: "flex", alignItems: "center", gap: "0.3rem" } }, t.perPage, /* @__PURE__ */ react_shim_default.createElement("select", { value: pageSize, onChange: (e) => onPageSize(Number(e.target.value)) }, PAGE_SIZE_OPTIONS.map((n) => /* @__PURE__ */ react_shim_default.createElement("option", { key: n, value: n }, n))))
    );
  }
  function PagedRows({
    items,
    render,
    colSpan = 1,
    pageSize = 25,
    as = "rows"
  }) {
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(pageSize);
    const list = items ?? [];
    const cut = sliceAt(list, page, size);
    const bar = list.length > size || size !== pageSize ? /* @__PURE__ */ react_shim_default.createElement(
      Pager,
      {
        page: cut.page,
        pages: cut.pages,
        total: list.length,
        pageSize: size,
        onPage: setPage,
        onPageSize: (n) => {
          setSize(n);
          setPage(1);
        }
      }
    ) : null;
    return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, cut.slice.map((item, i) => render(item, cut.offset + i)), bar && (as === "rows" ? /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { colSpan }, bar)) : /* @__PURE__ */ react_shim_default.createElement("div", { style: { gridColumn: "1 / -1" } }, bar)));
  }

  // src/pages/PolicyConfig/suggestion-keys.ts
  function resolveByCode(builders, key) {
    const candidates = [
      key,
      key.replace(/\./g, "_"),
      key.includes(".") ? key.slice(key.indexOf(".") + 1) : null
    ];
    for (const c of candidates) {
      if (c !== null && builders[c]) return builders[c]();
    }
    return key;
  }

  // src/pages/PolicyConfig/SuggestionBlock.tsx
  var ACTOR = { "X-Poclip-Actor": FALLBACK_ACTOR };
  var TECHNICAL_FIELDS = /* @__PURE__ */ new Set([
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "policy_revision",
    "revision",
    "applied_at"
  ]);
  function SuggestionBlock({ policyType, onApplied }) {
    const t = useT();
    const sugg = t.suggestions;
    const { toast, show } = useToast();
    const { data, loading, error, refetch } = usePoclipFetch(
      `/api/policy/suggestions?policy_type=${policyType}`
    );
    const [generating, setGenerating] = useState(false);
    const [showDecided, setShowDecided] = useState(false);
    const [approvingAll, setApprovingAll] = useState(false);
    const [actionId, setActionId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editOriginal, setEditOriginal] = useState({});
    const [saving, setSaving] = useState(false);
    const items = data?.items ?? [];
    const pending = data?.pending ?? 0;
    const notes = data?.notes ?? [];
    function resolveRationale(key, params) {
      const agent = String(params.agent_id ?? "");
      const stage = String(params.lifecycle_stage ?? "");
      const normKey = key.replace(/\./g, "_");
      if (normKey === "sandbox_independent") {
        return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, sugg.rationale.sandboxIndependent(agent), " (", sugg.paramStageLabel, ": ", /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "lifecycle", code: stage }), ")");
      }
      if (normKey === "sandbox_not_independent") {
        return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, sugg.rationale.sandboxNotIndependent(agent), " (", sugg.paramStageLabel, ": ", /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "lifecycle", code: stage }), ")");
      }
      const writeAccessLabel = params.write_access === true || params.write_access === 1 || params.write_access === "true" || params.write_access === "1" ? t.common.yes : t.common.no;
      const builders = {
        tool_policy_from_role_card: () => sugg.rationale.toolPolicyFromRoleCard(
          agent,
          String(params.tool_name ?? ""),
          String(params.tool_scope ?? ""),
          writeAccessLabel
        ),
        sandbox_independent_control: () => sugg.rationale.sandboxIndependentControl(agent),
        tool_policy_from_role_baseline: () => sugg.rationale.toolPolicyFromRoleBaseline(agent, String(params.tool_name ?? "")),
        tool_policy_deny_unused_group: () => sugg.rationale.toolPolicyDenyUnusedGroup(
          String(params.target ?? ""),
          String(params.group ?? ""),
          Number(params.members ?? 0),
          String(params.role ?? "")
        ),
        a2a_from_org_line: () => sugg.rationale.a2aFromOrgLine(String(params.manager_id ?? ""), String(params.agent_id ?? "")),
        a2a_from_flow: () => sugg.rationale.a2aFromFlow(
          String(params.producer_cluster ?? ""),
          String(params.consumer_cluster ?? ""),
          resolveLabelOrCode(t, "a2aDirection", String(params.direction ?? "")),
          Number(params.topic_count ?? 0)
        ),
        channel_from_role_card_tool: () => sugg.rationale.channelFromRoleCardTool(
          agent,
          String(params.channel ?? ""),
          String(params.tool_name ?? "")
        )
      };
      return resolveByCode(builders, key);
    }
    function resolveNote(code, params) {
      const builders = {
        no_tools_declared: () => sugg.note.noToolsDeclared(String(params.agent_id ?? "")),
        no_role_card: () => sugg.note.noRoleCard(String(params.profile_id ?? "")),
        a2a_no_representative: () => sugg.note.a2aNoRepresentative(String(params.cluster ?? ""), String(params.topic ?? "")),
        channel_not_configured: () => sugg.note.channelNotConfigured(),
        channel_no_declaration: () => sugg.note.channelNoDeclaration(String(params.channel ?? ""))
      };
      return resolveByCode(builders, code);
    }
    function openEditForm(item) {
      const form = {};
      for (const [k, v] of Object.entries(item.payload)) {
        form[k] = String(v ?? "");
      }
      setEditForm(form);
      setEditOriginal({ ...form });
      setEditId(item.id);
    }
    function cancelEdit() {
      setEditId(null);
      setSaving(false);
    }
    async function handleGenerate() {
      setGenerating(true);
      try {
        const res = await poclipMutate(
          "/api/policy/suggestions/generate",
          "POST",
          void 0,
          ACTOR
        );
        show(sugg.toastGenerated(res?.created ?? 0));
        refetch();
        onApplied?.();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setGenerating(false);
      }
    }
    async function handleApproveAll() {
      if (!await confirmDialog({ message: sugg.confirmApproveAll(pending) })) return;
      setApprovingAll(true);
      try {
        const res = await poclipMutate(`/api/policy/suggestions/approve-all?policy_type=${policyType}`, "POST", void 0, ACTOR);
        const failedN = Array.isArray(res?.failed) ? res.failed.length : 0;
        if (failedN > 0) show(sugg.toastApprovedAllPartial(Number(res?.approved ?? 0), failedN), true);
        else show(sugg.toastApprovedAll);
        refetch();
        onApplied?.();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setApprovingAll(false);
      }
    }
    async function handleApprove(id) {
      setActionId(id);
      try {
        await poclipMutate(`/api/policy/suggestions/${id}/approve`, "POST", void 0, ACTOR);
        show(sugg.toastApproved);
        refetch();
        onApplied?.();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setActionId(null);
      }
    }
    async function handleReject(id) {
      setActionId(id);
      try {
        await poclipMutate(`/api/policy/suggestions/${id}/reject`, "POST", void 0, ACTOR);
        show(sugg.toastRejected);
        refetch();
        onApplied?.();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setActionId(null);
      }
    }
    async function handleSaveEdit(id) {
      const changed = {};
      for (const [k, v] of Object.entries(editForm)) {
        if (v !== editOriginal[k]) {
          if (k === "layer_priority" || k === "prune_on_exit") {
            changed[k] = Number(v);
          } else {
            changed[k] = v === "" ? null : v;
          }
        }
      }
      if (Object.keys(changed).length === 0) {
        setEditId(null);
        return;
      }
      setSaving(true);
      try {
        await fetchJSON(poclipUrl(`/api/policy/suggestions/${id}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...ACTOR },
          body: JSON.stringify({ payload: changed })
        });
        show(sugg.toastSaved);
        setEditId(null);
        refetch();
        onApplied?.();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setSaving(false);
      }
    }
    function statusBadge(status) {
      const base = {
        fontSize: "0.75em",
        padding: "0.1em 0.45em",
        borderRadius: 4,
        fontWeight: 600
      };
      if (status === "draft") {
        return /* @__PURE__ */ react_shim_default.createElement("span", { style: { ...base, background: "var(--color-warning)", color: "var(--color-background)" } }, sugg.statusDraft);
      }
      if (status === "approved") {
        return /* @__PURE__ */ react_shim_default.createElement("span", { style: { ...base, background: "var(--color-success)", color: "var(--color-background)" } }, sugg.statusApproved);
      }
      return /* @__PURE__ */ react_shim_default.createElement("span", { style: { ...base, background: "var(--color-muted)", color: "var(--color-muted-foreground)" } }, sugg.statusRejected);
    }
    function renderEditForm(item) {
      if (editId !== item.id) return null;
      const set = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));
      return /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...cardStyle, marginTop: "0.5rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "0.6rem", marginBottom: "0.5rem" } }, policyType === "tool_policy" && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.policy_action), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.policy_action ?? "",
          onValueChange: (v) => set("policy_action", v),
          style: { minWidth: 110 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "allow" }, resolveLabelOrCode(t, "toolPolicyAction", "allow")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "deny" }, resolveLabelOrCode(t, "toolPolicyAction", "deny")),
        editForm.policy_action && !["allow", "deny"].includes(editForm.policy_action) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: editForm.policy_action }, resolveLabelOrCode(t, "toolPolicyAction", editForm.policy_action))
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.scope), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.scope ?? "",
          onValueChange: (v) => set("scope", v),
          style: { minWidth: 120 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "agent" }, resolveLabelOrCode(t, "toolPolicyScope", "agent")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "provider" }, resolveLabelOrCode(t, "toolPolicyScope", "provider")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "profile" }, resolveLabelOrCode(t, "toolPolicyScope", "profile")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "group" }, resolveLabelOrCode(t, "toolPolicyScope", "group")),
        editForm.scope && !["agent", "provider", "profile", "group"].includes(editForm.scope) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: editForm.scope }, resolveLabelOrCode(t, "toolPolicyScope", editForm.scope))
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.layer_priority), /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          type: "number",
          value: editForm.layer_priority ?? "",
          onChange: (e) => set("layer_priority", e.target.value),
          style: { width: 80 }
        }
      ))), policyType === "sandbox" && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.sandbox_mode), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.sandbox_mode ?? "",
          onValueChange: (v) => set("sandbox_mode", v),
          style: { minWidth: 140 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "off" }, resolveLabelOrCode(t, "sandboxMode", "off")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "non-main" }, resolveLabelOrCode(t, "sandboxMode", "non-main")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "all" }, resolveLabelOrCode(t, "sandboxMode", "all"))
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.backend), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.backend ?? "",
          onValueChange: (v) => set("backend", v),
          style: { minWidth: 120 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "local" }, resolveLabelOrCode(t, "sandboxBackend", "local")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "docker" }, resolveLabelOrCode(t, "sandboxBackend", "docker")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "ssh" }, resolveLabelOrCode(t, "sandboxBackend", "ssh"))
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.workspace_access), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.workspace_access ?? "",
          onValueChange: (v) => set("workspace_access", v),
          style: { minWidth: 140 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "none" }, resolveLabelOrCode(t, "workspaceAccess", "none")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "ro" }, resolveLabelOrCode(t, "workspaceAccess", "ro")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "rw" }, resolveLabelOrCode(t, "workspaceAccess", "rw"))
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.prune_on_exit), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.prune_on_exit ?? "",
          onValueChange: (v) => set("prune_on_exit", v),
          style: { minWidth: 100 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "0" }, t.common.no),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "1" }, t.common.yes)
      ))), policyType === "a2a_grant" && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.direction), /* @__PURE__ */ react_shim_default.createElement(
        Select,
        {
          value: editForm.direction ?? "",
          onValueChange: (v) => set("direction", v),
          style: { minWidth: 150 }
        },
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "unidirectional" }, resolveLabelOrCode(t, "a2aDirection", "unidirectional")),
        /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "bidirectional" }, resolveLabelOrCode(t, "a2aDirection", "bidirectional"))
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.expires_at), /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          value: editForm.expires_at ?? "",
          onChange: (e) => set("expires_at", e.target.value),
          placeholder: t.a2a.expiresPlaceholder,
          style: { minWidth: 180 }
        }
      ))), policyType === "channel_binding" && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.role), /* @__PURE__ */ react_shim_default.createElement(
        ChoiceField,
        {
          name: "role",
          value: editForm.role ?? "",
          onChange: (v) => set("role", v),
          options: buildChannelRoleOptions(t, []),
          placeholder: t.channelBindings.rolePlaceholder,
          emptyHint: t.choiceField.emptyHintRole
        }
      )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, sugg.field.note), /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          value: editForm.note ?? "",
          onChange: (e) => set("note", e.target.value),
          placeholder: t.channelBindings.notePlaceholder
        }
      )))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => handleSaveEdit(item.id), disabled: saving }, saving ? t.common.saving : sugg.btnSave), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: cancelEdit, disabled: saving }, sugg.btnCancel)));
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-suggest-block": policyType, style: { ...cardStyle, marginBottom: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem"
        }
      },
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("strong", null, sugg.blockTitle), /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)", fontSize: "0.9em" } }, sugg.pendingCount(pending)), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-count": true, style: { display: "none" } }, pending)),
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem" } }, /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-generate": true }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: handleGenerate, disabled: generating }, generating ? t.common.saving : sugg.btnGenerate)), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-approve-all": true }, /* @__PURE__ */ react_shim_default.createElement(
        Button,
        {
          size: "sm",
          outlined: true,
          onClick: handleApproveAll,
          disabled: approvingAll || pending === 0
        },
        sugg.btnApproveAll,
        pending > 0 ? ` (${pending})` : ""
      )))
    ), loading && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-muted-foreground)", fontSize: "0.9em" } }, t.common.loading), error && !loading && /* @__PURE__ */ react_shim_default.createElement("div", { style: noticeStyle("error") }, error), !loading && !error && items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), fontSize: "0.9em" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, sugg.empty), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem", color: "var(--color-muted-foreground)" } }, sugg.emptyHint)), !loading && !error && items.some((i) => i.status !== "draft") && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.6rem" } }, pending === 0 && /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)", fontSize: "0.88em" } }, sugg.noPending), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", ghost: true, onClick: () => setShowDecided((v) => !v), "data-sugg-toggle-decided": true }, showDecided ? sugg.hideDecided : sugg.showDecided(items.filter((i) => i.status !== "draft").length))), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { as: "list", pageSize: 10, items: items.filter((item) => item.status === "draft" || showDecided), render: (item) => /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        key: item.id,
        "data-sugg-row": true,
        "data-sugg-id": item.id,
        "data-sugg-status": item.status,
        style: {
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "0.75rem",
          marginBottom: "0.6rem",
          background: editId === item.id ? "var(--color-muted)" : void 0
        }
      },
      /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "0.4rem"
          }
        },
        /* @__PURE__ */ react_shim_default.createElement("code", { style: { fontFamily: "var(--theme-font-mono)", fontSize: "0.85em" } }, item.target_key),
        statusBadge(item.status)
      ),
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontSize: "0.88em", marginBottom: "0.5rem" }, "data-sugg-rationale": item.rationale_key }, resolveRationale(item.rationale_key, item.rationale_params)),
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 160 } }, /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          style: {
            fontSize: "0.75em",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            marginBottom: "0.2rem"
          }
        },
        sugg.beforeLabel
      ), /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          "data-sugg-before": true,
          style: { background: "var(--color-muted)", borderRadius: 4, padding: "0.4rem" }
        },
        !item.before || Object.keys(item.before).length === 0 ? /* @__PURE__ */ react_shim_default.createElement(
          "span",
          {
            style: {
              color: "var(--color-muted-foreground)",
              fontStyle: "italic",
              fontSize: "0.85em"
            }
          },
          item.status === "approved" ? sugg.beforeNullDone : sugg.beforeNull
        ) : /* @__PURE__ */ react_shim_default.createElement(FieldValueRows, { obj: item.before, hide: TECHNICAL_FIELDS, onlyKeys: Object.keys(item.payload ?? {}), compareWith: item.payload })
      )), /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 160 } }, /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          style: {
            fontSize: "0.75em",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            marginBottom: "0.2rem"
          }
        },
        sugg.afterLabel
      ), /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          "data-sugg-after": true,
          style: { background: "var(--color-muted)", borderRadius: 4, padding: "0.4rem" }
        },
        /* @__PURE__ */ react_shim_default.createElement(FieldValueRows, { obj: item.payload, hide: TECHNICAL_FIELDS, compareWith: item.before ?? {} })
      ))),
      item.status === "draft" && /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-approve": true }, /* @__PURE__ */ react_shim_default.createElement(
        Button,
        {
          size: "sm",
          onClick: () => handleApprove(item.id),
          disabled: item.status !== "draft" || actionId === item.id
        },
        sugg.btnApprove
      )), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-reject": true }, /* @__PURE__ */ react_shim_default.createElement(
        Button,
        {
          size: "sm",
          outlined: true,
          onClick: () => handleReject(item.id),
          disabled: item.status !== "draft" || actionId === item.id
        },
        sugg.btnReject
      )), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-edit": true }, /* @__PURE__ */ react_shim_default.createElement(
        Button,
        {
          size: "sm",
          ghost: true,
          onClick: () => editId === item.id ? cancelEdit() : openEditForm(item),
          disabled: item.status !== "draft"
        },
        sugg.btnEdit
      ))),
      renderEditForm(item)
    ) }), notes.length > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        style: {
          fontSize: "0.8em",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          marginBottom: "0.35rem"
        }
      },
      sugg.notesTitle
    ), notes.map((n, i) => /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        key: i,
        "data-sugg-note": n.code,
        style: { ...noticeStyle("warning"), fontSize: "0.85em", marginBottom: "0.35rem" }
      },
      resolveNote(n.code, n.params)
    ))));
  }

  // src/pages/PolicyConfig/ToolPolicyTab.tsx
  var emptyAddForm = (initialProfile2 = "") => ({
    profile_id: initialProfile2,
    tool_pattern: "",
    policy_action: "allow",
    scope: "agent",
    layer_priority: "100",
    note: ""
  });
  function parsePriority(v) {
    const s = (v ?? "").trim();
    return /^\d+$/.test(s) ? Number(s) : null;
  }
  function ruleLabelOf(t, profileId, toolPattern) {
    return `${scopeLabel(t, profileId)} \xB7 ${toolPattern}`;
  }
  function ToolPolicyTab({ initialProfile: initialProfile2 } = {}) {
    const t = useT();
    const tp = t.toolPolicy;
    const c = t.common;
    const { toast, show } = useToast();
    const [profileFilter, setProfileFilter] = useState(initialProfile2 || "");
    const qs = profileFilter ? `?profile_id=${encodeURIComponent(profileFilter)}` : "";
    const { data, refetch } = usePoclipFetch(`/api/policy/tool-policies${qs}`, [profileFilter]);
    const [pendingNotice, setPendingNotice] = useState(null);
    const orgPersonOptions = useOrgScopeOptions();
    const toolPatternOptions = useToolPatternOptions();
    const [addForm, setAddForm] = useState(emptyAddForm(initialProfile2));
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingProfileId, setEditingProfileId] = useState("");
    const [editForm, setEditForm] = useState({ tool_pattern: "", policy_action: "allow", scope: "agent", layer_priority: "100", note: "", active: "1" });
    const [saving, setSaving] = useState(false);
    const [pv, setPv] = useState({ profile_id: "", tool_name: "" });
    const [pvResult, setPvResult] = useState(null);
    function openEdit(r) {
      setEditingId(r.id);
      setEditingProfileId(r.profile_id);
      setEditForm({
        tool_pattern: r.tool_pattern,
        policy_action: r.policy_action,
        scope: r.scope,
        layer_priority: String(r.layer_priority),
        note: r.note ?? "",
        active: String(r.active)
      });
      setPendingNotice(null);
    }
    function cancelEdit() {
      setEditingId(null);
    }
    async function saveEdit() {
      if (!editingId) return;
      const prio = parsePriority(editForm.layer_priority);
      if (prio === null) {
        show(tp.errPriorityInt, true);
        return;
      }
      const editLabel = ruleLabelOf(t, editingProfileId, editForm.tool_pattern);
      if (!await confirmDialog({ message: tp.confirmSave(editLabel) })) return;
      setSaving(true);
      try {
        const res = await poclipMutate(`/api/policy/tool-policies/${editingId}`, "PUT", {
          tool_pattern: editForm.tool_pattern,
          policy_action: editForm.policy_action,
          scope: editForm.scope,
          layer_priority: prio,
          note: editForm.note || null,
          active: Number(editForm.active),
          changed_by: FALLBACK_ACTOR
        });
        if (res?.status === "pending_approval") {
          setPendingNotice(res.approval_request_id);
          show(tp.pendingT2SaveMsg(res.approval_request_id));
          setEditingId(null);
        } else {
          show(tp.saved(editLabel, res.policy_revision ?? ""));
          setEditingId(null);
          refetch();
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setSaving(false);
      }
    }
    async function createRule() {
      if (!addForm.profile_id || !addForm.tool_pattern) {
        show(tp.errRequired, true);
        return;
      }
      const prio = parsePriority(addForm.layer_priority);
      if (prio === null) {
        show(tp.errPriorityInt, true);
        return;
      }
      setAdding(true);
      try {
        const res = await poclipMutate("/api/policy/tool-policies", "POST", {
          profile_id: addForm.profile_id,
          tool_pattern: addForm.tool_pattern,
          policy_action: addForm.policy_action,
          scope: addForm.scope,
          layer_priority: prio,
          note: addForm.note || null,
          changed_by: FALLBACK_ACTOR
        });
        if (res?.status === "pending_approval") {
          setPendingNotice(res.approval_request_id);
          show(tp.pendingT2(res.approval_request_id));
        } else {
          show(tp.created(ruleLabelOf(t, addForm.profile_id, addForm.tool_pattern)));
          setAddForm(emptyAddForm(initialProfile2));
          refetch();
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setAdding(false);
      }
    }
    async function deleteRule(r) {
      const label = ruleLabelOf(t, r.profile_id, r.tool_pattern);
      if (!await confirmDialog({ message: tp.confirmDelete(label), destructive: true })) return;
      try {
        await poclipMutate(`/api/policy/tool-policies/${r.id}`, "DELETE", { changed_by: FALLBACK_ACTOR });
        show(tp.deleted(label));
        refetch();
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    async function preview() {
      if (!pv.profile_id || !pv.tool_name) {
        show(tp.previewErrRequired, true);
        return;
      }
      try {
        const res = await poclipMutate("/api/policy/tool-policies/preview", "POST", pv);
        setPvResult(res);
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    const filterOptions = [{ value: "", label: c.all }, ...orgPersonOptions];
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "tool_policy", onApplied: refetch }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, tp.title), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, c.refresh)), initialProfile2 && /* @__PURE__ */ react_shim_default.createElement("div", { style: noticeStyle("info") }, tp.viewingProfile(initialProfile2)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "profile-filter",
        label: tp.filterProfileLabel,
        value: profileFilter,
        onChange: setProfileFilter,
        options: filterOptions,
        placeholder: tp.filterPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel,
        style: { minWidth: 360 }
      }
    ), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, c.filterBtn)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-policy" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [tp.colId, tp.colProfileId, tp.colToolPattern, tp.colAction, tp.colScope, tp.colPriority, tp.colRevision, tp.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !data && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 9 }, c.loading)), data && data.items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 9 }, tp.noRules)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: data?.items, colSpan: 9, render: (r) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: r.id, style: editingId === r.id ? { background: "var(--color-muted)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)", fontSize: "0.78em" } }, r.id), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, scopeLabel(t, r.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("code", null, r.tool_pattern)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "toolPolicyAction", code: r.policy_action })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "toolPolicyScope", code: r.scope })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.layer_priority), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.policy_revision), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: r.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => openEdit(r), disabled: saving || editingId !== null && editingId !== r.id }, c.edit), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", destructive: true, onClick: () => deleteRule(r), disabled: saving }, c.delete)))) })))), pendingNotice && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("warning"), padding: "0.75rem 1rem" } }, tp.pendingT2Notice(pendingNotice)), editingId !== null && /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-policy-edit", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, tp.editTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginBottom: "0.5rem", fontSize: "0.85em", color: "var(--color-muted-foreground)" } }, /* @__PURE__ */ react_shim_default.createElement("span", null, tp.colId, ": "), /* @__PURE__ */ react_shim_default.createElement("code", null, editingId), " | ", /* @__PURE__ */ react_shim_default.createElement("span", null, tp.colProfileId, ": "), /* @__PURE__ */ react_shim_default.createElement("code", null, editingProfileId)), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "edit-tool-pattern",
        label: tp.labelToolPattern,
        value: editForm.tool_pattern,
        onChange: (v) => setEditForm({ ...editForm, tool_pattern: v }),
        options: toolPatternOptions,
        placeholder: tp.toolPatternPlaceholder,
        emptyHint: t.choiceField.emptyHintTools
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelPolicyAction), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.policy_action, onValueChange: (v) => setEditForm({ ...editForm, policy_action: v }), style: { minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "allow" }, resolveLabelOrCode(t, "toolPolicyAction", "allow")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "deny" }, resolveLabelOrCode(t, "toolPolicyAction", "deny")), editForm.policy_action && !["allow", "deny"].includes(editForm.policy_action) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: editForm.policy_action }, resolveLabelOrCode(t, "toolPolicyAction", editForm.policy_action)))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelScope), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.scope, onValueChange: (v) => setEditForm({ ...editForm, scope: v }), style: { minWidth: 140 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "agent" }, resolveLabelOrCode(t, "toolPolicyScope", "agent")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "provider" }, resolveLabelOrCode(t, "toolPolicyScope", "provider")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "profile" }, resolveLabelOrCode(t, "toolPolicyScope", "profile")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "group" }, resolveLabelOrCode(t, "toolPolicyScope", "group")), editForm.scope && !["agent", "provider", "profile", "group"].includes(editForm.scope) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: editForm.scope }, resolveLabelOrCode(t, "toolPolicyScope", editForm.scope)))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelLayerPriority), /* @__PURE__ */ react_shim_default.createElement(Input, { type: "number", value: editForm.layer_priority, onChange: (e) => setEditForm({ ...editForm, layer_priority: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelActive), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.active, onValueChange: (v) => setEditForm({ ...editForm, active: v }), style: { minWidth: 100 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "1" }, resolveLabelOrCode(t, "active", "1")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "0" }, resolveLabelOrCode(t, "active", "0")))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: editForm.note, onChange: (e) => setEditForm({ ...editForm, note: e.target.value }), placeholder: tp.notePlaceholder }))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: saveEdit, disabled: saving }, saving ? c.saving : c.save), /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: cancelEdit, disabled: saving }, c.cancel))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-policy-add", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, tp.addTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "add-profile-id",
        label: tp.labelProfileId,
        value: addForm.profile_id,
        onChange: (v) => setAddForm({ ...addForm, profile_id: v }),
        options: orgPersonOptions,
        placeholder: tp.profileIdPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "add-tool-pattern",
        label: tp.labelToolPattern,
        value: addForm.tool_pattern,
        onChange: (v) => setAddForm({ ...addForm, tool_pattern: v }),
        options: toolPatternOptions,
        placeholder: tp.toolPatternPlaceholder,
        emptyHint: t.choiceField.emptyHintTools
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelPolicyAction), /* @__PURE__ */ react_shim_default.createElement(Select, { value: addForm.policy_action, onValueChange: (v) => setAddForm({ ...addForm, policy_action: v }), style: { minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "allow" }, resolveLabelOrCode(t, "toolPolicyAction", "allow")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "deny" }, resolveLabelOrCode(t, "toolPolicyAction", "deny")), addForm.policy_action && !["allow", "deny"].includes(addForm.policy_action) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: addForm.policy_action }, resolveLabelOrCode(t, "toolPolicyAction", addForm.policy_action)))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelScope), /* @__PURE__ */ react_shim_default.createElement(Select, { value: addForm.scope, onValueChange: (v) => setAddForm({ ...addForm, scope: v }), style: { minWidth: 140 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "agent" }, resolveLabelOrCode(t, "toolPolicyScope", "agent")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "provider" }, resolveLabelOrCode(t, "toolPolicyScope", "provider")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "profile" }, resolveLabelOrCode(t, "toolPolicyScope", "profile")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "group" }, resolveLabelOrCode(t, "toolPolicyScope", "group")), addForm.scope && !["agent", "provider", "profile", "group"].includes(addForm.scope) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: addForm.scope }, resolveLabelOrCode(t, "toolPolicyScope", addForm.scope)))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelLayerPriority), /* @__PURE__ */ react_shim_default.createElement(Input, { type: "number", value: addForm.layer_priority, onChange: (e) => setAddForm({ ...addForm, layer_priority: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: addForm.note, onChange: (e) => setAddForm({ ...addForm, note: e.target.value }), placeholder: tp.notePlaceholder }))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: createRule, disabled: adding }, adding ? c.saving : c.add))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-policy-preview", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, tp.previewTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...formGrid, marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "preview-profile-id",
        label: tp.previewLabelProfile,
        value: pv.profile_id,
        onChange: (v) => setPv({ ...pv, profile_id: v }),
        options: orgPersonOptions.filter((o) => !/^(unit|role):/.test(o.value)),
        placeholder: tp.previewProfilePlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "preview-tool-name",
        label: tp.previewLabelTool,
        value: pv.tool_name,
        onChange: (v) => setPv({ ...pv, tool_name: v }),
        options: toolPatternOptions,
        placeholder: tp.previewToolPlaceholder,
        emptyHint: t.choiceField.emptyHintTools
      }
    )), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: preview }, tp.previewBtn), pvResult && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", ...noticeStyle(pvResult.allowed ? "success" : "error") } }, /* @__PURE__ */ react_shim_default.createElement("strong", null, pvResult.allowed ? tp.previewAllowed : tp.previewDenied), " \u2014 ", pvResult.reason, pvResult.matched_rule && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.4rem", fontSize: "0.8em", color: "var(--color-muted-foreground)" } }, tp.previewRulePrefix, " ", /* @__PURE__ */ react_shim_default.createElement("code", null, pvResult.matched_rule.id), " (", pvResult.matched_rule.tool_pattern, ")"))));
  }

  // src/lib/tool-approval.ts
  var COND_OPS = [
    "eq",
    "ne",
    "contains",
    "not_contains",
    "in",
    "not_in",
    "gt",
    "gte",
    "lt",
    "lte",
    "matches",
    "exists",
    "not_exists"
  ];
  var NO_VALUE_OPS = /* @__PURE__ */ new Set(["exists", "not_exists"]);
  var NUMERIC_OPS = /* @__PURE__ */ new Set(["gt", "gte", "lt", "lte"]);
  var MAX_CONDITIONS = 20;
  var TIERS = ["T1", "T2", "T3"];
  var MIN_HOURS = 1;
  var MAX_HOURS = 168;
  var emptyRow = () => ({ field: "", op: "eq", value: "" });
  function valueToText(v) {
    if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
    if (v === null || v === void 0) return "";
    return String(v);
  }
  function rowsFromConditions(c) {
    const items = c?.items ?? [];
    return {
      mode: c?.mode === "any" ? "any" : "all",
      rows: items.map((it) => ({
        field: it.field ?? "",
        op: COND_OPS.includes(it.op) ? it.op : "eq",
        value: valueToText(it.value)
      }))
    };
  }
  function conditionsFromRows(mode, rows) {
    const items = rows.filter((r) => r.field.trim() !== "" || !NO_VALUE_OPS.has(r.op) && r.value.trim() !== "").map((r) => NO_VALUE_OPS.has(r.op) ? { field: r.field.trim(), op: r.op } : { field: r.field.trim(), op: r.op, value: r.value.trim() });
    return { mode, items };
  }
  function validateRows(rows) {
    const used = rows.filter((r) => r.field.trim() !== "" || !NO_VALUE_OPS.has(r.op) && r.value.trim() !== "");
    if (used.length > MAX_CONDITIONS) return "tooMany";
    for (const r of used) {
      if (r.field.trim() === "") return "field";
      if (NO_VALUE_OPS.has(r.op)) continue;
      if (r.value.trim() === "") return "value";
      if (NUMERIC_OPS.has(r.op) && !/^-?\d+(\.\d+)?$/.test(r.value.trim().replace(/[,_\s]/g, ""))) return "number";
    }
    return null;
  }
  function validHours(v) {
    const s = (v ?? "").trim();
    if (!/^\d+$/.test(s)) return null;
    const n = Number(s);
    return n >= MIN_HOURS && n <= MAX_HOURS ? n : null;
  }
  function describeConditions(c, x) {
    const items = c?.items ?? [];
    if (items.length === 0) return x.always;
    const parts = items.map((it) => {
      const label = x.ops[it.op] ?? it.op;
      return NO_VALUE_OPS.has(it.op) ? `${it.field} ${label}` : `${it.field} ${label} ${valueToText(it.value)}`;
    });
    return parts.join(c?.mode === "any" ? x.joinAny : x.joinAll);
  }

  // src/pages/PolicyConfig/ToolApprovalTab.tsx
  var emptyForm = () => ({
    profile_id: "*",
    tool_pattern: "",
    mode: "all",
    rows: [],
    risk_tier: "T1",
    valid_hours: "24",
    note: "",
    active: "1"
  });
  var textareaStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    background: "var(--color-input, transparent)",
    color: "var(--color-foreground)",
    fontFamily: "var(--theme-font-mono, monospace)",
    fontSize: "0.88em",
    resize: "vertical"
  };
  var STATE_TONE = {
    waiting: "warning",
    approved: "success",
    used: "secondary",
    rejected: "destructive",
    expired: "secondary"
  };
  function ToolApprovalTab() {
    const t = useT();
    const ta = t.toolApproval;
    const c = t.common;
    const { toast, show } = useToast();
    const { data: rulesData, refetch: refetchRules } = usePoclipFetch("/api/policy/tool-approval-rules");
    const { data: reqData, refetch: refetchReqs } = usePoclipFetch("/api/policy/tool-approval-requests?limit=200");
    const scopeOptions = useOrgScopeOptions();
    const toolOptions = useToolPatternOptions();
    const profileOptions = [{ value: "*", label: ta.allAgents }, ...scopeOptions];
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [pv, setPv] = useState({ profile_id: "", tool_name: "", args: "" });
    const [pvResult, setPvResult] = useState(null);
    const describeTexts = { always: ta.always, joinAll: ta.joinAll, joinAny: ta.joinAny, ops: ta.ops };
    const tierLabel = (tier) => ta.tiers[tier] ?? tier;
    function startAdd() {
      setEditingId(null);
      setForm(emptyForm());
    }
    function startEdit(r) {
      const { mode, rows } = rowsFromConditions(r.conditions);
      setEditingId(r.id);
      setForm({
        profile_id: r.profile_id,
        tool_pattern: r.tool_pattern,
        mode,
        rows,
        risk_tier: r.risk_tier,
        valid_hours: String(r.valid_hours),
        note: r.note ?? "",
        active: String(r.active)
      });
    }
    function setRow(i, patch) {
      setForm((f) => ({ ...f, rows: f.rows.map((r, k) => k === i ? { ...r, ...patch } : r) }));
    }
    async function save() {
      if (!form.profile_id || !form.tool_pattern.trim()) {
        show(ta.errRequired, true);
        return;
      }
      const rowErr = validateRows(form.rows);
      if (rowErr) {
        show({ field: ta.errField, value: ta.errValue, number: ta.errNumber, tooMany: ta.errTooMany }[rowErr], true);
        return;
      }
      const hours = validHours(form.valid_hours);
      if (hours === null) {
        show(ta.errHours, true);
        return;
      }
      if (editingId && !await confirmDialog({ message: ta.confirmSave })) return;
      const payload = {
        profile_id: form.profile_id,
        tool_pattern: form.tool_pattern.trim(),
        conditions: conditionsFromRows(form.mode, form.rows),
        risk_tier: form.risk_tier,
        valid_hours: hours,
        note: form.note.trim() || null,
        active: Number(form.active),
        changed_by: FALLBACK_ACTOR
      };
      setSaving(true);
      try {
        if (editingId) await poclipMutate(`/api/policy/tool-approval-rules/${editingId}`, "PUT", payload);
        else await poclipMutate("/api/policy/tool-approval-rules", "POST", payload);
        show(editingId ? ta.saved : ta.created);
        setEditingId(null);
        setForm(emptyForm());
        refetchRules();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setSaving(false);
      }
    }
    async function remove(r) {
      if (!await confirmDialog({ message: ta.confirmDelete, destructive: true })) return;
      try {
        await poclipMutate(`/api/policy/tool-approval-rules/${r.id}`, "DELETE", { changed_by: FALLBACK_ACTOR });
        show(ta.deleted);
        if (editingId === r.id) startAdd();
        refetchRules();
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    async function preview() {
      if (!pv.profile_id || !pv.tool_name) {
        show(ta.previewErrRequired, true);
        return;
      }
      let args = {};
      if (pv.args.trim()) {
        try {
          args = JSON.parse(pv.args);
        } catch {
          show(ta.previewBadJson, true);
          return;
        }
        if (args === null || typeof args !== "object" || Array.isArray(args)) {
          show(ta.previewBadJson, true);
          return;
        }
      }
      try {
        setPvResult(await poclipMutate("/api/policy/tool-approval-rules/preview", "POST", {
          profile_id: pv.profile_id,
          tool_name: pv.tool_name,
          args
        }));
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    const rules = rulesData?.items ?? [];
    const requests = reqData?.items ?? [];
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, ta.title), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => {
      refetchRules();
      refetchReqs();
    } }, c.refresh)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), padding: "0.75rem 1rem" }, "data-policy-card": "tool-approval-intro" }, /* @__PURE__ */ react_shim_default.createElement("div", null, ta.intro), /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontWeight: 600, marginTop: "0.5rem" } }, ta.howTitle), /* @__PURE__ */ react_shim_default.createElement("ol", { style: { margin: "0.25rem 0 0", paddingLeft: "1.25rem" } }, ta.howItems.map((s) => /* @__PURE__ */ react_shim_default.createElement("li", { key: s }, s)))), /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: 0 } }, ta.rulesTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-approval-rules" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [ta.colApplies, ta.colTool, ta.colWhen, ta.colApprover, ta.colPermit, ta.colNote, ta.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !rulesData && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, c.loading)), rulesData && rules.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, ta.noRules)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: rules, colSpan: 8, render: (r) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: r.id, style: editingId === r.id ? { background: "var(--color-muted)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.profile_id === "*" ? ta.allAgents : scopeLabel(t, r.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("code", null, r.tool_pattern)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, describeConditions(r.conditions, describeTexts)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, tierLabel(r.risk_tier)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, ta.permitHours(r.valid_hours)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.note || ""), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: r.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => startEdit(r), disabled: saving }, c.edit), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", destructive: true, onClick: () => remove(r), disabled: saving }, c.delete)))) })))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-approval-form", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, editingId ? ta.editTitle : ta.addTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "ta-profile",
        label: ta.labelProfile,
        value: form.profile_id,
        onChange: (v) => setForm({ ...form, profile_id: v }),
        options: profileOptions,
        placeholder: ta.profilePlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "ta-tool",
        label: ta.labelTool,
        value: form.tool_pattern,
        onChange: (v) => setForm({ ...form, tool_pattern: v }),
        options: toolOptions,
        placeholder: ta.toolPlaceholder,
        emptyHint: t.choiceField.emptyHintTools
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelTier), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.risk_tier, onValueChange: (v) => setForm({ ...form, risk_tier: v }), style: { minWidth: 220 } }, TIERS.map((tier) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: tier, value: tier }, tierLabel(tier))))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelHours), /* @__PURE__ */ react_shim_default.createElement(Input, { type: "number", value: form.valid_hours, onChange: (e) => setForm({ ...form, valid_hours: e.target.value }) }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.78em", marginTop: 2 } }, ta.hoursHint)), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: ta.notePlaceholder })), editingId && /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelActive), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.active, onValueChange: (v) => setForm({ ...form, active: v }), style: { minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "1" }, resolveLabelOrCode(t, "active", "1")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "0" }, resolveLabelOrCode(t, "active", "0"))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.9rem" }, "data-policy-card": "tool-approval-conditions" }, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelWhen), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.82em", margin: "0.15rem 0 0.4rem" } }, ta.whenHint), form.rows.length > 1 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement("span", null, ta.labelMode), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.mode, onValueChange: (v) => setForm({ ...form, mode: v === "any" ? "any" : "all" }), style: { minWidth: 220 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "all" }, ta.modeAll), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "any" }, ta.modeAny))), form.rows.map((row, i) => {
      const noValue = NO_VALUE_OPS.has(row.op);
      const listOp = row.op === "in" || row.op === "not_in";
      return /* @__PURE__ */ react_shim_default.createElement("div", { key: i, style: { display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          style: { width: 190 },
          value: row.field,
          placeholder: ta.fieldPlaceholder,
          onChange: (e) => setRow(i, { field: e.target.value })
        }
      ), /* @__PURE__ */ react_shim_default.createElement(Select, { value: row.op, onValueChange: (v) => setRow(i, { op: v }), style: { minWidth: 190 } }, COND_OPS.map((op) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: op, value: op }, ta.ops[op]))), !noValue && /* @__PURE__ */ react_shim_default.createElement(
        Input,
        {
          style: { width: 240 },
          value: row.value,
          placeholder: listOp ? ta.valuesPlaceholder : ta.valuePlaceholder,
          onChange: (e) => setRow(i, { value: e.target.value })
        }
      ), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => setForm({ ...form, rows: form.rows.filter((_, k) => k !== i) }) }, ta.removeCondition));
    }), /* @__PURE__ */ react_shim_default.createElement(
      Button,
      {
        size: "sm",
        outlined: true,
        disabled: form.rows.length >= MAX_CONDITIONS,
        onClick: () => setForm({ ...form, rows: [...form.rows, emptyRow()] })
      },
      ta.addCondition
    )), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", marginTop: "0.9rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: save, disabled: saving }, saving ? c.saving : editingId ? c.save : c.add), editingId && /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: startAdd, disabled: saving }, c.cancel))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-approval-preview", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, ta.previewTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...formGrid, marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "ta-preview-agent",
        label: ta.previewAgent,
        value: pv.profile_id,
        onChange: (v) => setPv({ ...pv, profile_id: v }),
        options: scopeOptions.filter((o) => !/^(unit|role):/.test(o.value)),
        placeholder: ta.previewAgentPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "ta-preview-tool",
        label: ta.previewTool,
        value: pv.tool_name,
        onChange: (v) => setPv({ ...pv, tool_name: v }),
        options: toolOptions,
        placeholder: ta.toolPlaceholder,
        emptyHint: t.choiceField.emptyHintTools
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.previewArgs), /* @__PURE__ */ react_shim_default.createElement(
      "textarea",
      {
        rows: 3,
        style: textareaStyle,
        value: pv.args,
        placeholder: ta.previewArgsPlaceholder,
        onChange: (e) => setPv({ ...pv, args: e.target.value })
      }
    ))), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: preview }, ta.previewBtn), pvResult && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", ...noticeStyle(pvResult.requires_approval ? "warning" : "success") } }, pvResult.requires_approval ? ta.previewNeeds(tierLabel(pvResult.rule?.risk_tier ?? "T1")) : ta.previewNot)), /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: 0 } }, ta.requestsTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.85em", marginTop: -8 } }, ta.requestsHint), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-approval-requests" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [ta.colTime, ta.colAgent, ta.colAction, ta.colContent, ta.colState, ta.colApprover, ta.colDeadline].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !reqData && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, c.loading)), reqData && requests.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, ta.noRequests)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: requests, colSpan: 7, render: (q) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: q.id }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, formatDateTime(q.created_at)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("code", null, q.agent_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("code", null, q.tool_name)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("details", null, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer" } }, ta.showContent), /* @__PURE__ */ react_shim_default.createElement("pre", { style: { margin: "0.3rem 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 420, fontSize: "0.82em" } }, q.args_preview))), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(Badge, { tone: STATE_TONE[q.state] ?? "secondary" }, ta.states[q.state] ?? q.state)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, tierLabel(q.risk_tier)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, q.decided_at ? formatDateTime(q.decided_at) : q.sla_deadline ? formatDateTime(q.sla_deadline) : "", q.decision_reason ? /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.82em" } }, q.decision_reason) : null)) })))));
  }

  // src/pages/PolicyConfig/A2ATab.tsx
  var A2A_OPS = ["kanban_comment", "delegate_task", "send_message"];
  function parseOps(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      if (raw.startsWith("[")) return [raw];
    }
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
  var PAGE_SIZE_OPTIONS2 = [10, 25, 50];
  function A2ATab() {
    const t = useT();
    const a = t.a2a;
    const c = t.common;
    const { toast, show } = useToast();
    const { data, refetch } = usePoclipFetch("/api/policy/a2a-grants");
    const orgPersonOptions = useOrgScopeOptions();
    const [form, setForm] = useState({
      from_profile: "",
      to_profile: "",
      direction: "unidirectional",
      note: "",
      allowed_ops: [...A2A_OPS],
      ops_all: false,
      expires_at: ""
    });
    const [creating, setCreating] = useState(false);
    function toggleOp(op) {
      const current = form.allowed_ops;
      if (current.includes(op)) {
        setForm({ ...form, allowed_ops: current.filter((o) => o !== op), ops_all: false });
      } else {
        setForm({ ...form, allowed_ops: [...current, op], ops_all: false });
      }
    }
    function toggleOpsAll(checked) {
      setForm({ ...form, ops_all: checked, allowed_ops: checked ? [] : [...A2A_OPS] });
    }
    async function createGrant() {
      if (!form.from_profile || !form.to_profile) {
        show(a.errRequired, true);
        return;
      }
      const ops = form.ops_all ? ["*"] : form.allowed_ops;
      const expiresAt = form.expires_at.trim() || null;
      setCreating(true);
      try {
        const res = await poclipMutate("/api/policy/a2a-grants", "POST", {
          from_profile: form.from_profile,
          to_profile: form.to_profile,
          direction: form.direction,
          note: form.note || null,
          allowed_operations: ops,
          expires_at: expiresAt,
          granted_by: FALLBACK_ACTOR
        });
        show(a.created(res.id));
        setForm({ from_profile: "", to_profile: "", direction: "unidirectional", note: "", allowed_ops: [...A2A_OPS], ops_all: false, expires_at: "" });
        refetch();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setCreating(false);
      }
    }
    async function revoke(id) {
      if (!await confirmDialog({ message: a.confirmRevoke(id), destructive: true })) return;
      try {
        const res = await poclipMutate(`/api/policy/a2a-grants/${id}`, "DELETE", { revoked_by: FALLBACK_ACTOR });
        if (res?.status === "pending_approval") show(a.pendingT2(res.approval_request_id));
        else {
          show(a.revoked(id));
          refetch();
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    const [showHistory, setShowHistory] = useState(false);
    const { data: historyData, loading: historyLoading, error: historyError, refetch: refetchHistory } = usePoclipFetch(showHistory ? "/api/v1/eventbus/events?limit=200" : null);
    const [histFilterSource, setHistFilterSource] = useState("");
    const [histFilterTopic, setHistFilterTopic] = useState("");
    const [histFilterStatus, setHistFilterStatus] = useState("");
    const [histPage, setHistPage] = useState(1);
    const [histPageSize, setHistPageSize] = useState(10);
    const filteredHistory = useMemo(() => {
      const rows = Array.isArray(historyData) ? historyData : [];
      return rows.filter((ev) => {
        if (histFilterSource) {
          const q = histFilterSource.toLowerCase();
          if (!(ev.source_agent ?? "").toLowerCase().includes(q) && !(ev.target_agent ?? "").toLowerCase().includes(q)) return false;
        }
        if (histFilterTopic && !(ev.topic ?? "").toLowerCase().includes(histFilterTopic.toLowerCase())) return false;
        if (histFilterStatus && ev.status !== histFilterStatus) return false;
        return true;
      });
    }, [historyData, histFilterSource, histFilterTopic, histFilterStatus]);
    const histTotalPages = Math.max(1, Math.ceil(filteredHistory.length / histPageSize));
    const histPageSafe = Math.min(histPage, histTotalPages);
    const histStart = (histPageSafe - 1) * histPageSize;
    const histEnd = Math.min(histStart + histPageSize, filteredHistory.length);
    const histPageRows = filteredHistory.slice(histStart, histEnd);
    const now = Date.now();
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "a2a_grant", onApplied: refetch }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, a.title), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, c.refresh)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), fontSize: "0.85em" } }, a.noEditNote), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "a2a" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [a.colId, a.colFromProfile, a.colToProfile, a.colDirection, a.colOperations, a.colExpiresAt, a.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !data && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, c.loading)), data && data.items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, a.noGrants)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: data?.items, colSpan: 8, render: (g) => {
      const ops = parseOps(g.allowed_operations);
      const isExpired = g.expires_at ? new Date(g.expires_at).getTime() < now : false;
      return /* @__PURE__ */ react_shim_default.createElement("tr", { key: g.id }, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)", fontSize: "0.78em" } }, g.id), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, scopeLabel(t, g.from_profile)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, scopeLabel(t, g.to_profile)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aDirection", code: g.direction })), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, ops.length === 1 && ops[0] === "*" ? /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-warning-foreground)" } }, a.opsAllLabel) : ops.map((op, i) => /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, { key: op }, i > 0 && ", ", /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aOperation", code: op })))), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, g.expires_at ? /* @__PURE__ */ react_shim_default.createElement("span", null, formatDateTime(g.expires_at), isExpired && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, " ", /* @__PURE__ */ react_shim_default.createElement(Badge, { tone: "destructive" }, a.expired))) : /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, a.noExpiry)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: g.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", destructive: true, onClick: () => revoke(g.id) }, c.revoke)));
    } })))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "a2a-add", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, a.addTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "a2a-from-profile",
        label: a.labelFromProfile,
        value: form.from_profile,
        onChange: (v) => setForm({ ...form, from_profile: v }),
        options: orgPersonOptions,
        placeholder: a.fromPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "a2a-to-profile",
        label: a.labelToProfile,
        value: form.to_profile,
        onChange: (v) => setForm({ ...form, to_profile: v }),
        options: orgPersonOptions,
        placeholder: a.toPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.labelDirection), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.direction, onValueChange: (v) => setForm({ ...form, direction: v }), style: { minWidth: 170 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "unidirectional" }, resolveLabelOrCode(t, "a2aDirection", "unidirectional")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "bidirectional" }, resolveLabelOrCode(t, "a2aDirection", "bidirectional")))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: a.notePlaceholder }))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { margin: "0.5rem 0" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.labelAllowedOps), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.35rem" } }, A2A_OPS.map((op) => /* @__PURE__ */ react_shim_default.createElement("label", { key: op, style: { display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" } }, /* @__PURE__ */ react_shim_default.createElement(
      "input",
      {
        type: "checkbox",
        checked: !form.ops_all && form.allowed_ops.includes(op),
        disabled: form.ops_all,
        onChange: () => toggleOp(op),
        "data-label-group": "a2aOperation",
        "data-label-code": op
      }
    ), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aOperation", code: op }))), /* @__PURE__ */ react_shim_default.createElement("label", { style: { display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" } }, /* @__PURE__ */ react_shim_default.createElement("input", { type: "checkbox", checked: form.ops_all, onChange: (e) => toggleOpsAll(e.target.checked) }), a.opsAllLabel))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.labelExpiresAt), /* @__PURE__ */ react_shim_default.createElement(Input, { value: form.expires_at, onChange: (e) => setForm({ ...form, expires_at: e.target.value }), placeholder: a.expiresPlaceholder })), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: createGrant, disabled: creating }, creating ? c.saving : c.createBtn)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: () => setShowHistory(!showHistory) }, showHistory ? a.historyHideBtn : a.historyShowBtn), showHistory && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontSize: "0.82em", ...mutedTextStyle } }, a.historyNote), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 160 } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.historyFilterSourcePlaceholder), /* @__PURE__ */ react_shim_default.createElement(Input, { value: histFilterSource, onChange: (e) => {
      setHistFilterSource(e.target.value);
      setHistPage(1);
    }, placeholder: a.historyFilterSourcePlaceholder })), /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.historyFilterTopicPlaceholder), /* @__PURE__ */ react_shim_default.createElement(Input, { value: histFilterTopic, onChange: (e) => {
      setHistFilterTopic(e.target.value);
      setHistPage(1);
    }, placeholder: a.historyFilterTopicPlaceholder })), /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.historyFilterStatusPlaceholder), /* @__PURE__ */ react_shim_default.createElement(Input, { value: histFilterStatus, onChange: (e) => {
      setHistFilterStatus(e.target.value);
      setHistPage(1);
    }, placeholder: a.historyFilterStatusPlaceholder })), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: refetchHistory }, a.historyRefreshBtn)), historyLoading && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, c.loading), historyError && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)" } }, historyError), !historyLoading && !historyError && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" } }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [a.historyColCreatedAt, a.historyColTopic, a.historyColSource, a.historyColTarget, a.historyColStatus, a.historyColRisk, a.historyColRetry].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, histPageRows.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, a.historyNoData)), histPageRows.map((ev) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: ev.event_id }, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.78em" } }, ev.created_at ? formatDateTime(ev.created_at) : "\u2014"), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, ev.topic), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, ev.source_agent || "\u2014"), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, ev.target_agent || "\u2014"), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aEventStatus", code: ev.status })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, ev.risk_tier ? /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "riskTier", code: ev.risk_tier }) : "\u2014"), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, ev.retry_count ?? 0, "/", ev.max_retries ?? 0)))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.85em", ...mutedTextStyle } }, c.pageInfo(histStart + 1, histEnd, filteredHistory.length, histPageSafe, histTotalPages)), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: histPageSafe <= 1, onClick: () => setHistPage(1) }, c.pageFirst), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: histPageSafe <= 1, onClick: () => setHistPage((p) => p - 1) }, c.pagePrev), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: histPageSafe >= histTotalPages, onClick: () => setHistPage((p) => p + 1) }, c.pageNext), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: histPageSafe >= histTotalPages, onClick: () => setHistPage(histTotalPages) }, c.pageLast), /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.85em", ...mutedTextStyle } }, c.rowsPerPage), /* @__PURE__ */ react_shim_default.createElement(Select, { value: String(histPageSize), onValueChange: (v) => {
      setHistPageSize(Number(v));
      setHistPage(1);
    }, style: { minWidth: 70 } }, PAGE_SIZE_OPTIONS2.map((n) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: n, value: String(n) }, String(n)))))))));
  }

  // src/pages/PolicyConfig/SandboxTab.tsx
  function SandboxTab() {
    const t = useT();
    const s = t.sandbox;
    const c = t.common;
    const { toast, show } = useToast();
    const orgPersonOptions = useOrgScopeOptions();
    const [viewProfile, setViewProfile] = useState("");
    const [view, setView] = useState(null);
    const [viewErr, setViewErr] = useState(null);
    const [updateProfile, setUpdateProfile] = useState("");
    const [mode, setMode] = useState("");
    const [backend, setBackend] = useState("");
    const [workspace, setWorkspace] = useState("");
    const [updating, setUpdating] = useState(false);
    const backendOptions = [
      { value: "local", label: resolveLabelOrCode(t, "sandboxBackend", "local") },
      { value: "docker", label: resolveLabelOrCode(t, "sandboxBackend", "docker") },
      { value: "ssh", label: resolveLabelOrCode(t, "sandboxBackend", "ssh") },
      { value: "modal", label: resolveLabelOrCode(t, "sandboxBackend", "modal") }
    ];
    async function loadSandbox() {
      if (!viewProfile.trim()) {
        show(s.errRequired, true);
        return;
      }
      setViewErr(null);
      try {
        const data = await fetchDetail(`/api/policy/sandbox/${encodeURIComponent(viewProfile.trim())}`);
        setView(data);
      } catch (e) {
        setView(null);
        setViewErr(parseApiError(e, t));
      }
    }
    async function updateSandbox() {
      if (!updateProfile.trim()) {
        show(s.errRequired, true);
        return;
      }
      const body = {};
      if (mode) body.sandbox_mode = mode;
      if (backend.trim()) body.backend = backend.trim();
      if (workspace) body.workspace_access = workspace;
      if (Object.keys(body).length === 0) {
        show(s.errNothingToChange, true);
        return;
      }
      if (!await confirmDialog({ message: s.confirmSave(updateProfile.trim()) })) return;
      setUpdating(true);
      try {
        const res = await poclipMutate(`/api/policy/sandbox/${encodeURIComponent(updateProfile.trim())}`, "PUT", { ...body, changed_by: FALLBACK_ACTOR });
        if (res?.status === "pending_approval") show(s.pendingT2(res.approval_request_id));
        else {
          show(s.saved(updateProfile));
          setMode("");
          setBackend("");
          setWorkspace("");
          if (viewProfile.trim() && viewProfile.trim() === updateProfile.trim()) await loadSandbox();
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setUpdating(false);
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "sandbox" }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, s.title), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "sandbox-view-profile",
        label: s.filterProfileLabel,
        value: viewProfile,
        onChange: setViewProfile,
        options: orgPersonOptions,
        placeholder: s.profilePlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel,
        style: { minWidth: 360 }
      }
    ), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: loadSandbox }, s.viewBtn)), viewErr && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)" } }, s.notFoundPrefix, " ", viewErr), view && /* @__PURE__ */ react_shim_default.createElement("div", { style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, view.inherited_from && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), marginBottom: "0.75rem", fontSize: "0.85em" } }, s.inheritedNote(scopeLabel(t, view.inherited_from))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.5rem", fontSize: "0.9em" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldId, ": "), view.id), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldProfileId, ": "), view.profile_id), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldSandboxMode, ": "), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "sandboxMode", code: view.sandbox_mode })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldBackend, ": "), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "sandboxBackend", code: view.backend })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldWorkspaceAccess, ": "), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "workspaceAccess", code: view.workspace_access })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldPruneOnExit, ": "), view.prune_on_exit ? c.yes : c.no))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "sandbox-update", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, s.updateTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "sandbox-update-profile",
        label: s.labelProfileId,
        value: updateProfile,
        onChange: setUpdateProfile,
        options: orgPersonOptions,
        placeholder: s.updateProfilePlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, s.labelSandboxMode), /* @__PURE__ */ react_shim_default.createElement(Select, { value: mode, onValueChange: setMode, style: { minWidth: 160 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "" }, c.noChange), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "off" }, resolveLabelOrCode(t, "sandboxMode", "off")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "non-main" }, resolveLabelOrCode(t, "sandboxMode", "non-main")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "all" }, resolveLabelOrCode(t, "sandboxMode", "all")))), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "sandbox-backend",
        label: s.labelBackend,
        value: backend,
        onChange: setBackend,
        options: [{ value: "", label: c.noChange }, ...backendOptions],
        emptyHint: t.choiceField.emptyHintDefault
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, s.labelWorkspaceAccess), /* @__PURE__ */ react_shim_default.createElement(Select, { value: workspace, onValueChange: setWorkspace, style: { minWidth: 160 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "" }, c.noChange), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "none" }, resolveLabelOrCode(t, "workspaceAccess", "none")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "ro" }, resolveLabelOrCode(t, "workspaceAccess", "ro")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "rw" }, resolveLabelOrCode(t, "workspaceAccess", "rw"))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: updateSandbox, disabled: updating }, updating ? c.saving : s.updateBtn))));
  }

  // src/pages/PolicyConfig/ChannelBindingsTab.tsx
  function ChannelBindingsTab() {
    const t = useT();
    const cb = t.channelBindings;
    const c = t.common;
    const { toast, show } = useToast();
    const { data, refetch } = usePoclipFetch("/api/policy/channel-bindings");
    const orgPersonOptions = useOrgPersonOptions(true);
    const channelOptions = useMemo(() => {
      const existingChannels = data?.items.map((b) => b.channel) ?? [];
      return buildChannelOptions(t, existingChannels);
    }, [data, t]);
    const roleOptions = useMemo(() => {
      const existingRoles = data?.items.map((b) => b.role).filter(Boolean) ?? [];
      return buildChannelRoleOptions(t, existingRoles);
    }, [data, t]);
    const [addForm, setAddForm] = useState({ channel: "telegram", profile_id: "", role: "", note: "" });
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ channel: "telegram", profile_id: "", role: "", note: "", peer_id: "", guild_id: "", team_id: "", active: "1" });
    const [saving, setSaving] = useState(false);
    function openEdit(item) {
      setEditingId(item.id);
      setEditForm({
        channel: item.channel,
        profile_id: item.profile_id,
        role: item.role ?? "",
        note: item.note ?? "",
        peer_id: item.peer_id ?? "",
        guild_id: item.guild_id ?? "",
        team_id: item.team_id ?? "",
        active: String(item.active)
      });
    }
    function cancelEdit() {
      setEditingId(null);
    }
    async function saveEdit() {
      if (!editingId) return;
      if (!editForm.profile_id.trim()) {
        show(cb.errRequired, true);
        return;
      }
      if (!await confirmDialog({ message: cb.confirmSave(editingId) })) return;
      setSaving(true);
      try {
        const res = await poclipMutate(`/api/policy/channel-bindings/${editingId}`, "PUT", {
          channel: editForm.channel,
          profile_id: editForm.profile_id,
          role: editForm.role || null,
          note: editForm.note || null,
          peer_id: editForm.peer_id || null,
          guild_id: editForm.guild_id || null,
          team_id: editForm.team_id || null,
          active: Number(editForm.active),
          changed_by: FALLBACK_ACTOR
        });
        show(cb.saved(res.id ?? editingId));
        setEditingId(null);
        refetch();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setSaving(false);
      }
    }
    async function create() {
      if (!addForm.profile_id.trim()) {
        show(cb.errRequired, true);
        return;
      }
      setAdding(true);
      try {
        const res = await poclipMutate("/api/policy/channel-bindings", "POST", {
          ...addForm,
          role: addForm.role || null,
          note: addForm.note || null,
          changed_by: FALLBACK_ACTOR
        });
        show(cb.created(res.id));
        setAddForm({ channel: "telegram", profile_id: "", role: "", note: "" });
        refetch();
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setAdding(false);
      }
    }
    async function remove(id) {
      if (!await confirmDialog({ message: cb.confirmDelete(id), destructive: true })) return;
      try {
        await poclipMutate(`/api/policy/channel-bindings/${id}`, "DELETE", { changed_by: FALLBACK_ACTOR });
        show(cb.deleted(id));
        refetch();
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "channel_binding", onApplied: refetch }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, cb.title), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, c.refresh)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "channel-bindings" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [cb.colId, cb.colChannel, cb.colProfileId, cb.colRole, cb.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !data && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, c.loading)), data && data.items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, cb.noBindings)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: data?.items, colSpan: 6, render: (item) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: item.id, style: editingId === item.id ? { background: "var(--color-muted)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)", fontSize: "0.78em" } }, item.id), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, item.channel), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, item.profile_id), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, item.role ? /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "channelRole", code: item.role }) : "\u2014"), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: item.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => openEdit(item), disabled: saving || editingId !== null && editingId !== item.id }, c.edit), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", destructive: true, onClick: () => remove(item.id), disabled: saving }, c.delete)))) })))), editingId !== null && /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "channel-edit", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, cb.editTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "channel-edit-channel",
        label: cb.labelChannel,
        value: editForm.channel,
        onChange: (v) => setEditForm({ ...editForm, channel: v }),
        options: channelOptions,
        emptyHint: t.choiceField.emptyHintChannel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "channel-edit-profile",
        label: cb.labelProfileId,
        value: editForm.profile_id,
        onChange: (v) => setEditForm({ ...editForm, profile_id: v }),
        options: orgPersonOptions,
        placeholder: cb.profileIdPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelActive), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.active, onValueChange: (v) => setEditForm({ ...editForm, active: v }), style: { minWidth: 110 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "1" }, resolveLabelOrCode(t, "active", "1")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "0" }, resolveLabelOrCode(t, "active", "0"))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "channel-edit-role",
        label: cb.labelRole,
        value: editForm.role,
        onChange: (v) => setEditForm({ ...editForm, role: v }),
        options: [{ value: "", label: "\u2014" }, ...roleOptions],
        placeholder: cb.rolePlaceholder,
        emptyHint: t.choiceField.emptyHintRole
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelNote), /* @__PURE__ */ react_shim_default.createElement(
      "input",
      {
        value: editForm.note,
        onChange: (e) => setEditForm({ ...editForm, note: e.target.value }),
        placeholder: cb.notePlaceholder,
        style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" }
      }
    ))), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelPeerId), /* @__PURE__ */ react_shim_default.createElement("input", { value: editForm.peer_id, onChange: (e) => setEditForm({ ...editForm, peer_id: e.target.value }), placeholder: cb.peerIdPlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelGuildId), /* @__PURE__ */ react_shim_default.createElement("input", { value: editForm.guild_id, onChange: (e) => setEditForm({ ...editForm, guild_id: e.target.value }), placeholder: cb.guildIdPlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelTeamId), /* @__PURE__ */ react_shim_default.createElement("input", { value: editForm.team_id, onChange: (e) => setEditForm({ ...editForm, team_id: e.target.value }), placeholder: cb.teamIdPlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } }))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: saveEdit, disabled: saving }, saving ? c.saving : c.save), /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: cancelEdit, disabled: saving }, c.cancel)))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "channel-add", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, cb.addTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "channel-add-channel",
        label: cb.labelChannel,
        value: addForm.channel,
        onChange: (v) => setAddForm({ ...addForm, channel: v }),
        options: channelOptions,
        emptyHint: t.choiceField.emptyHintChannel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "channel-add-profile",
        label: cb.labelProfileId,
        value: addForm.profile_id,
        onChange: (v) => setAddForm({ ...addForm, profile_id: v }),
        options: orgPersonOptions,
        placeholder: cb.profileIdPlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "channel-add-role",
        label: cb.labelRole,
        value: addForm.role,
        onChange: (v) => setAddForm({ ...addForm, role: v }),
        options: [{ value: "", label: "\u2014" }, ...roleOptions],
        placeholder: cb.rolePlaceholder,
        emptyHint: t.choiceField.emptyHintRole
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelNote), /* @__PURE__ */ react_shim_default.createElement("input", { value: addForm.note, onChange: (e) => setAddForm({ ...addForm, note: e.target.value }), placeholder: cb.notePlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } }))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: create, disabled: adding }, adding ? c.saving : c.add))));
  }

  // src/lib/routing-keywords.ts
  var WORD_CHAR = /[\p{L}\p{N}_]/u;
  var SIMPLE_INNER = /^[\p{L}\p{N}_][\p{L}\p{N}_ -]*$/u;
  function simplifyPattern(pattern) {
    const m = /^\\b([\s\S]+)\\b$/.exec(pattern);
    if (!m) return null;
    const inner = m[1];
    return SIMPLE_INNER.test(inner) && WORD_CHAR.test(inner[inner.length - 1]) ? inner : null;
  }
  function toPattern(text) {
    const t = text.trim().replace(/\s+/g, " ");
    const esc = t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const head = WORD_CHAR.test(t[0] ?? "") ? "\\b" : "";
    const tail = WORD_CHAR.test(t[t.length - 1] ?? "") ? "\\b" : "";
    return head + esc + tail;
  }
  function describeAdvancedPattern(pattern) {
    if (/^\\b[qQ]\[1-4\]\\b$/.test(pattern)) return "Q1\u2013Q4";
    const slashed = /^\\b([\p{L}\p{N}_ -]+(?:\\\/[\p{L}\p{N}_ -]+)+)\\b$/u.exec(pattern);
    if (slashed) return slashed[1].replace(/\\\//g, "/");
    const alt = /^\\b\((?:\?:)?([\p{L}\p{N}_ |-]+)\)\\b$/u.exec(pattern);
    if (alt) {
      const words = alt[1].split("|").map((w) => w.trim()).filter(Boolean);
      if (words.length > 1) return words.join(" / ");
    }
    return null;
  }

  // src/pages/PolicyConfig/RoutingTab.tsx
  var SLUG_RE = /^[a-z][a-z0-9_-]*$/;
  function unwrapUnits(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const items = payload.items;
      if (Array.isArray(items)) return items;
    }
    return [];
  }
  function keywordsOf(unit) {
    return Array.isArray(unit.keywords) ? unit.keywords : [];
  }
  function parseServerErrors(e) {
    const raw = e?.message ?? String(e);
    try {
      const body = JSON.parse(raw);
      const errs = body?.detail?.error?.errors;
      if (Array.isArray(errs)) return errs.map(String);
      const code = body?.detail?.error?.code;
      if (typeof code === "string") return [code];
      const detail = body?.detail;
      if (typeof detail === "string") return [detail];
    } catch {
    }
    return [raw];
  }
  var emptyForm2 = () => ({ slug: "", display_name: "", priority: "0", keywords: "", mode: "simple" });
  var chipStyle = {
    display: "inline-block",
    padding: "0.1rem 0.5rem",
    margin: "0 0.3rem 0.3rem 0",
    border: "1px solid var(--color-border)",
    borderRadius: 999,
    fontSize: "0.82em"
  };
  var textareaStyle2 = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    background: "var(--color-input, transparent)",
    color: "var(--color-foreground)",
    fontFamily: "var(--theme-font-mono, monospace)",
    fontSize: "0.88em",
    resize: "vertical"
  };
  function RoutingTab({ initialProfile: _ignored } = {}) {
    const t = useT();
    const r = t.routing;
    const cbLabel = resolveLabelOrCode(t, "policyType", "channel_binding");
    const { data, loading, refetch } = usePoclipFetch("/api/v1/config/routing-units");
    const units = unwrapUnits(data);
    const slugOptions = useMemo(() => {
      const seen = /* @__PURE__ */ new Set();
      const opts = [];
      for (const u of unwrapUnits(data)) {
        if (!seen.has(u.slug)) {
          seen.add(u.slug);
          opts.push({ value: u.slug, label: `${u.slug} \u2014 ${u.display_name}` });
        }
      }
      return opts;
    }, [data]);
    const [editingSlug, setEditingSlug] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(emptyForm2());
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverErrors, setServerErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const isFormOpen = showAdd || editingSlug !== null;
    const formRef = useRef(null);
    useEffect(() => {
      const el = formRef.current;
      if (!isFormOpen || !el) return;
      el.scrollIntoView?.({ behavior: "smooth", block: "start" });
      el.querySelector("input, textarea")?.focus?.({ preventScroll: true });
    }, [showAdd, editingSlug]);
    function validateForm(isEdit) {
      const errs = {};
      if (!isEdit && !SLUG_RE.test(form.slug.trim())) {
        errs.slug = r.errSlugFormat;
      }
      const priorityNum = parseInt(form.priority.trim(), 10);
      if (isNaN(priorityNum) || priorityNum < 0 || String(priorityNum) !== form.priority.trim()) {
        errs.priority = r.errPriorityInt;
      }
      const lines = form.keywords.split("\n").map((s) => s.trim()).filter(Boolean);
      if (lines.length === 0) {
        errs.keywords = r.errKeywordsEmpty;
      } else if (form.mode === "advanced") {
        for (const line of lines) {
          try {
            new RegExp(line);
          } catch (ex) {
            errs.keywords = r.errRegexInvalid(line, ex.message);
            break;
          }
        }
      }
      setFieldErrors(errs);
      return Object.keys(errs).length === 0;
    }
    function openAdd() {
      setEditingSlug(null);
      setForm(emptyForm2());
      setFieldErrors({});
      setServerErrors([]);
      setShowAdd(true);
    }
    function openEdit(unit) {
      setShowAdd(false);
      setEditingSlug(unit.slug);
      const patterns = keywordsOf(unit);
      const simples = patterns.map(simplifyPattern);
      const allSimple = patterns.length > 0 && simples.every((s) => s !== null);
      setForm({
        slug: unit.slug,
        display_name: unit.display_name,
        priority: String(unit.priority),
        // mẫu đơn giản → hiện chữ thường dễ sửa; có mẫu nâng cao → giữ nguyên regex để KHÔNG mất dữ liệu
        keywords: allSimple ? simples.join("\n") : patterns.join("\n"),
        mode: allSimple ? "simple" : "advanced"
      });
      setFieldErrors({});
      setServerErrors([]);
    }
    function switchMode(next) {
      if (next === form.mode) return;
      const lines = form.keywords.split("\n").map((s) => s.trim()).filter(Boolean);
      if (next === "advanced") {
        setForm({ ...form, mode: "advanced", keywords: lines.map(toPattern).join("\n") });
        setFieldErrors({});
        return;
      }
      const simples = lines.map(simplifyPattern);
      if (simples.some((s) => s === null)) {
        setFieldErrors({ ...fieldErrors, keywords: r.switchBlocked });
        return;
      }
      setForm({ ...form, mode: "simple", keywords: simples.join("\n") });
      setFieldErrors({});
    }
    function cancelForm() {
      setShowAdd(false);
      setEditingSlug(null);
      setFieldErrors({});
      setServerErrors([]);
    }
    async function handleSave() {
      const isEdit = editingSlug !== null;
      if (!validateForm(isEdit)) return;
      const lines = form.keywords.split("\n").map((s) => s.trim()).filter(Boolean);
      const keywords = form.mode === "simple" ? lines.map(toPattern) : lines;
      const body = {
        display_name: form.display_name,
        priority: parseInt(form.priority.trim(), 10),
        keywords
      };
      if (!isEdit) body.slug = form.slug.trim();
      setSaving(true);
      setServerErrors([]);
      try {
        if (isEdit) {
          await poclipMutate(
            `/api/v1/config/routing-units/${encodeURIComponent(editingSlug)}`,
            "PUT",
            body
          );
        } else {
          await poclipMutate("/api/v1/config/routing-units", "POST", body);
        }
        cancelForm();
        refetch();
      } catch (e) {
        setServerErrors(parseServerErrors(e));
      } finally {
        setSaving(false);
      }
    }
    async function handleDelete(slug) {
      if (!await confirmDialog({ message: r.confirmDelete(slug), destructive: true })) return;
      setServerErrors([]);
      try {
        await poclipMutate(
          `/api/v1/config/routing-units/${encodeURIComponent(slug)}`,
          "DELETE"
        );
        refetch();
      } catch (e) {
        setServerErrors(parseServerErrors(e));
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...cardStyle, borderLeft: "3px solid var(--color-primary)" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontWeight: 600, marginBottom: "0.4rem" } }, r.priorityOrderLabel), /* @__PURE__ */ react_shim_default.createElement(
      "code",
      {
        style: { fontSize: "0.9em", letterSpacing: "0.03em" },
        title: codeTooltip(t, "channel_binding"),
        "data-label-group": "policyType",
        "data-label-code": "channel_binding",
        "data-routing-priority": true
      },
      r.priorityOrder(cbLabel)
    ), /* @__PURE__ */ react_shim_default.createElement(
      "p",
      {
        style: { margin: "0.5rem 0 0", fontSize: "0.85em", ...mutedTextStyle },
        title: codeTooltip(t, "channel_binding"),
        "data-label-group": "policyType",
        "data-label-code": "channel_binding",
        "data-routing-explanation": true
      },
      r.priorityExplanation(cbLabel)
    )), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, r.title), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, r.btnRefresh), !isFormOpen && /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: openAdd }, r.btnAddNew))), loading && !data && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, r.loading), serverErrors.length > 0 && !isFormOpen && /* @__PURE__ */ react_shim_default.createElement("div", { style: noticeStyle("error") }, serverErrors.map((err, i) => /* @__PURE__ */ react_shim_default.createElement("div", { key: i }, err))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "routing" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [
      r.colSlug,
      r.colDisplayName,
      r.colPriority,
      r.colKeywordCount,
      r.colKeywords,
      r.colUpdatedAt,
      r.colUpdatedBy,
      r.colActions
    ].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, data && units.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { colSpan: 8, style: tdStyle }, r.noUnits)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: units, colSpan: 8, render: (unit) => /* @__PURE__ */ react_shim_default.createElement(
      "tr",
      {
        key: unit.slug,
        style: editingSlug === unit.slug ? { background: "var(--color-muted)" } : void 0
      },
      /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)", fontSize: "0.82em" } }, unit.slug),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, unit.display_name),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, unit.priority),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, keywordsOf(unit).length),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, keywordsOf(unit).length === 0 && /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.82em", color: "var(--color-muted-foreground)" }, title: r.noKeywordsTip }, r.noKeywords), keywordsOf(unit).map((kw, i) => {
        const plain = simplifyPattern(kw);
        const friendly = plain === null ? describeAdvancedPattern(kw) : null;
        return plain !== null ? /* @__PURE__ */ react_shim_default.createElement("span", { key: i, style: chipStyle }, plain) : friendly !== null ? /* @__PURE__ */ react_shim_default.createElement("span", { key: i, style: chipStyle, title: `${r.advancedBadgeTip} ${kw}` }, friendly) : /* @__PURE__ */ react_shim_default.createElement("span", { key: i, style: { display: "block", marginBottom: 2 }, title: r.advancedBadgeTip }, /* @__PURE__ */ react_shim_default.createElement("code", { style: { fontSize: "0.78em", wordBreak: "break-all" } }, kw), " ", /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.7em", color: "var(--color-muted-foreground)" } }, "(", r.advancedBadge, ")"));
      })),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.78em" } }, formatDateTime(unit.updated_at)),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, unit.updated_by),
      /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(
        Button,
        {
          size: "sm",
          onClick: () => openEdit(unit),
          disabled: isFormOpen && editingSlug !== unit.slug
        },
        r.btnEdit
      ), /* @__PURE__ */ react_shim_default.createElement(
        Button,
        {
          size: "sm",
          destructive: true,
          onClick: () => handleDelete(unit.slug),
          disabled: saving
        },
        r.btnDelete
      )))
    ) })))), isFormOpen && /* @__PURE__ */ react_shim_default.createElement("div", { style: cardStyle, "data-policy-card": "routing-form", ref: formRef }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, editingSlug ? r.editTitle : r.addTitle), serverErrors.length > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("error"), marginBottom: "1rem" } }, serverErrors.map((err, i) => /* @__PURE__ */ react_shim_default.createElement("div", { key: i }, err))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, r.labelSlug), editingSlug ? /* @__PURE__ */ react_shim_default.createElement("div", { style: {
      fontFamily: "var(--theme-font-mono)",
      padding: "0.45rem 0.6rem",
      color: "var(--color-muted-foreground)",
      fontSize: "0.9em"
    } }, editingSlug) : /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "slug",
        value: form.slug,
        onChange: (v) => setForm({ ...form, slug: v }),
        options: slugOptions,
        placeholder: r.slugHint,
        emptyHint: t.choiceField.emptyHintSlug
      }
    ), fieldErrors.slug && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.slug))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, r.labelDisplayName), /* @__PURE__ */ react_shim_default.createElement(
      Input,
      {
        value: form.display_name,
        onChange: (e) => setForm({ ...form, display_name: e.target.value }),
        placeholder: r.displayNamePlaceholder
      }
    )), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, r.labelPriority), /* @__PURE__ */ react_shim_default.createElement(
      Input,
      {
        type: "number",
        min: 0,
        value: form.priority,
        onChange: (e) => setForm({ ...form, priority: e.target.value })
      }
    ), fieldErrors.priority && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.priority)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, r.labelKeywords), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem", margin: "0.25rem 0 0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: form.mode !== "simple", onClick: () => switchMode("simple") }, r.modeSimple), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: form.mode !== "advanced", onClick: () => switchMode("advanced") }, r.modeAdvanced)), /* @__PURE__ */ react_shim_default.createElement(
      "textarea",
      {
        value: form.keywords,
        onChange: (e) => setForm({ ...form, keywords: e.target.value }),
        placeholder: form.mode === "simple" ? r.keywordsPlaceholder : r.keywordsPlaceholderAdvanced,
        rows: 5,
        style: textareaStyle2
      }
    ), fieldErrors.keywords && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.keywords), /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontSize: "0.82em", color: "var(--color-muted-foreground)", marginTop: "0.35rem" } }, form.mode === "simple" ? r.keywordsFormatHint : r.keywordsAdvancedHint)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: handleSave, disabled: saving }, saving ? "\u2026" : editingSlug ? r.btnSave : r.btnAdd), /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: cancelForm, disabled: saving }, r.btnCancel)))));
  }

  // src/pages/PolicyConfig/OperationsTab.tsx
  function isValidCron(value) {
    const parts = value.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    return parts.every((p) => p.length > 0 && /^[\d,\-*/]+$/.test(p));
  }
  function parseServerErrors2(e) {
    const raw = e?.message ?? String(e);
    try {
      const body = JSON.parse(raw);
      const errs = body?.detail?.error?.errors;
      if (Array.isArray(errs)) return errs.map(String);
      const code = body?.detail?.error?.code;
      if (typeof code === "string") return [code];
      const detail = body?.detail;
      if (typeof detail === "string") return [detail];
    } catch {
    }
    return [raw];
  }
  function OperationsTab({ initialProfile: _ignored } = {}) {
    const t = useT();
    const ops = t.operations;
    const c = t.common;
    const { data: settings, loading: settingsLoading, refetch: settingsRefetch } = usePoclipFetch("/api/v1/config/settings");
    const { data: schedule, loading: schedLoading, refetch: schedRefetch } = usePoclipFetch("/api/v1/config/digest-schedule");
    const [dailyCron, setDailyCron] = useState("");
    const [weeklyCron, setWeeklyCron] = useState("");
    const [timezone, setTimezone] = useState("");
    const [reminderHours, setReminderHours] = useState("");
    const [escalateHours, setEscalateHours] = useState("");
    const [formInitialized, setFormInitialized] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverErrors, setServerErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const [reloading, setReloading] = useState(false);
    const [reloadResult, setReloadResult] = useState(null);
    const [reloadError, setReloadError] = useState(null);
    useEffect(() => {
      if (settings && !formInitialized) {
        setDailyCron(settings.digest_schedule?.daily?.cron ?? "");
        setWeeklyCron(settings.digest_schedule?.weekly?.cron ?? "");
        setTimezone(settings.digest_schedule?.daily?.timezone ?? TIMEZONE_OPTIONS[0]);
        setReminderHours(String(settings.escalation_thresholds?.review?.reminder_hours ?? 24));
        setEscalateHours(String(settings.escalation_thresholds?.review?.escalate_hours ?? 72));
        setFormInitialized(true);
      }
    }, [settings, formInitialized]);
    function validate() {
      const errs = {};
      if (!isValidCron(dailyCron)) errs.dailyCron = ops.errCronInvalid;
      if (!isValidCron(weeklyCron)) errs.weeklyCron = ops.errCronInvalid;
      if (!timezone.trim()) errs.timezone = ops.errTimezoneEmpty;
      const rem = Number(reminderHours);
      if (!reminderHours.trim() || isNaN(rem) || rem <= 0) errs.reminderHours = ops.errHoursPositive;
      const esc = Number(escalateHours);
      if (!escalateHours.trim() || isNaN(esc) || esc <= 0) errs.escalateHours = ops.errHoursPositive;
      setFieldErrors(errs);
      return Object.keys(errs).length === 0;
    }
    async function handleSave() {
      if (!validate()) return;
      setSaving(true);
      setServerErrors([]);
      setSavedAt(null);
      try {
        await poclipMutate("/api/v1/config/settings", "PUT", {
          digest_schedule: {
            daily: { cron: dailyCron.trim(), timezone: timezone.trim() },
            weekly: { cron: weeklyCron.trim(), timezone: timezone.trim() }
          },
          escalation_thresholds: {
            review: {
              reminder_hours: parseInt(reminderHours, 10),
              escalate_hours: parseInt(escalateHours, 10)
            }
          }
        });
        setSavedAt(formatDateTime(/* @__PURE__ */ new Date()));
        schedRefetch();
      } catch (e) {
        setServerErrors(parseServerErrors2(e));
      } finally {
        setSaving(false);
      }
    }
    async function handleReload() {
      setReloading(true);
      setReloadResult(null);
      setReloadError(null);
      try {
        const res = await poclipMutate("/api/v1/config/reload", "POST");
        setReloadResult(res);
      } catch (e) {
        setReloadError(parseServerErrors2(e).join("; "));
      } finally {
        setReloading(false);
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1.5rem" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, ops.title), /* @__PURE__ */ react_shim_default.createElement("div", { style: cardStyle, "data-policy-card": "operations-digest" }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, ops.sectionDigestCadence), settingsLoading && !settings && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, c.loading), serverErrors.length > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("error"), marginBottom: "1rem" } }, serverErrors.map((err, i) => /* @__PURE__ */ react_shim_default.createElement("div", { key: i }, err))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ops.labelDailyCron), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement(
      Input,
      {
        value: dailyCron,
        onChange: (e) => setDailyCron(e.target.value),
        placeholder: ops.presetDaily,
        style: { flex: 1, minWidth: 140 }
      }
    ), /* @__PURE__ */ react_shim_default.createElement("button", { type: "button", className: "pc-btn pc-btn--secondary pc-btn--sm", onClick: () => setDailyCron(ops.presetDaily) }, ops.presetDailyLabel)), fieldErrors.dailyCron && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.dailyCron)), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ops.labelWeeklyCron), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement(
      Input,
      {
        value: weeklyCron,
        onChange: (e) => setWeeklyCron(e.target.value),
        placeholder: ops.presetWeekly,
        style: { flex: 1, minWidth: 140 }
      }
    ), /* @__PURE__ */ react_shim_default.createElement("button", { type: "button", className: "pc-btn pc-btn--secondary pc-btn--sm", onClick: () => setWeeklyCron(ops.presetWeekly) }, ops.presetWeeklyLabel)), fieldErrors.weeklyCron && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.weeklyCron)), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ops.labelTimezone), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "timezone",
        value: timezone,
        onChange: setTimezone,
        options: TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz })),
        placeholder: ops.timezonePlaceholder,
        emptyHint: t.choiceField.emptyHintTimezone
      }
    ), fieldErrors.timezone && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.timezone)))), /* @__PURE__ */ react_shim_default.createElement("div", { style: cardStyle, "data-policy-card": "operations-escalation" }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, ops.sectionEscalation), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ops.labelReminderHours), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "reminderHours",
        value: reminderHours,
        onChange: setReminderHours,
        options: ESCALATION_HOURS.map((h) => ({ value: String(h), label: ops.hoursLabel(h) })),
        emptyHint: t.choiceField.emptyHintHours
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.78em", marginTop: 2 } }, ops.reminderHoursHint), fieldErrors.reminderHours && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.reminderHours)), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ops.labelEscalateHours), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "escalateHours",
        value: escalateHours,
        onChange: setEscalateHours,
        options: ESCALATION_HOURS.map((h) => ({ value: String(h), label: ops.hoursLabel(h) })),
        emptyHint: t.choiceField.emptyHintHours
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.78em", marginTop: 2 } }, ops.escalateHoursHint), fieldErrors.escalateHours && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", fontSize: "0.8em", marginTop: 2 } }, fieldErrors.escalateHours)))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: handleSave, disabled: saving || settingsLoading && !settings }, saving ? ops.saving : ops.btnSave), savedAt && /* @__PURE__ */ react_shim_default.createElement("span", { style: { ...mutedTextStyle, fontSize: "0.85em" } }, ops.savedAt(savedAt))), /* @__PURE__ */ react_shim_default.createElement("div", { style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: 0 } }, ops.sectionCurrentSchedule), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => schedRefetch() }, ops.btnRefresh)), schedLoading && !schedule && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, c.loading), schedule && /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "operations-schedule" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [ops.colType, ops.colCron, ops.colTimezone, ops.colNextRun, ops.colSource].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, [
      { typeLabel: ops.daily, entry: schedule.daily },
      { typeLabel: ops.weekly, entry: schedule.weekly }
    ].map(({ typeLabel, entry }) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: typeLabel }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, typeLabel), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)" } }, entry?.cron ?? ops.notAvailable), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, entry?.timezone ?? ops.notAvailable), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, entry?.next_run_at ? formatDateTime(entry.next_run_at) : ops.notAvailable), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, ...mutedTextStyle, fontSize: "0.82em" } }, schedule.source ?? ops.notAvailable))))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, ops.sectionReload), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: handleReload, disabled: reloading }, reloading ? ops.reloading : ops.btnReload), reloadResult && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("success"), marginTop: "0.75rem" } }, reloadResult.ok ? ops.reloadOk(reloadResult.epoch, formatDateTime(reloadResult.reloaded_at)) : ops.reloadFailed), reloadError && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("error"), marginTop: "0.75rem" } }, reloadError)));
  }

  // src/pages/PolicyConfig/index.tsx
  var PAGE_SIZE_OPTIONS3 = [10, 25, 50];
  var SUB_TABS = [
    { id: "tool-policy", labelKey: "toolPolicy", Component: ToolPolicyTab },
    { id: "tool-approval", labelKey: "toolApproval", Component: ToolApprovalTab },
    { id: "a2a-grants", labelKey: "a2aGrants", Component: A2ATab },
    { id: "sandbox", labelKey: "sandbox", Component: SandboxTab },
    { id: "channel-bindings", labelKey: "channelBindings", Component: ChannelBindingsTab },
    { id: "routing", labelKey: "routing", Component: RoutingTab },
    { id: "operations", labelKey: "operations", Component: OperationsTab }
  ];
  function PolicyConfig({ initialProfile: initialProfile2, initialTab: initialTab2 }) {
    const t = useT();
    const names2 = usePoclipFetch("/api/v1/org/names");
    useEffect(() => {
      if (names2.data) setServerNames(names2.data);
    }, [names2.data]);
    useServerNamesVersion();
    const validInitialTab = initialTab2 && SUB_TABS.some((tab) => tab.id === initialTab2) ? initialTab2 : SUB_TABS[0].id;
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1.5rem" } }, /* @__PURE__ */ react_shim_default.createElement(Tabs, { defaultValue: validInitialTab }, (active, setActive) => {
      const ActiveComponent = SUB_TABS.find((tab) => tab.id === active)?.Component ?? SUB_TABS[0].Component;
      return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement(TabsList, null, SUB_TABS.map((tab) => /* @__PURE__ */ react_shim_default.createElement(
        TabsTrigger,
        {
          key: tab.id,
          value: tab.id,
          active: active === tab.id,
          onClick: () => setActive(tab.id),
          "data-policy-subtab": tab.id
        },
        t.tabs[tab.labelKey]
      ))), /* @__PURE__ */ react_shim_default.createElement(ActiveComponent, { initialProfile: active === "tool-policy" ? initialProfile2 : void 0 }));
    }), /* @__PURE__ */ react_shim_default.createElement(AuditLogSection, null));
  }
  function prettyJson(raw) {
    if (!raw) return "\u2014";
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  function AuditLogSection() {
    const t = useT();
    const al = t.auditLog;
    const c = t.common;
    const [policyType, setPolicyType] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const qs = policyType ? `?policy_type=${encodeURIComponent(policyType)}&limit=100` : "?limit=100";
    const { data, loading, error, refetch } = usePoclipFetch(
      loaded ? `/api/policy/audit-log${qs}` : null,
      [policyType, loaded]
    );
    const handleTypeChange = (v) => {
      setPolicyType(v);
      setPage(1);
      if (loaded) refetch();
    };
    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const loadedCount = items.length;
    const totalPages = Math.max(1, Math.ceil(loadedCount / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const startIdx = (pageSafe - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, loadedCount);
    const pageRows = items.slice(startIdx, endIdx);
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { borderTop: "2px solid var(--color-border)", paddingTop: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { marginTop: 0 } }, al.title), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, al.filterLabel), /* @__PURE__ */ react_shim_default.createElement(Select, { value: policyType, onValueChange: handleTypeChange, style: { minWidth: 200 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "" }, c.all), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "tool_policy" }, resolveLabelOrCode(t, "policyType", "tool_policy")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "a2a_grant" }, resolveLabelOrCode(t, "policyType", "a2a_grant")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "sandbox" }, resolveLabelOrCode(t, "policyType", "sandbox")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "channel_binding" }, resolveLabelOrCode(t, "policyType", "channel_binding")))), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => {
      setLoaded(true);
      setPage(1);
      refetch();
    } }, al.loadBtn)), loaded && loading && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, c.loading), loaded && error && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", marginBottom: "0.5rem" } }, error), loaded && data && total > loadedCount && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), fontSize: "0.82em", marginBottom: "0.5rem" } }, al.backendLimitNote(loadedCount)), /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [al.colTime, al.colType, al.colPolicyId, al.colAction, al.colChangedBy, al.colRevision, al.colNeedsApproval, al.detailsBtn].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !loaded && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, al.notLoaded)), loaded && !data && !loading && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, c.loading)), loaded && data && loadedCount === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, al.noEntries)), pageRows.map((e, i) => {
      const rowKey = e.id ?? String(startIdx + i);
      const expanded = expandedId === rowKey;
      return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, { key: rowKey }, /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.78em" } }, formatDateTime(e.created_at)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "policyType", code: e.policy_type })), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)", fontSize: "0.78em" } }, e.policy_id), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "auditAction", code: e.action, strong: true })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, e.changed_by), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, e.policy_revision), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, e.requires_approval ? /* @__PURE__ */ react_shim_default.createElement(Badge, { tone: "destructive" }, al.t2Badge) : ""), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => setExpandedId(expanded ? null : rowKey) }, expanded ? "\u25B2" : "\u25BC"))), expanded && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { colSpan: 8, style: { ...tdStyle, background: "var(--color-muted)", padding: "0.75rem 1rem" } }, /* @__PURE__ */ react_shim_default.createElement("strong", null, al.detailsTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" } }, [
        { label: al.beforeLabel, json: e.before_json },
        { label: al.afterLabel, json: e.after_json }
      ].map(({ label, json }) => {
        let parsed = null;
        if (json) {
          try {
            const p = JSON.parse(json);
            if (p && typeof p === "object" && !Array.isArray(p)) parsed = p;
          } catch {
          }
        }
        return /* @__PURE__ */ react_shim_default.createElement("div", { key: label }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontWeight: 600, marginBottom: "0.25rem" } }, label), parsed !== null ? /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontSize: "0.8em", fontWeight: 600, color: "var(--color-muted-foreground)", marginBottom: "0.2rem" } }, al.friendlyFieldsLabel), /* @__PURE__ */ react_shim_default.createElement(FieldValueRows, { obj: parsed }), /* @__PURE__ */ react_shim_default.createElement("details", { style: { marginTop: "0.35rem" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { fontSize: "0.8em", cursor: "pointer", color: "var(--color-muted-foreground)" } }, al.rawJsonLabel), /* @__PURE__ */ react_shim_default.createElement("pre", { style: { margin: 0, fontSize: "0.78em", whiteSpace: "pre-wrap", wordBreak: "break-all" } }, prettyJson(json)))) : /* @__PURE__ */ react_shim_default.createElement("pre", { style: { margin: 0, fontSize: "0.78em", whiteSpace: "pre-wrap", wordBreak: "break-all" } }, prettyJson(json)));
      })), e.requires_approval === 1 && e.approval_request_id && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.5rem", fontSize: "0.82em" } }, al.approvalIdLabel, " ", /* @__PURE__ */ react_shim_default.createElement("code", null, e.approval_request_id)))));
    }))), loaded && data && loadedCount > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.85em", ...mutedTextStyle } }, c.pageInfo(startIdx + 1, endIdx, loadedCount, pageSafe, totalPages)), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe <= 1, onClick: () => setPage(1) }, c.pageFirst), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe <= 1, onClick: () => setPage((p) => p - 1) }, c.pagePrev), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe >= totalPages, onClick: () => setPage((p) => p + 1) }, c.pageNext), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe >= totalPages, onClick: () => setPage(totalPages) }, c.pageLast), /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.85em", ...mutedTextStyle } }, c.rowsPerPage), /* @__PURE__ */ react_shim_default.createElement(Select, { value: String(pageSize), onValueChange: (v) => {
      setPageSize(Number(v));
      setPage(1);
    }, style: { minWidth: 70 } }, PAGE_SIZE_OPTIONS3.map((n) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: n, value: String(n) }, String(n))))));
  }

  // src/components/ConfirmHost.tsx
  function ConfirmHost() {
    const t = useT();
    const [pending, setPending] = useState(() => getPendingConfirm());
    const boxRef = useRef(null);
    const [text, setText] = useState("");
    useEffect(() => subscribeConfirm(() => setPending(getPendingConfirm())), []);
    const pendingId = pending?.id;
    useEffect(() => {
      if (pendingId === void 0) return;
      const previous = document.activeElement;
      const box = boxRef.current;
      setText(getPendingConfirm()?.input?.defaultValue ?? "");
      const buttons = box ? Array.from(box.querySelectorAll("button, input, textarea")) : [];
      const inputEl = box?.querySelector("[data-poclip-confirm-input]") ?? null;
      const cancelBtn = box?.querySelector("[data-poclip-confirm-cancel]") ?? buttons[0];
      const okBtn = box?.querySelector("[data-poclip-confirm-ok]") ?? buttons[buttons.length - 1];
      (inputEl ?? (getPendingConfirm()?.destructive ? cancelBtn : okBtn))?.focus();
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          resolveConfirm(pendingId, false);
        } else if (e.key === "Tab" && buttons.length > 0) {
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          const active = document.activeElement;
          if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
          } else if (!box?.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", onKey, true);
      return () => {
        document.removeEventListener("keydown", onKey, true);
        previous?.focus?.();
      };
    }, [pendingId]);
    if (!pending) return null;
    const titleId = `poclip-confirm-title-${pending.id}`;
    const msgId = `poclip-confirm-msg-${pending.id}`;
    return /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        "data-poclip-confirm-backdrop": "",
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.55)",
          zIndex: 2e4,
          // PHẢI cao hơn mọi hộp thoại khác (vd 9999), nếu không hộp xác nhận hiện ra SAU hộp thoại và người dùng thấy như "bấm không phản ứng"
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }
      },
      /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          ref: boxRef,
          "data-poclip-confirm": "",
          role: "alertdialog",
          "aria-modal": "true",
          "aria-labelledby": titleId,
          "aria-describedby": msgId,
          style: {
            ...cardStyle,
            maxWidth: 440,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            boxShadow: "0 12px 40px rgba(0,0,0,.5)"
          }
        },
        /* @__PURE__ */ react_shim_default.createElement("strong", { id: titleId, style: { fontSize: "1.05em" } }, pending.title ?? t.common.confirmDialogTitle),
        /* @__PURE__ */ react_shim_default.createElement("div", { id: msgId, style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "0.92em", lineHeight: 1.5 } }, pending.message),
        pending.input && (pending.input.multiline ? /* @__PURE__ */ react_shim_default.createElement(
          "textarea",
          {
            "data-poclip-confirm-input": "",
            value: text,
            placeholder: pending.input.placeholder,
            onChange: (e) => setText(e.target.value),
            rows: 4,
            style: { width: "100%", boxSizing: "border-box", font: "inherit", padding: "0.4rem 0.6rem" }
          }
        ) : /* @__PURE__ */ react_shim_default.createElement(
          "input",
          {
            "data-poclip-confirm-input": "",
            value: text,
            placeholder: pending.input.placeholder,
            onChange: (e) => setText(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                resolveConfirm(pending.id, true, text);
              }
            },
            style: { width: "100%", boxSizing: "border-box", font: "inherit", padding: "0.4rem 0.6rem" }
          }
        )),
        /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap" } }, !pending.hideCancel && /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, "data-poclip-confirm-cancel": "", onClick: () => resolveConfirm(pending.id, false) }, pending.cancelLabel ?? t.common.cancel), /* @__PURE__ */ react_shim_default.createElement(
          Button,
          {
            "data-poclip-confirm-ok": "",
            style: pending.destructive ? { background: "var(--color-destructive)", color: "#fff" } : void 0,
            onClick: () => resolveConfirm(pending.id, true, text)
          },
          pending.confirmLabel ?? t.common.confirmDialogOk
        ))
      )
    );
  }

  // src/index.tsx
  var _rawProfile = new URLSearchParams(window.location.search).get("profile");
  var initialProfile = _rawProfile && _rawProfile !== "default" ? _rawProfile : void 0;
  var VALID_POLICY_TABS = /* @__PURE__ */ new Set(["tool-policy", "a2a-grants", "sandbox", "channel-bindings", "routing", "operations"]);
  var _rawTab = new URLSearchParams(window.location.search).get("tab");
  var initialTab = _rawTab && VALID_POLICY_TABS.has(_rawTab) ? _rawTab : void 0;
  function HermesPoclipPolicyApp() {
    return /* @__PURE__ */ react_shim_default.createElement("div", { "data-poclip-fields": "", style: { padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement("style", null, FIELD_CSS + BUTTON_CSS + HEADING_CSS + `select option { background: var(--color-card, #0b1f1f); color: var(--color-foreground, #ffe6cb); }`), /* @__PURE__ */ react_shim_default.createElement(PolicyConfig, { initialProfile, initialTab }), /* @__PURE__ */ react_shim_default.createElement(ConfirmHost, null));
  }
  window.__HERMES_PLUGINS__.register("hermes-poclip-policy", HermesPoclipPolicyApp);
})();
