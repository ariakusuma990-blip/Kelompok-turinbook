
"use strict";

/* =================================
   TURIN BOOK - JAVASCRIPT
================================= */

const USER_KEY = "turin_users";
const BOOK_KEY = "turin_books";
const SESSION_KEY = "turin_session";

const $ = id => document.getElementById(id);

let cart = [];

/* DATA BUKU AWAL */

const defaultBooks = [
  {
    id: 1,
    title: "Manajemen Bisnis",
    author: "Ardi Pratama",
    category: "Bisnis",
    price: 85000,
    stock: 10
  },
  {
    id: 2,
    title: "Marketing Digital",
    author: "Nadia Putri",
    category: "Pemasaran",
    price: 95000,
    stock: 8
  },
  {
    id: 3,
    title: "Kewirausahaan",
    author: "Bima Saputra",
    category: "Kewirausahaan",
    price: 78000,
    stock: 12
  },
  {
    id: 4,
    title: "Strategi Penjualan",
    author: "Raka Wijaya",
    category: "Penjualan",
    price: 72000,
    stock: 7
  },
  {
    id: 5,
    title: "Membangun Usaha",
    author: "Dina Anggraini",
    category: "Kewirausahaan",
    price: 90000,
    stock: 9
  },
  {
    id: 6,
    title: "Dasar Pemasaran",
    author: "Fajar Ramadhan",
    category: "Pemasaran",
    price: 68000,
    stock: 15
  }
];

/* PENYIMPANAN DATA */

function getData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Gagal membaca data:", error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    notify("Data tidak berhasil disimpan.");
    return false;
  }
}

function getUsers() {
  let users = getData(USER_KEY, null);

  if (!Array.isArray(users)) {
    users = [
      {
        name: "Admin Turin Book",
        email: "admin@turinbook.id",
        password: "admin123",
        role: "admin"
      },
      {
        name: "Konsumen Demo",
        email: "konsumen@turinbook.id",
        password: "buku123",
        role: "konsumen"
      }
    ];

    saveData(USER_KEY, users);
  }

  return users;
}

function getBooks() {
  let books = getData(BOOK_KEY, null);

  if (!Array.isArray(books)) {
    books = defaultBooks.map(book => ({ ...book }));
    saveData(BOOK_KEY, books);
  }

  return books;
}

/* FUNGSI UMUM */

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function notify(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/* MENAMPILKAN KATALOG */

function displayBooks() {
  const list = $("bookList");
  const search = $("searchInput").value.toLowerCase().trim();
  const category = $("categoryFilter").value;

  const books = getBooks().filter(book => {
    const text = (
      book.title + " " +
      book.author + " " +
      book.category
    ).toLowerCase();

    const matchSearch = text.includes(search);
    const matchCategory =
      category === "Semua" || book.category === category;

    return matchSearch && matchCategory;
  });

  if (books.length === 0) {
    list.innerHTML = "<p>Buku tidak ditemukan.</p>";
    return;
  }

  list.innerHTML = books.map(book => `
    <article class="book-card">
      <div class="book-cover">
        <span>TURIN BOOK</span>
        <strong>${safeText(book.title)}</strong>
        <small>${safeText(book.category)}</small>
      </div>

      <h3>${safeText(book.title)}</h3>
      <p>${safeText(book.author)}</p>
      <p class="book-price">${rupiah(book.price)}</p>
      <p>Stok: ${Number(book.stock) || 0}</p>

      <div class="book-actions">
        <button class="detail-button"
          data-detail="${book.id}">Detail</button>
        <button data-cart="${book.id}">Keranjang</button>
      </div>
    </article>
  `).join("");
}

/* DETAIL BUKU */

function showDetail(id) {
  const book = getBooks().find(item => item.id === Number(id));

  if (!book) return;

  $("detailContent").innerHTML = `
    <h2>${safeText(book.title)}</h2>
    <p>Penulis: ${safeText(book.author)}</p>
    <p>Kategori: ${safeText(book.category)}</p>
    <h3>${rupiah(book.price)}</h3>
    <p>Stok tersedia: ${Number(book.stock) || 0}</p>
    <button class="btn-primary full" id="detailBuy">
      Tambahkan ke Keranjang
    </button>
  `;

  $("detailModal").classList.remove("hidden");

  $("detailBuy").addEventListener("click", () => {
    addToCart(id);
    $("detailModal").classList.add("hidden");
  });
}

/* KERANJANG DEMO */

function addToCart(id) {
  const session = getData(SESSION_KEY, null);

  if (!session) {
    notify("Silakan login terlebih dahulu.");
    $("loginEmail").focus();
    return;
  }

  if (session.role !== "konsumen") {
    notify("Keranjang hanya tersedia untuk konsumen.");
    return;
  }

  const book = getBooks().find(item => item.id === Number(id));

  if (!book || book.stock <= 0) {
    notify("Stok buku tidak tersedia.");
    return;
  }

  cart.push(book.id);

  notify("Buku berhasil ditambahkan ke keranjang. Total item: " + cart.length);
}

/* LOGIN */

function loginUser(event) {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const users = getUsers();

  const user = users.find(item =>
    item.email.toLowerCase() === email &&
    item.password === password
  );

  if (!user) {
    $("loginMessage").textContent =
      "Email atau kata sandi salah.";
    return;
  }

  const session = {
    name: user.name,
    email: user.email,
    role: user.role
  };

  if (!saveData(SESSION_KEY, session)) return;

  $("loginForm").reset();
  $("loginMessage").textContent = "";

  updateAccount(session);
  notify("Selamat datang, " + user.name);
}

/* PENDAFTARAN AKUN */

function registerUser(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;

  const users = getUsers();

  if (name.length < 2) {
    $("registerMessage").textContent =
      "Nama minimal 2 karakter.";
    return;
  }

  if (password.length < 6) {
    $("registerMessage").textContent =
      "Kata sandi minimal 6 karakter.";
    return;
  }

  const exists = users.some(user =>
    user.email.toLowerCase() === email
  );

  if (exists) {
    $("registerMessage").textContent =
      "Email sudah digunakan.";
    return;
  }

  const newUser = {
    name: name,
    email: email,
    password: password,
    role: "konsumen"
  };

  users.push(newUser);

  if (!saveData(USER_KEY, users)) return;

  $("registerForm").reset();
  $("registerModal").classList.add("hidden");
  $("registerMessage").textContent = "";

  notify("Akun berhasil dibuat. Silakan login.");
  $("loginEmail").value = email;
  $("loginPassword").value = "";
  $("loginEmail").focus();
}

/* STATUS AKUN */

function updateAccount(user) {
  if (user) {
    $("openLogin").classList.add("hidden");
    $("openRegister").classList.add("hidden");
    $("logoutBtn").classList.remove("hidden");

    $("accountHeading").textContent = user.name;
    $("accountDescription").textContent =
      user.role === "admin"
        ? "Kamu masuk sebagai administrator."
        : "Kamu masuk sebagai konsumen.";

    $("loginForm").classList.add("hidden");
    $("adminPanel").classList.toggle(
      "hidden",
      user.role !== "admin"
    );

    if (user.role === "admin") {
      displayAdminBooks();
    }
  } else {
    $("openLogin").classList.remove("hidden");
    $("openRegister").classList.remove("hidden");
    $("logoutBtn").classList.add("hidden");

    $("accountHeading").textContent = "Masuk ke Turin Book";
    $("accountDescription").textContent =
      "Masuk untuk menikmati layanan Turin Book.";

    $("loginForm").classList.remove("hidden");
    $("adminPanel").classList.add("hidden");
  }
}

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  cart = [];
  updateAccount(null);
  notify("Kamu sudah keluar dari akun.");
}

/* ADMIN: MENAMPILKAN BUKU */

function displayAdminBooks() {
  const list = $("adminBookList");

  list.innerHTML = getBooks().map(book => `
    <div class="admin-row">
      <div>
        <strong>${safeText(book.title)}</strong>
        <br>
        <small>${safeText(book.category)} · ${rupiah(book.price)}</small>
      </div>

      <div>
        <button type="button" data-edit="${book.id}">Edit</button>
        <button type="button" data-delete="${book.id}">Hapus</button>
      </div>
    </div>
  `).join("");
}

/* ADMIN: TAMBAH DAN EDIT BUKU */

function saveBook(event) {
  event.preventDefault();

  const session = getData(SESSION_KEY, null);

  if (!session || session.role !== "admin") {
    notify("Akses admin diperlukan.");
    return;
  }

  let books = getBooks();
  const id = Number($("bookId").value);

  const book = {
    id: id || Date.now(),
    title: $("bookTitle").value.trim(),
    author: $("bookAuthor").value.trim(),
    category: $("bookCategory").value,
    price: Number($("bookPrice").value),
    stock: Number($("bookStock").value)
  };

  if (id) {
    books = books.map(item =>
      item.id === id ? book : item
    );
  } else {
    books.unshift(book);
  }

  if (!saveData(BOOK_KEY, books)) return;

  $("bookForm").reset();
  $("bookId").value = "";

  displayBooks();
  displayAdminBooks();

  notify("Data buku berhasil disimpan.");
}

/* ADMIN: EDIT DAN HAPUS */

function adminBookAction(event) {
  const editId = Number(event.target.dataset.edit);
  const deleteId = Number(event.target.dataset.delete);

  let books = getBooks();

  if (editId) {
    const book = books.find(item => item.id === editId);
    if (!book) return;

    $("bookId").value = book.id;
    $("bookTitle").value = book.title;
    $("bookAuthor").value = book.author;
    $("bookCategory").value = book.category;
    $("bookPrice").value = book.price;
    $("bookStock").value = book.stock;

    $("bookTitle").focus();
  }

  if (deleteId) {
    if (!confirm("Yakin ingin menghapus buku ini?")) return;

    books = books.filter(item => item.id !== deleteId);

    if (!saveData(BOOK_KEY, books)) return;

    displayBooks();
    displayAdminBooks();

    notify("Buku berhasil dihapus.");
  }
}

/* HUBUNGKAN SEMUA TOMBOL */

function init() {
  getUsers();
  getBooks();

  $("openLogin").addEventListener("click", () => {
    $("loginCard").scrollIntoView({ behavior: "smooth" });
    $("loginEmail").focus();
  });

  $("openRegister").addEventListener("click", () => {
    $("registerModal").classList.remove("hidden");
  });

  $("registerFromCard").addEventListener("click", () => {
    $("registerModal").classList.remove("hidden");
  });

  $("closeRegister").addEventListener("click", () => {
    $("registerModal").classList.add("hidden");
  });

  $("closeDetail").addEventListener("click", () => {
    $("detailModal").classList.add("hidden");
  });

  $("loginForm").addEventListener("submit", loginUser);
  $("registerForm").addEventListener("submit", registerUser);

  $("logoutBtn").addEventListener("click", logoutUser);

  $("searchInput").addEventListener("input", displayBooks);
  $("searchBtn").addEventListener("click", displayBooks);
  $("categoryFilter").addEventListener("change", displayBooks);

  $("bookList").addEventListener("click", event => {
    const detailId = event.target.dataset.detail;
    const cartId = event.target.dataset.cart;

    if (detailId) showDetail(detailId);
    if (cartId) addToCart(cartId);
  });

  $("bookForm").addEventListener("submit", saveBook);

  $("adminBookList").addEventListener("click", adminBookAction);

  $("cancelEdit").addEventListener("click", () => {
    $("bookForm").reset();
    $("bookId").value = "";
  });

  displayBooks();

  const session = getData(SESSION_KEY, null);

  if (session) {
    const user = getUsers().find(item =>
      item.email === session.email &&
      item.role === session.role
    );

    if (user) {
      updateAccount(session);
    } else {
      localStorage.removeItem(SESSION_KEY);
      updateAccount(null);
    }
  } else {
    updateAccount(null);
  }
}

document.addEventListener("DOMContentLoaded", init);
