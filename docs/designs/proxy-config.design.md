# Design: Cấu hình Proxy

## Bối cảnh

Trình duyệt cần định tuyến traffic qua proxy để thay đổi địa chỉ IP nhằm tránh bị phát hiện khi crawl hoặc automation. Ngoài ra, proxy còn cần đồng bộ các thông tin như timezone, geolocation, ngôn ngữ theo IP của proxy -- nếu không đồng bộ, bot detection dễ dàng phát hiện sự khác biệt giữa IP và các thông số trình duyệt.

Proxy chỉ là một phần nhỏ trong cấu hình gửi lên engine. Engine nhị phân (C/C++) xử lý toàn bộ việc inject proxy vào browser ở tầng native -- không có JavaScript can thiệp.

## Câu hỏi làm rõ

- Proxy có cần hỗ trợ nhiều authentication method không? → Chỉ cần user:pass trong URL. Engine tự xử lý authentication.
- Ai xử lý việc đồng bộ timezone/geolocation? → Engine nhị phân tự đồng bộ dựa trên IP lookup. Plugin chỉ gửi cấu hình.
- Có cần tự kiểm tra proxy còn sống trước khi dùng không? → Không. Engine tự kiểm tra và báo lỗi nếu proxy không hoạt động.

## Các phương án

### Phương án 1: Proxy xử lý hoàn toàn ở JS layer
Dùng Playwright built-in proxy option, tự đồng bộ timezone/geolocation bằng CDP.

- Ưu điểm: Không cần engine hỗ trợ, đơn giản.
- Nhược điểm: Bị phát hiện bởi bot detection vì JS layer dễ bị kiểm tra.

### Phương án 2: Gửi proxy config cho engine native (chọn)
Proxy config được lưu trong plugin, gửi lên engine qua API `setup`. Engine nhị phân tự inject proxy vào browser, đồng bộ timezone/geolocation/WebRTC.

- Ưu điểm: Inject ở tầng native, không để lại dấu vết trong JS context. Engine tự xử lý đồng bộ.
- Nhược điểm: Phải đợi engine khởi tạo xong mới gửi được config.

### Phương án 3: Tách proxy detection riêng
Plugin tự gọi service ip-api.com để lấy thông tin IP, rồi gửi lên engine.

- Ưu điểm: Kiểm soát được dữ liệu geolocation.
- Nhược điểm: Tốn request, phức tạp hơn, engine đã có sẵn IP detection.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 (engine native xử lý proxy).
- Phương án được chọn: Phương án 2.
- Lý do: Engine native xử lý mọi thứ -- inject proxy, đồng bộ timezone/geolocation/WebRTC, DNS -- mà không có dấu vết JavaScript. Plugin chỉ cần lưu config và chuyển tiếp.
- Ràng buộc: Phải gọi `api('setup')` để gửi proxy config trước khi spawn worker. Proxy URL phải đúng format `protocol://user:pass@host:port`.
