const canvas = document.getElementById('doodleCanvas');
const ctx = canvas.getContext('2d');
const noteText = document.getElementById('noteText');
const saveBtn = document.getElementById('saveEntry');
const clearBtn = document.getElementById('clearCanvas');
const entriesList = document.getElementById('entriesList');

// Color Studio Elements
const colorWheel = document.getElementById('colorWheel');
const hexInput = document.getElementById('hexInput');
const saveToPaletteBtn = document.getElementById('saveToPalette');
const paletteGrid = document.getElementById('paletteGrid');

// Library Elements
const toggleJarView = document.getElementById('toggleJarView');
const toggleCalendarView = document.getElementById('toggleCalendarView');
const jarViewContainer = document.getElementById('jarViewContainer');
const calendarViewContainer = document.getElementById('calendarViewContainer');
const jarCanvas = document.getElementById('jarCanvas');
const jarCtx = jarCanvas.getContext('2d');
const doodleCountSpan = document.getElementById('doodleCount');
const calendarGrid = document.getElementById('calendarGrid');
const calendarMonthYear = document.getElementById('calendarMonthYear');

let currentColor = '#000000';

function setupCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;
    
    // Set high-res scaling for Jar canvas
    jarCanvas.width = jarCanvas.offsetWidth;
    jarCanvas.height = jarCanvas.offsetHeight;
}

window.onload = () => { 
    setupCanvas(); 
    displayEntries(); 
    loadPalette();
    renderLibrary();
};

// Tab Toggling
toggleJarView.addEventListener('click', () => {
    toggleJarView.classList.add('active');
    toggleCalendarView.classList.remove('active');
    jarViewContainer.classList.remove('hidden');
    calendarViewContainer.classList.add('hidden');
    renderJar();
});

toggleCalendarView.addEventListener('click', () => {
    toggleCalendarView.classList.add('active');
    toggleJarView.classList.remove('active');
    calendarViewContainer.classList.remove('hidden');
    jarViewContainer.classList.add('hidden');
    renderCalendar();
});

// Sync Color Elements
function updateColorState(newHex) {
    currentColor = newHex;
    ctx.strokeStyle = currentColor;
    colorWheel.value = newHex;
    hexInput.value = newHex.replace('#', '');
}
colorWheel.addEventListener('input', (e) => updateColorState(e.target.value));
hexInput.addEventListener('input', (e) => {
    let val = e.target.value;
    if(val.length === 6) updateColorState('#' + val);
});

// Palette Storage
saveToPaletteBtn.addEventListener('click', () => {
    let palette = JSON.parse(localStorage.getItem('savedPalette')) || [];
    if (!palette.includes(currentColor)) {
        palette.push(currentColor);
        localStorage.setItem('savedPalette', JSON.stringify(palette));
        loadPalette();
    }
});
function loadPalette() {
    paletteGrid.innerHTML = '';
    const palette = JSON.parse(localStorage.getItem('savedPalette')) || ['#000000', '#FF3B30', '#34C759', '#007AFF', '#FFCC00'];
    palette.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => updateColorState(color));
        paletteGrid.appendChild(swatch);
    });
}

// Drawing Engine
let drawing = false;
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches.clientX : e.clientX;
    const clientY = e.touches ? e.touches.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}
function startDraw(e) { drawing = true; draw(e); }
function endDraw() { drawing = false; ctx.beginPath(); }
function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', endDraw);
clearBtn.addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

// LIBRARY ENGINE: JAR & CALENDAR VIEW
function renderLibrary() {
    renderJar();
    renderCalendar();
}

function renderJar() {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    doodleCountSpan.innerText = entries.length;

    const w = jarCanvas.width;
    const h = jarCanvas.height;
    jarCtx.clearRect(0, 0, w, h);

    // Draw Jar Outline
    jarCtx.strokeStyle = '#3a3a3c';
    jarCtx.lineWidth = 4;
    jarCtx.lineCap = 'round';
    jarCtx.beginPath();
    // Lid opening
    jarCtx.moveTo(w * 0.3, h * 0.1);
    jarCtx.lineTo(w * 0.7, h * 0.1);
    // Neck
    jarCtx.moveTo(w * 0.35, h * 0.1);
    jarCtx.lineTo(w * 0.35, h * 0.18);
    jarCtx.moveTo(w * 0.65, h * 0.18);
    jarCtx.lineTo(w * 0.65, h * 0.1);
    // Body and Base
    jarCtx.bezierCurveTo(w * 0.65, h * 0.25, w * 0.95, h * 0.3, w * 0.9, h * 0.85);
    jarCtx.bezierCurveTo(w * 0.88, h * 0.95, w * 0.12, h * 0.95, w * 0.1, h * 0.85);
    jarCtx.bezierCurveTo(w * 0.05, h * 0.3, w * 0.35, h * 0.25, w * 0.35, h * 0.18);
    jarCtx.stroke();

    // Fill Jar with custom memory square fragments based on entries
    // Uses pseudo-random deterministic math so tokens settle nicely inside the jar boundaries
    entries.forEach((item, index) => {
        let seed = index * 45.32;
        let randX = Math.sin(seed) * (w * 0.25) + (w * 0.5);
        let randY = (h * 0.85) - (Math.floor(index / 4) * 16) - (Math.abs(Math.cos(seed)) * 8);
        
        // Boundaries safety check
        if (randY < h * 0.25) randY = h * 0.25; 

        jarCtx.fillStyle = '#0071e3'; // Default fall back
        jarCtx.save();
        jarCtx.translate(randX, randY);
        jarCtx.rotate(Math.sin(seed));
        
        // Draw tiny colored note ticket representing the memory
        jarCtx.fillStyle = 'rgba(0, 113, 227, 0.75)';
        jarCtx.fillRect(-8, -6, 16, 12);
        jarCtx.strokeStyle = 'rgba(255,255,255,0.6)';
        jarCtx.lineWidth = 1;
        jarCtx.strokeRect(-8, -6, 16, 12);
        jarCtx.restore();
    });
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    calendarMonthYear.innerText = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Create empty offset days for structural padding
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        calendarGrid.appendChild(emptyCell);
    }

    // Build actual active dates matching entries
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.innerText = day;
        
        // Check for doodles saved on this day
        const dayString = `${month + 1}/${day}/${year}`;
        const match = entries.find(e => new Date(e.date).toLocaleDateString() === new Date(year, month, day).toLocaleDateString());
        
        if (match) {
            cell.classList.add('has-doodle');
            const thumb = document.createElement('img');
            thumb.className = 'calendar-dot';
            thumb.src = match.doodle;
            cell.appendChild(thumb);
        }
        
        calendarGrid.appendChild(cell);
    }
}

// Save Entry Core Wrap
saveBtn.addEventListener('click', () => {
    if (!noteText.value.trim() && ctx.getImageData(0,0,10,10).data.every(val => val === 0)) return;

    const entry = {
        date: new Date().toISOString(),
        note: noteText.value,
        doodle: canvas.toDataURL()
    };
    let entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    entries.unshift(entry);
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    
    noteText.value = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    displayEntries();
    renderLibrary();
});

function displayEntries() {
    entriesList.innerHTML = '';
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    entries.forEach(item => {
        const div = document.createElement('div');
        div.className = 'entry-card';
        div.innerHTML = `
            <strong>${new Date(item.date).toLocaleString()}</strong>
            <p>${item.note}</p>
            <img src="${item.doodle}" />
        `;
        entriesList.appendChild(div);
    });
}