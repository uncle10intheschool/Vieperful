# Vieperful

**Một mùi hương – Một dấu ấn riêng.**

Website dự án môn học về nước hoa, viết bằng **HTML, CSS và JavaScript thuần**. Không cần framework, cơ sở dữ liệu hoặc bước build để chạy website. Ngôn ngữ giao diện: tiếng Việt.

Bản mới dùng một cảnh chọn sáu mùi tương tác, sau đó dẫn đến dịp sử dụng và câu chuyện thương hiệu. Danh mục có lọc nhóm hương, dịp, tìm kiếm và sắp xếp; thẻ sản phẩm dẫn đến xem nhanh, so sánh hoặc thêm vào giỏ. Xem [ảnh giao diện và hướng dẫn chỉnh sửa](docs/LAYOUT.md).

Bản công khai: [vieperful.netlify.app](https://vieperful.netlify.app/).

## Chạy trong VS Code

### Cách 1 — Live Server

1. Mở thư mục `Vieperful` trong VS Code.
2. Cài extension **Live Server**.
3. Nhấp phải `index.html`, chọn **Open with Live Server**.

Nên chạy qua máy chủ tĩnh thay vì mở `file://`, để video và localStorage hoạt động nhất quán.

### Cách 2 — Node.js 18 trở lên

Mở terminal trong thư mục dự án:

```bash
npm run dev
```

Máy chủ mặc định dùng cổng **4173**. Xem địa chỉ được in trong terminal, rồi mở địa chỉ đó bằng trình duyệt. Không cần `npm install` để chạy website. Nhấn `Ctrl+C` để dừng.

Nếu cổng đang bận, thay cổng trong `scripts/serve.cjs` hoặc đặt biến `PORT`. Ví dụ trên macOS/Linux:

```bash
PORT=4175 npm run dev
```

Trên PowerShell:

```powershell
$env:PORT=4175
npm run dev
```

### Cách 3 — Python 3

```bash
python3 -m http.server 4173
```

Trên Windows, có thể dùng `py -m http.server 4173`.

## Các trang và chức năng

| Đường dẫn hash | Nội dung |
| --- | --- |
| `#/` | Trang chủ, video, cảnh chọn sáu mùi, gợi ý theo dịp và câu chuyện thương hiệu |
| `#/collection` | 6 sản phẩm, lọc nhóm hương/dịp sử dụng, tìm kiếm, sắp xếp giá |
| `#/product/sen-ha` | Chi tiết, 3 dung tích, giá tương ứng, tầng hương concept |
| `#/about` | Câu chuyện và định hướng thương hiệu |
| `#/guide` | Hướng dẫn sử dụng và FAQ |
| `#/checkout` | Thông tin người nhận, kiểm tra dữ liệu, tổng đơn mô phỏng |
| `#/order/<mã-đơn>` | Xác nhận đơn đã lưu trên trình duyệt |
| `#/orders` | Lịch sử và xóa đơn thử |

Giỏ hàng mở từ biểu tượng túi. Trắc nghiệm chọn hương dùng ba lựa chọn (dịp, nhóm hương, ngân sách) để xếp hạng 1–2 gợi ý từ dữ liệu minh họa. Từ danh mục có thể xem nhanh sản phẩm với giá cập nhật theo dung tích, hoặc so sánh tối đa ba sản phẩm. Menu, giỏ, tìm kiếm và các công cụ mới dùng hộp thoại có vòng focus bàn phím; nhấn **Escape** để đóng. Bộ lọc được lưu trong URL nên có thể tải lại hoặc chia sẻ lựa chọn lọc.

## Cấu trúc thư mục

```text
Vieperful/
├── index.html              # Khung trang, header, footer, các hộp thoại
├── css/style.css           # Biến cỡ chữ, màu sắc, thành phần và chuyển động
├── css/layout.css          # Bố cục mới, khoảng cách, thẻ sản phẩm, responsive
├── js/
│   ├── products.js         # Toàn bộ dữ liệu sản phẩm minh họa
│   ├── store.js            # Giỏ hàng, tổng tiền, lưu đơn bằng localStorage
│   └── app.js              # Điều hướng, render trang, sự kiện, kiểm tra biểu mẫu
├── assets/
│   ├── mark.svg            # Biểu tượng thương hiệu
│   ├── sen-ha.webp ...     # 6 ảnh concept sản phẩm WebP, 1254 × 1254
│   ├── vieperful-story.webp # Ảnh câu chuyện thương hiệu, 1672 × 941
│   ├── vieperful-film.mp4  # Bản gốc 1280×720, được giữ nguyên
│   ├── vieperful-film-hd.mp4 # Bản 1920×1080 đã upscale/làm nét nhẹ
│   ├── film-poster-hd.jpg  # Ảnh dự phòng 1920×1080
│   └── fonts/             # Lora, Be Vietnam Pro và giấy phép OFL
├── scripts/serve.cjs       # Máy chủ tĩnh nhỏ, có hỗ trợ HTTP Range cho video
├── tests/e2e.cjs           # Kiểm thử trình duyệt bằng Playwright
├── docs/LAYOUT.md          # Sơ đồ trang, ảnh giao diện, cách chỉnh thiết kế
├── package.json
├── package-lock.json      # Khóa phiên bản thư viện kiểm thử
└── README.md
```

`products.js` phải được nạp trước `store.js`, và `store.js` trước `app.js`. Các file dùng `defer` để đợi HTML sẵn sàng.

## Sửa sản phẩm và giá

Mở `js/products.js`. Ví dụ:

```js
{
  id: "sen-ha",                     // ID duy nhất, dùng trong URL
  name: "Sen Hạ",
  group: "floral",                  // floral | fresh | woody
  occasions: ["everyday", "date"],  // everyday | work | date | evening
  image: "assets/sen-ha.webp",
  sizes: [
    { ml: 10, price: 189000 },
    { ml: 30, price: 459000 },
    { ml: 50, price: 689000 }
  ]
}
```

- Giá là **số nguyên VNĐ**, không nhập dấu chấm phân cách hoặc ký hiệu tiền tệ.
- `notes` gồm 3 chuỗi cho hương đầu, giữa, cuối. Đây là **concept đề xuất**.
- Giữ lựa chọn **30 ml**: danh mục, sắp xếp giá và nút thêm nhanh dùng lựa chọn này.
- Chi tiết sản phẩm lấy giá từ dung tích đang chọn.
- Giỏ hàng lấy giá hiện tại từ dữ liệu sản phẩm; đơn đã đặt lưu lại giá tại thời điểm đặt.
- Dùng ID ổn định. Xóa hoặc đổi ID/dung tích sẽ loại các dòng giỏ không còn hợp lệ khi tải lại.
- Mỗi lựa chọn có tối đa 99 sản phẩm. Khác dung tích được giữ thành dòng riêng.
- Các tên nhóm hương và dịp sử dụng nằm ở đầu `products.js`.

## Thay ảnh, video và phong cách

### Ảnh

1. Thêm ảnh mới vào `assets/`, giữ lại file gốc nếu cần chỉnh sửa.
2. Đổi trường `image` trong `products.js`.
3. Sáu ảnh sản phẩm hiện tại là WebP vuông 1254 × 1254; ảnh câu chuyện là WebP 1672 × 941. Ảnh dùng cho nội dung này là concept minh họa dự án, không xác nhận sản phẩm thương mại có thật.
4. Đổi trường `image` theo ID tương ứng trong `js/products.js`. Dung tích và giá được cập nhật theo lựa chọn, còn chữ dung tích đã in trong ảnh concept vẫn là 30 ml.

Ảnh câu chuyện thương hiệu hiện dùng `assets/vieperful-story.webp`. Khu vực giới thiệu bộ sưu tập dùng sáu ảnh WebP và liên kết trực tiếp đến từng sản phẩm; cảnh rừng vector và hiệu ứng parallax đã được gỡ bỏ. `assets/mark.svg` chỉ còn dùng cho biểu tượng nhận diện.

### Video

- `assets/vieperful-film.mp4` giữ nguyên video gốc 1280 × 720, dài khoảng 20 giây.
- `assets/vieperful-film-hd.mp4` là bản upscale lên 1920 × 1080, áp dụng lọc Lanczos và tăng nét nhẹ. Bản xử lý có thể hiển thị sạch hơn trên khung lớn, nhưng không thể phục hồi chi tiết chưa có trong bản gốc.
- `assets/film-poster-hd.jpg` là ảnh dự phòng được xuất từ bản video đã xử lý. File gốc vẫn được giữ nguyên.
- Để thay video, đổi nguồn và poster trong hàm `home()` ở `js/app.js`, hoặc thay các file tương ứng sau khi lưu bản gốc.
- Video phát tắt tiếng, lặp lại, có nút phát/tạm dừng. Khi thiết bị bật giảm chuyển động, video không tự phát. Khi video tải lỗi, ảnh dự phòng vẫn hiển thị.

### Màu và phông chữ

- Sửa biến ở đầu `css/style.css`: `--cream`, `--ink`, `--green`, `--gold`.
- Tiêu đề dùng Lora; nội dung dùng Be Vietnam Pro, gồm các ký tự tiếng Việt.
- Phông chữ được lưu nội bộ; website không cần gọi Google Fonts hoặc CDN.
- Giữ các file giấy phép trong `assets/fonts/` khi phân phối phông chữ.

## Phạm vi mô phỏng và dữ liệu trình duyệt

**Không phải cửa hàng thật.** Tất cả tên sản phẩm, giá, dung tích, nhóm hương và tầng hương được xây dựng để minh họa dự án. Không có nhận xét khách hàng, chứng nhận hoặc cam kết chất lượng được trình bày như thông tin xác thực.

Website không có backend, tài khoản, quản trị tồn kho, cổng thanh toán, email xác nhận hoặc dịch vụ giao hàng.

| Khóa localStorage | Dữ liệu |
| --- | --- |
| `vieperful.cart.v1` | ID sản phẩm, dung tích, số lượng |
| `vieperful.orders.v1` | Tối đa 30 đơn thử: mã, thời gian, danh sách hàng, giá, tổng tiền và thông tin người nhận đã nhập |

- **Chỉ dùng thông tin giả** khi thử đặt hàng, ví dụ tên `Nguyễn Demo`, số điện thoại `0900000000`, email `demo@example.com`.
- Dữ liệu không được gửi lên máy chủ, không đồng bộ giữa thiết bị, trình duyệt hay các địa chỉ/cổng chạy khác nhau.
- localStorage không phải kho bảo mật. Người sử dụng trình duyệt có thể đọc, sửa hoặc xóa dữ liệu.
- Chế độ riêng tư, xóa dữ liệu website, trình duyệt chặn lưu trữ hoặc hết dung lượng có thể khiến dữ liệu không được giữ lại.
- Nếu không lưu được đơn, trang báo lỗi và giữ giỏ để thử lại.
- Xóa lịch sử bằng nút ở chân trang hoặc trang đơn thử; thao tác có hộp thoại xác nhận.
- Mã đơn chỉ là định danh cục bộ cho bản demo, không phải mã giao dịch thực tế.
- Tổng đơn = tổng `giá dung tích × số lượng`. Phí giao hàng mô phỏng bằng 0, không thu tiền.

## Kiểm thử

Chạy website không cần cài dependency. Chỉ cài nếu muốn chạy bộ kiểm thử:

```bash
npm ci
npx playwright install chromium
npm run check
npm test
```

Nếu Chromium đã có tại `/usr/bin/chromium`, không cần lệnh tải trình duyệt. Có thể đặt biến `CHROMIUM_PATH` để chọn trình duyệt khác.

`npm test` tự khởi động máy chủ kiểm thử trên cổng **4174**, chạy Chromium không giao diện và dừng máy chủ khi xong. Không cần mở `npm run dev` trước. Dữ liệu kiểm thử dùng browser context riêng.

Bộ kiểm thử bao gồm:

- Trang chủ, hình ảnh, phông chữ và giảm chuyển động.
- Bộ lọc, không có kết quả, xóa bộ lọc, tìm kiếm không dấu, sắp xếp.
- Giá theo dung tích; thêm trùng; khác dung tích; tăng, giảm, xóa; tải lại trang.
- Thông tin bắt buộc, định dạng điện thoại/email, giữ nội dung biểu mẫu khi sửa giỏ.
- Đặt thành công, đúng tổng, lưu đơn, làm trống giỏ, xem lại và xóa lịch sử.
- Menu điện thoại, Escape, vòng focus bằng Tab, bố cục 390 px và 320 px.
- Video phát/tạm dừng, tắt tiếng, ảnh dự phòng khi tải lỗi.
- Dữ liệu lưu hỏng và trường hợp không được phép lưu đơn.
- Không có lỗi JavaScript hoặc tài nguyên HTTP thất bại trong các luồng chính.

Kết quả kiểm tra bản nâng cấp: **25/25 nhóm kiểm thử đạt**; `npm run check` cũng đạt. Có kiểm tra desktop, tablet 768 px, điện thoại 390/320 px, bàn phím, giảm chuyển động, video, trắc nghiệm, xem nhanh, so sánh, bộ lọc, giỏ và đặt thử đầy đủ.

Ảnh chụp kiểm thử nằm trong `test-results/` (được Git bỏ qua). Các phép thử trình duyệt tự động không thay thế hoàn toàn kiểm tra bằng người dùng.

## Triển khai và giới hạn bàn giao

Website có thể được đưa lên máy chủ tĩnh bằng cách tải `index.html`, `css/`, `js/` và `assets/`. Không cần upload `node_modules/`, `tests/` hoặc máy chủ Node. Điều hướng dùng hash nên không cần cấu hình rewrite.

Netlify phục vụ website tại [vieperful.netlify.app](https://vieperful.netlify.app/). Khi site được nối với GitHub, push lên nhánh `main` sẽ kích hoạt deploy tự động. Có thể theo dõi trạng thái bản dựng trong mục **Deploys** của site Netlify. Website là trang tĩnh; không cần build command hoặc publish directory riêng nếu cấu hình Netlify xuất phát từ thư mục gốc dự án.

Kiểm thử được thực hiện trên Chromium trong môi trường phát triển, gồm kích thước máy tính và giả lập màn hình điện thoại. Chưa kiểm thử trên thiết bị iPhone/Android thật, Safari hoặc Firefox; chưa thực hiện kiểm toán accessibility toàn diện.
