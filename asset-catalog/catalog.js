// Irremarkables asset catalog viewer. Reads catalog.json (made by
// `npm run catalog`) and renders a searchable, sortable, filterable index.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hex = (n) => (typeof n === 'string' ? n : '#' + (n >>> 0).toString(16).padStart(6, '0'));
  const num = (v) => (v == null ? '' : Number(v).toLocaleString('en-US'));
  const fmt = (v) => (Math.round(v * 100) / 100).toString();

  const state = { q: '', cat: 'all', sort: 'category', view: 'grid', open: null };
  let DATA = null, CATS = {}, ORDER = {}, LIST = [], SHOWN = [];

  // ---------- derived fields ----------
  function prep(e, i) {
    e._i = i;
    e._cat = CATS[e.category];
    if (e.size) {
      e._big = Math.max(e.size.w, e.size.h, e.size.d);
      e._h = e.size.h;
    }
    const texts = [e.name, e.id, e.sub, e._cat?.name, e.desc, e.variants, e.ranges, e.sizeNote,
      ...(e.tags || []), ...(e.notes || []),
      ...(e.rows || []).flat(), ...(e.lists || []).flatMap((l) => [l.label, ...l.items]),
      ...(e.swatches || []).flatMap((g) => [g.label, ...g.items.flatMap(([n, c]) => [n, hex(c)])]),
      ...(e.colors || []).map((c) => c.hex), ...(e.materials || []),
      ...(e.source || []).flatMap((s) => [s.file, s.symbol])];
    e._text = texts.filter(Boolean).join(' \u0001 ').toLowerCase();
    e._name = e.name.toLowerCase();
  }

  // ---------- filter + sort ----------
  const SORTS = {
    category: (a, b) => a._i - b._i,
    name: (a, b) => a._name.localeCompare(b._name),
    size: (a, b) => a._big - b._big,
    height: (a, b) => a._h - b._h,
    tris: (a, b) => a.tris - b.tris,
    duration: (a, b) => a.duration - b.duration,
    views: (a, b) => a.images.length - b.images.length,
  };
  const SORT_KEY = { size: '_big', height: '_h', tris: 'tris', duration: 'duration' };

  function apply() {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let list = LIST.filter((e) => (state.cat === 'all' || e.category === state.cat) && words.every((w) => e._text.includes(w)));
    const desc = state.sort.startsWith('-');
    const key = state.sort.replace('-', '');
    const cmp = SORTS[key] || SORTS.category;
    const field = SORT_KEY[key];
    list = list.slice().sort((a, b) => {
      if (field) {
        // assets without the measurement always go last
        const ha = a[field] != null, hb = b[field] != null;
        if (ha !== hb) return ha ? -1 : 1;
        if (!ha) return a._i - b._i;
      }
      const r = cmp(a, b);
      return (desc ? -r : r) || a._i - b._i;
    });
    // when searching, put name matches first within the chosen order's ties
    if (words.length && key === 'category') {
      const hit = (e) => words.every((w) => e._name.includes(w)) ? 0 : 1;
      list.sort((a, b) => hit(a) - hit(b) || a._i - b._i);
    }
    SHOWN = list;
    render();
    syncURL();
  }

  // ---------- rendering ----------
  const isWide = (e) => e.images[0] && e.images[0].w / e.images[0].h > 1.9;
  const isFull = (e) => e.category === 'effects' || e.id === 'env-sky';

  function factsFor(e) {
    const f = [];
    if (e.size) f.push(`${fmt(e.size.w)} × ${fmt(e.size.h)} × ${fmt(e.size.d)} m`);
    if (e.duration != null) f.push(`${fmt(e.duration)} s · ${e.frames} f`);
    if (e.tris) f.push(`${num(e.tris)} tris`);
    return f;
  }

  function card(e) {
    const img = e.images[0];
    const dots = (e.colors || []).slice(0, 6).map((c) => `<i style="background:${c.hex}" title="${c.hex}"></i>`).join('');
    return `<button class="card c-${e.category}${isWide(e) ? ' wide' : ''}" data-id="${esc(e.id)}" aria-label="${esc(e.name)}">
      <div class="thumb${isFull(e) ? ' full' : ''}">
        <img src="${esc(img.src)}" width="${img.w}" height="${img.h}" alt="" loading="lazy" decoding="async">
        ${e.images.length > 1 ? `<span class="views">${e.images.length} views</span>` : ''}
      </div>
      <div class="meta">
        <span class="nm">${esc(e.name)}</span>
        <span class="sub">${esc(e.sub || '')}</span>
        <div class="facts"><span class="fact cat">${esc(e._cat?.name || e.category)}</span>${factsFor(e).map((t) => `<span class="fact">${esc(t)}</span>`).join('')}</div>
        ${dots ? `<div class="dots" aria-hidden="true">${dots}</div>` : ''}
      </div>
    </button>`;
  }

  function row(e) {
    const img = e.images[0];
    return `<tr data-id="${esc(e.id)}" tabindex="0">
      <td class="timg"><div><img src="${esc(img.src)}" alt="" loading="lazy" decoding="async"></div></td>
      <td><b>${esc(e.name)}</b><div class="tsub">${esc(e.sub || '')}</div></td>
      <td>${esc(e._cat?.name || e.category)}</td>
      <td class="num">${e.size ? `${fmt(e.size.w)} × ${fmt(e.size.h)} × ${fmt(e.size.d)}` : '—'}</td>
      <td class="num">${e.tris ? num(e.tris) : '—'}</td>
      <td class="num">${e.duration != null ? fmt(e.duration) + ' s' : '—'}</td>
      <td class="num">${e.images.length}</td>
    </tr>`;
  }

  function render() {
    const n = SHOWN.length;
    $('count').textContent = `${n} of ${LIST.length} assets` + (state.q ? ` matching “${state.q}”` : '');
    $('empty').hidden = n > 0;
    const grid = state.view === 'grid';
    $('grid').hidden = !grid || !n;
    $('table-wrap').hidden = grid || !n;
    if (grid) $('grid').innerHTML = SHOWN.map(card).join('');
    else $('table').tBodies[0].innerHTML = SHOWN.map(row).join('');
    // table header sort indicator
    const key = state.sort.replace('-', '');
    for (const th of document.querySelectorAll('th[data-sort]')) {
      const on = th.dataset.sort === key;
      th.classList.toggle('sorted', on);
      th.classList.toggle('desc', on && state.sort.startsWith('-'));
    }
    // chips
    for (const c of document.querySelectorAll('.chip')) c.classList.toggle('on', c.dataset.cat === state.cat);
    $('catblurb').textContent = state.cat === 'all'
      ? 'Everything, in game order. Pick a category to narrow it down.'
      : CATS[state.cat]?.blurb || '';
    $('sort').value = state.sort;
    $('v-grid').classList.toggle('on', grid); $('v-grid').setAttribute('aria-pressed', grid);
    $('v-table').classList.toggle('on', !grid); $('v-table').setAttribute('aria-pressed', !grid);
  }

  function buildChips() {
    const all = `<button class="chip" data-cat="all">All <b>${LIST.length}</b></button>`;
    $('chips').innerHTML = all + DATA.categories.filter((c) => c.count).map((c) =>
      `<button class="chip" data-cat="${esc(c.id)}">${esc(c.name)} <b>${c.count}</b></button>`).join('');
  }

  // ---------- detail ----------
  let viewIdx = 0;
  function openDetail(id, push = true) {
    const e = DATA.entries.find((x) => x.id === id);
    if (!e) return;
    state.open = id;
    viewIdx = 0;
    $('d-kicker').innerHTML = `<span class="fact cat c-${e.category}">${esc(e._cat?.name || e.category)}</span><span>${esc(e.sub || '')}</span><code>${esc(e.id)}</code>`;
    $('d-name').textContent = e.name;
    $('d-tabs').innerHTML = e.images.length > 1 ? e.images.map((im, i) =>
      `<button class="tab" role="tab" data-i="${i}"><img src="${esc(im.src)}" alt="" loading="lazy">${esc(im.label)}</button>`).join('') : '';
    showView(e, 0);
    $('d-info').innerHTML = info(e);
    const dlg = $('detail');
    if (!dlg.open) dlg.showModal();
    dlg.querySelector('.d-body').scrollTop = 0;
    if (push) syncURL();
  }

  function showView(e, i) {
    viewIdx = i;
    const im = e.images[i];
    const img = $('d-img');
    img.src = im.src;
    img.alt = `${e.name}: ${im.label}`;
    $('d-stage').classList.toggle('wide', im.w / im.h > 1.2);
    for (const t of document.querySelectorAll('.tab')) t.classList.toggle('on', Number(t.dataset.i) === i);
    let dl = `<a href="${esc(im.src)}" download="${esc(im.src.split('/').pop())}">Download PNG (${im.w}×${im.h})</a>`;
    if (e.svg) dl += `<a href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(e.svg)}" download="${esc(e.id)}.svg">Download SVG</a>`;
    $('d-dl').innerHTML = dl;
  }

  function kvTable(rows) {
    return `<table class="kv"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
  }

  function info(e) {
    let h = '';
    if (e.desc) h += `<h3>About</h3><p>${esc(e.desc)}</p>`;

    const facts = [];
    if (e.size) facts.push(['Size (W × H × D)', `${fmt(e.size.w)} × ${fmt(e.size.h)} × ${fmt(e.size.d)} m` + (e.sizeNote ? `<br><span class="tsub">${esc(e.sizeNote)}</span>` : '')]);
    if (e.ranges) facts.push(['Size ranges', esc(e.ranges)]);
    if (e.tris != null) facts.push(['Triangles', num(e.tris)]);
    if (e.verts) facts.push(['Vertices', num(e.verts)]);
    if (e.materials?.length) facts.push(['Materials', e.materials.map(esc).join('<br>')]);
    for (const [k, v] of e.rows || []) facts.push([k, esc(v)]);
    if (e.variants) facts.push(['Variation', esc(e.variants)]);
    if (facts.length) h += `<h3>Details</h3>${kvTable(facts)}`;

    if (e.colors?.length) {
      h += `<h3>Dominant colours (by surface area)</h3><div class="share">${e.colors.map((c) =>
        `<span style="background:${c.hex};flex:${c.share}" title="${c.hex} · ${Math.round(c.share * 100)}%" data-copy="${c.hex}"></span>`).join('')}</div>`;
      h += `<div class="swatches">${e.colors.map((c) => swatch(c.hex, Math.round(c.share * 100) + '%')).join('')}</div>`;
    }
    for (const g of e.swatches || []) {
      h += `<h3>${esc(g.label)}</h3><div class="swatches">${g.items.map(([n, c]) => swatch(hex(c), n)).join('')}</div>`;
    }
    for (const l of e.lists || []) {
      h += `<h3>${esc(l.label)}</h3><div class="pills">${l.items.map((it) => {
        const target = l.link === 'anim' ? `anim-${it}` : null;
        return target && DATA.entries.some((x) => x.id === target)
          ? `<button class="pill" data-goto="${esc(target)}">${esc(it)}</button>`
          : `<span class="pill">${esc(it)}</span>`;
      }).join('')}</div>`;
    }
    if (e.notes?.length) h += `<h3>Notes for the reskin</h3><ul>${e.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
    if (e.tags?.length) h += `<h3>Tags</h3><div class="pills">${e.tags.map((t) => `<button class="pill" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    if (e.source?.length) {
      h += `<h3>Source</h3><ul class="src">${e.source.map((s) =>
        `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.file)}${s.line ? ':' + s.line : ''}</a> <span class="tsub">${esc(s.symbol)}</span></li>`).join('')}</ul>`;
    }
    if (e.svg) h += `<h3>SVG markup</h3><code class="svgbox">${esc(e.svg)}</code>`;
    return h;
  }

  const swatch = (h, label) => `<button class="sw" data-copy="${h}" title="Copy ${h}"><i style="background:${h}"></i><span>${esc(label)}</span><code>${h}</code></button>`;

  function step(d) {
    if (!state.open || !SHOWN.length) return;
    let i = SHOWN.findIndex((e) => e.id === state.open);
    i = (i + d + SHOWN.length) % SHOWN.length;
    openDetail(SHOWN[i].id);
  }

  function closeDetail() {
    state.open = null;
    if ($('detail').open) $('detail').close();
    syncURL();
  }

  // ---------- misc ----------
  let toastT = 0;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 1400);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(`Copied ${text}`); }
    catch { toast(text); }
  }

  function syncURL() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cat !== 'all') p.set('cat', state.cat);
    if (state.sort !== 'category') p.set('sort', state.sort);
    if (state.view !== 'grid') p.set('view', state.view);
    const qs = p.toString();
    const url = location.pathname + (qs ? '?' + qs : '') + (state.open ? '#asset=' + encodeURIComponent(state.open) : '');
    history.replaceState(null, '', url);
  }

  function readURL() {
    const p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    state.cat = CATS[p.get('cat')] ? p.get('cat') : 'all';
    state.sort = $('sort').querySelector(`option[value="${CSS.escape(p.get('sort') || '')}"]`) ? p.get('sort') : 'category';
    state.view = p.get('view') === 'table' ? 'table' : 'grid';
    $('q').value = state.q;
    const m = location.hash.match(/asset=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function csv() {
    const cols = ['id', 'name', 'category', 'type', 'width_m', 'height_m', 'depth_m', 'triangles', 'vertices', 'duration_s', 'views', 'colors', 'tags', 'image'];
    const q = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const base = new URL('.', location.href).href;
    const lines = [cols.join(',')].concat(SHOWN.map((e) => [
      e.id, e.name, e._cat?.name || e.category, e.sub, e.size?.w, e.size?.h, e.size?.d, e.tris, e.verts, e.duration,
      e.images.length, (e.colors || []).map((c) => c.hex).join(' '), (e.tags || []).join('; '), base + e.images[0].src,
    ].map(q).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'irremarkables-assets.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- events ----------
  function wire() {
    let t = 0;
    $('q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = $('q').value.trim(); apply(); }, 90); });
    $('sort').addEventListener('change', () => { state.sort = $('sort').value; apply(); });
    $('v-grid').addEventListener('click', () => { state.view = 'grid'; apply(); });
    $('v-table').addEventListener('click', () => { state.view = 'table'; apply(); });
    $('csv').addEventListener('click', csv);
    $('reset').addEventListener('click', () => { state.q = ''; state.cat = 'all'; $('q').value = ''; apply(); });
    $('chips').addEventListener('click', (ev) => {
      const c = ev.target.closest('.chip');
      if (!c) return;
      state.cat = c.dataset.cat;
      apply();
    });
    $('grid').addEventListener('click', (ev) => { const c = ev.target.closest('.card'); if (c) openDetail(c.dataset.id); });
    const tb = $('table').tBodies[0];
    tb.addEventListener('click', (ev) => { const r = ev.target.closest('tr'); if (r) openDetail(r.dataset.id); });
    tb.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const r = ev.target.closest('tr'); if (r) openDetail(r.dataset.id); } });
    $('table').tHead.addEventListener('click', (ev) => {
      const th = ev.target.closest('th[data-sort]');
      if (!th) return;
      const k = th.dataset.sort;
      const numeric = k !== 'name' && k !== 'category';
      const cur = state.sort.replace('-', '');
      state.sort = cur === k ? (state.sort.startsWith('-') ? k : '-' + k) : (numeric ? '-' + k : k);
      apply();
    });

    const dlg = $('detail');
    $('d-close').addEventListener('click', closeDetail);
    $('d-prev').addEventListener('click', () => step(-1));
    $('d-next').addEventListener('click', () => step(1));
    dlg.addEventListener('close', () => { if (state.open) { state.open = null; syncURL(); } });
    dlg.addEventListener('click', (ev) => {
      if (ev.target === dlg) return closeDetail();   // backdrop
      const tab = ev.target.closest('.tab');
      if (tab) return showView(DATA.entries.find((x) => x.id === state.open), Number(tab.dataset.i));
      const cp = ev.target.closest('[data-copy]');
      if (cp) return copy(cp.dataset.copy);
      const go = ev.target.closest('[data-goto]');
      if (go) return openDetail(go.dataset.goto);
      const tq = ev.target.closest('[data-q]');
      if (tq) { state.q = tq.dataset.q; state.cat = 'all'; $('q').value = state.q; closeDetail(); apply(); }
    });

    document.addEventListener('keydown', (ev) => {
      if (dlg.open) {
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); step(-1); }
        else if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1); }
        return;
      }
      const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
      if (ev.key === '/' && !typing) { ev.preventDefault(); $('q').focus(); $('q').select(); }
      else if (ev.key === 'Escape' && document.activeElement === $('q') && $('q').value) { $('q').value = ''; state.q = ''; apply(); }
    });
    window.addEventListener('hashchange', () => {
      const m = location.hash.match(/asset=([^&]+)/);
      if (m) openDetail(decodeURIComponent(m[1]), false);
      else if (dlg.open) closeDetail();
    });
  }

  // ---------- boot ----------
  fetch('./catalog.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      DATA = data;
      for (const c of data.categories) CATS[c.id] = c;
      LIST = data.entries;
      LIST.forEach(prep);
      const when = new Date(data.generated);
      $('stamp').innerHTML = `${LIST.length} assets · rendered ${esc(when.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }))}`
        + (data.commit ? ` from <a href="${esc(data.commit.url)}" target="_blank" rel="noopener">${esc(data.commit.short)}</a>` : '');
      buildChips();
      wire();
      const open = readURL();
      apply();
      if (open) openDetail(open, false);
    })
    .catch((err) => {
      $('count').textContent = `Could not load catalog.json (${err.message}). Run npm run catalog to generate it.`;
    });
})();
