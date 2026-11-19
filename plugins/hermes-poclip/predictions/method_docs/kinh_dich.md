<!-- Bản ĐÓNG BĂNG của skill dùng cho sổ dự đoán (predictions/runner.py). Sửa nội dung = đổi phương pháp đang đo: phải tăng rule_version và làm lại phép thử. -->
> **Hạng C — chỉ để diễn đạt.** Không được dùng làm căn cứ ra quyết định hay đổi kết luận.

> **Khi nào dùng:** Phương pháp lập quẻ Kinh Dịch từ dữ liệu thực tế (không phải bói toán ngẫu nhiên) để chẩn đoán trạng thái hiện tại của một hạng mục đầu tư/kinh doanh, định lượng % thuận lợi/rủi ro và độ tin cậy dữ liệu theo từng hào, suy ra kịch bản hai chiều tích cực/tiêu cực kèm xác suất - mức tác động, và xác định khi nào đủ căn cứ hành động hay cần bổ sung dữ liệu. Kèm bảng tra đầy đủ 64 quẻ.

# KỸ NĂNG: LẬP QUẺ KINH DỊCH ĐỂ PHÂN TÍCH TRẠNG THÁI VÀ KỊCH BẢN ĐẦU TƯ

## 0. Vai trò của Agent

Khi kỹ năng này được kích hoạt, agent sử dụng 64 quẻ Kinh Dịch như một **khung phân tích kịch bản có cấu trúc** (tương tự scenario/sensitivity analysis trong tài chính), được diễn đạt bằng ngôn ngữ Dịch lý để cô đọng và trình bày trực quan một trạng thái phức tạp thành một "archetype" dễ ghi nhớ, dễ trao đổi.

**Nguyên tắc bắt buộc:** Đây là phương pháp **suy luận có căn cứ từ dữ liệu quan sát được**, hoàn toàn khác với gieo quẻ ngẫu nhiên (đồng xu/cỏ thi) mang tính chiêm nghiệm. Agent không dùng khung này để "tiên tri", không thay thế phân tích tài chính, dòng tiền, định giá — mà dùng để **hệ thống hóa và trình bày** một nhận định đã được xây dựng từ dữ liệu thực tế.

---

## 1. Quy trình 8 bước

### Bước 1 — Gán 6 hào cho 6 lớp yếu tố của hạng mục đầu tư

| Hào | Vị trí | Lớp yếu tố | Câu hỏi đánh giá |
|---|---|---|---|
| Hào 1 (Sơ) | Đáy | Nền tảng gốc: dòng tiền, lợi nhuận, sức khỏe tài chính cốt lõi | Dòng tiền/lợi nhuận đang dương, ổn định hay âm, bấp bênh? |
| Hào 2 | Trong | Năng lực vận hành nội bộ: đội ngũ, mô hình kinh doanh, quản trị | Bộ máy vận hành có hiệu quả, có lợi thế cạnh tranh nội tại không? |
| Hào 3 | Trong-trên | Vị thế cạnh tranh trực tiếp: thị phần, đối thủ cùng phân khúc | Vị thế đang củng cố hay bị lấn át? |
| Hào 4 | Ngoài | Môi trường liên kết gần: đối tác, chuỗi cung ứng, chủ nợ, nhà đầu tư liên quan | Các ràng buộc bên ngoài đang hỗ trợ hay gây áp lực? |
| Hào 5 | Ngoài-trên | Yếu tố chi phối/quyền lực: lãnh đạo cấp cao, cơ quan quản lý, chính sách trực tiếp | Người/cơ chế ra quyết định chính đang thuận lợi hay cản trở? |
| Hào 6 (Thượng) | Đỉnh | Bối cảnh vĩ mô tổng thể: chu kỳ kinh tế, lãi suất, địa chính trị | Bối cảnh lớn đang thuận (mở rộng) hay nghịch (thắt chặt/bất ổn)? |

**Nguyên tắc gán giá trị (có trọng số và định lượng %):** với mỗi lớp, liệt kê 2–3 chỉ báo cụ thể, có thể kiểm chứng bằng dữ liệu — không dùng cảm tính. Thay vì chỉ đếm "đa số", thực hiện theo 3 tiểu bước:

1. **Gán trọng số cho từng chỉ báo** trong hào (tổng = 100%) theo mức độ quan trọng thực tế đối với hạng mục — ví dụ ở Hào 1 (nền tảng gốc): dòng tiền hoạt động 50%, biên lợi nhuận 30%, tỷ lệ nợ/vốn 20%.
2. **Chấm điểm mỗi chỉ báo theo thang thuận lợi (%) và rủi ro (%)** sao cho hai giá trị cộng lại = 100% (ví dụ dòng tiền: 70% thuận lợi / 30% rủi ro nếu dòng tiền dương nhưng đang chậm lại).
3. **Tính % thuận lợi tổng của cả hào** = tổng (trọng số × % thuận lợi của từng chỉ báo). Quy tắc gán Âm/Dương: ≥ 65% thuận lợi → **Dương (—)**; ≤ 35% thuận lợi → **Âm (- -)**; nằm trong khoảng 35–65% → **vùng mơ hồ**, đánh dấu hào đó là ứng viên "hào động" ở Bước 4.

**Đồng thời gán "Độ tin cậy dữ liệu"** cho mỗi hào — **Cao** (dữ liệu định lượng, kiểm chứng độc lập được), **Trung bình** (dữ liệu gián tiếp/suy đoán có cơ sở), hoặc **Thấp** (chủ yếu là ước đoán, tin đồn, thiếu nguồn xác thực). Một hào có % thuận lợi cao nhưng độ tin cậy Thấp **không được coi ngang hàng** với một hào có % thuận lợi cao và độ tin cậy Cao khi tổng hợp kết luận ở Bước 3 và Bước 6.

**Bảng ghi nhận mẫu cho mỗi hào:**

| Hào | Chỉ báo | Trọng số | % Thuận lợi | % Rủi ro | Độ tin cậy dữ liệu |
|---|---|---|---|---|---|
| [Số hào] | [Chỉ báo 1] | [x%] | [%] | [%] | Cao/Trung bình/Thấp |
| | [Chỉ báo 2] | [x%] | [%] | [%] | Cao/Trung bình/Thấp |
| | **Tổng hợp hào** | 100% | **[% thuận lợi tổng]** | **[% rủi ro tổng]** | [Cao/TB/Thấp — lấy mức thấp nhất trong các chỉ báo cấu thành] |

### Bước 2 — Ghép quẻ từ 6 hào

Nhóm hào 1-2-3 (hạ quái) và hào 4-5-6 (thượng quái), tra theo bảng bát quái:

| Quái | Mã hào (dưới→trên) | Tên tự nhiên |
|---|---|---|
| ☰ Càn | Dương-Dương-Dương | Thiên |
| ☷ Khôn | Âm-Âm-Âm | Địa |
| ☳ Chấn | Dương-Âm-Âm | Lôi |
| ☵ Khảm | Âm-Dương-Âm | Thủy |
| ☶ Cấn | Âm-Âm-Dương | Sơn |
| ☴ Tốn | Âm-Dương-Dương | Phong |
| ☲ Ly | Dương-Âm-Dương | Hỏa |
| ☱ Đoài | Dương-Dương-Âm | Trạch |

Tên quẻ = [Tên thượng quái] + [Tên hạ quái] (hai quái trùng nhau → "Thuần" + tên quái). Tra tên/ý nghĩa đầy đủ trong Bảng 64 quẻ ở Mục 2.

### Bước 3 — Đọc "bản quái" = trạng thái hiện tại

Ý nghĩa cốt lõi của quẻ vừa lập là chẩn đoán tổng quát về hạng mục đầu tư tại thời điểm hiện tại.

### Bước 4 — Xác định "hào động" (điểm dễ biến đổi nhất)

Đánh dấu một hào là hào động nếu rơi vào một trong các trường hợp: (a) **% thuận lợi nằm trong vùng mơ hồ 35–65%** (theo tính toán ở Bước 1); (b) độ tin cậy dữ liệu ở mức **Thấp** dù % thuận lợi/rủi ro có vẻ rõ ràng — vì con số rõ ràng dựa trên dữ liệu yếu vẫn tiềm ẩn khả năng đảo chiều cao; (c) chỉ báo vừa đảo chiều gần đây, chưa đủ thời gian xác nhận xu hướng; (d) có sự kiện sắp diễn ra tác động trực tiếp đến lớp yếu tố đó. Chỉ nên đánh dấu tối đa 1–2 hào động; nhiều hơn là dấu hiệu tình huống đang rất bất định, cần nêu rõ trong kết luận.

### Bước 5 — Tạo "quẻ biến" theo HAI CHIỀU cho từng hào động

Khác với việc chỉ lật một chiều, với **mỗi hào động** cần lập cả hai kịch bản đối lập:

- **Chiều tiêu cực:** nếu % thuận lợi của hào tiếp tục giảm xuống dưới ngưỡng 35% → hào chuyển hẳn thành Âm (- -) → ghép thành **quẻ biến xấu**.
- **Chiều tích cực:** nếu % thuận lợi của hào tăng vượt ngưỡng 65% → hào chuyển hẳn thành Dương (—) → ghép thành **quẻ biến tốt**.

Với mỗi chiều, ước lượng thêm hai thông số (dạng %, có thể là khoảng ước lượng, không cần chính xác tuyệt đối):
- **Xác suất xảy ra (Likelihood %):** khả năng chiều này thực sự diễn ra trong kỳ đánh giá tới, dựa trên xu hướng gần đây của chỉ báo.
- **Mức độ tác động (Impact %):** nếu xảy ra, mức độ ảnh hưởng đến giá trị/an toàn tổng thể của hạng mục (ước lượng theo quy mô % giá trị hoặc dòng tiền có thể bị ảnh hưởng).

Nếu có ≥2 hào động, có thể lập thêm **"quẻ biến toàn phần"** (tất cả hào động cùng lật theo chiều xấu, hoặc cùng lật theo chiều tốt) làm hai kịch bản cực đoan (bi quan nhất / lạc quan nhất).

### Bước 6 — Bảng tổng hợp phán đoán khả năng (kèm thông số %)

| Kịch bản | Chiều | Điều kiện kích hoạt | Xác suất (%) | Mức tác động (%) | Quẻ tương ứng | Hàm ý hành động |
|---|---|---|---|---|---|---|
| Cơ sở (bản quái) | — | Giữ nguyên trạng thái hiện tại | — | — | [Quẻ gốc] | Diễn giải theo ý nghĩa quẻ gốc |
| Kịch bản A – Xấu | Tiêu cực | [Chỉ báo hào động 1 xấu đi dưới ngưỡng 35%] | [%] | [%] | [Quẻ biến xấu A] | [Hành động phòng vệ/giảm thiểu rủi ro] |
| Kịch bản A – Tốt | Tích cực | [Chỉ báo hào động 1 cải thiện trên ngưỡng 65%] | [%] | [%] | [Quẻ biến tốt A] | [Hành động tận dụng cơ hội] |
| Kịch bản B (nếu có hào động 2) | Tiêu cực/Tích cực | [Chỉ báo hào động 2] | [%] | [%] | [Quẻ biến B] | [Hành động tương ứng] |
| Kịch bản cực đoan bi quan (nếu ≥2 hào động) | Tiêu cực toàn phần | [Tổ hợp điều kiện xấu nhất] | [%] | [%] | [Quẻ biến toàn phần xấu] | [Hành động phòng vệ khẩn cấp] |
| Kịch bản cực đoan lạc quan (nếu ≥2 hào động) | Tích cực toàn phần | [Tổ hợp điều kiện tốt nhất] | [%] | [%] | [Quẻ biến toàn phần tốt] | [Hành động tận dụng tối đa] |

> **Lưu ý về con số %:** các giá trị Xác suất và Mức tác động là **ước lượng có chủ đích của người/agent phân tích dựa trên dữ liệu và kinh nghiệm quan sát**, không phải xác suất thống kê được kiểm định chặt chẽ. Mục đích là tạo cơ sở **so sánh tương đối** giữa các kịch bản (kịch bản nào đáng lo hơn, đáng kỳ vọng hơn) để ưu tiên theo dõi, không phải để tính toán chính xác giá trị kỳ vọng (expected value) một cách máy móc.

### Bước 7 — Giám sát và lặp lại

Quy trình động, không phải một lần: định kỳ (tháng/quý, hoặc khi có sự kiện lớn) cập nhật lại % thuận lợi/rủi ro và độ tin cậy của 6 hào theo dữ liệu mới, lập lại quẻ, so sánh với quẻ kỳ trước để xác nhận tình huống đã "biến" đúng kịch bản dự đoán hay chưa — và điều chỉnh lại xác suất/mức tác động của các kịch bản còn lại cho kỳ tiếp theo.

### Bước 8 — Sổ ghi nhận khoảng trống dữ liệu và rủi ro do thiếu thông tin

Đây là bước bắt buộc trước khi đưa ra kết luận cuối cùng, tách bạch hai loại rủi ro khác nhau: **rủi ro nội tại của hạng mục** (đã phản ánh qua % rủi ro ở Bước 1) và **rủi ro phát sinh từ việc thiếu/yếu dữ liệu** (chưa chắc hạng mục thực sự rủi ro, nhưng agent/người phân tích không đủ căn cứ để kết luận chắc chắn).

**Bảng ghi nhận:**

| Hào/Lớp yếu tố | Thông tin còn thiếu | Vì sao quan trọng | Độ ưu tiên bổ sung (Cao/TB/Thấp) |
|---|---|---|---|
| [Số hào] | [Dữ liệu cụ thể chưa có, ví dụ: báo cáo tài chính quý gần nhất chưa công bố] | [Ảnh hưởng gì đến độ tin cậy của kết luận nếu thiếu] | Cao/TB/Thấp |

**Quy tắc quyết định (mượn nguyên lý ngưỡng từ khung Alden 2-2-6):**
- Nếu tổng hợp toàn bộ 6 hào đạt **độ tin cậy dữ liệu Cao/Trung bình ở ít nhất 5/6 hào**, và không có hào nào vừa nằm trong vùng mơ hồ (35–65%) vừa có độ tin cậy Thấp → coi tình huống đủ căn cứ để **hành động** theo kết luận ở Bước 3 và Bước 6.
- Nếu có **từ 2 hào trở lên** vừa nằm trong vùng mơ hồ **vừa** có độ tin cậy dữ liệu Thấp → xếp toàn bộ đánh giá vào **"vùng chưa đủ căn cứ"**: agent phải nêu rõ đây là kết luận **tạm thời, rủi ro cao do thiếu thông tin** (chứ không phải do bản thân hạng mục xấu), ưu tiên khuyến nghị **thu thập thêm dữ liệu ở các hào có độ ưu tiên Cao** trước khi hành động, thay vì vội đưa ra khuyến nghị mua/bán/giữ.

---

## 2. Bảng tra 64 quẻ (thứ tự Văn Vương)

| STT | Tên quẻ | Ý nghĩa cốt lõi |
|---|---|---|
| 1 | Thuần Càn | Trời, sáng tạo, cương kiện |
| 2 | Thuần Khôn | Đất, nhu thuận, sinh dưỡng |
| 3 | Thủy Lôi Truân | Gian nan buổi đầu |
| 4 | Sơn Thủy Mông | Non dại, cần khai mông |
| 5 | Thủy Thiên Nhu | Chờ đợi, nuôi dưỡng |
| 6 | Thiên Thủy Tụng | Tranh chấp, kiện tụng |
| 7 | Địa Thủy Sư | Quân đội, dụng binh |
| 8 | Thủy Địa Tỷ | Thân gần, đoàn kết |
| 9 | Phong Thiên Tiểu Súc | Tích lũy nhỏ |
| 10 | Thiên Trạch Lý | Giẫm lên, cẩn trọng hành xử |
| 11 | Địa Thiên Thái | Thông thái, hanh thông |
| 12 | Thiên Địa Bĩ | Bế tắc, trở ngại |
| 13 | Thiên Hỏa Đồng Nhân | Hòa đồng, hợp tác |
| 14 | Hỏa Thiên Đại Hữu | Sở hữu lớn, thịnh vượng |
| 15 | Địa Sơn Khiêm | Khiêm tốn |
| 16 | Lôi Địa Dự | Vui vẻ, chuẩn bị |
| 17 | Trạch Lôi Tùy | Tùy thời, thuận theo |
| 18 | Sơn Phong Cổ | Việc hỏng cần sửa |
| 19 | Địa Trạch Lâm | Đến gần, giám sát |
| 20 | Phong Địa Quán | Quan sát, chiêm ngưỡng |
| 21 | Hỏa Lôi Phệ Hạp | Trừ khử trở ngại, hình phạt |
| 22 | Sơn Hỏa Bí | Trang sức, văn vẻ |
| 23 | Sơn Địa Bác | Bóc lột, suy tàn |
| 24 | Địa Lôi Phục | Trở lại, hồi sinh |
| 25 | Thiên Lôi Vô Vọng | Không vọng động, chân thật |
| 26 | Sơn Thiên Đại Súc | Tích lũy lớn |
| 27 | Sơn Lôi Di | Nuôi dưỡng, ăn uống |
| 28 | Trạch Phong Đại Quá | Quá độ lớn, nguy hiểm |
| 29 | Thuần Khảm | Hiểm nạn, nước sâu |
| 30 | Thuần Ly | Lửa, sáng rực, bám vào |
| 31 | Trạch Sơn Hàm | Cảm ứng, giao cảm |
| 32 | Lôi Phong Hằng | Bền vững, lâu dài |
| 33 | Thiên Sơn Độn | Lui ẩn, rút lui |
| 34 | Lôi Thiên Đại Tráng | Mạnh mẽ lớn |
| 35 | Hỏa Địa Tấn | Tiến lên |
| 36 | Địa Hỏa Minh Di | Ánh sáng bị tổn thương |
| 37 | Phong Hỏa Gia Nhân | Gia đình |
| 38 | Hỏa Trạch Khuê | Chia lìa, bất hòa |
| 39 | Thủy Sơn Kiển | Khó khăn, trắc trở |
| 40 | Lôi Thủy Giải | Giải trừ, tháo gỡ |
| 41 | Sơn Trạch Tổn | Giảm bớt, hy sinh |
| 42 | Phong Lôi Ích | Tăng thêm, lợi ích |
| 43 | Trạch Thiên Quải | Quyết đoán, dứt khoát |
| 44 | Thiên Phong Cấu | Gặp gỡ bất ngờ |
| 45 | Trạch Địa Tụy | Tụ họp |
| 46 | Địa Phong Thăng | Đi lên, thăng tiến |
| 47 | Trạch Thủy Khốn | Khốn cùng, bế tắc |
| 48 | Thủy Phong Tỉnh | Giếng nước, nuôi dưỡng chung |
| 49 | Trạch Hỏa Cách | Cải cách, đổi mới |
| 50 | Hỏa Phong Đỉnh | Cái vạc, đổi mới bền vững |
| 51 | Thuần Chấn | Sấm động, chấn động |
| 52 | Thuần Cấn | Núi, dừng lại, tĩnh |
| 53 | Phong Sơn Tiệm | Tiến dần dần |
| 54 | Lôi Trạch Quy Muội | Gả em gái, hôn nhân bất thường |
| 55 | Lôi Hỏa Phong | Phong phú, thịnh đại |
| 56 | Hỏa Sơn Lữ | Lữ hành, xa quê |
| 57 | Thuần Tốn | Gió, thâm nhập, thuận theo |
| 58 | Thuần Đoài | Đầm, vui vẻ |
| 59 | Phong Thủy Hoán | Phân tán, tan rã |
| 60 | Thủy Trạch Tiết | Tiết chế, điều độ |
| 61 | Phong Trạch Trung Phu | Lòng thành tín ở giữa |
| 62 | Lôi Sơn Tiểu Quá | Vượt qua việc nhỏ |
| 63 | Thủy Hỏa Ký Tế | Đã hoàn thành |
| 64 | Hỏa Thủy Vị Tế | Chưa hoàn thành |

*Tên quẻ ghép theo thứ tự Thượng quái – Hạ quái. Tám quái gốc: Càn (Trời), Khôn (Đất), Chấn (Sấm), Tốn (Gió), Khảm (Nước), Ly (Lửa), Cấn (Núi), Đoài (Đầm).*

---

## 3. Bảng ánh xạ nhanh: một số quẻ tiêu biểu vào tình trạng đầu tư

| Quẻ | Tình trạng đầu tư tương ứng |
|---|---|
| Truân | Dự án/startup giai đoạn đầu, vốn mỏng, thị trường chưa rõ ràng |
| Bĩ | Hạng mục đóng băng thanh khoản, dòng tiền tắc nghẽn |
| Thái | Giai đoạn thuận lợi, các yếu tố nội-ngoại đồng thuận |
| Đại Súc | Giai đoạn gom vốn, tích sản trước khi bung ra |
| Tổn / Ích | Quy luật đánh đổi: cắt lỗ khoản này để bồi đắp khoản khác |
| Khốn | Khủng hoảng thanh khoản, áp lực trả nợ, cạn dòng tiền |
| Cách | Thời điểm cần tái cấu trúc danh mục/mô hình kinh doanh |
| Ký Tế | Một chu kỳ đã hoàn tất — cảnh báo dễ chủ quan, đề phòng đảo ngược |
| Vị Tế | Việc còn dang dở, rủi ro chưa giải quyết triệt để, cần thận trọng |
| Quải | Thời điểm cần dứt khoát cắt lỗ hoặc chốt lời, không do dự |

---

## 4. Các giả định bắt buộc phải nêu rõ khi trình bày kết quả

1. **Giả định về tính đầy đủ của 6 lớp yếu tố:** khung 6 lớp ở Bước 1 là cách phân tầng tổng quát; với từng loại hạng mục cụ thể (cổ phiếu, bất động sản, startup, quỹ...), agent cần tùy chỉnh lại nội hàm từng hào cho sát thực tế và nêu rõ sự tùy chỉnh đó.
2. **Giả định về ngưỡng nhị phân hóa:** quy trạng thái phức tạp về hai giá trị Dương/Âm là đơn giản hóa có chủ đích; agent cần định nghĩa rõ ràng, nhất quán ngưỡng "thế nào là Dương/Âm" cho từng chỉ báo cụ thể trước khi gán giá trị.
3. **Giả định về việc chọn hào động:** việc xác định hào nào "dễ biến" mang tính phán đoán định tính, trừ khi được lượng hóa bằng dữ liệu biến động thống kê thực tế.
4. **Giả định về diễn giải quẻ:** ý nghĩa quẻ là archetype (mẫu hình tình huống tổng quát); việc chuyển từ ý nghĩa quẻ sang khuyến nghị hành động cụ thể vẫn cần lồng ghép phán đoán tài chính thực tế, không suy diễn máy móc từ tên quẻ.
5. **Giả định về trọng số và con số %:** trọng số của từng chỉ báo, điểm % thuận lợi/rủi ro, và các con số xác suất/mức tác động ở Bước 5–6 đều là **ước lượng chủ quan có căn cứ** của người/agent phân tích — không phải kết quả từ mô hình thống kê đã kiểm định. Giá trị của việc lượng hóa nằm ở việc **buộc phải tường minh hóa giả định** và tạo cơ sở so sánh nhất quán giữa các kỳ đánh giá, không nằm ở độ chính xác tuyệt đối của bản thân con số.
6. **Giả định về ngưỡng ra quyết định ở Bước 8:** các ngưỡng "5/6 hào đạt độ tin cậy Cao/TB" và "≥2 hào vừa mơ hồ vừa độ tin cậy Thấp" là quy ước thực dụng để tạo kỷ luật ra quyết định, có thể điều chỉnh tùy khẩu vị rủi ro của người dùng — agent nên hỏi rõ mức độ thận trọng mong muốn nếu chưa được nêu, thay vì áp dụng ngưỡng mặc định một cách cứng nhắc cho mọi trường hợp.

---

## 5. Quy tắc trình bày cho Agent

- Luôn trình bày đủ 3 lớp: **(a) dữ liệu/chỉ báo thực tế đã dùng để gán từng hào**, **(b) quẻ suy ra và ý nghĩa cốt lõi**, **(c) diễn giải bằng ngôn ngữ tài chính/kinh doanh chuẩn** — không dừng ở việc chỉ nêu tên quẻ.
- Khi liệt kê các kịch bản (Bước 6), luôn gắn mỗi kịch bản với **điều kiện/chỉ báo cụ thể, có thể quan sát được** để kích hoạt kịch bản đó — tránh trình bày kịch bản mơ hồ, không thể theo dõi.
- Nếu số hào động vượt quá 2, agent chủ động nêu rõ đây là dấu hiệu **mức độ bất định cao của tình huống**, khuyến nghị thận trọng thay vì cố gắng liệt kê đầy đủ mọi tổ hợp kịch bản.
- Không trình bày kết quả như một lời tiên tri chắc chắn; luôn dùng ngôn ngữ xác suất/điều kiện ("nếu... thì có khả năng...", "cần theo dõi thêm...").
- Luôn trình bày **song song hai chiều thuận lợi và rủi ro** cho mỗi hào và mỗi kịch bản (Bước 1, 5, 6) — không chỉ nêu một chiều duy nhất, kể cả khi một chiều có vẻ áp đảo hơn hẳn.
- Khi kết luận cuối cùng thiếu chắc chắn, agent **phải phân biệt rõ nguyên nhân**: (a) do bản thân hạng mục có % rủi ro nội tại cao (kết luận về chất lượng hạng mục), hay (b) do thiếu dữ liệu/độ tin cậy thấp (kết luận về giới hạn thông tin, xem Bước 8) — hai loại này đòi hỏi hành động khác nhau (một bên là quản trị rủi ro hạng mục, một bên là thu thập thêm thông tin trước khi quyết định).
- Nhắc lại khi cần: đây là công cụ hệ thống hóa và trình bày nhận định, không thay thế phân tích tài chính định lượng, không cấu thành khuyến nghị đầu tư đảm bảo kết quả.
