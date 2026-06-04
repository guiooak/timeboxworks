'use strict';
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const libInfo = (k) => LIBS[k] || { label: k, color: '#64748b' };
const medals = ['🥇', '🥈', '🥉'];

/* ---------------- header ---------------- */
function renderMeta() {
  const m = META, c = $('#metaChips');
  const chips = [
    `Node <b>${m.node}</b>`, `${m.platform}`, `${m.date}`,
    `Luxon <b>${m.versions.luxon}</b>`, `date-fns <b>${m.versions['date-fns']}</b>`,
    `Day.js <b>${m.versions.dayjs}</b>`, `Moment <b>${m.versions.moment}</b>`,
  ];
  chips.forEach((t) => c.appendChild(el('span', 'chip', t)));

  const podium = $('#podium');
  VERDICT.forEach((v, i) => {
    const info = libInfo(v.lib);
    const card = el('div', 'p-card');
    card.style.setProperty('--bar', info.color);
    card.innerHTML = `<div class="medal">${medals[i]}</div>
      <div class="p-lib" style="color:${info.color}">${info.label}</div>
      <div class="p-tag">${v.headline}</div>`;
    podium.appendChild(card);
  });
}

/* ---------------- generic bar chart ---------------- */
/* rows: [{lib, value}], sorted desc. scale: 'linear' | 'log' */
function barChart(container, dataObj, opts = {}) {
  const scale = opts.scale || 'linear';
  const onlyFinalists = opts.finalists;
  let entries = Object.entries(dataObj).map(([lib, value]) => ({ lib, value }));
  if (onlyFinalists) entries = entries.filter((e) => FINALISTS.includes(e.lib));
  entries.sort((a, b) => b.value - a.value);
  const max = Math.max(...entries.map((e) => e.value));
  const top = entries[0].value;
  const logMax = Math.log10(max + 1);

  entries.forEach((e, idx) => {
    const info = libInfo(e.lib);
    const pct = scale === 'log'
      ? (Math.log10(e.value + 1) / logMax) * 100
      : (e.value / max) * 100;
    const row = el('div', 'bar-row');
    const medal = idx < 3 ? `<span class="medal-mini">${medals[idx]}</span>` : '';
    row.innerHTML = `
      <div class="b-lib"><span class="dot" style="background:${info.color}"></span>${info.label}</div>
      <div class="bar-track"><div class="bar-fill" data-w="${Math.max(pct, 2)}" style="background:linear-gradient(90deg, ${info.color}, ${info.color}cc)"></div></div>
      <div class="bar-val">${medal} ${fmt(e.value)}<span class="pct">${((e.value / top) * 100).toFixed(0)}%</span></div>`;
    container.appendChild(row);
  });
}

/* ---------------- bundle ---------------- */
let bundleMetric = 'gzip';
function renderBundle() {
  const c = $('#bundleChart'); c.innerHTML = '';
  const data = {};
  BUNDLE.rows.forEach((r) => { data[r.lib] = r[bundleMetric]; });
  // lower is better → invert sort by rendering ascending with custom value display
  const entries = Object.entries(data).sort((a, b) => a[1] - b[1]);
  const max = Math.max(...entries.map((e) => e[1]));
  entries.forEach(([lib, value], idx) => {
    const info = libInfo(lib);
    const pct = (value / max) * 100;
    const medal = idx < 3 ? `<span class="medal-mini">${medals[idx]}</span>` : '';
    const row = el('div', 'bar-row');
    row.innerHTML = `
      <div class="b-lib"><span class="dot" style="background:${info.color}"></span>${info.label}</div>
      <div class="bar-track"><div class="bar-fill" data-w="${Math.max(pct, 2)}" style="background:linear-gradient(90deg, ${info.color}, ${info.color}cc)"></div></div>
      <div class="bar-val">${medal} ${value} KB</div>`;
    c.appendChild(row);
  });
  animate(c);
}

/* ---------------- core & interval groups ---------------- */
let coreScale = 'linear';
function renderGroups(targetSel, cfg, scale) {
  const host = $(targetSel); host.innerHTML = '';
  cfg.groups.forEach((g) => {
    const wrap = el('div', 'chart chart-group');
    wrap.appendChild(el('h3', null, g.title));
    if (g.note) wrap.appendChild(el('p', 'g-note', g.note));
    const bars = el('div');
    barChart(bars, g.data, { scale });
    wrap.appendChild(bars);
    host.appendChild(wrap);
  });
  animate(host);
}

/* ---------------- DST ---------------- */
function renderDst() {
  const host = $('#dstTable'); host.innerHTML = '';
  const order = ['luxon', 'date-fns', 'dayjs', 'moment', 'native-naive', 'native-intl'];
  const tw = el('div', 'tablewrap');
  let html = '<table><thead><tr><th>Library</th>';
  DST.scenarios.forEach((s) => { html += `<th>${s.title}</th>`; });
  html += '<th>Requires</th></tr></thead><tbody>';

  // truth row
  html += '<tr class="truth-row"><td>✔ TRUE elapsed</td>';
  DST.scenarios.forEach((s) => { html += `<td>${s.truth}h <span style="opacity:.6">(wall ${s.wall})</span></td>`; });
  html += '<td>—</td></tr>';

  order.forEach((k) => {
    const r = DST.results[k];
    const label = r.label || libInfo(k).label;
    html += `<tr><td class="lib-cell">${label}</td>`;
    DST.scenarios.forEach((s) => {
      const v = r[s.id], ok = v === s.truth;
      html += `<td class="${ok ? 'ok' : 'no'}">${ok ? '✅' : '❌'} ${v}h</td>`;
    });
    html += `<td class="needs">${r.needs}</td></tr>`;
  });
  html += '</tbody></table>';
  tw.innerHTML = html;
  host.appendChild(tw);
}

/* ---------------- scorecard ---------------- */
function renderScorecard() {
  const host = $('#scorecard'); host.innerHTML = '';
  const tw = el('div', 'score-grid');
  let html = '<table><thead><tr><th>Dimension</th>';
  FINALISTS.forEach((l) => { html += `<th style="color:${libInfo(l).color}">${libInfo(l).label}</th>`; });
  html += '</tr></thead><tbody>';
  SCORECARD.dimensions.forEach((dim, i) => {
    html += `<tr><td>${dim}</td>`;
    FINALISTS.forEach((l) => {
      const s = SCORECARD.scores[l][i];
      const note = (SCORECARD.notes[l] && SCORECARD.notes[l][dim]) || '';
      const dotTxt = s === 3 ? 'Best' : s === 2 ? 'OK' : 'Weak';
      html += `<td class="score-cell"><span class="pip s${s}" title="${note.replace(/"/g, '&quot;')}">${dotTxt}</span></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  tw.innerHTML = html;
  host.appendChild(tw);
}

/* ---------------- verdict ---------------- */
function renderVerdict() {
  const host = $('#verdictGrid'); host.innerHTML = '';
  VERDICT.forEach((v) => {
    const info = libInfo(v.lib);
    const card = el('div', 'v-card');
    card.style.setProperty('--bar', info.color);
    card.innerHTML = `
      <div class="v-head"><span class="v-medal">${v.medal}</span>
        <span class="v-lib" style="color:${info.color}">${info.label}</span></div>
      <p class="v-headline">${v.headline}</p>
      <p class="v-body">${v.body}</p>`;
    host.appendChild(card);
  });
}

/* ---------------- bar fill animation ---------------- */
function animate(scope) {
  requestAnimationFrame(() => {
    scope.querySelectorAll('.bar-fill').forEach((b) => { b.style.width = b.dataset.w + '%'; });
  });
}

/* ---------------- tabs & controls ---------------- */
function setupTabs() {
  const buttons = document.querySelectorAll('.tabs button');
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    const panel = $('#' + b.dataset.tab);
    panel.classList.add('active');
    // re-trigger bar animation for the now-visible panel
    panel.querySelectorAll('.bar-fill').forEach((f) => { f.style.width = '0'; });
    animate(panel);
    // Scroll to the nav's flow position so it pins to the top with the panel below it.
    // Use offsetTop (not getBoundingClientRect) so it works even when already pinned.
    window.scrollTo({ top: $('.tabs').offsetTop, behavior: 'smooth' });
  }));
}

function setupControls() {
  document.querySelectorAll('#bundle .seg').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#bundle .seg').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); bundleMetric = b.dataset.metric; renderBundle();
  }));
  document.querySelectorAll('#core .seg').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#core .seg').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); coreScale = b.dataset.scale; renderGroups('#coreCharts', CORE, coreScale);
  }));
}

/* ---------------- boot ---------------- */
renderMeta();
renderBundle();
renderGroups('#coreCharts', CORE, coreScale);
renderGroups('#intervalCharts', INTERVAL, 'linear');
renderDst();
renderScorecard();
renderVerdict();
setupTabs();
setupControls();
