// Student Task Manager - Client-side script
const API_BASE = '/api/tasks';

let tasks = [];

// Elements
const taskForm = document.getElementById('task-form');
const tasksTbody = document.getElementById('tasks-tbody');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');
const submitBtn = document.getElementById('submit-btn');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statHigh = document.getElementById('stat-high');

// Toast Notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => {
    toast.className = 'toast hidden';
  }, 3000);
}

// Fetch all tasks from Cloudflare Worker API
async function loadTasks() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('API request failed');
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.warn('Backend unavailable, running in local preview mode:', err);
    // If running directly as local file before deployment, provide initial samples
    if (tasks.length === 0) {
      tasks = [
        { id: 'T101', title: 'Complete Cloud Computing Assignment', priority: 'High', category: 'Assignment', status: 'Pending', createdAt: new Date().toISOString() },
        { id: 'T102', title: 'Submit Final Year Project Report', priority: 'Medium', category: 'Project', status: 'Completed', createdAt: new Date().toISOString() },
        { id: 'T103', title: 'Prepare Viva & Presentation', priority: 'High', category: 'Exam / Viva', status: 'Pending', createdAt: new Date().toISOString() }
      ];
    }
    renderTasks();
  }
}

// Update stats counters
function updateStats() {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const high = tasks.filter(t => t.priority === 'High').length;

  statTotal.textContent = total;
  statPending.textContent = pending;
  statCompleted.textContent = completed;
  statHigh.textContent = high;
}

// Render tasks table with search/filters
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
    tasksTbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          No tasks found. Add a task using the form on the left!
        </td>
      </tr>
    `;
    return;
  }

  tasksTbody.innerHTML = filtered.map(t => {
    const priorityClass = t.priority === 'High' ? 'tag-high' : (t.priority === 'Medium' ? 'tag-med' : 'tag-low');
    const isCompleted = t.status === 'Completed';
    const statusClass = isCompleted ? 'status-completed' : 'status-pending';
    const statusIcon = isCompleted ? '✅' : '⏳';

    return `
      <tr>
        <td><span class="task-id-badge">${t.id}</span></td>
        <td><strong>${escapeHtml(t.title)}</strong></td>
        <td>${escapeHtml(t.category || 'General')}</td>
        <td><span class="tag ${priorityClass}">${t.priority}</span></td>
        <td>
          <span class="status-badge ${statusClass}" onclick="toggleTaskStatus('${t.id}')" title="Click to toggle status">
            ${statusIcon} ${t.status}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon btn-toggle" onclick="toggleTaskStatus('${t.id}')" title="Toggle Status">
              ${isCompleted ? '↩️' : '✔️'}
            </button>
            <button class="btn-icon btn-delete" onclick="deleteTask('${t.id}')" title="Delete Task">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add new task (POST /api/tasks)
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('task-title').value.trim();
  const priority = document.getElementById('task-priority').value;
  const category = document.getElementById('task-category').value;
  const status = document.getElementById('task-status').value;

  if (!title) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span> Saving...`;

  const newTask = {
    title,
    priority,
    category,
    status
  };

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });

    if (res.ok) {
      const created = await res.json();
      tasks.unshift(created);
      showToast('Task created successfully in Cloudflare KV!');
    } else {
      throw new Error('Save failed');
    }
  } catch (err) {
    // Local fallback for testing before deployment
    const mockId = 'T' + Math.floor(100 + Math.random() * 900);
    const mockTask = { ...newTask, id: mockId, createdAt: new Date().toISOString() };
    tasks.unshift(mockTask);
    showToast(`Task ${mockId} created (local mode)`);
  } finally {
    taskForm.reset();
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>➕</span> Add Task`;
    renderTasks();
  }
});

// Toggle Task Status (PUT /api/tasks/:id)
window.toggleTaskStatus = async function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: nextStatus })
    });

    if (res.ok) {
      task.status = nextStatus;
      showToast(`Task ${id} marked as ${nextStatus}!`);
    } else {
      throw new Error('Update failed');
    }
  } catch (err) {
    task.status = nextStatus;
    showToast(`Task ${id} marked as ${nextStatus} (local mode)`);
  }
  renderTasks();
};

// Delete Task (DELETE /api/tasks/:id)
window.deleteTask = async function(id) {
  if (!confirm(`Are you sure you want to delete task ${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      tasks = tasks.filter(t => t.id !== id);
      showToast(`Task ${id} removed from KV!`);
    } else {
      throw new Error('Delete failed');
    }
  } catch (err) {
    tasks = tasks.filter(t => t.id !== id);
    showToast(`Task ${id} removed (local mode)`);
  }
  renderTasks();
};

// Event Listeners for Filters
searchInput.addEventListener('input', renderTasks);
filterStatus.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);

// Initial Load
loadTasks();
