// Simulasi data untuk lokasi berbeda
const locationData = {
    // ... data lokasi yang sudah ada ...
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
        coords: [-6.0879,105.8838]
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
        coords: [-6.3166,105.8303]
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
        coords: [-6.9849,106.3006]
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
        coords: [-6.4793,105.6533]
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
        coords: [-6.3714,105.8189]
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
        coords: [-6.8139,105.9821]
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


// --- START: New Login/Logout/SignUp Functions ---

// Mock user state
let currentUser = null; 

function updateHeaderButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    const userNameSpan = document.getElementById('userName');

    if (currentUser) {
        loginBtn.style.display = 'none';
        userBtn.style.display = 'block';
        userNameSpan.textContent = currentUser.username || 'Pengguna';
    } else {
        loginBtn.style.display = 'block';
        userBtn.style.display = 'none';
    }
}

window.openLoginModal = function() {
    document.getElementById('signUpModal').classList.remove('active');
    document.getElementById('loginModal').classList.add('active');
}

window.closeLoginModal = function() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('loginForm').reset();
}

window.openSignUpModal = function() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('signUpModal').classList.add('active');
}

window.closeSignUpModal = function() {
    document.getElementById('signUpModal').classList.remove('active');
    document.getElementById('signUpForm').reset();
}

window.logout = function() {
    currentUser = null;
    updateHeaderButtons();
    alert("Anda telah berhasil keluar (Logout).");
}

// Global functions for other modals (needed because they are called via inline HTML onclick)
window.openNewThreadModal = function() {
    // Only allow forum access if logged in
    if (!currentUser) {
        alert("Anda harus masuk (login) untuk membuat diskusi baru.");
        openLoginModal();
        return;
    }
    document.getElementById('newThreadModal').classList.add('active');
}

window.closeNewThreadModal = function() {
    document.getElementById('newThreadModal').classList.remove('active');
    document.getElementById('newThreadForm').reset();
}
// --- END: New Login/Logout/SignUp Functions ---

// --- START: New Contact Modal Functions ---

window.openContactModal = function() {
    document.getElementById('contactModal').classList.add('active');
}

window.closeContactModal = function() {
    document.getElementById('contactModal').classList.remove('active');
    document.getElementById('contactForm').reset();
}

// --- END: New Contact Modal Functions ---


// Event Listeners setelah DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Initialize header buttons state
    updateHeaderButtons();

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

    // --- START: New Login/SignUp Form Handlers ---
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            // Mock API Login Logic
            if (username === "riset" && password === "simaklaut") {
                currentUser = { username: "Riset_BMKG", fullname: "Tim Riset BMKG" };
                alert(`Selamat datang, ${currentUser.username}! Login berhasil.`);
                closeLoginModal();
                updateHeaderButtons();
            } else {
                alert("Login gagal. Nama pengguna mock adalah 'riset' dan kata sandi 'simaklaut'.");
            }
        });
    }

    const signUpForm = document.getElementById('signUpForm');
    if(signUpForm) {
        signUpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullname = document.getElementById('signupFullname').value;
            const username = document.getElementById('signupUsername').value;
            const password = document.getElementById('signupPassword').value;
            const email = document.getElementById('signupEmail').value;
            
            // Mock API Sign Up Logic
            if (password.length < 6) {
                alert("Kata sandi harus minimal 6 karakter.");
                return;
            }
            
            // Assume successful registration for mock
            alert(`Pendaftaran berhasil untuk ${fullname} dengan username: ${username}! Silakan masuk (login).`);
            closeSignUpModal();
            openLoginModal();
        });
    }

    // Handle modal clicks outside content area
    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') closeLoginModal();
    });

    document.getElementById('signUpModal').addEventListener('click', (e) => {
        if (e.target.id === 'signUpModal') closeSignUpModal();
    });
    // --- END: New Login/SignUp Form Handlers ---

// --- START: New Contact Form Handler ---
const contactForm = document.getElementById('contactForm');
if(contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const feedback = document.getElementById('contactFeedback').value;

        // Konfigurasi Web3Forms
        const accessKey = "6ca28dc9-17ae-44ce-ae53-8a279705e575";
        const apiUrl = "https://api.web3forms.com/submit";

        // Menampilkan indikator loading
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Mengirim...";
        submitButton.disabled = true;

        // Data yang akan dikirim ke Web3Forms
        const formData = {
            access_key: accessKey,
            name: name,
            email: email,
            message: feedback,
            subject: `Feedback SIMAKLAUT dari ${name}`,
            from_name: 'SIMAKLAUT Feedback System',
            reply_to: email
        };

        // Mengirim data ke Web3Forms
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Terima kasih, ${name}! Feedback Anda telah berhasil dikirim. Kami akan membalas ke ${email} jika diperlukan.`);
                window.closeContactModal();
                contactForm.reset();
            } else {
                throw new Error(data.message || 'Terjadi kesalahan saat mengirim feedback');
            }
        })
        .catch(error => {
            console.error('Error sending feedback:', error);
            alert(`Maaf, terjadi kesalahan saat mengirim feedback: ${error.message}. Silakan coba lagi nanti.`);
        })
        .finally(() => {
            // Mengembalikan tombol ke keadaan semula
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        });
    });
}

// Close contact modal when clicking outside
const contactModal = document.getElementById('contactModal');
if(contactModal) {
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            window.closeContactModal();
        }
    });
}
// --- END: New Contact Form Handler ---
    
    // Forum Functions (Update to check login status)
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
