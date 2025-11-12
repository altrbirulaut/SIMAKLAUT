// Simulasi data untuk lokasi berbeda
const locationData = {
    anyer: {
        tideStatus: 'Pasang',
        tideHeight: '1.8 m',
        nextHighTide: '14:30',
        nextLowTide: '20:15',
        weatherCondition: 'Cerah Berawan',
        temperature: '28°C',
        humidity: '75%',
        windSpeed: '12 km/h',
        windDirection: 'Barat Laut',
        seaTemp: '29.2°C',
        salinity: '33.5 PSU',
        waveHeight: '0.8 m',
        wavePeriod: '5.2 detik',
        current: '0.5 m/s',
        coords: [-6.0373, 105.9339]
    },
    carita: {
        tideStatus: 'Surut',
        tideHeight: '0.9 m',
        nextHighTide: '15:45',
        nextLowTide: '21:30',
        weatherCondition: 'Berawan',
        temperature: '27°C',
        humidity: '78%',
        windSpeed: '15 km/h',
        windDirection: 'Barat',
        seaTemp: '28.8°C',
        salinity: '33.2 PSU',
        waveHeight: '1.1 m',
        wavePeriod: '5.8 detik',
        current: '0.6 m/s',
        coords: [-6.2769, 105.8597]
    },
    sawarna: {
        tideStatus: 'Pasang',
        tideHeight: '2.1 m',
        nextHighTide: '13:15',
        nextLowTide: '19:45',
        weatherCondition: 'Cerah',
        temperature: '29°C',
        humidity: '72%',
        windSpeed: '18 km/h',
        windDirection: 'Selatan',
        seaTemp: '29.5°C',
        salinity: '34.0 PSU',
        waveHeight: '1.5 m',
        wavePeriod: '6.5 detik',
        current: '0.8 m/s',
        coords: [-7.0167, 106.4167]
    },
    tanjunglesung: {
        tideStatus: 'Surut',
        tideHeight: '0.7 m',
        nextHighTide: '16:00',
        nextLowTide: '22:00',
        weatherCondition: 'Cerah Berawan',
        temperature: '28°C',
        humidity: '74%',
        windSpeed: '10 km/h',
        windDirection: 'Barat Laut',
        seaTemp: '29.0°C',
        salinity: '33.3 PSU',
        waveHeight: '0.6 m',
        wavePeriod: '4.8 detik',
        current: '0.4 m/s',
        coords: [-6.5667, 105.6833]
    },
    labuan: {
        tideStatus: 'Pasang',
        tideHeight: '1.6 m',
        nextHighTide: '14:45',
        nextLowTide: '20:30',
        weatherCondition: 'Hujan Ringan',
        temperature: '26°C',
        humidity: '82%',
        windSpeed: '20 km/h',
        windDirection: 'Barat Daya',
        seaTemp: '28.5°C',
        salinity: '33.0 PSU',
        waveHeight: '1.3 m',
        wavePeriod: '6.0 detik',
        current: '0.7 m/s',
        coords: [-6.3667, 105.7833]
    },
    bagedur: {
        tideStatus: 'Surut',
        tideHeight: '1.0 m',
        nextHighTide: '15:30',
        nextLowTide: '21:15',
        weatherCondition: 'Cerah',
        temperature: '30°C',
        humidity: '70%',
        windSpeed: '14 km/h',
        windDirection: 'Utara',
        seaTemp: '29.8°C',
        salinity: '33.8 PSU',
        waveHeight: '0.9 m',
        wavePeriod: '5.5 detik',
        current: '0.5 m/s',
        coords: [-6.7833, 106.3000]
    }
};

function updateDashboardData(location) {
    const data = locationData[location];
    
    document.getElementById('tideStatus').textContent = data.tideStatus;
    document.getElementById('tideHeight').textContent = data.tideHeight;
    document.getElementById('nextHighTide').textContent = data.nextHighTide;
    document.getElementById('nextLowTide').textContent = data.nextLowTide;
    document.getElementById('weatherCondition').textContent = data.weatherCondition;
    document.getElementById('temperature').textContent = data.temperature;
    document.getElementById('humidity').textContent = data.humidity;
    document.getElementById('windSpeed').textContent = data.windSpeed;
    document.getElementById('windDirection').textContent = data.windDirection;
    document.getElementById('seaTemp').textContent = data.seaTemp;
    document.getElementById('salinity').textContent = data.salinity;
    document.getElementById('waveHeight').textContent = data.waveHeight;
    document.getElementById('wavePeriod').textContent = data.wavePeriod;
    document.getElementById('current').textContent = data.current;
}

// Leaflet Map
let map;
window.mapInitialized = false;

function initMap() {
    if (window.mapInitialized) return;
    
    // Pastikan L (Leaflet) sudah terdefinisi
    if (typeof L === 'undefined') {
        console.error("Leaflet library not loaded.");
        return;
    }
    
    map = L.map('map').setView([-6.3, 106.0], 9);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marker untuk setiap pantai
    const beaches = [
        { name: 'Pantai Anyer', coords: [-6.0879,105.8838], loc: 'anyer' },
        { name: 'Pantai Carita', coords: [-6.3166,105.8303], loc: 'carita' },
        { name: 'Pantai Sawarna', coords: [-6.9849,106.3006], loc: 'sawarna' },
        { name: 'Tanjung Lesung', coords: [-6.4793,105.6533], loc: 'tanjunglesung' },
        { name: 'Pantai Labuan', coords: [-6.3714,105.8189], loc: 'labuan' },
        { name: 'Pantai Bagedur', coords: [-6.8139,105.9821], loc: 'bagedur' }
    ];

    beaches.forEach(beach => {
        const data = locationData[beach.loc];
        const marker = L.marker(beach.coords).addTo(map);
        marker.bindPopup(`
            <div style="color: #0a1929; min-width: 200px;">
                <h3 style="margin-bottom: 10px; color: #1565c0;">${beach.name}</h3>
                <p><strong>Pasang Surut:</strong> ${data.tideStatus} (${data.tideHeight})</p>
                <p><strong>Cuaca:</strong> ${data.weatherCondition}</p>
                <p><strong>Suhu:</strong> ${data.temperature}</p>
                <p><strong>Tinggi Gelombang:</strong> ${data.waveHeight}</p>
                <button onclick="
                    document.getElementById('locationSelect').value='${beach.loc}'; 
                    updateDashboardData('${beach.loc}'); 
                    document.querySelector('[data-section=dashboard]').click();
                " style="margin-top: 10px; padding: 5px 15px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">Lihat Detail</button>
            </div>
        `);
    });

    window.mapInitialized = true;
}

// Global functions for modal (needed because they are called via inline HTML onclick)
window.openNewThreadModal = function() {
    document.getElementById('newThreadModal').classList.add('active');
}

window.closeNewThreadModal = function() {
    document.getElementById('newThreadModal').classList.remove('active');
    document.getElementById('newThreadForm').reset();
}

window.openLoginModal = function() {
    alert("Login modal logic goes here. (Not implemented in this demo.)");
    // Could display a dedicated login modal
}

window.logout = function() {
    alert("Logout logic goes here.");
    // Could hide user button and show login button
}


// Event Listeners setelah DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(section);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            if (section === 'peta' && !window.mapInitialized) {
                initMap();
            }
        });
    });

    // Location selector
    const locationSelect = document.getElementById('locationSelect');
    if(locationSelect) {
        locationSelect.addEventListener('change', (e) => {
            updateDashboardData(e.target.value);
        });
    }

    // Forum Functions
    const newThreadForm = document.getElementById('newThreadForm');
    if(newThreadForm) {
        newThreadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('threadTitle').value;
            const author = document.getElementById('authorName').value;
            const content = document.getElementById('threadContent').value;
            const tags = document.getElementById('threadTags').value;
            
            const newThread = document.createElement('div');
            newThread.className = 'discussion-thread';
            newThread.innerHTML = `
                <div class="thread-header">
                    <div>
                        <div class="thread-title">${title}</div>
                        <div class="thread-meta">oleh ${author} • Baru saja</div>
                    </div>
                    <span class="status-badge status-normal">Baru</span>
                </div>
                <div class="thread-content">
                    ${content}
                </div>
                <div class="thread-footer">
                    <span>👁️ 0 dilihat</span>
                    <span>💬 0 balasan</span>
                    <span>🏷️ ${tags || 'Umum'}</span>
                </div>
            `;
            
            const discussionList = document.getElementById('discussionList');
            if(discussionList) {
                discussionList.insertBefore(newThread, discussionList.firstChild);
            }
            
            window.closeNewThreadModal();
            
            // Show success (could be improved with better UI feedback)
            alert('Diskusi berhasil dipublikasikan!');
        });
    }

    // Close modal when clicking outside
    const newThreadModal = document.getElementById('newThreadModal');
    if(newThreadModal) {
        newThreadModal.addEventListener('click', (e) => {
            if (e.target === newThreadModal) {
                window.closeNewThreadModal();
            }
        });
    }

    // Initialize with default location
    updateDashboardData('anyer');

    // Simulasi update data real-time setiap 30 detik
    setInterval(() => {
        const currentLocation = document.getElementById('locationSelect').value;
        const data = locationData[currentLocation];
        
        // Simulasi perubahan kecil pada beberapa nilai - uncomment below for 'real-time' changes
        /*
        const waveVariation = (Math.random() * 0.2 - 0.1).toFixed(1);
        const tempVariation = (Math.random() * 0.4 - 0.2).toFixed(1);
        // This is where you would update data for a real-time feel
        */
    }, 30000);
});