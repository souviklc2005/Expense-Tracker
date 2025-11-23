# 💰 Expense Tracker App (FastAPI + SQLite + Vanilla JS)

> A sleek, full–stack **Expense Tracker** that helps you log, categorize, visualize, and monitor expenses — built with FastAPI, SQLite, and pure HTML/CSS/JS.  
> Designed for performance, simplicity, and complete local privacy (no external APIs).

---

## 🚀 Overview

This project is a **local-first personal finance manager** that allows users to:

- Add, edit, and delete expenses.
- Track spending by category (with visual charts).
- Set and monitor monthly budgets.
- Receive alerts when budgets exceed thresholds.
- View and analyze spending patterns through charts.
- Securely register, log in, and manage personal data via JWT authentication.

Everything runs locally — your financial data never leaves your machine.

---

## 🧠 Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Clean, responsive user interface |
| **Backend** | FastAPI (Python 3.12+) | High-performance REST API |
| **Database** | SQLite | Lightweight, local data store |
| **Security** | JWT + bcrypt | Secure authentication and password hashing |
| **Visualization** | Chart.js | Interactive category-wise expense visualization |

---

## 📸 Features Snapshot

✨ **Expense Management**
- Add, edit, and delete expenses (date, amount, category, description).
- Customize categories.

📊 **Charts & Reports**
- Interactive pie/doughnut charts of spending by category.
- Filter by daily/weekly/monthly time frames (extendable).

💰 **Budget Monitoring**
- Set a monthly spending budget.
- Visual alerts:
  - 🟢 On Track
  - 🟠 Near Limit (80%)
  - 🔴 Over Budget

🔐 **Authentication**
- Secure local registration and login (JWT authentication).
- Each user’s data is private and stored separately.
