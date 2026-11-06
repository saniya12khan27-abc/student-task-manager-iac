/**
 * Cloudflare Worker: Student Task Management System
 * Backend REST API + Frontend Server
 * Bound to Workers KV: TASKS_KV
 */

// Embedded frontend assets for serverless edge serving
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Task Management Application | Serverless IaC</title>
  <link rel="stylesheet" href="/style.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <div class="logo-icon">📋</div>
        <div>
          <h1>Student Task Manager</h1>
          <p class="subtitle">Automated Serverless Architecture on Cloudflare Workers & KV via Terraform</p>
        </div>
      </div>
      <div class="header-badges">
        <span class="badge badge-infra">⚡ Cloudflare Workers</span>
        <span class="badge badge-db">💾 Workers KV</span>
        <span class="badge badge-iac">🛠️ Terraform Managed</span>
      </div>
    </header>

    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Tasks</span>
        <span class="metric-value" id="stat-total">0</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Pending</span>
        <span class="metric-value pending-text" id="stat-pending">0</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Completed</span>
        <span class="metric-value completed-text" id="stat-completed">0</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">High Priority</span>
        <span class="metric-value high-text" id="stat-high">0</span>
      </div>
    </div>

    <div class="main-layout">
      <section class="card form-card">
        <h2>Add Academic Task</h2>
        <form id="task-form">
          <div class="form-group">
            <label for="task-title">Task Title *</label>
            <input type="text" id="task-title" placeholder="e.g. Complete Cloud Computing Assignment" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="task-priority">Priority *</label>
              <select id="task-priority" required>
                <option value="High">High 🔴</option>
                <option value="Medium" selected>Medium 🟡</option>
                <option value="Low">Low 🟢</option>
              </select>
            </div>
            <div class="form-group">
              <label for="task-category">Category</label>
              <select id="task-category">
                <option value="Assignment" selected>Assignment 📝</option>
                <option value="Project">Project 💻</option>
                <option value="Exam / Viva">Exam / Viva 🎓</option>
                <option value="Laboratory">Laboratory 🔬</option>
                <option value="General">General 📌</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="task-status">Initial Status</label>
            <select id="task-status">
              <option value="Pending" selected>Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" id="submit-btn">
            <span>➕</span> Add Task
          </button>
        </form>
      </section>

      <section class="card list-card">
        <div class="list-header">
          <h2>Task Records</h2>
          <div class="filter-controls">
            <input type="text" id="search-input" placeholder="🔍 Search tasks..." class="search-box">
            <select id="filter-status">
              <option value="ALL">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <select id="filter-priority">
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="tasks-table">
            <thead>
              <tr>
                <th width="12%">ID</th>
                <th width="35%">Task Title</th>
                <th width="15%">Category</th>
                <th width="12%">Priority</th>
                <th width="14%">Status</th>
                <th width="12%">Actions</th>
              </tr>
            </thead>
            <tbody id="tasks-tbody">
              <tr>
                <td colspan="6" class="loading-state">
                  <div class="spinner"></div> Loading tasks from Workers KV...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div id="toast" class="toast hidden"></div>
    <footer class="app-footer">
      <p>Mini Project on Infrastructure as Code (IaC) &bull; Cloudflare Workers &bull; Workers KV &bull; Terraform</p>
    </footer>
  </div>
  <script src="/script.js"></script>
</body>
</html>`;

const CSS_CONTENT = `:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --bg-gradient: #f8fafc;
  --surface: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --danger: #ef4444;
  --success: #10b981;
  --radius: 12px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
body { background-color: var(--bg-gradient); color: var(--text-main); line-height: 1.5; padding: 24px 16px; min-height: 100vh; }
.app-container { max-width: 1200px; margin: 0 auto; }
.app-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.header-left { display: flex; align-items: center; gap: 16px; }
.logo-icon { font-size: 2.5rem; background: #eff6ff; padding: 12px; border-radius: var(--radius); border: 1px solid #bfdbfe; }
h1 { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
.subtitle { font-size: 0.9rem; color: var(--text-muted); }
.header-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.badge { font-size: 0.75rem; font-weight: 600; padding: 6px 12px; border-radius: 9999px; }
.badge-infra { background: #e0f2fe; color: #0369a1; }
.badge-db { background: #fef3c7; color: #b45309; }
.badge-iac { background: #f3e8ff; color: #6b21a8; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; box-shadow: var(--shadow); display: flex; flex-direction: column; }
.metric-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
.metric-value { font-size: 1.8rem; font-weight: 700; margin-top: 4px; }
.pending-text { color: #f59e0b; }
.completed-text { color: #10b981; }
.high-text { color: #ef4444; }
.main-layout { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
@media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
.card h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 18px; color: #1e293b; }
.form-group { margin-bottom: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: #334155; }
input[type="text"], select { width: 100%; padding: 10px 12px; font-size: 0.95rem; border: 1px solid var(--border); border-radius: 8px; background: #fff; outline: none; }
input[type="text"]:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; border-radius: 8px; cursor: pointer; border: none; }
.btn-primary { width: 100%; padding: 12px; background: var(--primary); color: #ffffff; }
.btn-primary:hover { background: var(--primary-hover); }
.list-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
.filter-controls { display: flex; gap: 8px; flex-wrap: wrap; }
.search-box { max-width: 200px; }
.table-responsive { overflow-x: auto; }
.tasks-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.tasks-table th { padding: 12px; background: #f1f5f9; color: #475569; font-weight: 600; border-bottom: 2px solid var(--border); }
.tasks-table td { padding: 14px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.tasks-table tr:hover td { background: #f8fafc; }
.task-id-badge { font-family: monospace; font-weight: 600; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; color: #475569; font-size: 0.85rem; }
.tag { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
.tag-high { background: #fee2e2; color: #b91c1c; }
.tag-med { background: #fef3c7; color: #b45309; }
.tag-low { background: #dcfce7; color: #15803d; }
.status-badge { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; }
.status-pending { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.status-completed { background: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
.action-buttons { display: flex; gap: 6px; }
.btn-icon { background: transparent; border: 1px solid var(--border); padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.btn-delete:hover { background: #fee2e2; border-color: #fca5a5; color: var(--danger); }
.btn-toggle:hover { background: #e0f2fe; border-color: #93c5fd; color: var(--primary); }
.loading-state, .empty-state { text-align: center; padding: 40px !important; color: var(--text-muted); }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-left-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; background: #1e293b; color: #fff; font-size: 0.9rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); transition: all 0.3s; z-index: 1000; }
.toast.hidden { opacity: 0; transform: translateY(20px); pointer-events: none; }
.toast.success { background: #065f46; }
.toast.error { background: #991b1b; }
.app-footer { text-align: center; margin-top: 36px; padding-top: 16px; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid var(--border); }`;

const JS_CONTENT = `const API_BASE = '/api/tasks';
let tasks = [];
const taskForm = document.getElementById('task-form');
const tasksTbody = document.getElementById('tasks-tbody');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');
const submitBtn = document.getElementById('submit-btn');
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statHigh = document.getElementById('stat-high');

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

async function loadTasks() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('API failed');
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    tasksTbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading tasks from Cloudflare KV.</td></tr>';
  }
}

function updateStats() {
  statTotal.textContent = tasks.length;
  statPending.textContent = tasks.filter(t => t.status === 'Pending').length;
  statCompleted.textContent = tasks.filter(t => t.status === 'Completed').length;
  statHigh.textContent = tasks.filter(t => t.priority === 'High').length;
}

function renderTasks() {
  updateStats();
  const query = searchInput.value.toLowerCase().trim();
  const statusFilter = filterStatus.value;
  const priorityFilter = filterPriority.value;

  const filtered = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(query) || (task.id && task.id.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (filtered.length === 0) {
    tasksTbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tasks found. Add a task on the left!</td></tr>';
    return;
  }

  tasksTbody.innerHTML = filtered.map(t => {
    const priorityClass = t.priority === 'High' ? 'tag-high' : (t.priority === 'Medium' ? 'tag-med' : 'tag-low');
    const isCompleted = t.status === 'Completed';
    const statusClass = isCompleted ? 'status-completed' : 'status-pending';
    const statusIcon = isCompleted ? '✅' : '⏳';

    return '<tr>' +
      '<td><span class="task-id-badge">' + t.id + '</span></td>' +
      '<td><strong>' + escapeHtml(t.title) + '</strong></td>' +
      '<td>' + escapeHtml(t.category || 'General') + '</td>' +
      '<td><span class="tag ' + priorityClass + '">' + t.priority + '</span></td>' +
      '<td><span class="status-badge ' + statusClass + '" onclick="toggleTaskStatus(\\'' + t.id + '\\')">' + statusIcon + ' ' + t.status + '</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn-icon btn-toggle" onclick="toggleTaskStatus(\\'' + t.id + '\\')">' + (isCompleted ? '↩️' : '✔️') + '</button>' +
        '<button class="btn-icon btn-delete" onclick="deleteTask(\\'' + t.id + '\\')">🗑️</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  const priority = document.getElementById('task-priority').value;
  const category = document.getElementById('task-category').value;
  const status = document.getElementById('task-status').value;

  if (!title) return;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, priority, category, status })
    });
    if (res.ok) {
      const created = await res.json();
      tasks.unshift(created);
      showToast('Task created successfully in Cloudflare KV!');
      taskForm.reset();
    } else {
      showToast('Failed to save task', 'error');
    }
  } catch (err) {
    showToast('Network error saving task', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>➕</span> Add Task';
    renderTasks();
  }
});

window.toggleTaskStatus = async function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
  try {
    const res = await fetch(API_BASE + '/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: nextStatus })
    });
    if (res.ok) {
      task.status = nextStatus;
      showToast('Task ' + id + ' updated to ' + nextStatus + '!');
      renderTasks();
    }
  } catch (err) {
    showToast('Update failed', 'error');
  }
};

window.deleteTask = async function(id) {
  if (!confirm('Are you sure you want to delete task ' + id + '?')) return;
  try {
    const res = await fetch(API_BASE + '/' + id, { method: 'DELETE' });
    if (res.ok) {
      tasks = tasks.filter(t => t.id !== id);
      showToast('Task ' + id + ' deleted from KV!');
      renderTasks();
    }
  } catch (err) {
    showToast('Delete failed', 'error');
  }
};

searchInput.addEventListener('input', renderTasks);
filterStatus.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);
loadTasks();`;

// CORS Response Helper
function corsResponse(body, status = 200, contentType = 'application/json') {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS pre-flight
    if (method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // Serve Frontend Static Assets
    if (path === '/' || path === '/index.html') {
      return new Response(HTML_CONTENT, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (path === '/style.css') {
      return new Response(CSS_CONTENT, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
    }
    if (path === '/script.js') {
      return new Response(JS_CONTENT, { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
    }

    // API Routes: /api/tasks
    if (path === '/api/tasks' || path.startsWith('/api/tasks/')) {
      const kv = env.TASKS_KV;
      if (!kv) {
        return corsResponse({ error: 'Workers KV binding (TASKS_KV) not found' }, 500);
      }

      const id = path.replace('/api/tasks', '').replace('/', '').trim();

      // GET /api/tasks (List all tasks)
      if (method === 'GET' && !id) {
        try {
          const list = await kv.list();
          const tasks = [];
          for (const key of list.keys) {
            const val = await kv.get(key.name);
            if (val) {
              try {
                tasks.push(JSON.parse(val));
              } catch {
                tasks.push({ id: key.name, title: val, status: 'Pending', priority: 'Medium' });
              }
            }
          }
          // Sort newest first
          tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          return corsResponse(tasks);
        } catch (err) {
          return corsResponse({ error: 'Failed to retrieve tasks from KV', details: err.message }, 500);
        }
      }

      // GET /api/tasks/:id
      if (method === 'GET' && id) {
        const val = await kv.get(id);
        if (!val) return corsResponse({ error: 'Task not found' }, 404);
        return corsResponse(JSON.parse(val));
      }

      // POST /api/tasks (Create task)
      if (method === 'POST') {
        try {
          const data = await request.json();
          if (!data.title) {
            return corsResponse({ error: 'Task title is required' }, 400);
          }

          const taskId = 'T' + Math.floor(100 + Math.random() * 900);
          const task = {
            id: taskId,
            title: data.title,
            priority: data.priority || 'Medium',
            category: data.category || 'Assignment',
            status: data.status || 'Pending',
            createdAt: new Date().toISOString()
          };

          await kv.put(taskId, JSON.stringify(task));
          return corsResponse(task, 201);
        } catch (err) {
          return corsResponse({ error: 'Invalid task payload', details: err.message }, 400);
        }
      }

      // PUT /api/tasks/:id (Update task)
      if (method === 'PUT' && id) {
        try {
          const existing = await kv.get(id);
          if (!existing) return corsResponse({ error: 'Task not found' }, 404);

          const existingData = JSON.parse(existing);
          const updates = await request.json();

          const updatedTask = {
            ...existingData,
            ...updates,
            id // Guarantee ID cannot be mutated
          };

          await kv.put(id, JSON.stringify(updatedTask));
          return corsResponse(updatedTask);
        } catch (err) {
          return corsResponse({ error: 'Failed to update task', details: err.message }, 400);
        }
      }

      // DELETE /api/tasks/:id (Delete task)
      if (method === 'DELETE' && id) {
        await kv.delete(id);
        return corsResponse({ message: `Task ${id} deleted successfully`, id });
      }
    }

    return corsResponse({ error: 'Not found' }, 404);
  }
};
