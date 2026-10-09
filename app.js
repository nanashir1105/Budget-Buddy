const $ = id => document.getElementById(id);
const COLORS = ['#0E7C6B','#C4451C','#D69E2E','#3B6FB6','#8A5CC2','#C2527A','#5E7471','#2F9E8F'];
const KEY = 'budget-buddy-v1';

let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.tx)) return s;
  } catch (e) { /* ignore corrupt data */ }
  return { tx: [], budget: 0, currency: 'MYR' };
}
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const money = n => new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency }).format(n);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function monthTx() {
  const m = $('month').value, q = $('search').value.toLowerCase(), c = $('filterCat').value;
  return state.tx
    .filter(t => t.date.startsWith(m) && (!c || t.category === c) && (!q || t.note.toLowerCase().includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function render() {
  const all = state.tx.filter(t => t.date.startsWith($('month').value));
  const income = all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const bal = income - expense;

  $('balance').textContent = money(bal);
  $('balance').classList.toggle('neg', bal < 0);
  $('income').textContent = money(income);
  $('expense').textContent = money(expense);

  // category share of spending
  const byCat = {};
  all.filter(t => t.type === 'expense').forEach(t => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  $('stack').innerHTML = cats.map(([c, v], i) =>
    `<div style="width:${v / expense * 100}%;background:${COLORS[i % COLORS.length]}" title="${esc(c)}: ${money(v)}"></div>`).join('');
  $('legend').innerHTML = cats.map(([c, v], i) =>
    `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(c)} ${money(v)}</span>`).join('') || '<span class="meta">No spending yet</span>';

  // budget meter
  const pct = state.budget > 0 ? Math.min(expense / state.budget * 100, 100) : 0;
  $('meterFill').style.width = pct + '%';
  $('meterFill').classList.toggle('over', state.budget > 0 && expense > state.budget);
  $('budgetText').textContent = state.budget > 0
    ? (expense > state.budget
        ? `Over budget by ${money(expense - state.budget)}`
        : `${money(state.budget - expense)} left of ${money(state.budget)}`)
    : 'Set a limit to track your spending.';

  // list
  const rows = monthTx();
  $('empty').hidden = rows.length > 0;
  $('items').innerHTML = rows.map(t => `
    <li>
      <div><div class="name">${esc(t.note || t.category)}</div><div class="meta">${t.category} · ${t.date}</div></div>
      <span class="amt ${t.type === 'income' ? 'in' : 'out'}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</span>
      <button data-id="${t.id}" aria-label="Delete transaction">Delete</button>
    </li>`).join('');
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseFloat($('amount').value);
  if (!(amount > 0)) return;
  state.tx.push({
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    type: document.querySelector('input[name=type]:checked').value,
    amount, category: $('category').value, date: $('date').value, note: $('note').value.trim()
  });
  save();
  $('amount').value = ''; $('note').value = '';
  $('month').value = $('date').value.slice(0, 7);
  render();
});

$('items').addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (!id) return;
  state.tx = state.tx.filter(t => t.id !== id);
  save(); render();
});

$('budget').addEventListener('input', e => { state.budget = parseFloat(e.target.value) || 0; save(); render(); });
$('currency').addEventListener('change', e => { state.currency = e.target.value; save(); render(); });
['month', 'search', 'filterCat'].forEach(id => $(id).addEventListener('input', render));

$('clear').addEventListener('click', () => {
  if (confirm('Delete all transactions? This cannot be undone.')) { state.tx = []; save(); render(); }
});

$('export').addEventListener('click', () => {
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = ['date,type,category,amount,note', ...monthTx().map(t => [t.date, t.type, t.category, t.amount, q(t.note)].join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `budget-${$('month').value}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// init
const today = new Date().toISOString().slice(0, 10);
$('date').value = today;
$('month').value = today.slice(0, 7);
$('currency').value = state.currency;
if (state.budget) $('budget').value = state.budget;
[...new Set([...document.querySelectorAll('#category option')].map(o => o.value))]
  .forEach(c => $('filterCat').insertAdjacentHTML('beforeend', `<option>${c}</option>`));
render();
