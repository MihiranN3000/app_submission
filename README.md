# LankaRide — Sri Lanka bus schedules, tickets & live tracking

A front-end website (HTML, CSS, vanilla JavaScript). No build step: open `index.html` in a browser.

## Pages
| Route | What it does |
|---|---|
| `#/` | Home with the central From / To / Date search bar |
| `#/search` | Buses for a route and day, with class/time filters and sorting |
| `#/seats?trip=…` | Interactive seat map and booking (login required) |
| `#/bookings` | Upcoming / past / cancelled tickets, e-ticket, cancel seats (login required) |
| `#/schedules` | Full timetable for a route with live status |
| `#/fares` | Fare calculator and fare table from any town |
| `#/track` | Live map of buses on the road (Leaflet) |
| `#/login`, `#/register` | Username + password accounts |

Demo account: **demo / demo1234**

## Files
- `js/data.js`: towns, road network, shortest-path routing, timetable, fare and live-position generation
- `js/store.js`: accounts (PBKDF2-hashed passwords) and bookings, saved in `localStorage`
- `js/app.js`: router, pages and UI components
- `css/styles.css`: theme, layout and animations

## Before going live
This is a front-end prototype. Timetables, fares and bus positions are simulated, and accounts and
bookings exist only in the visitor's browser. A real launch needs a backend for: user accounts and
sessions, a shared seat inventory (so two people can't book the same seat), payments, and real GPS
feeds from buses.
