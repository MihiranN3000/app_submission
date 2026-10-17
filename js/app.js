/* LankaRide — single-page app: router, views and UI components. */
(function () {
  'use strict';

  /* =========================================================
     Utilities
     ========================================================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cityName = id => (Data.CITY[id] ? Data.CITY[id].name : id);
  const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const fmtDur = m => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  const fmtLKR = n => 'LKR ' + Math.round(n).toLocaleString('en-US');
  const fmtDay = s => Data.parseDate(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtLongDay = s => Data.parseDate(s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const today = () => Data.fmtDate(new Date());
  const maxDate = () => Data.fmtDate(Data.addDays(new Date(), 60));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function loginRedirect() {
    return '#/login?next=' + encodeURIComponent(location.hash || '#/');
  }
  function tripStatus(trip, now = new Date()) {
    if (now < trip.dep) return (trip.dep - now) < 30 * 60000 ? { key: 'boarding', label: 'Boarding soon' } : { key: 'scheduled', label: 'Scheduled' };
    if (now < trip.arr) return { key: 'live', label: 'On the road' };
    return { key: 'done', label: 'Arrived' };
  }
  function seatsLeft(trip) {
    const taken = Data.seededOccupied(trip);
    Store.bookedSeats(trip.id).forEach(s => taken.add(s));
    return trip.seatsTotal - taken.size;
  }

  /* =========================================================
     Icons
     ========================================================= */
  const P = {
    swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    seat: '<path d="M6 4h8a2 2 0 0 1 2 2v7H6z"/><path d="M4 13h14a2 2 0 0 1 2 2v2H4z"/><path d="M6 17v3M18 17v3"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 12 18 6"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v3M16 18v3"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    gauge: '<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 13 4-5"/>',
    steering: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M3.5 10.5h6M14.5 10.5h6M12 14.5V21"/>',
  };
  const ico = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;

  /* =========================================================
     Toasts & modals
     ========================================================= */
  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${ico(type === 'error' ? 'close' : 'check')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3600);
  }

  function openModal(html, { onMount, onClose, wide } = {}) {
    const root = $('#modalRoot');
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-backdrop" data-close></div>
      <div class="modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
        <button class="icon-btn modal-x" data-close aria-label="Close">${ico('close')}</button>${html}</div>`;
    root.appendChild(wrap);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => wrap.classList.add('show'));
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      wrap.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        wrap.remove();
        if (!root.children.length) document.body.classList.remove('modal-open');
        onClose && onClose();
      }, 300);
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    onMount && onMount(wrap, close);
    return close;
  }

  /* =========================================================
     City picker (searchable combobox)
     ========================================================= */
  function cityPicker(name, label, value, placeholder, icon) {
    const c = Data.CITY[value];
    return `<div class="picker" data-picker="${name}" data-value="${c ? c.id : ''}">
      <span class="field-ico">${ico(icon)}</span>
      <label class="picker-label" for="pk-${name}">${label}</label>
      <input id="pk-${name}" type="text" placeholder="${placeholder}" autocomplete="off" spellcheck="false"
        value="${c ? esc(c.name) : ''}" role="combobox" aria-expanded="false" aria-autocomplete="list">
      <ul class="picker-list" role="listbox"></ul>
    </div>`;
  }

  function initPickers(root) {
    $$('[data-picker]', root).forEach(pk => {
      const input = $('input', pk), list = $('ul', pk);
      let items = [], active = -1;
      const setValue = id => {
        pk.dataset.value = id || '';
        input.value = id ? Data.CITY[id].name : '';
        pk.dispatchEvent(new CustomEvent('change', { bubbles: true }));
      };
      const open = () => {
        const q = input.value.trim().toLowerCase();
        const cur = Data.CITY[pk.dataset.value];
        const showAll = !q || (cur && cur.name.toLowerCase() === q);
        items = Data.CITIES.filter(c => showAll || c.name.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q))
          .sort((a, b) => (showAll ? a.name.localeCompare(b.name) : a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q)));
        active = items.length ? 0 : -1;
        list.innerHTML = items.length
          ? items.map((c, i) => `<li role="option" data-id="${c.id}" class="${i === active ? 'active' : ''}">
              ${ico('pin')}<span><b>${esc(c.name)}</b><small>${esc(c.sub)}</small></span></li>`).join('')
          : '<li class="empty">No matching town</li>';
        pk.classList.add('open');
        input.setAttribute('aria-expanded', 'true');
      };
      const close = () => { pk.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); };
      const highlight = () => {
        $$('li', list).forEach((li, i) => li.classList.toggle('active', i === active));
        const el = list.children[active];
        el && el.scrollIntoView({ block: 'nearest' });
      };
      input.addEventListener('focus', () => { input.select(); open(); });
      input.addEventListener('input', open);
      input.addEventListener('keydown', e => {
        if (!pk.classList.contains('open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) open();
        if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); highlight(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); highlight(); }
        else if (e.key === 'Enter' && pk.classList.contains('open')) {
          e.preventDefault();
          if (items[active]) { setValue(items[active].id); close(); focusNext(pk); }
        } else if (e.key === 'Escape') close();
      });
      list.addEventListener('mousedown', e => {
        const li = e.target.closest('li[data-id]');
        if (!li) return;
        e.preventDefault();
        setValue(li.dataset.id);
        close();
        focusNext(pk);
      });
      input.addEventListener('blur', () => {
        const q = input.value.trim().toLowerCase();
        const exact = Data.CITIES.find(c => c.name.toLowerCase() === q);
        if (exact) { if (exact.id !== pk.dataset.value) setValue(exact.id); }
        else if (!q) setValue('');
        else input.value = pk.dataset.value ? Data.CITY[pk.dataset.value].name : '';
        close();
      });
    });
  }
  function focusNext(pk) {
    const form = pk.closest('form');
    if (!form) return;
    const fields = $$('input, button[type=submit]', form).filter(el => !el.disabled && el.offsetParent);
    const i = fields.indexOf($('input', pk));
    const next = fields[i + 1];
    if (next && next.closest('[data-picker]') && !next.closest('[data-picker]').dataset.value) setTimeout(() => next.focus(), 0);
  }

  /* Search form shared by home, results, schedules and fares */
  function searchForm({ from = '', to = '', date = today(), action = 'search', withDate = true, submit = 'Search buses', variant = '' } = {}) {
    return `<form class="search ${variant}" data-search="${action}" novalidate>
      <div class="search-fields">
        ${cityPicker('from', 'From', from, 'Starting point', 'pin')}
        <button type="button" class="swap" aria-label="Swap starting point and destination">${ico('swap')}</button>
        ${cityPicker('to', 'To', to, 'Destination', 'flag')}
        ${withDate ? `<div class="date-field">
          <span class="field-ico">${ico('calendar')}</span>
          <label class="picker-label" for="sf-date">Date</label>
          <input id="sf-date" type="date" name="date" value="${esc(date)}" min="${today()}" max="${maxDate()}">
        </div>` : ''}
      </div>
      <button type="submit" class="btn btn-primary search-btn">${ico('search')}<span>${submit}</span></button>
    </form>`;
  }
  function initSearchForms(root) {
    $$('form[data-search]', root).forEach(form => {
      const from = $('[data-picker=from]', form), to = $('[data-picker=to]', form);
      $('.swap', form).addEventListener('click', e => {
        const a = from.dataset.value, b = to.dataset.value;
        const setP = (pk, id) => { pk.dataset.value = id; $('input', pk).value = id ? Data.CITY[id].name : ''; };
        setP(from, b); setP(to, a);
        e.currentTarget.classList.remove('spin'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('spin');
      });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const f = from.dataset.value, t = to.dataset.value;
        if (!f) { shake(from); $('input', from).focus(); return toast('Choose a starting point', 'error'); }
        if (!t) { shake(to); $('input', to).focus(); return toast('Choose a destination', 'error'); }
        if (f === t) { shake(to); return toast('Starting point and destination must be different', 'error'); }
        const params = new URLSearchParams({ from: f, to: t });
        const dateEl = $('input[type=date]', form);
        if (dateEl) {
          let d = dateEl.value || today();
          if (d < today()) d = today();
          params.set('date', d);
        }
        go(`#/${form.dataset.search}?${params}`);
      });
    });
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  /* =========================================================
     Shared fragments
     ========================================================= */
  const classTag = cls => `<span class="tag tag-${cls}">${Data.CLASSES[cls].label}</span>`;

  function pageHead(eyebrow, title, sub = '') {
    return `<div class="page-head">
      <span class="eyebrow"><span class="dot"></span>${eyebrow}</span>
      <h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}
    </div>`;
  }

  function emptyState(icon, title, text, action = '') {
    return `<div class="empty-state reveal"><div class="empty-ico">${ico(icon)}</div><h3>${title}</h3><p class="muted">${text}</p>${action}</div>`;
  }

  function ticketHTML(b) {
    const seats = Store.activeSeats(b);
    const code = b.ref.split('').map(ch => ch.charCodeAt(0));
    const bars = Array.from({ length: 42 }, (_, i) => {
      const w = ((code[i % code.length] * (i + 3)) % 3) + 1;
      return `<i style="width:${w}px"></i>`;
    }).join('');
    return `<div class="ticket">
      <div class="ticket-main">
        <div class="ticket-top">
          <span class="ticket-brand">Lanka<b>Ride</b></span>
          <span class="ticket-ref">${esc(b.ref)}</span>
        </div>
        <div class="ticket-route">
          <div><small>From</small><strong>${esc(cityName(b.from))}</strong><span>${fmtTime(b.dep)}</span></div>
          <div class="ticket-bus">${ico('bus')}</div>
          <div class="right"><small>To</small><strong>${esc(cityName(b.to))}</strong><span>${fmtTime(b.arr)}</span></div>
        </div>
        <div class="ticket-grid">
          <div><small>Date</small><b>${fmtDay(b.date)}</b></div>
          <div><small>Seats</small><b>${seats.length ? seats.join(', ') : '—'}</b></div>
          <div><small>Class</small><b>${Data.CLASSES[b.cls].label}</b></div>
          <div><small>Bus</small><b>${esc(b.busNo)}</b></div>
          <div><small>Route</small><b>${esc(b.routeNo)}</b></div>
          <div><small>Passenger</small><b>${esc(b.passenger.name)}</b></div>
        </div>
      </div>
      <div class="ticket-stub">
        <small>Total paid</small>
        <strong>${fmtLKR(b.seats.length * b.fare)}</strong>
        <div class="barcode">${bars}</div>
        <small class="mono">${esc(b.ref)}</small>
      </div>
    </div>`;
  }

  /* =========================================================
     Views
     ========================================================= */
  const Views = {};

  /* ---------- Home ---------- */
  Views[''] = {
    title: 'Bus schedules, tickets & live tracking',
    render() {
      const routeCount = Data.CITIES.length * (Data.CITIES.length - 1);
      const popular = Data.POPULAR.map(([a, b], i) => {
        const trips = Data.tripsFor(a, b, today());
        const r = Data.route(a, b);
        const minFare = Math.min(...trips.map(t => t.fare));
        const minDur = Math.min(...trips.map(t => t.durMin));
        return `<a class="route-card reveal" style="--d:${i * 70}ms" href="#/search?from=${a}&to=${b}&date=${today()}">
          <div class="route-card-top"><span class="muted small">${trips.length} daily departures</span>${ico('arrow', 'go')}</div>
          <h3>${cityName(a)} <span class="red">→</span> ${cityName(b)}</h3>
          <div class="route-card-meta"><span>${ico('route')} ${r.km} km</span><span>${ico('clock')} from ${fmtDur(minDur)}</span></div>
          <div class="route-card-price"><small>from</small> ${fmtLKR(minFare)}</div>
        </a>`;
      }).join('');

      return `
      <section class="hero">
        <div class="hero-bg" aria-hidden="true">
          <div class="glow g1"></div><div class="glow g2"></div><div class="grid-lines"></div>
          <div class="road"><div class="road-dash"></div><div class="hero-bus">${ico('bus')}</div></div>
        </div>
        <div class="container hero-content">
          <span class="eyebrow hero-in" style="--d:0ms"><span class="dot live"></span>Live across ${Data.CITIES.length} towns in Sri Lanka</span>
          <h1 class="hero-title">
            <span class="line"><span style="--d:80ms">Travel Sri Lanka</span></span>
            <span class="line"><span class="red" style="--d:200ms">on time.</span></span>
          </h1>
          <p class="hero-sub hero-in" style="--d:320ms">Check schedules, compare fares, choose your seat and follow your bus live, all in one place.</p>
          <div class="hero-in" style="--d:440ms">${searchForm({ from: 'colombo' , variant: 'search-hero' })}</div>
          <div class="quick hero-in" style="--d:560ms">
            <span class="muted small">Popular:</span>
            ${Data.POPULAR.slice(0, 4).map(([a, b]) => `<a class="chip" href="#/search?from=${a}&to=${b}&date=${today()}">${cityName(a)} → ${cityName(b)}</a>`).join('')}
          </div>
        </div>
      </section>

      <section class="stats">
        <div class="container stats-grid">
          <div class="stat reveal"><strong data-count="${Data.CITIES.length}">0</strong><span>Towns connected</span></div>
          <div class="stat reveal" style="--d:80ms"><strong data-count="${routeCount}">0</strong><span>Routes searchable</span></div>
          <div class="stat reveal" style="--d:160ms"><strong data-count="4">0</strong><span>Bus classes</span></div>
          <div class="stat reveal" style="--d:240ms"><strong>24/7</strong><span>Live tracking</span></div>
        </div>
      </section>

      <section class="features light">
        <div class="container">
          <div class="section-head reveal">
            <span class="eyebrow dark"><span class="dot"></span>Everything for the journey</span>
            <h2>From timetable to <span class="red">your seat</span> in a minute.</h2>
          </div>
          <div class="feature-grid">
            ${[
              ['clock', 'Schedules', 'Every departure on your route, with times, duration and live status.', '#/schedules'],
              ['coins', 'Fares', 'Compare Normal, Semi-Luxury, Luxury and Expressway prices instantly.', '#/fares'],
              ['seat', 'Seat booking', 'Pick the exact seats you want on an interactive bus layout.', '#/'],
              ['radar', 'Live tracking', 'See where your bus is on the map, its speed and arrival time.', '#/track'],
            ].map(([i, t, d, h], k) => `<a href="${h}" class="feature reveal" style="--d:${k * 80}ms">
                <div class="feature-ico">${ico(i)}</div><h3>${t}</h3><p>${d}</p><span class="feature-go">Open ${ico('arrow')}</span></a>`).join('')}
          </div>
        </div>
      </section>

      <section class="popular">
        <div class="container">
          <div class="section-head reveal">
            <span class="eyebrow"><span class="dot"></span>Most travelled</span>
            <h2>Popular routes</h2>
          </div>
          <div class="route-grid">${popular}</div>
        </div>
      </section>

      <section class="cta">
        <div class="container cta-inner reveal">
          <div><h2>Your seat is waiting.</h2><p>Create a free account to book, manage and cancel tickets anytime.</p></div>
          ${Store.current()
            ? `<a href="#/bookings" class="btn btn-light">My bookings ${ico('arrow')}</a>`
            : `<a href="#/register" class="btn btn-light">Create account ${ico('arrow')}</a>`}
        </div>
      </section>`;
    },
    mount(q, root) { initPickers(root); initSearchForms(root); },
  };

  /* ---------- Search results ---------- */
  Views.search = {
    title: 'Available buses',
    render(q) {
      const from = q.get('from'), to = q.get('to');
      let date = q.get('date') || today();
      if (date < today()) date = today();
      if (!Data.CITY[from] || !Data.CITY[to] || from === to) {
        return `<section class="page"><div class="container">
          ${pageHead('Search', 'Where are you headed?')}
          ${searchForm({ from, to, date })}
        </div></section>`;
      }
      const r = Data.route(from, to);
      const days = Array.from({ length: 7 }, (_, i) => Data.fmtDate(Data.addDays(new Date(), i)));
      return `<section class="page">
        <div class="container">
          <div class="results-head reveal">
            <div>
              <span class="eyebrow"><span class="dot"></span>${fmtLongDay(date)}</span>
              <h1>${cityName(from)} <span class="red">→</span> ${cityName(to)}</h1>
              <p class="muted">${r.km} km · via ${r.path.length > 2 ? r.path.slice(1, -1).map(cityName).join(', ') : 'direct road'}</p>
            </div>
          </div>
          ${searchForm({ from, to, date, variant: 'search-compact', submit: 'Update' })}
          <div class="day-strip">
            ${days.map(d => `<a class="day ${d === date ? 'active' : ''}" href="#/search?from=${from}&to=${to}&date=${d}">
              <small>${Data.parseDate(d).toLocaleDateString('en-GB', { weekday: 'short' })}</small>
              <b>${Data.parseDate(d).getDate()}</b></a>`).join('')}
          </div>
          <div class="results-layout">
            <aside class="filters card">
              <h4>Bus class</h4>
              <div class="filter-group" data-filter="cls">
                ${Object.values(Data.CLASSES).map(c => `<label class="check"><input type="checkbox" value="${c.id}" checked><span></span>${c.label}</label>`).join('')}
              </div>
              <h4>Departure time</h4>
              <div class="filter-group" data-filter="time">
                ${[['morning', 'Morning', 'before 12:00'], ['afternoon', 'Afternoon', '12:00 – 17:00'], ['evening', 'Evening & night', 'after 17:00']]
                  .map(([v, l, s]) => `<label class="check"><input type="checkbox" value="${v}" checked><span></span>${l}<small>${s}</small></label>`).join('')}
              </div>
              <h4>Sort by</h4>
              <select class="select" id="sortBy">
                <option value="dep">Earliest departure</option>
                <option value="fare">Lowest fare</option>
                <option value="dur">Shortest trip</option>
              </select>
            </aside>
            <div>
              <div class="results-count muted" id="resultsCount"></div>
              <div class="trip-list" id="tripList"></div>
            </div>
          </div>
        </div>
      </section>`;
    },
    mount(q, root) {
      initPickers(root); initSearchForms(root);
      const list = $('#tripList', root);
      if (!list) return;
      let date = q.get('date') || today();
      if (date < today()) date = today();
      const trips = Data.tripsFor(q.get('from'), q.get('to'), date);
      const draw = () => {
        const cls = $$('[data-filter=cls] input:checked', root).map(i => i.value);
        const times = $$('[data-filter=time] input:checked', root).map(i => i.value);
        const sort = $('#sortBy', root).value;
        const now = new Date();
        const slot = t => (t.dep.getHours() < 12 ? 'morning' : t.dep.getHours() < 17 ? 'afternoon' : 'evening');
        const shown = trips.filter(t => cls.includes(t.cls) && times.includes(slot(t)))
          .sort((a, b) => {
            const gone = (a.dep <= now) - (b.dep <= now);
            if (gone) return gone;
            return sort === 'fare' ? a.fare - b.fare || a.dep - b.dep : sort === 'dur' ? a.durMin - b.durMin : a.dep - b.dep;
          });
        $('#resultsCount', root).textContent = `${shown.length} bus${shown.length === 1 ? '' : 'es'} found`;
        list.innerHTML = shown.length ? shown.map((t, i) => tripCard(t, i, now)).join('')
          : emptyState('bus', 'No buses match your filters', 'Try including more bus classes or departure times.');
        observeReveals(list);
      };
      root.addEventListener('change', e => { if (e.target.closest('.filters')) draw(); });
      draw();
    },
  };

  function tripCard(t, i, now) {
    const C = Data.CLASSES[t.cls];
    const gone = t.dep <= now;
    const left = seatsLeft(t);
    const st = tripStatus(t, now);
    return `<article class="trip-card reveal ${gone ? 'gone' : ''}" style="--d:${Math.min(i, 8) * 50}ms">
      <div class="trip-main">
        <div class="trip-time"><strong>${fmtTime(t.dep)}</strong><span>${cityName(t.from)}</span></div>
        <div class="trip-line"><span>${fmtDur(t.durMin)}</span><i></i><span>${t.km} km</span></div>
        <div class="trip-time right"><strong>${fmtTime(t.arr)}</strong><span>${cityName(t.to)}</span></div>
      </div>
      <div class="trip-meta">
        ${classTag(t.cls)}
        <span class="meta">${ico('bus')} ${esc(t.busNo)}</span>
        <span class="meta">${ico('route')} Route ${esc(t.routeNo)}</span>
        <span class="meta">${t.operator}</span>
        ${C.perks.map(p => `<span class="perk">${p}</span>`).join('')}
      </div>
      <div class="trip-side">
        <div class="price">${fmtLKR(t.fare)}<small>per seat</small></div>
        ${gone
          ? `<span class="status status-${st.key}">${st.label}</span>
             ${st.key === 'live' ? `<a class="btn btn-ghost btn-sm" href="#/track?trip=${t.id}">${ico('radar')} Track</a>` : ''}`
          : `<span class="seats-left ${left < 10 ? 'low' : ''}">${left} seats left</span>
             <a class="btn btn-primary btn-sm" href="#/seats?trip=${t.id}">Select seats ${ico('arrow')}</a>`}
      </div>
    </article>`;
  }

  /* ---------- Seat selection & booking ---------- */
  Views.seats = {
    title: 'Select seats',
    auth: true,
    render(q) {
      const t = Data.tripById(q.get('trip'));
      if (!t) return notFound('We couldn’t find that bus.');
      if (t.dep <= new Date()) {
        return `<section class="page"><div class="container">${emptyState('clock', 'This bus has already departed',
          'Booking closes at departure time. Choose a later bus on this route.',
          `<a class="btn btn-primary" href="#/search?from=${t.from}&to=${t.to}&date=${today()}">See later buses</a>`)}</div></section>`;
      }
      const C = Data.CLASSES[t.cls];
      const seeded = Data.seededOccupied(t), booked = Store.bookedSeats(t.id);
      const seat = n => {
        const taken = seeded.has(n) || booked.has(n);
        return `<button type="button" class="seat ${taken ? 'taken' : ''}" data-n="${n}" ${taken ? 'disabled' : ''}
          aria-label="Seat ${n}${taken ? ', booked' : ''}" aria-pressed="false"><span>${n}</span></button>`;
      };
      let n = 1, grid = '';
      for (let r = 0; r < C.rows; r++) {
        for (let k = 0; k < C.left; k++) grid += seat(n++);
        grid += '<div class="aisle"></div>';
        for (let k = 0; k < C.right; k++) grid += seat(n++);
      }
      for (let k = 0; k < C.left + C.right + 1; k++) grid += seat(n++);
      const user = Store.current();

      return `<section class="page">
        <div class="container">
          <a class="back" href="#/search?from=${t.from}&to=${t.to}&date=${t.date}">← Back to results</a>
          ${pageHead(fmtLongDay(t.date), `${cityName(t.from)} <span class="red">→</span> ${cityName(t.to)}`,
            `${fmtTime(t.dep)} – ${fmtTime(t.arr)} · ${fmtDur(t.durMin)} · ${C.label} · ${esc(t.busNo)}`)}
          <div class="seat-layout">
            <div class="card bus-card reveal">
              <div class="legend">
                <span><i class="lg lg-free"></i>Available</span>
                <span><i class="lg lg-sel"></i>Selected</span>
                <span><i class="lg lg-taken"></i>Booked</span>
              </div>
              <div class="bus">
                <div class="bus-front"><span class="door">Door</span><span class="driver">${ico('steering')}</span></div>
                <div class="seat-grid" style="--cols:${C.left + C.right + 1}">${grid}</div>
                <div class="bus-back"></div>
              </div>
              <p class="muted small center">You can select up to 6 seats per booking.</p>
            </div>

            <aside class="card summary reveal" style="--d:100ms">
              <h3>Booking summary</h3>
              <div class="sum-route">
                <div><strong>${fmtTime(t.dep)}</strong><span>${cityName(t.from)}</span></div>
                <div class="sum-line"></div>
                <div class="right"><strong>${fmtTime(t.arr)}</strong><span>${cityName(t.to)}</span></div>
              </div>
              <div class="sum-row"><span>Selected seats</span><div class="sel-seats" id="selSeats"><span class="muted">None yet</span></div></div>
              <div class="sum-row"><span>Fare per seat</span><b>${fmtLKR(t.fare)}</b></div>
              <form id="bookForm" novalidate>
                <label class="field"><span>Passenger name</span>
                  <input name="name" value="${esc(user ? user.name : '')}" required autocomplete="name"></label>
                <label class="field"><span>Mobile number</span>
                  <input name="phone" inputmode="tel" placeholder="07X XXX XXXX" required autocomplete="tel"></label>
                <div class="sum-total"><span>Total</span><strong id="total">${fmtLKR(0)}</strong></div>
                <p class="form-error" id="bookErr"></p>
                <button class="btn btn-primary btn-block" id="bookBtn" disabled>${ico('ticket')} Confirm booking</button>
                <p class="muted small center">Free cancellation with 90% refund up to 24 hours before departure.</p>
              </form>
            </aside>
          </div>
        </div>
      </section>`;
    },
    mount(q, root) {
      const t = Data.tripById(q.get('trip'));
      const form = $('#bookForm', root);
      if (!t || !form) return;
      const selected = new Set();
      const update = () => {
        const seats = [...selected].sort((a, b) => a - b);
        $('#selSeats', root).innerHTML = seats.length ? seats.map(s => `<span class="seat-chip">${s}</span>`).join('') : '<span class="muted">None yet</span>';
        animateNumber($('#total', root), seats.length * t.fare, fmtLKR);
        $('#bookBtn', root).disabled = !seats.length;
      };
      $('.seat-grid', root).addEventListener('click', e => {
        const b = e.target.closest('.seat:not(.taken)');
        if (!b) return;
        const n = +b.dataset.n;
        if (selected.has(n)) selected.delete(n);
        else {
          if (selected.size >= 6) return toast('You can book up to 6 seats at a time', 'error');
          selected.add(n);
        }
        b.classList.toggle('selected', selected.has(n));
        b.setAttribute('aria-pressed', selected.has(n));
        update();
      });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const err = $('#bookErr', root);
        const name = form.name.value.trim();
        const phone = form.phone.value.replace(/[\s-]/g, '');
        err.textContent = '';
        if (name.length < 2) return (err.textContent = 'Please enter the passenger’s name.');
        if (!/^(0|\+94)7\d{8}$/.test(phone)) return (err.textContent = 'Enter a valid Sri Lankan mobile number, e.g. 0771234567.');
        try {
          const booking = Store.createBooking(t, [...selected], { name, phone });
          bookingSuccess(booking);
        } catch (ex) {
          err.textContent = ex.message;
        }
      });
    },
  };

  function bookingSuccess(b) {
    openModal(`<div class="success">
        <div class="success-mark"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="m15 27 7 7 15-16"/></svg></div>
        <h2>Booking confirmed</h2>
        <p class="muted">Your e-ticket is ready. Show it to the conductor when boarding.</p>
      </div>
      ${ticketHTML(b)}
      <div class="modal-actions">
        <a class="btn btn-ghost" href="#/" data-close>Book another</a>
        <a class="btn btn-primary" href="#/bookings" data-close>My bookings ${ico('arrow')}</a>
      </div>`, { wide: true, onClose: () => { if (location.hash.startsWith('#/seats')) go('#/bookings'); } });
  }

  /* ---------- My bookings ---------- */
  Views.bookings = {
    title: 'My bookings',
    auth: true,
    render(q) {
      const tab = q.get('tab') || 'upcoming';
      const now = Date.now();
      const all = Store.myBookings();
      const groups = { upcoming: [], past: [], cancelled: [] };
      all.forEach(b => {
        if (!Store.activeSeats(b).length) groups.cancelled.push(b);
        else if (b.dep > now) groups.upcoming.push(b);
        else groups.past.push(b);
      });
      groups.upcoming.sort((a, b) => a.dep - b.dep);
      const user = Store.current();
      const list = groups[tab] || [];
      return `<section class="page">
        <div class="container">
          ${pageHead('Hi, ' + esc(user.name.split(' ')[0]), 'My bookings', 'View tickets, track your bus or cancel seats.')}
          <div class="tabs">
            ${[['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']].map(([k, l]) =>
              `<a href="#/bookings?tab=${k}" class="tab ${tab === k ? 'active' : ''}">${l}<span class="count">${groups[k].length}</span></a>`).join('')}
          </div>
          <div class="booking-list">
            ${list.length ? list.map((b, i) => bookingCard(b, i, tab)).join('')
              : emptyState('ticket', tab === 'upcoming' ? 'No upcoming trips' : `No ${tab} bookings`,
                tab === 'upcoming' ? 'Search for a route and pick your seats to get started.' : 'Bookings will appear here.',
                tab === 'upcoming' ? '<a class="btn btn-primary" href="#/">Find a bus</a>' : '')}
          </div>
        </div>
      </section>`;
    },
    mount(q, root) {
      root.addEventListener('click', e => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const b = Store.myBookings().find(x => x.ref === btn.dataset.ref);
        if (!b) return;
        if (btn.dataset.act === 'ticket') showTicket(b);
        if (btn.dataset.act === 'cancel') cancelDialog(b);
      });
    },
  };

  function bookingCard(b, i, tab) {
    const active = Store.activeSeats(b);
    const now = Date.now();
    const live = b.dep <= now && now < b.arr;
    const canCancel = tab === 'upcoming' && Store.refundRate(b) > 0;
    return `<article class="booking-card reveal" style="--d:${Math.min(i, 6) * 60}ms">
      <div class="bk-date"><b>${Data.parseDate(b.date).getDate()}</b><small>${Data.parseDate(b.date).toLocaleDateString('en-GB', { month: 'short' })}</small></div>
      <div class="bk-body">
        <div class="bk-top">
          <h3>${cityName(b.from)} <span class="red">→</span> ${cityName(b.to)}</h3>
          ${tab === 'cancelled' ? '<span class="status status-cancel">Cancelled</span>'
            : live ? '<span class="status status-live">On the road</span>'
            : tab === 'past' ? '<span class="status status-done">Completed</span>'
            : '<span class="status status-scheduled">Confirmed</span>'}
        </div>
        <div class="bk-meta">
          <span>${ico('clock')} ${fmtTime(b.dep)} – ${fmtTime(b.arr)}</span>
          <span>${ico('seat')} ${tab === 'cancelled' ? b.seats.join(', ') : active.join(', ')}</span>
          <span>${ico('bus')} ${esc(b.busNo)}</span>
          ${classTag(b.cls)}
        </div>
        <div class="bk-foot">
          <span class="muted small">Ref <b class="mono">${esc(b.ref)}</b>${b.cancelledSeats.length ? ` · ${b.cancelledSeats.length} seat(s) cancelled, refunded ${fmtLKR(b.refunded)}` : ''}</span>
          <div class="bk-actions">
            ${tab !== 'cancelled' ? `<button class="btn btn-ghost btn-sm" data-act="ticket" data-ref="${b.ref}">${ico('ticket')} Ticket</button>` : ''}
            ${tab === 'upcoming' || live ? `<a class="btn btn-ghost btn-sm" href="#/track?trip=${b.tripId}">${ico('radar')} Track</a>` : ''}
            ${canCancel ? `<button class="btn btn-danger btn-sm" data-act="cancel" data-ref="${b.ref}">Cancel</button>` : ''}
          </div>
        </div>
      </div>
    </article>`;
  }

  function showTicket(b) {
    openModal(`<h2 class="modal-title">E-ticket</h2>${ticketHTML(b)}
      <div class="modal-actions"><button class="btn btn-ghost" onclick="window.print()">${ico('print')} Print</button>
      <button class="btn btn-primary" data-close>Done</button></div>`, { wide: true });
  }

  function cancelDialog(b) {
    const seats = Store.activeSeats(b);
    const rate = Store.refundRate(b);
    openModal(`<h2 class="modal-title">Cancel seats</h2>
      <p class="muted">${cityName(b.from)} → ${cityName(b.to)} · ${fmtDay(b.date)}, ${fmtTime(b.dep)}</p>
      <div class="cancel-seats">${seats.map(s => `<label class="seat-check"><input type="checkbox" value="${s}" checked><span>${s}</span></label>`).join('')}</div>
      <div class="refund-box">
        <div><span>Refund rate</span><b>${Math.round(rate * 100)}%</b></div>
        <div><span>You’ll get back</span><b class="red" id="refundAmt">${fmtLKR(seats.length * b.fare * rate)}</b></div>
      </div>
      <p class="muted small">90% refund 24+ hours before departure, 50% between 3 and 24 hours. No cancellations within 3 hours.</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-close>Keep booking</button>
        <button class="btn btn-danger" id="doCancel">Cancel selected seats</button>
      </div>`, {
      onMount(wrap, close) {
        const picked = () => $$('.cancel-seats input:checked', wrap).map(i => +i.value);
        wrap.addEventListener('change', () => {
          $('#refundAmt', wrap).textContent = fmtLKR(picked().length * b.fare * rate);
          $('#doCancel', wrap).disabled = !picked().length;
        });
        $('#doCancel', wrap).addEventListener('click', () => {
          try {
            const { refund } = Store.cancelSeats(b.ref, picked());
            close();
            toast(`Cancelled. ${fmtLKR(refund)} will be refunded.`, 'success');
            render();
          } catch (ex) { toast(ex.message, 'error'); }
        });
      },
    });
  }

  /* ---------- Schedules ---------- */
  Views.schedules = {
    title: 'Bus schedules',
    render(q) {
      const from = Data.CITY[q.get('from')] ? q.get('from') : 'colombo';
      const to = Data.CITY[q.get('to')] ? q.get('to') : 'kandy';
      let date = q.get('date') || today();
      if (date < today()) date = today();
      const trips = from !== to ? Data.tripsFor(from, to, date) : [];
      const now = new Date();
      const r = Data.route(from, to);
      return `<section class="page">
        <div class="container">
          ${pageHead('Timetable', 'Bus schedules', 'Every departure on a route, with live status for today.')}
          ${searchForm({ from, to, date, action: 'schedules', submit: 'Show timetable', variant: 'search-compact' })}
          ${r ? `<div class="sched-head reveal">
            <h2>${cityName(from)} <span class="red">→</span> ${cityName(to)}</h2>
            <span class="muted">${fmtLongDay(date)} · ${trips.length} departures · ${r.km} km</span>
          </div>
          <div class="table-wrap card reveal">
            <table class="table">
              <thead><tr><th>Departs</th><th>Arrives</th><th>Duration</th><th>Class</th><th>Route</th><th>Bus</th><th>Fare</th><th>Status</th><th></th></tr></thead>
              <tbody>${trips.map(t => {
                const st = tripStatus(t, now);
                return `<tr class="${st.key === 'done' ? 'dim' : ''}">
                  <td><b>${fmtTime(t.dep)}</b></td><td>${fmtTime(t.arr)}${t.arr.getDate() !== t.dep.getDate() ? ' <small class="muted">+1</small>' : ''}</td>
                  <td>${fmtDur(t.durMin)}</td><td>${classTag(t.cls)}</td><td>${esc(t.routeNo)}</td>
                  <td class="mono small">${esc(t.busNo)}</td><td><b>${fmtLKR(t.fare)}</b></td>
                  <td><span class="status status-${st.key}">${st.label}</span></td>
                  <td>${st.key === 'live' ? `<a class="link" href="#/track?trip=${t.id}">Track</a>`
                    : st.key === 'done' ? '' : `<a class="link" href="#/seats?trip=${t.id}">Book</a>`}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : emptyState('route', 'Choose two different towns', 'Pick a starting point and destination to see the timetable.')}
        </div>
      </section>`;
    },
    mount(q, root) { initPickers(root); initSearchForms(root); },
  };

  /* ---------- Fares ---------- */
  Views.fares = {
    title: 'Bus fares',
    render(q) {
      const from = Data.CITY[q.get('from')] ? q.get('from') : 'colombo';
      const to = Data.CITY[q.get('to')] ? q.get('to') : 'kandy';
      const r = Data.route(from, to);
      const exp = Data.isExpressway(from, to);
      const table = Data.CITIES.filter(c => c.id !== from)
        .map(c => ({ c, r: Data.route(from, c.id) }))
        .sort((a, b) => a.r.km - b.r.km);
      return `<section class="page">
        <div class="container">
          ${pageHead('Fare calculator', 'Bus fares', 'Indicative one-way fares per seat by bus class.')}
          ${searchForm({ from, to, action: 'fares', withDate: false, submit: 'Calculate fare', variant: 'search-compact' })}
          ${r ? `<div class="fare-summary reveal">
              <h2>${cityName(from)} <span class="red">→</span> ${cityName(to)}</h2>
              <p class="muted">${r.km} km · ${r.path.map(cityName).join(' → ')}</p>
            </div>
            <div class="fare-grid">
              ${Object.values(Data.CLASSES).map((C, i) => {
                const off = C.id === 'express' && !exp;
                return `<div class="fare-card reveal ${off ? 'off' : ''} ${C.id === 'luxury' ? 'featured' : ''}" style="--d:${i * 80}ms">
                  ${classTag(C.id)}
                  <div class="fare-amount">${off ? '—' : `<span data-money="${Data.fare(r.km, C.id)}">${fmtLKR(0)}</span>`}</div>
                  <p class="muted small">${off ? 'No expressway service on this route' : `LKR ${C.rate.toFixed(2)} per km`}</p>
                  <ul>${C.perks.map(p => `<li>${ico('check')} ${p}</li>`).join('')}</ul>
                  ${off ? '' : `<a class="btn btn-ghost btn-sm" href="#/search?from=${from}&to=${to}&date=${today()}">See buses</a>`}
                </div>`;
              }).join('')}
            </div>` : emptyState('coins', 'Choose two different towns', 'Pick a starting point and destination to see fares.')}

          <div class="sched-head reveal"><h2>All fares from ${cityName(from)}</h2></div>
          <div class="table-wrap card reveal">
            <table class="table">
              <thead><tr><th>Destination</th><th>Distance</th><th>Normal</th><th>Semi-Luxury</th><th>Luxury A/C</th><th>Expressway</th></tr></thead>
              <tbody>${table.map(({ c, r }) => `<tr>
                <td><a class="link" href="#/fares?from=${from}&to=${c.id}"><b>${esc(c.name)}</b></a></td><td>${r.km} km</td>
                <td>${fmtLKR(Data.fare(r.km, 'normal'))}</td><td>${fmtLKR(Data.fare(r.km, 'semi'))}</td><td>${fmtLKR(Data.fare(r.km, 'luxury'))}</td>
                <td>${Data.isExpressway(from, c.id) ? fmtLKR(Data.fare(r.km, 'express')) : '<span class="muted">—</span>'}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
      </section>`;
    },
    mount(q, root) {
      initPickers(root); initSearchForms(root);
      $$('[data-money]', root).forEach(el => animateNumber(el, +el.dataset.money, fmtLKR, 900));
    },
  };

  /* ---------- Live tracking ---------- */
  Views.track = {
    title: 'Live bus tracking',
    bodyClass: 'is-track',
    render() {
      return `<section class="track-page">
        <aside class="track-panel">
          <div class="panel-head">
            <span class="eyebrow"><span class="dot live"></span>Live</span>
            <h1>Bus tracking</h1>
            <p class="muted" id="liveCount">Locating buses…</p>
            <div class="sim">
              <span class="muted small">${ico('clock')} <b id="simClock">--:--</b></span>
              <div class="seg" id="simSpeed" role="group" aria-label="Playback speed">
                <button class="active" data-m="1">Real time</button><button data-m="30">30×</button><button data-m="120">120×</button>
              </div>
            </div>
            <div class="search-mini">${ico('search')}<input id="busFilter" placeholder="Search town, bus or route no." autocomplete="off"></div>
          </div>
          <div id="busDetail"></div>
          <div class="bus-list" id="busList"></div>
        </aside>
        <div class="map-wrap"><div id="map"></div></div>
      </section>`;
    },
    mount(q, root) {
      const mapEl = $('#map', root);
      if (!window.L) {
        mapEl.innerHTML = '<div class="map-fallback">The map could not load. Check your internet connection and refresh.</div>';
      }
      const clock = {
        realBase: Date.now(), simBase: Date.now(), mult: 1,
        now() { return new Date(this.simBase + (Date.now() - this.realBase) * this.mult); },
        set(m) { this.simBase = this.now().getTime(); this.realBase = Date.now(); this.mult = m; },
      };
      let selected = q.get('trip') || null;
      let active = [], filter = '', routeLine = null, map = null, ticks = 0;
      const markers = new Map();

      if (window.L) {
        map = L.map(mapEl, { zoomControl: false, attributionControl: true, minZoom: 7 }).setView([7.75, 80.75], 8);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
        L.tileLayer(esri + 'World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 16,
        }).addTo(map);
        L.tileLayer(esri + 'World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, opacity: 0.8 }).addTo(map);
        Data.CITIES.forEach(c => L.circleMarker([c.lat, c.lng], { radius: 3.5, color: '#fff', weight: 1, fillColor: '#fff', fillOpacity: 0.7 })
          .bindTooltip(c.name, { direction: 'top', className: 'city-tip', offset: [0, -4] }).addTo(map));
        // Suspend marker glide while zooming so icons don't slide after zoom
        map.on('zoomstart', () => mapEl.classList.add('no-glide'));
        map.on('zoomend', noGlide);
      }
      function noGlide() {
        mapEl.classList.add('no-glide');
        requestAnimationFrame(() => requestAnimationFrame(() => mapEl.classList.remove('no-glide')));
      }

      const icon = id => L.divIcon({
        className: 'bus-icon',
        html: `<div class="bus-pin ${id === selected ? 'sel' : ''}"><span class="pulse"></span>${ico('bus')}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13],
      });
      const label = t => `${cityName(t.from)} → ${cityName(t.to)}`;
      const matches = t => !filter || [label(t), t.busNo, t.routeNo, Data.CLASSES[t.cls].label].join(' ').toLowerCase().includes(filter);

      function refreshActive() {
        const now = clock.now();
        active = Data.activeTrips(now, selected ? [selected] : []);
        const ids = new Set(active.map(t => t.id));
        markers.forEach((m, id) => { if (!ids.has(id)) { m.remove(); markers.delete(id); } });
        if (map && active.some(t => !markers.has(t.id))) noGlide(); // new markers appear in place, not slide in
        if (map) active.forEach(t => {
          if (markers.has(t.id)) return;
          const p = Data.positionOf(t, now);
          const m = L.marker([p.lat, p.lng], { icon: icon(t.id), riseOnHover: true }).addTo(map);
          m.bindTooltip(`<b>${esc(t.busNo)}</b><br>${esc(label(t))}`, { direction: 'top', offset: [0, -14], className: 'bus-tip' });
          m.on('click', () => select(t.id));
          markers.set(t.id, m);
        });
        $('#liveCount', root).textContent = `${active.length} buses on the road right now`;
        renderList();
      }

      function renderList() {
        const now = clock.now();
        const shown = active.filter(matches).sort((a, b) => label(a).localeCompare(label(b)));
        $('#busList', root).innerHTML = shown.length ? shown.map(t => {
          const p = Data.positionOf(t, now);
          return `<button class="bus-item ${t.id === selected ? 'active' : ''}" data-id="${t.id}">
            <div class="bi-top"><b>${esc(label(t))}</b>${classTag(t.cls)}</div>
            <div class="bi-meta muted small"><span>${esc(t.busNo)}</span><span>Next: ${cityName(p.nextStop)}</span></div>
            <div class="bar"><i style="width:${(p.progress * 100).toFixed(1)}%"></i></div>
          </button>`;
        }).join('') : `<p class="muted small pad">No live buses match “${esc(filter)}”.</p>`;
      }

      function renderDetail() {
        const box = $('#busDetail', root);
        const t = selected && Data.tripById(selected);
        if (!t) { box.innerHTML = ''; return; }
        const now = clock.now();
        const st = tripStatus(t, now);
        const p = Data.positionOf(t, now);
        box.innerHTML = `<div class="detail card">
          <button class="icon-btn detail-x" id="clearSel" aria-label="Close">${ico('close')}</button>
          <div class="bi-top"><span class="status status-${st.key}">${st.label}</span>${classTag(t.cls)}</div>
          <h3>${esc(label(t))}</h3>
          <p class="muted small">${esc(t.busNo)} · Route ${esc(t.routeNo)} · ${t.operator}</p>
          <div class="detail-route"><span>${fmtTime(t.dep)}</span><div class="bar big"><i style="width:${(p.progress * 100).toFixed(1)}%"></i></div><span>${fmtTime(t.arr)}</span></div>
          ${st.key === 'live' ? `<div class="detail-grid">
              <div>${ico('gauge')}<small>Speed</small><b>${p.speed} km/h</b></div>
              <div>${ico('pin')}<small>Next stop</small><b>${cityName(p.nextStop)}</b></div>
              <div>${ico('clock')}<small>Arrives in</small><b>${fmtDur(p.etaMin)}</b></div>
            </div>`
            : st.key === 'done' ? `<p class="muted small">This bus reached ${cityName(t.to)} at ${fmtTime(t.arr)}.</p>`
            : `<p class="muted small">Departs ${fmtDay(t.date)} at ${fmtTime(t.dep)} from ${cityName(t.from)}. Tracking starts at departure.</p>`}
        </div>`;
        $('#clearSel', root).onclick = () => select(null);
      }

      function drawRoute() {
        if (!map) return;
        if (routeLine) { routeLine.remove(); routeLine = null; }
        const t = selected && Data.tripById(selected);
        if (!t) return;
        routeLine = L.polyline(Data.pathCoords(t.path), { color: '#e50914', weight: 4, opacity: 0.9, dashArray: '8 8', className: 'route-line' }).addTo(map);
        const m = markers.get(t.id);
        if (m) map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 9), { duration: reduceMotion ? 0 : 1.1 });
        else map.flyToBounds(routeLine.getBounds(), { padding: [60, 60], duration: reduceMotion ? 0 : 1.1 });
      }

      function select(id) {
        selected = id;
        markers.forEach((m, mid) => { const el = m.getElement(); el && $('.bus-pin', el).classList.toggle('sel', mid === id); if (mid === id) m.setZIndexOffset(1000); else m.setZIndexOffset(0); });
        const url = id ? `#/track?trip=${id}` : '#/track';
        history.replaceState(null, '', url);
        refreshActive();
        renderDetail();
        drawRoute();
      }

      function tick() {
        const now = clock.now();
        let arrived = false;
        active.forEach(t => {
          if (now >= t.arr) { arrived = true; return; }
          const p = Data.positionOf(t, now);
          const m = markers.get(t.id);
          m && m.setLatLng([p.lat, p.lng]);
          const bar = $(`.bus-item[data-id="${t.id}"] .bar i`, root);
          if (bar) bar.style.width = (p.progress * 100).toFixed(1) + '%';
        });
        $('#simClock', root).textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: clock.mult === 1 ? '2-digit' : undefined });
        ticks++;
        if (arrived || ticks % (clock.mult > 1 ? 3 : 30) === 0) refreshActive();
        if (selected) renderDetail();
      }

      $('#busList', root).addEventListener('click', e => {
        const b = e.target.closest('.bus-item');
        if (b) select(b.dataset.id === selected ? null : b.dataset.id);
      });
      $('#busFilter', root).addEventListener('input', e => { filter = e.target.value.trim().toLowerCase(); renderList(); });
      $('#simSpeed', root).addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        $$('#simSpeed button', root).forEach(x => x.classList.toggle('active', x === b));
        clock.set(+b.dataset.m);
        refreshActive();
        if (+b.dataset.m > 1) toast(`Playback at ${b.dataset.m}× speed`, 'info');
      });

      refreshActive();
      tick();
      if (selected) { renderDetail(); setTimeout(drawRoute, 300); }
      const timer = setInterval(tick, 1000);
      return () => { clearInterval(timer); map && map.remove(); };
    },
  };

  /* ---------- Login / Register ---------- */
  function authShell(side, form) {
    return `<section class="auth-page">
      <div class="auth-card">
        <div class="auth-side">
          <div class="glow g1"></div>
          <a href="#/" class="brand"><span class="brand-text">Lanka<b>Ride</b></span></a>
          ${side}
          <ul class="auth-perks">
            <li>${ico('seat')} Choose your exact seat</li>
            <li>${ico('radar')} Track your bus live</li>
            <li>${ico('shield')} Cancel with instant refunds</li>
          </ul>
        </div>
        ${form}
      </div>
    </section>`;
  }
  const pwField = (name, label, ac) => `<label class="field"><span>${label}</span>
    <div class="pw"><input type="password" name="${name}" autocomplete="${ac}" required>
    <button type="button" class="pw-toggle" aria-label="Show password">${ico('eye')}</button></div></label>`;
  function initPwToggles(root) {
    $$('.pw-toggle', root).forEach(b => b.addEventListener('click', () => {
      const i = b.previousElementSibling;
      i.type = i.type === 'password' ? 'text' : 'password';
      b.classList.toggle('on', i.type === 'text');
    }));
  }
  function nextFrom(q) {
    const n = q.get('next') || '#/';
    return n.startsWith('#/') && !n.startsWith('#/login') && !n.startsWith('#/register') ? n : '#/';
  }

  Views.login = {
    title: 'Log in',
    render(q) {
      const next = encodeURIComponent(nextFrom(q));
      return authShell(`<h2>Welcome back.</h2><p>Log in to book seats and manage your tickets.</p>`,
        `<form class="auth-form" id="loginForm" novalidate>
          <h1>Log in</h1>
          <p class="muted">${q.get('next') ? 'Please log in to continue with your booking.' : 'Enter your username and password.'}</p>
          <label class="field"><span>Username</span><input name="username" autocomplete="username" required autofocus></label>
          ${pwField('password', 'Password', 'current-password')}
          <p class="form-error" id="authErr"></p>
          <button class="btn btn-primary btn-block" type="submit">Log in ${ico('arrow')}</button>
          <p class="muted center">New to LankaRide? <a class="link" href="#/register?next=${next}">Create an account</a></p>
          <div class="demo-hint">Demo account: <b>demo</b> / <b>demo1234</b></div>
        </form>`);
    },
    mount(q, root) {
      if (Store.current()) return go(nextFrom(q));
      initPwToggles(root);
      const form = $('#loginForm', root);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const err = $('#authErr', root), btn = $('button[type=submit]', form);
        err.textContent = '';
        if (!form.username.value.trim() || !form.password.value) return (err.textContent = 'Enter your username and password.');
        btn.classList.add('loading'); btn.disabled = true;
        try {
          const u = await Store.login(form.username.value, form.password.value);
          toast(`Welcome back, ${u.name.split(' ')[0]}!`, 'success');
          renderNav();
          go(nextFrom(q));
        } catch (ex) {
          err.textContent = ex.message;
          shake(form);
        } finally { btn.classList.remove('loading'); btn.disabled = false; }
      });
    },
  };

  Views.register = {
    title: 'Create account',
    render(q) {
      const next = encodeURIComponent(nextFrom(q));
      return authShell(`<h2>Ride smarter.</h2><p>Create a free account in seconds.</p>`,
        `<form class="auth-form" id="regForm" novalidate>
          <h1>Create account</h1>
          <p class="muted">You’ll use your username and password to log in.</p>
          <label class="field"><span>Full name</span><input name="name" autocomplete="name" required autofocus></label>
          <label class="field"><span>Username</span><input name="username" autocomplete="username" required></label>
          ${pwField('password', 'Password (min. 6 characters)', 'new-password')}
          ${pwField('confirm', 'Confirm password', 'new-password')}
          <p class="form-error" id="authErr"></p>
          <button class="btn btn-primary btn-block" type="submit">Create account ${ico('arrow')}</button>
          <p class="muted center">Already have an account? <a class="link" href="#/login?next=${next}">Log in</a></p>
        </form>`);
    },
    mount(q, root) {
      if (Store.current()) return go(nextFrom(q));
      initPwToggles(root);
      const form = $('#regForm', root);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const err = $('#authErr', root), btn = $('button[type=submit]', form);
        err.textContent = '';
        if (form.password.value !== form.confirm.value) { shake(form); return (err.textContent = 'Passwords do not match.'); }
        btn.classList.add('loading'); btn.disabled = true;
        try {
          const u = await Store.register({ username: form.username.value, name: form.name.value, password: form.password.value });
          toast(`Account created. Welcome, ${u.name.split(' ')[0]}!`, 'success');
          renderNav();
          go(nextFrom(q));
        } catch (ex) {
          err.textContent = ex.message;
          shake(form);
        } finally { btn.classList.remove('loading'); btn.disabled = false; }
      });
    },
  };

  function notFound(msg = 'This page doesn’t exist.') {
    return `<section class="page"><div class="container">${emptyState('route', 'Wrong turn', msg, '<a class="btn btn-primary" href="#/">Back to home</a>')}</div></section>`;
  }

  /* =========================================================
     Animations: reveal on scroll, counters
     ========================================================= */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('[data-count]', en.target).concat(en.target.matches('[data-count]') ? [en.target] : [])
        .forEach(el => animateNumber(el, +el.dataset.count, n => Math.round(n).toLocaleString('en-US'), 1400));
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;

  function observeReveals(root) {
    $$('.reveal:not(.in)', root).forEach(el => (io ? io.observe(el) : el.classList.add('in')));
  }

  function animateNumber(el, to, fmt, dur = 500) {
    if (!el) return;
    const from = +el.dataset.cur || 0;
    el.dataset.cur = to;
    if (reduceMotion) { el.textContent = fmt(to); return; }
    const start = performance.now();
    const step = now => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1 && el.dataset.cur == to) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* =========================================================
     Navigation & router
     ========================================================= */
  function renderNav() {
    const u = Store.current();
    const box = $('#navActions');
    if (!u) {
      box.innerHTML = `<a href="${loginRedirect()}" class="btn btn-text">Log in</a><a href="#/register" class="btn btn-primary btn-sm">Sign up</a>`;
      return;
    }
    const initials = u.name.split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
    box.innerHTML = `<div class="user-menu">
      <button class="user-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar">${esc(initials)}</span><span class="user-name">${esc(u.username)}</span></button>
      <div class="user-drop">
        <div class="ud-head"><b>${esc(u.name)}</b><small class="muted">@${esc(u.username)}</small></div>
        <a href="#/bookings">${ico('ticket')} My bookings</a>
        <button id="logoutBtn">${ico('logout')} Log out</button>
      </div></div>`;
    const menu = $('.user-menu', box), btn = $('.user-btn', box);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    $('#logoutBtn', box).addEventListener('click', () => {
      Store.logout();
      toast('You have been logged out', 'info');
      renderNav();
      const v = Views[parseHash().path];
      v && v.auth ? go('#/') : render();
    });
  }
  document.addEventListener('click', () => { const m = $('.user-menu.open'); m && m.classList.remove('open'); });

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const i = h.indexOf('?');
    return { path: i < 0 ? h : h.slice(0, i), q: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) };
  }

  let cleanup = null;
  function render() {
    const { path, q } = parseHash();
    const view = Views[path];
    if (view && view.auth && !Store.current()) {
      toast('Please log in to continue', 'info');
      location.replace(loginRedirect());
      return;
    }
    if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }

    const app = $('#app');
    document.body.classList.toggle('is-track', !!(view && view.bodyClass === 'is-track'));
    document.body.classList.remove('nav-open');
    $('#burger').setAttribute('aria-expanded', 'false');
    // Fresh container per view so listeners never leak between pages
    const viewEl = document.createElement('div');
    viewEl.className = 'view view-enter';
    viewEl.innerHTML = view ? view.render(q) : notFound();
    app.replaceChildren(viewEl);
    document.title = `${view ? view.title : 'Not found'} · LankaRide`;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    $$('#navLinks a').forEach(a => a.classList.toggle('active', a.dataset.nav === path || (path === 'search' && a.dataset.nav === '') || (path === 'seats' && a.dataset.nav === '')));
    const bar = $('#routeProgress');
    bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');

    if (view && view.mount) {
      const c = view.mount(q, viewEl);
      if (typeof c === 'function') cleanup = c;
    }
    observeReveals(viewEl);
    renderNav();
  }

  /* Navbar shrink on scroll + mobile menu */
  window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', window.scrollY > 10), { passive: true });
  $('#burger').addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    $('#burger').setAttribute('aria-expanded', open);
  });

  window.addEventListener('hashchange', render);
  $('#year').textContent = new Date().getFullYear();
  Store.ensureDemoUser().catch(() => {});
  if (!location.hash) history.replaceState(null, '', '#/');
  render();
})();
