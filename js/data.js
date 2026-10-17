/* LankaRide — network, timetable and fare data.
   Timetables and live positions are generated deterministically so the
   same route + date always produces the same trips. */
(function () {
  'use strict';

  const CITIES = [
    { id: 'colombo',      name: 'Colombo',       sub: 'Pettah Central Bus Stand', prov: 'WP', lat: 6.9344, lng: 79.8508 },
    { id: 'negombo',      name: 'Negombo',       sub: 'Western Province',         prov: 'WP', lat: 7.2083, lng: 79.8358 },
    { id: 'kalutara',     name: 'Kalutara',      sub: 'Western Province',         prov: 'WP', lat: 6.5854, lng: 79.9607 },
    { id: 'kandy',        name: 'Kandy',         sub: 'Goods Shed Bus Stand',     prov: 'CP', lat: 7.2906, lng: 80.6337 },
    { id: 'nuwaraeliya',  name: 'Nuwara Eliya',  sub: 'Central Province',         prov: 'CP', lat: 6.9497, lng: 80.7891 },
    { id: 'dambulla',     name: 'Dambulla',      sub: 'Central Province',         prov: 'CP', lat: 7.8731, lng: 80.6511 },
    { id: 'galle',        name: 'Galle',         sub: 'Southern Province',        prov: 'SP', lat: 6.0329, lng: 80.2168 },
    { id: 'matara',       name: 'Matara',        sub: 'Southern Province',        prov: 'SP', lat: 5.9485, lng: 80.5353 },
    { id: 'hambantota',   name: 'Hambantota',    sub: 'Southern Province',        prov: 'SP', lat: 6.1241, lng: 81.1185 },
    { id: 'kataragama',   name: 'Kataragama',    sub: 'Uva Province',             prov: 'UP', lat: 6.4134, lng: 81.3346 },
    { id: 'jaffna',       name: 'Jaffna',        sub: 'Northern Province',        prov: 'NP', lat: 9.6615, lng: 80.0255 },
    { id: 'vavuniya',     name: 'Vavuniya',      sub: 'Northern Province',        prov: 'NP', lat: 8.7514, lng: 80.4971 },
    { id: 'mannar',       name: 'Mannar',        sub: 'Northern Province',        prov: 'NP', lat: 8.9810, lng: 79.9044 },
    { id: 'anuradhapura', name: 'Anuradhapura',  sub: 'North Central Province',   prov: 'NC', lat: 8.3114, lng: 80.4037 },
    { id: 'polonnaruwa',  name: 'Polonnaruwa',   sub: 'North Central Province',   prov: 'NC', lat: 7.9403, lng: 81.0188 },
    { id: 'trincomalee',  name: 'Trincomalee',   sub: 'Eastern Province',         prov: 'EP', lat: 8.5874, lng: 81.2152 },
    { id: 'batticaloa',   name: 'Batticaloa',    sub: 'Eastern Province',         prov: 'EP', lat: 7.7310, lng: 81.6747 },
    { id: 'ampara',       name: 'Ampara',        sub: 'Eastern Province',         prov: 'EP', lat: 7.2975, lng: 81.6820 },
    { id: 'kurunegala',   name: 'Kurunegala',    sub: 'North Western Province',   prov: 'NW', lat: 7.4863, lng: 80.3647 },
    { id: 'chilaw',       name: 'Chilaw',        sub: 'North Western Province',   prov: 'NW', lat: 7.5758, lng: 79.7953 },
    { id: 'puttalam',     name: 'Puttalam',      sub: 'North Western Province',   prov: 'NW', lat: 8.0362, lng: 79.8283 },
    { id: 'badulla',      name: 'Badulla',       sub: 'Uva Province',             prov: 'UP', lat: 6.9934, lng: 81.0550 },
    { id: 'ella',         name: 'Ella',          sub: 'Uva Province',             prov: 'UP', lat: 6.8667, lng: 81.0466 },
    { id: 'ratnapura',    name: 'Ratnapura',     sub: 'Sabaragamuwa Province',    prov: 'SG', lat: 6.6828, lng: 80.3992 },
    { id: 'kegalle',      name: 'Kegalle',       sub: 'Sabaragamuwa Province',    prov: 'SG', lat: 7.2513, lng: 80.3464 },
    { id: 'embilipitiya', name: 'Embilipitiya',  sub: 'Sabaragamuwa Province',    prov: 'SG', lat: 6.3439, lng: 80.8496 },
  ];
  const CITY = Object.fromEntries(CITIES.map(c => [c.id, c]));

  // Road links: [a, b, road-to-straight-line factor]
  const ROADS = [
    ['colombo', 'negombo', 1.2], ['colombo', 'kalutara', 1.1], ['colombo', 'kegalle'], ['colombo', 'kurunegala'],
    ['colombo', 'ratnapura', 1.3], ['negombo', 'chilaw', 1.15], ['chilaw', 'puttalam', 1.15], ['chilaw', 'kurunegala'],
    ['puttalam', 'anuradhapura', 1.3], ['kurunegala', 'kandy', 1.35], ['kurunegala', 'dambulla'], ['kurunegala', 'anuradhapura'],
    ['kegalle', 'kandy', 1.3], ['kandy', 'dambulla', 1.2], ['kandy', 'nuwaraeliya', 1.8], ['kandy', 'badulla', 2.3],
    ['dambulla', 'anuradhapura', 1.2], ['dambulla', 'trincomalee', 1.2], ['dambulla', 'polonnaruwa', 1.2],
    ['anuradhapura', 'vavuniya', 1.2], ['vavuniya', 'jaffna', 1.2], ['vavuniya', 'mannar', 1.3], ['vavuniya', 'trincomalee', 1.3],
    ['polonnaruwa', 'batticaloa', 1.25], ['trincomalee', 'batticaloa', 1.4], ['batticaloa', 'ampara', 1.4], ['ampara', 'badulla', 1.7],
    ['nuwaraeliya', 'badulla', 1.8], ['badulla', 'ella', 1.6], ['ella', 'kataragama', 1.35], ['ratnapura', 'embilipitiya', 1.3],
    ['ratnapura', 'ella', 1.45], ['embilipitiya', 'hambantota', 1.25], ['kalutara', 'galle', 1.1], ['galle', 'matara', 1.15],
    ['matara', 'hambantota', 1.2], ['hambantota', 'kataragama', 1.2],
  ];

  const CLASSES = {
    normal:  { id: 'normal',  label: 'Normal',         rate: 2.9, speed: 34, left: 2, right: 3, rows: 9,  perks: ['Frequent stops'] },
    semi:    { id: 'semi',    label: 'Semi-Luxury',    rate: 4.2, speed: 38, left: 2, right: 2, rows: 10, perks: ['Reclining seats', 'Fewer stops'] },
    luxury:  { id: 'luxury',  label: 'Luxury A/C',     rate: 5.8, speed: 42, left: 2, right: 2, rows: 10, perks: ['Air conditioned', 'Reclining seats', 'Charging ports'] },
    express: { id: 'express', label: 'Expressway A/C', rate: 7.4, speed: 68, left: 2, right: 2, rows: 10, perks: ['Air conditioned', 'Expressway', 'Wi-Fi'] },
  };

  // Pairs served by the expressway network
  const EXPRESS_GROUPS = [
    ['colombo', 'kalutara', 'galle', 'matara', 'hambantota'],
    ['colombo', 'kurunegala'],
  ];

  const ROUTE_NO = {
    'colombo|kandy': '1', 'colombo|matara': '2', 'colombo|galle': '2', 'colombo|kurunegala': '5', 'colombo|anuradhapura': '15',
    'colombo|jaffna': '87', 'colombo|badulla': '99', 'colombo|ratnapura': '122', 'colombo|negombo': '240',
  };

  // Routes that always show buses on the live map
  const LIVE_ROUTES = [
    ['colombo', 'kandy'], ['colombo', 'galle'], ['colombo', 'matara'], ['colombo', 'jaffna'], ['colombo', 'anuradhapura'],
    ['colombo', 'trincomalee'], ['colombo', 'badulla'], ['colombo', 'negombo'], ['colombo', 'kurunegala'], ['colombo', 'ratnapura'],
    ['kandy', 'nuwaraeliya'], ['kandy', 'jaffna'], ['kandy', 'trincomalee'], ['galle', 'kataragama'], ['colombo', 'batticaloa'],
    ['kandy', 'badulla'], ['colombo', 'hambantota'], ['anuradhapura', 'jaffna'], ['colombo', 'nuwaraeliya'], ['kandy', 'polonnaruwa'],
  ];

  const POPULAR = [
    ['colombo', 'kandy'], ['colombo', 'galle'], ['colombo', 'jaffna'],
    ['kandy', 'nuwaraeliya'], ['colombo', 'trincomalee'], ['colombo', 'ella'],
  ];

  /* ---------- helpers ---------- */
  function haversine(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pad = n => String(n).padStart(2, '0');
  function fmtDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

  /* ---------- road graph ---------- */
  const ADJ = {};
  ROADS.forEach(([a, b, f = 1.25]) => {
    const km = Math.round(haversine(CITY[a], CITY[b]) * f);
    (ADJ[a] = ADJ[a] || []).push([b, km]);
    (ADJ[b] = ADJ[b] || []).push([a, km]);
  });

  const routeCache = {};
  function route(from, to) {
    if (!CITY[from] || !CITY[to] || from === to) return null;
    const key = from + '|' + to;
    if (routeCache[key]) return routeCache[key];
    const dist = {}, prev = {}, done = new Set();
    CITIES.forEach(c => (dist[c.id] = Infinity));
    dist[from] = 0;
    while (true) {
      let u = null;
      for (const id in dist) if (!done.has(id) && (u === null || dist[id] < dist[u])) u = id;
      if (u === null || dist[u] === Infinity || u === to) break;
      done.add(u);
      for (const [v, w] of ADJ[u] || []) {
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
      }
    }
    if (dist[to] === Infinity) return null;
    const path = [to];
    while (path[0] !== from) path.unshift(prev[path[0]]);
    return (routeCache[key] = { path, km: dist[to] });
  }

  function isExpressway(a, b) {
    return EXPRESS_GROUPS.some(g => g.includes(a) && g.includes(b));
  }
  function fare(km, cls) {
    return Math.max(40, Math.round((km * CLASSES[cls].rate) / 10) * 10);
  }
  function routeNo(a, b, cls) {
    const key = [a, b].sort().join('|');
    const base = ROUTE_NO[key] || String(100 + (hashStr(key) % 800));
    return cls === 'express' ? 'EX ' + base : base;
  }

  /* ---------- timetable ---------- */
  const tripCache = {};
  function tripsFor(from, to, date) {
    const key = `${from}|${to}|${date}`;
    if (tripCache[key]) return tripCache[key];
    const r = route(from, to);
    const day = parseDate(date);
    if (!r || !day) return [];
    const rand = rng(hashStr(from + '>' + to)); // same timetable every day
    const n = r.km < 60 ? 22 : r.km < 150 ? 16 : r.km < 260 ? 11 : 7;
    const startMin = 4 * 60 + 15 + Math.floor(rand() * 30);
    const endMin = r.km > 250 ? 22 * 60 + 30 : 21 * 60;
    const step = (endMin - startMin) / (n - 1);
    const exp = isExpressway(from, to);
    const trips = [];
    for (let i = 0; i < n; i++) {
      const depMin = Math.round((startMin + i * step + (rand() - 0.5) * step * 0.4) / 5) * 5;
      const x = rand();
      const cls = exp && x < 0.32 ? 'express' : x < 0.5 ? 'normal' : x < 0.75 ? 'semi' : 'luxury';
      const C = CLASSES[cls];
      const stops = cls === 'express' ? 0 : r.path.length - 2;
      const durMin = Math.round((r.km / C.speed * 60 + stops * 8 + 10) / 5) * 5;
      const operator = cls === 'normal' && rand() < 0.55 ? 'SLTB' : 'Private';
      const letter = 'ABCDEFGHJK'[Math.floor(rand() * 10)];
      const busNo = `${CITY[from].prov} N${letter}-${1000 + Math.floor(rand() * 9000)}`;
      const dep = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, depMin);
      const arr = new Date(dep.getTime() + durMin * 60000);
      trips.push({
        id: `${from}_${to}_${date}_${i}`, from, to, date, idx: i, cls, dep, arr, durMin,
        km: r.km, path: r.path, fare: fare(r.km, cls), busNo, operator,
        routeNo: routeNo(from, to, cls),
        seatsTotal: C.rows * (C.left + C.right) + C.left + C.right + 1,
      });
    }
    trips.sort((a, b) => a.dep - b.dep);
    return (tripCache[key] = trips);
  }

  function tripById(id) {
    const m = /^([a-z]+)_([a-z]+)_(\d{4}-\d{2}-\d{2})_(\d+)$/.exec(id || '');
    if (!m) return null;
    return tripsFor(m[1], m[2], m[3]).find(t => t.idx === +m[4]) || null;
  }

  // Seats already taken by other travellers (simulated)
  function seededOccupied(trip) {
    const rand = rng(hashStr(trip.id + '#seats'));
    const frac = 0.15 + rand() * 0.5;
    const set = new Set();
    for (let n = 1; n <= trip.seatsTotal; n++) if (rand() < frac) set.add(n);
    return set;
  }

  /* ---------- live positions ---------- */
  function pathCoords(path) { return path.map(id => [CITY[id].lat, CITY[id].lng]); }

  function positionOf(trip, now) {
    const total = trip.arr - trip.dep;
    const p = Math.min(1, Math.max(0, (now - trip.dep) / total));
    const pts = trip.path.map(id => CITY[id]);
    const segs = [];
    let sum = 0;
    for (let i = 0; i < pts.length - 1; i++) { const d = haversine(pts[i], pts[i + 1]); segs.push(d); sum += d; }
    let target = p * sum, i = 0;
    while (i < segs.length - 1 && target > segs[i]) { target -= segs[i]; i++; }
    const f = segs[i] ? Math.min(1, target / segs[i]) : 0;
    const a = pts[i], b = pts[i + 1];
    const C = CLASSES[trip.cls];
    const wobble = Math.sin(now / 9000 + hashStr(trip.id) % 100) * 6;
    return {
      lat: a.lat + (b.lat - a.lat) * f,
      lng: a.lng + (b.lng - a.lng) * f,
      progress: p,
      nextStop: trip.path[i + 1],
      speed: Math.max(0, Math.round(C.speed * 1.25 + wobble)),
      etaMin: Math.max(0, Math.round((trip.arr - now) / 60000)),
    };
  }

  function activeTrips(now, extraIds = []) {
    const today = fmtDate(now), yest = fmtDate(addDays(now, -1));
    const out = new Map();
    for (const [a, b] of LIVE_ROUTES) {
      for (const [x, y] of [[a, b], [b, a]]) {
        for (const d of [yest, today]) {
          // Every other departure carries a GPS unit; keeps the map readable
          for (const t of tripsFor(x, y, d)) if (t.idx % 2 === 0 && t.dep <= now && now < t.arr) out.set(t.id, t);
        }
      }
    }
    extraIds.forEach(id => {
      const t = tripById(id);
      if (t && t.dep <= now && now < t.arr) out.set(t.id, t);
    });
    return [...out.values()];
  }

  window.Data = {
    CITIES, CITY, CLASSES, POPULAR, LIVE_ROUTES,
    route, tripsFor, tripById, seededOccupied, isExpressway, fare,
    positionOf, activeTrips, pathCoords, haversine, hashStr,
    fmtDate, parseDate, addDays,
  };
})();
