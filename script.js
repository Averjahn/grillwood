const STORAGE_KEY = "grillwood_cart";
let cart = loadCart();

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

const $ = (sel) => document.querySelector(sel);
const money = (n) => n.toLocaleString("ru-RU");
const getItem = (id) => MENU.find((p) => p.id === id);

let activeFilter = "Все";

function categories() {
  const present = new Set(MENU.map((p) => p.cat));
  return CATEGORIES.filter((c) => c === "Все" || present.has(c));
}

function renderFilters() {
  const box = $("#filters");
  box.innerHTML = "";
  categories().forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter" + (cat === activeFilter ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => { activeFilter = cat; renderFilters(); renderMenu(); };
    box.appendChild(btn);
  });
}

function renderMenu() {
  const grid = $("#grid");
  grid.innerHTML = "";
  const list = activeFilter === "Все" ? MENU : MENU.filter((p) => p.cat === activeFilter);

  list.forEach((p) => {
    const inCart = cart[p.id] || 0;
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__media">
        <img class="card__img" src="${p.img}" alt="${p.name}" loading="lazy"
             onerror="this.style.display='none'">
        <span class="card__price">${money(p.price)} ₽</span>
      </div>
      <div class="card__body">
        <span class="tag">${p.cat}</span>
        <h3 class="card__name">${p.name}</h3>
        <p class="card__desc">${p.desc}</p>
        ${inCart > 0
          ? `<div class="card__counter">
               <button class="qty-btn" data-id="${p.id}" data-d="-1">−</button>
               <span class="qty-val">${inCart}</span>
               <button class="qty-btn" data-id="${p.id}" data-d="1">+</button>
             </div>`
          : `<button class="card__add" data-id="${p.id}">Добавить</button>`
        }
      </div>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".card__add").forEach((btn) => {
    btn.onclick = () => { addToCart(Number(btn.dataset.id)); renderMenu(); };
  });
  grid.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.onclick = () => { changeQty(Number(btn.dataset.id), Number(btn.dataset.d)); renderMenu(); };
  });
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
}
function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}
function removeItem(id) { delete cart[id]; saveCart(); updateCartUI(); }

function cartEntries() {
  return Object.keys(cart).map((id) => ({ item: getItem(Number(id)), qty: cart[id] })).filter(e => e.item);
}
function cartTotal() { return cartEntries().reduce((s, e) => s + e.item.price * e.qty, 0); }
function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }

function updateCartUI() {
  const count = cartCount();
  $("#cartCount").textContent = count;
  $("#cartCount").hidden = count === 0;
  $("#cartTotal").textContent = money(cartTotal());

  const box = $("#cartItems");
  const entries = cartEntries();
  if (entries.length === 0) {
    box.innerHTML = `<p class="cart-empty">Корзина пуста 🔥<br>Добавьте что-нибудь из меню!</p>`;
    $("#checkoutBtn").disabled = true;
    return;
  }
  $("#checkoutBtn").disabled = false;
  box.innerHTML = "";
  entries.forEach(({ item, qty }) => {
    const row = document.createElement("div");
    row.className = "ci";
    row.innerHTML = `
      <img class="ci__img" src="${item.img}" alt="${item.name}"
           onerror="this.style.display='none'">
      <div class="ci__info">
        <div class="ci__name">${item.name}</div>
        <div class="ci__price">${money(item.price)} ₽</div>
        <div class="ci__controls">
          <button class="qty-btn" data-id="${item.id}" data-d="-1">−</button>
          <span class="ci__qty">${qty}</span>
          <button class="qty-btn" data-id="${item.id}" data-d="1">+</button>
          <button class="ci__remove" data-id="${item.id}">✕</button>
        </div>
      </div>`;
    box.appendChild(row);
  });

  box.querySelectorAll(".qty-btn").forEach((b) => {
    b.onclick = () => { changeQty(Number(b.dataset.id), Number(b.dataset.d)); updateCartUI(); };
  });
  box.querySelectorAll(".ci__remove").forEach((b) => {
    b.onclick = () => { removeItem(Number(b.dataset.id)); updateCartUI(); };
  });
}

function openCart() { $("#cart").classList.add("open"); $("#overlay").classList.add("open"); }
function closeCart() { $("#cart").classList.remove("open"); $("#overlay").classList.remove("open"); }
function openOrder() {
  $("#orderTotal").textContent = money(cartTotal());
  $("#orderForm").hidden = false;
  $("#orderSuccess").hidden = true;
  $("#orderModal").classList.add("open");
}
function closeOrder() { $("#orderModal").classList.remove("open"); }

document.addEventListener("DOMContentLoaded", () => {
  renderFilters();
  renderMenu();
  updateCartUI();

  $("#cartBtn").onclick = openCart;
  $("#cartClose").onclick = closeCart;
  $("#overlay").onclick = closeCart;

  $("#checkoutBtn").onclick = () => { if (cartCount() > 0) { closeCart(); openOrder(); } };
  $("#orderClose").onclick = closeOrder;

  $("#orderForm").onsubmit = (e) => {
    e.preventDefault();
    cart = {};
    saveCart();
    updateCartUI();
    renderMenu();
    $("#orderForm").hidden = true;
    $("#orderSuccess").hidden = false;
    e.target.reset();
  };
  $("#successClose").onclick = closeOrder;
});
