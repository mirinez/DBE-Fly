/*
   flights.js - Die DBE-Fly | Flight Booking Logic
   Míriam Domínguez Martínez - 25.03.2026
*/

/* 
   STATE
*/
let currentSort    = 'price';
let currentResults = [];
let currentClass   = 'economy';
let flights        = [];

/*
   INIT: Load JSON data and attach events
*/
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/flights.json')
        .then(response => response.json())
        .then(data => {
            flights = data;
            attachEvents();
        })
        .catch(err => console.error('Fehler beim Laden der Flugdaten:', err));
});

/*
   EVENTS
*/
function attachEvents() {

    /* Form submit → search */
    document.getElementById('booking-form').addEventListener('submit', function (e) {
        e.preventDefault();
        searchFlights();
    });

    /* Sort filter buttons */
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            applySortAndRender();
        });
    });

    /* Book button - event delegation */
    document.getElementById('results-list').addEventListener('click', function (e) {
        if (e.target.classList.contains('book-btn')) {
            const card  = e.target.closest('.flight-card');
            const route = card.querySelector('.flight-route');
            const from  = route.querySelector('.flight-city:first-child .city-name').textContent;
            const to    = route.querySelector('.flight-city:last-child  .city-name').textContent;
            alert(`✈ Buchung gestartet: ${from} → ${to}\n\nIn einer echten Anwendung würde hier der Buchungsprozess beginnen.`);
        }
    });
}

/*
   HELPER: Parse price string → integer  ("150 EUR" → 150)
*/
function parsePrice(priceStr) {
    return parseInt(priceStr.replace(/\D/g, ''), 10);
}

/*
   HELPER: Parse duration string → minutes  ("1h 25m" → 85)
*/
function parseDuration(durationStr) {
    const match = durationStr.match(/(\d+)h\s*(\d+)m/);
    return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0;
}

/*
   HELPER: Get selected travel class from dropdown
*/
function getSelectedClass() {
    return document.getElementById('passengers').value === 'business' ? 'business' : 'economy';
}

/*
   SEARCH: Filter flights by origin and destination
*/
function searchFlights() {
    const fromInput = document.getElementById('from').value.trim().toLowerCase();
    const toInput   = document.getElementById('to').value.trim().toLowerCase();
    currentClass    = getSelectedClass();

    currentResults = flights.filter(f => {
        const matchFrom = fromInput === '' || f.start.toLowerCase().includes(fromInput);
        const matchTo   = toInput   === '' || f.ziel.toLowerCase().includes(toInput);
        return matchFrom && matchTo;
    });

    applySortAndRender();
}

/*
   SORT & RENDER: Sort currentResults and inject cards into DOM
*/
function applySortAndRender() {
    const sorted = [...currentResults].sort((a, b) => {
        if (currentSort === 'price')    return parsePrice(a.preis[currentClass])  - parsePrice(b.preis[currentClass]);
        if (currentSort === 'duration') return parseDuration(a.flugdauer)         - parseDuration(b.flugdauer);
        if (currentSort === 'stops')    return a.stops - b.stops;
        return 0;
    });

    const resultsSection = document.getElementById('results-section');
    const mainContent    = document.getElementById('main-content');
    const resultsList    = document.getElementById('results-list');
    const noResults      = document.getElementById('no-results');
    const countText      = document.getElementById('results-count-text');
    const subtitle       = document.getElementById('results-subtitle');

    /* Show results, hide editorial section */
    resultsSection.style.display = 'block';
    mainContent.style.display    = 'none';

    /* Update subtitle with selected route */
    const fromVal = document.getElementById('from').value.trim() || 'Alle Abflugsorte';
    const toVal   = document.getElementById('to').value.trim()   || 'Alle Ziele';
    subtitle.textContent = `${fromVal} → ${toVal}`;

    if (sorted.length === 0) {
        resultsList.innerHTML   = '';
        noResults.style.display = 'block';
        countText.textContent   = '';
    } else {
        noResults.style.display = 'none';
        countText.textContent   = `${sorted.length} Flug${sorted.length !== 1 ? 'angebote' : 'angebot'} gefunden`;
        resultsList.innerHTML   = sorted.map(f => renderFlightCard(f, currentClass)).join('');
    }

    /* Smooth scroll to results */
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/*
   RENDER: Build HTML string for a single flight card
*/
function renderFlightCard(flight, flightClass) {
    const price      = flight.preis[flightClass];
    const stopsLabel = flight.stops === 0
        ? '<span class="badge badge-direct">Direktflug</span>'
        : `<span class="badge badge-stops">${flight.stops} Stopp</span>`;

    const startCode = flight.start.match(/\(([^)]+)\)/)?.[1] ?? '';
    const startName = flight.start.replace(/\s*\([^)]*\)/, '');
    const zielCode  = flight.ziel.match(/\(([^)]+)\)/)?.[1]  ?? '';
    const zielName  = flight.ziel.replace(/\s*\([^)]*\)/, '');
    const classTag  = flightClass === 'business' ? 'Business' : 'Economy';

    return `
    <article class="flight-card">
        <div class="flight-route">
            <div class="flight-city">
                <span class="city-code">${startCode}</span>
                <span class="city-name">${startName}</span>
            </div>
            <div class="flight-arrow">
                <div class="arrow-line">
                    <span class="arrow-duration">${flight.flugdauer}</span>
                </div>
                ✈
            </div>
            <div class="flight-city">
                <span class="city-code">${zielCode}</span>
                <span class="city-name">${zielName}</span>
            </div>
        </div>
        <div class="flight-meta">
            ${stopsLabel}
            <span class="meta-item">Terminal ${flight.terminal}</span>
            <span class="meta-item class-tag">${classTag}</span>
        </div>
        <div class="flight-price">
            <span class="price-amount">${price}</span>
            <button class="book-btn">Auswählen</button>
        </div>
    </article>
    `;
}
