const STORAGE_KEY = 'passive-income-dashboard';

const defaultState = {
  categories: [
    { id: 'c1', name: 'ETF', balance: 50000 },
    { id: 'c2', name: 'Annuity', balance: 25000 },
    { id: 'c3', name: 'Retirement Account', balance: 100000 },
  ],
  returnRates: [4, 5, 6],
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        categories: parsed.categories?.length ? parsed.categories : defaultState.categories,
        returnRates: parsed.returnRates?.length ? parsed.returnRates : defaultState.returnRates,
      };
    }
  } catch (e) {
    console.warn('Failed to load saved state', e);
  }
  return { ...defaultState };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories: state.categories, returnRates: state.returnRates }));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function init() {
  let state = loadState();

  function setState(updater) {
    state = typeof updater === 'function' ? updater(state) : updater;
    saveState(state);
    render();
  }

  function addCategory() {
    const name = prompt('Enter category name (e.g., ETF, Annuity):');
    if (!name?.trim()) return;
    setState((s) => ({
      ...s,
      categories: [...s.categories, { id: generateId(), name: name.trim(), balance: 0 }],
    }));
  }

  function removeCategory(id) {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
  }

  function updateCategory(id, field, value) {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, [field]: field === 'balance' ? parseFloat(value) || 0 : value } : c
      ),
    }));
  }

  function addReturnRate() {
    const input = prompt('Enter return rate percentage (e.g., 7):');
    const rate = parseFloat(input);
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    if (state.returnRates.includes(rate)) {
      alert('This return rate already exists.');
      return;
    }
    setState((s) => ({
      ...s,
      returnRates: [...s.returnRates, rate].sort((a, b) => a - b),
    }));
  }

  function removeReturnRate(rate) {
    setState((s) => ({ ...s, returnRates: s.returnRates.filter((r) => r !== rate) }));
  }

  const app = document.getElementById('app');

  function render() {
    const totalBalance = state.categories.reduce((sum, c) => sum + (c.balance || 0), 0);

    const passiveIncomeByRate = state.returnRates.map((rate) => ({
      rate,
      annual: (totalBalance * rate) / 100,
      monthly: (totalBalance * rate) / 100 / 12,
    }));

    app.innerHTML = `
      <header>
        <h1>Passive Income Dashboard</h1>
        <p class="subtitle">Track your investments and project returns across different scenarios</p>
      </header>

      <div class="dashboard">
        <div class="card">
          <div class="card-title">Investment Categories</div>
          <div class="item-list" id="categories-list">
            ${state.categories.length === 0 ? '<div class="empty-state">No categories yet. Add one to get started.</div>' : ''}
            ${state.categories
              .map(
                (c) => `
              <div class="list-item" data-id="${c.id}">
                <input type="text" value="${escapeHtml(c.name)}" placeholder="Category name" data-field="name" />
                <input type="number" class="amount-input" value="${c.balance}" placeholder="Balance" min="0" step="100" data-field="balance" />
                <button class="btn btn-icon btn-icon-sm" data-action="remove-category" title="Remove">×</button>
              </div>
            `
              )
              .join('')}
          </div>
          <button class="btn btn-primary" data-action="add-category" style="margin-top: 0.75rem;">+ Add Category</button>
        </div>

        <div class="card">
          <div class="card-title">Return Assumptions (%)</div>
          <div class="item-list" id="rates-list">
            ${state.returnRates.length === 0 ? '<div class="empty-state">No return rates. Add one to see projections.</div>' : ''}
            ${state.returnRates
              .map(
                (r) => `
              <div class="list-item" data-rate="${r}">
                <span style="flex:1; font-family: 'JetBrains Mono', monospace;">${r}%</span>
                <button class="btn btn-icon btn-icon-sm" data-action="remove-rate" title="Remove">×</button>
              </div>
            `
              )
              .join('')}
          </div>
          <button class="btn btn-primary" data-action="add-rate" style="margin-top: 0.75rem;">+ Add Return Rate</button>
        </div>

        <div class="card results-section">
          <div class="card-title">Projected Passive Income</div>
          <div class="total-balance">
            <span class="total-label">Total Investment Balance</span>
            <span class="total-value">${formatCurrency(totalBalance)}</span>
          </div>
          <div class="results-grid">
            ${passiveIncomeByRate
              .map(
                (p) => `
              <div class="result-card">
                <div class="result-rate">${p.rate}% annual return</div>
                <div class="result-amount">${formatCurrency(p.annual)}</div>
                <div class="result-period">per year</div>
                <div class="result-amount" style="font-size: 1rem; margin-top: 0.5rem; color: var(--text-secondary);">${formatCurrency(p.monthly)}</div>
                <div class="result-period">per month</div>
              </div>
            `
              )
              .join('')}
          </div>
          ${state.returnRates.length === 0 ? '<div class="empty-state">Add return rates above to see projected passive income.</div>' : ''}
        </div>
      </div>
    `;
  }

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'add-category') addCategory();
    if (action === 'remove-category') {
      const item = btn.closest('[data-id]');
      if (item) removeCategory(item.dataset.id);
    }
    if (action === 'add-rate') addReturnRate();
    if (action === 'remove-rate') {
      const item = btn.closest('[data-rate]');
      if (item) removeReturnRate(parseFloat(item.dataset.rate));
    }
  }

  function handleInput(e) {
    const input = e.target;
    const item = input.closest('.list-item[data-id]');
    if (!item) return;
    const id = item.dataset.id;
    const field = input.dataset.field;
    if (field && (field === 'name' || field === 'balance')) {
      updateCategory(id, field, field === 'balance' ? input.value : input.value);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  app.addEventListener('click', handleClick);
  app.addEventListener('change', handleInput);

  render();
}

document.addEventListener('DOMContentLoaded', init);
