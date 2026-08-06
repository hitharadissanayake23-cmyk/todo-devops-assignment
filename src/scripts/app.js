const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("task-count");
const emptyMessage = document.getElementById("empty-message");
const filterButtons = document.querySelectorAll(".filter");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {

    todoList.innerHTML = "";

    let filteredTodos = todos;

    if (currentFilter === "active") {
        filteredTodos = todos.filter(todo => !todo.completed);
    }

    if (currentFilter === "completed") {
        filteredTodos = todos.filter(todo => todo.completed);
    }

    filteredTodos.forEach(todo => {

        const li = document.createElement("li");
        li.className = "todo-item";

        if (todo.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;

        checkbox.addEventListener("change", () => {
            todo.completed = checkbox.checked;
            saveTodos();
            renderTodos();
        });

        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = todo.text;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            todos = todos.filter(item => item.id !== todo.id);
            saveTodos();
            renderTodos();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteButton);

        todoList.appendChild(li);
    });

    const activeCount = todos.filter(todo => !todo.completed).length;

    taskCount.textContent =
        `${activeCount} ${activeCount === 1 ? "task" : "tasks"} remaining`;

    emptyMessage.style.display =
        filteredTodos.length === 0 ? "block" : "none";
}

todoForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const text = todoInput.value.trim();

    if (text === "") {
        alert("Please enter a task.");
        return;
    }

    todos.push({
        id: Date.now(),
        text: text,
        completed: false
    });

    saveTodos();

    todoInput.value = "";

    renderTodos();
});

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        renderTodos();
    });
});

renderTodos();

// ===== DARK / LIGHT MODE TOGGLE =====
const themeToggleBtn = document.getElementById("themeToggle");

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggleBtn.textContent = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeToggleBtn.textContent = "🌙 Dark Mode";
    }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-mode");
    const newTheme = isDark ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
});
