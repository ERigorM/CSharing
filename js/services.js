/**
 * Services Layer - Business Logic
 * Pure functions for calculations and transformations
 */

class FormatService {
  static fmtAmount(n) {
    return Number(n).toLocaleString('sv-SE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' kr';
  }

  static fmtDate(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

class ExpenseService {
  static calculateExpenseStatus(expense, userCount) {
    if (!expense.payments || userCount === 0) return 'unpaid';
    const paid = Object.values(expense.payments).filter(Boolean).length;
    if (paid === 0) return 'unpaid';
    if (paid === userCount) return 'paid';
    return 'partial';
  }

  static filterExpenses(expenses, filters) {
    return expenses.filter(e => {
      if (filters.user && e.paidBy !== filters.user) return false;
      if (filters.category && e.category !== filters.category) return false;
      if (filters.status) {
        const status = ExpenseService.calculateExpenseStatus(e, filters.userCount);
        if (status !== filters.status) return false;
      }
      return true;
    });
  }

  static calculateSettlement(expenses, users) {
    const balance = {};
    users.forEach(u => balance[u.id] = 0);

    // Calculate balances
    expenses.forEach(exp => {
      const n = users.length;
      const share = exp.amount / n;

      // Payer gets credit for full amount
      if (balance[exp.paidBy] !== undefined) {
        balance[exp.paidBy] += exp.amount;
      }

      // Everyone owes their share, but only if they haven't paid
      users.forEach(u => {
        const paid = exp.payments && exp.payments[u.id];
        if (!paid) {
          balance[u.id] -= share;
        }
      });

      // Adjust: payer already "paid" their own share
      if (balance[exp.paidBy] !== undefined) {
        balance[exp.paidBy] -= share;
      }
    });

    // Simplify debts (min-cash-flow algorithm)
    const debtors = users
      .filter(u => balance[u.id] < -0.01)
      .map(u => ({ id: u.id, amount: -balance[u.id] }));
    const creditors = users
      .filter(u => balance[u.id] > 0.01)
      .map(u => ({ id: u.id, amount: balance[u.id] }));

    const transfers = [];
    let di = 0, ci = 0;
    const dc = JSON.parse(JSON.stringify(debtors));
    const cc = JSON.parse(JSON.stringify(creditors));

    while (di < dc.length && ci < cc.length) {
      const amt = Math.min(dc[di].amount, cc[ci].amount);
      if (amt > 0.01) {
        transfers.push({ from: dc[di].id, to: cc[ci].id, amount: amt });
      }
      dc[di].amount -= amt;
      cc[ci].amount -= amt;
      if (dc[di].amount < 0.01) di++;
      if (cc[ci].amount < 0.01) ci++;
    }

    return { balance, transfers };
  }
}

class SummaryService {
  static calculate(expenses, users) {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const unpaid = expenses.filter(e => {
      const status = ExpenseService.calculateExpenseStatus(e, users.length);
      return status !== 'paid';
    }).length;
    const perPerson = total / Math.max(users.length, 1);

    return {
      total,
      unpaid,
      perPerson,
      expenseCount: expenses.length,
      userCount: users.length
    };
  }
}
