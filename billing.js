(function(){
  const MENU = [
    { name: 'Idly (2)', price: 15 },
    { name: 'Dosa', price: 25 },
    { name: 'Puri (2)', price: 25 },
    { name: 'Pongal', price: 20 },
    { name: 'Vada (1)', price: 12 },
    { name: 'Tea', price: 10 },
    { name: 'Filter Coffee', price: 15 },
    { name: 'South Indian Meals', price: 40 },
    { name: 'Veg Rice (Lemon/Jeera)', price: 25 },
    { name: 'Vegetable Biryani', price: 50 },
    { name: 'Sambar Rice', price: 25 },
    { name: 'Tomato Rice', price: 25 },
    { name: 'Curd Rice', price: 20 },
    { name: 'Egg Puffs', price: 20 },
    { name: 'Veg Puffs', price: 18 },
    { name: 'Bajji / Pakora', price: 15 },
    { name: 'Kalan (Mushroom)', price: 30 },
    { name: 'Gulab Jamun (2)', price: 25 },
    { name: 'Ice Cream', price: 30 },
    { name: 'Sweet Lassi', price: 20 },
    { name: 'Badam Milk', price: 25 },
  ];

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const fmt = n => '₹' + (Number(n||0)).toFixed(2);
  const todayISO = () => new Date().toISOString().slice(0,10);
  const monthKey = (d) => d.slice(0,7); // YYYY-MM

  const dbKey = 'rama_canteen_sales_v1';
  const readDB = () => JSON.parse(localStorage.getItem(dbKey) || '{}');
  const writeDB = (data) => localStorage.setItem(dbKey, JSON.stringify(data));

  function initMenuDatalist() {
    const dl = $('#menu-list');
    dl.innerHTML = MENU.map(m => `<option value="${m.name}" data-price="${m.price}"></option>`).join('');
    const item = $('#item');
    item.addEventListener('change', () => {
      const match = MENU.find(m => m.name.toLowerCase() === item.value.toLowerCase());
      if (match) $('#price').value = match.price;
    });
  }

  const cart = [];

  function renderCart() {
    const tbody = $('#cart-table tbody');
    tbody.innerHTML = '';
    let sub = 0; let totalQty = 0;
    cart.forEach((row, i) => {
      const amt = row.price * row.qty; sub += amt; totalQty += row.qty;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${row.name}</td>
        <td class="right">${row.qty}</td>
        <td class="right">${fmt(row.price)}</td>
        <td class="right">${fmt(amt)}</td>
        <td><button class="btn-sm" data-del="${i}" style="background:#8e2a2a;">✕</button></td>
      `;
      tbody.appendChild(tr);
    });
    $('#subtotal').textContent = fmt(sub);
    const tax = 0; // extend if needed
    $('#tax').textContent = fmt(tax);
    $('#total').textContent = fmt(sub + tax);

    tbody.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-del'));
        cart.splice(idx, 1);
        renderCart();
      });
    });
  }

  function addItem() {
    const name = $('#item').value.trim();
    const price = parseFloat($('#price').value);
    const qty = parseInt($('#qty').value, 10);
    if (!name || isNaN(price) || isNaN(qty) || qty <= 0) return alert('Enter valid item, price and quantity');
    cart.push({ name, price, qty });
    $('#item').value = '';
    $('#qty').value = 1;
    renderCart();
  }

  function clearCart() {
    cart.splice(0, cart.length);
    renderCart();
  }

  function completeSale() {
    if (!cart.length) return alert('Cart is empty');
    const date = todayISO();
    const items = cart.map(c => ({ name: c.name, price: c.price, qty: c.qty, amount: c.price*c.qty }));
    const total = items.reduce((a,b)=>a+b.amount,0);
    // persist
    const db = readDB();
    const key = monthKey(date);
    if (!db[key]) db[key] = { days: {} };
    if (!db[key].days[date]) db[key].days[date] = { bills: [] };
    const billNo = (db[key].days[date].bills.length + 1);
    db[key].days[date].bills.push({ billNo, date, items, total });
    writeDB(db);
    // print-friendly view
    printInvoice({ billNo, date, items, total });
    clearCart();
    alert('Sale saved to monthly summary');
  }

  function printInvoice(bill) {
    const lines = bill.items.map(i => `<tr><td>${i.name}</td><td class="right">${i.qty}</td><td class="right">${fmt(i.price)}</td><td class="right">${fmt(i.amount)}</td></tr>`).join('');
    const html = `
      <html><head><title>Invoice #${bill.billNo}</title>
      <style>
        body{font-family:Poppins,Arial,sans-serif;padding:20px}
        h2{margin:0 0 8px}
        .muted{color:#666}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th,td{padding:6px;border-bottom:1px solid #ddd;text-align:left}
        .right{text-align:right}
      </style></head>
      <body>
        <h2>Rama Canteen Service - Invoice</h2>
        <div class="muted">Bill #: ${bill.billNo} | Date: ${bill.date}</div>
        <table>
          <thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
          <tbody>${lines}</tbody>
          <tfoot><tr><td colspan="3" class="right"><strong>Total</strong></td><td class="right"><strong>${fmt(bill.total)}</strong></td></tr></tfoot>
        </table>
        <p class="muted">Thank you! Visit again.</p>
        <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 300);}</script>
      </body></html>`;
    const w = window.open('', 'PRINT', 'height=600,width=800');
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  function loadSummary(ym) {
    // ym: 'YYYY-MM'
    const db = readDB();
    const data = db[ym];
    const tbody = $('#summary-table tbody');
    tbody.innerHTML = '';
    let totalQty = 0; let totalRevenue = 0; let totalBills = 0;
    if (!data) {
      $('#sum-qty').textContent = '0';
      $('#sum-revenue').textContent = fmt(0);
      return;
    }
    const days = Object.keys(data.days).sort();
    days.forEach(d => {
      const bills = data.days[d].bills || [];
      let dayQty = 0; let dayRevenue = 0;
      bills.forEach(b => {
        totalBills += 1;
        b.items.forEach(i => { dayQty += i.qty; dayRevenue += i.amount; });
      });
      totalQty += dayQty; totalRevenue += dayRevenue;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d}</td><td>${bills.length}</td><td class="right">${dayQty}</td><td class="right">${fmt(dayRevenue)}</td>`;
      tbody.appendChild(tr);
    });
    $('#sum-qty').textContent = String(totalQty);
    $('#sum-revenue').textContent = fmt(totalRevenue);
  }

  function exportCSV(ym) {
    const db = readDB();
    const data = db[ym];
    if (!data) return alert('No data for selected month');
    const rows = [['BillNo','Date','Item','Qty','Rate','Amount','TotalBill']];
    Object.values(data.days).forEach(day => {
      day.bills.forEach(b => {
        b.items.forEach((i, idx) => {
          rows.push([b.billNo, b.date, i.name, i.qty, i.price, i.amount, idx===0?b.total:'']);
        });
      });
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rama-canteen-${ym}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function init() {
    // Bill date pill
    const d = new Date();
    const ds = d.toLocaleString(undefined, { year:'numeric', month:'short', day:'2-digit'});
    const pill = document.getElementById('bill-date-pill');
    if (pill) pill.textContent = ds;

    initMenuDatalist();
    renderCart();
    $('#add-item').addEventListener('click', addItem);
    $('#clear-cart').addEventListener('click', clearCart);
    $('#complete-sale').addEventListener('click', completeSale);
    $('#print-bill').addEventListener('click', () => {
      if (!cart.length) return alert('Cart is empty');
      const date = todayISO();
      const items = cart.map(c => ({ name: c.name, price: c.price, qty: c.qty, amount: c.price*c.qty }));
      const total = items.reduce((a,b)=>a+b.amount,0);
      printInvoice({ billNo: 'TEMP', date, items, total });
    });

    // Summary defaults to current month
    const m = document.getElementById('month');
    const ym = new Date().toISOString().slice(0,7);
    m.value = ym;
    loadSummary(ym);
    document.getElementById('refresh-summary').addEventListener('click', () => loadSummary(m.value));
    document.getElementById('export-summary').addEventListener('click', () => exportCSV(m.value));
  }

  window.addEventListener('DOMContentLoaded', init);
})();
