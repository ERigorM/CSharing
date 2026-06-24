/**
 * Application Controller
 * Orchestrates state, services, and UI layers
 */

const AVATAR_COLORS = ['#3a8fc1', '#c8a96e', '#3ecf8e', '#f06565', '#a78bfa', '#f472b6', '#34d399', '#fb923c'];

class App {
  constructor() {
    this.stateManager = new StateManager();
    this.currentTab = 'kostnader';
    this.currentEditId = null;
  }

  init() {
    this.render();
  }

  // ──── Rendering ─────────────────────────────────────────────
  render() {
    this.renderSummary();
    this.populateUserSelects();
    this.renderExpenses();
    this.updateSubtitle();
  }

  renderSummary() {
    const users = this.stateManager.getUsers();
    const expenses = this.stateManager.getExpenses();
    document.getElementById('summary-grid').innerHTML = SummaryComponent.render(expenses, users);
  }

  renderExpenses() {
    const users = this.stateManager.getUsers();
    const expenses = this.stateManager.getExpenses();
    const filters = this.getFilters();
    filters.userCount = users.length;

    const filtered = ExpenseService.filterExpenses(expenses, filters);
    document.getElementById('expense-list').innerHTML = ExpenseListComponent.render(filtered, users);
    document.getElementById('expense-count').textContent = filtered.length + ' poster';
  }

  renderSettlement() {
    const users = this.stateManager.getUsers();
    const expenses = this.stateManager.getExpenses();
    const settlement = ExpenseService.calculateSettlement(expenses, users);
    document.getElementById('settlement-view').innerHTML = SettlementComponent.render(settlement, users);
  }

  renderUsers() {
    const users = this.stateManager.getUsers();
    document.getElementById('users-grid').innerHTML = UserListComponent.render(users);
  }

  renderHistory() {
    const history = this.stateManager.getHistory();
    document.getElementById('history-list').innerHTML = HistoryListComponent.render(history);
  }

  updateSubtitle() {
    const users = this.stateManager.getUsers();
    const expenses = this.stateManager.getExpenses();
    document.getElementById('boat-subtitle').textContent = 
      `${users.length} delägare · ${expenses.length} kostnader`;
  }

  // ──── Tab Navigation ─────────────────────────────────────────────
  switchTab(name) {
    this.currentTab = name;
    
    // Update tab buttons
    const names = ['kostnader', 'avrakning', 'anvandare', 'historik'];
    document.querySelectorAll('.tab').forEach((t, i) => {
      t.classList.toggle('active', names[i] === name);
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');

    // Render specific tab content
    if (name === 'avrakning') this.renderSettlement();
    if (name === 'historik') this.renderHistory();
    if (name === 'anvandare') this.renderUsers();
  }

  // ──── Expense Management ─────────────────────────────────────────────
  addExpense() {
    const title = document.getElementById('f-title').value.trim();
    const amount = parseFloat(document.getElementById('f-amount').value);
    const date = document.getElementById('f-date').value;
    const paidBy = document.getElementById('f-paidby').value;
    const category = document.getElementById('f-category').value;
    const note = document.getElementById('f-note').value.trim();

    // Validation
    if (!title) {
      toast('Ange en titel för kostnaden', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      toast('Ange ett giltigt belopp', 'error');
      return;
    }
    if (!date) {
      toast('Ange ett datum', 'error');
      return;
    }
    if (!paidBy) {
      toast('Välj vem som betalade', 'error');
      return;
    }

    // Create expense with payments for each user
    const users = this.stateManager.getUsers();
    const payments = {};
    users.forEach(u => {
      payments[u.id] = u.id === paidBy;
    });

    const expense = {
      id: uid(),
      title,
      amount,
      date,
      paidBy,
      category,
      note,
      payments,
      created: new Date().toISOString(),
      updated: null
    };

    // Update state
    this.stateManager.addExpense(expense);
    const payer = this.stateManager.getUser(paidBy);
    this.stateManager.addHistory('add', 
      `<strong>${payer ? payer.name : 'Okänd'}</strong> lade till "<strong>${title}</strong>" – ${FormatService.fmtAmount(amount)}`);

    // Re-render
    this.clearForm();
    this.render();
    toast('Kostnad tillagd ✓', 'success');
  }

  openEdit(id) {
    const expense = this.stateManager.getExpenses().find(e => e.id === id);
    if (!expense) return;

    this.currentEditId = id;
    document.getElementById('e-title').value = expense.title;
    document.getElementById('e-amount').value = expense.amount;
    document.getElementById('e-date').value = expense.date;
    document.getElementById('e-category').value = expense.category || 'ovrigt';
    document.getElementById('e-note').value = expense.note || '';
    this.populateUserSelect('e-paidby', expense.paidBy);
    this.openModal('edit-modal');
  }

  saveEdit() {
    const title = document.getElementById('e-title').value.trim();
    const amount = parseFloat(document.getElementById('e-amount').value);
    const date = document.getElementById('e-date').value;
    const paidBy = document.getElementById('e-paidby').value;
    const category = document.getElementById('e-category').value;
    const note = document.getElementById('e-note').value.trim();

    const expense = this.stateManager.getExpenses().find(e => e.id === this.currentEditId);
    if (!expense) return;

    const oldTitle = expense.title;
    this.stateManager.updateExpense(this.currentEditId, {
      title,
      amount,
      date,
      paidBy,
      category,
      note,
      updated: new Date().toISOString()
    });

    this.stateManager.addHistory('edit', 
      `Redigerade kostnad "<strong>${oldTitle}</strong>"`);

    this.closeModal('edit-modal');
    this.render();
    toast('Kostnad uppdaterad', 'success');
  }

  deleteExpense(id) {
    const expense = this.stateManager.getExpenses().find(e => e.id === id);
    if (!expense) return;
    if (!confirm(`Ta bort "${expense.title}"?`)) return;

    this.stateManager.deleteExpense(id);
    this.stateManager.addHistory('delete', 
      `Tog bort kostnad "<strong>${expense.title}</strong>" – ${FormatService.fmtAmount(expense.amount)}`);

    this.closeModal('edit-modal');
    this.render();
    toast('Kostnad borttagen', 'info');
  }

  togglePayment(expId, userId) {
    this.stateManager.togglePayment(expId, userId);
    const expense = this.stateManager.getExpenses().find(e => e.id === expId);
    const user = this.stateManager.getUser(userId);
    const status = expense.payments[userId] ? 'markerade som betald' : 'avmarkerade betalning';
    
    this.stateManager.addHistory('pay', 
      `<strong>${user ? user.name : 'Okänd'}</strong> ${status} för "<strong>${expense.title}</strong>"`);

    this.renderExpenses();
    this.renderSettlement();
  }

  toggleDetail(id) {
    const detail = document.getElementById('detail-' + id);
    if (detail) detail.classList.toggle('open');
  }

  clearForm() {
    ['f-title', 'f-amount', 'f-note'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('f-category').value = 'ovrigt';
  }

  // ──── User Management ─────────────────────────────────────────────
  addUser() {
    const name = document.getElementById('u-name').value.trim();
    const role = document.getElementById('u-role').value;

    if (!name) {
      toast('Ange ett namn', 'error');
      return;
    }

    if (this.stateManager.getUsers().find(u => u.name.toLowerCase() === name.toLowerCase())) {
      toast('Den personen finns redan', 'error');
      return;
    }

    const color = AVATAR_COLORS[this.stateManager.getUsers().length % AVATAR_COLORS.length];
    const user = { id: uid(), name, role, color };

    this.stateManager.addUser(user);
    this.stateManager.addHistory('add', 
      `Lade till delägare <strong>${name}</strong>`);

    document.getElementById('u-name').value = '';
    this.render();
    toast('Delägare tillagd ✓', 'success');
  }

  removeUser(id) {
    const user = this.stateManager.getUser(id);
    if (!user) return;

    if (this.stateManager.getUsers().length <= 2) {
      toast('Minst 2 delägare krävs', 'error');
      return;
    }

    if (!confirm(`Ta bort ${user.name}?`)) return;

    this.stateManager.removeUser(id);
    this.stateManager.addHistory('delete', 
      `Tog bort delägare <strong>${user.name}</strong>`);

    this.renderUsers();
    this.render();
    toast('Delägare borttagen', 'info');
  }

  // ──── Import/Export ─────────────────────────────────────────────
  exportData() {
    const data = this.stateManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battkostnader-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exporterad ✓', 'success');
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('Importera och ersätta nuvarande data?')) return;
        
        this.stateManager.importData(data);
        this.render();
        toast('Data importerad ✓', 'success');
      } catch (err) {
        toast('Kunde inte importera filen', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // ──── Helper Methods ─────────────────────────────────────────────
  getFilters() {
    return {
      user: document.getElementById('filter-user').value,
      category: document.getElementById('filter-cat').value,
      status: document.getElementById('filter-status').value
    };
  }

  populateUserSelects() {
    this.populateUserSelect('f-paidby');
    this.populateUserSelect('e-paidby');
    this.populateFilterUser();
  }

  populateUserSelect(elementId, selectedId = null) {
    const select = document.getElementById(elementId);
    if (!select) return;

    const users = this.stateManager.getUsers();
    select.innerHTML = users.map(u => 
      `<option value="${u.id}" ${u.id === selectedId ? 'selected' : ''}>${u.name}</option>`
    ).join('');
  }

  populateFilterUser() {
    const select = document.getElementById('filter-user');
    if (!select) return;

    const current = select.value;
    const users = this.stateManager.getUsers();
    select.innerHTML = `<option value="">Alla delägare</option>` + 
      users.map(u => 
        `<option value="${u.id}" ${u.id === current ? 'selected' : ''}>${u.name}</option>`
      ).join('');
  }

  openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }
}
