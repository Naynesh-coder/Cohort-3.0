# FinTrack Pro - Personal Finance Tracker

FinTrack Pro is a clean, lightweight, client-side personal finance application designed to help users log income and expenses, monitor statistics, and visualize cash flow trends seamlessly without external server dependencies.

---

## 🚀 Features

* **User Authentication:** Multi-user framework running completely locally with login and signup panels.
* **Dynamic Ledger Management:** Log transactions with categorization, custom notes, date tracking, and transaction types (Income/Expense).
* **Aggregated Analytical Dashboard:** Real-time metrics calculations tracking Current Balance, Total Income, Total Expenses, and global transaction count.
* **Interactive Charting:** Dynamic bar graphs tracking chronological cash flow powered by **Chart.js**.
* **Advanced Ledger Filtering:** Sieve through historical context easily using instant filters (`All Types`, `Income Only`, `Expense Only`).
* **Preferences Layer:** Fully persistent configuration manager including display name customization, multiple currency symbol settings (`$`, `€`, `£`, `₹`, `¥`), and a sleek dark mode toggle.
* **Data Privacy:** Native data residency utilizing browser-level storage environments. Complete "Reset All Data" override configuration built directly into the settings dashboard.

---

## 🛠️ Architecture & Tech Stack

This codebase is crafted entirely with pure vanilla web primitives designed for extreme portability and near-instant load times:

* **Frontend Structure:** HTML5 (semantic layout)
* **Styling Sheet:** CSS3 using dynamic variables (custom properties) to accommodate structural themes and fully fluid grids for mobile/desktop responsiveness.
* **Control Layer:** Vanilla ECMAScript 6+ handling application states, data pipelines, DOM mapping, and storage routers.
* **External Integrations:** [Chart.js (v4.4.0)](https://www.chartjs.org/) served via CDN for data visualization pipelines.

---

## 📦 File Layout

```text
├── index.html   # Main application structure, modals, and core views
├── style.css    # Typography, theming design systems, utility rules, and responsive media queries
└── script.js    # Local authentication layer, transactional engine, state management, and Chart interfaces
