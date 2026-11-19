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
      permissions: "Tool permissions",
      a2aGrants: "Contact between employees",
      sandbox: "Safety isolation level",
      toolPolicy: "Allowed / forbidden",
      toolApproval: "Needs approval first",
      channelBindings: "External messaging channels"
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
      disable: "Disable",
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
      filterStatus: "Status",
      statusActive: "In force",
      statusInactive: "Switched off",
      statusAll: "All",
      filterAction: "Action",
      filterSearch: "Search",
      searchPlaceholder: "Type an employee name or a tool",
      countLine: (shown, total) => `Showing ${shown} of ${total} rules`,
      previewResultFor: (who, tool) => `${who} \u2014 ${tool}`,
      previewRuleNote: "Rule that decided this:",
      noRules: "No rules.",
      addTitle: "Add New Rule",
      editTitle: "Edit Rule",
      labelProfileId: "profile_id *",
      labelToolPattern: "tool_pattern *",
      labelPolicyAction: "policy_action *",
      labelScope: "scope",
      labelLayerPriority: "layer_priority",
      scopeAdvanced: "Advanced: applies by",
      priorityHint: "A deny rule always beats an allow rule, whatever the number. The number only sets which rule is checked first within the same layer.",
      scopeHint: 'Most rules apply per employee. "By provider" only works when the employee uses that model provider.',
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
      filterStatus: "Status",
      statusActive: "In force",
      statusInactive: "Switched off",
      statusAll: "All",
      filterSearch: "Search",
      searchPlaceholder: "Type an employee name to see the authorizations that involve them",
      viewTable: "Table",
      viewByPerson: "By sender",
      countLine: (shown, total) => `Showing ${shown} of ${total} authorizations`,
      byPersonLine: (n) => `may reach ${n} colleague(s)`,
      revokeLabel: (from, to) => `${from} \u2192 ${to}`,
      expiresHint: "Leave empty if the authorization never expires.",
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
      overviewTitle: "Everyone who has a sandbox setting",
      overviewSummary: (n, groups) => `${n} settings, in ${groups} different levels.`,
      colPerson: "Employee",
      colPrune: "Clean up when done",
      editRow: "Edit this level",
      localNote: 'Note: "Local machine" means the employee runs right on this server and is not separated in Docker or on another machine. The current isolation is mostly a soft barrier \u2014 keep that in mind when judging safety.',
      noOverview: "No sandbox settings yet.",
      lookupTitle: "Look up an employee that has no setting of their own",
      notFoundPrefix: "Not found:",
      errRequired: "Enter a profile_id",
      errNothingToChange: "Choose at least one setting to change.",
      confirmSave: (id) => `Change the sandbox settings of ${id}? The change takes effect (or goes to approval) immediately.`,
      saved: (pid) => `Sandbox updated for ${pid}`,
      pendingT2: (aprId) => `Major change \u2014 pending T2 approval: ${aprId}`
    },
    // ── ChannelBindingsTab ─────────────────────────────────────────────────────
    // «Running connections» section of the «External messaging channels» tab (pages/PolicyConfig/ChannelConnections.tsx)
    channelConnections: {
      title: "Running connections",
      intro: "The outside messaging channels each AI employee has really connected, read directly from the employee's settings and the messaging gateway's status. View only: it does not connect or disconnect anything.",
      gatewayLabel: "Messaging gateway:",
      gatewayStates: { running: "running", stopped: "stopped", degraded: "running, some channels paused", startup_failed: "failed to start", starting: "starting" },
      gatewayUnknown: "unknown (no status file)",
      gatewayUpdated: (at) => `updated at ${at}`,
      summary: (ok, total) => `${ok}/${total} connections working`,
      colEmployee: "Employee",
      colChannel: "Channel",
      colState: "Status",
      colToken: "Connection token",
      colAllowed: "Allowed people",
      platforms: { telegram: "Telegram", discord: "Discord", slack: "Slack", whatsapp: "WhatsApp", email: "Email", web: "Web", line: "LINE", signal: "Signal", viber: "Viber", zalo: "Zalo", zalo_personal: "Zalo (personal)", messenger: "Messenger", instagram: "Instagram", tiktok: "TikTok", x: "X (Twitter)", linkedin: "LinkedIn", mastodon: "Mastodon", matrix: "Matrix", irc: "IRC", sms: "SMS", phone: "Phone", teams: "Microsoft Teams", webhook: "Webhook", api: "API", console: "Command line" },
      states: { connected: "Connected", retrying: "Retrying", not_reported: "Not reported by gateway", unknown: "Unknown", failed: "Failed", disconnected: "Disconnected", paused: "Paused" },
      tokenSet: "Set",
      tokenMissing: "Not set",
      notApplicable: "\u2014",
      allowedCount: (n) => n === 1 ? "1 person" : `${n} people`,
      empty: "No employee has connected an outside messaging channel yet.",
      loading: "Loading\u2026",
      loadError: "Could not load the connections.",
      btnRefresh: "\u21BB Refresh"
    },
    channelBindings: {
      title: "Conversation links",
      intro: "Optional. Only needed to let an employee send a message to one specific conversation: the system uses this list to know whose conversation it is before it checks communication permission. The connections above work normally when this list is empty.",
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
        send_message: "Send message",
        kanban_assign: "Assign task cards to others"
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
        channel_binding: "Conversation links",
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
      btnExpand: (n) => `Show ${n} proposal(s)`,
      btnCollapse: "Collapse",
      collapsedHint: `The system proposes these rules from each employee's role card. Open to read each one, or press "Approve all" if you have read them.`,
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
      summaryTitle: "Summary: what needs permission",
      summaryHint: "Rules that are identical for several AI employees are shown once, with the list of who they apply to. Open \xABEdit rules one by one\xBB below to change a single rule.",
      colReason: "What needs permission",
      colAppliesTo: "Applies to",
      appliesCount: (n) => `${n} AI employee(s)`,
      allOn: "All on",
      someOn: (a, n) => `${a}/${n} on`,
      showWho: "Show who",
      showDetail: "Technical detail",
      flatTitle: (n) => `Edit rules one by one (${n})`,
      advancedBadge: "system condition",
      advancedNote: "This rule uses a technical condition created by the system. The condition cannot be edited here and stays as it is \u2014 you can change who approves, the validity, the note and on/off.",
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
      labelProfile: "Applies to *",
      profilePlaceholder: "AI employee, department or role",
      labelTool: "Tool *",
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
      confirmSave: (who, tool) => `Save changes to the approval rule "${tool}" of ${who}?`,
      previewCommand: "Command it is about to run (if it runs a command)",
      previewCommandPlaceholder: "for example: systemctl restart hermes-plus-gateway",
      previewPath: "File it is about to write or edit (if it writes a file)",
      previewPathPlaceholder: "for example: /opt/hermes-plus/app.py",
      previewAdvanced: "Advanced: enter what it is about to do as JSON",
      previewMatchedRule: (note) => `Matching rule: ${note}`,
      previewMatchedTier: (who, hours) => `Approver: ${who}; single-use permit valid for ${hours} hours.`,
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
    // Thẻ «Áp dụng lại cấu hình» ở cuối trang Chính sách. Giờ tạo báo cáo và thời hạn nhắc việc đã chuyển sang
    // tab «Lịch và nhắc việc» của trang Công ty (không còn là chính sách).
    operations: {
      sectionReload: "Apply configuration again",
      reloadHint: "Makes the system re-read policies and configuration right now. Usually not needed because every save already updates it.",
      btnReload: "Reload config",
      reloading: "Reloading\u2026",
      reloadOk: (epoch, at) => `\u2705 Config reloaded at ${at} (reload #${epoch})`,
      reloadFailed: "\u274C Reload failed."
    },
    // Khung trang Chính sách (tiêu đề, mô tả từng thẻ, lịch sử thay đổi)
    policyPage: {
      title: "Policy",
      intro: "The company's house rules for AI employees: which tools each one may use, which tools need permission first, who may assign work or message whom, and which employee looks after which outside messaging channel. Most of it is already set up \u2014 you mainly review proposals and come back when something needs to change.",
      tabIntro: {
        permissions: "Which tools each AI employee may use, is forbidden to use, or must ask permission for first. Forbidden always wins; any tool not allowed is forbidden by default.",
        toolPolicy: "What each AI employee is allowed or forbidden to do. Anything not allowed is forbidden by default.",
        toolApproval: "Actions an AI employee may do only after someone approves them first.",
        a2aGrants: "Who may message, comment on or assign work to whom among AI employees.",
        sandbox: "How strictly each AI employee is kept apart from the rest of the machine.",
        channelBindings: "Which AI employee has connected which outside messaging channel (Telegram, Zalo\u2026) and whether it is working; plus an optional list that ties a specific conversation to an employee so sending is permission-checked."
      },
      historyTitle: "Change history",
      historyHint: "Every change made to policies on this page (who, when, before and after). Open to load.",
      requiredHint: "Fields marked * are required.",
      hintLabel: "Show explanation",
      formErrorTitle: "Cannot save yet",
      searchHint: "Type to filter the list",
      noMatch: "No match"
    },
    // Tab "What employees may do": one tester for both layers (allowed / forbidden and needs-approval)
    permissions: {
      testerTitle: "Quick check: may this employee do this?",
      testerHint: "The system checks both layers: whether the action is forbidden, and if allowed, whether it needs approval first. Forbidden always wins.",
      btnTest: "Check",
      errRequired: "Choose an employee and a tool.",
      resultDenied: "Forbidden",
      resultNeeds: (who) => `Allowed, but approval is needed first \u2014 approver: ${who}`,
      resultFree: "Allowed, no approval needed",
      ruleLine: (note) => `Matching rule: ${note}`
    },
    // Tên dễ hiểu của công cụ (mã công cụ giữ nguyên làm chú thích nhỏ)
    toolNames: {
      "*": "Every tool",
      bash: "Run a command line",
      terminal: "Run a command line",
      execute_code: "Run a piece of program code",
      read_file: "Read a file",
      write_file: "Write a file",
      patch: "Edit part of a file",
      search_files: "Search inside files",
      web_search: "Search the web",
      web_extract: "Read a web page",
      "browser_*": "Web browser (all actions)",
      browser_navigate: "Open a page in the browser",
      computer_use: "Control the computer",
      cronjob_manage: "Manage scheduled jobs",
      clarify: "Ask a clarifying question",
      delegate_task: "Hand work to a sub-agent",
      image_generate: "Create images",
      text_to_speech: "Turn text into speech",
      video_analyze: "Analyse a video",
      video_generate: "Create video",
      "kanban_*": "Task cards (all actions)",
      kanban_comment: "Comment on a task card",
      kanban_complete: "Complete a task card",
      kanban_create: "Create a task card",
      kanban_heartbeat: "Report still working on a card",
      kanban_show: "View a task card",
      memory: "Use memory",
      "poclip_*": "Company management tools (all)",
      poclip_alert_chairman: "Alert the Chairman",
      poclip_decide_delegated: "Decide on the Chairman's behalf (delegated)",
      poclip_emit_event: "Publish an internal event",
      poclip_escalate_incident: "Escalate an incident",
      poclip_freeze_agent: "Pause an employee",
      poclip_provider_control: "Control the model provider",
      poclip_report_concern: "Report a concern",
      poclip_self_heal: "Fix a system problem automatically",
      send_message: "Send a message",
      session_search: "Search past work sessions",
      skill_manage: "Manage skills",
      skill_view: "View a skill",
      skills_list: "List skills",
      todo_list: "Keep a to-do list",
      tool_describe: "Read a tool description",
      "group:terminal": "Command-line tool group",
      "group:web": "Web tool group",
      "group:plugins": "Plug-in tool group",
      "group:messaging": "Messaging tool group",
      "group:kanban": "Task card tool group"
    }
  };

  // src/i18n/vi.ts
  var vi = {
    tabs: {
      permissions: "Quy\u1EC1n d\xF9ng c\xF4ng c\u1EE5",
      a2aGrants: "Li\xEAn l\u1EA1c gi\u1EEFa nh\xE2n vi\xEAn",
      sandbox: "M\u1EE9c c\xE1ch ly",
      // Phần bên trong các thẻ (tên cũ giữ lại làm tiêu đề mục con)
      toolPolicy: "\u0110\u01B0\u1EE3c ph\xE9p / b\u1ECB c\u1EA5m",
      toolApproval: "Vi\u1EC7c c\u1EA7n xin ph\xE9p",
      channelBindings: "K\xEAnh nh\u1EAFn tin b\xEAn ngo\xE0i"
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
      cancel: "H\u1EE7y",
      delete: "Xo\xE1",
      disable: "T\u1EAFt",
      loading: "\u0110ang t\u1EA3i\u2026",
      saving: "\u0110ang l\u01B0u\u2026",
      actions: "Thao t\xE1c",
      noData: "Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u.",
      all: "T\u1EA5t c\u1EA3",
      codeTooltipLabel: "M\xE3 g\u1ED1c",
      view: "Xem",
      update: "C\u1EADp nh\u1EADt",
      revoke: "Thu h\u1ED3i",
      noChange: "(gi\u1EEF nguy\xEAn)",
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
      errDuplicateGrant: "\u1EE6y quy\u1EC1n n\xE0y \u0111\xE3 t\u1ED3n t\u1EA1i",
      errInvalidOperations: "Danh s\xE1ch thao t\xE1c kh\xF4ng h\u1EE3p l\u1EC7",
      errProfileNotFound: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 ngu\u1ED3n/\u0111\xEDch",
      errValidation: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
      errHttpStatus: (s) => `L\u1ED7i HTTP ${s}`,
      yes: "C\xF3",
      no: "Kh\xF4ng"
    },
    toolPolicy: {
      title: "Danh s\xE1ch \u0111\u01B0\u1EE3c ph\xE9p / b\u1ECB c\u1EA5m",
      filterProfileLabel: "Nh\xE2n vi\xEAn",
      filterPlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn \u0111\u1EC3 l\u1ECDc",
      viewingProfile: (pid) => `Xem t\u1EEB trang H\u1ED3 s\u01A1 \u2014 h\u1ED3 s\u01A1: ${pid}`,
      colId: "ID",
      colProfileId: "Nh\xE2n vi\xEAn",
      colToolPattern: "C\xF4ng c\u1EE5",
      colAction: "H\xE0nh \u0111\u1ED9ng",
      colScope: "\xC1p d\u1EE5ng theo",
      colPriority: "Th\u1EE9 t\u1EF1 x\xE9t",
      colRevision: "Phi\xEAn b\u1EA3n",
      colActive: "Tr\u1EA1ng th\xE1i",
      filterStatus: "Tr\u1EA1ng th\xE1i",
      statusActive: "\u0110ang hi\u1EC7u l\u1EF1c",
      statusInactive: "\u0110\xE3 t\u1EAFt",
      statusAll: "T\u1EA5t c\u1EA3",
      filterAction: "H\xE0nh \u0111\u1ED9ng",
      filterSearch: "T\xECm",
      searchPlaceholder: "G\xF5 t\xEAn nh\xE2n vi\xEAn ho\u1EB7c c\xF4ng c\u1EE5",
      countLine: (shown, total) => `\u0110ang hi\u1EC7n ${shown} tr\xEAn ${total} quy t\u1EAFc`,
      previewResultFor: (who, tool) => `${who} \u2014 ${tool}`,
      previewRuleNote: "Quy t\u1EAFc quy\u1EBFt \u0111\u1ECBnh:",
      noRules: "Ch\u01B0a c\xF3 quy t\u1EAFc n\xE0o.",
      addTitle: "Th\xEAm quy t\u1EAFc m\u1EDBi",
      editTitle: "S\u1EEDa quy t\u1EAFc",
      labelProfileId: "Nh\xE2n vi\xEAn ho\u1EB7c ph\xF2ng *",
      labelToolPattern: "C\xF4ng c\u1EE5 *",
      labelPolicyAction: "H\xE0nh \u0111\u1ED9ng *",
      labelScope: "\xC1p d\u1EE5ng theo",
      labelLayerPriority: "Th\u1EE9 t\u1EF1 x\xE9t (s\u1ED1 nh\u1ECF x\xE9t tr\u01B0\u1EDBc)",
      scopeAdvanced: "N\xE2ng cao: \xE1p d\u1EE5ng theo",
      priorityHint: "Lu\u1EADt C\u1EA4M lu\xF4n th\u1EAFng lu\u1EADt cho ph\xE9p, b\u1EA5t k\u1EC3 s\u1ED1 th\u1EE9 t\u1EF1. S\u1ED1 n\xE0y ch\u1EC9 quy\u1EBFt \u0111\u1ECBnh lu\u1EADt n\xE0o \u0111\u01B0\u1EE3c x\xE9t tr\u01B0\u1EDBc trong c\xF9ng m\u1ED9t l\u1EDBp.",
      scopeHint: "Ph\u1EA7n l\u1EDBn lu\u1EADt \xE1p d\u1EE5ng theo t\u1EEBng nh\xE2n vi\xEAn. \xABTheo nh\xE0 cung c\u1EA5p\xBB ch\u1EC9 c\xF3 t\xE1c d\u1EE5ng khi nh\xE2n vi\xEAn \u0111ang d\xF9ng \u0111\xFAng nh\xE0 cung c\u1EA5p m\xF4 h\xECnh \u0111\xE3 ch\u1ECDn.",
      labelNote: "Ghi ch\xFA",
      labelActive: "Tr\u1EA1ng th\xE1i",
      toolPatternPlaceholder: "Ch\u1ECDn c\xF4ng c\u1EE5",
      profileIdPlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn ho\u1EB7c ph\xF2ng",
      notePlaceholder: "Ghi ch\xFA tu\u1EF3 ch\u1ECDn",
      errRequired: "H\xE3y ch\u1ECDn nh\xE2n vi\xEAn (ho\u1EB7c ph\xF2ng) v\xE0 c\xF4ng c\u1EE5",
      errPriorityInt: "Th\u1EE9 t\u1EF1 x\xE9t ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn kh\xF4ng \xE2m (\u2265 0).",
      confirmDelete: (id) => `T\u1EAFt quy t\u1EAFc ${id}? Quy t\u1EAFc v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i v\xE0 b\u1EADt l\u1EA1i \u0111\u01B0\u1EE3c (b\u1ED9 l\u1ECDc \xAB\u0110\xE3 t\u1EAFt\xBB).`,
      confirmSave: (id) => `L\u01B0u thay \u0111\u1ED5i cho quy t\u1EAFc ${id}?`,
      deleted: (id) => `\u0110\xE3 t\u1EAFt quy t\u1EAFc: ${id}`,
      created: (id) => `\u0110\xE3 t\u1EA1o quy t\u1EAFc: ${id}`,
      saved: (id, rev) => `\u0110\xE3 l\u01B0u quy t\u1EAFc ${id} \u2014 phi\xEAn b\u1EA3n ${rev}`,
      pendingT2: (aprId) => `Thay \u0111\u1ED5i l\u1EDBn \u2014 ch\u1EDD duy\u1EC7t T2: ${aprId}`,
      pendingT2Notice: (aprId) => `\u23F3 Ch\u1EDD duy\u1EC7t T2 \u2014 approval_request_id: ${aprId}`,
      pendingT2SaveMsg: (aprId) => `Thay \u0111\u1ED5i l\u1EDBn ch\u1EDD duy\u1EC7t T2 \u2014 approval_request_id: ${aprId}`,
      previewTitle: "Xem tr\u01B0\u1EDBc ch\xEDnh s\xE1ch",
      previewLabelProfile: "Nh\xE2n vi\xEAn *",
      previewLabelTool: "C\xF4ng c\u1EE5 *",
      previewProfilePlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn c\u1EA7n ki\u1EC3m tra",
      previewToolPlaceholder: "Ch\u1ECDn c\xF4ng c\u1EE5 c\u1EA7n ki\u1EC3m tra",
      previewErrRequired: "H\xE3y ch\u1ECDn nh\xE2n vi\xEAn v\xE0 c\xF4ng c\u1EE5",
      previewBtn: "\u25B6 Xem tr\u01B0\u1EDBc",
      previewAllowed: "\u2705 \u0110\u01AF\u1EE2C PH\xC9P",
      previewDenied: "\u274C B\u1ECA T\u1EEA CH\u1ED0I",
      previewRulePrefix: "Quy t\u1EAFc:"
    },
    a2a: {
      title: "Li\xEAn l\u1EA1c gi\u1EEFa nh\xE2n vi\xEAn",
      colId: "ID",
      colFromProfile: "Nh\xE2n vi\xEAn g\u1EEDi",
      colToProfile: "Nh\xE2n vi\xEAn nh\u1EADn",
      colDirection: "H\u01B0\u1EDBng trao \u0111\u1ED5i",
      colOperations: "Vi\u1EC7c \u0111\u01B0\u1EE3c ph\xE9p",
      colActive: "Tr\u1EA1ng th\xE1i",
      colExpiresAt: "H\u1EBFt h\u1EA1n",
      noGrants: "Ch\u01B0a c\xF3 \u1EE7y quy\u1EC1n n\xE0o.",
      filterStatus: "Tr\u1EA1ng th\xE1i",
      statusActive: "\u0110ang hi\u1EC7u l\u1EF1c",
      statusInactive: "\u0110\xE3 t\u1EAFt",
      statusAll: "T\u1EA5t c\u1EA3",
      filterSearch: "T\xECm",
      searchPlaceholder: "G\xF5 t\xEAn m\u1ED9t nh\xE2n vi\xEAn \u0111\u1EC3 xem nh\u1EEFng \u1EE7y quy\u1EC1n li\xEAn quan",
      viewTable: "D\u1EA1ng b\u1EA3ng",
      viewByPerson: "Xem theo ng\u01B0\u1EDDi g\u1EEDi",
      countLine: (shown, total) => `\u0110ang hi\u1EC7n ${shown} tr\xEAn ${total} \u1EE7y quy\u1EC1n`,
      byPersonLine: (n) => `\u0111\u01B0\u1EE3c li\xEAn l\u1EA1c v\u1EDBi ${n} ng\u01B0\u1EDDi`,
      revokeLabel: (from, to) => `${from} \u2192 ${to}`,
      expiresHint: "\u0110\u1EC3 tr\u1ED1ng n\u1EBFu \u1EE7y quy\u1EC1n kh\xF4ng c\xF3 ng\xE0y h\u1EBFt h\u1EA1n.",
      addTitle: "Th\xEAm quy\u1EC1n li\xEAn l\u1EA1c m\u1EDBi",
      labelFromProfile: "Nh\xE2n vi\xEAn g\u1EEDi *",
      labelToProfile: "Nh\xE2n vi\xEAn nh\u1EADn *",
      labelDirection: "H\u01B0\u1EDBng trao \u0111\u1ED5i",
      labelNote: "Ghi ch\xFA",
      labelAllowedOps: "Vi\u1EC7c \u0111\u01B0\u1EE3c ph\xE9p *",
      labelExpiresAt: "H\u1EBFt h\u1EA1n",
      expiresPlaceholder: "2026-12-31T23:59:00Z",
      fromPlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn g\u1EEDi",
      toPlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn nh\u1EADn",
      notePlaceholder: "Ghi ch\xFA",
      noExpiry: "kh\xF4ng h\u1EBFt h\u1EA1n",
      expired: "\u0111\xE3 h\u1EBFt h\u1EA1n",
      errRequired: "H\xE3y ch\u1ECDn nh\xE2n vi\xEAn g\u1EEDi v\xE0 nh\xE2n vi\xEAn nh\u1EADn",
      created: (id) => `\u0110\xE3 t\u1EA1o \u1EE7y quy\u1EC1n: ${id}`,
      confirmRevoke: (id) => `Thu h\u1ED3i \u1EE7y quy\u1EC1n ${id}?`,
      revoked: (id) => `\u0110\xE3 thu h\u1ED3i \u1EE7y quy\u1EC1n: ${id}`,
      pendingT2: (aprId) => `Ch\u1EDD duy\u1EC7t T2 \u2014 approval_request_id: ${aprId}`,
      noEditNote: "\u1EE6y quy\u1EC1n \u0111\xE3 t\u1EA1o ch\u01B0a s\u1EEDa hay gia h\u1EA1n \u0111\u01B0\u1EE3c. Mu\u1ED1n \u0111\u1ED5i th\xEC thu h\u1ED3i r\u1ED3i t\u1EA1o l\u1EA1i.",
      opsAllLabel: "T\u1EA5t c\u1EA3 c\xE1c vi\u1EC7c",
      historyTitle: "L\u1ECBch s\u1EED li\xEAn l\u1EA1c gi\u1EEFa nh\xE2n vi\xEAn",
      historyNote: "Hi\u1EC7n t\u1ED1i \u0111a c\xE1c l\u1EA7n li\xEAn l\u1EA1c g\u1EA7n nh\u1EA5t; c\xE1c \xF4 l\u1ECDc d\u01B0\u1EDBi \u0111\xE2y l\u1ECDc trong s\u1ED1 \u0111\xE3 t\u1EA3i.",
      historyColCreatedAt: "Th\u1EDDi gian",
      historyColTopic: "Ch\u1EE7 \u0111\u1EC1",
      historyColSource: "Nh\xE2n vi\xEAn g\u1EEDi",
      historyColTarget: "Nh\xE2n vi\xEAn nh\u1EADn",
      historyColStatus: "Tr\u1EA1ng th\xE1i",
      historyColRisk: "M\u1EE9c r\u1EE7i ro",
      historyColRetry: "S\u1ED1 l\u1EA7n th\u1EED",
      historyFilterSourcePlaceholder: "L\u1ECDc theo nh\xE2n vi\xEAn g\u1EEDi/nh\u1EADn",
      historyFilterTopicPlaceholder: "L\u1ECDc ch\u1EE7 \u0111\u1EC1",
      historyFilterStatusPlaceholder: "L\u1ECDc tr\u1EA1ng th\xE1i",
      historyNoData: "Ch\u01B0a c\xF3 l\u1EA7n li\xEAn l\u1EA1c n\xE0o.",
      historyShowBtn: "\u25BC Hi\u1EC7n l\u1ECBch s\u1EED li\xEAn l\u1EA1c",
      historyHideBtn: "\u25B2 \u1EA8n l\u1ECBch s\u1EED li\xEAn l\u1EA1c",
      historyRefreshBtn: "\u21BB L\xE0m m\u1EDBi l\u1ECBch s\u1EED"
    },
    sandbox: {
      title: "C\u1EA5u h\xECnh m\xF4i tr\u01B0\u1EDDng c\xE1ch ly",
      viewTitle: "Xem c\u1EA5u h\xECnh c\xE1ch ly",
      updateTitle: "C\u1EADp nh\u1EADt c\u1EA5u h\xECnh c\xE1ch ly",
      filterProfileLabel: "Nh\xE2n vi\xEAn",
      profilePlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn",
      viewBtn: "Xem",
      updateBtn: "C\u1EADp nh\u1EADt",
      updateProfilePlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn c\u1EA7n c\u1EADp nh\u1EADt",
      backendPlaceholder: (codes) => `gi\xE1 tr\u1ECB h\u1EE3p l\u1EC7: ${codes}`,
      fieldId: "M\xE3",
      fieldProfileId: "Nh\xE2n vi\xEAn",
      fieldSandboxMode: "Ch\u1EBF \u0111\u1ED9 c\xE1ch ly",
      fieldBackend: "M\xF4i tr\u01B0\u1EDDng ch\u1EA1y",
      fieldWorkspaceAccess: "Quy\u1EC1n truy c\u1EADp th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
      fieldPruneOnExit: "D\u1ECDn d\u1EB9p khi tho\xE1t",
      labelProfileId: "Nh\xE2n vi\xEAn *",
      labelSandboxMode: "Ch\u1EBF \u0111\u1ED9 c\xE1ch ly",
      labelBackend: "M\xF4i tr\u01B0\u1EDDng ch\u1EA1y",
      labelWorkspaceAccess: "Quy\u1EC1n truy c\u1EADp th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c",
      inheritedNote: (rule) => `Nh\xE2n vi\xEAn n\xE0y ch\u01B0a c\xF3 c\u1EA5u h\xECnh c\xE1ch ly ri\xEAng \u2014 c\u1EA5u h\xECnh \u0111ang \xE1p d\u1EE5ng l\xE0: ${rule}.`,
      overviewTitle: "T\u1EA5t c\u1EA3 nh\xE2n vi\xEAn \u0111ang c\xF3 c\u1EA5u h\xECnh c\xE1ch ly",
      overviewSummary: (n, groups) => `${n} c\u1EA5u h\xECnh, thu\u1ED9c ${groups} m\u1EE9c kh\xE1c nhau.`,
      colPerson: "Nh\xE2n vi\xEAn",
      colPrune: "D\u1ECDn d\u1EB9p khi xong",
      editRow: "S\u1EEDa m\u1EE9c n\xE0y",
      localNote: "L\u01B0u \xFD quan tr\u1ECDng: trang n\xE0y hi\u1EC7n m\u1EDBi GHI NH\u1EACN m\u1EE9c c\xE1ch ly mong mu\u1ED1n cho t\u1EEBng nh\xE2n vi\xEAn; ch\u01B0a c\xF3 b\u1EB1ng ch\u1EE9ng h\u1EC7 th\u1ED1ng t\u1EF1 \u0111\u1ED9ng b\u1EAFt bu\u1ED9c nh\xE2n vi\xEAn ch\u1EA1y \u0111\xFAng m\u1EE9c n\xE0y khi l\xE0m vi\u1EC7c, n\xEAn ch\u01B0a n\xEAn xem \u0111\xE2y l\xE0 l\u1EDBp b\u1EA3o v\u1EC7 \u0111\xE3 ho\u1EA1t \u0111\u1ED9ng. Ri\xEAng \xABM\xE1y c\u1EE5c b\u1ED9\xBB ngh\u0129a l\xE0 ch\u1EA1y ngay tr\xEAn m\xE1y ch\u1EE7 n\xE0y, ch\u01B0a t\xE1ch ri\xEAng trong Docker hay m\xE1y kh\xE1c.",
      noOverview: "Ch\u01B0a c\xF3 c\u1EA5u h\xECnh c\xE1ch ly n\xE0o.",
      lookupTitle: "Tra m\u1ED9t nh\xE2n vi\xEAn ch\u01B0a c\xF3 c\u1EA5u h\xECnh ri\xEAng",
      notFoundPrefix: "Kh\xF4ng t\xECm th\u1EA5y:",
      errRequired: "H\xE3y ch\u1ECDn m\u1ED9t nh\xE2n vi\xEAn",
      errNothingToChange: "H\xE3y ch\u1ECDn \xEDt nh\u1EA5t m\u1ED9t thi\u1EBFt l\u1EADp c\u1EA7n thay \u0111\u1ED5i.",
      confirmSave: (id) => `\u0110\u1ED5i thi\u1EBFt l\u1EADp m\xF4i tr\u01B0\u1EDDng c\xE1ch ly c\u1EE7a ${id}? Thay \u0111\u1ED5i c\xF3 hi\u1EC7u l\u1EF1c ngay (ho\u1EB7c chuy\u1EC3n sang ch\u1EDD duy\u1EC7t).`,
      saved: (pid) => `\u0110\xE3 c\u1EADp nh\u1EADt m\xF4i tr\u01B0\u1EDDng c\xE1ch ly cho ${pid}`,
      pendingT2: (aprId) => `Thay \u0111\u1ED5i l\u1EDBn \u2014 ch\u1EDD duy\u1EC7t T2: ${aprId}`
    },
    // Phần «Kết nối đang chạy» của tab «Kênh nhắn tin bên ngoài» (pages/PolicyConfig/ChannelConnections.tsx)
    channelConnections: {
      title: "K\u1EBFt n\u1ED1i \u0111ang ch\u1EA1y",
      intro: "C\xE1c k\xEAnh nh\u1EAFn tin b\xEAn ngo\xE0i m\xE0 t\u1EEBng nh\xE2n vi\xEAn AI \u0111\xE3 n\u1ED1i th\u1EADt, l\u1EA5y tr\u1EF1c ti\u1EBFp t\u1EEB c\u1EA5u h\xECnh nh\xE2n vi\xEAn v\xE0 tr\u1EA1ng th\xE1i c\u1EE7a c\u1ED5ng nh\u1EAFn tin. Ph\u1EA7n n\xE0y ch\u1EC9 \u0111\u1EC3 xem, kh\xF4ng n\u1ED1i hay ng\u1EAFt k\u1EBFt n\u1ED1i.",
      gatewayLabel: "C\u1ED5ng nh\u1EAFn tin:",
      gatewayStates: { running: "\u0111ang ch\u1EA1y", stopped: "\u0111\xE3 d\u1EEBng", degraded: "ch\u1EA1y nh\u01B0ng c\xF3 k\xEAnh t\u1EA1m d\u1EEBng", startup_failed: "kh\u1EDFi \u0111\u1ED9ng kh\xF4ng \u0111\u01B0\u1EE3c", starting: "\u0111ang kh\u1EDFi \u0111\u1ED9ng" },
      gatewayUnknown: "ch\u01B0a r\xF5 (kh\xF4ng c\xF3 t\u1EC7p tr\u1EA1ng th\xE1i)",
      gatewayUpdated: (at) => `c\u1EADp nh\u1EADt l\xFAc ${at}`,
      summary: (ok, total) => `${ok}/${total} k\u1EBFt n\u1ED1i \u0111ang ho\u1EA1t \u0111\u1ED9ng`,
      colEmployee: "Nh\xE2n vi\xEAn",
      colChannel: "K\xEAnh",
      colState: "Tr\u1EA1ng th\xE1i",
      colToken: "M\xE3 k\u1EBFt n\u1ED1i",
      colAllowed: "Ng\u01B0\u1EDDi \u0111\u01B0\u1EE3c ph\xE9p",
      platforms: { telegram: "Telegram", discord: "Discord", slack: "Slack", whatsapp: "WhatsApp", email: "Email", web: "Web", line: "LINE", signal: "Signal", viber: "Viber", zalo: "Zalo", zalo_personal: "Zalo c\xE1 nh\xE2n", messenger: "Messenger", instagram: "Instagram", tiktok: "TikTok", x: "X (Twitter)", linkedin: "LinkedIn", mastodon: "Mastodon", matrix: "Matrix", irc: "IRC", sms: "SMS", phone: "\u0110i\u1EC7n tho\u1EA1i", teams: "Microsoft Teams", webhook: "Webhook", api: "API", console: "C\u1EEDa s\u1ED5 d\xF2ng l\u1EC7nh" },
      states: { connected: "\u0110ang k\u1EBFt n\u1ED1i", retrying: "\u0110ang th\u1EED n\u1ED1i l\u1EA1i", not_reported: "C\u1ED5ng ch\u01B0a b\xE1o", unknown: "Ch\u01B0a r\xF5", failed: "L\u1ED7i", disconnected: "\u0110\xE3 ng\u1EAFt", paused: "T\u1EA1m d\u1EEBng" },
      tokenSet: "\u0110\xE3 \u0111\u1EB7t",
      tokenMissing: "Ch\u01B0a \u0111\u1EB7t",
      notApplicable: "\u2014",
      allowedCount: (n) => `${n} ng\u01B0\u1EDDi`,
      empty: "Ch\u01B0a c\xF3 nh\xE2n vi\xEAn n\xE0o n\u1ED1i k\xEAnh nh\u1EAFn tin b\xEAn ngo\xE0i.",
      loading: "\u0110ang t\u1EA3i\u2026",
      loadError: "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c danh s\xE1ch k\u1EBFt n\u1ED1i.",
      btnRefresh: "\u21BB L\xE0m m\u1EDBi"
    },
    channelBindings: {
      title: "Li\xEAn k\u1EBFt cu\u1ED9c tr\xF2 chuy\u1EC7n",
      intro: "Tu\u1EF3 ch\u1ECDn. Ch\u1EC9 c\u1EA7n khi cho ph\xE9p nh\xE2n vi\xEAn g\u1EEDi tin t\u1EDBi m\u1ED9t cu\u1ED9c tr\xF2 chuy\u1EC7n c\u1EE5 th\u1EC3: h\u1EC7 th\u1ED1ng d\u1EF1a v\xE0o danh s\xE1ch n\xE0y \u0111\u1EC3 bi\u1EBFt cu\u1ED9c tr\xF2 chuy\u1EC7n \u0111\xF3 thu\u1ED9c nh\xE2n vi\xEAn n\xE0o r\u1ED3i m\u1EDBi ki\u1EC3m quy\u1EC1n li\xEAn l\u1EA1c. C\xE1c k\u1EBFt n\u1ED1i \u1EDF ph\u1EA7n tr\xEAn v\u1EABn ch\u1EA1y b\xECnh th\u01B0\u1EDDng khi danh s\xE1ch n\xE0y tr\u1ED1ng.",
      colId: "ID",
      colChannel: "K\xEAnh",
      colProfileId: "Nh\xE2n vi\xEAn",
      colRole: "Vai tr\xF2",
      colActive: "Tr\u1EA1ng th\xE1i",
      noBindings: "Ch\u01B0a c\xF3 li\xEAn k\u1EBFt k\xEAnh n\xE0o.",
      addTitle: "Th\xEAm li\xEAn k\u1EBFt k\xEAnh",
      editTitle: "S\u1EEDa li\xEAn k\u1EBFt k\xEAnh",
      labelChannel: "K\xEAnh *",
      labelProfileId: "Nh\xE2n vi\xEAn *",
      labelRole: "Vai tr\xF2",
      labelNote: "Ghi ch\xFA",
      labelPeerId: "M\xE3 ng\u01B0\u1EDDi li\xEAn h\u1EC7",
      labelGuildId: "M\xE3 m\xE1y ch\u1EE7 Discord",
      labelTeamId: "M\xE3 nh\xF3m",
      labelActive: "Tr\u1EA1ng th\xE1i",
      profileIdPlaceholder: "Ch\u1ECDn nh\xE2n vi\xEAn",
      rolePlaceholder: "v\xED d\u1EE5: qu\u1EA3n tr\u1ECB / ch\u1EC9 xem",
      notePlaceholder: "Ghi ch\xFA",
      peerIdPlaceholder: "v\xED d\u1EE5: m\xE3 ng\u01B0\u1EDDi li\xEAn h\u1EC7 trong k\xEAnh",
      guildIdPlaceholder: "v\xED d\u1EE5: m\xE3 m\xE1y ch\u1EE7 Discord",
      teamIdPlaceholder: "v\xED d\u1EE5: m\xE3 nh\xF3m Slack ho\u1EB7c Teams",
      errRequired: "H\xE3y ch\u1ECDn m\u1ED9t nh\xE2n vi\xEAn",
      created: (id) => `\u0110\xE3 t\u1EA1o li\xEAn k\u1EBFt k\xEAnh: ${id}`,
      deleted: (id) => `\u0110\xE3 t\u1EAFt li\xEAn k\u1EBFt k\xEAnh: ${id}`,
      saved: (id) => `\u0110\xE3 l\u01B0u li\xEAn k\u1EBFt k\xEAnh: ${id}`,
      confirmDelete: (id) => `T\u1EAFt li\xEAn k\u1EBFt k\xEAnh ${id}? Li\xEAn k\u1EBFt v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i v\xE0 b\u1EADt l\u1EA1i \u0111\u01B0\u1EE3c.`,
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
    suggestions: {
      blockTitle: "\u0110\u1EC1 xu\u1EA5t ch\xEDnh s\xE1ch",
      pendingCount: (n) => `\u0110ang ch\u1EDD ${n} \u0111\u1EC1 xu\u1EA5t`,
      btnGenerate: "T\u1EA1o \u0111\u1EC1 xu\u1EA5t m\u1EDBi",
      btnExpand: (n) => `Xem ${n} \u0111\u1EC1 xu\u1EA5t`,
      btnCollapse: "Thu g\u1ECDn",
      collapsedHint: "H\u1EC7 th\u1ED1ng t\u1EF1 g\u1EE3i \xFD c\xE1c quy t\u1EAFc n\xE0y d\u1EF1a tr\xEAn th\u1EBB vai tr\xF2 c\u1EE7a nh\xE2n vi\xEAn. M\u1EDF ra \u0111\u1EC3 \u0111\u1ECDc t\u1EEBng \u0111\u1EC1 xu\u1EA5t, ho\u1EB7c b\u1EA5m \xABDuy\u1EC7t t\u1EA5t c\u1EA3\xBB n\u1EBFu \u0111\xE3 \u0111\u1ECDc xong.",
      btnApproveAll: "Duy\u1EC7t t\u1EA5t c\u1EA3",
      confirmApproveAll: (n) => `Duy\u1EC7t T\u1EA4T C\u1EA2 ${n} \u0111\u1EC1 xu\u1EA5t \u0111ang ch\u1EDD c\u1EE7a M\u1EE4C N\xC0Y ngay b\xE2y gi\u1EDD? Ch\u1EC9 \u0111\u1EC1 xu\u1EA5t c\u1EE7a m\u1EE5c n\xE0y \u0111\u01B0\u1EE3c duy\u1EC7t \u2014 c\xE1c m\u1EE5c ch\xEDnh s\xE1ch kh\xE1c kh\xF4ng b\u1ECB \u1EA3nh h\u01B0\u1EDFng. Quy t\u1EAFc c\xF3 hi\u1EC7u l\u1EF1c ngay. N\u1EBFu ch\u01B0a ch\u1EAFc, h\xE3y xem danh s\xE1ch tr\u01B0\u1EDBc.`,
      btnApprove: "Duy\u1EC7t",
      btnReject: "B\u1ECF qua",
      btnEdit: "S\u1EEDa",
      btnSave: "L\u01B0u",
      btnCancel: "H\u1EE7y",
      statusDraft: "\u0110ang ch\u1EDD",
      statusApproved: "\u0110\xE3 duy\u1EC7t",
      statusRejected: "\u0110\xE3 b\u1ECF qua",
      empty: "Ch\u01B0a c\xF3 \u0111\u1EC1 xu\u1EA5t n\xE0o cho m\u1EE5c n\xE0y.",
      emptyHint: 'B\u1EA5m "T\u1EA1o \u0111\u1EC1 xu\u1EA5t m\u1EDBi" \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u.',
      beforeNull: "Ch\u01B0a c\xF3 \u2014 s\u1EBD t\u1EA1o m\u1EDBi",
      beforeNullDone: "Tr\u01B0\u1EDBc \u0111\xF3 ch\u01B0a c\xF3 \u2014 \u0111\u01B0\u1EE3c t\u1EA1o b\u1EDFi l\u1EA7n duy\u1EC7t n\xE0y",
      noPending: "Kh\xF4ng c\xF3 \u0111\u1EC1 xu\u1EA5t n\xE0o \u0111ang ch\u1EDD.",
      showDecided: (n) => `Xem ${n} \u0111\u1EC1 xu\u1EA5t \u0111\xE3 x\u1EED l\xFD`,
      hideDecided: "\u1EA8n c\xE1c \u0111\u1EC1 xu\u1EA5t \u0111\xE3 x\u1EED l\xFD",
      beforeLabel: "Tr\u01B0\u1EDBc",
      afterLabel: "Sau",
      toastGenerated: (n) => `\u0110\xE3 t\u1EA1o ${n} \u0111\u1EC1 xu\u1EA5t`,
      toastApprovedAll: "\u0110\xE3 duy\u1EC7t to\xE0n b\u1ED9 \u0111\u1EC1 xu\u1EA5t \u0111ang ch\u1EDD",
      toastApprovedAllPartial: (ok, failed) => `\u0110\xE3 duy\u1EC7t ${ok} \u0111\u1EC1 xu\u1EA5t, nh\u01B0ng ${failed} \u0111\u1EC1 xu\u1EA5t kh\xF4ng \xE1p d\u1EE5ng \u0111\u01B0\u1EE3c \u2014 v\u1EABn c\xF2n trong danh s\xE1ch ch\u1EDD.`,
      toastApproved: "\u0110\xE3 duy\u1EC7t \u0111\u1EC1 xu\u1EA5t",
      toastRejected: "\u0110\xE3 b\u1ECF qua \u0111\u1EC1 xu\u1EA5t",
      toastSaved: "\u0110\xE3 l\u01B0u \u0111\u1EC1 xu\u1EA5t",
      notesTitle: "Ghi ch\xFA h\u1EC7 th\u1ED1ng",
      paramStageLabel: "giai \u0111o\u1EA1n",
      rationale: {
        toolPolicyFromRoleCard: (agent, tool, scope, writeAccess) => `Nh\xE2n vi\xEAn ${agent} \u0111\xE3 khai b\xE1o c\xF4ng c\u1EE5 ${tool} (ph\u1EA1m vi: ${scope}, quy\u1EC1n ghi: ${writeAccess}) trong th\u1EBB vai tr\xF2`,
        sandboxIndependentControl: (agent) => `Nh\xE2n vi\xEAn ${agent} v\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp \u2014 d\xF9ng k\xEAnh gi\xE1m s\xE1t \u0111\u1ED9c l\u1EADp \u0111\u1EC3 duy tr\xEC c\xE1ch ly`,
        sandboxIndependent: (agent) => `Nh\xE2n vi\xEAn ${agent} \u0111\xE3 v\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp \u2014 cho ph\xE9p ghi th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c`,
        sandboxNotIndependent: (agent) => `Nh\xE2n vi\xEAn ${agent} ch\u01B0a \u0111\u1EA1t v\u1EADn h\xE0nh \u0111\u1ED9c l\u1EADp \u2014 b\u1EADt c\xE1ch ly, ch\u1EC9 \u0111\u1ECDc th\u01B0 m\u1EE5c l\xE0m vi\u1EC7c`,
        toolPolicyFromRoleBaseline: (agent, tool) => `Nh\xE2n vi\xEAn ${agent} ch\u01B0a c\xF3 th\u1EBB vai tr\xF2 \u2014 c\xF4ng c\u1EE5 ${tool} l\xE0 c\xF4ng c\u1EE5 chung c\u1EE7a m\u1ECDi nh\xE2n vi\xEAn c\xF9ng lo\u1EA1i vai tr\xF2 n\xEAn \u0111\u01B0\u1EE3c g\u1EE3i \xFD l\xE0m m\u1EE9c c\u01A1 b\u1EA3n an to\xE0n`,
        toolPolicyDenyUnusedGroup: (target, group, members, role) => target.startsWith("role:") ? `C\u1EA3 ${members} nh\xE2n vi\xEAn vai tr\xF2 "${role}" \u0111\u1EC1u \u0111ang T\u1EAET nh\xF3m c\xF4ng c\u1EE5 "${group}" trong c\u1EA5u h\xECnh th\u1EADt \u2014 ch\u1EB7n cho c\u1EA3 vai tr\xF2 \u0111\u1EC3 nh\xE2n vi\xEAn th\xEAm sau n\xE0y kh\xF4ng t\u1EF1 c\xF3 nh\xF3m n\xE0y` : `${target} \u0111ang t\u1EAFt nh\xF3m c\xF4ng c\u1EE5 "${group}" trong c\u1EA5u h\xECnh th\u1EADt \u2014 ch\u1EB7n \u0111\u1EC3 kh\xF4ng b\u1ECB d\xF9ng nh\u1EA7m`,
        a2aFromOrgLine: (manager, agent) => `${agent} b\xE1o c\xE1o cho ${manager} trong s\u01A1 \u0111\u1ED3 t\u1ED5 ch\u1EE9c \u2014 cho ph\xE9p giao vi\u1EC7c xu\u1ED1ng v\xE0 b\xE1o c\xE1o l\xEAn`,
        a2aFromFlow: (producerCluster, consumerCluster, direction, topicCount) => `Lu\u1ED3ng y\xEAu c\u1EA7u trao \u0111\u1ED5i A2A: ${producerCluster} \u2192 ${consumerCluster} (h\u01B0\u1EDBng: ${direction}, ${topicCount} ch\u1EE7 \u0111\u1EC1)`,
        channelFromRoleCardTool: (agent, channel, toolName) => `Nh\xE2n vi\xEAn ${agent} d\xF9ng c\xF4ng c\u1EE5 ${toolName} \u2014 c\u1EA7n g\u1EAFn k\xEAnh ${channel}`
      },
      note: {
        noToolsDeclared: (agent) => `Nh\xE2n vi\xEAn ${agent} ch\u01B0a khai b\xE1o c\xF4ng c\u1EE5 n\xE0o trong th\u1EBB vai tr\xF2 \u2014 kh\xF4ng sinh quy t\u1EAFc ch\xEDnh s\xE1ch`,
        noRoleCard: (profileId) => `H\u1ED3 s\u01A1 ${profileId} ch\u01B0a c\xF3 th\u1EBB vai tr\xF2 n\xEAn ch\u01B0a g\u1EE3i \xFD \u0111\u01B0\u1EE3c ch\xEDnh s\xE1ch`,
        a2aNoRepresentative: (cluster, topic) => `Nh\xF3m ${cluster} ch\u01B0a c\xF3 nh\xE2n vi\xEAn \u0111\u1EA1i di\u1EC7n cho ch\u1EE7 \u0111\u1EC1 ${topic} \u2014 kh\xF4ng sinh \u1EE7y quy\u1EC1n A2A`,
        channelNotConfigured: () => `Ch\u01B0a c\xF3 k\xEAnh n\xE0o \u0111\u1EC3 g\u1EAFn \u2014 kh\xF4ng th\u1EC3 sinh \u0111\u1EC1 xu\u1EA5t li\xEAn k\u1EBFt k\xEAnh. Ch\u1EE7 t\u1ECBch vui l\xF2ng c\u1EA5u h\xECnh \xEDt nh\u1EA5t m\u1ED9t k\xEAnh tr\u01B0\u1EDBc.`,
        channelNoDeclaration: (channel) => `K\xEAnh ${channel} ch\u01B0a c\xF3 nh\xE2n vi\xEAn khai b\xE1o \u2014 kh\xF4ng sinh quy t\u1EAFc li\xEAn k\u1EBFt k\xEAnh`
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
        layer_priority: "Th\u1EE9 t\u1EF1 x\xE9t",
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
      summaryTitle: "T\xF3m t\u1EAFt: vi\u1EC7c n\xE0o ph\u1EA3i xin ph\xE9p",
      summaryHint: "Lu\u1EADt gi\u1ED1ng h\u1EC7t nhau cho nhi\u1EC1u nh\xE2n vi\xEAn AI ch\u1EC9 hi\u1EC7n m\u1ED9t d\xF2ng, k\xE8m danh s\xE1ch \xE1p d\u1EE5ng cho ai. Mu\u1ED1n s\u1EEDa ri\xEAng m\u1ED9t lu\u1EADt, m\u1EDF m\u1EE5c \xABS\u1EEDa t\u1EEBng lu\u1EADt\xBB b\xEAn d\u01B0\u1EDBi.",
      colReason: "Vi\u1EC7c ph\u1EA3i xin ph\xE9p",
      colAppliesTo: "\xC1p d\u1EE5ng cho",
      appliesCount: (n) => `${n} nh\xE2n vi\xEAn AI`,
      allOn: "\u0110ang b\u1EADt h\u1EBFt",
      someOn: (a, n) => `\u0110ang b\u1EADt ${a}/${n}`,
      showWho: "Xem l\xE0 ai",
      showDetail: "Chi ti\u1EBFt k\u1EF9 thu\u1EADt",
      flatTitle: (n) => `S\u1EEDa t\u1EEBng lu\u1EADt (${n})`,
      advancedBadge: "\u0111i\u1EC1u ki\u1EC7n c\u1EE7a h\u1EC7 th\u1ED1ng",
      advancedNote: "Lu\u1EADt n\xE0y d\xF9ng \u0111i\u1EC1u ki\u1EC7n k\u1EF9 thu\u1EADt do h\u1EC7 th\u1ED1ng t\u1EA1o. \u0110i\u1EC1u ki\u1EC7n kh\xF4ng s\u1EEDa \u0111\u01B0\u1EE3c \u1EDF \u0111\xE2y v\xE0 \u0111\u01B0\u1EE3c gi\u1EEF nguy\xEAn \u2014 v\u1EABn \u0111\u1ED5i \u0111\u01B0\u1EE3c ng\u01B0\u1EDDi duy\u1EC7t, th\u1EDDi h\u1EA1n gi\u1EA5y ph\xE9p, ghi ch\xFA v\xE0 b\u1EADt/t\u1EAFt.",
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
      labelProfile: "\xC1p d\u1EE5ng cho *",
      profilePlaceholder: "Nh\xE2n vi\xEAn AI, ph\xF2ng ho\u1EB7c vai tr\xF2",
      labelTool: "C\xF4ng c\u1EE5 *",
      toolPlaceholder: "Ch\u1ECDn c\xF4ng c\u1EE5",
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
      deleted: "\u0110\xE3 t\u1EAFt lu\u1EADt xin ph\xE9p (b\u1EADt l\u1EA1i \u0111\u01B0\u1EE3c).",
      confirmDelete: "T\u1EAFt lu\u1EADt xin ph\xE9p n\xE0y? Nh\xE2n vi\xEAn AI s\u1EBD kh\xF4ng c\u1EA7n xin ph\xE9p theo lu\u1EADt n\xE0y n\u1EEFa; lu\u1EADt v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF l\u1EA1i v\xE0 b\u1EADt l\u1EA1i \u0111\u01B0\u1EE3c.",
      confirmSave: (who, tool) => `L\u01B0u thay \u0111\u1ED5i cho lu\u1EADt xin ph\xE9p \xAB${tool}\xBB c\u1EE7a ${who}?`,
      previewCommand: "L\u1EC7nh \u0111\u1ECBnh ch\u1EA1y (n\u1EBFu vi\u1EC7c \u0111\xF3 l\xE0 ch\u1EA1y l\u1EC7nh)",
      previewCommandPlaceholder: "v\xED d\u1EE5: systemctl restart hermes-plus-gateway",
      previewPath: "T\u1EC7p \u0111\u1ECBnh ghi (n\u1EBFu vi\u1EC7c \u0111\xF3 l\xE0 ghi ho\u1EB7c s\u1EEDa t\u1EC7p)",
      previewPathPlaceholder: "v\xED d\u1EE5: /opt/hermes-plus/app.py",
      previewAdvanced: "N\xE2ng cao: nh\u1EADp n\u1ED9i dung vi\u1EC7c \u0111\u1ECBnh l\xE0m d\u1EA1ng JSON",
      previewMatchedRule: (note) => `Lu\u1EADt kh\u1EDBp: ${note}`,
      previewMatchedTier: (who, hours) => `Ng\u01B0\u1EDDi duy\u1EC7t: ${who}; gi\u1EA5y ph\xE9p d\xF9ng m\u1ED9t l\u1EA7n, hi\u1EC7u l\u1EF1c ${hours} gi\u1EDD.`,
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
    // Thẻ «Áp dụng lại cấu hình» ở cuối trang Chính sách. Giờ tạo báo cáo và thời hạn nhắc việc đã chuyển sang
    // tab «Lịch và nhắc việc» của trang Công ty (không còn là chính sách).
    operations: {
      sectionReload: "\xC1p d\u1EE5ng l\u1EA1i c\u1EA5u h\xECnh",
      reloadHint: "B\u1EAFt h\u1EC7 th\u1ED1ng \u0111\u1ECDc l\u1EA1i ch\xEDnh s\xE1ch v\xE0 c\u1EA5u h\xECnh ngay. Th\u01B0\u1EDDng kh\xF4ng c\u1EA7n b\u1EA5m v\xEC m\u1ED7i l\u1EA7n l\u01B0u \u0111\xE3 t\u1EF1 c\u1EADp nh\u1EADt.",
      btnReload: "\xC1p d\u1EE5ng l\u1EA1i ngay",
      reloading: "\u0110ang t\u1EA3i l\u1EA1i\u2026",
      reloadOk: (epoch, at) => `\u2705 \u0110\xE3 t\u1EA3i l\u1EA1i c\u1EA5u h\xECnh l\xFAc ${at} (l\u1EA7n th\u1EE9 ${epoch})`,
      reloadFailed: "\u274C T\u1EA3i l\u1EA1i th\u1EA5t b\u1EA1i."
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
        delegate_task: "Nh\u1EDD tr\u1EE3 l\xFD ph\u1EE5 l\xE0m gi\xFAp",
        send_message: "G\u1EEDi tin nh\u1EAFn",
        kanban_assign: "Giao th\u1EBB c\xF4ng vi\u1EC7c cho ng\u01B0\u1EDDi kh\xE1c"
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
        agent: "Theo nh\xE2n vi\xEAn AI",
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
        tool_policy: "\u0110\u01B0\u1EE3c ph\xE9p / b\u1ECB c\u1EA5m",
        a2a_grant: "Quy\u1EC1n li\xEAn l\u1EA1c",
        sandbox: "M\u1EE9c c\xE1ch ly",
        channel_binding: "Li\xEAn k\u1EBFt cu\u1ED9c tr\xF2 chuy\u1EC7n",
        tool_approval_rule: "Lu\u1EADt xin ph\xE9p"
      },
      auditAction: {
        create: "T\u1EA1o m\u1EDBi",
        update: "C\u1EADp nh\u1EADt",
        delete: "Xo\xE1 ho\u1EB7c t\u1EAFt",
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
      role: (name) => `M\u1ECDi nh\xE2n vi\xEAn c\xF3 vai tr\xF2: ${name}`,
      roleLead: "Tr\u01B0\u1EDFng ph\xF2ng",
      roleWorker: "Nh\xE2n vi\xEAn"
    },
    choiceField: {
      customOptionLabel: "\u270F\uFE0F Gi\xE1 tr\u1ECB kh\xE1c \u2014 nh\u1EADp tay\u2026",
      backToList: "\u21A9 Quay l\u1EA1i danh s\xE1ch",
      emptyHintDefault: "Ch\u01B0a c\xF3 l\u1EF1a ch\u1ECDn \u2014 nh\u1EADp gi\xE1 tr\u1ECB th\u1EE7 c\xF4ng.",
      emptyHintPersonnel: "\u0110ang t\u1EA3i danh s\xE1ch nh\xE2n vi\xEAn\u2026 (n\u1EBFu kh\xF4ng hi\u1EC7n, c\xF3 th\u1EC3 g\xF5 m\xE3 nh\xE2n vi\xEAn b\u1EB1ng tay).",
      emptyHintTools: "Ch\u01B0a t\u1EA3i m\u1EABu c\xF4ng c\u1EE5 \u2014 nh\u1EADp th\u1EE7 c\xF4ng.",
      emptyHintChannel: "Nh\u1EADp t\xEAn n\u1EC1n t\u1EA3ng k\xEAnh.",
      emptyHintRole: "Nh\u1EADp vai tr\xF2 (v\xED d\u1EE5: admin ho\u1EB7c viewer).",
      emptyHintSlug: "Nh\u1EADp m\xE3 ph\xF2ng.",
      emptyHintTimezone: "Nh\u1EADp m\xFAi gi\u1EDD (v\xED d\u1EE5: Asia/Ho_Chi_Minh).",
      emptyHintHours: "Nh\u1EADp s\u1ED1 gi\u1EDD.",
      groupSuffix: "(nh\xF3m)",
      channelBoundSuffix: "(\u0111\xE3 g\u1EAFn)"
    },
    // Khung trang Chính sách (tiêu đề, mô tả từng thẻ, lịch sử thay đổi)
    policyPage: {
      title: "Ch\xEDnh s\xE1ch",
      intro: "N\u1ED9i quy c\u1EE7a c\xF4ng ty AI: nh\xE2n vi\xEAn AI \u0111\u01B0\u1EE3c d\xF9ng c\xF4ng c\u1EE5 n\xE0o, c\xF4ng c\u1EE5 n\xE0o ph\u1EA3i xin ph\xE9p tr\u01B0\u1EDBc, ai \u0111\u01B0\u1EE3c giao vi\u1EC7c ho\u1EB7c nh\u1EAFn tin cho ai, v\xE0 nh\xE2n vi\xEAn n\xE0o ph\u1EE5 tr\xE1ch k\xEAnh nh\u1EAFn tin b\xEAn ngo\xE0i n\xE0o. Ph\u1EA7n l\u1EDBn \u0111\xE3 \u0111\u01B0\u1EE3c thi\u1EBFt l\u1EADp s\u1EB5n \u2014 th\u01B0\u1EDDng ch\u1EC9 c\u1EA7n duy\u1EC7t c\xE1c \u0111\u1EC1 xu\u1EA5t v\xE0 quay l\u1EA1i khi c\u1EA7n \u0111\u1ED5i.",
      tabIntro: {
        permissions: "M\u1ED7i nh\xE2n vi\xEAn AI \u0111\u01B0\u1EE3c d\xF9ng, b\u1ECB c\u1EA5m d\xF9ng hay ph\u1EA3i xin ph\xE9p tr\u01B0\u1EDBc khi d\xF9ng nh\u1EEFng c\xF4ng c\u1EE5 n\xE0o. C\u1EA5m lu\xF4n th\u1EAFng; c\xF4ng c\u1EE5 n\xE0o ch\u01B0a \u0111\u01B0\u1EE3c ph\xE9p th\xEC m\u1EB7c \u0111\u1ECBnh b\u1ECB c\u1EA5m.",
        toolPolicy: "M\u1ED7i nh\xE2n vi\xEAn AI \u0111\u01B0\u1EE3c ph\xE9p hay b\u1ECB c\u1EA5m l\xE0m vi\u1EC7c g\xEC. Vi\u1EC7c n\xE0o ch\u01B0a \u0111\u01B0\u1EE3c ph\xE9p th\xEC m\u1EB7c \u0111\u1ECBnh b\u1ECB c\u1EA5m.",
        toolApproval: "Nh\u1EEFng vi\u1EC7c nh\xE2n vi\xEAn AI ch\u1EC9 \u0111\u01B0\u1EE3c l\xE0m sau khi c\xF3 ng\u01B0\u1EDDi duy\u1EC7t tr\u01B0\u1EDBc.",
        a2aGrants: "Ai \u0111\u01B0\u1EE3c nh\u1EAFn tin, b\xECnh lu\u1EADn ho\u1EB7c giao vi\u1EC7c cho ai trong s\u1ED1 c\xE1c nh\xE2n vi\xEAn AI.",
        sandbox: "M\u1EE9c c\xE1ch ly mong mu\u1ED1n cho t\u1EEBng nh\xE2n vi\xEAn AI (hi\u1EC7n m\u1EDBi ghi nh\u1EADn c\u1EA5u h\xECnh, ch\u01B0a c\xF3 c\u01A1 ch\u1EBF t\u1EF1 \u0111\u1ED9ng b\u1EAFt bu\u1ED9c thi h\xE0nh).",
        channelBindings: "Nh\xE2n vi\xEAn AI n\xE0o \u0111\xE3 n\u1ED1i k\xEAnh nh\u1EAFn tin b\xEAn ngo\xE0i n\xE0o (Telegram, Zalo\u2026) v\xE0 \u0111ang ch\u1EA1y hay l\u1ED7i; c\xF9ng danh s\xE1ch tu\u1EF3 ch\u1ECDn g\u1EAFn m\u1ED9t cu\u1ED9c tr\xF2 chuy\u1EC7n c\u1EE5 th\u1EC3 v\u1EDBi nh\xE2n vi\xEAn \u0111\u1EC3 ki\u1EC3m quy\u1EC1n g\u1EEDi tin."
      },
      historyTitle: "L\u1ECBch s\u1EED thay \u0111\u1ED5i ch\xEDnh s\xE1ch",
      historyHint: "M\u1ECDi thay \u0111\u1ED5i ch\xEDnh s\xE1ch l\xE0m tr\xEAn trang n\xE0y (ai l\xE0m, l\xFAc n\xE0o, tr\u01B0\u1EDBc v\xE0 sau). M\u1EDF ra \u0111\u1EC3 xem.",
      requiredHint: "\xD4 c\xF3 d\u1EA5u * l\xE0 b\u1EAFt bu\u1ED9c.",
      hintLabel: "Xem ch\xFA th\xEDch",
      formErrorTitle: "Ch\u01B0a l\u01B0u \u0111\u01B0\u1EE3c",
      searchHint: "G\xF5 \u0111\u1EC3 l\u1ECDc danh s\xE1ch",
      noMatch: "Kh\xF4ng c\xF3 k\u1EBFt qu\u1EA3 kh\u1EDBp"
    },
    // Thẻ «Quyền dùng công cụ»: ô thử chung cho cả hai lớp (được phép / bị cấm và việc cần xin phép)
    permissions: {
      testerTitle: "Th\u1EED nhanh: nh\xE2n vi\xEAn n\xE0y l\xE0m \u0111\u01B0\u1EE3c vi\u1EC7c n\xE0y kh\xF4ng?",
      testerHint: "H\u1EC7 th\u1ED1ng ki\u1EC3m c\u1EA3 hai l\u1EDBp: vi\u1EC7c \u0111\xF3 c\xF3 b\u1ECB c\u1EA5m kh\xF4ng, v\xE0 n\u1EBFu \u0111\u01B0\u1EE3c l\xE0m th\xEC c\xF3 ph\u1EA3i xin ph\xE9p tr\u01B0\u1EDBc kh\xF4ng. C\u1EA5m lu\xF4n th\u1EAFng.",
      btnTest: "Ki\u1EC3m tra",
      errRequired: "H\xE3y ch\u1ECDn nh\xE2n vi\xEAn v\xE0 c\xF4ng c\u1EE5.",
      resultDenied: "B\u1ECB c\u1EA5m",
      resultNeeds: (who) => `\u0110\u01B0\u1EE3c l\xE0m, nh\u01B0ng ph\u1EA3i xin ph\xE9p tr\u01B0\u1EDBc \u2014 ng\u01B0\u1EDDi duy\u1EC7t: ${who}`,
      resultFree: "\u0110\u01B0\u1EE3c l\xE0m, kh\xF4ng c\u1EA7n xin ph\xE9p",
      ruleLine: (note) => `Lu\u1EADt kh\u1EDBp: ${note}`
    },
    // Tên dễ hiểu của công cụ (mã công cụ giữ nguyên làm chú thích nhỏ)
    toolNames: {
      "*": "M\u1ECDi c\xF4ng c\u1EE5",
      bash: "Ch\u1EA1y l\u1EC7nh d\xF2ng l\u1EC7nh",
      terminal: "Ch\u1EA1y l\u1EC7nh d\xF2ng l\u1EC7nh",
      execute_code: "Ch\u1EA1y m\u1ED9t \u0111o\u1EA1n m\xE3 l\u1EADp tr\xECnh",
      read_file: "\u0110\u1ECDc t\u1EC7p",
      write_file: "Ghi t\u1EC7p",
      patch: "S\u1EEDa m\u1ED9t ph\u1EA7n n\u1ED9i dung t\u1EC7p",
      search_files: "T\xECm trong c\xE1c t\u1EC7p",
      web_search: "T\xECm ki\u1EBFm tr\xEAn web",
      web_extract: "\u0110\u1ECDc n\u1ED9i dung m\u1ED9t trang web",
      "browser_*": "Tr\xECnh duy\u1EC7t web (m\u1ECDi thao t\xE1c)",
      browser_navigate: "M\u1EDF m\u1ED9t trang trong tr\xECnh duy\u1EC7t",
      computer_use: "\u0110i\u1EC1u khi\u1EC3n m\xE1y t\xEDnh",
      cronjob_manage: "Qu\u1EA3n l\xFD l\u1ECBch ch\u1EA1y t\u1EF1 \u0111\u1ED9ng",
      clarify: "H\u1ECFi l\u1EA1i \u0111\u1EC3 l\xE0m r\xF5",
      delegate_task: "Nh\u1EDD tr\u1EE3 l\xFD ph\u1EE5 l\xE0m gi\xFAp",
      image_generate: "T\u1EA1o h\xECnh \u1EA3nh",
      text_to_speech: "Chuy\u1EC3n ch\u1EEF th\xE0nh gi\u1ECDng n\xF3i",
      video_analyze: "Ph\xE2n t\xEDch video",
      video_generate: "T\u1EA1o video",
      "kanban_*": "Th\u1EBB c\xF4ng vi\u1EC7c (m\u1ECDi thao t\xE1c)",
      kanban_comment: "B\xECnh lu\u1EADn tr\xEAn th\u1EBB c\xF4ng vi\u1EC7c",
      kanban_complete: "Ho\xE0n t\u1EA5t th\u1EBB c\xF4ng vi\u1EC7c",
      kanban_create: "T\u1EA1o th\u1EBB c\xF4ng vi\u1EC7c",
      kanban_heartbeat: "B\xE1o v\u1EABn \u0111ang l\xE0m m\u1ED9t th\u1EBB c\xF4ng vi\u1EC7c",
      kanban_show: "Xem th\u1EBB c\xF4ng vi\u1EC7c",
      memory: "D\xF9ng b\u1ED9 nh\u1EDB",
      "poclip_*": "C\xF4ng c\u1EE5 qu\u1EA3n tr\u1ECB c\xF4ng ty (m\u1ECDi thao t\xE1c)",
      poclip_alert_chairman: "B\xE1o \u0111\u1ED9ng cho Ch\u1EE7 t\u1ECBch",
      poclip_decide_delegated: "Quy\u1EBFt \u0111\u1ECBnh thay Ch\u1EE7 t\u1ECBch (theo \u1EE7y quy\u1EC1n)",
      poclip_emit_event: "Ph\xE1t m\u1ED9t s\u1EF1 ki\u1EC7n n\u1ED9i b\u1ED9",
      poclip_escalate_incident: "B\xE1o s\u1EF1 c\u1ED1 l\xEAn c\u1EA5p tr\xEAn",
      poclip_freeze_agent: "T\u1EA1m d\u1EEBng m\u1ED9t nh\xE2n vi\xEAn",
      poclip_provider_control: "\u0110i\u1EC1u khi\u1EC3n nh\xE0 cung c\u1EA5p m\xF4 h\xECnh",
      poclip_report_concern: "B\xE1o m\u1ED9t \u0111i\u1EC1u \u0111\xE1ng lo",
      poclip_self_heal: "T\u1EF1 kh\u1EAFc ph\u1EE5c s\u1EF1 c\u1ED1 h\u1EC7 th\u1ED1ng",
      send_message: "G\u1EEDi tin nh\u1EAFn",
      session_search: "T\xECm trong c\xE1c phi\xEAn l\xE0m vi\u1EC7c c\u0169",
      skill_manage: "Qu\u1EA3n l\xFD k\u1EF9 n\u0103ng",
      skill_view: "Xem m\u1ED9t k\u1EF9 n\u0103ng",
      skills_list: "Li\u1EC7t k\xEA k\u1EF9 n\u0103ng",
      todo_list: "Ghi danh s\xE1ch vi\u1EC7c c\u1EA7n l\xE0m",
      tool_describe: "\u0110\u1ECDc m\xF4 t\u1EA3 c\xF4ng c\u1EE5",
      "group:terminal": "Nh\xF3m c\xF4ng c\u1EE5 ch\u1EA1y l\u1EC7nh",
      "group:web": "Nh\xF3m c\xF4ng c\u1EE5 web",
      "group:plugins": "Nh\xF3m c\xF4ng c\u1EE5 c\xE0i th\xEAm",
      "group:messaging": "Nh\xF3m c\xF4ng c\u1EE5 nh\u1EAFn tin",
      "group:kanban": "Nh\xF3m c\xF4ng c\u1EE5 th\u1EBB c\xF4ng vi\u1EC7c"
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
  var SEARCH_FROM = 12;
  var hintStyle = {
    fontSize: "0.78em",
    color: "var(--color-muted-foreground)",
    marginTop: 2
  };
  function SearchSelect({ name, value, options, placeholder, customLabel, noMatch, disabled, onPick }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const boxRef = react_shim_default.useRef(null);
    react_shim_default.useEffect(() => {
      if (!open) return;
      const close = (e) => {
        if (boxRef.current && !boxRef.current.contains(e.target)) {
          setOpen(false);
          setQuery("");
        }
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [open]);
    const selected = options.find((o) => o.value === value);
    const q = query.trim().toLowerCase();
    const shown = q === "" ? options : options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
    const rows = [...shown, { value: CUSTOM_SENTINEL, label: customLabel }];
    function pick(v) {
      onPick(v);
      setOpen(false);
      setQuery("");
    }
    function onKey(e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setActive((a) => Math.min(a + 1, rows.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        if (open && rows[active]) {
          e.preventDefault();
          pick(rows[active].value);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { ref: boxRef, style: { position: "relative" } }, /* @__PURE__ */ react_shim_default.createElement(
      Input,
      {
        value: open ? query : selected?.label ?? "",
        onChange: (e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        },
        onFocus: () => {
          setOpen(true);
          setActive(0);
        },
        onClick: () => setOpen(true),
        onKeyDown: onKey,
        placeholder: open && selected ? selected.label : placeholder,
        disabled,
        autoComplete: "off",
        role: "combobox",
        "aria-expanded": open,
        "data-choice-search": name,
        style: { paddingRight: "1.75rem", cursor: "pointer" }
      }
    ), /* @__PURE__ */ react_shim_default.createElement("span", { "aria-hidden": "true", style: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.7, fontSize: "0.8em" } }, "\u25BE"), open && /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        role: "listbox",
        style: {
          position: "absolute",
          zIndex: 30,
          left: 0,
          right: 0,
          top: "calc(100% + 2px)",
          maxHeight: 260,
          overflowY: "auto",
          background: "var(--color-card, #0b1f1f)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)"
        }
      },
      shown.length === 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...hintStyle, padding: "0.5rem 0.75rem", marginTop: 0 } }, noMatch),
      rows.map((o, i) => /* @__PURE__ */ react_shim_default.createElement(
        "div",
        {
          key: o.value,
          role: "option",
          "aria-selected": o.value === value,
          onMouseDown: (e) => {
            e.preventDefault();
            pick(o.value);
          },
          onMouseEnter: () => setActive(i),
          style: {
            padding: "0.4rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.9em",
            background: i === active ? "var(--color-accent, rgba(255,255,255,0.1))" : "transparent",
            fontWeight: o.value === value ? 700 : 400,
            ...o.value === CUSTOM_SENTINEL ? { borderTop: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" } : {}
          }
        },
        o.label
      ))
    ));
  }
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
      mode === "select" && effectiveOptions.length > SEARCH_FROM && /* Danh sách dài (hơn 12 mục): MỘT ô duy nhất — bấm vào là mở danh sách, gõ ngay trong ô để lọc */
      /* @__PURE__ */ react_shim_default.createElement(
        SearchSelect,
        {
          name,
          value,
          options: effectiveOptions,
          placeholder,
          customLabel: resolvedCustomLabel,
          noMatch: t.policyPage.noMatch,
          disabled,
          onPick: (v) => handleSelectChange(v)
        }
      ),
      mode === "select" && effectiveOptions.length <= SEARCH_FROM && /* @__PURE__ */ react_shim_default.createElement(
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
  function InfoHint({ children, wide, alignRight }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const box = useRef(null);
    useEffect(() => {
      if (!open) return;
      const onDown = (e) => {
        if (box.current && !box.current.contains(e.target)) setOpen(false);
      };
      const onKey = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);
    return /* @__PURE__ */ react_shim_default.createElement("span", { ref: box, style: { position: "relative", display: "inline-flex", alignItems: "center", lineHeight: 1, marginLeft: alignRight ? "auto" : "0.4rem", verticalAlign: "0.12em", fontWeight: 400, textTransform: "none", letterSpacing: "normal" }, "data-info-hint": "1" }, /* @__PURE__ */ react_shim_default.createElement(
      "button",
      {
        type: "button",
        "aria-label": t.policyPage.hintLabel,
        "aria-expanded": open,
        title: t.policyPage.hintLabel,
        onClick: () => setOpen((v) => !v),
        style: {
          width: 18,
          height: 18,
          padding: 0,
          borderRadius: "50%",
          cursor: "pointer",
          lineHeight: "16px",
          fontSize: "0.72rem",
          fontWeight: 700,
          border: "1.5px solid var(--color-muted-foreground)",
          color: open ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
          background: open ? "var(--color-primary)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center"
        }
      },
      "?"
    ), open && /* @__PURE__ */ react_shim_default.createElement(
      "span",
      {
        role: "note",
        style: {
          position: "absolute",
          top: "calc(100% + 6px)",
          ...alignRight ? { right: 0 } : { left: 0 },
          zIndex: 60,
          width: wide ? "min(36rem, 80vw)" : "min(26rem, 80vw)",
          padding: "0.7rem 0.9rem",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
          background: "var(--color-card)",
          color: "var(--color-foreground)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          fontSize: "0.88rem",
          lineHeight: 1.5,
          textAlign: "left",
          whiteSpace: "normal"
        }
      },
      children
    ));
  }
  function FormAlert({ toast }) {
    const t = useT();
    if (!toast || !toast.error) return null;
    return /* @__PURE__ */ react_shim_default.createElement(
      "div",
      {
        role: "alert",
        "data-form-alert": "1",
        style: {
          margin: "0.6rem 0",
          padding: "0.55rem 0.9rem",
          borderRadius: 6,
          border: "1px solid var(--color-destructive)",
          color: "var(--color-destructive)",
          background: "color-mix(in srgb, var(--color-destructive) 10%, transparent)"
        }
      },
      /* @__PURE__ */ react_shim_default.createElement("strong", null, t.policyPage.formErrorTitle, ": "),
      toast.text
    );
  }
  function scrollToCard(cardName) {
    setTimeout(() => {
      try {
        document.querySelector(`[data-policy-card="${cardName}"]`)?.scrollIntoView({ block: "start" });
      } catch {
      }
    }, 80);
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
    if (typeof v === "number") return String(v);
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
/* \xD4 gi\u1EDD/ng\xE0y: bi\u1EC3u t\u01B0\u1EE3ng \u0111\u1ED3ng h\u1ED3/l\u1ECBch m\u1EB7c \u0111\u1ECBnh c\u1EE7a tr\xECnh duy\u1EC7t m\xE0u \u0111en n\xEAn kh\xF4ng th\u1EA5y tr\xEAn n\u1EC1n t\u1ED1i (v\xE0 \xABcolor-scheme\xBB/\xABfilter\xBB cho k\u1EBFt qu\u1EA3 kh\xE1c nhau gi\u1EEFa c\xE1c b\u1EA3n Chrome/Edge).
   V\u1EBD l\u1EA1i b\u1EB1ng h\xECnh ri\xEAng m\xE0u kem s\xE1ng (c\xF9ng m\xE0u ch\u1EEF c\u1EE7a giao di\u1EC7n) \u0111\u1EC3 ch\u1EAFc ch\u1EAFn th\u1EA5y r\xF5 \u1EDF m\u1ECDi tr\xECnh duy\u1EC7t d\u1EF1a tr\xEAn Chromium. */
[data-poclip-fields] input[type="time"]::-webkit-calendar-picker-indicator {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffe6cb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7v5l3 2'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: center; background-size: 18px 18px; opacity: 1; filter: none; cursor: pointer;
}
[data-poclip-fields] input[type="date"]::-webkit-calendar-picker-indicator,
[data-poclip-fields] input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffe6cb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='16' rx='2'/%3E%3Cpath d='M16 3v4M8 3v4M3 10h18'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: center; background-size: 18px 18px; opacity: 1; filter: none; cursor: pointer;
}
/* Nh\xE3n \xF4 nh\u1EADp: ch\u1EEF th\u01B0\u1EDDng, r\xF5 n\xE9t \u2014 ki\u1EC3u \xABVI\u1EBET HOA CH\u1EEE NH\u1ECE GI\xC3N CH\u1EEE\xBB c\u1EE7a khung chung r\u1EA5t kh\xF3 \u0111\u1ECDc v\u1EDBi ti\u1EBFng Vi\u1EC7t c\xF3 d\u1EA5u */
[data-poclip-fields] label {
  text-transform: none !important; letter-spacing: normal !important; font-size: 0.92rem !important; font-weight: 600 !important;
  display: inline-block; margin-bottom: 0.2rem;
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

  // src/lib/tool-labels.ts
  function toolLabel(t, code) {
    const m = t.toolNames;
    return code && m[code] || "";
  }
  function toolWithCode(t, code) {
    const l = toolLabel(t, code);
    return l ? `${l} (${code})` : code;
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
    const groupSuffix = t.choiceField.groupSuffix;
    const groupOpts = SYSTEM_TOOL_GROUPS.filter((g) => !seen.has(g)).map((g) => ({
      value: g,
      label: toolLabel(t, g) ? toolWithCode(t, g) : `${g} ${groupSuffix}`
    }));
    const opts = [...patterns.map((p) => ({ value: p, label: toolWithCode(t, p) })), ...groupOpts];
    opts.sort((a, b) => a.label.localeCompare(b.label, "vi"));
    return opts;
  }
  function channelLabel(t, code) {
    return t.channelConnections.platforms[code] ?? code;
  }
  function buildChannelOptions(t, existingChannels) {
    const boundSet = new Set(existingChannels);
    const boundSuffix = t.choiceField.channelBoundSuffix;
    const extra = existingChannels.filter((ch) => !CHANNEL_PLATFORMS.includes(ch));
    return [...CHANNEL_PLATFORMS, ...extra].map((ch) => ({
      value: ch,
      label: boundSet.has(ch) ? `${channelLabel(t, ch)} ${boundSuffix}` : channelLabel(t, ch)
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
      result.sort((a, b) => a.label.localeCompare(b.label, "vi"));
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
  function friendlyTarget(t, policyType, key) {
    const i = key.indexOf("|");
    if (i < 0) return policyType === "sandbox" || policyType === "channel_binding" ? scopeLabel(t, key) : key;
    const who = key.slice(0, i);
    const what = key.slice(i + 1);
    return `${scopeLabel(t, who)} \xB7 ${toolLabel(t, what) || what}`;
  }
  var ACTOR = { "X-Poclip-Actor": FALLBACK_ACTOR };
  function notifyPolicySuggestionsChanged() {
    try {
      window.dispatchEvent(new Event("policy-suggestions-changed"));
    } catch {
    }
  }
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
    const notePrefix = policyType === "tool_policy" ? "tool_policy." : policyType === "sandbox" ? "sandbox." : policyType === "a2a_grant" ? "a2a." : "channel.";
    const notes = (data?.notes ?? []).filter((n) => String(n.code ?? "").startsWith(notePrefix));
    const [open, setOpen] = useState(false);
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
        notifyPolicySuggestionsChanged();
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
        notifyPolicySuggestionsChanged();
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
        notifyPolicySuggestionsChanged();
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
        notifyPolicySuggestionsChanged();
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
        notifyPolicySuggestionsChanged();
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
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("strong", null, sugg.blockTitle), pending > 0 && /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, sugg.collapsedHint), /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)", fontSize: "0.9em" } }, sugg.pendingCount(pending)), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-count": true, style: { display: "none" } }, pending)),
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" } }, items.length > 0 && /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-toggle-list": true }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", ghost: true, onClick: () => setOpen((v) => !v) }, open ? sugg.btnCollapse : sugg.btnExpand(items.filter((i) => i.status === "draft").length || items.length))), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-generate": true }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: handleGenerate, disabled: generating }, generating ? t.common.saving : sugg.btnGenerate)), /* @__PURE__ */ react_shim_default.createElement("span", { "data-sugg-approve-all": true }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), loading && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-muted-foreground)", fontSize: "0.9em" } }, t.common.loading), error && !loading && /* @__PURE__ */ react_shim_default.createElement("div", { style: noticeStyle("error") }, error), !loading && !error && items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), fontSize: "0.9em" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, sugg.empty), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem", color: "var(--color-muted-foreground)" } }, sugg.emptyHint)), !open && !loading && !error && pending > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-muted-foreground)", fontSize: "0.88em" }, "data-sugg-collapsed-hint": true }, sugg.collapsedHint), open && !loading && !error && items.some((i) => i.status !== "draft") && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.6rem" } }, pending === 0 && /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)", fontSize: "0.88em" } }, sugg.noPending), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", ghost: true, onClick: () => setShowDecided((v) => !v), "data-sugg-toggle-decided": true }, showDecided ? sugg.hideDecided : sugg.showDecided(items.filter((i) => i.status !== "draft").length))), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { as: "list", pageSize: 10, items: open ? items.filter((item) => item.status === "draft" || showDecided) : [], render: (item) => /* @__PURE__ */ react_shim_default.createElement(
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
        /* @__PURE__ */ react_shim_default.createElement("strong", { style: { fontSize: "0.95em" }, title: item.target_key }, friendlyTarget(t, policyType, item.target_key)),
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
  function ToolPolicyTab({ initialProfile: initialProfile2, showTester } = {}) {
    const t = useT();
    const tp = t.toolPolicy;
    const c = t.common;
    const { toast, show } = useToast();
    const [profileFilter, setProfileFilter] = useState(initialProfile2 || "");
    const qs = profileFilter ? `?profile_id=${encodeURIComponent(profileFilter)}` : "";
    const { data, refetch } = usePoclipFetch(`/api/policy/tool-policies${qs}`, [profileFilter]);
    const [pendingNotice, setPendingNotice] = useState(null);
    const [statusFilter, setStatusFilter] = useState("active");
    const [actionFilter, setActionFilter] = useState("");
    const [search, setSearch] = useState("");
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
      scrollToCard("tool-policy-edit");
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
    const allRules = data?.items ?? [];
    const needle = search.trim().toLowerCase();
    const shownRules = allRules.filter((r) => {
      if (statusFilter === "active" && !r.active) return false;
      if (statusFilter === "inactive" && r.active) return false;
      if (actionFilter && r.policy_action !== actionFilter) return false;
      if (needle) {
        const hay = `${scopeLabel(t, r.profile_id)} ${r.tool_pattern} ${toolLabel(t, r.tool_pattern)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const cleanReason = (txt) => txt.replace(/\bTool\b/g, "C\xF4ng c\u1EE5").replace(/,?\s*rule [0-9a-f-]{20,}/gi, "").replace(/\ballow\b/g, "cho ph\xE9p").replace(/\bdeny\b/g, "c\u1EA5m").replace(/\s*\(scope=[^)]*\)/g, "").replace(/\s+bởi\s*$/, "");
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
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.filterStatus), /* @__PURE__ */ react_shim_default.createElement(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v === "inactive" ? "inactive" : v === "all" ? "all" : "active"), style: { minWidth: 150 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "active" }, tp.statusActive), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "inactive" }, tp.statusInactive), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "all" }, tp.statusAll))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.filterAction), /* @__PURE__ */ react_shim_default.createElement(Select, { value: actionFilter, onValueChange: setActionFilter, style: { minWidth: 130 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "" }, c.all), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "allow" }, resolveLabelOrCode(t, "toolPolicyAction", "allow")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "deny" }, resolveLabelOrCode(t, "toolPolicyAction", "deny")))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.filterSearch), /* @__PURE__ */ react_shim_default.createElement(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: tp.searchPlaceholder, style: { minWidth: 240 }, "data-tool-policy-search": "1" }))), data && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.85em", marginTop: -6 }, "data-tool-policy-count": "1" }, tp.countLine(shownRules.length, allRules.length)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-policy" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [tp.colProfileId, tp.colToolPattern, tp.colAction, tp.colPriority, tp.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !data && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, c.loading)), data && shownRules.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, tp.noRules)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: shownRules, colSpan: 6, render: (r) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: r.id, style: editingId === r.id ? { background: "var(--color-muted)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, title: `${tp.colId}: ${r.id}` }, scopeLabel(t, r.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", null, toolLabel(t, r.tool_pattern) || /* @__PURE__ */ react_shim_default.createElement("code", null, r.tool_pattern)), toolLabel(t, r.tool_pattern) && /* @__PURE__ */ react_shim_default.createElement("code", { style: { fontSize: "0.78em", opacity: 0.75 } }, r.tool_pattern)), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "toolPolicyAction", code: r.policy_action, strong: true })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, title: `${tp.colScope}: ${resolveLabelOrCode(t, "toolPolicyScope", r.scope)}` }, r.layer_priority), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: r.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => openEdit(r), disabled: saving || editingId !== null && editingId !== r.id }, c.edit), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => deleteRule(r), disabled: saving }, c.disable)))) })))), pendingNotice && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("warning"), padding: "0.75rem 1rem" } }, tp.pendingT2Notice(pendingNotice)), editingId !== null && /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-policy-edit", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, tp.editTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginBottom: "0.5rem", fontSize: "0.9em", color: "var(--color-muted-foreground)" } }, /* @__PURE__ */ react_shim_default.createElement("span", null, tp.colProfileId, ": "), /* @__PURE__ */ react_shim_default.createElement("strong", null, scopeLabel(t, editingProfileId))), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelPolicyAction), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.policy_action, onValueChange: (v) => setEditForm({ ...editForm, policy_action: v }), style: { minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "allow" }, resolveLabelOrCode(t, "toolPolicyAction", "allow")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "deny" }, resolveLabelOrCode(t, "toolPolicyAction", "deny")), editForm.policy_action && !["allow", "deny"].includes(editForm.policy_action) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: editForm.policy_action }, resolveLabelOrCode(t, "toolPolicyAction", editForm.policy_action)))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelLayerPriority, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, tp.priorityHint)), /* @__PURE__ */ react_shim_default.createElement(Input, { type: "number", value: editForm.layer_priority, onChange: (e) => setEditForm({ ...editForm, layer_priority: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelActive), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.active, onValueChange: (v) => setEditForm({ ...editForm, active: v }), style: { minWidth: 100 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "1" }, resolveLabelOrCode(t, "active", "1")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "0" }, resolveLabelOrCode(t, "active", "0")))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: editForm.note, onChange: (e) => setEditForm({ ...editForm, note: e.target.value }), placeholder: tp.notePlaceholder })), /* @__PURE__ */ react_shim_default.createElement("details", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", ...mutedTextStyle, fontSize: "0.85em" } }, tp.scopeAdvanced), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelScope, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, tp.scopeHint)), /* @__PURE__ */ react_shim_default.createElement(Select, { value: editForm.scope, onValueChange: (v) => setEditForm({ ...editForm, scope: v }), style: { minWidth: 140 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "agent" }, resolveLabelOrCode(t, "toolPolicyScope", "agent")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "provider" }, resolveLabelOrCode(t, "toolPolicyScope", "provider")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "profile" }, resolveLabelOrCode(t, "toolPolicyScope", "profile")), editForm.scope && !["agent", "provider", "profile"].includes(editForm.scope) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: editForm.scope }, resolveLabelOrCode(t, "toolPolicyScope", editForm.scope)))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: saveEdit, disabled: saving }, saving ? c.saving : c.save), /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: cancelEdit, disabled: saving }, c.cancel))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-policy-add", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, tp.addTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelPolicyAction), /* @__PURE__ */ react_shim_default.createElement(Select, { value: addForm.policy_action, onValueChange: (v) => setAddForm({ ...addForm, policy_action: v }), style: { minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "allow" }, resolveLabelOrCode(t, "toolPolicyAction", "allow")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "deny" }, resolveLabelOrCode(t, "toolPolicyAction", "deny")), addForm.policy_action && !["allow", "deny"].includes(addForm.policy_action) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: addForm.policy_action }, resolveLabelOrCode(t, "toolPolicyAction", addForm.policy_action)))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelLayerPriority, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, tp.priorityHint)), /* @__PURE__ */ react_shim_default.createElement(Input, { type: "number", value: addForm.layer_priority, onChange: (e) => setAddForm({ ...addForm, layer_priority: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: addForm.note, onChange: (e) => setAddForm({ ...addForm, note: e.target.value }), placeholder: tp.notePlaceholder })), /* @__PURE__ */ react_shim_default.createElement("details", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", ...mutedTextStyle, fontSize: "0.85em" } }, tp.scopeAdvanced), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, tp.labelScope, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, tp.scopeHint)), /* @__PURE__ */ react_shim_default.createElement(Select, { value: addForm.scope, onValueChange: (v) => setAddForm({ ...addForm, scope: v }), style: { minWidth: 140 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "agent" }, resolveLabelOrCode(t, "toolPolicyScope", "agent")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "provider" }, resolveLabelOrCode(t, "toolPolicyScope", "provider")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "profile" }, resolveLabelOrCode(t, "toolPolicyScope", "profile")), addForm.scope && !["agent", "provider", "profile"].includes(addForm.scope) && /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: addForm.scope }, resolveLabelOrCode(t, "toolPolicyScope", addForm.scope)))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: createRule, disabled: adding }, adding ? c.saving : c.add))), showTester !== false && /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-policy-preview", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, tp.previewTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...formGrid, marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(
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
    )), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: preview }, tp.previewBtn), pvResult && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", ...noticeStyle(pvResult.allowed ? "success" : "error") } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("strong", null, pvResult.allowed ? tp.previewAllowed : tp.previewDenied), " \u2014 ", tp.previewResultFor(scopeLabel(t, pv.profile_id), toolLabel(t, pv.tool_name) || pv.tool_name)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem" } }, cleanReason(pvResult.reason || "")), pvResult.matched_rule && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.4rem", fontSize: "0.85em", color: "var(--color-muted-foreground)" } }, tp.previewRuleNote, " ", toolLabel(t, pvResult.matched_rule.tool_pattern) || pvResult.matched_rule.tool_pattern, " (", pvResult.matched_rule.tool_pattern, ")"))));
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
  function hasAdvancedOps(c) {
    return (c?.items ?? []).some((it) => !COND_OPS.includes(it.op));
  }
  var WILDCARD = /[*?\[\]]/;
  var TIER_RANK = { T3: 3, T2: 2, T1: 1 };
  function normalizedConditionsKey(r) {
    let s = JSON.stringify(r.conditions ?? {});
    const p = r.profile_id;
    if (p && p.length >= 3 && !WILDCARD.test(p)) s = s.split(p).join("{agent}");
    return s;
  }
  function groupRules(rules) {
    const map = /* @__PURE__ */ new Map();
    for (const r of rules) {
      const key = JSON.stringify([r.tool_pattern, r.risk_tier, r.valid_hours, r.note ?? "", r.active, normalizedConditionsKey(r)]);
      let g = map.get(key);
      if (!g) {
        g = { key, sample: r, rules: [], agents: [], activeCount: 0 };
        map.set(key, g);
      }
      g.rules.push(r);
      if (!g.agents.includes(r.profile_id)) g.agents.push(r.profile_id);
      if (r.active) g.activeCount += 1;
    }
    return [...map.values()].sort((a, b) => (TIER_RANK[b.sample.risk_tier] ?? 0) - (TIER_RANK[a.sample.risk_tier] ?? 0) || b.rules.length - a.rules.length);
  }
  function clipText(s, max) {
    return s.length > max ? s.slice(0, max).trimEnd() + "\u2026" : s;
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
    active: "1",
    advanced: false
  });
  var WHEN_CLIP = 160;
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
  function ToolApprovalTab({ showTester } = {}) {
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
    const [pv, setPv] = useState({ profile_id: "", tool_name: "", args: "", command: "", path: "" });
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
        active: String(r.active),
        advanced: hasAdvancedOps(r.conditions)
      });
      scrollToCard("tool-approval-form");
    }
    function setRow(i, patch) {
      setForm((f) => ({ ...f, rows: f.rows.map((r, k) => k === i ? { ...r, ...patch } : r) }));
    }
    async function save() {
      if (!form.profile_id || !form.tool_pattern.trim()) {
        show(ta.errRequired, true);
        return;
      }
      const rowErr = form.advanced ? null : validateRows(form.rows);
      if (rowErr) {
        show({ field: ta.errField, value: ta.errValue, number: ta.errNumber, tooMany: ta.errTooMany }[rowErr], true);
        return;
      }
      const hours = validHours(form.valid_hours);
      if (hours === null) {
        show(ta.errHours, true);
        return;
      }
      if (editingId && !await confirmDialog({ message: ta.confirmSave(form.profile_id === "*" ? ta.allAgents : scopeLabel(t, form.profile_id), toolLabel(t, form.tool_pattern.trim()) || form.tool_pattern.trim()) })) return;
      const payload = {
        profile_id: form.profile_id,
        tool_pattern: form.tool_pattern.trim(),
        // Luật có phép so sánh của hệ thống: KHÔNG gửi điều kiện — máy chủ giữ nguyên điều kiện cũ khi bỏ trống (PUT gộp với bản hiện có).
        ...form.advanced ? {} : { conditions: conditionsFromRows(form.mode, form.rows) },
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
        let parsed;
        try {
          parsed = JSON.parse(pv.args);
        } catch {
          show(ta.previewBadJson, true);
          return;
        }
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          show(ta.previewBadJson, true);
          return;
        }
        args = parsed;
      }
      if (pv.command.trim()) args = { command: pv.command.trim(), ...args };
      if (pv.path.trim()) args = { path: pv.path.trim(), ...args };
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
    const groups = groupRules(rules);
    function toolCell(code) {
      const label = toolLabel(t, code);
      return label ? /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement("div", null, label), /* @__PURE__ */ react_shim_default.createElement("code", { style: { fontSize: "0.78em", opacity: 0.75 } }, code)) : /* @__PURE__ */ react_shim_default.createElement("code", null, code);
    }
    function whenCell(r) {
      const full = describeConditions(r.conditions, describeTexts);
      if (full.length <= WHEN_CLIP) return full;
      return /* @__PURE__ */ react_shim_default.createElement("details", null, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer" } }, clipText(full, WHEN_CLIP)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.3rem", maxHeight: 260, overflowY: "auto", wordBreak: "break-word", fontSize: "0.85em" } }, full));
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, ta.title, /* @__PURE__ */ react_shim_default.createElement("span", { "data-policy-card": "tool-approval-intro" }, /* @__PURE__ */ react_shim_default.createElement(InfoHint, { wide: true }, /* @__PURE__ */ react_shim_default.createElement("div", null, ta.intro), /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontWeight: 600, marginTop: "0.5rem" } }, ta.howTitle), /* @__PURE__ */ react_shim_default.createElement("ol", { style: { margin: "0.25rem 0 0", paddingLeft: "1.25rem" } }, ta.howItems.map((s) => /* @__PURE__ */ react_shim_default.createElement("li", { key: s }, s)))))), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => {
      refetchRules();
      refetchReqs();
    } }, c.refresh)), /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: 0 } }, ta.summaryTitle, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, ta.summaryHint)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-approval-summary" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [ta.colReason, ta.colTool, ta.colApprover, ta.colPermit, ta.colAppliesTo, ta.colActive].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !rulesData && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, c.loading)), rulesData && groups.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, ta.noRules)), groups.map((g) => {
      const r = g.sample;
      const n = g.rules.length;
      const full = describeConditions(r.conditions, describeTexts);
      return /* @__PURE__ */ react_shim_default.createElement("tr", { key: g.key, "data-rule-group": "1" }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", null, r.note || clipText(full, WHEN_CLIP)), /* @__PURE__ */ react_shim_default.createElement("details", { style: { marginTop: "0.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", ...mutedTextStyle, fontSize: "0.82em" } }, ta.showDetail), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.3rem", maxHeight: 260, overflowY: "auto", wordBreak: "break-word", fontSize: "0.82em" } }, full))), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, toolCell(r.tool_pattern)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, tierLabel(r.risk_tier)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, ta.permitHours(r.valid_hours)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", null, r.profile_id === "*" && g.agents.length === 1 ? ta.allAgents : ta.appliesCount(g.agents.length)), g.agents.length > 1 || r.profile_id !== "*" ? /* @__PURE__ */ react_shim_default.createElement("details", { style: { marginTop: "0.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", ...mutedTextStyle, fontSize: "0.82em" } }, ta.showWho), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.3rem", maxHeight: 200, overflowY: "auto", fontSize: "0.82em" } }, g.agents.map((a) => /* @__PURE__ */ react_shim_default.createElement("div", { key: a }, a === "*" ? ta.allAgents : scopeLabel(t, a))))) : null), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, g.activeCount === n ? ta.allOn : ta.someOn(g.activeCount, n)));
    })))), /* @__PURE__ */ react_shim_default.createElement("details", { "data-policy-card": "tool-approval-flat" }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", fontWeight: 600, margin: "0.25rem 0 0.5rem" } }, ta.flatTitle(rules.length)), /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: 0 } }, ta.rulesTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-approval-rules" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [ta.colApplies, ta.colTool, ta.colWhen, ta.colApprover, ta.colPermit, ta.colNote, ta.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !rulesData && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, c.loading)), rulesData && rules.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, ta.noRules)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: rules, colSpan: 8, render: (r) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: r.id, style: editingId === r.id ? { background: "var(--color-muted)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.profile_id === "*" ? ta.allAgents : scopeLabel(t, r.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, toolCell(r.tool_pattern)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, whenCell(r)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, tierLabel(r.risk_tier)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, ta.permitHours(r.valid_hours)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.note || ""), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: r.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => startEdit(r), disabled: saving }, c.edit), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => remove(r), disabled: saving }, c.disable)))) }))))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-approval-form", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, editingId ? ta.editTitle : ta.addTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelTier), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.risk_tier, onValueChange: (v) => setForm({ ...form, risk_tier: v }), style: { minWidth: 220 } }, TIERS.map((tier) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: tier, value: tier }, tierLabel(tier))))), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelHours, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, ta.hoursHint)), /* @__PURE__ */ react_shim_default.createElement(Input, { type: "number", value: form.valid_hours, onChange: (e) => setForm({ ...form, valid_hours: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelNote), /* @__PURE__ */ react_shim_default.createElement(Input, { value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }), placeholder: ta.notePlaceholder })), editingId && /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelActive), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.active, onValueChange: (v) => setForm({ ...form, active: v }), style: { minWidth: 120 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "1" }, resolveLabelOrCode(t, "active", "1")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "0" }, resolveLabelOrCode(t, "active", "0"))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.9rem" }, "data-policy-card": "tool-approval-conditions" }, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.labelWhen, !form.advanced && /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, ta.whenHint)), form.advanced && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("warning"), padding: "0.6rem 0.9rem", margin: "0.3rem 0" }, "data-policy-card": "tool-approval-advanced" }, ta.advancedNote), !form.advanced && form.rows.length > 1 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement("span", null, ta.labelMode), /* @__PURE__ */ react_shim_default.createElement(Select, { value: form.mode, onValueChange: (v) => setForm({ ...form, mode: v === "any" ? "any" : "all" }), style: { minWidth: 220 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "all" }, ta.modeAll), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "any" }, ta.modeAny))), !form.advanced && form.rows.map((row, i) => {
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
    }), !form.advanced && /* @__PURE__ */ react_shim_default.createElement(
      Button,
      {
        size: "sm",
        outlined: true,
        disabled: form.rows.length >= MAX_CONDITIONS,
        onClick: () => setForm({ ...form, rows: [...form.rows, emptyRow()] })
      },
      ta.addCondition
    )), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", marginTop: "0.9rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: save, disabled: saving }, saving ? c.saving : editingId ? c.save : c.add), editingId && /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: startAdd, disabled: saving }, c.cancel))), showTester !== false && /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "tool-approval-preview", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, ta.previewTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...formGrid, marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.previewCommand), /* @__PURE__ */ react_shim_default.createElement(Input, { value: pv.command, placeholder: ta.previewCommandPlaceholder, onChange: (e) => setPv({ ...pv, command: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.previewPath), /* @__PURE__ */ react_shim_default.createElement(Input, { value: pv.path, placeholder: ta.previewPathPlaceholder, onChange: (e) => setPv({ ...pv, path: e.target.value }) })), /* @__PURE__ */ react_shim_default.createElement("details", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", ...mutedTextStyle, fontSize: "0.85em" } }, ta.previewAdvanced), /* @__PURE__ */ react_shim_default.createElement(
      "textarea",
      {
        rows: 3,
        style: { ...textareaStyle, marginTop: "0.4rem" },
        value: pv.args,
        placeholder: ta.previewArgsPlaceholder,
        onChange: (e) => setPv({ ...pv, args: e.target.value })
      }
    ))), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: preview }, ta.previewBtn), pvResult && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", ...noticeStyle(pvResult.requires_approval ? "warning" : "success") }, "data-approval-preview-result": "1" }, /* @__PURE__ */ react_shim_default.createElement("strong", null, pvResult.requires_approval ? ta.previewNeeds(tierLabel(pvResult.rule?.risk_tier ?? "T1")) : ta.previewNot), pvResult.requires_approval && pvResult.rule?.note && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem" } }, ta.previewMatchedRule(pvResult.rule.note)), pvResult.requires_approval && pvResult.rule?.valid_hours ? /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem", fontSize: "0.9em" } }, ta.previewMatchedTier(tierLabel(pvResult.rule.risk_tier), pvResult.rule.valid_hours)) : null)), /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: 0 } }, ta.requestsTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.85em", marginTop: -8 } }, ta.requestsHint), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "tool-approval-requests" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [ta.colTime, ta.colAgent, ta.colAction, ta.colContent, ta.colState, ta.colApprover, ta.colDeadline].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !reqData && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, c.loading)), reqData && requests.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, ta.noRequests)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: requests, colSpan: 7, render: (q) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: q.id }, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, formatDateTime(q.created_at)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, title: q.agent_id }, scopeLabel(t, q.agent_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, toolCell(q.tool_name)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("details", null, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer" } }, ta.showContent), /* @__PURE__ */ react_shim_default.createElement("pre", { style: { margin: "0.3rem 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 420, fontSize: "0.82em" } }, q.args_preview))), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, /* @__PURE__ */ react_shim_default.createElement(Badge, { tone: STATE_TONE[q.state] ?? "secondary", style: { whiteSpace: "nowrap" } }, ta.states[q.state] ?? q.state)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, tierLabel(q.risk_tier)), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, minWidth: 170, maxWidth: 320 } }, q.decided_at ? formatDateTime(q.decided_at) : q.sla_deadline ? formatDateTime(q.sla_deadline) : "", q.decision_reason ? /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.82em" } }, q.decision_reason) : null)) })))));
  }

  // src/pages/PolicyConfig/PermissionsTab.tsx
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
  function PermissionsTab({ initialProfile: initialProfile2, initialSegment } = {}) {
    const t = useT();
    const pm = t.permissions;
    const ta = t.toolApproval;
    const tp = t.toolPolicy;
    const { toast, show } = useToast();
    const [segment, setSegment] = useState(initialSegment ?? "policy");
    const scopeOptions = useOrgScopeOptions();
    const toolOptions = useToolPatternOptions();
    const [who, setWho] = useState("");
    const [tool, setTool] = useState("");
    const [command, setCommand] = useState("");
    const [path, setPath] = useState("");
    const [advanced, setAdvanced] = useState("");
    const [verdict, setVerdict] = useState(null);
    const [busy, setBusy] = useState(false);
    const tierLabel = (tier) => ta.tiers[tier] ?? tier;
    const cleanReason = (txt) => txt.replace(/\bTool\b/g, "C\xF4ng c\u1EE5").replace(/,?\s*rule [0-9a-f-]{20,}/gi, "").replace(/\ballow\b/g, "cho ph\xE9p").replace(/\bdeny\b/g, "c\u1EA5m").replace(/\s*\(scope=[^)]*\)/g, "").replace(/\s+bởi\s*$/, "");
    async function check() {
      if (!who || !tool) {
        show(pm.errRequired, true);
        return;
      }
      let args = {};
      if (advanced.trim()) {
        let parsed;
        try {
          parsed = JSON.parse(advanced);
        } catch {
          show(ta.previewBadJson, true);
          return;
        }
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          show(ta.previewBadJson, true);
          return;
        }
        args = parsed;
      }
      if (command.trim()) args = { command: command.trim(), ...args };
      if (path.trim()) args = { path: path.trim(), ...args };
      setBusy(true);
      try {
        const pol = await poclipMutate("/api/policy/tool-policies/preview", "POST", { profile_id: who, tool_name: tool });
        if (!pol.allowed) {
          setVerdict({ kind: "denied", reason: cleanReason(pol.reason ?? "") });
          return;
        }
        const ap = await poclipMutate(
          "/api/policy/tool-approval-rules/preview",
          "POST",
          { profile_id: who, tool_name: tool, args }
        );
        if (ap.requires_approval) {
          setVerdict({ kind: "needs", reason: "", note: ap.rule?.note, approver: tierLabel(ap.rule?.risk_tier ?? "T1"), hours: ap.rule?.valid_hours });
        } else {
          setVerdict({ kind: "free", reason: cleanReason(pol.reason ?? "") });
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setBusy(false);
      }
    }
    const tone = verdict?.kind === "denied" ? "error" : verdict?.kind === "needs" ? "warning" : "success";
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "permissions-tester", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, pm.testerTitle, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, pm.testerHint)), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...formGrid, marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "perm-test-agent",
        label: tp.previewLabelProfile,
        value: who,
        onChange: setWho,
        options: scopeOptions.filter((o) => !/^(unit|role):/.test(o.value)),
        placeholder: tp.previewProfilePlaceholder,
        emptyHint: t.choiceField.emptyHintPersonnel
      }
    ), /* @__PURE__ */ react_shim_default.createElement(
      ChoiceField,
      {
        name: "perm-test-tool",
        label: tp.previewLabelTool,
        value: tool,
        onChange: setTool,
        options: toolOptions,
        placeholder: tp.toolPatternPlaceholder,
        emptyHint: t.choiceField.emptyHintTools
      }
    ), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.previewCommand), /* @__PURE__ */ react_shim_default.createElement(Input, { value: command, placeholder: ta.previewCommandPlaceholder, onChange: (e) => setCommand(e.target.value) })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, ta.previewPath), /* @__PURE__ */ react_shim_default.createElement(Input, { value: path, placeholder: ta.previewPathPlaceholder, onChange: (e) => setPath(e.target.value) })), /* @__PURE__ */ react_shim_default.createElement("details", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", ...mutedTextStyle, fontSize: "0.85em" } }, ta.previewAdvanced), /* @__PURE__ */ react_shim_default.createElement("textarea", { rows: 3, style: { ...textareaStyle2, marginTop: "0.4rem" }, value: advanced, placeholder: ta.previewArgsPlaceholder, onChange: (e) => setAdvanced(e.target.value) }))), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: check, disabled: busy }, pm.btnTest), verdict && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", ...noticeStyle(tone) }, "data-permission-verdict": verdict.kind }, /* @__PURE__ */ react_shim_default.createElement("strong", null, verdict.kind === "denied" ? pm.resultDenied : verdict.kind === "needs" ? pm.resultNeeds(verdict.approver ?? "") : pm.resultFree), /* @__PURE__ */ react_shim_default.createElement("span", null, " \u2014 ", tp.previewResultFor(scopeLabel(t, who), toolLabel(t, tool) || tool)), verdict.reason && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem" } }, verdict.reason), verdict.kind === "needs" && verdict.note && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem" } }, pm.ruleLine(verdict.note)), verdict.kind === "needs" && verdict.hours ? /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.25rem", fontSize: "0.9em" } }, ta.previewMatchedTier(verdict.approver ?? "", verdict.hours)) : null)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem", flexWrap: "wrap" }, "data-permissions-segments": "1" }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: segment !== "policy", onClick: () => setSegment("policy") }, t.tabs.toolPolicy), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: segment !== "approval", onClick: () => setSegment("approval") }, t.tabs.toolApproval)), segment === "policy" ? /* @__PURE__ */ react_shim_default.createElement(ToolPolicyTab, { initialProfile: initialProfile2, showTester: false }) : /* @__PURE__ */ react_shim_default.createElement(ToolApprovalTab, { showTester: false }));
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
      const expiresAt = form.expires_at.trim() ? new Date(form.expires_at).toISOString() : null;
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
    async function revoke(g) {
      const label = a.revokeLabel(scopeLabel(t, g.from_profile), scopeLabel(t, g.to_profile));
      if (!await confirmDialog({ message: a.confirmRevoke(label), destructive: true })) return;
      try {
        const res = await poclipMutate(`/api/policy/a2a-grants/${g.id}`, "DELETE", { revoked_by: FALLBACK_ACTOR });
        if (res?.status === "pending_approval") show(a.pendingT2(res.approval_request_id));
        else {
          show(a.revoked(label));
          refetch();
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      }
    }
    const [statusFilter, setStatusFilter] = useState("active");
    const [search, setSearch] = useState("");
    const [view, setView] = useState("table");
    const allGrants = data?.items ?? [];
    const needle = search.trim().toLowerCase();
    const shownGrants = allGrants.filter((g) => {
      if (statusFilter === "active" && !g.active) return false;
      if (statusFilter === "inactive" && g.active) return false;
      if (needle && !`${scopeLabel(t, g.from_profile)} ${scopeLabel(t, g.to_profile)}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const byPerson = useMemo(() => {
      const m = /* @__PURE__ */ new Map();
      for (const g of shownGrants) m.set(g.from_profile, [...m.get(g.from_profile) ?? [], g]);
      return [...m.entries()].sort((x, y) => scopeLabel(t, x[0]).localeCompare(scopeLabel(t, y[0]), "vi"));
    }, [shownGrants, t]);
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
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "a2a_grant", onApplied: refetch }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, a.title, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, a.noEditNote)), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, c.refresh)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.filterStatus), /* @__PURE__ */ react_shim_default.createElement(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v === "inactive" ? "inactive" : v === "all" ? "all" : "active"), style: { minWidth: 150 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "active" }, a.statusActive), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "inactive" }, a.statusInactive), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "all" }, a.statusAll))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 260 } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.filterSearch), /* @__PURE__ */ react_shim_default.createElement(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: a.searchPlaceholder, "data-a2a-search": "1" })), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: view !== "table", onClick: () => setView("table") }, a.viewTable), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: view !== "byPerson", onClick: () => setView("byPerson") }, a.viewByPerson))), data && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.85em", marginTop: -6 }, "data-a2a-count": "1" }, a.countLine(shownGrants.length, allGrants.length)), view === "byPerson" && /* @__PURE__ */ react_shim_default.createElement("div", { "data-a2a-by-person": "1", style: { display: "flex", flexDirection: "column", gap: "0.5rem" } }, byPerson.length === 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, a.noGrants), byPerson.map(([from, gs]) => /* @__PURE__ */ react_shim_default.createElement("details", { key: from, style: { border: "1px solid var(--color-border)", borderRadius: 8, padding: "0.5rem 0.8rem" } }, /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", fontWeight: 600 } }, scopeLabel(t, from), " ", /* @__PURE__ */ react_shim_default.createElement("span", { style: { ...mutedTextStyle, fontWeight: 400, fontSize: "0.85em" } }, "\u2014 ", a.byPersonLine(gs.length))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.88em" } }, gs.map((g) => /* @__PURE__ */ react_shim_default.createElement("div", { key: g.id, style: { display: "flex", gap: "0.5rem", justifyContent: "space-between", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("span", null, "\u2192 ", scopeLabel(t, g.to_profile), " ", /* @__PURE__ */ react_shim_default.createElement("span", { style: mutedTextStyle }, "(", parseOps(g.allowed_operations).map((op) => resolveLabelOrCode(t, "a2aOperation", op)).join(", "), ")")), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => revoke(g) }, c.revoke))))))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto", display: view === "table" ? void 0 : "none" }, "data-table-wrap": "a2a" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [a.colFromProfile, a.colToProfile, a.colDirection, a.colOperations, a.colExpiresAt, a.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !data && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, c.loading)), data && shownGrants.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 7 }, a.noGrants)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: shownGrants, colSpan: 7, render: (g) => {
      const ops = parseOps(g.allowed_operations);
      const isExpired = g.expires_at ? new Date(g.expires_at).getTime() < now : false;
      return /* @__PURE__ */ react_shim_default.createElement("tr", { key: g.id }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, title: g.id }, scopeLabel(t, g.from_profile)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, scopeLabel(t, g.to_profile)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aDirection", code: g.direction })), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, ops.length === 1 && ops[0] === "*" ? /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-warning-foreground)" } }, a.opsAllLabel) : ops.map((op, i) => /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, { key: op }, i > 0 && ", ", /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aOperation", code: op })))), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.82em" } }, g.expires_at ? /* @__PURE__ */ react_shim_default.createElement("span", null, formatDateTime(g.expires_at), isExpired && /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, " ", /* @__PURE__ */ react_shim_default.createElement(Badge, { tone: "destructive" }, a.expired))) : /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, a.noExpiry)), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: g.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => revoke(g) }, c.revoke)));
    } })))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "a2a-add", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, a.addTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "a2aOperation", code: op }))), /* @__PURE__ */ react_shim_default.createElement("label", { style: { display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" } }, /* @__PURE__ */ react_shim_default.createElement("input", { type: "checkbox", checked: form.ops_all, onChange: (e) => toggleOpsAll(e.target.checked) }), a.opsAllLabel))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginBottom: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.labelExpiresAt, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, a.expiresHint)), /* @__PURE__ */ react_shim_default.createElement(
      "input",
      {
        type: "datetime-local",
        value: form.expires_at,
        onChange: (e) => setForm({ ...form, expires_at: e.target.value }),
        style: { padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.95rem" },
        "data-a2a-expires": "1"
      }
    )), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: createGrant, disabled: creating }, creating ? c.saving : c.createBtn)), /* @__PURE__ */ react_shim_default.createElement("div", { style: { borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: () => setShowHistory(!showHistory) }, showHistory ? a.historyHideBtn : a.historyShowBtn), showHistory && /* @__PURE__ */ react_shim_default.createElement("div", { style: { marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontSize: "0.82em", ...mutedTextStyle } }, a.historyNote), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { flex: 1, minWidth: 160 } }, /* @__PURE__ */ react_shim_default.createElement(Label, null, a.historyFilterSourcePlaceholder), /* @__PURE__ */ react_shim_default.createElement(Input, { value: histFilterSource, onChange: (e) => {
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
    const { data: overview, refetch: refetchOverview } = usePoclipFetch("/api/policy/sandbox");
    const rows = overview?.items ?? [];
    const levels = new Set(rows.map((r) => `${r.sandbox_mode}|${r.backend}|${r.workspace_access}`)).size;
    const anyLocal = rows.some((r) => r.backend === "local");
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
      if (!await confirmDialog({ message: s.confirmSave(scopeLabel(t, updateProfile.trim())) })) return;
      setUpdating(true);
      try {
        const res = await poclipMutate(`/api/policy/sandbox/${encodeURIComponent(updateProfile.trim())}`, "PUT", { ...body, changed_by: FALLBACK_ACTOR });
        if (res?.status === "pending_approval") show(s.pendingT2(res.approval_request_id));
        else {
          show(s.saved(scopeLabel(t, updateProfile.trim())));
          setMode("");
          setBackend("");
          setWorkspace("");
          refetchOverview();
          if (viewProfile.trim() && viewProfile.trim() === updateProfile.trim()) await loadSandbox();
        }
      } catch (e) {
        show(parseApiError(e, t), true);
      } finally {
        setUpdating(false);
      }
    }
    function editRow(r) {
      setUpdateProfile(r.profile_id);
      setMode(r.sandbox_mode);
      setBackend(r.backend);
      setWorkspace(r.workspace_access);
      scrollToCard("sandbox-update");
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "sandbox" }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, s.overviewTitle), overview && /* @__PURE__ */ react_shim_default.createElement("div", { style: { fontSize: "0.88em", color: "var(--color-muted-foreground)", marginTop: -8 }, "data-sandbox-summary": "1" }, s.overviewSummary(rows.length, levels)), anyLocal && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("warning"), fontSize: "0.88em" }, "data-sandbox-local-note": "1" }, s.localNote), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "sandbox" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [s.colPerson, s.fieldSandboxMode, s.fieldBackend, s.fieldWorkspaceAccess, s.colPrune, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !overview && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, c.loading)), overview && rows.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 6 }, s.noOverview)), rows.map((r) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: r.id }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, title: r.profile_id }, scopeLabel(t, r.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "sandboxMode", code: r.sandbox_mode })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "sandboxBackend", code: r.backend })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "workspaceAccess", code: r.workspace_access })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, r.prune_on_exit ? c.yes : c.no), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, whiteSpace: "nowrap" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => editRow(r) }, s.editRow))))))), /* @__PURE__ */ react_shim_default.createElement("h3", { style: { margin: "0.5rem 0 0" } }, s.lookupTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement(
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
    ), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: loadSandbox }, s.viewBtn)), viewErr && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)" } }, s.notFoundPrefix, " ", viewErr), view && /* @__PURE__ */ react_shim_default.createElement("div", { style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, view.inherited_from && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), marginBottom: "0.75rem", fontSize: "0.85em" } }, s.inheritedNote(scopeLabel(t, view.inherited_from))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.5rem", fontSize: "0.9em" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldProfileId, ": "), scopeLabel(t, view.profile_id)), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldSandboxMode, ": "), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "sandboxMode", code: view.sandbox_mode })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldBackend, ": "), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "sandboxBackend", code: view.backend })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldWorkspaceAccess, ": "), /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "workspaceAccess", code: view.workspace_access })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement("span", { style: { color: "var(--color-muted-foreground)" } }, s.fieldPruneOnExit, ": "), view.prune_on_exit ? c.yes : c.no))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "sandbox-update", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, s.updateTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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

  // src/pages/PolicyConfig/ChannelConnections.tsx
  var TONE = {
    connected: "var(--color-success, #22c55e)",
    retrying: "var(--color-warning, #f59e0b)",
    not_reported: "var(--color-warning, #f59e0b)",
    failed: "var(--color-destructive, #ef4444)"
  };
  function ChannelConnections() {
    const t = useT();
    const cc = t.channelConnections;
    const { data, loading, error, refetch } = usePoclipFetch("/api/policy/channel-connections");
    const items = data?.items ?? [];
    const gw = data?.gateway;
    const platformName = (p) => channelLabel(t, p);
    const stateName = (s) => cc.states[s] ?? s;
    const gwName = (s) => s ? cc.gatewayStates[s] ?? s : cc.gatewayUnknown;
    const connected = items.filter((i) => i.state === "connected").length;
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, "data-channel-connections": "1" }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, cc.title), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, cc.btnRefresh)), /* @__PURE__ */ react_shim_default.createElement("p", { style: { ...mutedTextStyle, margin: 0, fontSize: "0.88em" } }, cc.intro), loading && !data && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, cc.loading), error && /* @__PURE__ */ react_shim_default.createElement("div", { style: noticeStyle("error"), role: "alert" }, cc.loadError), data && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...cardStyle, padding: "0.75rem 1rem", fontSize: "0.9em" }, "data-channel-gateway": gw?.state ?? "" }, /* @__PURE__ */ react_shim_default.createElement("strong", null, cc.gatewayLabel), " ", gwName(gw?.state), gw?.updated_at ? /* @__PURE__ */ react_shim_default.createElement("span", { style: mutedTextStyle }, " \xB7 ", cc.gatewayUpdated(formatDateTime(gw.updated_at))) : null, items.length > 0 ? /* @__PURE__ */ react_shim_default.createElement("span", { style: mutedTextStyle }, " \xB7 ", cc.summary(connected, items.length)) : null), data && items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, cc.empty), items.length > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "channel-connections" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [cc.colEmployee, cc.colChannel, cc.colState, cc.colToken, cc.colAllowed].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, items.map((i) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: `${i.profile_id}:${i.platform}`, "data-channel-connection": `${i.profile_id}:${i.platform}` }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, scopeLabel(t, i.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, platformName(i.platform)), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, color: TONE[i.state] ?? "inherit", fontWeight: 600 }, title: i.error_code ?? "" }, stateName(i.state), i.error_code ? ` (${i.error_code})` : ""), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, color: i.token_set === false ? "var(--color-destructive, #ef4444)" : "inherit" } }, i.token_set === null ? cc.notApplicable : i.token_set ? cc.tokenSet : cc.tokenMissing), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, i.allowed_users === null ? cc.notApplicable : cc.allowedCount(i.allowed_users))))))));
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
      scrollToCard("channel-edit");
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
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement(SuggestionBlock, { policyType: "channel_binding", onApplied: refetch }), /* @__PURE__ */ react_shim_default.createElement(ToastBanner, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ react_shim_default.createElement("h2", { style: { margin: 0 } }, cb.title), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => refetch() }, c.refresh)), /* @__PURE__ */ react_shim_default.createElement("p", { style: { margin: 0, fontSize: "0.88em", color: "var(--color-muted-foreground)" }, "data-channel-bindings-intro": "1" }, cb.intro), /* @__PURE__ */ react_shim_default.createElement("div", { style: { width: "100%", overflowX: "auto" }, "data-table-wrap": "channel-bindings" }, /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [cb.colChannel, cb.colProfileId, cb.colRole, cb.colActive, c.actions].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !data && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 5 }, c.loading)), data && data.items.length === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 5 }, cb.noBindings)), /* @__PURE__ */ react_shim_default.createElement(PagedRows, { items: data?.items, colSpan: 5, render: (item) => /* @__PURE__ */ react_shim_default.createElement("tr", { key: item.id, style: editingId === item.id ? { background: "var(--color-muted)" } : void 0 }, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, title: item.id }, channelLabel(t, item.channel)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, scopeLabel(t, item.profile_id)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, item.role ? /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "channelRole", code: item.role }) : "\u2014"), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(ActiveBadge, { active: item.active })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.4rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => openEdit(item), disabled: saving || editingId !== null && editingId !== item.id }, c.edit), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", outlined: true, onClick: () => remove(item.id), disabled: saving }, c.disable)))) })))), editingId !== null && /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "channel-edit", style: cardStyle }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, cb.editTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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
    ))), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelPeerId), /* @__PURE__ */ react_shim_default.createElement("input", { value: editForm.peer_id, onChange: (e) => setEditForm({ ...editForm, peer_id: e.target.value }), placeholder: cb.peerIdPlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelGuildId), /* @__PURE__ */ react_shim_default.createElement("input", { value: editForm.guild_id, onChange: (e) => setEditForm({ ...editForm, guild_id: e.target.value }), placeholder: cb.guildIdPlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } })), /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, cb.labelTeamId), /* @__PURE__ */ react_shim_default.createElement("input", { value: editForm.team_id, onChange: (e) => setEditForm({ ...editForm, team_id: e.target.value }), placeholder: cb.teamIdPlaceholder, style: { width: "100%", boxSizing: "border-box", padding: "0.45rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-input, transparent)", color: "var(--color-foreground)", fontSize: "0.875rem" } }))), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem" } }, /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: saveEdit, disabled: saving }, saving ? c.saving : c.save), /* @__PURE__ */ react_shim_default.createElement(Button, { outlined: true, onClick: cancelEdit, disabled: saving }, c.cancel)))), /* @__PURE__ */ react_shim_default.createElement("div", { "data-policy-card": "channel-add", style: { border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, cb.addTitle), /* @__PURE__ */ react_shim_default.createElement(FormAlert, { toast }), /* @__PURE__ */ react_shim_default.createElement("div", { style: formGrid }, /* @__PURE__ */ react_shim_default.createElement(
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

  // src/pages/PolicyConfig/ChannelsTab.tsx
  function ChannelsTab() {
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "2rem" } }, /* @__PURE__ */ react_shim_default.createElement("section", { "data-policy-section": "channel-connections" }, /* @__PURE__ */ react_shim_default.createElement(ChannelConnections, null)), /* @__PURE__ */ react_shim_default.createElement("section", { "data-policy-section": "channel-bindings", style: { borderTop: "2px solid var(--color-border)", paddingTop: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement(ChannelBindingsTab, null)));
  }

  // src/pages/PolicyConfig/ReloadCard.tsx
  function serverMessage(e) {
    const raw = e?.message ?? String(e);
    try {
      const body = JSON.parse(raw);
      const code = body?.detail?.error?.code;
      if (typeof code === "string") return code;
      if (typeof body?.detail === "string") return body.detail;
    } catch {
    }
    return raw;
  }
  function ReloadCard() {
    const t = useT();
    const ops = t.operations;
    const [reloading, setReloading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    async function handleReload() {
      setReloading(true);
      setResult(null);
      setError(null);
      try {
        setResult(await poclipMutate("/api/v1/config/reload", "POST"));
      } catch (e) {
        setError(serverMessage(e));
      } finally {
        setReloading(false);
      }
    }
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: cardStyle, "data-policy-card": "reload" }, /* @__PURE__ */ react_shim_default.createElement("h3", { style: { marginTop: 0 } }, ops.sectionReload, /* @__PURE__ */ react_shim_default.createElement(InfoHint, null, ops.reloadHint)), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: handleReload, disabled: reloading }, reloading ? ops.reloading : ops.btnReload), result && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("success"), marginTop: "0.75rem" } }, result.ok ? ops.reloadOk(result.epoch, formatDateTime(result.reloaded_at)) : ops.reloadFailed), error && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("error"), marginTop: "0.75rem" } }, error));
  }

  // src/lib/policy-tabs.ts
  var OPERATIONS_MOVED_TO = "schedule-reminders";
  var ROUTING_MOVED_TO = "directive-routing";
  function resolvePolicyTab(id) {
    switch ((id ?? "").trim()) {
      case "permissions":
        return { tab: "permissions", segment: "policy" };
      case "tool-policy":
        return { tab: "permissions", segment: "policy" };
      case "tool-approval":
        return { tab: "permissions", segment: "approval" };
      case "a2a-grants":
        return { tab: "a2a-grants" };
      case "channels":
        return { tab: "channels" };
      case "channel-bindings":
        return { tab: "channels" };
      case "sandbox":
        return { tab: "sandbox" };
      case "instructions":
        return { tab: "permissions", segment: "policy", movedTo: ROUTING_MOVED_TO };
      case "routing":
        return { tab: "permissions", segment: "policy", movedTo: ROUTING_MOVED_TO };
      case "operations":
        return { tab: "permissions", segment: "policy", movedTo: OPERATIONS_MOVED_TO };
      default:
        return { tab: "permissions", segment: "policy" };
    }
  }
  var SUGGESTION_TAB = {
    tool_policy: "permissions",
    a2a_grant: "a2a-grants",
    sandbox: "sandbox",
    channel_binding: "channels"
  };

  // src/pages/PolicyConfig/index.tsx
  var PAGE_SIZE_OPTIONS3 = [10, 25, 50];
  var SUB_TABS = [
    { id: "permissions", labelKey: "permissions", Component: PermissionsTab },
    { id: "a2a-grants", labelKey: "a2aGrants", Component: A2ATab },
    { id: "channels", labelKey: "channelBindings", Component: ChannelsTab },
    { id: "sandbox", labelKey: "sandbox", Component: SandboxTab }
  ];
  function usePendingByTab() {
    const [ver, setVer] = useState(0);
    useEffect(() => {
      const h = () => setVer((v) => v + 1);
      window.addEventListener("policy-suggestions-changed", h);
      return () => window.removeEventListener("policy-suggestions-changed", h);
    }, []);
    const tool = usePoclipFetch("/api/policy/suggestions?policy_type=tool_policy", [ver]);
    const a2a = usePoclipFetch("/api/policy/suggestions?policy_type=a2a_grant", [ver]);
    const sandbox = usePoclipFetch("/api/policy/suggestions?policy_type=sandbox", [ver]);
    const channel = usePoclipFetch("/api/policy/suggestions?policy_type=channel_binding", [ver]);
    const out = {};
    for (const [pt, r] of [["tool_policy", tool], ["a2a_grant", a2a], ["sandbox", sandbox], ["channel_binding", channel]]) {
      const tab = SUGGESTION_TAB[pt];
      out[tab] = (out[tab] ?? 0) + Number(r.data?.pending ?? 0);
    }
    return out;
  }
  function PolicyConfig({ initialProfile: initialProfile2, initialTab: initialTab2 }) {
    const t = useT();
    const names2 = usePoclipFetch("/api/v1/org/names");
    useEffect(() => {
      if (names2.data) setServerNames(names2.data);
    }, [names2.data]);
    useServerNamesVersion();
    const resolved = resolvePolicyTab(initialTab2);
    useEffect(() => {
      if (resolved.movedTo) window.location.replace(`/hermes-poclip?tab=${encodeURIComponent(resolved.movedTo)}`);
    }, []);
    const validInitialTab = resolved.tab;
    const pendingByTab = usePendingByTab();
    return /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1.25rem" } }, /* @__PURE__ */ react_shim_default.createElement(Tabs, { defaultValue: validInitialTab }, (active, setActive) => {
      const ActiveComponent = SUB_TABS.find((tab) => tab.id === active)?.Component ?? SUB_TABS[0].Component;
      return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, null, /* @__PURE__ */ react_shim_default.createElement(TabsList, null, SUB_TABS.map((tab) => /* @__PURE__ */ react_shim_default.createElement(
        TabsTrigger,
        {
          key: tab.id,
          value: tab.id,
          active: active === tab.id,
          onClick: () => setActive(tab.id),
          "data-policy-subtab": tab.id,
          style: { fontSize: "0.92rem" }
        },
        t.tabs[tab.labelKey],
        (pendingByTab[tab.id] ?? 0) > 0 && /* @__PURE__ */ react_shim_default.createElement(
          "span",
          {
            "data-policy-tab-badge": tab.id,
            style: { marginLeft: "0.4rem", padding: "0 0.4rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, background: "var(--color-warning, #f59e0b)", color: "var(--color-background, #041c1c)" }
          },
          pendingByTab[tab.id]
        )
      )), /* @__PURE__ */ react_shim_default.createElement(InfoHint, { wide: true, alignRight: true }, /* @__PURE__ */ react_shim_default.createElement("p", { style: { margin: "0 0 0.5rem" }, "data-policy-page-intro": "1" }, t.policyPage.intro), /* @__PURE__ */ react_shim_default.createElement("p", { style: { margin: 0, fontWeight: 600 }, "data-policy-tab-intro": active }, t.policyPage.tabIntro[SUB_TABS.find((tab) => tab.id === active)?.labelKey ?? "toolPolicy"]))), /* @__PURE__ */ react_shim_default.createElement(
        ActiveComponent,
        {
          initialProfile: active === "permissions" ? initialProfile2 : void 0,
          initialSegment: active === "permissions" ? resolved.segment : void 0
        }
      ));
    }), /* @__PURE__ */ react_shim_default.createElement(ReloadCard, null), /* @__PURE__ */ react_shim_default.createElement(AuditLogSection, null));
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
    return /* @__PURE__ */ react_shim_default.createElement(
      "details",
      {
        style: { borderTop: "2px solid var(--color-border)", paddingTop: "1rem" },
        "data-policy-card": "audit-log",
        onToggle: (e) => {
          if (e.currentTarget.open && !loaded) setLoaded(true);
        }
      },
      /* @__PURE__ */ react_shim_default.createElement("summary", { style: { cursor: "pointer", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.4rem" } }, t.policyPage.historyTitle),
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...mutedTextStyle, fontSize: "0.85em", marginBottom: "0.75rem" } }, t.policyPage.historyHint),
      /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem", flexWrap: "wrap" } }, /* @__PURE__ */ react_shim_default.createElement("div", null, /* @__PURE__ */ react_shim_default.createElement(Label, null, al.filterLabel), /* @__PURE__ */ react_shim_default.createElement(Select, { value: policyType, onValueChange: handleTypeChange, style: { minWidth: 200 } }, /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "" }, c.all), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "tool_policy" }, resolveLabelOrCode(t, "policyType", "tool_policy")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "a2a_grant" }, resolveLabelOrCode(t, "policyType", "a2a_grant")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "sandbox" }, resolveLabelOrCode(t, "policyType", "sandbox")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "channel_binding" }, resolveLabelOrCode(t, "policyType", "channel_binding")), /* @__PURE__ */ react_shim_default.createElement(SelectOption, { value: "tool_approval_rule" }, resolveLabelOrCode(t, "policyType", "tool_approval_rule")))), /* @__PURE__ */ react_shim_default.createElement(Button, { onClick: () => {
        setLoaded(true);
        setPage(1);
        refetch();
      } }, al.loadBtn)),
      loaded && loading && /* @__PURE__ */ react_shim_default.createElement("div", { style: mutedTextStyle }, c.loading),
      loaded && error && /* @__PURE__ */ react_shim_default.createElement("div", { style: { color: "var(--color-destructive)", marginBottom: "0.5rem" } }, error),
      loaded && data && total > loadedCount && /* @__PURE__ */ react_shim_default.createElement("div", { style: { ...noticeStyle("info"), fontSize: "0.82em", marginBottom: "0.5rem" } }, al.backendLimitNote(loadedCount)),
      /* @__PURE__ */ react_shim_default.createElement("table", { style: tableStyle }, /* @__PURE__ */ react_shim_default.createElement("thead", null, /* @__PURE__ */ react_shim_default.createElement("tr", null, [al.colTime, al.colType, al.colPolicyId, al.colAction, al.colChangedBy, al.colRevision, al.colNeedsApproval, al.detailsBtn].map((h) => /* @__PURE__ */ react_shim_default.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ react_shim_default.createElement("tbody", null, !loaded && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, al.notLoaded)), loaded && !data && !loading && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, c.loading)), loaded && data && loadedCount === 0 && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle, colSpan: 8 }, al.noEntries)), pageRows.map((e, i) => {
        const rowKey = e.id ?? String(startIdx + i);
        const expanded = expandedId === rowKey;
        return /* @__PURE__ */ react_shim_default.createElement(react_shim_default.Fragment, { key: rowKey }, /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontSize: "0.78em" } }, formatDateTime(e.created_at)), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "policyType", code: e.policy_type })), /* @__PURE__ */ react_shim_default.createElement("td", { style: { ...tdStyle, fontFamily: "var(--theme-font-mono)", fontSize: "0.78em" }, title: e.policy_id }, e.policy_id.length > 14 ? e.policy_id.slice(0, 12) + "\u2026" : e.policy_id), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(EnumValue, { group: "auditAction", code: e.action, strong: true })), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, e.changed_by), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, e.policy_revision), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, e.requires_approval ? /* @__PURE__ */ react_shim_default.createElement(Badge, { tone: "destructive" }, al.t2Badge) : ""), /* @__PURE__ */ react_shim_default.createElement("td", { style: tdStyle }, /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", onClick: () => setExpandedId(expanded ? null : rowKey) }, expanded ? "\u25B2" : "\u25BC"))), expanded && /* @__PURE__ */ react_shim_default.createElement("tr", null, /* @__PURE__ */ react_shim_default.createElement("td", { colSpan: 8, style: { ...tdStyle, background: "var(--color-muted)", padding: "0.75rem 1rem" } }, /* @__PURE__ */ react_shim_default.createElement("strong", null, al.detailsTitle), /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" } }, [
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
      }))),
      loaded && data && loadedCount > 0 && /* @__PURE__ */ react_shim_default.createElement("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.75rem" } }, /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.85em", ...mutedTextStyle } }, c.pageInfo(startIdx + 1, endIdx, loadedCount, pageSafe, totalPages)), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe <= 1, onClick: () => setPage(1) }, c.pageFirst), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe <= 1, onClick: () => setPage((p) => p - 1) }, c.pagePrev), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe >= totalPages, onClick: () => setPage((p) => p + 1) }, c.pageNext), /* @__PURE__ */ react_shim_default.createElement(Button, { size: "sm", disabled: pageSafe >= totalPages, onClick: () => setPage(totalPages) }, c.pageLast), /* @__PURE__ */ react_shim_default.createElement("span", { style: { fontSize: "0.85em", ...mutedTextStyle } }, c.rowsPerPage), /* @__PURE__ */ react_shim_default.createElement(Select, { value: String(pageSize), onValueChange: (v) => {
        setPageSize(Number(v));
        setPage(1);
      }, style: { minWidth: 70 } }, PAGE_SIZE_OPTIONS3.map((n) => /* @__PURE__ */ react_shim_default.createElement(SelectOption, { key: n, value: String(n) }, String(n)))))
    );
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
  var VALID_POLICY_TABS = /* @__PURE__ */ new Set(["permissions", "a2a-grants", "channels", "sandbox", "instructions", "operations", "tool-policy", "tool-approval", "channel-bindings", "routing"]);
  var _rawTab = new URLSearchParams(window.location.search).get("tab");
  var initialTab = _rawTab && VALID_POLICY_TABS.has(_rawTab) ? _rawTab : void 0;
  function HermesPoclipPolicyApp() {
    return /* @__PURE__ */ react_shim_default.createElement("div", { "data-poclip-fields": "", style: { padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ react_shim_default.createElement("style", null, FIELD_CSS + BUTTON_CSS + HEADING_CSS + `select option { background: var(--color-card, #0b1f1f); color: var(--color-foreground, #ffe6cb); }`), /* @__PURE__ */ react_shim_default.createElement(PolicyConfig, { initialProfile, initialTab }), /* @__PURE__ */ react_shim_default.createElement(ConfirmHost, null));
  }
  window.__HERMES_PLUGINS__.register("hermes-poclip-policy", HermesPoclipPolicyApp);
})();
