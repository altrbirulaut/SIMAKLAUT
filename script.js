// Pemetaan antara lokasi pantai di UI dengan Kode Wilayah (adm4) BMKG
const BMKG_KODE_WILAYAH = {
    anyer: '36.04.30.2005', // Pantai Anyer - Kelurahan/Desa Cikoneng, Anyar, Serang
    carita: '36.01.28.2003', // Pantai Carita - Kelurahan/Desa Sukarame, Carita, Pandeglang
    sawarna: '36.02.03.2002', // Pantai Sawarna - Kelurahan/Desa Sawarna, Bayah, Lebak
    tanjunglesung: '36.01.06.2012', // Tanjung Lesung - Kelurahan/Desa Tanjung Jaya, Panimbang, Pandeglang
    labuan: '36.01.12.2010', // Pantai Labuan - Kelurahan/Desa Labuan, Labuan, Pandeglang
    bagedur: '36.02.01.2023' // Pantai Bagedur - Kelurahan/Desa Bagedur, Malingping, Lebak
};

// Data Simulasi Tetap (untuk Pasang Surut dan Oseanografi)
// Menambahkan data cuaca default (fallback) jika BMKG gagal diakses
const locationData = {
    anyer: {
        tideStatus: 'Pasang', tideHeight: '1.8 m', nextHighTide: '14:30', nextLowTide: '20:15',
        seaTemp: '29.2°C', salinity: '33.5 PSU', waveHeight: '0.8 m', wavePeriod: '5.2 detik', current: '0.5 m/s',
        coords: [-6.0879, 105.8838], bmkgData: { weatherCondition: 'Cerah Berawan', temperature: '28°C', humidity: '75%', windSpeed: '12 km/h', windDirection: 'Barat Laut' }
    },
    carita: {
        tideStatus: 'Surut', tideHeight: '0.9 m', nextHighTide: '15:45', nextLowTide: '21:30',
        seaTemp: '28.8°C', salinity: '33.2 PSU', waveHeight: '1.1 m', wavePeriod: '5.8 detik', current: '0.6 m/s',
        coords: [-6.3166, 105.8303], bmkgData: { weatherCondition: 'Berawan', temperature: '27°C', humidity: '78%', windSpeed: '15 km/h', windDirection: 'Barat' }
    },
    sawarna: {
        tideStatus: 'Pasang', tideHeight: '2.1 m', nextHighTide: '13:15', nextLowTide: '19:45',
        seaTemp: '29.5°C', salinity: '34.0 PSU', waveHeight: '1.5 m', wavePeriod: '6.5 detik', current: '0.8 m/s',
        coords: [-6.9849, 106.3006], bmkgData: { weatherCondition: 'Hujan Ringan', temperature: '25°C', humidity: '85%', windSpeed: '8 km/h', windDirection: 'Tenggara' }
    },
    tanjunglesung: {
        tideStatus: 'Surut', tideHeight: '0.7 m', nextHighTide: '16:00', nextLowTide: '22:00',
        seaTemp: '29.0°C', salinity: '33.3 PSU', waveHeight: '0.6 m', wavePeriod: '4.8 detik', current: '0.4 m/s',
        coords: [-6.4793, 105.6533], bmkgData: { weatherCondition: 'Cerah', temperature: '29°C', humidity: '70%', windSpeed: '10 km/h', windDirection: 'Timur' }
    },
    labuan: {
        tideStatus: 'Pasang', tideHeight: '1.6 m', nextHighTide: '14:45', nextLowTide: '20:30',
        seaTemp: '28.5°C', salinity: '33.0 PSU', waveHeight: '1.3 m', wavePeriod: '6.0 detik', current: '0.7 m/s',
        coords: [-6.3714, 105.8189], bmkgData: { weatherCondition: 'Berawan Tebal', temperature: '26°C', humidity: '80%', windSpeed: '18 km/h', windDirection: 'Barat Daya' }
    },
    bagedur: {
        tideStatus: 'Surut', tideHeight: '1.0 m', nextHighTide: '15:30', nextLowTide: '21:15',
        seaTemp: '29.8°C', salinity: '33.8 PSU', waveHeight: '0.9 m', wavePeriod: '5.5 detik', current: '0.5 m/s',
        coords: [-6.8139, 105.9821], bmkgData: { weatherCondition: 'Cerah', temperature: '28°C', humidity: '72%', windSpeed: '9 km/h', windDirection: 'Selatan' }
    }
};

/**
 * Mengambil data cuaca dari BMKG untuk kode wilayah tertentu.
 * @param {string} kode_adm4 - Kode Wilayah Tingkat IV (Kelurahan/Desa)
 * @returns {object} Data cuaca yang sudah diformat atau objek error.
 */
async function fetchWeatherData(kode_adm4) {
    const ENDPOINT_API = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${kode_adm4}`;
    
    try {
        const response = await fetch(ENDPOINT_API);
        
        // Cek status respon, termasuk jika terjadi error non-CORS
        if (!response.ok) {
            console.error(`Error fetching BMKG data for ${kode_adm4}: HTTP status ${response.status}`);
            return { error: `Gagal ambil data BMKG. Status HTTP: ${response.status}` };
        }

        const data = await response.json();
        const prakiraanData = data.data_cuaca?.prakiraan_cuaca?.[0]?.daftar_prakiraan;

        if (!prakiraanData || prakiraanData.length === 0) {
            return { error: 'Data prakiraan tidak ditemukan (mungkin kode wilayah tidak ada).' };
        }

        // Ambil data prakiraan cuaca yang paling awal (current/terdekat)
        const currentForecast = prakiraanData[0]; 

        return {
            weatherCondition: currentForecast.kondisi || 'N/A',
            temperature: `${currentForecast.t}°C` || 'N/A',
            humidity: `${currentForecast.rh}%` || 'N/A',
            windSpeed: `${currentForecast.ws} km/h` || 'N/A',
            windDirection: currentForecast.wd || 'N/A',
            fetchTime: new Date().toLocaleTimeString('id-ID')
        };

    } catch (error) {
        // Ini akan menangkap error koneksi atau CORS
        console.error("Terjadi kesalahan koneksi/CORS:", error);
        return { error: `Gagal koneksi ke BMKG. Cek CORS atau koneksi internet. Detail: ${error.message}` };
    }
}

/**
 * Mengambil dan menyimpan data BMKG untuk semua lokasi.
 */
async function fetchAllBMKGData() {
    const locations = Object.keys(BMKG_KODE_WILAYAH);
    let fetchSuccessful = false;

    for (const loc of locations) {
        const kode = BMKG_KODE_WILAYAH[loc];
        const dataBMKG = await fetchWeatherData(kode);
        
        if (!dataBMKG.error) {
            // Jika berhasil, update data dan tandai fetch berhasil
            locationData[loc].bmkgData = dataBMKG;
            fetchSuccessful = true;
        } else {
            // Jika gagal, gunakan data simulasi (fallback) yang sudah ada di locationData
            locationData[loc].bmkgData.error = dataBMKG.error; 
            locationData[loc].bmkgData.isFallback = true;
        }
    }
    
    // Setelah semua data diambil, update dashboard dengan lokasi default
    const defaultLocation = document.getElementById('locationSelect').value || 'anyer';
    updateDashboardData(defaultLocation, !fetchSuccessful);
}


function updateDashboardData(location, isGlobalError = false) {
    const data = locationData[location];
    const bmkg = data.bmkgData || {};
    
    // --- Data Simulasi (Pasang Surut & Oseanografi) ---
    document.getElementById('tideStatus').textContent = data.tideStatus;
    document.getElementById('tideHeight').textContent = data.tideHeight;
    document.getElementById('nextHighTide').textContent = data.nextHighTide;
    document.getElementById('nextLowTide').textContent = data.nextLowTide;
    document.getElementById('seaTemp').textContent = data.seaTemp;
    document.getElementById('salinity').textContent = data.salinity;
    document.getElementById('waveHeight').textContent = data.waveHeight;
    document.getElementById('wavePeriod').textContent = data.wavePeriod;
    document.getElementById('current').textContent = data.current;

    // --- Data Real (Cuaca dari BMKG atau Fallback) ---
    document.getElementById('weatherCondition').textContent = bmkg.weatherCondition || 'N/A';
    document.getElementById('temperature').textContent = bmkg.temperature || 'N/A';
    document.getElementById('humidity').textContent = bmkg.humidity || 'N/A';
    document.getElementById('windSpeed').textContent = bmkg.windSpeed || 'N/A';
    document.getElementById('windDirection').textContent = bmkg.windDirection || 'N/A';
    
    // Tambahkan notifikasi jika ada error dari BMKG
    const cuacaCard = document.querySelector('.dashboard-grid .card:nth-child(2)');
    // Hapus pesan error sebelumnya
    if (document.getElementById('bmkg-error')) {
        document.getElementById('bmkg-error').remove();
    }
    
    if (bmkg.error || isGlobalError) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'bmkg-error';
        errorDiv.className = 'alert alert-info';
        errorDiv.style.color = '#ff9800'; // Warna oranye untuk peringatan
        errorDiv.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.marginBottom = '10px';

        let errorMessage = bmkg.error || "Gagal mengambil data BMKG untuk semua lokasi.";
        
        // Peringatan Khusus CORS
        if (errorMessage.includes("Failed to fetch")) {
             errorMessage = "⚠️ **ERROR KONEKSI (CORS/Lokal)**. Data Cuaca menggunakan data Fallback. Pastikan Anda menjalankan website melalui Live Server (http://) dan bukan dari file:///";
        } else if (bmkg.isFallback) {
             errorMessage = `⚠️ Gagal ambil data BMKG (${bmkg.error}). Menampilkan data Fallback/Simulasi.`;
        }
        
        errorDiv.innerHTML = errorMessage;
        cuacaCard.prepend(errorDiv);
    }
}


// Leaflet Map (Kode tidak berubah)
let map;
window.mapInitialized = false;

function initMap() {
    if (window.mapInitialized) return;
    
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
        { name: 'Pantai Carita', coords: [-6.2959,105.8309], loc: 'carita' },
        { name: 'Pantai Sawarna', coords: [-6.9849,106.3006], loc: 'sawarna' },
        { name: 'Tanjung Lesung', coords: [-6.4793,105.6533], loc: 'tanjunglesung' },
        { name: 'Pantai Labuan', coords: [-6.3714,105.8189], loc: 'labuan' },
        { name: 'Pantai Bagedur', coords: [-6.8139,105.9821], loc: 'bagedur' }
    ];

    beaches.forEach(beach => {
        const data = locationData[beach.loc];
        const bmkg = data.bmkgData || {};
        const marker = L.marker(beach.coords).addTo(map);
        
        // Pastikan popup menggunakan data BMKG terbaru
        marker.bindPopup(`
            <div style="color: #0a1929; min-width: 200px;">
                <h3 style="margin-bottom: 10px; color: #1565c0;">${beach.name}</h3>
                <p><strong>Pasang Surut:</strong> ${data.tideStatus} (${data.tideHeight})</p>
                <p><strong>Cuaca:</strong> ${bmkg.weatherCondition || 'Memuat...'}</p>
                <p><strong>Suhu:</strong> ${bmkg.temperature || 'Memuat...'}</p>
                <p><strong>Tinggi Gelombang:</strong> ${data.waveHeight}</p>
                <button onclick="
                    document.getElementById('locationSelect').value='${beach.loc}'; 
                    updateDashboardData('${beach.loc}'); 
                    // Simulasi klik navigasi ke dashboard
                    const dashboardBtn = document.querySelector('.nav-btn[data-section=dashboard]');
                    if (dashboardBtn) dashboardBtn.click();
                " style="margin-top: 10px; padding: 5px 15px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">Lihat Detail</button>
            </div>
        `);
    });

    window.mapInitialized = true;
}


// --- START: Login/Logout/SignUp Functions (Tidak Berubah) ---

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
// --- END: Login/Logout/SignUp Functions ---

// --- START: Contact Modal Functions (Tidak Berubah) ---

window.openContactModal = function() {
    document.getElementById('contactModal').classList.add('active');
}

window.closeContactModal = function() {
    document.getElementById('contactModal').classList.remove('active');
    document.getElementById('contactForm').reset();
}

// --- END: Contact Modal Functions ---


// Event Listeners setelah DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data BMKG untuk semua lokasi di awal
    fetchAllBMKGData(); 
    
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
                // Initialize map when Peta tab is clicked
                initMap();
                // Ini penting untuk memastikan peta ditampilkan dengan benar
                map.invalidateSize(); 
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

    // --- START: Login/SignUp Form Handlers (Tidak Berubah) ---
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
            const username = document.getElementById('signupUsername').value;
            const password = document.getElementById('signupPassword').value;
            const email = document.getElementById('signupEmail').value;
            
            // Mock API Sign Up Logic
            if (password.length < 6) {
                alert("Kata sandi harus minimal 6 karakter.");
                return;
            }
            
            // Assume successful registration for mock
            alert(`Pendaftaran berhasil untuk username: ${username}! Silakan masuk (login).`);
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
    // --- END: Login/SignUp Form Handlers ---

// --- START: Contact Form Handler (Tidak Berubah) ---
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
// --- END: Contact Form Handler ---
    
    // Forum Functions (Tidak Berubah)
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

    // Interval untuk mengambil data BMKG ulang setiap 30 menit (misalnya)
    setInterval(fetchAllBMKGData, 1800000); // 1800000 ms = 30 menit
});

