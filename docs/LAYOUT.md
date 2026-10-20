# Bố cục Vieperful — hướng dẫn chỉnh sửa

Bản này tập trung vào **chữ dễ đọc, các khu vực rõ ràng và biết bước tiếp theo cần làm gì**. Hình chai, logo, video và dữ liệu sản phẩm được giữ lại.

## Xem giao diện

Các ảnh dưới đây là ảnh chụp website chạy thực tế. Bấm vào ảnh trên GitHub để xem kích thước đầy đủ; đây không phải liên kết website đã triển khai.

### Trang chủ — máy tính

![Trang chủ Vieperful trên máy tính](previews/home-desktop.png)

### Trang sản phẩm — điện thoại

![Chọn dung tích trên điện thoại](previews/product-mobile.png)

## Thứ tự nội dung

| Khu vực | Người xem cần hiểu hoặc làm gì? | Nơi sửa nội dung trong `js/app.js` |
| --- | --- | --- |
| Phần mở đầu | Vieperful là gì; bắt đầu chọn hương hoặc xem toàn bộ sản phẩm | `home()` |
| 01 — Chọn hoàn cảnh | Chọn đi học/đi làm, hẹn hò hoặc buổi tối để tới danh mục đã lọc | `occasionSection()` |
| 02 — Sản phẩm nổi bật | Xem nhóm hương, tên, giá; chọn dung tích hoặc thêm nhanh 30 ml | `featuredSection()` và `productCard()` |
| 03 — Câu chuyện | Đọc về cảm hứng thương hiệu sau khi đã hiểu sản phẩm | `brandStorySection()` |
| Hướng dẫn và chân trang | Tìm hướng dẫn sử dụng, FAQ, đơn hàng thử | `home()` và `index.html` |

`home()` gọi từng phần theo thứ tự; có thể di chuyển lời gọi `${occasionSection()}`, `${featuredSection()}` và `${brandStorySection()}` để sắp xếp lại. Không cần sửa logic giỏ hàng.

## Hành trình chọn mua

1. **Chọn mùi hương:** nút trên phần mở đầu đưa người xem đến các hoàn cảnh sử dụng. Chọn một hoàn cảnh sẽ mở bộ sưu tập đã lọc.
2. **Chọn dung tích:** thẻ sản phẩm có liên kết “Xem chi tiết & chọn dung tích”. Trang chi tiết hiển thị khu vực dung tích, giá và nút thêm giỏ trong cùng một khối.
3. **Đặt hàng thử:** từ giỏ hàng sang biểu mẫu có phần xem lại đơn. Đây vẫn là mô phỏng, không thu tiền thật.

Thanh 3 bước ở danh mục, chi tiết và trang đặt hàng được tạo bởi `shoppingSteps()`. Bước hiện tại được đánh dấu bằng nền xanh đậm và thuộc tính `aria-current="step"`.

“Thêm nhanh 30 ml” trên thẻ sản phẩm là lối tắt có ghi rõ dung tích; người dùng muốn chọn 10 hoặc 50 ml đi qua trang chi tiết.

## Đổi cỡ chữ

Các biến ở đầu `css/style.css`:

```css
--text-body: 16px;  /* Nội dung chính */
--text-small: 14px; /* Chú thích, liên kết phụ */
--text-label: 12px; /* Nhãn ngắn, số bước */
--text-lead: 18px;  /* Đoạn mở đầu, giá trên thẻ */
```

Tiêu đề dùng kích thước riêng theo thiết bị. Một số nhãn trang trí dùng 11 px; đoạn mô tả và các nút chính không giảm xuống cỡ chữ nhỏ này trên điện thoại.

Muốn nội dung lớn hơn nữa, có thể đổi `--text-body` thành `17px`. Sau đó kiểm tra lại trên điện thoại để đảm bảo dòng chữ và nút không tràn ngang.

## Chỉnh khoảng cách và bố cục

`css/layout.css` được nạp **sau** `css/style.css`, nên là nơi ưu tiên chỉnh bố cục hiện tại. File chia thành 5 phần có chú thích tiếng Việt.

| Cần chỉnh | Selector |
| --- | --- |
| Tỷ lệ chữ và video phần mở đầu | `.hero` |
| Khoảng cách trên/dưới mỗi phần | `.section` |
| Khu vực chọn hoàn cảnh | `.occasion-grid`, `.occasion-card` |
| Nền khu vực sản phẩm | `.featured-section` |
| Số cột sản phẩm | `.product-grid` |
| Khung, khoảng đệm thẻ | `.product-card`, `.product-card-body` |
| Giá và tên sản phẩm | `.product-title-row` |
| Thanh 3 bước | `.shopping-steps` |
| Khối chọn dung tích | `#product-form` |
| Bố cục điện thoại | `@media (max-width: 600px)` |

Máy tính dùng 3 cột sản phẩm, máy tính bảng dùng 2 cột, điện thoại dùng 1 cột. Cả 3 sản phẩm nổi bật đều hiện trên điện thoại, giúp giữ cỡ chữ 16 px mà không ép thông tin vào thẻ quá hẹp.

## Sau khi chỉnh

Chạy `npm run check` và `npm test`. Bản hiện tại đạt 20 nhóm kiểm thử Chromium. Đã kiểm tra tràn ngang ở các độ rộng 320, 390, 768, 1024 và 1440 px cho trang chủ, bộ sưu tập, chi tiết, câu chuyện và hướng dẫn; luồng giỏ/đặt hàng được kiểm tra thêm trên điện thoại trong bộ test.

Ảnh trong `docs/previews/` là ảnh bàn giao. Khi thay đổi thiết kế tiếp, cần chụp lại nếu muốn ảnh phản ánh đúng website mới.
