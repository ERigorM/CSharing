/**
 * UI Layer - Presentation Components
 * Pure rendering functions that return HTML strings
 */

class SummaryComponent {
  static render(expenses, users) {
    const summary = SummaryService.calculate(expenses, users);
    return `
      <div class="summary-card accent">
        <div class="label">Total kostnad</div>
        <div class="value mono">${FormatService.fmtAmount(summary.total)}</div>
        <div class="sub">${summary.expenseCount} poster</div>
      </div>
      <div class="summary-card">
        <div class="label">Per delägare</div>
        <div class="value mono">${FormatService.fmtAmount(summary.perPerson)}</div>
        <div class="sub">${summary.userCount} delägare</div>
      </div>
      <div class="summary-card">
        <div class="label">Obetalda poster</div>
        <div class="value">${summary.unpaid}</div>
        <div class="sub">av ${summary.expenseCount} totalt</div>
      </div>
      <div class="summary-card">
        <div class="label">Delägare</div>
        <div class="value">${summary.userCount}</div>
      </div>
    `;
  }
}

class ExpenseListComponent {
  static render(expenses, users) {
    if (expenses.length === 0) {
      return `<div class="empty"><div class="empty-icon">📋</div><p>Inga kostnader att visa.<br>Lägg till en kostnad ovan.</p></div>`;
    }
    return expenses.map(exp => ExpenseItemComponent.render(exp, users)).join('');
  }
}

class ExpenseItemComponent {
  static render(expense, users) {
    const payer = users.find(u => u.id === expense.paidBy);
    const status = ExpenseService.calculateExpenseStatus(expense, users.length);
    const statusBadge = this.statusBadge(status);
    const paymentRows = this.paymentRows(expense, users);

    return `
      <div class="expense-item" id="exp-${expense.id}">
        <div class="expense-main" onclick="window.app.toggleDetail('${expense.id}')">
          <div class="expense-icon">${getCategoryIcon(expense.category)}</div>
          <div class="expense-info">
            <div class="expense-title">${expense.title}</div>
            <div class="expense-meta">
              ${payer ? payer.name : '?'} · ${FormatService.fmtDate(expense.date)}
              ${expense.note ? ' · ' + expense.note : ''}
            </div>
          </div>
          <div class="expense-amount">${FormatService.fmtAmount(expense.amount)}</div>
          <div class="expense-status">${statusBadge}</div>
        </div>
        <div class="expense-detail" id="detail-${expense.id}">
          <div class="detail-grid">
            <div class="detail-item">
              <div class="dk">Kategori</div>
              <div class="dv">${getCategoryIcon(expense.category)} ${expense.category}</div>
            </div>
            <div class="detail-item">
              <div class="dk">Andel per person</div>
              <div class="dv mono">${FormatService.fmtAmount(expense.amount / Math.max(users.length, 1))}</div>
            </div>
            ${expense.updated ? `<div class="detail-item"><div class="dk">Uppdaterad</div><div class="dv">${FormatService.fmtDate(expense.updated)}</div></div>` : ''}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div class="dk">Betalstatus per delägare</div>
            <button class="btn btn-sm btn-ghost" onclick="window.app.openEdit('${expense.id}')">✏ Redigera</button>
          </div>
          <div class="payment-rows">${paymentRows}</div>
        </div>
      </div>
    `;
  }

  static statusBadge(status) {
    const badges = {
      'paid': '<span class="badge badge-paid">Betald</span>',
      'partial': '<span class="badge badge-partial">Delvis</span>',
      'unpaid': '<span class="badge badge-unpaid">Obetald</span>'
    };
    return badges[status] || badges.unpaid;
  }

  static paymentRows(expense, users) {
    return users.map(u => {
      const paid = expense.payments && expense.payments[u.id];
      const share = expense.amount / users.length;
      return `
        <div class="payment-row">
          <div class="avatar" style="width:24px;height:24px;font-size:10px;background:${u.color}22;color:${u.color}">${avatarInitials(u.name)}</div>
          <span class="pr-name">${u.name}</span>
          <span class="pr-amount">${FormatService.fmtAmount(share)}</span>
          <div class="pr-toggle">
            <input type="checkbox" class="toggle-check" ${paid ? 'checked' : ''} onchange="window.app.togglePayment('${expense.id}','${u.id}')" title="${paid ? 'Markera som obetald' : 'Markera som betald'}"/>
          </div>
        </div>
      `;
    }).join('');
  }
}

class SettlementComponent {
  static render(settlement, users) {
    if (users.length < 2) {
      return `<div class="empty"><div class="empty-icon">👥</div><p>Lägg till minst 2 delägare för att se avräkning.</p></div>`;
    }

    let html = this.summarySection(settlement, users);
    html += this.balanceSection(settlement, users);
    html += this.transfersSection(settlement, users);

    return html;
  }

  static summarySection(settlement, users) {
    const totalExp = users.reduce((sum, u) => {
      // This is simplified; real calculation would need expense data
      return sum;
    }, 0);

    return `
      <div class="settlement-section">
        <h3>Sammanfattning</h3>
        <div class="summary-grid" style="margin-bottom:0">
          <div class="summary-card">
            <div class="label">Total kostnad</div>
            <div class="value mono">0 kr</div>
          </div>
          <div class="summary-card">
            <div class="label">Per delägare</div>
            <div class="value mono">0 kr</div>
          </div>
          <div class="summary-card">
            <div class="label">Betalda poster</div>
            <div class="value">0/0</div>
          </div>
        </div>
      </div>
    `;
  }

  static balanceSection(settlement, users) {
    let html = `<div class="settlement-section"><h3>Saldo per delägare</h3>`;
    
    users.forEach(u => {
      const bal = settlement.balance[u.id] || 0;
      const myTransfers = settlement.transfers.filter(t => t.from === u.id || t.to === u.id);
      const label = bal > 0.01 ? 'Ska få tillbaka' : bal < -0.01 ? 'Ska betala' : 'Kvitt';
      const cls = bal > 0.01 ? 'owed' : bal < -0.01 ? 'owes' : 'even';
      const sign = bal > 0.01 ? '+' : '';

      html += `
        <div class="settlement-card">
          <div class="settlement-header">
            <div class="avatar" style="background:${u.color}22;color:${u.color}">${avatarInitials(u.name)}</div>
            <div>
              <div class="person-name">${u.name}</div>
              <div class="person-sub">${u.role}</div>
            </div>
            <div class="total-badge ${cls}">${sign}${FormatService.fmtAmount(Math.abs(bal))}</div>
          </div>
      `;

      if (myTransfers.length > 0) {
        html += `<div class="transfers">`;
        myTransfers.forEach(t => {
          const from = users.find(x => x.id === t.from);
          const to = users.find(x => x.id === t.to);
          if (t.from === u.id) {
            html += `<div class="transfer-row"><span>${u.name}</span><span class="arrow">→</span><span>${to ? to.name : '?'}</span><span class="t-amount">${FormatService.fmtAmount(t.amount)}</span></div>`;
          } else {
            html += `<div class="transfer-row"><span>${from ? from.name : '?'}</span><span class="arrow">→</span><span>${u.name}</span><span class="t-amount">${FormatService.fmtAmount(t.amount)}</span></div>`;
          }
        });
        html += `</div>`;
      }
      html += `</div>`;
    });

    html += `</div>`;
    return html;
  }

  static transfersSection(settlement, users) {
    if (settlement.transfers.length === 0) {
      return `<div class="empty" style="padding:24px"><div class="empty-icon">✅</div><p>Alla kostnader är kvittade!</p></div>`;
    }

    let html = `<div class="settlement-section"><h3>Betalningar att göra</h3>`;
    settlement.transfers.forEach(t => {
      const from = users.find(x => x.id === t.from);
      const to = users.find(x => x.id === t.to);
      html += `
        <div class="settlement-card">
          <div class="settlement-header">
            <div class="avatar" style="background:${from ? from.color + '22' : '#fff1'};color:${from ? from.color : '#fff'}">${from ? avatarInitials(from.name) : '?'}</div>
            <div>
              <div class="person-name">${from ? from.name : '?'} betalar ${to ? to.name : '?'}</div>
              <div class="person-sub">Utestående</div>
            </div>
            <div class="total-badge owes">${FormatService.fmtAmount(t.amount)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }
}

class UserListComponent {
  static render(users) {
    return users.map(u => `
      <div class="user-card">
        <div class="avatar" style="background:${u.color}22;color:${u.color}">${avatarInitials(u.name)}</div>
        <div>
          <div class="u-name">${u.name}</div>
          <div class="u-role">${u.role}</div>
        </div>
        <div class="u-actions">
          <button class="btn btn-sm btn-danger" onclick="window.app.removeUser('${u.id}')" title="Ta bort">✕</button>
        </div>
      </div>
    `).join('');
  }
}

class HistoryListComponent {
  static render(history) {
    if (history.length === 0) {
      return `<div class="empty"><div class="empty-icon">📜</div><p>Ingen historik ännu.</p></div>`;
    }
    return history.map(h => `
      <div class="history-item">
        <div class="history-dot ${h.type}"></div>
        <div class="history-text">${h.text}</div>
        <div class="history-time">${FormatService.fmtDate(h.ts)}</div>
      </div>
    `).join('');
  }
}
