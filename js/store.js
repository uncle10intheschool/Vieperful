/* Lớp lưu trữ của bản demo: chỉ dùng localStorage, không gửi dữ liệu lên máy chủ. */
(() => {
  const CART_KEY = "vieperful.cart.v1";
  const ORDERS_KEY = "vieperful.orders.v1";
  let storageWarning = false;
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { storageWarning = true; return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { storageWarning = true; return false; }
  }
  const product = id => Vieperful.products.find(p => p.id === id);
  const rawCart = read(CART_KEY, []);
  let cart = [];
  // Loại bỏ dữ liệu không hợp lệ và gộp các lựa chọn trùng nhau.
  if (Array.isArray(rawCart)) rawCart.forEach(item => {
    if (!item || !product(item.id)?.sizes.some(s => s.ml === item.ml) || !Number.isInteger(item.quantity) || item.quantity < 1) return;
    const existing = cart.find(x => x.id === item.id && x.ml === item.ml);
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
    else cart.push({ id: item.id, ml: item.ml, quantity: Math.min(99, item.quantity) });
  });
  const rawOrders = read(ORDERS_KEY, []);
  let orders = Array.isArray(rawOrders) ? rawOrders.filter(o => o && typeof o.id === "string" && typeof o.date === "string" && Number.isFinite(o.total) && Array.isArray(o.items) && o.items.every(i => i && typeof i.name === "string" && Number.isFinite(i.price) && Number.isInteger(i.quantity) && Number.isFinite(i.ml))) : [];
  function persistCart() { write(CART_KEY, cart); }
  const items = () => cart.map(item => ({ ...item, product: product(item.id), price: product(item.id).sizes.find(s => s.ml === item.ml).price }));
  window.Shop = {
    product, items,
    count: () => cart.reduce((n, item) => n + item.quantity, 0),
    total: () => items().reduce((n, item) => n + item.price * item.quantity, 0),
    warning: () => storageWarning,
    add(id, ml, quantity = 1) {
      if (!product(id)?.sizes.some(s => s.ml === ml)) return;
      const item = cart.find(x => x.id === id && x.ml === ml);
      if (item) item.quantity = Math.min(99, item.quantity + quantity);
      else cart.push({ id, ml, quantity: Math.min(99, quantity) });
      persistCart();
    },
    change(id, ml, amount) {
      const item = cart.find(x => x.id === id && x.ml === ml);
      if (!item) return;
      item.quantity = Math.max(1, Math.min(99, item.quantity + amount));
      persistCart();
    },
    remove(id, ml) { cart = cart.filter(x => x.id !== id || x.ml !== ml); persistCart(); },
    orders: () => orders,
    clearOrders() { if (!write(ORDERS_KEY, [])) return false; orders = []; return true; },
    checkout(recipient) {
      if (!cart.length) return null;
      const order = {
        id: "VP-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 5).toUpperCase(),
        date: new Date().toISOString(),
        recipient,
        items: items().map(i => ({ id: i.id, name: i.product.name, ml: i.ml, price: i.price, quantity: i.quantity })),
        total: this.total()
      };
      // Chỉ xóa giỏ sau khi lưu đơn thành công.
      if (!write(ORDERS_KEY, [order, ...orders].slice(0, 30))) return null;
      orders = [order, ...orders].slice(0, 30);
      cart = [];
      persistCart();
      return order;
    }
  };
})();
