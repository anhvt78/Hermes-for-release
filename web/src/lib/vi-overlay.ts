/**
 * Hermes+: lớp tiếng Việt bổ sung cho các trang LÕI (Phiên, Tệp, Mô hình, Kênh, Webhook, Trình cắm, Thành tích, Hệ thống…).
 *
 * Vì sao có tệp này: nhiều chuỗi của các trang lõi được viết thẳng trong mã (không đi qua bảng i18n) nên bản dịch vi.ts không với tới được,
 * và sửa từng trang sẽ xung đột mỗi lần nâng cấp lõi. Thay vào đó, khi giao diện là tiếng Việt, ta dịch ở mức HIỂN THỊ: bảng khớp chính xác
 * (không phân biệt hoa/thường, vì nhiều nhãn được CSS đổi sang chữ hoa) + vài quy tắc cho chuỗi có số/ngày. Chuỗi không có trong bảng giữ nguyên,
 * nên không bao giờ làm mất hay sai nội dung. Không áp cho trang «Công ty»/«Chính sách» (có bộ i18n riêng) và các tệp, nhật ký, mã.
 *
 * Thêm chuỗi mới: chỉ cần bổ sung một cặp «English → Tiếng Việt» vào EXACT bên dưới.
 */

const EXACT: Record<string, string> = {
  // ── thanh bên / chung ──
  "Logged in as President": "Đăng nhập với tên President",
  "via basic": "qua mật khẩu",
  // ── Phiên ──
  "Total": "Tổng",
  "Active in store": "Đang lưu trong kho",
  "Archived": "Đã lưu trữ",
  "Messages": "Tin nhắn",
  "Sources": "Nguồn",
  "Chat": "Trò chuyện",
  "Any chat source": "Mọi nguồn trò chuyện",
  "Import sessions": "Nhập phiên",
  "Import exported session JSON or JSONL": "Nhập tệp phiên đã xuất (JSON hoặc JSONL)",
  "Import exported sessions": "Nhập các phiên đã xuất",
  // ── Tệp ──
  "Upload": "Tải lên",
  "Create": "Tạo",
  "Drop files here": "Thả tệp vào đây",
  "Release to upload": "Thả để tải lên",
  "Uploading": "Đang tải lên",
  "Choose files": "Chọn tệp",
  "Name": "Tên",
  "Size": "Dung lượng",
  "Modified": "Sửa đổi",
  "Actions": "Thao tác",
  "Path": "Đường dẫn",
  "Upload files": "Tải tệp lên",
  // ── Mô hình ──
  "Model Settings": "Cài đặt mô hình",
  "applies to new sessions": "áp dụng cho phiên mới",
  "Main model": "Mô hình chính",
  "Change": "Đổi",
  "Auxiliary tasks": "Tác vụ phụ",
  "Configure": "Cấu hình",
  "Mixture of Agents": "Hỗn hợp nhiều agent (MoA)",
  "Token & cost analytics are hidden because the local counts exclude auxiliary calls (compression, vision, web extract, …) and provider retries, so they diverge from your provider bill. Enable":
    "Thống kê token và chi phí đang ẩn vì số đếm tại máy không gồm các lệnh gọi phụ (nén, thị giác, trích web…) và các lần thử lại của nhà cung cấp, nên lệch với hóa đơn thật. Hãy bật",
  "Config": "Cấu hình",
  "to show the local debug estimate anyway.": "để vẫn hiện số ước tính nội bộ.",
  "Use as": "Dùng làm",
  "Tools": "Công cụ",
  "Vision": "Thị giác",
  "Reasoning": "Suy luận",
  // ── Kênh ──
  "channels configured. Credentials are written to": "kênh đã cấu hình. Thông tin đăng nhập được ghi vào",
  "; the gateway connects each enabled channel on its next restart.": "; gateway sẽ kết nối từng kênh đã bật ở lần khởi động lại kế tiếp.",
  "Disabled": "Đã tắt",
  "Run Hermes from Telegram DMs, groups, and topics.": "Dùng Hermes qua tin nhắn riêng, nhóm và chủ đề Telegram.",
  "Test": "Thử",
  "Choose how to connect your Telegram bot": "Chọn cách kết nối bot Telegram",
  "Both options connect a bot you control and save its credentials only to this Hermes installation.": "Cả hai cách đều kết nối một bot do anh quản lý và chỉ lưu thông tin đăng nhập của bot trên bản Hermes này.",
  "Quick setup": "Cài nhanh",
  "Scan a QR code and confirm in Telegram. Hermes creates the bot and detects your Telegram user ID automatically.": "Quét mã QR rồi xác nhận trong Telegram. Hermes tự tạo bot và tự nhận ID Telegram của anh.",
  "Create with QR": "Tạo bằng mã QR",
  "Use your own bot": "Dùng bot của anh",
  "Create a bot with @BotFather, or connect one you already have, by entering its token and choosing who can use it.": "Tạo bot bằng @BotFather, hoặc kết nối bot đã có bằng cách nhập token và chọn ai được dùng.",
  "Manual setup": "Cài thủ công",
  "Connect Hermes to Discord DMs, channels, and threads.": "Kết nối Hermes với tin nhắn riêng, kênh và luồng Discord.",
  "Use Hermes from Slack via Socket Mode. Add allowed Slack member IDs so connected bots can respond.": "Dùng Hermes từ Slack qua Socket Mode. Thêm ID thành viên Slack được phép để bot trả lời.",
  "Connect Hermes to Mattermost channels and direct messages.": "Kết nối Hermes với kênh và tin nhắn riêng Mattermost.",
  "Use Hermes in Matrix rooms and direct messages.": "Dùng Hermes trong phòng và tin nhắn riêng Matrix.",
  "Use Hermes through the bundled WhatsApp bridge with QR-based auth.": "Dùng Hermes qua cầu nối WhatsApp đi kèm, xác thực bằng mã QR.",
  "Pair with QR": "Ghép bằng mã QR",
  "Mode": "Chế độ",
  "Self-chat": "Tự nhắn cho mình",
  "Allowed WhatsApp numbers": "Số WhatsApp được phép",
  "Connect through a signal-cli REST bridge.": "Kết nối qua cầu nối REST signal-cli.",
  "Use Hermes through iMessage via a BlueBubbles server.": "Dùng Hermes qua iMessage thông qua máy chủ BlueBubbles.",
  "Talk to Hermes through an IMAP/SMTP mailbox.": "Trò chuyện với Hermes qua hộp thư IMAP/SMTP.",
  "Send and receive text messages via Twilio.": "Gửi và nhận tin nhắn SMS qua Twilio.",
  "Connect Hermes to DingTalk groups (钉钉).": "Kết nối Hermes với nhóm DingTalk (钉钉).",
  "Use Hermes inside Feishu / Lark.": "Dùng Hermes trong Feishu / Lark.",
  "Connect Hermes to Google Chat via Cloud Pub/Sub.": "Kết nối Hermes với Google Chat qua Cloud Pub/Sub.",
  // ── Webhook / ghép nối ──
  "Webhook receiver disabled": "Bộ nhận webhook đang tắt",
  "Webhooks are their own gateway platform. Enable them here to accept incoming HTTP events; chat channels are only needed when a subscription delivers to Telegram, Discord, Slack, or another channel.":
    "Webhook là một nền tảng gateway riêng. Bật ở đây để nhận sự kiện HTTP đến; chỉ cần kênh trò chuyện khi một đăng ký gửi kết quả tới Telegram, Discord, Slack hoặc kênh khác.",
  "Enable webhooks": "Bật webhook",
  "Subscriptions (": "Đăng ký (",
  "Subscription changes hot-reload once the webhook receiver is running. Disabled subscriptions reject incoming events.": "Thay đổi đăng ký được nạp lại ngay khi bộ nhận webhook đang chạy. Đăng ký bị tắt sẽ từ chối sự kiện đến.",
  "No webhook subscriptions yet.": "Chưa có đăng ký webhook nào.",
  "Pending requests (": "Yêu cầu đang chờ (",
  "No pending pairing requests": "Không có yêu cầu ghép nối đang chờ",
  "Approved users (": "Người dùng đã duyệt (",
  "No approved users": "Chưa có người dùng nào được duyệt",
  // ── Hồ sơ ──
  "Model": "Mô hình",
  "Skill": "Kỹ năng",
  // ── Trình cắm ──
  "Configure memory providers and runtime context engine selection.": "Cấu hình nhà cung cấp bộ nhớ và chọn bộ máy ngữ cảnh khi chạy.",
  "Hermes will use the built-in MEMORY.md and USER.md files.": "Hermes sẽ dùng các tệp MEMORY.md và USER.md có sẵn.",
  "Save memory provider": "Lưu nhà cung cấp bộ nhớ",
  "Save context engine": "Lưu bộ máy ngữ cảnh",
  "Plugin catalog": "Danh mục trình cắm",
  "Curated, Nous-reviewed plugins pinned to exact commits. Install from here for supply-chain-safe versions.": "Các trình cắm đã được Nous tuyển chọn và rà soát, ghim đúng phiên bản. Cài từ đây để có bản an toàn chuỗi cung ứng.",
  "Curated, Nous-reviewed plugins pinned to exact commits.": "Các trình cắm đã được Nous tuyển chọn và rà soát, ghim đúng phiên bản.",
  // ── Hệ thống ──
  "Host": "Máy chủ",
  "OS": "Hệ điều hành",
  "Arch": "Kiến trúc",
  "Memory": "Bộ nhớ",
  "Disk": "Ổ đĩa",
  "Uptime": "Đã chạy",
  "Load avg": "Tải trung bình",
  "Check for updates": "Kiểm tra cập nhật",
  "not logged in": "chưa đăng nhập",
  "Manage subscription": "Quản lý gói đăng ký",
  "Tool gateway routing": "Định tuyến cổng công cụ",
  "Web tools": "Công cụ web",
  "not configured": "chưa cấu hình",
  // ── Thành tích: nhóm, hạng ──
  "Agent Autonomy": "Agent tự chủ",
  "Debugging Chaos": "Sửa lỗi hỗn loạn",
  "Vibe Coding": "Lập trình theo cảm hứng",
  "Hermes Native": "Dân Hermes chính hiệu",
  "Research/Web": "Nghiên cứu/Web",
  "Tool Mastery": "Thạo công cụ",
  "Model Lore": "Kiến thức mô hình",
  "Lifestyle": "Nếp sống",
  "Copper": "Đồng",
  "Silver": "Bạc",
  "Gold": "Vàng",
  "Diamond": "Kim cương",
  // ── Thành tích: từng huy hiệu (tên → mô tả) ──
  "Let Him Cook": "Để anh ấy nấu",
  "Let Hermes run a serious autonomous tool chain in one session.": "Để Hermes chạy một chuỗi công cụ tự động nghiêm túc trong một phiên.",
  "Autonomous Avalanche": "Tuyết lở tự động",
  "Accumulate a lifetime avalanche of Hermes tool calls across sessions.": "Tích lũy cả một trận tuyết lở lệnh gọi công cụ của Hermes qua nhiều phiên.",
  "Toolchain Maxxer": "Dùng hết công cụ",
  "Use a wide spread of distinct Hermes tools in one session.": "Dùng nhiều công cụ Hermes khác nhau trong một phiên.",
  "Full Send": "Tất tay",
  "Terminal, files, and web/browser all get involved in one real run.": "Terminal, tệp và web/trình duyệt cùng tham gia trong một lần chạy thật.",
  "Subagent Commander": "Chỉ huy agent con",
  "Coordinate delegated agent work.": "Điều phối công việc giao cho agent khác.",
  "Background Process Enjoyer": "Mê tiến trình nền",
  "Start or control enough long-running processes to deserve the title.": "Khởi chạy hoặc điều khiển đủ nhiều tiến trình chạy lâu để xứng danh hiệu.",
  "Cron Necromancer": "Thầy phù thủy cron",
  "Raise scheduled autonomous jobs from the dead.": "Hồi sinh các công việc tự động theo lịch.",
  "Red Text Connoisseur": "Sành chữ đỏ",
  "Encounter enough errors to develop a palate for red text.": "Gặp đủ nhiều lỗi để thành sành chữ đỏ.",
  "Stack Trace Sommelier": "Chuyên gia nếm stack trace",
  "Taste tracebacks by the flight, not by the sip.": "Nếm traceback theo từng khay, không phải từng ngụm.",
  "Actually Read The Logs": "Thật sự đọc nhật ký",
  "Inspect logs repeatedly instead of guessing.": "Xem nhật ký nhiều lần thay vì đoán mò.",
  "Secret achievement: hidden until Hermes detects the first relevant behavior in your session history.": "Thành tích bí mật: ẩn cho đến khi Hermes thấy hành vi liên quan đầu tiên trong lịch sử phiên của anh.",
  "Dependency Hell Tourist": "Du khách địa ngục phụ thuộc",
  "Package installs fail, then somehow life continues.": "Cài gói thất bại, vậy mà cuộc sống vẫn tiếp diễn.",
  "Requirement: package-install failures ≥ 25; successful package installs after package work ≥ 10.": "Điều kiện: cài gói thất bại ≥ 25; cài gói thành công sau khi làm việc với gói ≥ 10.",
  "The Fix Was Restarting It": "Cách sửa là khởi động lại",
  "Restart after enough error clusters to call it a technique.": "Khởi động lại sau đủ nhiều cụm lỗi để gọi đó là một kỹ thuật.",
  "Requirement: restart/reload actions after error clusters ≥ 50; error/failed/traceback messages observed ≥ 4000.": "Điều kiện: số lần khởi động lại/nạp lại sau cụm lỗi ≥ 50; số thông báo lỗi/thất bại/traceback đã thấy ≥ 4000.",
  "This Was Supposed To Be Quick": "Lẽ ra chỉ là việc nhanh",
  "A tiny ask becomes an entire expedition.": "Một yêu cầu nhỏ biến thành cả cuộc thám hiểm.",
  "One More Small Change": "Thêm một thay đổi nhỏ nữa",
  "Make enough file edits in one session to invalidate the phrase small change.": "Sửa tệp đủ nhiều trong một phiên để cụm «thay đổi nhỏ» hết đúng nghĩa.",
  "Vibe Architect": "Kiến trúc sư cảm hứng",
  "Touch a broad surface area in one project session.": "Chạm tới một diện rộng trong một phiên làm dự án.",
  "Pixel Goblin": "Yêu tinh điểm ảnh",
  "Do sustained frontend, CSS, SVG, or visual tuning.": "Làm giao diện, CSS, SVG hoặc tinh chỉnh hình ảnh liên tục.",
  "Ship First, Ask Later": "Giao trước, hỏi sau",
  "Git activity after a serious tool chain.": "Có hoạt động Git sau một chuỗi công cụ nghiêm túc.",
  "Requirement: git workflow commands ≥ 50; tool calls in one session ≥ 500.": "Điều kiện: số lệnh quy trình git ≥ 50; số lần gọi công cụ trong một phiên ≥ 500.",
  "CSS Exorcist": "Thầy trừ tà CSS",
  "Cast repeated styling demons out of the interface.": "Đuổi những con quỷ tạo kiểu cứ lặp lại ra khỏi giao diện.",
  "Skillsmith": "Thợ rèn kỹ năng",
  "Work with Hermes skills enough to leave fingerprints.": "Làm việc với kỹ năng Hermes đủ nhiều để để lại dấu vân tay.",
  "Skill Issue? Skill Created.": "Thiếu kỹ năng? Tạo kỹ năng.",
  "Create or patch durable procedures instead of repeating yourself.": "Tạo hoặc vá các quy trình bền vững thay vì lặp lại chính mình.",
  "Memory Keeper": "Người giữ trí nhớ",
  "Persist durable knowledge with memory or Mnemosyne.": "Lưu kiến thức lâu dài bằng bộ nhớ hoặc Mnemosyne.",
  "Memory Palace": "Cung điện trí nhớ",
  "Build a serious durable-memory trail.": "Xây dựng một dấu vết trí nhớ lâu dài nghiêm túc.",
  "Context Dragon": "Rồng ngữ cảnh",
  "Brush against compression, huge context, or token pressure repeatedly.": "Nhiều lần chạm ngưỡng nén, ngữ cảnh khổng lồ hoặc áp lực token.",
  "Gateway Dweller": "Cư dân gateway",
  "Live through gateway-connected Hermes workflows.": "Sống qua các quy trình Hermes kết nối qua gateway.",
  "Plugin Goblin": "Yêu tinh trình cắm",
  "Use or develop plugins enough that the dashboard notices.": "Dùng hoặc phát triển trình cắm đủ nhiều để bảng điều khiển nhận ra.",
  "Rabbit Hole Certified": "Chứng nhận hố thỏ",
  "Search or extract enough web content to qualify as a research spiral.": "Tìm hoặc trích đủ nội dung web để coi là sa vào vòng xoáy nghiên cứu.",
  "Citation Goblin": "Yêu tinh trích dẫn",
  "Extract enough web pages to become a tiny librarian.": "Trích đủ nhiều trang web để thành một thủ thư nhỏ.",
  "Docs Archaeologist": "Nhà khảo cổ tài liệu",
  "Dig through documentation sources over and over.": "Đào bới các nguồn tài liệu hết lần này đến lần khác.",
  "Browser Possession": "Nhập hồn trình duyệt",
  "Possess a browser through automation repeatedly.": "Nhiều lần nhập hồn một trình duyệt qua tự động hóa.",
  "Terminal Goblin": "Yêu tinh terminal",
  "Spend serious time in shell-land.": "Dành nhiều thời gian trong xứ shell.",
  "Patch Wizard": "Phù thủy vá lỗi",
  "Bend files to your will with targeted patches.": "Uốn tệp theo ý mình bằng các bản vá nhắm đích.",
  "File Archaeologist": "Nhà khảo cổ tệp",
  "Dig through the filesystem with reads and searches.": "Đào bới hệ thống tệp bằng đọc và tìm kiếm.",
  "Image Whisperer": "Người thì thầm với hình ảnh",
  "Use image generation or vision tools enough for visual work.": "Dùng công cụ tạo ảnh hoặc thị giác đủ nhiều cho công việc hình ảnh.",
  "Voice Of The Machine": "Tiếng nói của máy",
  "Use text-to-speech or voice tooling repeatedly.": "Dùng công cụ chuyển văn bản thành giọng nói hoặc giọng nói nhiều lần.",
  "Model Hopper": "Nhảy mô hình",
  "Switch or inspect providers/models enough to count as a habit.": "Đổi hoặc xem nhà cung cấp/mô hình đủ nhiều thành thói quen.",
  "OpenRouter Enjoyer": "Fan OpenRouter",
  "Route model work through OpenRouter repeatedly.": "Nhiều lần định tuyến việc mô hình qua OpenRouter.",
  "Codex Conjurer": "Thầy gọi Codex",
  "Summon Codex-flavored assistance often enough for a ritual.": "Triệu hồi sự trợ giúp kiểu Codex đủ thường xuyên để thành nghi lễ.",
  "Multi-Model Mage": "Pháp sư đa mô hình",
  "Use a real spread of distinct model names across Hermes history.": "Dùng nhiều tên mô hình khác nhau trong lịch sử Hermes.",
  "Five-Model Flight": "Chuyến bay năm mô hình",
  "Try at least five distinct LLMs instead of marrying the first model that answers.": "Thử ít nhất năm mô hình ngôn ngữ khác nhau thay vì gắn bó với mô hình đầu tiên trả lời.",
  "Provider Polyglot": "Đa ngữ nhà cung cấp",
  "Use models from multiple providers across Hermes history.": "Dùng mô hình của nhiều nhà cung cấp trong lịch sử Hermes.",
  "Model Sommelier": "Chuyên gia nếm mô hình",
  "Taste enough model/provider conversations to develop preferences.": "Trải qua đủ nhiều cuộc trò chuyện với mô hình/nhà cung cấp để có khẩu vị riêng.",
  "Claude Confidant": "Tri kỷ Claude",
  "Bring Claude-flavored reasoning into the workflow repeatedly.": "Nhiều lần đưa lối suy luận kiểu Claude vào quy trình làm việc.",
  "Gemini Cartographer": "Người vẽ bản đồ Gemini",
  "Map enough Gemini-related workflows to know the terrain.": "Vẽ đủ nhiều quy trình liên quan Gemini để thuộc địa hình.",
  "Open Weights Pilgrim": "Người hành hương mô hình mở",
  "Actually chat with local/open-weight models through Hermes session metadata.": "Thật sự trò chuyện với mô hình chạy cục bộ/trọng số mở qua siêu dữ liệu phiên Hermes.",
  "Toolset Cartographer": "Người vẽ bản đồ bộ công cụ",
  "Navigate Hermes toolsets deliberately instead of treating tools as a blur.": "Chủ động điều hướng các bộ công cụ Hermes thay vì coi công cụ là một mớ mờ.",
  "Config Surgeon": "Bác sĩ phẫu thuật cấu hình",
  "Operate on real config files, manifests, env files, and dashboard settings without flinching.": "Mổ xẻ tệp cấu hình thật, manifest, tệp env và cài đặt bảng điều khiển mà không chùn tay.",
  "Rebase Acrobat": "Nghệ sĩ xiếc rebase",
  "Handle real git history surgery: rebase, conflict, merge, fetch, push.": "Xử lý phẫu thuật lịch sử git thật: rebase, xung đột, merge, fetch, push.",
  "Test Suite Tamer": "Người thuần hóa bộ kiểm thử",
  "Run enough verification commands that green text becomes part of the ritual.": "Chạy đủ nhiều lệnh kiểm tra để chữ xanh thành một phần nghi lễ.",
  "Screenshot Hunter": "Thợ săn ảnh chụp màn hình",
  "Capture, inspect, and polish visual proof instead of just claiming it works.": "Chụp, xem và trau chuốt bằng chứng hình ảnh thay vì chỉ nói là chạy được.",
  "Marathon Operator": "Người vận hành marathon",
  "Accumulate a serious number of Hermes sessions.": "Tích lũy một số lượng phiên Hermes đáng kể.",
  "Weekend Warrior": "Chiến binh cuối tuần",
  "Run Hermes on weekends enough times to make it a lifestyle.": "Chạy Hermes vào cuối tuần đủ nhiều lần để thành lối sống.",
  "Night Shift Operator": "Người trực ca đêm",
  "Run sessions during gremlin hours repeatedly.": "Nhiều lần chạy phiên vào giờ khuya khoắt.",
  "Requirement: terminal calls in one session ≥ 180; file/search/patch calls in one session ≥ 120; web search/extract or browser calls in one session ≥ 60.":
    "Điều kiện: số lần gọi terminal trong một phiên ≥ 180; số lần gọi tệp/tìm kiếm/vá trong một phiên ≥ 120; số lần tìm kiếm/trích web hoặc dùng trình duyệt trong một phiên ≥ 60.",
  "Secret: exact requirement hidden until Hermes sees the first matching signal. Keep using Hermes across debugging, tools, memory, skills, plugins, and model workflows to reveal it.":
    "Bí mật: điều kiện chính xác được ẩn cho đến khi Hermes thấy tín hiệu khớp đầu tiên. Hãy tiếp tục dùng Hermes qua sửa lỗi, công cụ, bộ nhớ, kỹ năng, trình cắm và các luồng mô hình để lộ ra.",
  // ── Kênh: các nền tảng còn lại ──
  "Send-only WeCom group bot via webhook.": "Bot nhóm WeCom chỉ để gửi, qua webhook.",
  "Two-way WeCom integration via callback app.": "Tích hợp WeCom hai chiều qua ứng dụng callback.",
  "Connect a personal WeChat account through Tencent's iLink Bot API.": "Kết nối tài khoản WeChat cá nhân qua iLink Bot API của Tencent.",
  "Connect Hermes to a QQ Bot from the QQ Open Platform.": "Kết nối Hermes với một QQ Bot từ Nền tảng mở QQ.",
  "Connect Hermes to Tencent Yuanbao.": "Kết nối Hermes với Tencent Yuanbao.",
  "API server": "Máy chủ API",
  "Expose Hermes as an OpenAI-compatible HTTP API for tools like Open WebUI.": "Mở Hermes thành API HTTP tương thích OpenAI cho các công cụ như Open WebUI.",
  "Webhooks": "Webhook",
  "Receive events from GitHub, GitLab, and other webhook sources.": "Nhận sự kiện từ GitHub, GitLab và các nguồn webhook khác.",
  "No extra packages needed (stdlib only)": "Không cần cài thêm gói (chỉ dùng thư viện chuẩn)",
  "Requires the buzz CLI binary (https://github.com/block/buzz) on PATH or at BUZZ_CLI_PATH": "Cần tệp chương trình buzz CLI (https://github.com/block/buzz) trong PATH hoặc tại BUZZ_CLI_PATH",
  "Use Hermes through iMessage via Photon's managed Spectrum platform.": "Dùng Hermes qua iMessage thông qua nền tảng Spectrum do Photon quản lý.",
  "Relay messages between an IRC channel (or DMs) and Hermes.": "Chuyển tiếp tin nhắn giữa một kênh IRC (hoặc tin nhắn riêng) và Hermes.",
  "Use Hermes from LINE via the LINE Messaging API webhook.": "Dùng Hermes từ LINE qua webhook LINE Messaging API.",
  "Receive Microsoft Graph change notifications (Teams meetings, Outlook, …).": "Nhận thông báo thay đổi từ Microsoft Graph (cuộc họp Teams, Outlook, …).",
  "Connect Hermes to Microsoft Teams chats via the Bot Framework.": "Kết nối Hermes với các cuộc trò chuyện Microsoft Teams qua Bot Framework.",
  "Chat with Hermes over ntfy push topics (ntfy.sh or self-hosted).": "Trò chuyện với Hermes qua chủ đề đẩy ntfy (ntfy.sh hoặc tự dựng).",
  "Join a Raft workspace as an external agent.": "Tham gia không gian làm việc Raft với vai trò agent bên ngoài.",
  "Relay (experimental)": "Chuyển tiếp (thử nghiệm)",
  "Generic relay adapter fronted by the Hermes Relay connector.": "Bộ chuyển tiếp chung đặt sau trình kết nối Hermes Relay.",
  "Talk to Hermes over SimpleX Chat via a local simplex-chat daemon.": "Trò chuyện với Hermes qua SimpleX Chat bằng tiến trình simplex-chat chạy cục bộ.",
  "Use Hermes via Meta's hosted WhatsApp Cloud API (no local bridge).": "Dùng Hermes qua WhatsApp Cloud API do Meta lưu trữ (không cần cầu nối cục bộ).",
};

/** Cụm «Requirement» của huy hiệu: dịch phần đo lường. */
const REQUIREMENT: Record<string, string> = {
  "tool calls in one session": "số lần gọi công cụ trong một phiên",
  "lifetime delegate_task calls": "tổng số lần gọi delegate_task",
  "log inspections": "số lần xem nhật ký",
  "messages in one session": "số tin nhắn trong một phiên",
  "files touched in one session": "số tệp đã chạm tới trong một phiên",
  "durable memory writes": "số lần ghi nhớ lâu dài",
  "lifetime web_extract calls": "tổng số lần gọi web_extract",
  "lifetime terminal calls": "tổng số lần gọi terminal",
  "text-to-speech or voice tool calls": "số lần dùng công cụ giọng nói/chuyển văn bản thành giọng nói",
  "OpenRouter mentions": "số lần nhắc tới OpenRouter",
  "Codex mentions": "số lần nhắc tới Codex",
  "Claude/Anthropic model mentions": "số lần nhắc tới mô hình Claude/Anthropic",
  "Gemini/Google model mentions": "số lần nhắc tới mô hình Gemini/Google",
  "toolset or tool-family mentions": "số lần nhắc tới bộ công cụ",
  "Hermes sessions": "số phiên Hermes",
  "sessions started on weekends": "số phiên bắt đầu vào cuối tuần",
};

const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

type Rule = [RegExp, string | ((m: RegExpExecArray) => string)];
const RULES: Rule[] = [
  // «Oct 23, 2026, 6:30 PM» → «23/10/2026 18:30»
  [/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)$/, (m) => {
    const mo = MONTHS[m[1]];
    if (!mo) return m[0];
    let h = Number(m[4]) % 12;
    if (m[6] === "PM") h += 12;
    return `${m[2].padStart(2, "0")}/${mo}/${m[3]} ${String(h).padStart(2, "0")}:${m[5]}`;
  }],
  [/^Open (.+)$/, "Mở $1"],
  [/^inference provider: (.+)$/, "nhà cung cấp suy luận: $1"],
  [/^env: (.+)$/, "biến môi trường: $1"],
  [/^Requirement: (.+)\. Tier ladder: Copper (\d+), Silver (\d+), Gold (\d+), Diamond (\d+), Olympian (\d+)\.$/, (m) =>
    `Điều kiện: ${REQUIREMENT[m[1]] ?? m[1]}. Các hạng: Đồng ${m[2]}, Bạc ${m[3]}, Vàng ${m[4]}, Kim cương ${m[5]}, Olympian ${m[6]}.`],
];

const LOWER: Record<string, string> = {};
for (const [k, v] of Object.entries(EXACT)) LOWER[k.toLowerCase()] = v;

/** Dịch một chuỗi (giữ khoảng trắng đầu/cuối); không có bản dịch thì trả nguyên. Xuất ra để kiểm thử. */
export function viTranslate(s: string): string {
  const core = s.trim();
  if (!core) return s;
  let out: string | undefined = LOWER[core.toLowerCase()];
  if (out === undefined) {
    for (const [re, rep] of RULES) {
      const m = re.exec(core);
      if (m) {
        out = typeof rep === "function" ? rep(m) : core.replace(re, rep);
        break;
      }
    }
  }
  if (out === undefined || out === core) return s;
  return s.replace(core, out);
}

let locale = "en";
let timer: ReturnType<typeof setTimeout> | null = null;
let observer: MutationObserver | null = null;

function applies(): boolean {
  if (locale !== "vi" || typeof window === "undefined") return false;
  const p = window.location.pathname;
  // trang «Công ty»/«Chính sách» có bộ i18n riêng; Kanban có lớp dịch riêng trong plugin
  return !(p.startsWith("/hermes-poclip") || p.startsWith("/kanban"));
}

function apply(): void {
  if (!applies()) return;
  const root = document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const el = n.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      const tag = el.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "CODE" || tag === "PRE" || el.closest(".xterm")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const v = n.nodeValue;
    if (v && v.trim()) {
      const o = viTranslate(v);
      if (o !== v) n.nodeValue = o;
    }
  }
  root.querySelectorAll("[title],[placeholder],[aria-label]").forEach((el) => {
    for (const a of ["title", "placeholder", "aria-label"]) {
      const v = el.getAttribute(a);
      if (v) {
        const o = viTranslate(v);
        if (o !== v) el.setAttribute(a, o);
      }
    }
  });
}

/** Bật lớp dịch (gọi một lần ở App) và cho nó biết ngôn ngữ hiện tại. */
export function setViOverlayLocale(next: string): void {
  locale = next;
  if (typeof document === "undefined") return;
  if (!observer && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => {
      if (locale !== "vi" || timer) return;
      timer = setTimeout(() => {
        timer = null;
        apply();
      }, 60);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["title", "placeholder", "aria-label"] });
  }
  if (locale === "vi") apply();
}
