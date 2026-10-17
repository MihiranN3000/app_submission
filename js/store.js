/* LankaRide — accounts and bookings, persisted in localStorage.
   This is a front-end demo store; a production site must do this on a server. */
(function () {
  'use strict';

  const K = { users: 'lr_users', session: 'lr_session', bookings: 'lr_bookings' };

  function read(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  }

  const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  function randomSalt() {
    const a = new Uint8Array(16);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256));
    return toHex(a);
  }
  async function hashPassword(password, salt) {
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
      return toHex(bits);
    }
    // Fallback for browsers without Web Crypto
    let h = 0;
    for (let r = 0; r < 1000; r++) h = Data.hashStr(salt + password + h);
    return 'f' + h.toString(16);
  }

  const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

  const Store = {
    async register({ username, name, password }) {
      username = (username || '').trim();
      if (!USERNAME_RE.test(username)) throw new Error('Username must be 3–20 letters, numbers or underscores.');
      if (!name || name.trim().length < 2) throw new Error('Please enter your full name.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
      const users = read(K.users, {});
      const key = username.toLowerCase();
      if (users[key]) throw new Error('That username is already taken.');
      const salt = randomSalt();
      users[key] = { username, name: name.trim(), salt, hash: await hashPassword(password, salt), createdAt: Date.now() };
      write(K.users, users);
      write(K.session, key);
      return users[key];
    },

    async login(username, password) {
      const users = read(K.users, {});
      const u = users[(username || '').trim().toLowerCase()];
      if (!u || (await hashPassword(password || '', u.salt)) !== u.hash) throw new Error('Incorrect username or password.');
      write(K.session, u.username.toLowerCase());
      return u;
    },

    logout() { localStorage.removeItem(K.session); },

    current() {
      const key = read(K.session, null);
      if (!key) return null;
      const u = read(K.users, {})[key];
      return u ? { username: u.username, name: u.name, key } : null;
    },

    async ensureDemoUser() {
      const users = read(K.users, {});
      if (users.demo) return;
      const salt = randomSalt();
      users.demo = { username: 'demo', name: 'Demo Traveller', salt, hash: await hashPassword('demo1234', salt), createdAt: Date.now() };
      write(K.users, users);
    },

    /* ---------- bookings ---------- */
    allBookings() { return read(K.bookings, []); },

    myBookings() {
      const u = this.current();
      return u ? this.allBookings().filter(b => b.user === u.key).sort((a, b) => b.createdAt - a.createdAt) : [];
    },

    activeSeats(b) { return b.seats.filter(s => !b.cancelledSeats.includes(s)); },

    bookedSeats(tripId) {
      const set = new Set();
      this.allBookings().forEach(b => { if (b.tripId === tripId) this.activeSeats(b).forEach(s => set.add(s)); });
      return set;
    },

    createBooking(trip, seats, passenger) {
      const u = this.current();
      if (!u) throw new Error('Please log in to book.');
      if (trip.dep <= new Date()) throw new Error('This bus has already departed.');
      const taken = this.bookedSeats(trip.id);
      const seeded = Data.seededOccupied(trip);
      const clash = seats.filter(s => taken.has(s) || seeded.has(s));
      if (clash.length) throw new Error(`Seat ${clash.join(', ')} was just taken. Please pick another.`);
      const ref = 'LR' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 90 + 10);
      const booking = {
        ref, user: u.key, tripId: trip.id, from: trip.from, to: trip.to, date: trip.date,
        dep: trip.dep.getTime(), arr: trip.arr.getTime(), cls: trip.cls, busNo: trip.busNo, routeNo: trip.routeNo,
        operator: trip.operator, fare: trip.fare, seats: [...seats].sort((a, b) => a - b), cancelledSeats: [],
        refunded: 0, passenger, createdAt: Date.now(),
      };
      const all = this.allBookings();
      all.push(booking);
      write(K.bookings, all);
      return booking;
    },

    // Refund share for a cancellation made now
    refundRate(b, now = Date.now()) {
      const hours = (b.dep - now) / 3600000;
      if (hours >= 24) return 0.9;
      if (hours >= 3) return 0.5;
      return 0;
    },

    cancelSeats(ref, seats) {
      const all = this.allBookings();
      const b = all.find(x => x.ref === ref);
      const u = this.current();
      if (!b || !u || b.user !== u.key) throw new Error('Booking not found.');
      const rate = this.refundRate(b);
      if (rate === 0) throw new Error('Tickets can only be cancelled up to 3 hours before departure.');
      const valid = seats.filter(s => this.activeSeats(b).includes(s));
      if (!valid.length) throw new Error('Select at least one seat to cancel.');
      const refund = Math.round(valid.length * b.fare * rate);
      b.cancelledSeats.push(...valid);
      b.refunded += refund;
      write(K.bookings, all);
      return { booking: b, refund };
    },
  };

  window.Store = Store;
})();
