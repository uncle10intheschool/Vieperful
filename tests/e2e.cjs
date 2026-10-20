/* Kiểm thử trên trình duyệt thật. Chạy: npm test
   Có thể đặt CHROMIUM_PATH nếu dùng Chromium đã cài sẵn. */
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const base = "http://127.0.0.1:4174";
const server = spawn(process.execPath, ["scripts/serve.cjs"], { cwd: root, env: { ...process.env, PORT: "4174" }, stdio: "pipe" });
let browser;
let count = 0;
const errors = [];
async function check(name, test) {
  await test();
  count += 1;
  console.log(`PASS ${count}: ${name}`);
}
async function run() {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Máy chủ không khởi động")), 10000);
    server.stdout.once("data", () => { clearTimeout(timeout); resolve(); });
    server.once("error", reject);
    server.once("exit", code => { if (code) reject(new Error(`Máy chủ thoát: ${code}`)); });
  });
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const go = async route => {
    await page.goto(`${base}/#${route}`);
    await page.waitForFunction(expected => document.querySelector("main").dataset.route === expected, route.split("?")[0]);
    await page.locator("main h1").waitFor();
  };
  const cartState = () => page.evaluate(() => JSON.parse(localStorage.getItem("vieperful.cart.v1")));
  const openCart = () => page.getByRole("button", { name: /^Mở giỏ hàng/ }).click();
  const closeCart = () => page.keyboard.press("Escape");
  const addProduct = async (id, size) => {
    await go(`/product/${id}`);
    await page.locator(`#product-form input[value="${size}"]`).check();
    await page.locator("#product-form button[type=submit]").click();
    await closeCart();
  };
  await check("Trang chủ, ảnh, phông chữ và chế độ giảm chuyển động", async () => {
    await go("/");
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const broken = await page.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src));
    assert.deepEqual(broken, []);
    assert.equal(await page.locator("#hero-video").evaluate(v => v.paused), true);
    assert.equal(await page.locator("#hero-video").evaluate(v => v.muted), true);
    assert.equal(await page.locator(".product-card").count(), 3);
    await page.evaluate(() => scrollTo(0, 0));
    fs.mkdirSync(path.join(root, "test-results"), { recursive: true });
    await page.screenshot({ path: path.join(root, "test-results/home-desktop.png"), fullPage: true });
  });
  await check("Bộ sưu tập: lọc nhóm hương và dịp sử dụng", async () => {
    await go("/collection");
    assert.equal(await page.locator(".product-card").count(), 6);
    await page.locator("#filter-group").selectOption("floral");
    await page.locator("#filter-occasion").selectOption("date");
    assert.equal(await page.locator(".product-card").count(), 2);
    assert.match(await page.locator("#collection-grid").innerText(), /Sen Hạ/);
    await page.locator("#filter-occasion").selectOption("work");
    assert.equal(await page.locator(".product-card").count(), 0);
    assert.match(await page.locator("#collection-grid").innerText(), /Chưa tìm thấy/);
    await page.getByRole("button", { name: /Xóa bộ lọc/ }).click();
    assert.equal(await page.locator(".product-card").count(), 6);
  });
  await check("Sắp xếp theo giá và tìm kiếm tiếng Việt không dấu", async () => {
    await page.locator("#filter-sort").selectOption("asc");
    assert.equal(await page.locator(".product-title-row h3").first().innerText(), "Trà Miên");
    await page.locator("#filter-sort").selectOption("desc");
    assert.equal(await page.locator(".product-title-row h3").first().innerText(), "Mộc Trầm");
    await page.locator("#filter-q").fill("NHAI DEM");
    assert.equal(await page.locator(".product-card").count(), 1);
    assert.equal(await page.locator(".product-title-row h3").innerText(), "Nhài Đêm");
    await page.reload();
    assert.equal(await page.locator(".product-card").count(), 1);
  });
  await check("Dung tích cập nhật giá và thêm lựa chọn 50 ml", async () => {
    await go("/product/sen-ha");
    assert.match(await page.locator("#detail-price").innerText(), /459\.000/);
    await page.locator('input[name=size][value="10"]').check();
    assert.match(await page.locator("#detail-price").innerText(), /189\.000/);
    await page.locator('input[name=size][value="50"]').check();
    assert.match(await page.locator("#detail-price").innerText(), /689\.000/);
    await page.locator("#product-form button").click();
    assert.deepEqual(await cartState(), [{ id: "sen-ha", ml: 50, quantity: 1 }]);
    assert.equal(await page.locator("#cart-dialog").evaluate(d => d.open), true);
    await closeCart();
  });
  await check("Thêm lặp được gộp; khác dung tích thành dòng riêng", async () => {
    await page.locator("#product-form button").click();
    await closeCart();
    await page.locator('input[name=size][value="10"]').check();
    await page.locator("#product-form button").click();
    assert.deepEqual(await cartState(), [{ id: "sen-ha", ml: 50, quantity: 2 }, { id: "sen-ha", ml: 10, quantity: 1 }]);
    assert.match(await page.locator(".cart-summary strong").innerText(), /1\.567\.000/);
    assert.equal(await page.locator(".cart-item").count(), 2);
    await closeCart();
  });
  await check("Giỏ hàng giữ khi tải lại; tăng, giảm và xóa chính xác", async () => {
    await page.reload();
    assert.equal(await page.locator("#cart-count").innerText(), "3");
    await openCart();
    await page.getByRole("button", { name: "Tăng số lượng Sen Hạ 10 ml", exact: true }).click();
    assert.match(await page.locator(".cart-summary strong").innerText(), /1\.756\.000/);
    await page.getByRole("button", { name: "Giảm số lượng Sen Hạ 50 ml", exact: true }).click();
    assert.match(await page.locator(".cart-summary strong").innerText(), /1\.067\.000/);
    await page.getByRole("button", { name: "Xóa Sen Hạ 50 ml", exact: true }).click();
    assert.match(await page.locator(".cart-summary strong").innerText(), /378\.000/);
    await page.getByRole("button", { name: "Xóa Sen Hạ 10 ml", exact: true }).click();
    assert.match(await page.locator("#cart-body").innerText(), /Giỏ hàng chưa có sản phẩm/);
    await closeCart();
    await go("/checkout");
    assert.match(await page.locator("h1").innerText(), /Giỏ hàng đang trống/);
  });
  await check("Thêm nhanh từ bộ sưu tập dùng dung tích 30 ml", async () => {
    await go("/collection");
    await page.getByRole("button", { name: "Thêm Trà Miên 30 ml vào giỏ", exact: true }).click();
    assert.deepEqual(await cartState(), [{ id: "tra-mien", ml: 30, quantity: 1 }]);
  });
  await check("Biểu mẫu chặn thông tin thiếu và sai định dạng", async () => {
    await addProduct("sen-ha", 10);
    await go("/checkout");
    await page.locator("#checkout-form button[type=submit]").click();
    assert.equal(await page.locator("#checkout-form [aria-invalid=true]").count(), 4);
    assert.equal(await page.evaluate(() => document.activeElement.id), "customer-name");
    await page.locator("#customer-name").fill("Nguyễn Demo");
    await page.locator("#customer-phone").fill("123");
    await page.locator("#customer-email").fill("sai-email");
    await page.locator("#customer-address").fill("123 Đường Minh Họa, TP. Hồ Chí Minh");
    await page.locator('input[name=consent]').check();
    await page.locator("#checkout-form button[type=submit]").click();
    assert.equal(await page.locator("#checkout-form [aria-invalid=true]").count(), 2);
    assert.equal(await page.evaluate(() => localStorage.getItem("vieperful.orders.v1")), null);
  });
  await check("Sửa giỏ ở trang đặt hàng giữ thông tin và cập nhật tổng", async () => {
    await page.locator(".order-review").getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.getByRole("button", { name: "Tăng số lượng Trà Miên 30 ml", exact: true }).click();
    await closeCart();
    assert.equal(await page.locator("#customer-name").inputValue(), "Nguyễn Demo");
    assert.match(await page.locator(".summary-total strong").innerText(), /1\.047\.000/);
  });
  await check("Đặt thử thành công: lưu đơn, mã đơn, tổng đúng, xóa giỏ", async () => {
    await page.locator("#customer-phone").fill("0900000000");
    await page.locator("#customer-email").fill("demo@example.com");
    await page.locator("#checkout-form button[type=submit]").click();
    await page.waitForURL(/#\/order\/VP-/);
    await page.locator(".confirmation-card").waitFor();
    const orders = await page.evaluate(() => JSON.parse(localStorage.getItem("vieperful.orders.v1")));
    assert.equal(orders.length, 1);
    assert.equal(orders[0].total, 1047000);
    assert.equal(orders[0].items.length, 2);
    assert.equal(orders[0].recipient.name, "Nguyễn Demo");
    assert.match(await page.locator(".summary-total strong").innerText(), /1\.047\.000/);
    assert.deepEqual(await cartState(), []);
    assert.equal(await page.locator("#cart-count").innerText(), "0");
    await page.reload();
    assert.match(await page.locator("h1").innerText(), /đã được ghi lại/);
    await page.screenshot({ path: path.join(root, "test-results/order-desktop.png"), fullPage: true });
  });
  await check("Lịch sử đơn và xác nhận xóa dữ liệu", async () => {
    await go("/orders");
    assert.equal(await page.locator(".order-history-card").count(), 1);
    await page.locator("main").getByRole("button", { name: /Xóa lịch sử/ }).click();
    await page.getByRole("button", { name: "Giữ lại", exact: true }).click();
    assert.equal(await page.locator(".order-history-card").count(), 1);
    await page.locator("main").getByRole("button", { name: /Xóa lịch sử/ }).click();
    await page.locator("#confirm-dialog").getByRole("button", { name: "Xóa lịch sử", exact: true }).click();
    assert.equal(await page.locator(".order-history-card").count(), 0);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("vieperful.orders.v1"))), []);
  });
  await check("Tìm kiếm toàn trang và đóng hộp thoại bằng Escape", async () => {
    await page.getByRole("button", { name: "Tìm kiếm mùi hương" }).click();
    await page.locator("#search-input").fill("trà xanh");
    await page.locator("#search-form button").click();
    await page.waitForURL(/collection/);
    await page.locator("#collection-grid").waitFor();
    assert.equal(await page.locator(".product-card").count(), 1);
    await openCart();
    await closeCart();
    assert.equal(await page.locator("#cart-dialog").evaluate(d => d.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("cart-trigger")), true);
  });
  await check("Trang nội dung, FAQ và đường dẫn không tồn tại", async () => {
    await go("/about");
    assert.match(await page.locator("h1").innerText(), /Hương từ đất Việt/);
    await go("/guide?section=faq");
    await page.locator(".faq-list summary").first().click();
    assert.equal(await page.locator(".faq-list details").first().getAttribute("open"), "");
    await go("/product/khong-ton-tai");
    assert.match(await page.locator("h1").innerText(), /chưa có ở đây/);
  });
  await check("Điện thoại 390 px: menu, bộ lọc, giỏ và bố cục", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go("/");
    await page.screenshot({ path: path.join(root, "test-results/home-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page.locator("#menu-dialog").getByRole("link", { name: /Bộ sưu tập/ }).click();
    assert.equal(await page.locator("#menu-dialog").evaluate(d => d.open), false);
    await page.locator("#filter-group").selectOption("woody");
    assert.equal(await page.locator(".product-card").count(), 2);
    await page.getByRole("button", { name: "Thêm Mộc Trầm 30 ml vào giỏ" }).click();
    await openCart();
    assert.equal(await page.locator(".cart-item").count(), 1);
    await page.screenshot({ path: path.join(root, "test-results/cart-mobile.png") });
    await closeCart();
    for (const route of ["/", "/collection", "/product/nhai-dem", "/about", "/guide", "/checkout", "/orders"]) {
      await go(route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Tràn ngang: ${route}`);
    }
    await go("/checkout");
    await page.screenshot({ path: path.join(root, "test-results/checkout-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 320, height: 700 });
    for (const route of ["/", "/collection", "/product/sen-ha", "/checkout"]) {
      await go(route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Tràn ngang 320px: ${route}`);
    }
  });
  await check("Bàn phím: focus giữ trong giỏ hàng", async () => {
    await openCart();
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => !!document.activeElement.closest("#cart-dialog")), true);
    }
    await closeCart();
  });
  await check("Video phát/tạm dừng, tắt tiếng và phản hồi giảm chuyển động", async () => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await go("/");
    await page.waitForFunction(() => document.querySelector("#hero-video").readyState >= 2);
    if (await page.locator("#hero-video").evaluate(v => v.paused)) await page.locator("#video-toggle").click();
    await page.waitForFunction(() => !document.querySelector("#hero-video").paused);
    assert.equal(await page.locator("#hero-video").evaluate(v => v.muted), true);
    await page.locator("#video-toggle").click();
    assert.equal(await page.locator("#hero-video").evaluate(v => v.paused), true);
    await page.locator("#video-toggle").click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.querySelector("#hero-video").paused);
  });
  await check("Video lỗi vẫn có ảnh dự phòng", async () => {
    const fallback = await context.newPage();
    await fallback.route("**/vieperful-film.mp4", route => route.abort());
    await fallback.goto(base);
    await fallback.waitForFunction(() => document.querySelector("#hero-video").hidden);
    assert.equal(await fallback.locator(".hero-poster").evaluate(i => i.complete && i.naturalWidth > 0), true);
    await fallback.close();
  });
  await check("Dữ liệu lưu hỏng không làm sập trang; chặn lưu không mất giỏ", async () => {
    const isolated = await browser.newContext({ reducedMotion: "reduce" });
    const p = await isolated.newPage();
    await p.goto(base);
    await p.evaluate(() => localStorage.setItem("vieperful.cart.v1", "{hỏng"));
    await p.reload();
    assert.equal(await p.locator("#cart-count").innerText(), "0");
    await p.goto(`${base}/#/product/sen-ha`);
    await p.locator("#product-form button").click();
    await p.keyboard.press("Escape");
    await p.goto(`${base}/#/checkout`);
    await p.locator("#customer-name").fill("Demo Test");
    await p.locator("#customer-phone").fill("0900000000");
    await p.locator("#customer-address").fill("123 Đường Minh Họa");
    await p.locator("[name=consent]").check();
    await p.evaluate(() => { Storage.prototype.setItem = function() { throw new DOMException("Blocked", "QuotaExceededError"); }; });
    await p.locator("#checkout-form button[type=submit]").click();
    assert.match(await p.locator("#checkout-error").innerText(), /Không thể lưu đơn/);
    assert.equal(await p.locator("#cart-count").innerText(), "1");
    await isolated.close();
  });
  await check("Không có lỗi JavaScript hoặc tài nguyên HTTP thất bại", async () => assert.deepEqual(errors, []));
  console.log(`\n${count}/${count} nhóm kiểm thử hoàn tất. Ảnh chụp nằm trong test-results/.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); server.kill(); });
