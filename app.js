const $ = id => document.getElementById(id);
const COLORS = ['#FFC83D','#FF6B4A','#2FD4A0','#5B8CFF','#B27BFF','#FF7FB0','#8E86C9','#22C5D1'];
const CATS = ['Food','Transport','Bills','Shopping','Health','Fun','Salary','Other'];
const colorOf = c => COLORS[Math.max(0, CATS.indexOf(c))];
const KEY = 'budget-buddy-v2';
let state = load(), lastDeleted = null, toastTimer;

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.tx)) return s; } catch (e) {}
  return { tx: [], budget: 0, currency: 'MYR', hideIntro: false };
}
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const money = n => new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency }).format(n);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const uid = () => Date.now() + Math.random().toString(36).slice(2, 6);
const sum = (list, type) => list.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
const inMonth = m => state.tx.filter(t => t.date.startsWith(m));
const ym = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const todayStr = () => { const d = new Date(); return `${ym(d)}-${String(d.getDate()).padStart(2, '0')}`; };
const shift = (m, n) => { const [y, mo] = m.split('-').map(Number); return ym(new Date(y, mo - 1 + n, 1)); };
const label = m => new Date(m + '-01T00:00:00').toLocaleString(undefined, { month: 'short' });
const daysIn = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };

function insights(m, income, expense, byCat) {
  const out = [];
  const isNow = m === ym(new Date());
  const elapsed = isNow ? new Date().getDate() : daysIn(m);
  if (!expense) return ['No spending recorded this month yet. Add an expense to see insights.'];
  const [topCat, topVal] = byCat[0];
  out.push(`<b>${esc(topCat)}</b> is your biggest expense: ${money(topVal)}, or ${Math.round(topVal / expense * 100)}% of your spending.`);
  out.push(`You spend about <b>${money(expense / elapsed)}</b> per day on average.`);
  const prev = sum(inMonth(shift(m, -1)), 'expense');
  if (prev) {
    const ch = Math.round((expense - prev) / prev * 100);
    out.push(ch === 0 ? 'Your spending is the same as last month.'
      : `You spent <b>${Math.abs(ch)}% ${ch > 0 ? 'more' : 'less'}</b> than last month (${money(prev)}).`);
  }
  if (state.budget > 0 && isNow) {
    const proj = expense / elapsed * daysIn(m);
    out.push(proj > state.budget
      ? `At this pace you will spend about <b>${money(proj)}</b> by month end, which is ${money(proj - state.budget)} over your limit.`
      : `At this pace you will spend about <b>${money(proj)}</b> by month end, within your limit.`);
  }
  if (income > 0 && income < expense) out.push('You are spending more than you earn this month.');
  return out;
}

function monthTx() {
  const q = $('search').value.toLowerCase(), c = $('filterCat').value;
  return inMonth($('month').value)
    .filter(t => (!c || t.category === c) && (!q || t.note.toLowerCase().includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function render() {
  const m = $('month').value, all = inMonth(m);
  const income = sum(all, 'income'), expense = sum(all, 'expense'), bal = income - expense;
  $('intro').hidden = state.hideIntro;
  $('balance').textContent = money(bal);
  $('balance').classList.toggle('neg', bal < 0);
  $('income').textContent = money(income);
  $('expense').textContent = money(expense);
  $('rate').textContent = income > 0 ? Math.round(bal / income * 100) + '%' : '–';

  const map = {};
  all.filter(t => t.type === 'expense').forEach(t => map[t.category] = (map[t.category] || 0) + t.amount);
  const byCat = Object.entries(map).sort((a, b) => b[1] - a[1]);

  $('insights').innerHTML = insights(m, income, expense, byCat).map(s => `<li>${s}</li>`).join('');
  $('cats').innerHTML = byCat.map(([c, v]) => `
    <div class="row"><span>${esc(c)}</span>
    <div class="bar"><i style="width:${v / expense * 100}%;background:${colorOf(c)}"></i></div>
    <span>${money(v)} (${Math.round(v / expense * 100)}%)</span></div>`).join('') || '<p class="help">No spending to show.</p>';

  $('spread').innerHTML = byCat.map(([c, v]) => `<i style="flex:${v};background:${colorOf(c)}" title="${esc(c)}: ${money(v)}"></i>`).join('');
  $('legend').innerHTML = byCat.map(([c]) => `<span><b style="background:${colorOf(c)}"></b>${esc(c)}</span>`).join('') || '<span>No spending yet</span>';

  const months = [-5, -4, -3, -2, -1, 0].map(n => shift(m, n));
  const data = months.map(k => ({ k, i: sum(inMonth(k), 'income'), o: sum(inMonth(k), 'expense') }));
  const max = Math.max(1, ...data.flatMap(d => [d.i, d.o]));
  $('trend').innerHTML = data.map(d => `
    <div class="col" title="${d.k}: in ${money(d.i)}, out ${money(d.o)}">
      <div class="bars"><i class="i" style="height:${d.i / max * 100}%"></i><i class="o" style="height:${d.o / max * 100}%"></i></div>
      <small>${label(d.k)}</small></div>`).join('');

  const pct = state.budget > 0 ? Math.min(expense / state.budget * 100, 100) : 0;
  $('meterFill').style.width = pct + '%';
  $('meterFill').classList.toggle('over', state.budget > 0 && expense > state.budget);
  $('budgetText').textContent = state.budget > 0
    ? (expense > state.budget ? `Over your limit by ${money(expense - state.budget)}.` : `${money(state.budget - expense)} left of ${money(state.budget)}.`)
    : 'No limit set.';

  const rows = monthTx();
  $('empty').hidden = rows.length > 0;
  $('items').innerHTML = rows.map(t => `
    <li><i class="dot" style="background:${colorOf(t.category)}"></i><div><div class="name">${esc(t.note || t.category)}</div><div class="meta">${t.category} · ${t.date}</div></div>
    <span class="amt ${t.type === 'income' ? 'in' : 'out'}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</span>
    <button data-id="${t.id}" aria-label="Delete transaction">Delete</button></li>`).join('');
}

function toast(msg, undo) {
  $('toastMsg').textContent = msg; $('undo').hidden = !undo; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 5000);
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseFloat($('amount').value), date = $('date').value;
  $('amount').classList.remove('bad');
  if (!(amount > 0)) { $('err').textContent = 'Enter an amount greater than 0.'; $('amount').classList.add('bad'); $('amount').focus(); return; }
  if (!date) { $('err').textContent = 'Choose a date.'; return; }
  $('err').textContent = '';
  state.tx.push({ id: uid(), type: document.querySelector('input[name=type]:checked').value, amount, category: $('category').value, date, note: $('note').value.trim() });
  save(); $('amount').value = ''; $('note').value = '';
  $('month').value = date.slice(0, 7);
  render(); toast('Transaction added.');
});

$('items').addEventListener('click', e => {
  const id = e.target.dataset.id; if (!id) return;
  lastDeleted = state.tx.find(t => t.id === id);
  state.tx = state.tx.filter(t => t.id !== id);
  save(); render(); toast('Transaction deleted.', true);
});
$('undo').addEventListener('click', () => {
  if (lastDeleted) { state.tx.push(lastDeleted); lastDeleted = null; save(); render(); }
  $('toast').hidden = true;
});

$('loadSample').addEventListener('click', () => {
  const m = $('month').value, S = [
    ['income','Salary',3800,1,'Monthly salary'],['expense','Bills',950,2,'Rent share'],['expense','Food',42,4,'Groceries'],
    ['expense','Transport',60,6,'Fuel'],['expense','Fun',55,9,'Movie night'],['expense','Food',38,12,'Lunch with team'],
    ['expense','Shopping',120,15,'New shoes'],['expense','Health',45,18,'Pharmacy']];
  [0, -1, -2].forEach((n, k) => {
    const mm = shift(m, n);
    S.forEach(([type, category, a, d, note]) => state.tx.push({ id: uid(), type, category, amount: Math.round(a * (1 + (k ? (Math.random() - .5) * .4 : 0))), date: `${mm}-${String(d).padStart(2, '0')}`, note }));
  });
  state.hideIntro = true; save(); render(); toast('Sample data loaded. Use Clear all to remove it.');
});
$('dismissIntro').addEventListener('click', () => { state.hideIntro = true; save(); render(); });

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
  a.download = `budget-${$('month').value}.csv`; a.click(); URL.revokeObjectURL(a.href);
});

const today = todayStr();
$('date').value = today; $('month').value = today.slice(0, 7); $('currency').value = state.currency;
if (state.budget) $('budget').value = state.budget;
[...document.querySelectorAll('#category option')].forEach(o => $('filterCat').insertAdjacentHTML('beforeend', `<option>${o.value}</option>`));
render();
