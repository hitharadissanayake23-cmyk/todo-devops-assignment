import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where
} from 'firebase/firestore';

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';

import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBNGzyeX1OzkqccS1CrborP5TAITqnZO9A",
    authDomain: "todo-app-58c0a.firebaseapp.com",
    databaseURL: "https://todo-app-58c0a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "todo-app-58c0a",
    storageBucket: "todo-app-58c0a.firebasestorage.app",
    messagingSenderId: "62528933263",
    appId: "1:62528933263:web:c2a1a2afa654873a864ffa",
    measurementId: "G-06MKFM83PD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const loginPage = document.getElementById('loginPage');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const loginError = document.getElementById('loginError');
const loginTitle = document.getElementById('loginTitle');
const loginSubtitle = document.getElementById('loginSubtitle');
const toggleLink = document.getElementById('toggleLink');
const toggleText = document.getElementById('toggleText');

const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const taskForm = document.getElementById('taskForm');
const addNewTaskBtn = document.getElementById('addNewTaskBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const shortcutsBtn = document.getElementById('shortcutsBtn');

const taskTagInput = document.getElementById('taskTagInput');
const tasksContainer = document.getElementById('tasksContainer');
const emptyState = document.getElementById('emptyState');
const userDisplayName = document.getElementById('userDisplayName');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const userAvatar = document.getElementById('userAvatar');
const headerUserName = document.getElementById('headerUserName');
const headerAvatar = document.getElementById('headerAvatar');

let currentUser = null;
let tasks = [];
let currentCategory = 'All';
let currentStatusFilter = 'all';
let searchQuery = '';
let isLoginMode = true;
let unsubscribeTasks = null;

const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Health', 'Urgent'];

const CATEGORY_COLORS = {
    Work: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        light: 'bg-blue-50',
        border: 'border-blue-200'
    },
    Personal: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600',
        light: 'bg-emerald-50',
        border: 'border-emerald-200'
    },
    Health: {
        bg: 'bg-purple-500',
        text: 'text-purple-600',
        light: 'bg-purple-50',
        border: 'border-purple-200'
    },
    Urgent: {
        bg: 'bg-rose-500',
        text: 'text-rose-600',
        light: 'bg-rose-50',
        border: 'border-rose-200'
    }
};

const PRIORITY_LABELS = {
    high: 'High',
    med: 'Medium',
    low: 'Low'
};

const PRIORITY_COLORS = {
    high: 'bg-rose-100 text-rose-700',
    med: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600'
};

function escapeHtml(text) {
    if (!text) return '';

    const d = document.createElement('div');
    d.innerText = text;

    return d.innerHTML;
}

function getCategoryDisplay(name) {
    return name.charAt(0) + name.slice(1).toLowerCase();
}

function getStatusFromTask(task) {
    return task.status || 'todo';
}

function isTaskCompleted(task) {
    return task.status === 'done';
}

function updateCategoryCounts() {
    document.getElementById('count-all').innerText = tasks.length;

    DEFAULT_CATEGORIES.forEach(cat => {
        const el = document.getElementById(`count-${cat.toLowerCase()}`);

        if (el) {
            el.innerText = tasks.filter(t => t.tag === cat).length;
        }
    });
}

function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;

    const pct = total === 0
        ? 0
        : Math.round((done / total) * 100);

    document.getElementById('progress-bar').style.width = `${pct}%`;
    document.getElementById('progress-percent').innerText = `${pct}%`;
    document.getElementById('progress-text').innerText =
        `${done} of ${total} tasks done`;
}

function updateUserUI(user) {
    if (!user) return;

    const name =
        user.displayName ||
        user.email?.split('@')[0] ||
        'User';

    const email = user.email || 'user@example.com';

    const photo =
        user.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120';

    userDisplayName.textContent = name;
    userEmailDisplay.textContent = email;
    userAvatar.src = photo;

    headerUserName.textContent = name;
    headerAvatar.src = photo;
}

function updateTagSelect() {
    const currentVal = taskTagInput.value;

    taskTagInput.innerHTML = '';

    DEFAULT_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');

        opt.value = cat;
        opt.textContent = getCategoryDisplay(cat);

        taskTagInput.appendChild(opt);
    });

    if (
        currentVal &&
        DEFAULT_CATEGORIES.includes(currentVal)
    ) {
        taskTagInput.value = currentVal;
    }
}

function renderTasks() {
    const container = tasksContainer;
    const empty = emptyState;

    const query = searchInput.value
        .toLowerCase()
        .trim();

    let filtered = tasks.filter(task => {
        const matchCat =
            currentCategory === 'All' ||
            task.tag === currentCategory;

        const matchSearch =
            task.title.toLowerCase().includes(query) ||
            (task.desc &&
                task.desc.toLowerCase().includes(query));

        const isDone = task.status === 'done';

        const matchStatus =
            currentStatusFilter === 'all'
                ? true
                : currentStatusFilter === 'completed'
                    ? isDone
                    : !isDone;

        return matchCat && matchSearch && matchStatus;
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
        empty.classList.remove('hidden');
        empty.classList.add('flex');
        return;
    }

    empty.classList.add('hidden');
    empty.classList.remove('flex');

    filtered.forEach(task => {
        const catStyle =
            CATEGORY_COLORS[task.tag] ||
            CATEGORY_COLORS['Work'];

        const priorityLabel =
            PRIORITY_LABELS[task.priority] ||
            'Medium';

        const priorityColor =
            PRIORITY_COLORS[task.priority] ||
            'bg-slate-100 text-slate-600';

        const isDone = task.status === 'done';

        const subtaskCount =
            task.subtasks?.length || 0;

        const subtaskDone =
            task.subtasks?.filter(s => s.done).length || 0;

        const hasSubtasks = subtaskCount > 0;

        const card = document.createElement('div');

        card.className =
            `task-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all ${
                isDone ? 'opacity-60 bg-slate-50/50' : ''
            }`;

        let subtaskHTML = '';

        if (hasSubtasks) {
            const pct =
                Math.round(
                    (subtaskDone / subtaskCount) * 100
                );

            subtaskHTML = `
                <div class="mt-2">
                    <div class="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Subtasks</span>
                        <span>${subtaskDone}/${subtaskCount}</span>
                    </div>

                    <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                            class="h-full bg-blue-500 rounded-full"
                            style="width:${pct}%"
                        ></div>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${catStyle.light} ${catStyle.text} border ${catStyle.border}">
                        ${task.tag}
                    </span>

                    <div class="flex items-center gap-2">
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${priorityColor}">
                            ${priorityLabel}
                        </span>

                        <button
                            onclick="window.deleteTask('${task.id}')"
                            class="text-slate-300 hover:text-rose-500 text-sm transition-colors p-1"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                <h4 class="font-bold text-slate-900 text-base mb-1 ${
                    isDone
                        ? 'line-through text-slate-400'
                        : ''
                }">
                    ${escapeHtml(task.title)}
                </h4>

                ${
                    task.desc
                        ? `<p class="text-xs text-slate-500 mb-3 line-clamp-2">
                            ${escapeHtml(task.desc)}
                           </p>`
                        : ''
                }

                ${subtaskHTML}
            </div>

            <div class="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <i class="fa-regular fa-calendar"></i>
                    <span>${task.dueDate || 'No due date'}</span>
                </div>

                <button
                    onclick="window.toggleTaskComplete('${task.id}')"
                    class="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                        isDone
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                    }"
                >
                    <i class="fa-solid ${
                        isDone
                            ? 'fa-circle-check'
                            : 'fa-circle'
                    }"></i>

                    <span>
                        ${isDone ? 'Completed' : 'Mark Done'}
                    </span>
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    updateCategoryCounts();
    updateProgress();
}

window.filterCategory = function(category) {
    currentCategory = category;

    document
        .querySelectorAll('.cat-nav-btn')
        .forEach(btn => {
            btn.classList.remove(
                'active',
                'bg-blue-50',
                'text-blue-600',
                'font-semibold'
            );

            btn.classList.add(
                'text-slate-600',
                'font-medium'
            );
        });

    const activeBtn =
        document.getElementById(`btn-cat-${category}`);

    if (activeBtn) {
        activeBtn.classList.add(
            'active',
            'bg-blue-50',
            'text-blue-600',
            'font-semibold'
        );

        activeBtn.classList.remove(
            'text-slate-600',
            'font-medium'
        );
    }

    document.getElementById(
        'currentCategoryTitle'
    ).innerText =
        category === 'All'
            ? 'All Tasks'
            : `${getCategoryDisplay(category)} Tasks`;

    const badge =
        document.getElementById('activeCategoryBadge');

    badge.innerText =
        category === 'All'
            ? 'Overview'
            : category;

    if (
        category !== 'All' &&
        CATEGORY_COLORS[category]
    ) {
        badge.className =
            `px-2.5 py-1 rounded-md text-xs font-bold ${
                CATEGORY_COLORS[category].light
            } ${
                CATEGORY_COLORS[category].text
            }`;
    } else {
        badge.className =
            'px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700';
    }

    renderTasks();
};

window.setStatusFilter = function(status) {
    currentStatusFilter = status;

    document
        .querySelectorAll('.filter-btn')
        .forEach(btn => {
            btn.classList.remove(
                'active',
                'bg-blue-50',
                'text-blue-600',
                'font-bold'
            );

            btn.classList.add(
                'text-slate-500',
                'font-medium'
            );
        });

    const target =
        document.getElementById(`filter-${status}`);

    if (target) {
        target.classList.add(
            'active',
            'bg-blue-50',
            'text-blue-600',
            'font-bold'
        );

        target.classList.remove(
            'text-slate-500',
            'font-medium'
        );
    }

    renderTasks();
};

window.toggleTaskComplete = async function(id) {
    const task = tasks.find(t => t.id === id);

    if (!task) return;

    const newStatus =
        task.status === 'done'
            ? 'todo'
            : 'done';

    try {
        await updateDoc(
            doc(db, 'tasks', id),
            { status: newStatus }
        );
    } catch (e) {
        console.error('Toggle error:', e);
    }
};

window.deleteTask = async function(id) {
    if (!confirm('Delete this task?')) return;

    try {
        await deleteDoc(
            doc(db, 'tasks', id)
        );
    } catch (e) {
        console.error('Delete error:', e);
    }
};

async function saveTaskToFirestore(id, data) {
    if (!currentUser) return;

    try {
        if (id) {
            await updateDoc(
                doc(db, 'tasks', id),
                data
            );
        } else {
            await addDoc(
                collection(db, 'tasks'),
                {
                    ...data,
                    userId: currentUser.uid
                }
            );
        }
    } catch (e) {
        console.error('Save error:', e);
        alert('Failed to save task.');
    }
}

window.openModal = function() {
    const modal =
        document.getElementById('taskModal');

    const card =
        document.getElementById('modalCard');

    modal.classList.remove(
        'opacity-0',
        'pointer-events-none'
    );

    card.classList.remove('scale-95');
    card.classList.add('scale-100');

    if (
        currentCategory !== 'All' &&
        DEFAULT_CATEGORIES.includes(currentCategory)
    ) {
        document.getElementById(
            'taskTagInput'
        ).value = currentCategory;
    }

    document.getElementById(
        'taskDateInput'
    ).value =
        new Date()
            .toISOString()
            .split('T')[0];

    setTimeout(
        () =>
            document
                .getElementById('taskTitleInput')
                .focus(),
        100
    );
};

window.closeModal = function(modalId) {
    const id = modalId || 'taskModal';

    const modal =
        document.getElementById(id);

    const card =
        modal.querySelector(
            '.scale-95, .scale-100'
        );

    if (card) {
        card.classList.remove('scale-100');
        card.classList.add('scale-95');
    }

    modal.classList.add(
        'opacity-0',
        'pointer-events-none'
    );

    if (id === 'taskModal') {
        document
            .getElementById('taskForm')
            .reset();

        document.getElementById(
            'taskId'
        ).value = '';

        document.getElementById(
            'taskStatus'
        ).value = 'todo';

        document.getElementById(
            'taskDateInput'
        ).value =
            new Date()
                .toISOString()
                .split('T')[0];
    }
};

window.openAddTaskModal = function(defaultStatus) {
    document.getElementById(
        'modalHeading'
    ).textContent = 'Create New Task';

    document.getElementById(
        'taskId'
    ).value = '';

    document.getElementById(
        'taskStatus'
    ).value =
        defaultStatus || 'todo';

    document.getElementById(
        'taskTitleInput'
    ).value = '';

    document.getElementById(
        'taskDescInput'
    ).value = '';

    document.getElementById(
        'taskSubtasksInput'
    ).value = '';

    document.getElementById(
        'taskDateInput'
    ).value =
        new Date()
            .toISOString()
            .split('T')[0];

    if (
        currentCategory !== 'All' &&
        DEFAULT_CATEGORIES.includes(currentCategory)
    ) {
        document.getElementById(
            'taskTagInput'
        ).value = currentCategory;
    } else {
        document.getElementById(
            'taskTagInput'
        ).value = 'Work';
    }

    document.getElementById(
        'taskPriorityInput'
    ).value = 'med';

    window.openModal();
};

window.openEditTaskModal = function(id) {
    const task =
        tasks.find(t => t.id === id);

    if (!task) return;

    document.getElementById(
        'modalHeading'
    ).textContent = 'Edit Task';

    document.getElementById(
        'taskId'
    ).value = task.id;

    document.getElementById(
        'taskStatus'
    ).value =
        task.status || 'todo';

    document.getElementById(
        'taskTitleInput'
    ).value = task.title;

    document.getElementById(
        'taskDescInput'
    ).value =
        task.desc || '';

    document.getElementById(
        'taskTagInput'
    ).value =
        task.tag || 'Work';

    document.getElementById(
        'taskPriorityInput'
    ).value =
        task.priority || 'med';

    document.getElementById(
        'taskSubtasksInput'
    ).value =
        task.subtasks
            ? task.subtasks
                .map(s => s.text)
                .join(', ')
            : '';

    document.getElementById(
        'taskDateInput'
    ).value =
        task.dueDate || '';

    window.openModal();
};

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id =
        document.getElementById(
            'taskId'
        ).value;

    const title =
        document
            .getElementById('taskTitleInput')
            .value
            .trim();

    if (!title) return;

    const desc =
        document
            .getElementById('taskDescInput')
            .value
            .trim();

    const tag =
        document.getElementById(
            'taskTagInput'
        ).value;

    const priority =
        document.getElementById(
            'taskPriorityInput'
        ).value;

    const status =
        document.getElementById(
            'taskStatus'
        ).value || 'todo';

    const dueDate =
        document.getElementById(
            'taskDateInput'
        ).value || '';

    const subtaskRaw =
        document
            .getElementById('taskSubtasksInput')
            .value
            .trim();

    const subtasks = subtaskRaw
        ? subtaskRaw
            .split(',')
            .map(s => ({
                text: s.trim(),
                done: false
            }))
        : [];

    const data = {
        title,
        desc,
        tag,
        priority,
        status,
        subtasks,
        dueDate
    };

    saveTaskToFirestore(
        id || null,
        data
    );

    window.closeModal('taskModal');
});

function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;

        if (user) {
            loginPage.classList.add('hidden');
            mainApp.classList.remove('hidden');

            mainApp.style.position = 'relative';
            mainApp.style.opacity = '1';
            mainApp.style.visibility = 'visible';

            updateUserUI(user);
            initFirestoreListener();
        } else {
            if (unsubscribeTasks) {
                unsubscribeTasks();
                unsubscribeTasks = null;
            }

            loginPage.classList.remove('hidden');
            mainApp.classList.add('hidden');

            tasks = [];

            renderTasks();

            loginError.textContent = '';

            loginSubmitBtn.disabled = false;

            loginSubmitBtn.innerHTML =
                `<i class="fa-solid fa-arrow-right-to-bracket"></i><span>Sign In</span>`;
        }
    });
}

function initFirestoreListener() {
    if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
    }

    if (!currentUser) return;

    const q = query(
        collection(db, 'tasks'),
        where(
            'userId',
            '==',
            currentUser.uid
        )
    );

    unsubscribeTasks =
        onSnapshot(
            q,
            (snapshot) => {
                tasks = [];

                snapshot.forEach((doc) => {
                    const d = doc.data();

                    tasks.push({
                        id: doc.id,
                        title: d.title || '',
                        desc: d.desc || '',
                        tag: d.tag || 'Work',
                        priority: d.priority || 'med',
                        status: d.status || 'todo',
                        subtasks: d.subtasks || [],
                        dueDate: d.dueDate || ''
                    });
                });

                renderTasks();
            },
            (err) => {
                console.error(
                    'Tasks listener error:',
                    err
                );
            }
        );
}

function setupLoginHandlers() {
    toggleLink.addEventListener(
        'click',
        () => {
            isLoginMode = !isLoginMode;

            if (isLoginMode) {
                loginTitle.textContent =
                    'Welcome back';

                loginSubtitle.textContent =
                    'Sign in to your account to continue';

                loginSubmitBtn.innerHTML =
                    `<i class="fa-solid fa-arrow-right-to-bracket"></i><span>Sign In</span>`;

                toggleText.textContent =
                    "Don't have an account?";

                toggleLink.textContent =
                    'Sign Up';
            } else {
                loginTitle.textContent =
                    'Create account';

                loginSubtitle.textContent =
                    'Start managing your tasks today';

                loginSubmitBtn.innerHTML =
                    `<i class="fa-solid fa-user-plus"></i><span>Sign Up</span>`;

                toggleText.textContent =
                    'Already have an account?';

                toggleLink.textContent =
                    'Sign In';
            }

            loginError.textContent = '';
        }
    );

    loginForm.addEventListener(
        'submit',
        async (e) => {
            e.preventDefault();

            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value.trim();

            if (!email || !password) {
                loginError.textContent =
                    'Please fill in all fields.';
                return;
            }

            loginSubmitBtn.disabled = true;

            loginSubmitBtn.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i><span>Loading...</span>`;

            loginError.textContent = '';

            try {
                if (isLoginMode) {
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                } else {
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                }
            } catch (err) {
                let msg = err.message;

                if (
                    err.code ===
                    'auth/user-not-found'
                ) {
                    msg =
                        'No account found with this email.';
                } else if (
                    err.code ===
                    'auth/wrong-password'
                ) {
                    msg =
                        'Incorrect password.';
                } else if (
                    err.code ===
                    'auth/email-already-in-use'
                ) {
                    msg =
                        'Email already in use.';
                } else if (
                    err.code ===
                    'auth/weak-password'
                ) {
                    msg =
                        'Password must be at least 6 characters.';
                } else if (
                    err.code ===
                    'auth/invalid-email'
                ) {
                    msg =
                        'Invalid email address.';
                }

                loginError.textContent = msg;

                loginSubmitBtn.disabled = false;

                loginSubmitBtn.innerHTML =
                    `<i class="fa-solid fa-arrow-right-to-bracket"></i><span>${
                        isLoginMode
                            ? 'Sign In'
                            : 'Sign Up'
                    }</span>`;
            }
        }
    );

    googleLoginBtn.addEventListener(
        'click',
        async () => {
            loginError.textContent = '';

            googleLoginBtn.disabled = true;

            googleLoginBtn.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i><span>Loading...</span>`;

            try {
                await signInWithPopup(
                    auth,
                    googleProvider
                );
            } catch (err) {
                let msg = err.message;

                if (
                    err.code ===
                    'auth/popup-closed-by-user'
                ) {
                    msg =
                        'Sign-in cancelled.';
                } else if (
                    err.code ===
                    'auth/account-exists-with-different-credential'
                ) {
                    msg =
                        'An account with this email already exists. Please sign in with your password.';
                }

                loginError.textContent = msg;

                googleLoginBtn.disabled = false;

                googleLoginBtn.innerHTML =
                    `<i class="fa-brands fa-google text-blue-500"></i><span>Continue with Google</span>`;
            }
        }
    );

    logoutBtn.addEventListener(
        'click',
        async () => {
            try {
                await signOut(auth);
            } catch (e) {
                console.error(
                    'Logout error:',
                    e
                );
            }
        }
    );
}

function setupUIHandlers() {
    const savedTheme =
        localStorage.getItem(
            'taskflow_theme'
        ) || 'light';

    document.documentElement.setAttribute(
        'data-theme',
        savedTheme
    );

    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener(
        'click',
        () => {
            const current =
                document.documentElement.getAttribute(
                    'data-theme'
                );

            const next =
                current === 'dark'
                    ? 'light'
                    : 'dark';

            document.documentElement.setAttribute(
                'data-theme',
                next
            );

            localStorage.setItem(
                'taskflow_theme',
                next
            );

            updateThemeIcon(next);
        }
    );

    function updateThemeIcon(theme) {
        const icon =
            themeToggleBtn.querySelector('i');

        if (icon) {
            icon.className =
                theme === 'dark'
                    ? 'fa-solid fa-sun text-sm'
                    : 'fa-solid fa-moon text-sm';
        }
    }

    searchInput.addEventListener(
        'input',
        renderTasks
    );

    addNewTaskBtn.addEventListener(
        'click',
        () =>
            window.openAddTaskModal('todo')
    );

    fullscreenBtn.addEventListener(
        'click',
        () => {
            if (!document.fullscreenElement) {
                document.documentElement
                    .requestFullscreen()
                    .catch(() => {});
            } else {
                document
                    .exitFullscreen()
                    .catch(() => {});
            }
        }
    );

    document
        .getElementById('shortcutsBtn')
        ?.addEventListener(
            'click',
            () => {
                const modal =
                    document.getElementById(
                        'shortcutsModal'
                    );

                const card =
                    modal.querySelector(
                        '.scale-95, .scale-100'
                    );

                modal.classList.remove(
                    'opacity-0',
                    'pointer-events-none'
                );

                if (card) {
                    card.classList.remove(
                        'scale-95'
                    );

                    card.classList.add(
                        'scale-100'
                    );
                }
            }
        );

    window.addEventListener(
        'keydown',
        (e) => {
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA'
            ) {
                if (e.key === 'Escape') {
                    e.target.blur();

                    window.closeModal(
                        'taskModal'
                    );

                    window.closeModal(
                        'shortcutsModal'
                    );
                }

                return;
            }

            if (
                e.key === 'n' ||
                e.key === 'N'
            ) {
                e.preventDefault();
                window.openAddTaskModal(
                    'todo'
                );
            } else if (
                e.key === '/'
            ) {
                e.preventDefault();
                searchInput.focus();
            } else if (
                e.key === 'd' ||
                e.key === 'D'
            ) {
                e.preventDefault();
                themeToggleBtn.click();
            } else if (
                e.key === '?'
            ) {
                e.preventDefault();

                document
                    .getElementById(
                        'shortcutsBtn'
                    )
                    ?.click();
            } else if (
                e.key === 'f' ||
                e.key === 'F'
            ) {
                e.preventDefault();
                fullscreenBtn.click();
            } else if (
                e.key === 'Escape'
            ) {
                window.closeModal(
                    'taskModal'
                );

                window.closeModal(
                    'shortcutsModal'
                );
            }
        }
    );

    document
        .querySelectorAll(
            '.fixed.inset-0'
        )
        .forEach(overlay => {
            overlay.addEventListener(
                'click',
                (e) => {
                    if (
                        e.target === overlay
                    ) {
                        const id =
                            overlay.id;

                        if (
                            id === 'taskModal' ||
                            id ===
                                'shortcutsModal'
                        ) {
                            window.closeModal(
                                id
                            );
                        }
                    }
                }
            );
        });

    updateTagSelect();
}

setupAuthListener();
setupLoginHandlers();
setupUIHandlers();

window.openAddTaskModal =
    window.openAddTaskModal;

window.openEditTaskModal =
    window.openEditTaskModal;

window.closeModal =
    window.closeModal;

window.openModal =
    window.openModal;

console.log(
    'TaskFlow connected to Firebase Firestore'
);