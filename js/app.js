/* Giao diện và điều hướng hash: chạy được bằng máy chủ tĩnh, không cần framework. */
(() => {
  const main = document.querySelector("#main");
  const money = value => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const arrow = '<span aria-hidden="true"><svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span>';
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let toastTimer;
  let pageCleanup = () => {};
  let currentRoute = "";
  let compareIds = [];

  function toast(message) {
    const element = document.querySelector("#toast");
    element.textContent = message;
    element.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("visible"), 4200);
  }
  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("dialog-open");
  }
  function closeDialogs() { document.querySelectorAll("dialog[open]").forEach(d => d.close()); }
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("close", () => { if (!document.querySelector("dialog[open]")) document.body.classList.remove("dialog-open"); });
    dialog.addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  function badge() {
    document.querySelector("#cart-count").textContent = Shop.count();
    document.querySelector(".cart-trigger").setAttribute("aria-label", `Mở giỏ hàng, ${Shop.count()} sản phẩm`);
  }
  function productCard(product, index = 0) {
    const defaultSize = product.sizes.find(s => s.ml === 30);
    return `<article class="product-card reveal" style="--delay:${index % 3 * 70}ms">
      <a class="product-visual ${product.color}" href="#/product/${product.id}" aria-label="Khám phá ${product.name}">
        <span class="product-tag">${product.label}</span><img src="${product.image}" alt="Minh họa chai nước hoa ${product.name}" loading="lazy" width="500" height="600"><span class="visual-link" aria-hidden="true"><svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span>
      </a>
      <div class="product-card-body"><span class="eyebrow">${Vieperful.groups[product.group]}</span><div class="product-title-row"><h3><a href="#/product/${product.id}">${product.name}</a></h3><span>${money(defaultSize.price)}</span></div><p>${product.subtitle}</p><span class="card-price-caption">Giá minh họa cho chai 30 ml</span><div class="product-card-links"><a class="card-detail-link" href="#/product/${product.id}">Chọn dung tích ${arrow}</a><button class="card-detail-link" data-action="quick-view" data-id="${product.id}">Xem nhanh <span aria-hidden="true">⌕</span></button></div><button class="compare-toggle" data-action="compare-toggle" data-id="${product.id}" aria-pressed="${compareIds.includes(product.id)}"><span aria-hidden="true">${compareIds.includes(product.id) ? "✓" : "+"}</span> ${compareIds.includes(product.id) ? "Đang so sánh" : "Thêm vào so sánh"}</button><div class="product-bottom"><button data-action="quick-add" data-id="${product.id}" aria-label="Thêm ${product.name} 30 ml vào giỏ">Thêm nhanh 30 ml <span>+</span></button></div></div>
    </article>`;
  }
  // Trang chủ được chia thành 4 phần để dễ đổi thứ tự và chỉnh nội dung.
  function occasionSection() {
    const occasions = [
      { key: "work", number: "01", title: "Đi học & đi làm", group: "Thanh mát, nhẹ nhàng", text: "Một khởi đầu dễ chịu, từ lớp học đến văn phòng.", icon: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>' },
      { key: "date", number: "02", title: "Một buổi hẹn hò", group: "Hương hoa, mềm mại", text: "Một chút dịu dàng cho những khoảnh khắc thật gần.", icon: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>' },
      { key: "evening", number: "03", title: "Khi thành phố lên đèn", group: "Hương gỗ, trầm ấm", text: "Sâu lắng và ấm áp, để lại một dấu ấn riêng.", icon: '<path d="M20 15A9 9 0 0 1 9 3 9 9 0 1 0 20 15Z"/>' }
    ];
    return `<section class="occasion-section section container" id="choose-scent" aria-labelledby="occasion-title">
      <div class="section-heading reveal"><div><span class="eyebrow">02 / BẮT ĐẦU TỪ BẠN</span><h2 id="occasion-title">Bạn chọn hương cho<br><em>khoảnh khắc nào?</em></h2></div><div class="section-heading-side"><p class="section-intro">Chọn một dịp bên dưới hoặc trả lời ba câu hỏi để xem gợi ý riêng.</p><button class="text-link" data-action="quiz-open">Làm trắc nghiệm chọn hương ${arrow}</button></div></div>
      <div class="occasion-grid">${occasions.map(o => `<a href="#/collection?occasion=${o.key}" class="occasion-card reveal"><div class="occasion-card-top"><span class="occasion-number">${o.number} / ${o.group}</span><svg class="occasion-icon" viewBox="0 0 24 24" aria-hidden="true">${o.icon}</svg></div><h3>${o.title}</h3><p>${o.text}</p><span class="text-link">Xem mùi hương phù hợp ${arrow}</span></a>`).join("")}</div>
    </section>`;
  }
  function featuredSection() {
    return `<section class="featured-section" aria-labelledby="featured-title"><div class="section container">
      <div class="section-heading reveal"><div><span class="eyebrow">03 / BỘ SƯU TẬP VIEPERFUL</span><h2 id="featured-title">Ba sắc hương.<br><em>Ba cách là chính mình.</em></h2></div><div class="section-heading-side"><p>Hoa sen trong trẻo. Trà xanh dịu lành.<br>Hương gỗ trầm ấm.</p><a class="text-link" href="#/collection">Xem cả 6 mùi hương ${arrow}</a></div></div>
      <div class="product-grid">${Vieperful.products.slice(0, 3).map(productCard).join("")}</div>
      <p class="concept-note">Bộ sưu tập concept · Giá và tầng hương là dữ liệu minh họa. Chọn sản phẩm để xem các dung tích 10, 30 và 50 ml.</p>
    </div></section>`;
  }
  function forestFeatureSection() {
    const layers = [
      ["forest-ridgeline.svg", "1.2", "Dãy núi Việt Nam phía xa"],
      ["forest-canopy.svg", "2.1", "Tán rừng xanh nhiều lớp"],
      ["forest-light.svg", "2.8", "Ánh nắng xuyên sương"],
      ["forest-fronds.svg", "3.4", "Tán lá ở tiền cảnh"]
    ];
    return `<section class="forest-feature" aria-labelledby="forest-title"><div class="forest-copy reveal"><span class="eyebrow">01 / HƠI THỞ CỦA RỪNG</span><h2 id="forest-title">Một làn sương.<br><em>Một khoảng xanh.</em></h2><p>Sương Rừng gợi cảm giác tĩnh lặng giữa tán lá sau cơn mưa. Một concept hương thanh mát, lấy cảm hứng từ sắc rừng Việt Nam.</p><a class="button button-light" href="#/product/suong-rung">Khám phá Sương Rừng ${arrow}</a><small>Ảnh minh họa nhiều lớp · Dữ liệu sản phẩm concept</small></div><div class="forest-stage" aria-label="Minh họa rừng nhiều lớp với chai Sương Rừng"><div class="forest-glow" aria-hidden="true"></div>${layers.map(([src, depth, alt]) => `<img class="forest-layer" data-depth="${depth}" src="assets/${src}" alt="" aria-hidden="true" style="--layer-depth:${depth}">`).join("")}<img class="forest-bottle" data-depth="4.2" src="assets/suong-rung.svg" alt="" aria-hidden="true"><span class="forest-stage-caption" aria-hidden="true">LÁ XANH · TRÀ TRẮNG · GỖ TUYẾT TÙNG</span></div></section>`;
  }
  function brandStorySection() {
    return `<section class="story-band" aria-labelledby="story-title"><div class="story-image"><img src="assets/forest-story.svg" alt="Minh họa non nước Việt Nam, hoa sen và chai nước hoa hổ phách" loading="lazy" width="1280" height="720"><span class="image-caption">MỘT CHÚT HỒN VIỆT. MỘT CHÚT RIÊNG BẠN.</span></div><div class="story-copy reveal"><span class="eyebrow">04 / CÂU CHUYỆN VIEPERFUL</span><h2 id="story-title">Từ điều thân thuộc,<br>đến một <em>dấu ấn riêng.</em></h2><p>Một đóa sen trên mặt nước. Một chén trà trong sớm mai. Một vệt nắng trên thềm gỗ.</p><p>Vieperful bắt đầu từ những điều giản dị ấy — mang vẻ đẹp thiên nhiên Việt Nam vào câu chuyện mùi hương của người trẻ.</p><a class="text-link light" href="#/about">Khám phá câu chuyện ${arrow}</a></div></section>`;
  }
  function home() {
    return `<section class="hero">
      <div class="hero-copy"><div class="hero-eyebrow"><span class="small-line"></span> MÙI HƯƠNG LẤY CẢM HỨNG TỪ VIỆT NAM</div><h1>Hương Việt.<br><em>Dấu ấn riêng.</em></h1><p>Một mùi hương hợp với bạn,<br>cho những khoảnh khắc rất riêng.</p><div class="hero-actions"><button class="button" data-action="quiz-open">Tìm mùi hương của bạn ${arrow}</button><a class="hero-story-link" href="#/collection">Khám phá cả bộ sưu tập <span>→</span></a></div><div class="hero-caption"><span class="hero-number">06</span><span>Mùi hương concept.<br>Một câu chuyện của riêng bạn.</span><img src="assets/mark.svg" alt="" width="36" height="44"></div></div>
      <div class="hero-media"><img class="hero-poster" src="assets/film-poster-hd.jpg" alt="Chai Vieperful sắc hổ phách bên hoa sen và non nước lúc hoàng hôn" width="1920" height="1080" fetchpriority="high"><video id="hero-video" muted loop playsinline preload="metadata" poster="assets/film-poster-hd.jpg" aria-label="Phim cảm hứng Vieperful: nước hoa giữa non nước Việt Nam"><source src="assets/vieperful-film-hd.mp4" type="video/mp4"></video><div class="hero-media-shade"></div><span class="media-label">THE SCENT OF YOUR OWN STORY</span><div class="media-bottom"><span>Hồn Việt trong từng<br><i>khoảnh khắc.</i></span><button id="video-toggle" class="video-toggle" aria-label="Phát video"><span aria-hidden="true">▶</span> <span>Phát video</span></button></div></div>
    </section>
    ${forestFeatureSection()}
    ${occasionSection()}
    ${featuredSection()}
    ${brandStorySection()}
    <section class="closing-note reveal"><img src="assets/mark.svg" alt="" width="34" height="42"><p>“Một mùi hương – <em>Một dấu ấn riêng.</em>”</p><a class="text-link" href="#/guide">Chưa quen chọn nước hoa? Đọc hướng dẫn ${arrow}</a></section>`;
  }
  function shoppingSteps(active) {
    const labels = ["Chọn mùi hương", "Chọn dung tích", "Đặt hàng thử"];
    return `<nav class="shopping-steps container" aria-label="Các bước chọn mua"><ol>${labels.map((label, index) => `<li ${index + 1 === active ? 'aria-current="step"' : ''} class="${index + 1 < active ? 'is-complete' : ''}"><span class="step-circle">${index + 1 < active ? '✓' : index + 1}</span>${index === 0 && active > 1 ? `<a href="#/collection">${label}</a>` : `<span>${label}</span>`}</li>`).join("")}</ol></nav>`;
  }
  function collection(params) {
    return `<section class="page-intro container"><div class="breadcrumb"><a href="#/">Trang chủ</a><span>/</span>Bộ sưu tập</div><span class="eyebrow">06 MÙI HƯƠNG / CẢM HỨNG VIỆT NAM</span><h1>Tìm mùi hương <em>của bạn.</em></h1><p>Chọn nhóm hương, dịp sử dụng hoặc sắp xếp theo giá để tìm dấu ấn phù hợp.</p><span class="demo-label">Sản phẩm & giá minh họa · Không bán hàng thật</span></section>
    <section class="container collection-section"><form class="filters" id="filter-form"><label>Nhóm hương<select name="group" id="filter-group"><option value="">Tất cả nhóm hương</option>${Object.entries(Vieperful.groups).map(([k,v]) => `<option value="${k}">${v}</option>`).join("")}</select></label><label>Dịp sử dụng<select name="occasion" id="filter-occasion"><option value="">Mọi khoảnh khắc</option>${Object.entries(Vieperful.occasions).map(([k,v]) => `<option value="${k}">${v}</option>`).join("")}</select></label><label>Sắp xếp<select name="sort" id="filter-sort"><option value="">Gợi ý từ Vieperful</option><option value="asc">Giá 30 ml: thấp đến cao</option><option value="desc">Giá 30 ml: cao đến thấp</option></select></label><label class="filter-search">Tìm mùi hương<input type="search" id="filter-q" name="q" placeholder="Tên, nốt hương…" maxlength="80" value="${escapeHTML(params.get("q") || "")}"></label></form>
    <div class="results-bar"><span id="result-count" role="status"></span><button class="text-link" data-action="reset-filters">Xóa bộ lọc <span>↻</span></button></div><div class="product-grid" id="collection-grid"></div><p class="concept-note">Tầng hương là concept đề xuất, chưa phải thông số sản phẩm được kiểm chứng. Hình chai là minh họa thiết kế.</p></section>`;
  }
  function updateCollection() {
    const form = document.querySelector("#filter-form");
    if (!form) return;
    const values = new FormData(form);
    const query = normalize(values.get("q") || "");
    let products = Vieperful.products.filter(p =>
      (!values.get("group") || p.group === values.get("group")) &&
      (!values.get("occasion") || p.occasions.includes(values.get("occasion"))) &&
      (!query || normalize([p.name, p.description, ...p.notes].join(" ")).includes(query)));
    const getPrice = p => p.sizes.find(s => s.ml === 30).price;
    if (values.get("sort")) products.sort((a,b) => values.get("sort") === "asc" ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a));
    document.querySelector("#result-count").textContent = `${products.length} mùi hương dành cho bạn`;
    document.querySelector("#collection-grid").innerHTML = products.length ? products.map(productCard).join("") : `<div class="empty-state"><span class="empty-symbol">✳︎</span><h2>Chưa tìm thấy mùi hương phù hợp</h2><p>Thử bỏ bớt bộ lọc hoặc tìm bằng tên một nốt hương khác.</p><button class="button button-outline" data-action="reset-filters">Xem tất cả mùi hương ${arrow}</button></div>`;
    const params = new URLSearchParams();
    for (const [key,value] of values) if (value) params.set(key,value);
    history.replaceState(null, "", `#/collection${params.size ? "?" + params : ""}`);
    reveal();
  }
  function normalize(value) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"); }

  function detail(id) {
    const p = Shop.product(id);
    if (!p) return notFound();
    return `<section class="container detail-section"><div class="breadcrumb"><a href="#/">Trang chủ</a><span>/</span><a href="#/collection">Bộ sưu tập</a><span>/</span>${p.name}</div><div class="detail-layout"><div class="detail-art ${p.color}"><span class="product-tag">${p.label}</span><img src="${p.image}" alt="Minh họa thiết kế chai ${p.name}" width="500" height="600"><span class="art-caption">HÌNH ẢNH MINH HỌA CONCEPT</span></div><div class="detail-copy"><span class="eyebrow">${Vieperful.groups[p.group]} · EAU DE PARFUM CONCEPT</span><h1>${p.name}</h1><p class="detail-subtitle">${p.subtitle}</p><p>${p.description}</p><div class="occasion-tags">${p.occasions.map(o => `<span>${Vieperful.occasions[o]}</span>`).join("")}</div><form id="product-form" data-id="${p.id}"><fieldset class="size-options"><legend>Chọn dung tích</legend>${p.sizes.map(s => `<label><input type="radio" name="size" value="${s.ml}" ${s.ml === 30 ? "checked" : ""}><span>${s.ml} ml</span></label>`).join("")}</fieldset><div class="detail-price-row"><strong id="detail-price" aria-live="polite">${money(p.sizes.find(s => s.ml === 30).price)}</strong><span>Giá minh họa</span></div><button class="button full-width" type="submit">Thêm vào giỏ hàng <span>+</span></button></form><p class="small-note">Đây là sản phẩm concept của dự án môn học. Không thu tiền hoặc giao hàng.</p><details open class="notes-details"><summary>Câu chuyện tầng hương <span>+</span></summary><p class="muted">Tầng hương đề xuất để minh họa ý tưởng:</p><div class="scent-notes">${p.notes.map((n,i) => `<div><span>0${i+1}</span><div><small>${["HƯƠNG ĐẦU","HƯƠNG GIỮA","HƯƠNG CUỐI"][i]}</small><p>${n}</p></div></div>`).join("")}</div></details><details class="notes-details"><summary>Gợi ý sử dụng & bảo quản <span>+</span></summary><p>Dùng một lượng nhỏ trên vùng da sạch, tránh mắt và vùng da bị kích ứng. Bảo quản nơi mát, tránh nắng trực tiếp. Khi có sản phẩm thật, luôn ưu tiên hướng dẫn trên nhãn.</p><a class="text-link" href="#/guide">Đọc hướng dẫn ${arrow}</a></details></div></div></section><section class="section container related"><div class="section-heading"><div><span class="eyebrow">MỞ THÊM MỘT CÂU CHUYỆN</span><h2>Có thể bạn cũng <em>thích.</em></h2></div></div><div class="product-grid">${Vieperful.products.filter(x => x.id !== id).slice(0,3).map(productCard).join("")}</div></section>`;
  }
  function about() {
    return `<section class="page-intro container"><div class="breadcrumb"><a href="#/">Trang chủ</a><span>/</span>Về Vieperful</div><span class="eyebrow">CÂU CHUYỆN CỦA CHÚNG TÔI</span><h1>Hương từ đất Việt.<br><em>Chuyện của riêng bạn.</em></h1><p>Không phải ai cũng kể câu chuyện của mình bằng lời.<br>Đôi khi, một mùi hương là đủ để bắt đầu.</p></section><section class="about-image container"><img src="assets/forest-story.svg" alt="Minh họa cảm hứng hoa sen và non nước Việt Nam" width="1280" height="720"></section><section class="about-text container reveal"><span class="eyebrow">TỪ NHỮNG ĐIỀU THÂN THUỘC</span><h2>Một ý tưởng nhỏ.<br>Một thế giới <em>cảm xúc.</em></h2><div><p>Vieperful là ý tưởng thương hiệu được phát triển trong một dự án môn học, dành cho những người trẻ muốn tìm mùi hương phù hợp với cá tính, hoàn cảnh và ngân sách của mình.</p><p>Hoa sen, trà xanh, nắng sớm và hương gỗ trở thành điểm khởi đầu cho sáu câu chuyện. Mỗi concept là một cách nhìn về vẻ đẹp gần gũi của thiên nhiên Việt Nam — vừa quen thuộc, vừa đủ mới để bạn khám phá.</p><p>Chúng tôi muốn hành trình chọn mùi hương trở nên nhẹ nhàng hơn: biết mình đang tìm gì, so sánh các lựa chọn và tìm thấy điều khiến mình cảm thấy là chính mình.</p></div></section><section class="values container"><article><span>01</span><h3>Gần gũi</h3><p>Cảm hứng từ những cảnh sắc và hương thơm thân quen của Việt Nam.</p></article><article><span>02</span><h3>Cá nhân</h3><p>Chọn hương theo cảm xúc và phong cách riêng, không giới hạn bởi khuôn mẫu.</p></article><article><span>03</span><h3>Minh bạch</h3><p>Thông tin và giá trong website là minh họa. Chúng tôi không đưa ra cam kết chất lượng chưa kiểm chứng.</p></article></section><section class="closing-note"><p>Hãy để hương thơm <em>kể chuyện bạn.</em></p><a class="button" href="#/collection">Tìm dấu ấn của bạn ${arrow}</a></section>`;
  }
  function guide() {
    const everydayFaqs = [
      ["Nên chọn mùi hương đầu tiên như thế nào?", "Bắt đầu từ dịp bạn dùng thường xuyên và nhóm hương khiến bạn thoải mái. Hãy thử từng mùi riêng, vì cảm nhận trên da khác nhau ở mỗi người."],
      ["Hương hoa, thanh mát và hương gỗ khác nhau ra sao?", "Trong bộ sưu tập concept này, nhóm thanh mát gợi cảm giác thoáng nhẹ; hương hoa mềm mại; nhóm gỗ trầm ấm hơn. Đây là mô tả minh họa, không phải kết quả kiểm nghiệm."],
      ["Dùng và bảo quản nước hoa thế nào?", "Thử lượng nhỏ trên vùng da sạch, tránh mắt và vùng da kích ứng. Đóng nắp sau khi dùng, cất nơi khô mát, tránh nắng và nguồn nhiệt. Với sản phẩm thật, hãy ưu tiên hướng dẫn trên nhãn."],
      ["Nên làm gì nếu da bị kích ứng?", "Ngừng sử dụng và làm theo hướng dẫn y tế phù hợp. Thông tin trên website là gợi ý chung, không thay thế tư vấn chuyên môn."]
    ];
    const demoFaqs = [
      ["Tôi có thể mua sản phẩm thật tại đây không?", "Chưa. Đây là website dự án môn học. Giỏ hàng và đặt đơn chỉ mô phỏng; không có thanh toán, giao hàng hay sản phẩm thật được bán qua website."],
      ["Giá, dung tích và tầng hương có phải thông số chính thức?", "Không. Tất cả là dữ liệu minh họa. Tầng hương là concept đề xuất để thể hiện định hướng sáng tạo, chưa được kiểm chứng trên sản phẩm thực tế."],
      ["Giỏ hàng và đơn thử được lưu ở đâu?", "Giỏ hàng và tối đa 30 đơn thử gần nhất được lưu trong localStorage của trình duyệt hiện tại. Dữ liệu không gửi lên máy chủ và không đồng bộ giữa thiết bị. Chỉ dùng thông tin giả để thử nghiệm."],
      ["Làm sao xóa lịch sử đơn thử?", "Chọn “Xóa lịch sử đơn thử” ở chân trang hoặc trang đơn hàng. Bạn cũng có thể xóa dữ liệu website trong cài đặt trình duyệt. Đơn đã xóa không thể khôi phục."],
      ["Đơn thử có phí giao hàng hoặc thanh toán không?", "Không. Không thu tiền và không gửi đơn. Tổng tiền, phí giao hàng 0 đồng và thông tin người nhận chỉ là phần mô phỏng."]
    ];
    const renderFaqs = items => items.map(([q,a]) => `<details><summary>${q}<span>+</span></summary><p>${a}</p></details>`).join("");
    return `<section class="page-intro container"><div class="breadcrumb"><a href="#/">Trang chủ</a><span>/</span>Góc hương thơm</div><span class="eyebrow">MỘT CHÚT HIỂU, MỘT CHÚT YÊU</span><h1>Để hương thơm<br><em>đồng hành cùng bạn.</em></h1><p>Những gợi ý cơ bản cho hành trình khám phá mùi hương.<br>Luôn ưu tiên hướng dẫn trên nhãn của sản phẩm thực tế.</p></section><section class="guide-grid container"><article><span class="step-number">01</span><h2>Bắt đầu thật nhẹ</h2><p>Thử một lượng nhỏ trên da sạch. Chờ mùi hương phát triển trước khi quyết định có dùng thêm hay không. Tránh xịt gần mắt, niêm mạc hoặc vùng da đang kích ứng.</p></article><article><span class="step-number">02</span><h2>Cho hương thời gian</h2><p>Hương đầu, hương giữa và hương cuối có thể mang cảm nhận khác nhau. Thử từng mùi riêng và dành thời gian cảm nhận, thay vì thử quá nhiều mùi cùng lúc.</p></article><article><span class="step-number">03</span><h2>Giữ một góc mát</h2><p>Đóng nắp sau khi dùng, cất ở nơi khô mát, tránh nắng và nguồn nhiệt. Để xa tầm tay trẻ em. Ngừng sử dụng nếu xuất hiện kích ứng.</p></article></section><section class="faq-section container" id="faq"><div><span class="eyebrow">CHÚNG TÔI Ở ĐÂY ĐỂ GIẢI ĐÁP</span><h2>Có thể bạn<br>đang <em>thắc mắc.</em></h2><a class="text-link" href="#/collection">Trở lại bộ sưu tập ${arrow}</a></div><div class="faq-list">${renderFaqs(everydayFaqs)}<h3 class="faq-group-title">Về bản demo</h3>${renderFaqs(demoFaqs)}</div></section>`;
  }

  function refreshCompare() {
    const launch = document.querySelector("#compare-launch");
    if (!launch) return;
    launch.hidden = compareIds.length === 0;
    launch.setAttribute("aria-label", `Mở danh sách so sánh, ${compareIds.length} sản phẩm`);
    document.querySelector("#compare-count").textContent = `${compareIds.length} / 3`;
    document.querySelectorAll(".compare-toggle").forEach(button => {
      const selected = compareIds.includes(button.dataset.id);
      button.setAttribute("aria-pressed", String(selected));
      button.innerHTML = `<span aria-hidden="true">${selected ? "✓" : "+"}</span> ${selected ? "Đang so sánh" : "Thêm vào so sánh"}`;
    });
  }
  function renderCompare() {
    const products = compareIds.map(id => Shop.product(id)).filter(Boolean);
    const rows = [
      ["Nhóm hương", p => Vieperful.groups[p.group]],
      ["Dịp sử dụng", p => p.occasions.map(o => Vieperful.occasions[o]).join(" · ")],
      ["Nốt hương", p => p.notes.join(" · ")],
      ["Giá 30 ml", p => money(p.sizes.find(s => s.ml === 30).price)]
    ];
    document.querySelector("#compare-body").innerHTML = products.length ? `<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th scope="col">Đặc điểm</th>${products.map(p => `<th scope="col"><div class="compare-product"><img src="${p.image}" alt="" width="70" height="84"><strong>${p.name}</strong><button class="compare-remove" data-action="compare-remove" data-id="${p.id}" aria-label="Bỏ ${p.name} khỏi danh sách so sánh">Bỏ</button></div></th>`).join("")}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th>${products.map(p => `<td>${value(p)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="small-note">Sản phẩm, nhóm hương và giá trong bảng đều là dữ liệu minh họa cho dự án môn học.</p>` : `<p class="empty-compare">Chọn tối đa ba mùi hương trong bộ sưu tập để so sánh.</p>`;
    refreshCompare();
  }
  function quickView(id) {
    const p = Shop.product(id);
    if (!p) return;
    document.querySelector("#quick-view-body").innerHTML = `<div class="quick-view-layout"><div class="quick-view-art ${p.color}"><img src="${p.image}" alt="Minh họa chai nước hoa ${p.name}" width="500" height="600"></div><div><span class="eyebrow">${Vieperful.groups[p.group]} · ${Vieperful.occasions[p.occasions[0]]}</span><h3>${p.name}</h3><p>${p.description}</p><p class="quick-view-notes">${p.notes.join(" · ")}</p><form id="quick-view-form" data-id="${p.id}"><fieldset class="size-options"><legend>Chọn dung tích</legend>${p.sizes.map(s => `<label><input type="radio" name="size" value="${s.ml}" ${s.ml === 30 ? "checked" : ""}><span>${s.ml} ml</span></label>`).join("")}</fieldset><div class="detail-price-row"><strong id="quick-view-price" aria-live="polite">${money(p.sizes.find(s => s.ml === 30).price)}</strong><span>Giá minh họa</span></div><button class="button full-width" type="submit">Thêm vào giỏ hàng <span>+</span></button></form><a class="text-link" href="#/product/${p.id}">Xem câu chuyện đầy đủ ${arrow}</a></div></div>`;
    openDialog("quick-view-dialog");
    document.querySelector('#quick-view-form input[name="size"]:checked')?.focus({ preventScroll: true });
  }
  function quizForm() {
    document.querySelector("#quiz-body").innerHTML = `<form id="quiz-form"><fieldset><legend>1. Bạn muốn dùng hương vào dịp nào?</legend><div class="quiz-options">${[["everyday","Mỗi ngày"],["work","Đi học & đi làm"],["date","Hẹn hò"],["evening","Buổi tối"]].map(([value,label],i) => `<label><input type="radio" name="occasion" value="${value}" ${i === 0 ? "required" : ""}><span>${label}</span></label>`).join("")}</div></fieldset><fieldset><legend>2. Bạn yêu thích nhóm hương nào?</legend><div class="quiz-options">${Object.entries(Vieperful.groups).map(([value,label],i) => `<label><input type="radio" name="group" value="${value}" ${i === 0 ? "required" : ""}><span>${label}</span></label>`).join("")}</div></fieldset><fieldset><legend>3. Ngân sách minh họa cho chai 30 ml?</legend><div class="quiz-options">${[["450","Đến 450.000 ₫"],["500","Đến 500.000 ₫"],["any","Linh hoạt"]].map(([value,label],i) => `<label><input type="radio" name="budget" value="${value}" ${i === 0 ? "required" : ""}><span>${label}</span></label>`).join("")}</div></fieldset><div class="quiz-actions"><button class="button" type="submit">Xem gợi ý ${arrow}</button><button class="text-link" type="reset">Làm lại</button></div></form>`;
  }
  function recommendationResults(form) {
    const values = Object.fromEntries(new FormData(form));
    const occasion = Vieperful.occasions[values.occasion];
    const group = Vieperful.groups[values.group];
    const limit = values.budget === "any" ? Infinity : Number(values.budget) * 1000;
    let candidates = Vieperful.products.map(p => ({ p, price: p.sizes.find(s => s.ml === 30).price, score: (p.occasions.includes(values.occasion) ? 3 : 0) + (p.group === values.group ? 2 : 0) }));
    let withinBudget = candidates.filter(item => item.price <= limit);
    let usedBudgetFallback = false;
    if (!withinBudget.length) { withinBudget = candidates; usedBudgetFallback = true; }
    const results = withinBudget.sort((a,b) => b.score - a.score || a.price - b.price).slice(0,2);
    const budgetReason = values.budget === "any" ? "ngân sách linh hoạt" : usedBudgetFallback ? "không có lựa chọn trong mức đã chọn; hiển thị lựa chọn gần nhất" : `giá minh họa ${money(limit)} trở xuống`;
    document.querySelector("#quiz-body").innerHTML = `<div class="quiz-results"><p class="quiz-explanation">Gợi ý dựa trên dịp <strong>${occasion}</strong>, nhóm <strong>${group}</strong> và ${budgetReason}. Sản phẩm và mức giá là dữ liệu minh họa.</p><div class="quiz-result-grid">${results.map(({p,price,score}) => `<article class="quiz-result"><img src="${p.image}" alt="" width="110" height="130"><div><span class="eyebrow">${Vieperful.groups[p.group]} · ${money(price)} / 30 ml</span><h3>${p.name}</h3><p>${p.occasions.includes(values.occasion) ? `Phù hợp dịp ${occasion}` : "Gợi ý khám phá thêm"}; ${p.group === values.group ? `đúng nhóm ${group} bạn thích` : `mang sắc thái ${Vieperful.groups[p.group].toLowerCase()}`}. ${score ? "Ưu tiên theo các lựa chọn trùng khớp." : "Gợi ý gần nhất theo dữ liệu concept."}</p><a class="text-link" href="#/product/${p.id}">Xem sản phẩm ${arrow}</a></div></article>`).join("")}</div><button class="button button-outline" data-action="quiz-reset">Trả lời lại ba câu hỏi</button></div>`;
  }
  function openQuiz() { quizForm(); openDialog("quiz-dialog"); document.querySelector('#quiz-form input[name="occasion"]')?.focus({ preventScroll: true }); }

  function quantityControls(item) {
    return `<div class="quantity-control" role="group" aria-label="Số lượng ${item.product.name} ${item.ml} ml"><button data-action="quantity" data-id="${item.id}" data-ml="${item.ml}" data-amount="-1" aria-label="Giảm số lượng ${item.product.name} ${item.ml} ml" ${item.quantity === 1 ? "disabled" : ""}>−</button><span aria-live="polite">${item.quantity}</span><button data-action="quantity" data-id="${item.id}" data-ml="${item.ml}" data-amount="1" aria-label="Tăng số lượng ${item.product.name} ${item.ml} ml" ${item.quantity === 99 ? "disabled" : ""}>+</button></div>`;
  }
  function renderCart() {
    badge();
    const items = Shop.items();
    document.querySelector("#cart-body").innerHTML = items.length ? `<p class="drawer-note">Một mùi hương, một dấu ấn bạn chọn mang theo.</p><div class="cart-items">${items.map(i => `<article class="cart-item"><a href="#/product/${i.id}" class="cart-image ${i.product.color}"><img src="${i.product.image}" alt="${i.product.name}" width="90" height="110"></a><div class="cart-item-content"><div class="cart-item-title"><a href="#/product/${i.id}">${i.product.name}</a><button class="remove-button" data-action="remove" data-id="${i.id}" data-ml="${i.ml}" aria-label="Xóa ${i.product.name} ${i.ml} ml">✕</button></div><p>${Vieperful.groups[i.product.group]} · ${i.ml} ml</p><div class="cart-item-bottom">${quantityControls(i)}<strong>${money(i.price * i.quantity)}</strong></div></div></article>`).join("")}</div><div class="cart-summary"><div><span>Tạm tính</span><strong>${money(Shop.total())}</strong></div><p>Đơn hàng mô phỏng. Không thu tiền hay giao hàng.</p><a href="#/checkout" class="button full-width">Tiến hành đặt thử ${arrow}</a><button class="text-link center-link" data-close>Tiếp tục khám phá <span>→</span></button></div>` : `<div class="empty-state"><span class="empty-symbol">✳︎</span><h3>Một khoảng trống<br>chờ dấu ấn của bạn.</h3><p>Giỏ hàng chưa có sản phẩm.<br>Khám phá một mùi hương bạn yêu thích nhé.</p><a class="button" href="#/collection">Khám phá bộ sưu tập ${arrow}</a></div>`;
  }
  function orderSummary(items, total) {
    return `<div class="order-items">${items.map(i => `<div class="order-line"><div><strong>${escapeHTML(i.name || i.product.name)}</strong><span>${i.ml} ml × ${i.quantity}</span></div><span>${money(i.price * i.quantity)}</span></div>`).join("")}</div><div class="summary-row"><span>Phí giao hàng mô phỏng</span><span>0 ₫</span></div><div class="summary-total"><span>Tổng cộng</span><strong>${money(total)}</strong></div>`;
  }
  function checkout() {
    if (!Shop.count()) return `<section class="container empty-page"><div class="empty-state"><span class="empty-symbol">✳︎</span><h1>Giỏ hàng đang trống</h1><p>Chọn một mùi hương trước khi đặt đơn thử.</p><a href="#/collection" class="button">Khám phá bộ sưu tập ${arrow}</a></div></section>`;
    return `<section class="container checkout-section"><div class="breadcrumb"><a href="#/collection">Bộ sưu tập</a><span>/</span><button data-action="cart">Giỏ hàng</button><span>/</span>Đặt hàng thử</div><span class="eyebrow">BƯỚC CUỐI CỦA HÀNH TRÌNH</span><h1>Gửi một chút <em>hương.</em></h1><div class="demo-notice"><span>ⓘ</span><p><strong>Đây là đơn hàng mô phỏng.</strong> Vui lòng dùng thông tin giả để thử nghiệm. Không thu tiền, không gửi đơn và không giao hàng. Dữ liệu chỉ lưu trên trình duyệt này.</p></div><div class="checkout-layout"><form id="checkout-form" novalidate><h2>Thông tin người nhận</h2><div class="field"><label for="customer-name">Họ và tên <span>*</span></label><input id="customer-name" name="name" placeholder="Ví dụ: Nguyễn Demo" autocomplete="off" maxlength="80" required aria-describedby="error-name"><small class="field-error" id="error-name"></small></div><div class="form-row"><div class="field"><label for="customer-phone">Số điện thoại <span>*</span></label><input id="customer-phone" name="phone" type="tel" placeholder="Ví dụ: 0900000000" autocomplete="off" maxlength="20" required aria-describedby="error-phone"><small class="field-error" id="error-phone"></small></div><div class="field"><label for="customer-email">Email (không bắt buộc)</label><input id="customer-email" name="email" type="email" placeholder="demo@example.com" autocomplete="off" maxlength="100" aria-describedby="error-email"><small class="field-error" id="error-email"></small></div></div><div class="field"><label for="customer-address">Địa chỉ mô phỏng <span>*</span></label><textarea id="customer-address" name="address" rows="3" placeholder="Ví dụ: 123 Đường Minh Họa, Phường Demo, TP. Hồ Chí Minh" autocomplete="off" maxlength="300" required aria-describedby="error-address"></textarea><small class="field-error" id="error-address"></small></div><div class="field"><label for="customer-note">Lời nhắn (không bắt buộc)</label><textarea id="customer-note" name="note" rows="2" maxlength="300" placeholder="Một lời nhắn cho đơn thử…"></textarea></div><div class="field"><label class="checkbox-label"><input type="checkbox" name="consent" required aria-describedby="error-consent"><span>Tôi hiểu đây là đơn mô phỏng và đã sử dụng thông tin giả.</span></label><small class="field-error" id="error-consent"></small></div><div id="checkout-error" class="field-error" role="alert"></div><button class="button full-width" type="submit">Xác nhận đặt hàng thử ${arrow}</button></form><aside class="order-review"><div class="order-review-title"><h2>Đơn hàng của bạn</h2><button class="text-link" data-action="cart">Chỉnh sửa</button></div>${orderSummary(Shop.items(), Shop.total())}<div class="payment-note"><span>◈</span><div><strong>Trải nghiệm mô phỏng</strong><p>Không yêu cầu thẻ hoặc tài khoản thanh toán.</p></div></div></aside></div></section>`;
  }
  function validateCheckout(form) {
    const data = Object.fromEntries(new FormData(form));
    Object.keys(data).forEach(key => { data[key] = data[key].trim(); });
    const phone = (data.phone || "").replace(/[\s().-]/g, "");
    const errors = {};
    if (!data.name || data.name.length < 2) errors.name = "Nhập họ tên giả có ít nhất 2 ký tự.";
    if (!/^(0\d{9}|\+84\d{9})$/.test(phone)) errors.phone = "Nhập số điện thoại 10 chữ số bắt đầu bằng 0, hoặc +84 và 9 chữ số.";
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Nhập email đúng định dạng, ví dụ demo@example.com.";
    if (!data.address || data.address.length < 10) errors.address = "Nhập địa chỉ mô phỏng có ít nhất 10 ký tự.";
    if (!data.consent) errors.consent = "Vui lòng xác nhận bạn đang sử dụng thông tin giả.";
    ["name","phone","email","address","consent"].forEach(key => {
      document.getElementById(`error-${key}`).textContent = errors[key] || "";
      form.elements[key].setAttribute("aria-invalid", String(Boolean(errors[key])));
    });
    if (Object.keys(errors).length) {
      document.querySelector("#checkout-error").textContent = "Vui lòng kiểm tra các trường được đánh dấu.";
      form.elements[Object.keys(errors)[0]].focus();
      return null;
    }
    return { name: data.name, phone, email: data.email, address: data.address, note: data.note };
  }
  function confirmation(id) {
    const order = Shop.orders().find(o => o.id === id);
    if (!order) return `<section class="container empty-page"><div class="empty-state"><h1>Không tìm thấy đơn thử</h1><p>Đơn có thể đã bị xóa hoặc được tạo trên trình duyệt khác.</p><a class="button" href="#/orders">Xem lịch sử đơn thử ${arrow}</a></div></section>`;
    return `<section class="confirmation container"><span class="success-mark" aria-hidden="true">✓</span><span class="eyebrow">MỘT TRẢI NGHIỆM ĐÃ HOÀN TẤT</span><h1>Dấu ấn của bạn<br><em>đã được ghi lại.</em></h1><p>Đơn thử đã được lưu trên trình duyệt này.<br>Đây là xác nhận mô phỏng; không có thanh toán hay giao hàng.</p><div class="confirmation-card"><div class="order-meta"><div><small>MÃ ĐƠN THỬ</small><strong>${escapeHTML(order.id)}</strong></div><div><small>THỜI GIAN TẠO</small><span>${escapeHTML(new Date(order.date).toLocaleString("vi-VN"))}</span></div></div>${orderSummary(order.items, order.total)}<div class="recipient-summary"><strong>Người nhận mô phỏng</strong><p>${escapeHTML(order.recipient?.name || "")} · ${escapeHTML(order.recipient?.phone || "")}<br>${escapeHTML(order.recipient?.address || "")}</p></div></div><div class="button-row"><a href="#/collection" class="button">Tiếp tục khám phá ${arrow}</a><a href="#/orders" class="button button-outline">Lịch sử đơn thử</a></div></section>`;
  }
  function ordersPage() {
    const orders = Shop.orders();
    return `<section class="container orders-section"><div class="breadcrumb"><a href="#/">Trang chủ</a><span>/</span>Đơn hàng thử</div><span class="eyebrow">NHỮNG DẤU ẤN ĐÃ CHỌN</span><h1>Đơn hàng <em>của bạn.</em></h1><p class="muted">Tối đa 30 đơn mô phỏng gần nhất, chỉ lưu trên trình duyệt này.</p>${orders.length ? `<div class="orders-list">${orders.map(o => `<a class="order-history-card" href="#/order/${encodeURIComponent(o.id)}"><div><strong>${escapeHTML(o.id)}</strong><span>${escapeHTML(new Date(o.date).toLocaleDateString("vi-VN"))} · ${o.items.reduce((n,i) => n + i.quantity,0)} sản phẩm</span></div><div><strong>${money(o.total)}</strong><span>Xem chi tiết <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span></div></a>`).join("")}</div><button class="text-link" data-action="clear-orders">Xóa lịch sử đơn thử ${arrow}</button>` : `<div class="empty-state"><span class="empty-symbol">✳︎</span><h2>Chưa có câu chuyện nào ở đây</h2><p>Đơn đặt thử thành công sẽ xuất hiện tại đây.</p><a class="button" href="#/collection">Khám phá bộ sưu tập ${arrow}</a></div>`}</section>`;
  }
  function notFound() { return `<section class="container empty-page"><div class="empty-state"><span class="eyebrow">404 · LẠC MỘT CHÚT THÔI</span><h1>Mùi hương này<br>chưa có ở đây.</h1><a href="#/collection" class="button">Trở lại bộ sưu tập ${arrow}</a></div></section>`; }
  let observer;
  function reveal() {
    observer?.disconnect();
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.06 });
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
  }
  function startVideo() {
    const video = document.querySelector("#hero-video");
    const button = document.querySelector("#video-toggle");
    const stage = document.querySelector(".forest-stage");
    const cleanups = [];
    if (stage && matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion.matches) {
      const layers = [...stage.querySelectorAll("[data-depth]")];
      const move = event => {
        if (event.pointerType === "touch" || reducedMotion.matches) return;
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        layers.forEach(layer => {
          const depth = Number(layer.dataset.depth);
          const tilt = layer.classList.contains("forest-bottle") ? ` rotateY(${x * 3}deg) rotateX(${y * -2}deg)` : "";
          layer.style.transform = `translate3d(${x * depth * -5}px, ${y * depth * -4}px, 0)${tilt}`;
        });
      };
      const reset = () => layers.forEach(layer => { layer.style.transform = ""; });
      const motionChange = () => { if (reducedMotion.matches) reset(); };
      stage.addEventListener("pointermove", move, { passive: true });
      stage.addEventListener("pointerleave", reset, { passive: true });
      reducedMotion.addEventListener("change", motionChange);
      cleanups.push(() => { stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", reset); reducedMotion.removeEventListener("change", motionChange); reset(); });
    }
    if (!video) { pageCleanup = () => cleanups.forEach(cleanup => cleanup()); return; }
    const update = () => {
      button.innerHTML = video.paused ? '<span aria-hidden="true">▶</span> <span>Phát video</span>' : '<span aria-hidden="true">Ⅱ</span> <span>Tạm dừng</span>';
      button.setAttribute("aria-label", video.paused ? "Phát video" : "Tạm dừng video");
    };
    const fail = () => { video.hidden = true; button.hidden = true; };
    video.addEventListener("error", fail);
    video.querySelector("source").addEventListener("error", fail);
    video.addEventListener("play", update);
    video.addEventListener("pause", update);
    button.addEventListener("click", () => video.paused ? video.play().catch(() => toast("Video chưa phát được. Bạn vẫn có thể xem ảnh minh họa.")) : video.pause());
    const onMotion = () => { if (reducedMotion.matches) video.pause(); };
    reducedMotion.addEventListener("change", onMotion);
    if (!reducedMotion.matches) video.play().catch(update);
    pageCleanup = () => { video.pause(); reducedMotion.removeEventListener("change", onMotion); cleanups.forEach(cleanup => cleanup()); };
  }
  function route() {
    pageCleanup();
    pageCleanup = () => {};
    closeDialogs();
    const [path, query = ""] = (location.hash === "#main" ? "/" : location.hash.slice(1) || "/").split("?");
    const params = new URLSearchParams(query);
    currentRoute = path;
    const isProduct = path.startsWith("/product/");
    const title = path === "/" ? "Một mùi hương, một dấu ấn riêng" : path === "/collection" ? "Bộ sưu tập" : isProduct ? (Shop.product(path.split("/")[2])?.name || "Không tìm thấy") : path === "/about" ? "Câu chuyện" : path === "/guide" ? "Góc hương thơm" : path === "/checkout" ? "Đặt hàng thử" : "Đơn hàng thử";
    document.title = `${title} — Vieperful`;
    main.innerHTML = path === "/" ? home() : path === "/collection" ? collection(params) : isProduct ? detail(path.split("/")[2]) : path === "/about" ? about() : path === "/guide" ? guide() : path === "/checkout" ? checkout() : path === "/orders" ? ordersPage() : path.startsWith("/order/") ? confirmation(path.split("/")[2]) : notFound();
    const step = path === "/collection" ? 1 : isProduct && Shop.product(path.split("/")[2]) ? 2 : path === "/checkout" && Shop.count() ? 3 : 0;
    if (step) main.insertAdjacentHTML("afterbegin", shoppingSteps(step));
    main.dataset.route = path;
    document.querySelectorAll("[data-nav]").forEach(a => {
      const active = a.dataset.nav === (path === "/" ? "home" : isProduct ? "collection" : path.slice(1));
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (path === "/collection") {
      ["group","occasion","sort"].forEach(key => {
        const select = document.querySelector(`#filter-${key}`);
        if ([...select.options].some(o => o.value === params.get(key))) select.value = params.get(key);
      });
      updateCollection();
      document.querySelector("#filter-form").addEventListener("input", updateCollection);
      document.querySelector("#filter-form").addEventListener("submit", e => e.preventDefault());
    }
    refreshCompare();
    window.scrollTo({ top: 0, behavior: "instant" });
    main.focus({ preventScroll: true });
    if (path === "/guide" && params.get("section") === "faq") document.querySelector("#faq").scrollIntoView();
    startVideo();
    reveal();
    badge();
  }

  document.addEventListener("click", event => {
    if (event.target.closest(".skip-link")) { event.preventDefault(); main.focus(); return; }
    const close = event.target.closest("[data-close]");
    if (close) { close.closest("dialog")?.close(); return; }
    const target = event.target.closest("[data-action]");
    if (!target) {
      // Đóng hộp thoại cả khi liên kết trỏ đến trang đang mở.
      if (event.target.closest('dialog a[href^="#/"]')) closeDialogs();
      return;
    }
    const { action, id, ml, amount } = target.dataset;
    if (action === "choose-scent") {
      const section = document.querySelector("#choose-scent");
      section?.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth" });
      section?.querySelector("a")?.focus({ preventScroll: true });
    }
    if (action === "quiz-open") openQuiz();
    if (action === "quiz-reset") openQuiz();
    if (action === "quick-view") quickView(id);
    if (action === "compare-open") { renderCompare(); openDialog("compare-dialog"); }
    if (action === "compare-toggle") {
      if (compareIds.includes(id)) compareIds = compareIds.filter(item => item !== id);
      else if (compareIds.length < 3) compareIds = [...compareIds, id];
      else { toast("Bạn có thể so sánh tối đa ba sản phẩm."); return; }
      refreshCompare();
    }
    if (action === "compare-remove") {
      const removedId = id;
      compareIds = compareIds.filter(item => item !== id);
      renderCompare();
      if (!compareIds.length) {
        closeDialogs();
        document.querySelector(`.compare-toggle[data-id="${removedId}"]`)?.focus();
      } else document.querySelector("#compare-body [data-action=compare-remove]")?.focus();
    }
    if (action === "cart") { renderCart(); openDialog("cart-dialog"); }
    if (action === "menu") openDialog("menu-dialog");
    if (action === "search") openDialog("search-dialog");
    if (action === "quick-add") { Shop.add(id, 30); badge(); toast(Shop.warning() ? "Đã thêm vào giỏ tạm thời. Trình duyệt đang hạn chế lưu trữ; giỏ có thể mất khi tải lại." : `${Shop.product(id).name} · 30 ml đã được thêm vào giỏ.`); }
    if (action === "quantity" || action === "remove") {
      const focusedLabel = target.getAttribute("aria-label");
      const previousIndex = [...document.querySelectorAll(".cart-item")].indexOf(target.closest(".cart-item"));
      if (action === "quantity") Shop.change(id, Number(ml), Number(amount));
      else Shop.remove(id, Number(ml));
      renderCart();
      const equivalent = [...document.querySelectorAll("#cart-body button")].find(b => b.getAttribute("aria-label") === focusedLabel && !b.disabled);
      const fallback = document.querySelectorAll(".cart-item")[Math.max(0, previousIndex - 1)]?.querySelector("a") || document.querySelector("#cart-body a");
      (equivalent || fallback)?.focus();
      if (currentRoute === "/checkout") {
        // Cập nhật tổng đơn mà vẫn giữ các trường người dùng đã nhập.
        if (Shop.count()) document.querySelector(".order-review").innerHTML = `<div class="order-review-title"><h2>Đơn hàng của bạn</h2><button class="text-link" data-action="cart">Chỉnh sửa</button></div>${orderSummary(Shop.items(), Shop.total())}<p class="small-note">Không thu tiền hay giao hàng.</p>`;
        else { closeDialogs(); route(); }
      }
    }
    if (action === "reset-filters") { document.querySelector("#filter-form").reset(); document.querySelector("#filter-q").value = ""; updateCollection(); }
    if (action === "clear-orders") openDialog("confirm-dialog");
    if (action === "confirm-clear") {
      if (Shop.clearOrders()) { closeDialogs(); toast("Đã xóa lịch sử đơn thử trên trình duyệt này."); if (currentRoute === "/orders" || currentRoute.startsWith("/order/")) route(); }
      else toast("Trình duyệt không cho phép xóa dữ liệu. Hãy kiểm tra quyền lưu trữ.");
    }
  });
  document.addEventListener("change", event => {
    if (event.target.matches('#product-form input[name="size"]')) {
      const p = Shop.product(event.target.form.dataset.id);
      document.querySelector("#detail-price").textContent = money(p.sizes.find(s => s.ml === Number(event.target.value)).price);
    }
    if (event.target.matches('#quick-view-form input[name="size"]')) {
      const p = Shop.product(event.target.form.dataset.id);
      document.querySelector("#quick-view-price").textContent = money(p.sizes.find(s => s.ml === Number(event.target.value)).price);
    }
  });
  document.addEventListener("reset", event => {
    if (event.target.id === "quiz-form") {
      event.preventDefault();
      openQuiz();
    }
  });
  document.addEventListener("submit", event => {
    const form = event.target;
    if (form.id === "search-form") {
      event.preventDefault();
      const query = new FormData(form).get("q").trim();
      closeDialogs();
      const next = "#/collection" + (query ? "?q=" + encodeURIComponent(query) : "");
      if (location.hash === next) route(); else location.hash = next;
    }
    if (form.id === "product-form") {
      event.preventDefault();
      Shop.add(form.dataset.id, Number(new FormData(form).get("size")));
      renderCart();
      openDialog("cart-dialog");
    }
    if (form.id === "quick-view-form") {
      event.preventDefault();
      Shop.add(form.dataset.id, Number(new FormData(form).get("size")));
      closeDialogs();
      renderCart();
      openDialog("cart-dialog");
    }
    if (form.id === "quiz-form") {
      event.preventDefault();
      if (!form.reportValidity()) return;
      recommendationResults(form);
      document.querySelector("#quiz-body .quiz-results .button")?.focus();
    }
    if (form.id === "checkout-form") {
      event.preventDefault();
      const recipient = validateCheckout(form);
      if (!recipient) return;
      const order = Shop.checkout(recipient);
      if (!order) { document.querySelector("#checkout-error").textContent = "Không thể lưu đơn. Kiểm tra quyền lưu trữ của trình duyệt và thử lại; giỏ hàng vẫn được giữ."; return; }
      badge();
      location.hash = "#/order/" + order.id;
    }
  });
  window.addEventListener("hashchange", route);
  route();
  if (Shop.warning()) toast("Trình duyệt đang hạn chế lưu trữ hoặc dữ liệu cũ không hợp lệ. Giỏ hàng có thể không được giữ khi tải lại.");
})();
