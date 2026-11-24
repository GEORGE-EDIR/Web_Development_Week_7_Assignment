
const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const filter = document.getElementById("filter");

let transactions = JSON.parse(
    localStorage.getItem("spendwiseTransactions") || "[]"
);

let expenseChart = null;

const formatMoney = amount =>
    new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES"
    }).format(amount);

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-KE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

document.getElementById("transaction-date").value =
    new Date().toISOString().split("T")[0];

function saveTransactions() {
    localStorage.setItem(
        "spendwiseTransactions",
        JSON.stringify(transactions)
    );
}

function updateDashboard() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    document.getElementById("balance").textContent =
        formatMoney(balance);

    document.getElementById("income").textContent =
        formatMoney(income);

    document.getElementById("expense").textContent =
        formatMoney(expense);

    updateChart(income, expense);
}

function displayTransactions() {
    transactionList.innerHTML = "";

    const selectedFilter = filter.value;

    const filtered = transactions.filter(t =>
        selectedFilter === "all" || t.type === selectedFilter
    );

    if (filtered.length === 0) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }

    filtered
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(t => {
            const row = document.createElement("tr");

            const description = document.createElement("td");
            description.textContent = t.description;

            const category = document.createElement("td");
            category.textContent = t.category;

            const date = document.createElement("td");
            date.textContent = t.date;

            const type = document.createElement("td");
            type.textContent = t.type;
            type.className = t.type === "income"
                ? "income-text"
                : "expense-text";

            const amount = document.createElement("td");
            amount.textContent =
                (t.type === "income" ? "+ " : "- ") +
                formatMoney(t.amount);
            amount.className = type.className;

            const action = document.createElement("td");
            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";
            deleteButton.setAttribute(
                "aria-label",
                `Delete transaction ${t.description}`
            );

            deleteButton.addEventListener("click", () => {
                if (confirm("Delete this transaction?")) {
                    transactions = transactions.filter(
                        item => item.id !== t.id
                    );

                    saveTransactions();
                    renderApp();
                }
            });

            action.appendChild(deleteButton);

            row.append(
                description,
                category,
                date,
                type,
                amount,
                action
            );

            transactionList.appendChild(row);
        });
}

function updateChart(income, expense) {
    const canvas = document.getElementById("expenseChart");
    const emptyMessage = document.getElementById("chart-empty");

    if (income === 0 && expense === 0) {
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }

        emptyMessage.style.display = "block";
        canvas.style.display = "none";
        return;
    }

    emptyMessage.style.display = "none";
    canvas.style.display = "block";

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Income", "Expenses"],
            datasets: [{
                data: [income, expense],
                backgroundColor: ["#159b75", "#dc5a65"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

function renderApp() {
    updateDashboard();
    displayTransactions();
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description =
        document.getElementById("description").value.trim();

    const amount = Number(
        document.getElementById("amount").value
    );

    const type = document.getElementById("type").value;

    const category =
        document.getElementById("category").value;

    const date =
        document.getElementById("transaction-date").value;

    if (!description || !Number.isFinite(amount) ||
        amount <= 0 || !date) {
        alert("Please enter valid transaction details.");
        return;
    }

    const transaction = {
        id: crypto.randomUUID(),
        description,
        amount,
        type,
        category,
        date
    };

    transactions.push(transaction);

    saveTransactions();
    form.reset();

    document.getElementById("transaction-date").value =
        new Date().toISOString().split("T")[0];

    renderApp();
});

filter.addEventListener("change", displayTransactions);

renderApp();
