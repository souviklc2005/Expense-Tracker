const API_URL = "";
let token = localStorage.getItem('access_token');
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        loadDashboard();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
    }
    const dateInput = document.getElementById('ex-date');
    if(dateInput) dateInput.valueAsDate = new Date();
});

let authMode = 'login';
function showAuth(mode) {
    authMode = mode;
    document.getElementById('tab-login').className = mode === 'login' ? 'active' : '';
    document.getElementById('tab-register').className = mode === 'register' ? 'active' : '';
    document.getElementById('auth-btn').innerText = mode === 'login' ? 'Login' : 'Register';
    document.getElementById('auth-msg').innerText = '';
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const msg = document.getElementById('auth-msg');
    
    msg.innerText = "Processing...";
    msg.style.color = "#666";

    try {
        if (authMode === 'register') {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            alert("Registration successful! Please login.");
            showAuth('login');
            msg.innerText = "";
            
        } else {
            const formData = new URLSearchParams();
            formData.append('username', user);
            formData.append('password', pass);

            const res = await fetch(`${API_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await res.json();
            token = data.access_token;
            localStorage.setItem('access_token', token);
            loadDashboard();
        }
    } catch (err) {
        console.error("Auth Error:", err);
        msg.innerText = err.message;
        msg.style.color = 'red';
    }
});

function logout() {
    localStorage.removeItem('access_token');
    location.reload();
}

async function loadDashboard() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');

    try {
        await Promise.all([fetchUserData(), fetchExpenses()]);
    } catch (error) {
        console.error("Session expired or error:", error);
        logout();
    }
}

async function fetchUserData() {
    const res = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error("Failed to fetch user");

    const user = await res.json();
    document.getElementById('user-display').innerText = `Hello, ${user.username}`;
    document.getElementById('budget-limit').innerText = `₹${user.monthly_budget.toFixed(2)}`;
    window.currentBudget = user.monthly_budget;
    updateStatus();
}

async function setBudget() {
    const newLimit = prompt("Enter monthly budget limit (in ₹):", window.currentBudget);
    if (newLimit && !isNaN(newLimit)) {
        await fetch(`${API_URL}/users/me/budget`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ limit: parseFloat(newLimit) })
        });
        fetchUserData();
    }
}

const expenseForm = document.getElementById('expense-form');
if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            date: document.getElementById('ex-date').value,
            amount: parseFloat(document.getElementById('ex-amount').value),
            category: document.getElementById('ex-category').value,
            description: document.getElementById('ex-desc').value
        };

        const res = await fetch(`${API_URL}/expenses/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            document.getElementById('ex-amount').value = '';
            document.getElementById('ex-desc').value = '';
            fetchExpenses();
        }
    });
}

async function fetchExpenses() {
    const res = await fetch(`${API_URL}/expenses/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if(res.ok) {
        const expenses = await res.json();
        renderExpenses(expenses);
        renderChart(expenses);
    }
}

async function deleteExpense(id) {
    if(!confirm("Delete this expense?")) return;
    await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchExpenses();
}

function renderExpenses(data) {
    const tbody = document.getElementById('expense-list');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    let total = 0;

    data.forEach(ex => {
        total += ex.amount;
        const row = `<tr>
            <td>${new Date(ex.date).toLocaleDateString()}</td>
            <td>${ex.category}</td>
            <td>${ex.description || '-'}</td>
            <td>₹${ex.amount.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="deleteExpense(${ex.id})">X</button></td>
        </tr>`;
        tbody.innerHTML += row;
    });
    document.getElementById('total-spent').innerText = `₹${total.toFixed(2)}`;
    window.currentTotal = total;
    updateStatus();
}

function updateStatus() {
    const statusEl = document.getElementById('budget-status');
    const cardEl = document.getElementById('alert-card');
    const budget = window.currentBudget || 0;
    const total = window.currentTotal || 0;

    if (budget > 0 && total > budget) {
        statusEl.innerText = "OVER BUDGET!";
        cardEl.style.borderLeft = "5px solid var(--danger)";
        statusEl.style.color = "var(--danger)";
    } else if (budget > 0 && total > (budget * 0.8)) {
        statusEl.innerText = "Warning (Near Limit)";
        cardEl.style.borderLeft = "5px solid orange";
        statusEl.style.color = "orange";
    } else {
        statusEl.innerText = "On Track";
        cardEl.style.borderLeft = "5px solid var(--success)";
        statusEl.style.color = "var(--success)";
    }
}

function renderChart(expenses) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const totals = {};
    expenses.forEach(ex => {
        totals[ex.category] = (totals[ex.category] || 0) + ex.amount;
    });

    const labels = Object.keys(totals);
    const data = Object.values(totals);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ff9900', '#232f3e', '#37475a', '#136', '#999', '#ccc']
            }]
        },
        options: { responsive: true }
    });
}