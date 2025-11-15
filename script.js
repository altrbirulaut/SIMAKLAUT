// Konfigurasi kode wilayah untuk setiap pantai
const beachRegionCodes = {
    anyer: '36.04.30.2005',
    carita: '36.01.28.2003',
    sawarna: '36.02.03.2002',
    tanjunglesung: '36.01.06.2012',
    labuan: '36.01.12.2010',
    bagedur: '36.02.01.2023'
};

// Data simulasi untuk parameter oseanografi (tidak tersedia di API BMKG)
// Data ini akan digabung dengan data cuaca real-time dari BMKG
const oceanographicData = {
    anyer: {
        tideStatus: 'Pasang',
        tideHeight: '1.8 m',
        nextHighTide: '14:30',
        nextLowTide: '20:15',
        seaTemp: '29.2°C',
        salinity: '33.5 PSU',
        waveHeight: '0.8 m',
        wavePeriod: '5.2 detik',
        current: '0.5 m/s',
        coords: [-6.0879, 105.8838]
    },
    carita: {
        tideStatus: 'Surut',
        tideHeight: '0.9 m',
        nextHighTide: '15:45',
        nextLowTide: '21:30',
        seaTemp: '28.8°C',
        salinity: '33.2 PSU',
        waveHeight: '1.1 m',
        wavePeriod: '5.8 detik',
        current: '0.6 m/s',
        coords: [-6.2959, 105.8309]
    },
    sawarna: {
        tideStatus: 'Pasang',
        tideHeight: '2.1 m',
        nextHighTide: '13:15',
        nextLowTide: '19:45',
        seaTemp: '29.5°C',
        salinity: '34.0 PSU',
        waveHeight: '1.5 m',
        wavePeriod: '6.5 detik',
        current: '0.8 m/s',
        coords: [-6.9849, 106.3006]
    },
    tanjunglesung: {
        tideStatus: 'Surut',
        tideHeight: '0.7 m',
        nextHighTide: '16:00',
        nextLowTide: '22:00',
        seaTemp: '29.0°C',
        salinity: '33.3 PSU',
        waveHeight: '0.6 m',
        wavePeriod: '4.8 detik',
        current: '0.4 m/s',
        coords: [-6.4793, 105.6533]
    },
    labuan: {
        tideStatus: 'Pasang',
        tideHeight: '1.6 m',
        nextHighTide: '14:45',
        nextLowTide: '20:30',
        seaTemp: '28.5°C',
        salinity: '33.0 PSU',
        waveHeight: '1.3 m',
        wavePeriod: '6.0 detik',
        current: '0.7 m/s',
        coords: [-6.3714, 105.8189]
    },
    bagedur: {
        tideStatus: 'Surut',
        tideHeight: '1.0 m',
        nextHighTide: '15:30',
        nextLowTide: '21:15',
        seaTemp: '29.8°C',
        salinity: '33.8 PSU',
        waveHeight: '0.9 m',
        wavePeriod: '5.5 detik',
        current: '0.5 m/s',
        coords: [-6.8139, 105.9821]
    }
};

// Data simulasi untuk balasan
const threadReplies = {
    '1': [
        { author: 'Dr. Risa Dewi', content: 'Coba metode Van Veen Grab dan kombinasikan dengan Core Sampler untuk profil vertikal. Substrat berpasir butuh alat yang stabil.', time: '1 jam lalu' },
        { author: 'Ir. Hendra Wijaya', content: 'Setuju dengan Dr. Risa, jangan lupakan *multivariate analysis* untuk membandingkan hasil antar metode.', time: '2 jam lalu' }
    ],
    '2': [
        { author: 'Sisca, M.Sc.', content: 'Ada korelasi negatif yang jelas antara SST dan hasil tangkapan Cakalang. Nelayan harus berlayar lebih jauh.', time: '1 hari lalu' }
    ],
    '3': [], // Contoh diskusi tanpa balasan
    '4': [
        { author: 'Admin SIMAKLAUT', content: 'Coba hubungi Pusdatin BIG. Mereka punya data Lidar dan Multi-beam Echo Sounder di wilayah itu.', time: 'Baru saja' }
    ]
};

// Cache untuk data cuaca BMKG
let weatherDataCache = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 menit

// Status loading
let isLoadingWeather = false;

/**
 * Translate kode cuaca BMKG ke deskripsi Indonesia
 */
function translateWeatherCode(weatherCode) {
    const weatherCodes = {
        0: 'Cerah',
        1: 'Cerah Berawan',
        2: 'Cerah Berawan',
        3: 'Berawan',
        4: 'Berawan Tebal',
        5: 'Udara Kabur',
        10: 'Asap',
        45: 'Kabut',
        60: 'Hujan Ringan',
        61: 'Hujan Sedang',
        63: 'Hujan Lebat',
        80: 'Hujan Lokal',
        95: 'Hujan Petir',
        97: 'Hujan Petir'
    };
    
    return weatherCodes[weatherCode] || 'Cerah Berawan';
}

/**
 * Translate derajat arah angin ke arah mata angin
 */
function translateWindDirection(degree) {
    if (typeof degree !== 'number') return 'N/A';
    
    const directions = [
        'Utara', 'Timur Laut', 'Timur', 'Tenggara',
        'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'
    ];
    
    const index = Math.round(((degree % 360) / 45)) % 8;
    return directions[index];
}

/**
 * Fetch data cuaca dari API BMKG
 */
async function fetchBMKGWeather(beachKey) {
    const regionCode = beachRegionCodes[beachKey];
    const apiUrl = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${regionCode}`;
    
    // Cek cache terlebih dahulu
    if (weatherDataCache[beachKey]) {
        const cacheTime = weatherDataCache[beachKey].timestamp;
        if (Date.now() - cacheTime < CACHE_DURATION) {
            console.log(`Using cached data for ${beachKey}`);
            return weatherDataCache[beachKey].data;
        }
    }
    
    try {
        console.log(`Fetching weather data from BMKG API for ${beachKey}...`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Simpan ke cache
        weatherDataCache[beachKey] = {
            data: data,
            timestamp: Date.now()
        };
        
        return data;
    } catch (error) {
        console.error(`Error fetching BMKG data for ${beachKey}:`, error);
        throw error;
    }
}

/**
 * Proses data BMKG dan ekstrak informasi cuaca terkini
 */
function processBMKGData(bmkgData) {
    try {
        if (!bmkgData || !bmkgData.data || !bmkgData.data[0]) {
            throw new Error('Invalid BMKG data structure');
        }

        const locationData = bmkgData.data[0];
        for (const dayData of cuacaPerHari) {
            for (const hourData of dayData) {
                console.log(hourData.t);
            }
        }
        if (!cuaca || cuaca.length === 0) {
            throw new Error('No weather data available');
        }

        // Cari data untuk jam terdekat
        const now = new Date();
        let closest = null;
        let minDiff = Infinity;

        for (const weather of allWeatherData) {
            const weatherTime = new Date(weather.datetime);
            const diff = Math.abs(weatherTime - now);
    
        if (diff < minDiff) {
            minDiff = diff;
            closest = weather;
            }
        }

        const currentHour = new Date().getHours();
        let current = allWeatherData.find(w => {
            const weatherHour = new Date(w.local_datetime).getHours();
            return weatherHour === currentHour;
        });

        if (!closestWeather) {
            closestWeather = cuaca[0];
        }

        return {
            weatherCondition: translateWeatherCode(closestWeather.weather),
            temperature: closestWeather.t ? `${Math.round(closestWeather.t)}°C` : 'N/A',
            humidity: closestWeather.hu ? `${Math.round(closestWeather.hu)}%` : 'N/A',
            windSpeed: closestWeather.ws ? `${Math.round(closestWeather.ws)} km/h` : 'N/A',
            windDirection: translateWindDirection(closestWeather.wd_deg),
            lastUpdate: closestWeather.datetime || new Date().toISOString()
        };
    } catch (error) {
        console.error('Error processing BMKG data:', error);
        throw error;
    }
}

/**
 * Update dashboard dengan data real-time dari BMKG + data simulasi oseanografi
 */
async function updateDashboardData(location) {
    const oceanData = oceanographicData[location];
    
    // Update parameter oseanografi (data simulasi)
    document.getElementById('tideStatus').textContent = oceanData.tideStatus;
    document.getElementById('tideHeight').textContent = oceanData.tideHeight;
    document.getElementById('nextHighTide').textContent = oceanData.nextHighTide;
    document.getElementById('nextLowTide').textContent = oceanData.nextLowTide;
    document.getElementById('seaTemp').textContent = oceanData.seaTemp;
    document.getElementById('salinity').textContent = oceanData.salinity;
    document.getElementById('waveHeight').textContent = oceanData.waveHeight;
    document.getElementById('wavePeriod').textContent = oceanData.wavePeriod;
    document.getElementById('current').textContent = oceanData.current;
    
    // Tampilkan loading indicator untuk cuaca
    const weatherElements = ['weatherCondition', 'temperature', 'humidity', 'windSpeed', 'windDirection'];
    weatherElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<span style="color: #64b5f6;">⏳</span>';
        }
    });
    
    try {
        // Fetch data cuaca real-time dari BMKG
        const bmkgData = await fetchBMKGWeather(location);
        const weatherData = processBMKGData(bmkgData);
        
        // Update data cuaca dengan data dari BMKG
        document.getElementById('weatherCondition').textContent = weatherData.weatherCondition;
        document.getElementById('temperature').textContent = weatherData.temperature;
        document.getElementById('humidity').textContent = weatherData.humidity;
        document.getElementById('windSpeed').textContent = weatherData.windSpeed;
        document.getElementById('windDirection').textContent = weatherData.windDirection;
        
        console.log(`✓ Weather data updated for ${location} from BMKG`);
        
        // Update footer status
        updateFooterStatus(true, weatherData.lastUpdate);
        
    } catch (error) {
        console.error('Failed to fetch BMKG data, using fallback data:', error);
        
        // Gunakan data fallback jika API gagal
        const fallbackData = {
            weatherCondition: 'Data Tidak Tersedia',
            temperature: 'N/A',
            humidity: 'N/A',
            windSpeed: 'N/A',
            windDirection: 'N/A'
        };
        
        document.getElementById('weatherCondition').textContent = fallbackData.weatherCondition;
        document.getElementById('temperature').textContent = fallbackData.temperature;
        document.getElementById('humidity').textContent = fallbackData.humidity;
        document.getElementById('windSpeed').textContent = fallbackData.windSpeed;
        document.getElementById('windDirection').textContent = fallbackData.windDirection;
        
        // Update footer status
        updateFooterStatus(false);
    }
}

/**
 * Update status di footer
 */
function updateFooterStatus(success, lastUpdate = null) {
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    // Cari atau buat element status
    let statusElement = document.getElementById('data-status');
    if (!statusElement) {
        statusElement = document.createElement('p');
        statusElement.id = 'data-status';
        statusElement.style.marginTop = '1rem';
        statusElement.style.fontSize = '0.85rem';
        
        // Sisipkan sebelum element terakhir (contact button)
        const lastP = footer.querySelector('p:last-of-type');
        if (lastP) {
            footer.insertBefore(statusElement, lastP);
        } else {
            footer.appendChild(statusElement);
        }
    }
    
    if (success) {
        const updateTime = lastUpdate ? new Date(lastUpdate).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
        statusElement.innerHTML = `<span style="color: #81c784;">● Real-time</span> Data cuaca dari BMKG API | Terakhir diperbarui: ${updateTime}<br>
        <span style="color: #ffb74d;">⚠</span> Data Pasang Surut dan Oseanografi masih berdasarkan data simulasi.`;
    } else {
        statusElement.innerHTML = `<span style="color: #ef5350;">● Offline</span> Tidak dapat terhubung ke BMKG API | Menggunakan data fallback<br>
        <span style="color: #ffb74d;">⚠</span> Data Pasang Surut dan Oseanografi masih berdasarkan data simulasi.`;
    }
}

/**
 * Preload data cuaca untuk semua pantai
 */
async function preloadAllWeatherData() {
    console.log('Preloading weather data for all beaches...');
    const beaches = Object.keys(beachRegionCodes);
    
    const promises = beaches.map(async (beach) => {
        try {
            await fetchBMKGWeather(beach);
            console.log(`✓ Preloaded ${beach}`);
        } catch (error) {
            console.warn(`✗ Failed to preload ${beach}:`, error.message);
        }
    });
    
    await Promise.all(promises);
    console.log('Preloading complete');
}

// Leaflet Map
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
        { name: 'Pantai Anyer', coords: [-6.0879, 105.8838], loc: 'anyer' },
        { name: 'Pantai Carita', coords: [-6.2959, 105.8309], loc: 'carita' },
        { name: 'Pantai Sawarna', coords: [-6.9849, 106.3006], loc: 'sawarna' },
        { name: 'Tanjung Lesung', coords: [-6.4793, 105.6533], loc: 'tanjunglesung' },
        { name: 'Pantai Labuan', coords: [-6.3714, 105.8189], loc: 'labuan' },
        { name: 'Pantai Bagedur', coords: [-6.8139, 105.9821], loc: 'bagedur' }
    ];

    beaches.forEach(beach => {
        const oceanData = oceanographicData[beach.loc];
        const marker = L.marker(beach.coords).addTo(map);
        
        // Buat popup dengan data awal
        const popupContent = `
            <div style="color: #0a1929; min-width: 200px;">
                <h3 style="margin-bottom: 10px; color: #1565c0;">${beach.name}</h3>
                <p><strong>Pasang Surut:</strong> ${oceanData.tideStatus} (${oceanData.tideHeight})</p>
                <p id="popup-weather-${beach.loc}"><strong>Cuaca:</strong> <span style="color: #1976d2;">Memuat...</span></p>
                <p id="popup-temp-${beach.loc}"><strong>Suhu:</strong> <span style="color: #1976d2;">Memuat...</span></p>
                <p><strong>Tinggi Gelombang:</strong> ${oceanData.waveHeight}</p>
                <button onclick="
                    document.getElementById('locationSelect').value='${beach.loc}'; 
                    updateDashboardData('${beach.loc}'); 
                    document.querySelector('[data-section=dashboard]').click();
                " style="margin-top: 10px; padding: 5px 15px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">Lihat Detail</button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Update popup dengan data real-time saat popup dibuka
        marker.on('popupopen', async () => {
            try {
                const bmkgData = await fetchBMKGWeather(beach.loc);
                const weatherData = processBMKGData(bmkgData);
                
                const weatherElement = document.getElementById(`popup-weather-${beach.loc}`);
                const tempElement = document.getElementById(`popup-temp-${beach.loc}`);
                
                if (weatherElement) {
                    weatherElement.innerHTML = `<strong>Cuaca:</strong> ${weatherData.weatherCondition}`;
                }
                if (tempElement) {
                    tempElement.innerHTML = `<strong>Suhu:</strong> ${weatherData.temperature}`;
                }
            } catch (error) {
                console.error(`Failed to update popup for ${beach.loc}:`, error);
                const weatherElement = document.getElementById(`popup-weather-${beach.loc}`);
                const tempElement = document.getElementById(`popup-temp-${beach.loc}`);
                
                if (weatherElement) {
                    weatherElement.innerHTML = `<strong>Cuaca:</strong> Data tidak tersedia`;
                }
                if (tempElement) {
                    tempElement.innerHTML = `<strong>Suhu:</strong> N/A`;
                }
            }
        });
    });

    window.mapInitialized = true;
}

// Login/Logout/SignUp Functions
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
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        currentUser = null;
        updateHeaderButtons();
        alert('Anda telah berhasil logout.');
    }
}

window.openNewThreadModal = function() {
    if (!currentUser) {
        alert('Silakan login terlebih dahulu untuk membuat diskusi baru.');
        openLoginModal();
        return;
    }
    document.getElementById('newThreadModal').classList.add('active');
}

window.closeNewThreadModal = function() {
    document.getElementById('newThreadModal').classList.remove('active');
    document.getElementById('newThreadForm').reset();
}

window.openContactModal = function() {
    document.getElementById('contactModal').classList.add('active');
}

window.closeContactModal = function() {
    document.getElementById('contactModal').classList.remove('active');
    document.getElementById('contactForm').reset();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.target.id === 'loginBtn' || e.target.id === 'userBtn') return;
            
            const section = button.dataset.section;
            if (!section) return;
            
            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
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
    if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
            updateDashboardData(e.target.value);
        });
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            // Disable button dan tampilkan loading
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Memproses...';
            submitButton.disabled = true;

            try {
                const result = await window.AuthService.loginUser(username, password);
                
                if (result.success) {
                    currentUser = result.data.user;
                    alert(`Selamat datang, ${currentUser.full_name || currentUser.username}! Login berhasil.`);
                    closeLoginModal();
                    updateHeaderButtons();
                } else {
                    alert(`Login gagal: ${result.error}`);
                }
            } catch (error) {
                alert(`Terjadi kesalahan: ${error.message}`);
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // SignUp Form
    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signupUsername').value;
            const password = document.getElementById('signupPassword').value;
            const email = document.getElementById('signupEmail').value;
            
            if (password.length < 6) {
                alert("Kata sandi harus minimal 6 karakter.");
                return;
            }

            // Disable button dan tampilkan loading
            const submitButton = signUpForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Memproses...';
            submitButton.disabled = true;
            
            try {
                const result = await window.AuthService.registerUser(username, email, password, username);
                
                if (result.success) {
                    alert(`Pendaftaran berhasil untuk ${username}! Silakan masuk (login).`);
                    closeSignUpModal();
                    openLoginModal();
                } else {
                    alert(`Pendaftaran gagal: ${result.error}`);
                }
            } catch (error) {
                alert(`Terjadi kesalahan: ${error.message}`);
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Modal close on outside click
    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') closeLoginModal();
    });

    document.getElementById('signUpModal').addEventListener('click', (e) => {
        if (e.target.id === 'signUpModal') closeSignUpModal();
    });

    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const feedback = document.getElementById('contactFeedback').value;

            const accessKey = "6ca28dc9-17ae-44ce-ae53-8a279705e575";
            const apiUrl = "https://api.web3forms.com/submit";

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = "Mengirim...";
            submitButton.disabled = true;

            const formData = {
                access_key: accessKey,
                name: name,
                email: email,
                message: feedback,
                subject: `Feedback SIMAKLAUT dari ${name}`,
                from_name: 'SIMAKLAUT Feedback System',
                reply_to: email
            };

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
                    alert(`Terima kasih, ${name}! Feedback Anda telah berhasil dikirim.`);
                    window.closeContactModal();
                    contactForm.reset();
                } else {
                    throw new Error(data.message || 'Terjadi kesalahan saat mengirim feedback');
                }
            })
            .catch(error => {
                console.error('Error sending feedback:', error);
                alert(`Maaf, terjadi kesalahan: ${error.message}`);
            })
            .finally(() => {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            });
        });
    }

    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                window.closeContactModal();
            }
        });
    }

    // Forum Functions
    const newThreadForm = document.getElementById('newThreadForm');
    if (newThreadForm) {
        newThreadForm.addEventListener('submit', (e) => {
            e.preventDefault();
        
            const title = document.getElementById('threadTitle').value;
            const author = document.getElementById('authorName').value;
            const content = document.getElementById('threadContent').value;
            const tags = document.getElementById('threadTags').value;
        
            // Tetapkan ID baru dan tambahkan ke data balasan simulasi
            const newThreadId = nextThreadId++;
            threadReplies[newThreadId] = [];

            const newThread = document.createElement('div');
            newThread.className = 'discussion-thread';
            newThread.setAttribute('data-thread-id', newThreadId);
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
                    <span id="replies-count-${newThreadId}">💬 0 balasan</span>
                    <span>🏷️ ${tags || 'Umum'}</span>
                </div>
                <div class="replies-section" id="replies-${newThreadId}">
                    <button class="toggle-replies-btn" onclick="toggleReplies('${newThreadId}')">Lihat Balasan (0)</button>
                    <div class="reply-list" style="display: none;"></div>
                    <div class="new-reply-form" style="display: none;">
                        <input type="text" id="reply-author-${newThreadId}" placeholder="Nama Anda" style="width: 150px; margin-right: 10px; padding: 5px; border-radius: 5px;">
                        <input type="text" id="reply-content-${newThreadId}" placeholder="Tulis balasan Anda..." style="width: calc(100% - 220px); padding: 5px; border-radius: 5px;">
                        <button onclick="postReply('${newThreadId}')" style="padding: 5px 10px; margin-left: 10px;" class="btn-primary">Kirim</button>
                    </div>
                </div>
            `;
        
            const discussionList = document.getElementById('discussionList');
            if (discussionList) {
                discussionList.insertBefore(newThread, discussionList.firstChild);
            }
        
            window.closeNewThreadModal();
            alert('Diskusi berhasil dipublikasikan!');
        });
    }

    const newThreadModal = document.getElementById('newThreadModal');
    if (newThreadModal) {
        newThreadModal.addEventListener('click', (e) => {
            if (e.target === newThreadModal) {
                window.closeNewThreadModal();
            }
        });
    }

    // Global counter for simulated threads to assign unique IDs
    let nextThreadId = 5;

    // Fungsi untuk me-render balasan
    function renderReplies(threadId) {
        const replyList = document.querySelector(`#replies-${threadId} .reply-list`);
        replyList.innerHTML = ''; // Hapus balasan lama
    
        const replies = threadReplies[threadId] || [];
    
        if (replies.length === 0) {
            replyList.innerHTML = '<p style="color: #b3d9ff; font-style: italic; padding: 10px;">Belum ada balasan. Jadilah yang pertama!</p>';
            return;
        }

        replies.forEach(reply => {
            const replyItem = document.createElement('div');
            replyItem.className = 'reply-item';
            replyItem.innerHTML = `
                <div class="reply-item-meta">Oleh ${reply.author} • ${reply.time}</div>
                <div class="reply-item-content">${reply.content}</div>
            `;
            replyList.appendChild(replyItem);
        });
    }

    // Fungsi untuk menampilkan/menyembunyikan balasan
    window.toggleReplies = function(threadId) {
        const replyList = document.querySelector(`#replies-${threadId} .reply-list`);
        const newReplyForm = document.querySelector(`#replies-${threadId} .new-reply-form`);
        const toggleButton = document.querySelector(`#replies-${threadId} .toggle-replies-btn`);

        if (replyList.style.display === 'none' || replyList.style.display === '') {
            // Tampilkan
            renderReplies(threadId); // Render ulang saat ditampilkan
            replyList.style.display = 'block';
            newReplyForm.style.display = 'flex';
            toggleButton.textContent = 'Sembunyikan Balasan';
        } else {
            // Sembunyikan
            replyList.style.display = 'none';
            newReplyForm.style.display = 'none';
            toggleButton.textContent = `Lihat Balasan (${threadReplies[threadId]?.length || 0})`;
        }
    }

    // Fungsi untuk memposting balasan baru
    window.postReply = function(threadId) {
        const authorInput = document.getElementById(`reply-author-${threadId}`);
        const contentInput = document.getElementById(`reply-content-${threadId}`);
    
        const author = authorInput.value.trim();
        const content = contentInput.value.trim();

        if (!author || !content) {
            alert('Nama dan isi balasan tidak boleh kosong!');
            return;
        }
    
        if (!threadReplies[threadId]) {
            threadReplies[threadId] = [];
        }

        const newReply = {
            author: author,
            content: content,
            time: 'Baru saja'
        };

        // Tambahkan balasan ke data simulasi
        threadReplies[threadId].push(newReply);

        // Reset form
        authorInput.value = '';
        contentInput.value = '';

        // Update tampilan
        renderReplies(threadId);
    
        // Update jumlah balasan
        const replyCountElement = document.getElementById(`replies-count-${threadId}`);
        if (replyCountElement) {
            replyCountElement.textContent = `💬 ${threadReplies[threadId].length} balasan`;
        }
    
        const toggleButton = document.querySelector(`#replies-${threadId} .toggle-replies-btn`);
        toggleButton.textContent = `Sembunyikan Balasan`;

        alert('Balasan berhasil dikirim!');
    }

    // Initialize with default location
    console.log('Initializing SIMAKLAUT with BMKG integration...');
    updateDashboardData('anyer');
    
    // Preload weather data untuk performa lebih baik
    preloadAllWeatherData();

    // Auto-refresh data cuaca setiap 30 menit
    setInterval(() => {
        const currentLocation = document.getElementById('locationSelect').value;
        console.log('Auto-refreshing weather data...');
        updateDashboardData(currentLocation);
    }, 30 * 60 * 1000); // 30 menit
});
    // Edit Profile Modal Functions
    window.openEditProfileModal = async function() {
        if (!currentUser) {
            alert('Silakan login terlebih dahulu.');
            openLoginModal();
            return;
        }

        // Load current user data
        try {
            const result = await window.AuthService.getUserProfile();
            if (result.success) {
                const user = result.data;
                document.getElementById('editFullName').value = user.full_name || '';
                document.getElementById('editEmail').value = user.email || '';
                document.getElementById('editInstitution').value = user.institution || '';
                document.getElementById('editFieldOfStudy').value = user.field_of_study || '';
                document.getElementById('editPhone').value = user.phone || '';
                document.getElementById('editBio').value = user.bio || '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }

        document.getElementById('editProfileModal').classList.add('active');
    }

    window.closeEditProfileModal = function() {
        document.getElementById('editProfileModal').classList.remove('active');
        document.getElementById('editProfileForm').reset();
    }

    // Edit Profile Form Submit
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const profileData = {
                full_name: document.getElementById('editFullName').value,
                email: document.getElementById('editEmail').value,
                institution: document.getElementById('editInstitution').value,
                field_of_study: document.getElementById('editFieldOfStudy').value,
                phone: document.getElementById('editPhone').value,
                bio: document.getElementById('editBio').value
            };

            // Disable button
            const submitButton = editProfileForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Menyimpan...';
            submitButton.disabled = true;

            try {
                const result = await window.AuthService.updateUserProfile(profileData);
                
                if (result.success) {
                    currentUser = result.data;
                    updateHeaderButtons();
                    alert('Profil berhasil diperbarui!');
                    closeEditProfileModal();
                } else {
                    alert(`Gagal memperbarui profil: ${result.error}`);
                }
            } catch (error) {
                alert(`Terjadi kesalahan: ${error.message}`);
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Change Password Modal Functions
    window.openChangePasswordModal = function() {
        closeEditProfileModal();
        document.getElementById('changePasswordModal').classList.add('active');
    }

    window.closeChangePasswordModal = function() {
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('changePasswordForm').reset();
    }

    // Change Password Form Submit
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validasi
            if (newPassword !== confirmPassword) {
                alert('Password baru dan konfirmasi password tidak cocok!');
                return;
            }

            if (newPassword.length < 6) {
                alert('Password baru harus minimal 6 karakter!');
                return;
            }

            // Disable button
            const submitButton = changePasswordForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Memproses...';
            submitButton.disabled = true;

            try {
                const result = await window.AuthService.changePassword(currentPassword, newPassword);
                
                if (result.success) {
                    alert('Password berhasil diubah!');
                    closeChangePasswordModal();
                    changePasswordForm.reset();
                } else {
                    alert(`Gagal mengubah password: ${result.error}`);
                }
            } catch (error) {
                alert(`Terjadi kesalahan: ${error.message}`);
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Modal close on outside click for new modals
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            if (e.target.id === 'editProfileModal') closeEditProfileModal();
        });
    }

    const changePasswordModal = document.getElementById('changePasswordModal');
    if (changePasswordModal) {
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target.id === 'changePasswordModal') closeChangePasswordModal();
        });
    }

    // Check if user is already logged in on page load
    if (window.AuthService.isLoggedIn()) {
        currentUser = window.AuthService.getUserData();
        if (currentUser) {
            updateHeaderButtons();
        }
    }

    // --- Hamburger Menu Toggle ---

const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');

if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener('click', () => {
        // Toggle class 'open' pada elemen NAV
        mainNav.classList.toggle('open');
    });

    // Opsional: Tutup menu saat salah satu tombol fitur diklik (hanya di mobile)
    // Ini membantu saat pengguna memilih fitur, menu langsung tertutup.
    const navButtons = mainNav.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Periksa jika class 'open' ada (artinya sedang di mode mobile/menu terbuka)
            if (mainNav.classList.contains('open')) {
                mainNav.classList.remove('open');
            }
        });
    });
}
