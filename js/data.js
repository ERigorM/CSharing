/**
 * Data Layer - State Management
 * Single source of truth for all application data
 */

class StateManager {
  constructor() {
    this.state = this.load();
  }

  // Getters
  getUsers() {
    return this.state.users;
  }

  getExpenses() {
    return this.state.expenses;
  }

  getHistory() {
    return this.state.history;
  }

  getUser(id) {
    return this.state.users.find(u => u.id === id);
  }

  // Mutations
  addExpense(expense) {
    this.state.expenses.unshift(expense);
    this.save();
    return this.state;
  }

  updateExpense(id, updates) {
    const expense = this.state.expenses.find(e => e.id === id);
    if (expense) {
      Object.assign(expense, updates);
      this.save();
    }
    return this.state;
  }

  deleteExpense(id) {
    this.state.expenses = this.state.expenses.filter(e => e.id !== id);
    this.save();
    return this.state;
  }

  addUser(user) {
    this.state.users.push(user);
    this.save();
    return this.state;
  }

  removeUser(id) {
    this.state.users = this.state.users.filter(u => u.id !== id);
    this.save();
    return this.state;
  }

  addHistory(type, text) {
    this.state.history.unshift({
      id: uid(),
      type,
      text,
      ts: new Date().toISOString()
    });
    if (this.state.history.length > 200) {
      this.state.history.pop();
    }
    this.save();
  }

  togglePayment(expId, userId) {
    const expense = this.state.expenses.find(e => e.id === expId);
    if (expense) {
      if (!expense.payments) expense.payments = {};
      expense.payments[userId] = !expense.payments[userId];
      this.save();
    }
  }

  importData(data) {
    if (!data.users || !data.expenses) {
      throw new Error('Ogiltigt format');
    }
    this.state = data;
    this.save();
    return this.state;
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  // Persistence
  save() {
    localStorage.setItem('battkostnader_v2', JSON.stringify(this.state));
  }

  load() {
    const data = localStorage.getItem('battkostnader_v2');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse stored data', e);
        return this.defaultState();
      }
    }
    return this.defaultState();
  }

  defaultState() {
    return {
      users: [
        { id: 'u1', name: 'Anna', role: 'admin', color: '#3a8fc1' },
        { id: 'u2', name: 'Björn', role: 'delägare', color: '#c8a96e' },
        { id: 'u3', name: 'Cecilia', role: 'delägare', color: '#3ecf8e' },
        { id: 'u4', name: 'David', role: 'delägare', color: '#f06565' }
      ],
      expenses: [],
      history: []
    };
  }
}
