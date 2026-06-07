/**
 * Phương thức trích xuất địa chỉ IP từ response của service URL.
 *
 * - `raw` - Lấy toàn bộ nội dung response làm IP.
 * - `xpath` - Trích xuất IP bằng biểu thức XPath.
 * - `regexp` - Trích xuất IP bằng biểu thức chính quy.
 * - `jsonpath` - Trích xuất IP bằng biểu thức JSONPath.
 */
type IPExtractionMethod = 'raw' | 'xpath' | 'regexp' | 'jsonpath';

/**
 * Giá trị thay thế cho địa chỉ IP nội bộ (private IP) trong WebRTC.
 *
 * - `disable` - Không hiển thị IP nội bộ.
 * - `local` - Dùng địa chỉ IP nội bộ thực của máy.
 * - Hoặc truyền vào một địa chỉ IP cụ thể.
 */
type PrivateIPReplacement = IPString | 'disable' | 'local';

/**
 * Giá trị thay thế cho địa chỉ IP công khai (public IP) trong WebRTC.
 *
 * - `disable` - Không hiển thị IP công khai.
 * - `auto` - Tự động lấy IP công khai từ proxy.
 * - Hoặc truyền vào một địa chỉ IP cụ thể.
 */
type PublicIPReplacement = IPString | 'disable' | 'auto';

/**
 * Bất kỳ chuỗi nào có thể được dùng làm địa chỉ IP.
 */
type IPString = string & {};

/**
 * Tùy chọn cấu hình proxy cho trình duyệt.
 *
 * @example
 * ```ts
 * browser.useProxy('http://user:pass@host:port', {
 *   changeBrowserLanguage: true,
 *   changeTimezone: true,
 *   changeWebRTC: 'replace',
 *   enableTunneling: true,
 * });
 * ```
 */
export interface ProxyOptions {
  /**
   * Tự động đổi ngôn ngữ trình duyệt theo quốc gia của proxy.
   * Ảnh hưởng đến header `Accept-Language` và `navigator.language`.
   *
   * @default true
   */
  changeBrowserLanguage?: boolean;

  /**
   * Đổi vị trí địa lý (geolocation) của trình duyệt theo IP của proxy.
   * Nếu tắt, trình duyệt sẽ từ chối mọi yêu cầu truy cập vị trí.
   *
   * @default false
   */
  changeGeolocation?: boolean;

  /**
   * Đổi múi giờ trình duyệt theo IP của proxy.
   *
   * @default true
   */
  changeTimezone?: boolean;

  /**
   * Cấu hình hành vi WebRTC.
   *
   * - `enable` - Bật WebRTC, lộ IP thật.
   * - `disable` - Tắt hoàn toàn WebRTC.
   * - `replace` - Thay thế IP trong WebRTC bằng IP của proxy.
   *
   * @default 'replace'
   */
  changeWebRTC?: 'enable' | 'disable' | 'replace';

  /**
   * Địa chỉ IPv4 công khai hiển thị qua WebRTC.
   * Chỉ có hiệu lực khi `changeWebRTC` là `replace`.
   *
   * @default 'auto'
   */
  publicIPv4?: PublicIPReplacement;

  /**
   * Địa chỉ IPv6 công khai hiển thị qua WebRTC.
   * Chỉ có hiệu lực khi `changeWebRTC` là `replace`.
   *
   * @default 'auto'
   */
  publicIPv6?: PublicIPReplacement;

  /**
   * Địa chỉ IPv4 nội bộ hiển thị qua WebRTC.
   * Chỉ có hiệu lực khi `changeWebRTC` là `replace`.
   *
   * @default 'local'
   */
  privateIPv4?: PrivateIPReplacement | 'private class a' | 'private class b' | 'private class c';

  /**
   * Địa chỉ IPv6 nội bộ hiển thị qua WebRTC.
   * Chỉ có hiệu lực khi `changeWebRTC` là `replace`.
   *
   * @default 'local'
   */
  privateIPv6?: PrivateIPReplacement | 'unique local address';

  /**
   * Phương thức trích xuất IP từ response của `ipExtractionURL`.
   * Cần dùng kết hợp với `ipExtractionParam`.
   * Có thể cấu hình riêng cho IPv4 và IPv6 bằng object notation.
   *
   * @default 'raw'
   */
  ipExtractionMethod?: IPExtractionMethod | { v4: IPExtractionMethod; v6: IPExtractionMethod };

  /**
   * Tham số dùng để trích xuất IP từ response của `ipExtractionURL`.
   * Cần dùng kết hợp với `ipExtractionMethod`.
   * Có thể cấu hình riêng cho IPv4 và IPv6 bằng object notation.
   *
   * @default ''
   */
  ipExtractionParam?: string | { v4: string; v6: string };

  /**
   * URL dùng để xác định IP công khai hiện tại qua proxy.
   * Response phải chứa địa chỉ IP.
   * Có thể cấu hình riêng cho IPv4 và IPv6 bằng object notation.
   *
   * @default ''
   */
  ipExtractionURL?: string | { v4: string; v6: string };

  /**
   * Tự động phát hiện IP công khai bằng cách truy vấn service bên ngoài.
   * Hữu ích khi IP kết nối proxy khác với IP hiển thị ra bên ngoài.
   * Có thể cấu hình riêng cho IPv4 và IPv6 bằng object notation.
   *
   * @default true
   */
  detectExternalIP?: boolean | { v4: boolean; v6: boolean };

  /**
   * Phương thức tra cứu thông tin địa lý từ địa chỉ IP.
   *
   * - `database` - Dùng database nội bộ, nhanh nhưng kém chính xác hơn.
   * - `ip-api.com` - Dùng service bên ngoài, chính xác hơn nhưng giới hạn 45 request/IP (bản free).
   *
   * @default 'database'
   */
  ipInfoMethod?: 'database' | 'ip-api.com';

  /**
   * API key của dịch vụ ip-api.com (bản trả phí).
   * Chỉ có hiệu lực khi `ipInfoMethod` là `ip-api.com`.
   *
   * @default ''
   */
  ipInfoKey?: string;

  /**
   * Bật/tắt hệ thống tunneling tích hợp.
   * Nếu tắt, proxy sẽ không hoạt động — dùng khi đã có VPN hoặc muốn kết nối trực tiếp.
   *
   * @default true
   */
  enableTunneling?: boolean;

  /**
   * Bật giao thức QUIC (chạy trên UDP).
   * Chỉ bật nếu proxy server hỗ trợ UDP.
   *
   * @default false
   */
  enableQUIC?: boolean;

  /**
   * Chế độ phân giải DNS.
   *
   * - `system-proxy` - Dùng DNS hệ thống, hostname được gửi đến proxy để phân giải.
   * - `custom-proxy` - Dùng DNS tùy chỉnh của Chrome, truy vấn DNS qua proxy (proxy phải hỗ trợ UDP).
   * - `custom-direct` - Dùng DNS tùy chỉnh của Chrome, phân giải DNS cục bộ, traffic còn lại đi qua proxy.
   *
   * Khuyến nghị dùng `custom-direct` nếu muốn sử dụng DNS tùy chỉnh.
   * Lưu ý: cần chỉ định `dnsIP` khi dùng `custom-proxy` hoặc `custom-direct`.
   *
   * @default 'system-proxy'
   */
  dnsMode?: 'system-proxy' | 'custom-proxy' | 'custom-direct';

  /**
   * Địa chỉ IP của DNS server khi dùng chế độ `custom-proxy` hoặc `custom-direct`.
   * Không có hiệu lực khi `dnsMode` là `system-proxy`.
   *
   * @default '1.1.1.1'
   */
  dnsIP?: string;
}
