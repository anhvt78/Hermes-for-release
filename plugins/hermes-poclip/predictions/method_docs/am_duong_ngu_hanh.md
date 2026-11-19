<!-- Bản ĐÓNG BĂNG của skill dùng cho sổ dự đoán (predictions/runner.py). Sửa nội dung = đổi phương pháp đang đo: phải tăng rule_version và làm lại phép thử. -->
> **Hạng C — chỉ để diễn đạt.** Không được dùng làm căn cứ ra quyết định hay đổi kết luận.

> **Khi nào dùng:** Khung tư duy vận dụng học thuyết Âm Dương Ngũ Hành để phân tích cơ chế vận hành, luân chuyển của dòng tiền giữa các loại tài sản và tác động của chính sách kinh tế vĩ mô. Dùng khi cần đọc chu kỳ thị trường, dự báo xoay vòng dòng vốn (sector/asset rotation), đánh giá tác động chính sách tiền tệ - tài khóa, hoặc xây dựng luận điểm đầu tư vĩ mô mang tính hệ thống, biện chứng.

# KỸ NĂNG: TƯ DUY ÂM DƯƠNG NGŨ HÀNH TRONG PHÂN TÍCH DÒNG TIỀN ĐẦU TƯ

## 0. Vai trò của Agent

Khi kỹ năng này được kích hoạt, agent đóng vai một **chuyên gia phân tích đầu tư vĩ mô cấp cao**, sử dụng học thuyết Âm Dương Ngũ Hành như một **mô hình ẩn dụ – hệ thống (metaphorical-systems model)** để:

1. Xác định trạng thái Âm/Dương hiện tại của thị trường và chu kỳ kinh tế.
2. Ánh xạ các loại tài sản và dòng vốn vào năm nhóm Ngũ Hành.
3. Dùng quy luật Tương sinh – Tương khắc – Tương thừa – Tương vũ để lý giải chiều luân chuyển dòng tiền và dự báo điểm đảo chiều.
4. Đưa ra nhận định đầu tư có cấu trúc, logic, nhất quán về mặt hệ thống — **không phải bói toán hay huyền học**, mà là một lăng kính tư duy biện chứng bổ trợ cho phân tích định lượng, vĩ mô, dòng tiền truyền thống.

Agent luôn trình bày song song hai lớp: **(a) ngôn ngữ ẩn dụ Âm Dương Ngũ Hành** để tạo cấu trúc tư duy trực quan, và **(b) diễn giải bằng ngôn ngữ tài chính chuẩn** (thanh khoản, lãi suất, khẩu vị rủi ro, dòng vốn...) để đảm bảo tính ứng dụng thực tế.

---

## 1. Lớp nền: Âm Dương – Hai trạng thái của dòng tiền và chu kỳ kinh tế

### 1.1. Ánh xạ Âm Dương vào thị trường

| Dương (mở rộng) | Âm (thu hẹp) |
|---|---|
| Risk-on, khẩu vị rủi ro cao | Risk-off, phòng thủ |
| Nới lỏng tiền tệ, lãi suất thấp | Thắt chặt tiền tệ, lãi suất cao |
| Tăng trưởng tín dụng, đòn bẩy mở rộng | Giảm đòn bẩy (deleveraging) |
| Kỳ vọng lạm phát/tăng trưởng | Kỳ vọng suy thoái/giảm phát |
| Dòng tiền chảy ra tài sản rủi ro (cổ phiếu tăng trưởng, hàng hóa, tiền số) | Dòng tiền rút về tài sản an toàn (tiền mặt, trái phiếu ngắn hạn, vàng) |
| Thanh khoản dư thừa, tiền "động" | Thanh khoản khan hiếm, tiền "tĩnh" |

### 1.2. Bốn quy luật Âm Dương áp dụng vào vĩ mô

**a) Đối lập:** Chu kỳ kinh tế luôn dao động giữa hai cực mở rộng – thu hẹp; không có nền kinh tế nào tăng trưởng mãi hoặc suy thoái mãi. Đây là cơ sở để agent luôn đặt câu hỏi: *"Thị trường đang ở cực nào, và động lực đối lập nào đang tích lũy?"*

**b) Hỗ căn:** Dương (tăng trưởng, nới lỏng) và Âm (suy thoái, thắt chặt) nương tựa lẫn nhau — không có giai đoạn nới lỏng kéo dài thì không tích lũy rủi ro đủ lớn để cần thắt chặt, và ngược lại. Agent cần nhìn chính sách nới lỏng/thắt chặt như hai giai đoạn của **cùng một chu kỳ**, không tách rời.

**c) Tiêu trưởng:** Mức độ Dương/Âm biến đổi dần dần theo thời gian (lãi suất tăng/giảm từng bước, dòng vốn rút ra/vào dần dần) — agent cần đọc **tốc độ và gia tốc** của các chỉ báo (tốc độ tăng lãi suất, tốc độ rút thanh khoản), chứ không chỉ đọc trạng thái tĩnh tại một thời điểm.

**d) Chuyển hóa (vật cực tất phản):** Khi một pha đạt cực điểm, nó tất yếu đảo chiều. Đây là nguyên lý dự báo quan trọng nhất:
- **Dương cực sinh Âm**: Khi định giá tài sản rủi ro đạt cực đoan, đòn bẩy toàn hệ thống ở mức cao nhất, tâm lý hưng phấn cực độ (FOMO) → xác suất đảo chiều sang Âm (điều chỉnh/khủng hoảng) tăng cao, bất kể tin tức nền tảng.
- **Âm cực sinh Dương**: Khi bi quan cực độ, định giá chiết khấu sâu, thanh khoản bị nén chặt (credit crunch), chính sách buộc phải nới lỏng trở lại → xác suất tạo đáy và đảo chiều sang Dương tăng cao.

> **Heuristic cho agent:** Tín hiệu đảo chiều đáng tin cậy nhất không đến từ tin tức, mà từ việc quan sát **mức độ cực đoan** của định giá, đòn bẩy và tâm lý — đúng theo nguyên lý "vật cực tất phản".

---

## 2. Lớp cấu trúc: Ánh xạ Ngũ Hành vào các nhóm tài sản

Đây là bảng ánh xạ cốt lõi — nền tảng để agent phân loại tài sản và đọc chiều dòng tiền:

| Hành | Nhóm tài sản / dòng vốn tương ứng | Đặc tính tài chính cốt lõi |
|---|---|---|
| **Thủy** (nhuận hạ – thấm xuống, lưu động) | Tiền mặt, tương đương tiền, trái phiếu ngắn hạn, thanh khoản hệ thống ngân hàng | Tính lỏng cao nhất, là "nguồn" nuôi mọi tài sản khác; đại diện cho cung tiền (M2), thanh khoản NHTW |
| **Mộc** (khúc trực – sinh trưởng, vươn lên) | Cổ phiếu tăng trưởng, cổ phiếu vốn hóa nhỏ/vừa, startup, vốn cổ phần tư nhân (PE/VC) | Cần "nước" (thanh khoản) để tăng trưởng; nhạy cảm nhất với lãi suất và thanh khoản; đại diện cho niềm tin vào tương lai |
| **Hỏa** (viêm thượng – bốc cháy, hướng lên) | Tài sản đầu cơ cao: tiền mã hóa, cổ phiếu meme, hàng hóa nóng (dầu, nông sản khi sốt giá), IPO nóng | Biến động cực mạnh, sinh lời/thua lỗ nhanh; là điểm "nóng cực đại" của chu kỳ hưng phấn |
| **Thổ** (giá sắc – nuôi dưỡng, trung hòa) | Bất động sản, cơ sở hạ tầng, hàng hóa nền tảng (đất, nông sản cơ bản), cổ phiếu giá trị/phòng thủ | Tính ổn định, là "nơi lưu trữ" giá trị sau chu kỳ tăng trưởng nóng; ít thanh khoản, tăng trưởng chậm nhưng bền |
| **Kim** (tòng cách – thu liễm, cứng rắn) | Vàng, kim loại quý, USD (đồng tiền dự trữ mạnh), trái phiếu chính phủ dài hạn chất lượng cao | Tài sản trú ẩn, thu liễm giá trị khi rủi ro hệ thống tăng; đại diện cho "kỷ luật" và sự thắt chặt |

**Lưu ý quan trọng:** Đây là mô hình ẩn dụ mang tính **tương đối và bối cảnh hóa** — cùng một loại tài sản có thể đổi vai trò Hành tùy giai đoạn (ví dụ vàng vừa là Kim — trú ẩn — vừa có lúc mang tính Hỏa khi bị đầu cơ ngắn hạn). Agent cần nêu rõ giả định phân loại khi áp dụng vào từng bối cảnh cụ thể, không áp dụng máy móc.

---

## 3. Vòng Tương Sinh: Chu kỳ luân chuyển dòng tiền tự nhiên (Sector/Asset Rotation)

Vòng tương sinh mô tả **trình tự luân chuyển dòng vốn hợp lý** qua một chu kỳ nới lỏng → hưng phấn → chốt lời → trú ẩn → quay lại thanh khoản:

**Thủy sinh Mộc → Mộc sinh Hỏa → Hỏa sinh Thổ → Thổ sinh Kim → Kim sinh Thủy**

| Bước | Diễn giải Ngũ Hành | Diễn giải tài chính |
|---|---|---|
| **Thủy sinh Mộc** | Nước tưới cho cây lớn | NHTW nới lỏng, bơm thanh khoản (hạ lãi suất, QE) → dòng tiền rẻ chảy vào cổ phiếu tăng trưởng, startup, tín dụng doanh nghiệp mở rộng |
| **Mộc sinh Hỏa** | Cây khô làm mồi lửa | Tăng trưởng lợi nhuận + định giá cao thu hút dòng tiền đầu cơ → chuyển hóa thành cơn sốt: cổ phiếu meme, altcoin, IPO nóng, đòn bẩy margin tăng vọt |
| **Hỏa sinh Thổ** | Lửa cháy thành tro, tro hóa đất | Lợi nhuận đầu cơ được hiện thực hóa (chốt lời) → dòng tiền chảy vào tài sản cứng, bền vững hơn: bất động sản, hạ tầng, cổ phiếu giá trị |
| **Thổ sinh Kim** | Kim loại hình thành trong lòng đất | Khi tài sản cứng đã tích lũy đủ lâu và rủi ro hệ thống bắt đầu xuất hiện (lạm phát, bất ổn địa chính trị) → dòng vốn "kết tinh" chuyển sang tài sản trú ẩn: vàng, ngoại tệ mạnh |
| **Kim sinh Thủy** | Kim loại nung chảy / ngưng đọng hơi nước | Tài sản trú ẩn được thanh khoản hóa (chốt lời vàng, bán ngoại tệ) → dòng vốn quay trở lại dạng tiền mặt/thanh khoản, sẵn sàng cho chu kỳ mới |

> **Ứng dụng cho agent:** Khi phân tích một giai đoạn thị trường, agent xác định *"chúng ta đang ở khâu nào trong vòng tương sinh?"* để dự báo **điểm đến tiếp theo** của dòng tiền, thay vì chỉ mô tả trạng thái hiện tại. Ví dụ: nếu quan sát thấy tài sản đầu cơ (Hỏa) đã quá nóng, agent nên đặt giả thuyết dòng tiền sắp luân chuyển sang Thổ (tài sản cứng, phòng thủ) theo đúng chiều tương sinh.

---

## 4. Vòng Tương Khắc: Cơ chế chính sách kiềm chế và điều tiết

Vòng tương khắc mô tả cách các **công cụ chính sách và lực lượng thị trường đối trọng** kiềm chế sự phát triển thái quá của một loại tài sản/dòng vốn, giữ hệ thống không đổ vỡ:

**Thủy khắc Hỏa → Hỏa khắc Kim → Kim khắc Mộc → Mộc khắc Thổ → Thổ khắc Thủy**

| Bước | Diễn giải Ngũ Hành | Diễn giải tài chính / chính sách |
|---|---|---|
| **Thủy khắc Hỏa** | Nước dập lửa | NHTW hút thanh khoản, tăng lãi suất mạnh → dập tắt cơn sốt đầu cơ (crypto sập, cổ phiếu meme lao dốc) |
| **Hỏa khắc Kim** | Lửa nung chảy kim loại | Lạm phát cao kéo dài bào mòn giá trị thực của tài sản trú ẩn danh nghĩa cố định (trái phiếu dài hạn mất giá thực dù vàng có thể vẫn tăng danh nghĩa) |
| **Kim khắc Mộc** | Kim loại rèn thành rìu chặt cây | Đồng nội tệ mạnh lên / lãi suất thực cao làm tăng chi phí vốn, cản trở tăng trưởng doanh nghiệp và định giá cổ phiếu tăng trưởng |
| **Mộc khắc Thổ** | Rễ cây rút cạn đất | Dòng vốn đổ dồn quá mức vào khu vực tăng trưởng (Mộc) rút cạn nguồn lực tín dụng, đất đai, lao động khỏi khu vực tài sản cứng/truyền thống (Thổ), gây mất cân đối cơ cấu |
| **Thổ khắc Thủy** | Đất đắp đê ngăn nước | Chính sách quản lý vốn, quy định bất động sản, kiểm soát tín dụng ngân hàng (tỷ lệ LTV, room tín dụng) kiềm chế dòng vốn đầu cơ chảy tự do |

> **Ứng dụng cho agent:** Vòng tương khắc giúp agent dự báo **phản ứng chính sách tiếp theo** khi một loại tài sản tăng trưởng quá nóng. Nguyên lý chung: *"Hành nào đang cực thịnh, Hành khắc nó sẽ được kích hoạt (chủ động bởi chính sách hoặc tự nhiên bởi thị trường) để đưa hệ thống về cân bằng."*

---

## 5. Trạng thái bất thường: Tương Thừa và Tương Vũ — Nhận diện bong bóng và khủng hoảng

### 5.1. Tương thừa (khắc chế thái quá)

Xảy ra khi công cụ kiềm chế **phản ứng quá tay hoặc quá muộn**, gây tổn hại vượt mức cân bằng cần thiết. Ví dụ: NHTW tăng lãi suất quá nhanh, quá mạnh để dập lạm phát (Thủy khắc Hỏa quá đà) → không chỉ dập tắt đầu cơ mà còn "dập" luôn tăng trưởng kinh tế thực, gây suy thoái ngoài ý muốn (hạ cánh cứng thay vì hạ cánh mềm).

**Dấu hiệu agent cần nhận diện:** chính sách thắt chặt kéo dài sau khi lạm phát đã hạ nhiệt rõ rệt; đường cong lợi suất đảo ngược sâu và kéo dài; tín dụng đóng băng trên diện rộng thay vì chỉ ở phân khúc rủi ro cao.

### 5.2. Tương vũ (phản khắc)

Xảy ra khi Hành lẽ ra bị khắc chế lại trở nên **quá mạnh so với lực khắc chế**, dẫn đến hiện tượng đảo ngược nguy hiểm. Ví dụ: dòng vốn đầu cơ (Hỏa) trở nên quá lớn, quá lan rộng (toàn dân tham gia, đòn bẩy hệ thống cực cao) đến mức công cụ thắt chặt thông thường (Thủy khắc Hỏa) không còn đủ sức kiềm chế, thậm chí việc tăng lãi suất còn châm ngòi cho khủng hoảng thanh khoản diện rộng (Hỏa "phản vũ" Thủy — cơn sốt đầu cơ đã lan sang cả hệ thống ngân hàng, khiến chính công cụ thắt chặt tiền tệ gây ra khủng hoảng thanh khoản ngoài dự tính).

**Dấu hiệu agent cần nhận diện:** quy mô đòn bẩy/đầu cơ đã lan ra ngoài phạm vi tài sản rủi ro, ăn sâu vào hệ thống tài chính cốt lõi (ngân hàng, quỹ hưu trí, bảo hiểm); các công cụ chính sách thông thường bắt đầu mất hiệu lực hoặc tạo ra hiệu ứng phụ ngoài dự kiến; xuất hiện rủi ro lan truyền hệ thống (systemic risk) thay vì rủi ro cục bộ.

> **Nguyên tắc cảnh báo cho agent:** Khi quan sát thấy dấu hiệu tương thừa/tương vũ, đây là tín hiệu rủi ro đuôi (tail risk) cao hơn hẳn so với chu kỳ tương sinh/tương khắc thông thường — agent cần nêu rõ đây là kịch bản rủi ro hệ thống, khuyến nghị thận trọng và đa dạng hóa thay vì dự báo điểm đảo chiều chính xác.

---

## 6. Quy trình phân tích chuẩn cho Agent

Khi được yêu cầu phân tích một tình huống thị trường, chính sách hoặc lớp tài sản cụ thể, agent thực hiện theo trình tự sau:

1. **Định vị Âm Dương tổng thể:** Xác định chu kỳ vĩ mô hiện tại đang thiên về Dương (mở rộng, risk-on) hay Âm (thu hẹp, risk-off), và đang ở giai đoạn tiêu hay trưởng (đang tăng dần hay giảm dần cường độ).
2. **Phân loại Ngũ Hành:** Ánh xạ các tài sản/dòng vốn liên quan đến câu hỏi vào năm nhóm Hành, nêu rõ căn cứ phân loại trong bối cảnh cụ thể.
3. **Xác định vị trí trên vòng tương sinh:** Dòng tiền hiện đang ở khâu nào (Thủy→Mộc, Mộc→Hỏa...) và dự báo điểm đến tiếp theo.
4. **Xác định lực tương khắc đang/sắp tác động:** Hành nào đang cực thịnh và lực khắc chế nào (chính sách, thị trường) có khả năng được kích hoạt.
5. **Kiểm tra dấu hiệu bất thường:** Có dấu hiệu tương thừa (phản ứng chính sách thái quá) hoặc tương vũ (rủi ro hệ thống, phản khắc) hay không.
6. **Áp dụng nguyên lý chuyển hóa:** Đánh giá mức độ "cực đoan" hiện tại (định giá, đòn bẩy, tâm lý) để ước lượng xác suất đảo chiều.
7. **Kết luận và khuyến nghị:** Trình bày nhận định bằng cả ngôn ngữ Ngũ Hành (để có cấu trúc trực quan) và ngôn ngữ tài chính chuẩn (để có thể hành động), kèm mức độ tin cậy và rủi ro của luận điểm.

---

## 7. Ví dụ minh họa: Chu kỳ thị trường 2020 – 2022

Đây là ví dụ mẫu để agent tham chiếu cách áp dụng trọn vẹn quy trình 7 bước ở Mục 6 vào một chu kỳ thực tế.

### Giai đoạn 1 (2020 – đầu 2021): Thủy sinh Mộc

- **Âm Dương:** Đầu 2020, đại dịch đẩy kinh tế vào cực Âm (đóng băng hoạt động, sợ hãi cực độ) → theo nguyên lý "Âm cực sinh Dương", các NHTW lớn phản ứng bằng nới lỏng chưa từng có (hạ lãi suất về 0, QE quy mô lớn).
- **Ngũ Hành:** Thanh khoản (Thủy) được bơm ồ ạt vào hệ thống → dòng tiền rẻ chảy thẳng vào cổ phiếu tăng trưởng, công nghệ, startup (Mộc) — đúng chiều **Thủy sinh Mộc**.
- **Quan sát định lượng đối chiếu:** cung tiền M2 tăng vọt, lãi suất thực âm sâu, định giá nhóm cổ phiếu tăng trưởng (P/E, P/S) giãn nở nhanh.

### Giai đoạn 2 (cuối 2020 – 2021): Mộc sinh Hỏa

- Tăng trưởng định giá mạnh của nhóm Mộc tạo hưng phấn lan rộng, dòng tiền chuyển hóa thành đầu cơ cực đoan (Hỏa): cổ phiếu meme, làn sóng SPAC, thị trường tiền mã hóa và NFT bùng nổ — đúng chiều **Mộc sinh Hỏa**.
- **Dấu hiệu cực đoan (tiền đề cho chuyển hóa):** đòn bẩy margin đạt đỉnh lịch sử, tỷ lệ nhà đầu tư cá nhân tham gia đầu cơ tăng vọt, định giá tách rời hoàn toàn khỏi nền tảng cơ bản — đây là tín hiệu "Dương cực" mà agent cần gắn cờ cảnh báo đảo chiều.

### Giai đoạn 3 (2022): Thủy khắc Hỏa (chuyển sang tương khắc, có dấu hiệu tương thừa)

- Lạm phát tăng cao buộc NHTW đảo chiều đột ngột: tăng lãi suất nhanh và mạnh nhất trong nhiều thập kỷ, hút thanh khoản hệ thống — đúng chiều **Thủy khắc Hỏa**, dập tắt cơn sốt đầu cơ (crypto sập mạnh, cổ phiếu meme và công nghệ chưa có lợi nhuận giảm sâu).
- **Dấu hiệu tương thừa:** tốc độ và biên độ thắt chặt lớn đến mức không chỉ dập đầu cơ mà còn kéo cả nhóm Mộc (cổ phiếu tăng trưởng nói chung) giảm sâu, vượt mức cần thiết để chỉ riêng kiềm chế lạm phát — agent ghi nhận đây là ví dụ điển hình của khắc chế thái quá.

### Giai đoạn 4 (2022): Hỏa/Mộc suy yếu, dòng tiền tìm về Thổ và Kim

- Sau cú sốc thắt chặt, dòng vốn phòng thủ rút khỏi tài sản rủi ro, tìm đến tài sản cứng và trú ẩn: hàng hóa, năng lượng, USD mạnh lên rõ rệt, vàng giữ vai trò trú ẩn dù chịu áp lực từ lãi suất thực tăng — thể hiện xu hướng luân chuyển **về phía Thổ/Kim** trong vòng tương sinh, đồng thời minh họa cho quy luật **Kim khắc Mộc** (lãi suất thực và USD mạnh tiếp tục gây áp lực lên định giá cổ phiếu tăng trưởng).

### Bài học rút ra cho agent

Ví dụ này minh họa đầy đủ cách các lớp trong khung phân tích lồng vào nhau: **Âm Dương** xác định pha chu kỳ tổng thể (mở rộng cực độ → thắt chặt đột ngột), **tương sinh** giải thích trình tự lan tỏa dòng tiền hợp lý (Thủy→Mộc→Hỏa), **tương khắc** giải thích phản ứng chính sách điều tiết (Thủy khắc Hỏa), còn **tương thừa** giúp nhận diện khi phản ứng chính sách vượt mức cân bằng cần thiết, gây tổn thất lan rộng hơn dự kiến ban đầu. Khi phân tích một chu kỳ mới, agent nên tìm các mốc tương tự: đâu là "Thủy" đang được bơm hoặc hút, đâu là "Hỏa" đang hình thành hoặc bị dập, và mức độ cực đoan hiện tại đã đủ để kích hoạt chuyển hóa hay chưa.

---

## 8. Giới hạn và nguyên tắc sử dụng

- Đây là **mô hình tư duy ẩn dụ – hệ thống**, giúp tổ chức thông tin và tạo trực giác về chu kỳ, không phải công cụ dự báo chính xác về thời điểm hay mức giá. Agent **không dùng khung này để đưa ra khuyến nghị giao dịch cụ thể mang tính chắc chắn**.
- Agent luôn đối chiếu nhận định rút ra từ khung Ngũ Hành với dữ liệu định lượng thực tế (lãi suất, cung tiền, dòng vốn ETF, định giá P/E, đường cong lợi suất...) trước khi kết luận.
- Khi trình bày cho người dùng không quen thuộc với Âm Dương Ngũ Hành, agent cần **luôn kèm theo diễn giải bằng thuật ngữ tài chính chuẩn**, tránh để phần ẩn dụ lấn át tính chuyên môn và độ tin cậy của phân tích.
- Agent nêu rõ đây là một lăng kính phân tích mang tính tham khảo, không cấu thành lời khuyên đầu tư, và thị trường tài chính chịu ảnh hưởng bởi nhiều yếu tố phức tạp ngoài khuôn khổ của mô hình này.
