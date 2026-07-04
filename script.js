// --- Core DOM & State Setup ---
const el = id => document.getElementById(id);
const qAll = selector => document.querySelectorAll(selector);

const views = {
  login: el("loginPage"),
  register: el("registerPage"),
  app: el("appWrapper"),
  dashboard: el("dashboardSection"),
  settings: el("settingsSection")
};

let currentFilter = "all";
let selectedType = "income";
let cashFlowChart = null;

const currencySymbols = { USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥" };

// --- Storage Infrastructure ---
const getStorage = key => JSON.parse(localStorage.getItem(key));
const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const auth = {
  getUser: () => localStorage.getItem("ft_currentUser"),
  setUser: username => localStorage.setItem("ft_currentUser", username),
  clearUser: () => localStorage.removeItem("ft_currentUser"),
  getAllUsers: () => getStorage("ft_users") || []
};

const userData = {
  getTxs: () => getStorage(`ft_transactions_${auth.getUser()}`) || [],
  saveTxs: txs => setStorage(`ft_transactions_${auth.getUser()}`, txs),
  getSettings: () => getStorage(`ft_settings_${auth.getUser()}`) || { displayName: auth.getUser(), currency: "USD", darkMode: false },
  saveSettings: settings => setStorage(`ft_settings_${auth.getUser()}`, settings)
};

// --- View Router ---
function showPage(pageName) {
  views.dashboard.classList.toggle("hidden", pageName !== "dashboard");
  views.settings.classList.toggle("hidden", pageName !== "settings");
  el("navDashboard").classList.toggle("active", pageName === "dashboard");
  el("navSettings").classList.toggle("active", pageName === "settings");
  
  if (pageName === "settings") loadSettingsIntoForm();
}

// --- App Control Engine ---
function refreshDashboard() {
  const txs = userData.getTxs();
  const settings = userData.getSettings();
  const symbol = currencySymbols[settings.currency] || "$";

  // Calculate stats in a single pass
  const totals = txs.reduce((acc, item) => {
    acc[item.type] += item.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;

  // Render metric UI cards
  el("balanceValue").textContent = `${balance < 0 ? '-' : ''}${symbol}${Math.abs(balance).toFixed(2)}`;
  el("incomeValue").textContent = `${symbol}${totals.income.toFixed(2)}`;
  el("expenseValue").textContent = `${symbol}${totals.expense.toFixed(2)}`;
  el("countValue").textContent = txs.length;

  renderTable(txs, settings.currency);
  renderChart(txs);
}

function startApp() {
  const settings = userData.getSettings();
  document.body.classList.toggle("dark", !!settings.darkMode);
  el("welcomeName").textContent = settings.displayName;

  views.login.classList.add("hidden");
  views.register.classList.add("hidden");
  views.app.classList.remove("hidden");

  showPage("dashboard");
  refreshDashboard();
}

// --- Authentication Controllers ---
el("registerForm").addEventListener("submit", e => {
  e.preventDefault();
  const errEl = el("registerError");
  errEl.textContent = "";

  const name = el("registerName").value.trim();
  const username = el("registerUsername").value.trim();
  const password = el("registerPassword").value;

  if (!name || !username || !password) return errEl.textContent = "All fields are required.";

  const users = auth.getAllUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return errEl.textContent = "Username already taken.";
  }

  users.push({ name, username, password });
  setStorage("ft_users", users);
  auth.setUser(username);
  
  userData.saveSettings({ displayName: name, currency: "USD", darkMode: false });
  el("registerForm").reset();
  startApp();
});

el("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  el("loginError").textContent = "";

  const username = el("loginUsername").value.trim().toLowerCase();
  const password = el("loginPassword").value;
  const user = auth.getAllUsers().find(u => u.username.toLowerCase() === username && u.password === password);

  if (!user) return el("loginError").textContent = "Invalid credentials.";

  auth.setUser(user.username);
  el("loginForm").reset();
  startApp();
});

el("logoutBtn").addEventListener("click", () => {
  auth.clearUser();
  views.app.classList.add("hidden");
  views.login.classList.remove("hidden");
});

// --- Transaction Ledger Operations ---
el("addTransactionForm").addEventListener("submit", e => {
  e.preventDefault();
  const errEl = el("transFormError");
  errEl.textContent = "";

  const description = el("transDescription").value.trim();
  const amount = parseFloat(el("transAmount").value);
  const date = el("transDate").value;
  const category = el("transCategory").value;

  if (!description || isNaN(amount) || amount <= 0 || !date) {
    return errEl.textContent = "Please provide valid transaction details.";
  }

  const txs = userData.getTxs();
  txs.push({ id: self.crypto.randomUUID ? self.crypto.randomUUID() : Date.now(), type: selectedType, description, amount, date, category });
  
  userData.saveTxs(txs);
  el("addTransactionForm").reset();
  closeAddModal();
  refreshDashboard();
});

function renderTable(txs, currencyCode) {
  const tbody = el("transactionTableBody");
  tbody.innerHTML = "";

  const filtered = txs
    .filter(t => currentFilter === "all" || t.type === currentFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  el("emptyTableMessage").classList.toggle("hidden", filtered.length > 0);

  const symbol = currencySymbols[currencyCode] || "$";

  filtered.forEach(item => {
    const row = document.createElement("tr");
    const isIncome = item.type === "income";
    
    // Format ISO Date (YYYY-MM-DD) to Display Date (DD MMM YYYY)
    const d = new Date(item.date);
    const formattedDate = !isNaN(d) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : item.date;

    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${item.description}</td>
      <td>${item.category}</td>
      <td class="${isIncome ? 'amount-income' : 'amount-expense'}">${isIncome ? '+' : '-'}${symbol}${item.amount.toFixed(2)}</td>
      <td><button class="delete-btn" data-id="${item.id}">Delete</button></td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const remaining = userData.getTxs().filter(t => String(t.id) !== String(btn.dataset.id));
      userData.saveTxs(remaining);
      refreshDashboard();
    });
  });
}

// --- Dynamic Modal Controls ---
function openAddModal() {
  el("addModalOverlay").classList.remove("hidden");
  el("transDate").value = new Date().toISOString().split("T")[0];
}

function closeAddModal() {
  el("addModalOverlay").classList.add("hidden");
  el("transFormError").textContent = "";
}

function setSelectedType(type) {
  selectedType = type;
  el("typeIncomeBtn").classList.toggle("active", type === "income");
  el("typeExpenseBtn").classList.toggle("active", type === "expense");
}

// --- Client Settings Layer ---
function loadSettingsIntoForm() {
  const settings = userData.getSettings();
  el("settingsName").value = settings.displayName;
  el("settingsCurrency").value = settings.currency;
  el("darkModeToggle").checked = !!settings.darkMode;
}

el("saveProfileBtn").addEventListener("click", () => {
  const settings = userData.getSettings();
  settings.displayName = el("settingsName").value.trim() || settings.displayName;
  settings.currency = el("settingsCurrency").value;
  userData.saveSettings(settings);

  el("welcomeName").textContent = settings.displayName;
  el("profileSavedMsg").classList.remove("hidden");
  setTimeout(() => el("profileSavedMsg").classList.add("hidden"), 2000);
  refreshDashboard();
});

el("darkModeToggle").addEventListener("change", e => {
  const settings = userData.getSettings();
  settings.darkMode = e.target.checked;
  userData.saveSettings(settings);
  document.body.classList.toggle("dark", settings.darkMode);
});

el("resetDataBtn").addEventListener("click", () => {
  if (confirm("Are you sure? This completely wipes out your transaction history.")) {
    userData.saveTxs([]);
    refreshDashboard();
  }
});

// --- Analytical Charts Framework ---
function renderChart(txs) {
  const ctx = el("cashFlowChart");
  if (!ctx) return;

  const aggregated = txs.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 };
    acc[t.date][t.type] += t.amount;
    return acc;
  }, {});

  const sortedDates = Object.keys(aggregated).sort();
  
  const labels = sortedDates.map(dateStr => {
    const d = new Date(dateStr);
    return !isNaN(d) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : dateStr;
  });

  if (cashFlowChart) cashFlowChart.destroy();

  cashFlowChart = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Income", data: sortedDates.map(d => aggregated[d].income), backgroundColor: "#16a34a" },
        { label: "Expense", data: sortedDates.map(d => aggregated[d].expense), backgroundColor: "#dc2626" }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// --- Declarative Event Listeners Matrix ---
el("showRegisterLink").addEventListener("click", e => { e.preventDefault(); views.login.classList.add("hidden"); views.register.classList.remove("hidden"); });
el("showLoginLink").addEventListener("click", e => { e.preventDefault(); views.register.classList.add("hidden"); views.login.classList.remove("hidden"); });
el("navDashboard").addEventListener("click", e => { e.preventDefault(); showPage("dashboard"); });
el("navSettings").addEventListener("click", e => { e.preventDefault(); showPage("settings"); });
el("openAddModalBtn").addEventListener("click", openAddModal);
el("closeModalBtn").addEventListener("click", closeAddModal);
el("typeIncomeBtn").addEventListener("click", () => setSelectedType("income"));
el("typeExpenseBtn").addEventListener("click", () => setSelectedType("expense"));

el("addModalOverlay").addEventListener("click", e => { if (e.target === el("addModalOverlay")) closeAddModal(); });

qAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    qAll(".filter-btn").forEach(b => b.classList.toggle("active", b === btn));
    currentFilter = btn.getAttribute("data-filter");
    renderTable(userData.getTxs(), userData.getSettings().currency);
  });
});

// --- Boot Initializer ---
(() => {
  if (auth.getUser()) {
    startApp();
  } else {
    views.login.classList.remove("hidden");
    views.app.classList.add("hidden");
  }
})();
