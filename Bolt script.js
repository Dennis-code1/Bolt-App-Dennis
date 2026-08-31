// ============================================
// LOUISE TRANSPORT - JavaScript Logic
// ============================================

// State Management
const appState = {
    user: null,
    isLoggedIn: false,
    userType: null, // 'rider' or 'driver'
    currentRide: null,
    activeRideRequest: null,
    driverOnline: false,
    rating: 0,
    savedPlaces: [
        { id: 1, label: 'home', name: 'Home', address: '123 Main Street, Osu, Accra' },
        { id: 2, label: 'work', name: 'Work', address: '456 Business Plaza, Legon, Accra' },
        { id: 3, label: 'other', name: 'Gym', address: '789 Fitness Center, Madina, Accra' }
    ],
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear()
};

const mapState = {
    rideMap: null,
    liveMap: null,
    pickupMarker: null,
    destinationMarker: null,
    routeLine: null
};

const GHANA_CENTER = [7.9465, -1.0232];

// Mock Database for Demo
const mockDatabase = {
    users: [
        { id: 1, email: 'aloysioudennis09@gmail.com', password: '123456', name: 'Aloysious Dennis', phone: '0535915543', type: 'rider', rating: 4.8, totalRides: 12, totalSpent: 250, twoFactor: false },
        { id: 2, email: 'driver@test.com', password: '123456', name: 'John Mensah', phone: '0551234567', type: 'driver', rating: 4.9, completedRides: 250, totalEarnings: 5000, twoFactor: false }
    ],
    drivers: [
        { id: 1, name: 'John Mensah', rating: 4.9, car: 'Toyota Corolla • GR 1234 PM', distance: '2 km away', price: 'GHS 15.50' },
        { id: 2, name: 'Samuel Agyeman', rating: 4.7, car: 'Honda Civic • GR 5678 PM', distance: '3 km away', price: 'GHS 18.00' },
        { id: 3, name: 'Kwame Boateng', rating: 4.8, car: 'Nissan Altima • GR 9012 PM', distance: '4 km away', price: 'GHS 22.50' }
    ],
    rides: [
        { id: 1, from: 'Osu, Accra', to: 'Airport, Accra', fare: 25.50, date: '2026-08-03', driver: 'John Mensah', rating: 5 },
        { id: 2, from: 'Tema, Accra', to: 'Kasoa, Central Region', fare: 45.00, date: '2026-08-12', driver: 'Samuel Agyeman', rating: 4 },
        { id: 3, from: 'Kumasi', to: 'Ejisu, Ashanti', fare: 35.75, date: '2026-08-20', driver: 'Kwame Boateng', rating: 5 }
    ]
};

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
    resizeMaps();
}

function resizeMaps() {
    if (mapState.rideMap) {
        setTimeout(() => mapState.rideMap.invalidateSize(), 200);
    }

    if (mapState.liveMap) {
        setTimeout(() => mapState.liveMap.invalidateSize(), 200);
    }
}

function initializeMap(containerId, focusPoint = GHANA_CENTER) {
    const mapContainer = document.getElementById(containerId);

    if (!mapContainer || !window.L) {
        return null;
    }

    if (mapContainer._leaflet_id) {
        const existingMap = mapContainer._leaflet_map || null;
        if (existingMap) {
            existingMap.invalidateSize();
            return existingMap;
        }
    }

    const map = L.map(containerId, {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView(focusPoint, 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapContainer._leaflet_map = map;
    return map;
}

async function geocodeLocation(query) {
    const cleanedQuery = String(query || '').trim();

    if (!cleanedQuery) {
        return null;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(cleanedQuery + ', Ghana')}`;

    const response = await fetch(url, {
        headers: {
            'Accept-Language': 'en'
        }
    });

    if (!response.ok) {
        throw new Error('Location lookup failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
    };
}

function drawRouteMap(pickupCoords, destinationCoords) {
    if (!mapState.rideMap) {
        mapState.rideMap = initializeMap('mapContainer', GHANA_CENTER);
    }

    if (!mapState.rideMap) {
        return;
    }

    const pickupLatLng = L.latLng(pickupCoords.lat, pickupCoords.lon);
    const destinationLatLng = L.latLng(destinationCoords.lat, destinationCoords.lon);

    if (mapState.pickupMarker) {
        mapState.rideMap.removeLayer(mapState.pickupMarker);
    }

    if (mapState.destinationMarker) {
        mapState.rideMap.removeLayer(mapState.destinationMarker);
    }

    if (mapState.routeLine) {
        mapState.rideMap.removeLayer(mapState.routeLine);
    }

    mapState.pickupMarker = L.marker(pickupLatLng, {
        title: 'Pickup'
    }).addTo(mapState.rideMap).bindPopup('Pickup location');

    mapState.destinationMarker = L.marker(destinationLatLng, {
        title: 'Destination'
    }).addTo(mapState.rideMap).bindPopup('Destination');

    mapState.routeLine = L.polyline([pickupLatLng, destinationLatLng], {
        color: '#36b37e',
        weight: 5,
        opacity: 0.8
    }).addTo(mapState.rideMap);

    const bounds = L.latLngBounds([pickupLatLng, destinationLatLng]);
    mapState.rideMap.fitBounds(bounds, { padding: [30, 30] });
}

async function updateRideMapFromAddresses(pickupAddress, destinationAddress) {
    const pickupResult = await geocodeLocation(pickupAddress);
    const destinationResult = await geocodeLocation(destinationAddress);

    if (!pickupResult || !destinationResult) {
        showNotification('Could not find both locations on the map. Try more specific addresses.', 'error');
        return false;
    }

    drawRouteMap(pickupResult, destinationResult);
    return true;
}

// ============================================
// NAVIGATION BUTTONS
// ============================================

document.getElementById('homeBtn').addEventListener('click', () => {
    showPage('homePage');
});

document.getElementById('rideBtn').addEventListener('click', () => {
    if (appState.isLoggedIn && appState.userType === 'rider') {
        showPage('ridePage');
    } else {
        showPage('loginPage');
        showNotification('Please login as a rider first', 'info');
    }
});

document.getElementById('driveBtn').addEventListener('click', () => {
    if (appState.isLoggedIn && appState.userType === 'driver') {
        showPage('driverPage');
    } else {
        showPage('loginPage');
        showNotification('Please login as a driver first', 'info');
    }
});

document.getElementById('loginBtn').addEventListener('click', () => {
    showPage('loginPage');
});

document.getElementById('profileBtn').addEventListener('click', () => {
    showPage('profilePage');
    loadProfileData();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
});

// Hero buttons
document.getElementById('rideNowBtn').addEventListener('click', () => {
    if (appState.isLoggedIn) {
        showPage('ridePage');
    } else {
        showPage('loginPage');
    }
});

document.getElementById('becomeDriverBtn').addEventListener('click', () => {
    if (appState.isLoggedIn) {
        showPage('driverPage');
    } else {
        document.getElementById('accountType').value = 'driver';
        showPage('signupPage');
    }
});

// ============================================
// AUTHENTICATION
// ============================================

// Switch between login and signup
document.getElementById('switchToSignup').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('signupPage');
});

document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginCode = document.getElementById('loginCode').value.trim();
    
    const user = mockDatabase.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showNotification('Invalid email or password', 'error');
        return;
    }

    if (user.twoFactor) {
        const requiredCode = generateTwoFactorCode(user.email);
        const codeWrap = document.getElementById('loginCodeWrap');

        if (codeWrap) {
            codeWrap.style.display = 'block';
        }

        if (!loginCode) {
            showNotification(`Face lock is enabled. Use the 6-digit code: ${requiredCode}`, 'info');
            return;
        }

        if (loginCode !== requiredCode) {
            showNotification(`Wrong security code. Demo code: ${requiredCode}`, 'error');
            return;
        }
    }

    appState.user = user;
    appState.isLoggedIn = true;
    appState.userType = user.type;
    
    updateNavbar();
    updateTwoFactorStatus();
    showNotification(`Welcome ${user.name}!`, 'success');
    showPage('homePage');
    
    document.getElementById('loginForm').reset();
    const codeWrap = document.getElementById('loginCodeWrap');
    if (codeWrap) {
        codeWrap.style.display = 'none';
    }
});

// Signup Form
document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    const accountType = document.getElementById('accountType').value;
    
    // Check if email exists
    if (mockDatabase.users.some(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: mockDatabase.users.length + 1,
        email,
        password,
        name,
        phone,
        type: accountType,
        rating: 5.0,
        totalRides: 0,
        totalSpent: 0,
        completedRides: 0,
        totalEarnings: 0,
        twoFactor: false
    };
    
    mockDatabase.users.push(newUser);
    appState.user = newUser;
    appState.isLoggedIn = true;
    appState.userType = accountType;
    
    updateNavbar();
    updateTwoFactorStatus();
    showNotification(`Account created successfully! Welcome ${name}!`, 'success');
    showPage('homePage');
    document.getElementById('signupForm').reset();
});

function logout() {
    appState.user = null;
    appState.isLoggedIn = false;
    appState.userType = null;
    appState.driverOnline = false;
    
    updateNavbar();
    showNotification('Logged out successfully', 'success');
    showPage('homePage');
}

function generateTwoFactorCode(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
    }

    return String((hash % 900000) + 100000);
}

function updateTwoFactorStatus() {
    const toggle = document.getElementById('twoFactorToggle');
    const status = document.getElementById('twoFactorStatus');

    if (!toggle || !status) return;

    const enabled = !!(appState.user && appState.user.twoFactor);
    toggle.checked = enabled;
    status.textContent = enabled
        ? 'Enabled - Face lock / 2-step security active'
        : 'Not enabled - Increase your security';
}

function updateNavbar() {
    const loginBtn = document.getElementById('loginBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (appState.isLoggedIn) {
        loginBtn.style.display = 'none';
        profileBtn.style.display = 'block';
        logoutBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        profileBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

// ============================================
// RIDE BOOKING
// ============================================

document.getElementById('rideForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!appState.isLoggedIn) {
        showNotification('Please login first', 'error');
        return;
    }
    
    const pickupLocation = document.getElementById('pickupLocation').value;
    const dropoffLocation = document.getElementById('dropoffLocation').value;
    const rideType = document.getElementById('rideType').value;
    const passengers = document.getElementById('passengers').value;
    
    // Create ride object
    appState.currentRide = {
        id: Math.random(),
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        type: rideType,
        passengers: passengers,
        status: 'searching',
        createdAt: new Date()
    };

    try {
        const routeReady = await updateRideMapFromAddresses(pickupLocation, dropoffLocation);
        if (!routeReady) {
            return;
        }
    } catch (error) {
        console.error('Map geocoding failed:', error);
        showNotification('Map lookup failed. Please enter a more specific address.', 'error');
        return;
    }
    
    // Populate available drivers
    populateAvailableDrivers();
    showNotification('Finding drivers for you...', 'info');
});

function populateAvailableDrivers() {
    const driversList = document.getElementById('driversList');
    driversList.innerHTML = '';
    
    mockDatabase.drivers.forEach(driver => {
        const driverItem = document.createElement('div');
        driverItem.className = 'driver-item';
        driverItem.innerHTML = `
            <div class="driver-item-header">
                <div>
                    <div class="driver-item-name">${driver.name}</div>
                    <div class="driver-item-rating">${driver.rating} ⭐</div>
                </div>
                <div class="driver-item-price">${driver.price}</div>
            </div>
            <div class="driver-item-car">${driver.car}</div>
            <div class="driver-item-distance">${driver.distance}</div>
        `;
        
        driverItem.addEventListener('click', () => {
            selectDriver(driver);
        });
        
        driversList.appendChild(driverItem);
    });
}

function selectDriver(driver) {
    appState.currentRide.driver = driver;
    appState.currentRide.status = 'confirmed';
    
    // Update active ride page
    document.getElementById('driverName').textContent = driver.name;
    document.getElementById('driverCar').textContent = driver.car;
    document.getElementById('driverRatingActive').textContent = `⭐ ${driver.rating} (250 rides)`;
    document.getElementById('activePickup').textContent = appState.currentRide.pickup;
    document.getElementById('activeDropoff').textContent = appState.currentRide.dropoff;
    
    // Parse price and set fare
    const priceMatch = driver.price.match(/[\d.]+/);
    if (priceMatch) {
        const fare = parseFloat(priceMatch[0]);
        document.getElementById('estimatedFare').textContent = `GHS ${fare.toFixed(2)}`;
        document.getElementById('baseFare').textContent = 'GHS 5.00';
        document.getElementById('distanceFare').textContent = `GHS ${(fare - 5).toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `GHS ${fare.toFixed(2)}`;
    }
    
    showNotification(`Driver ${driver.name} accepted your ride!`, 'success');
    showPage('activeRidePage');
    
    // Simulate driver arrival
    startRideSimulation();
}

function startRideSimulation() {
    let arrivalTime = 5;
    const etaElement = document.getElementById('eta');
    
    const countdownInterval = setInterval(() => {
        if (arrivalTime <= 0) {
            clearInterval(countdownInterval);
            etaElement.textContent = 'Driver arrived!';
            showNotification('Your driver has arrived', 'success');
        } else {
            etaElement.textContent = `${arrivalTime} minutes`;
            arrivalTime--;
        }
    }, 1000);
}

document.getElementById('cancelRideBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel this ride?')) {
        appState.currentRide = null;
        showNotification('Ride cancelled', 'info');
        showPage('ridePage');
    }
});

// ============================================
// DRIVER FEATURES
// ============================================

document.getElementById('goOnlineBtn').addEventListener('click', () => {
    appState.driverOnline = true;
    document.getElementById('driverStatus').textContent = 'Online';
    document.getElementById('driverStatus').className = 'status-online';
    document.getElementById('goOnlineBtn').style.display = 'none';
    document.getElementById('goOfflineBtn').style.display = 'block';
    
    showNotification('You are now online!', 'success');
    simulateRideRequests();
});

document.getElementById('goOfflineBtn').addEventListener('click', () => {
    appState.driverOnline = false;
    document.getElementById('driverStatus').textContent = 'Offline';
    document.getElementById('driverStatus').className = 'status-offline';
    document.getElementById('goOnlineBtn').style.display = 'block';
    document.getElementById('goOfflineBtn').style.display = 'none';
    
    showNotification('You are now offline', 'info');
});

function simulateRideRequests() {
    if (!appState.driverOnline) return;
    
    const requests = [
        { user: 'Jane Smith', from: 'Accra', to: 'Tema', price: 'GHS 18.00' },
        { user: 'Michael Johnson', from: 'Osu', to: 'Airport', price: 'GHS 25.50' },
        { user: 'Ama Boateng', from: 'Tema', to: 'Kasoa', price: 'GHS 22.00' }
    ];
    
    const rideRequestsList = document.getElementById('rideRequestsList');
    rideRequestsList.innerHTML = '';
    
    requests.forEach((request, index) => {
        const requestItem = document.createElement('div');
        requestItem.className = 'request-item';
        requestItem.innerHTML = `
            <div class="request-item-header">
                <div>
                    <div class="request-item-user">${request.user}</div>
                    <div class="request-item-time">2 minutes ago</div>
                </div>
                <div class="request-item-price">${request.price}</div>
            </div>
            <div class="request-item-locations">
                <strong>${request.from}</strong> → <strong>${request.to}</strong>
            </div>
            <div class="request-item-actions">
                <button class="btn btn-primary" onclick="acceptRideRequest('${request.user}', '${request.from}', '${request.to}')">Accept</button>
                <button class="btn btn-secondary" onclick="rejectRideRequest()">Reject</button>
            </div>
        `;
        
        rideRequestsList.appendChild(requestItem);
    });
    
    if (requests.length === 0) {
        rideRequestsList.innerHTML = '<p class="no-requests">No ride requests at the moment</p>';
    }
}

function acceptRideRequest(user, from, to) {
    showNotification(`Ride accepted for ${user}!`, 'success');
    
    // Update earnings
    const currentEarnings = parseFloat(document.getElementById('driverEarnings').textContent) || 0;
    const newEarnings = currentEarnings + 20.50; // Mock earning
    document.getElementById('driverEarnings').textContent = `GHS ${newEarnings.toFixed(2)}`;
    
    // Update completed rides
    const completedRides = parseInt(document.getElementById('completedRides').textContent) + 1;
    document.getElementById('completedRides').textContent = completedRides;
    
    // Resimulate requests after a delay
    setTimeout(() => simulateRideRequests(), 3000);
}

function rejectRideRequest() {
    showNotification('Ride request rejected', 'info');
}

// ============================================
// PAYMENT
// ============================================

document.getElementById('paymentMethod').addEventListener('change', function() {
    const momoFields = document.getElementById('momoFields');
    if (this.value === 'momo') {
        momoFields.style.display = 'block';
    } else {
        momoFields.style.display = 'none';
    }
});

document.getElementById('paymentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    const totalAmount = document.getElementById('totalAmount').textContent;
    
    if (paymentMethod === 'momo') {
        const momoNumber = document.getElementById('momoNumber').value;
        if (!momoNumber) {
            showNotification('Please enter your mobile money number', 'error');
            return;
        }
    }
    
    showNotification(`Payment of ${totalAmount} processed successfully!`, 'success');
    
    // Show rating section
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('ratingSection').style.display = 'block';
});

// ============================================
// RATING SYSTEM
// ============================================

const ratingStars = document.querySelectorAll('.rating-input i');

ratingStars.forEach((star, index) => {
    star.addEventListener('click', () => {
        appState.rating = index + 1;
        ratingStars.forEach((s, i) => {
            if (i < appState.rating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    });
});

document.getElementById('submitRatingBtn').addEventListener('click', () => {
    const comment = document.getElementById('rideComment').value;
    showNotification('Thank you for your rating!', 'success');
    
    // Add ride to history
    if (appState.currentRide && appState.currentRide.driver) {
        const newRide = {
            id: mockDatabase.rides.length + 1,
            from: appState.currentRide.pickup,
            to: appState.currentRide.dropoff,
            fare: parseFloat(document.getElementById('totalAmount').textContent),
            date: new Date().toLocaleDateString(),
            driver: appState.currentRide.driver.name,
            rating: appState.rating
        };
        mockDatabase.rides.push(newRide);
    }
    
    // Reset and return to home
    setTimeout(() => {
        document.getElementById('paymentForm').style.display = 'block';
        document.getElementById('ratingSection').style.display = 'none';
        document.getElementById('rideComment').value = '';
        appState.rating = 0;
        ratingStars.forEach(s => s.classList.remove('active'));
        showPage('homePage');
    }, 2000);
});

// ============================================
// PROFILE PAGE
// ============================================

function loadProfileData() {
    if (!appState.user) return;
    
    const user = appState.user;
    
    // Update profile info
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profilePhone').textContent = user.phone;
    
    // Update stats based on user type
    if (user.type === 'rider') {
        document.getElementById('totalRides').textContent = user.totalRides;
        document.getElementById('myRating').textContent = `${user.rating} ⭐`;
        document.getElementById('totalSpent').textContent = `GHS ${user.totalSpent.toFixed(2)}`;
    } else {
        document.getElementById('totalRides').textContent = user.completedRides;
        document.getElementById('myRating').textContent = `${user.rating} ⭐`;
        document.getElementById('totalSpent').textContent = `GHS ${user.totalEarnings.toFixed(2)}`;
    }
    
    // Load ride history
    populateRideHistory();
}

function populateRideHistory() {
    const historyList = document.getElementById('rideHistoryList');
    historyList.innerHTML = '';
    
    if (mockDatabase.rides.length === 0) {
        historyList.innerHTML = '<p class="no-requests">No rides yet</p>';
        return;
    }
    
    mockDatabase.rides.forEach(ride => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div>
                    <div class="history-item-locations">
                        <strong>${ride.from}</strong> → <strong>${ride.to}</strong>
                    </div>
                    <div class="history-item-locations">${ride.date}</div>
                </div>
                <div>
                    <div class="history-item-price">GHS ${ride.fare.toFixed(2)}</div>
                    <div class="history-item-rating">${'⭐'.repeat(ride.rating)}</div>
                </div>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

document.querySelectorAll('.profile-tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        document.querySelectorAll('.profile-tab-btn').forEach(btn => btn.classList.toggle('active', btn === button));
        document.querySelectorAll('.profile-tab-content').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tab}-tab`);
        });
    });
});

function renderSavedPlaces() {
    const list = document.getElementById('addressesList');
    if (!list) return;

    list.innerHTML = '';

    appState.savedPlaces.forEach(place => {
        const item = document.createElement('div');
        item.className = 'address-item';

        const iconMap = {
            home: 'fa-home',
            work: 'fa-briefcase',
            other: 'fa-map-pin'
        };

        const labelMap = {
            home: 'Home',
            work: 'Work',
            other: place.name || 'Other Place'
        };

        item.innerHTML = `
            <div class="address-type">
                <i class="fas ${iconMap[place.label] || 'fa-map-pin'}"></i>
                <span>${labelMap[place.label] || place.name}</span>
            </div>
            <p class="address-text">${place.address}</p>
            <div class="address-actions">
                <button class="btn-icon" data-action="edit" data-id="${place.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" data-action="delete" data-id="${place.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        list.appendChild(item);
    });

    list.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', () => {
            const id = Number(button.dataset.id);
            appState.savedPlaces = appState.savedPlaces.filter(place => place.id !== id);
            renderSavedPlaces();
            showNotification('Saved place deleted', 'info');
        });
    });

    list.querySelectorAll('[data-action="edit"]').forEach(button => {
        button.addEventListener('click', () => {
            const id = Number(button.dataset.id);
            const place = appState.savedPlaces.find(item => item.id === id);
            if (!place) return;

            const form = document.getElementById('addAddressForm');
            const label = document.getElementById('addressLabel');
            const name = document.getElementById('addressName');
            const text = document.getElementById('addressText');

            label.value = place.label;
            name.value = place.name || '';
            text.value = place.address;
            form.classList.remove('hidden');
            form.dataset.editId = String(place.id);
            showNotification('Edit your saved place and save to update it', 'info');
        });
    });
}

const addAddressBtn = document.getElementById('addAddressBtn');
const addAddressForm = document.getElementById('addAddressForm');
const cancelAddressBtn = document.getElementById('cancelAddressBtn');

if (addAddressBtn) {
    addAddressBtn.addEventListener('click', () => {
        addAddressForm.classList.remove('hidden');
        addAddressForm.dataset.editId = '';
        addAddressForm.reset();
    });
}

if (cancelAddressBtn) {
    cancelAddressBtn.addEventListener('click', () => {
        addAddressForm.reset();
        addAddressForm.classList.add('hidden');
        delete addAddressForm.dataset.editId;
    });
}

if (addAddressForm) {
    addAddressForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const label = document.getElementById('addressLabel').value;
        const customName = document.getElementById('addressName').value.trim();
        const address = document.getElementById('addressText').value.trim();

        if (!label || !address) {
            showNotification('Please select a label and enter a full address', 'error');
            return;
        }

        const editedId = addAddressForm.dataset.editId ? Number(addAddressForm.dataset.editId) : null;

        if (editedId) {
            const place = appState.savedPlaces.find(item => item.id === editedId);
            if (place) {
                place.label = label;
                place.name = label === 'other' ? (customName || 'Other Place') : label === 'home' ? 'Home' : 'Work';
                place.address = address;
            }
            showNotification('Saved place updated', 'success');
        } else {
            const newPlace = {
                id: Date.now(),
                label,
                name: label === 'other' ? (customName || 'Other Place') : label === 'home' ? 'Home' : 'Work',
                address
            };
            appState.savedPlaces.push(newPlace);
            showNotification('New saved place added', 'success');
        }

        addAddressForm.reset();
        addAddressForm.classList.add('hidden');
        delete addAddressForm.dataset.editId;
        renderSavedPlaces();
    });
}

function renderCalendar() {
    const calendarMonths = document.getElementById('calendarMonth');
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarMonths || !calendarDays) return;

    const monthDate = new Date(appState.calendarYear, appState.calendarMonth, 1);
    calendarMonths.textContent = monthDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const firstDay = new Date(appState.calendarYear, appState.calendarMonth, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(appState.calendarYear, appState.calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(appState.calendarYear, appState.calendarMonth, 0).getDate();
    const rideDates = new Set(mockDatabase.rides
        .map(ride => ride.date)
        .filter(Boolean)
        .map(date => new Date(date).getDate())
    );

    calendarDays.innerHTML = '';

    for (let i = 0; i < 42; i++) {
        const day = i - startDay + 1;
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (day <= 0) {
            cell.textContent = daysInPrevMonth + day;
            cell.classList.add('other-month');
        } else if (day > daysInMonth) {
            cell.textContent = day - daysInMonth;
            cell.classList.add('other-month');
        } else {
            cell.textContent = day;
            if (rideDates.has(day)) {
                cell.classList.add('has-ride');
            }

            const today = new Date();
            if (today.getFullYear() === appState.calendarYear &&
                today.getMonth() === appState.calendarMonth &&
                today.getDate() === day) {
                cell.classList.add('today');
            }
        }

        calendarDays.appendChild(cell);
    }
}

const viewCalendarBtn = document.getElementById('viewCalendarBtn');
const activityCalendar = document.getElementById('activityCalendar');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

if (viewCalendarBtn) {
    viewCalendarBtn.addEventListener('click', () => {
        activityCalendar.style.display = activityCalendar.style.display === 'none' ? 'block' : 'none';
        renderCalendar();
    });
}

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        appState.calendarMonth -= 1;
        if (appState.calendarMonth < 0) {
            appState.calendarMonth = 11;
            appState.calendarYear -= 1;
        }
        renderCalendar();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        appState.calendarMonth += 1;
        if (appState.calendarMonth > 11) {
            appState.calendarMonth = 0;
            appState.calendarYear += 1;
        }
        renderCalendar();
    });
}

function togglePasswordForm(show) {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;
    form.style.display = show ? 'block' : 'none';
}

const changePasswordBtn = document.getElementById('changePasswordBtn');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');

if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => togglePasswordForm(true));
}

if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', () => togglePasswordForm(false));
}

const twoFactorToggle = document.getElementById('twoFactorToggle');

if (twoFactorToggle) {
    twoFactorToggle.addEventListener('change', () => {
        if (!appState.user) {
            twoFactorToggle.checked = false;
            showNotification('Please login first to enable Face Lock security', 'info');
            return;
        }

        appState.user.twoFactor = twoFactorToggle.checked;
        updateTwoFactorStatus();
        showNotification(
            twoFactorToggle.checked
                ? 'Face Lock / 2FA enabled successfully'
                : 'Face Lock / 2FA disabled',
            twoFactorToggle.checked ? 'success' : 'info'
        );
    });
}

const personalEditForm = document.getElementById('personalEditForm');
const editPersonalBtn = document.getElementById('editPersonalBtn');
const cancelPersonalBtn = document.getElementById('cancelPersonalBtn');

if (editPersonalBtn) {
    editPersonalBtn.addEventListener('click', () => {
        const displayName = document.getElementById('displayName').textContent.trim();
        const displayPhone = document.getElementById('displayPhone').textContent.trim();

        document.getElementById('editName').value = displayName;
        document.getElementById('editPhone').value = displayPhone;
        document.getElementById('editDOB').value = '';
        document.getElementById('editGender').value = '';
        personalEditForm.classList.remove('hidden');
    });
}

if (cancelPersonalBtn) {
    cancelPersonalBtn.addEventListener('click', () => {
        personalEditForm.reset();
        personalEditForm.classList.add('hidden');
    });
}

if (personalEditForm) {
    personalEditForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('editName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const dob = document.getElementById('editDOB').value;
        const gender = document.getElementById('editGender').value;

        if (!name || !phone || !dob || !gender) {
            showNotification('Please complete all personal information fields before saving.', 'error');
            return;
        }

        document.getElementById('displayName').textContent = name;
        document.getElementById('displayPhone').textContent = phone;
        document.getElementById('displayDOB').textContent = new Date(dob).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        document.getElementById('displayGender').textContent = gender.charAt(0).toUpperCase() + gender.slice(1);

        personalEditForm.reset();
        personalEditForm.classList.add('hidden');
        showNotification('Personal information saved successfully.', 'success');
    });
}

document.getElementById('paymentHistoryBtn').addEventListener('click', () => {
    showNotification('Payment history coming soon!', 'info');
});

const deleteAccountBtn = document.getElementById('deleteAccountBtn');

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            const remainingUsers = mockDatabase.users.filter(user => user.email !== appState.user?.email);
            mockDatabase.users = remainingUsers;
            logout();
            showNotification('Account deleted', 'success');
            showPage('homePage');
        }
    });
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Louise Transport App Loaded!');
    initializeMap('mapContainer', GHANA_CENTER);
    initializeMap('liveMapContainer', GHANA_CENTER);
    showPage('homePage');
    updateNavbar();
    updateTwoFactorStatus();
    
    // For demo purposes, log available test accounts
    console.log('Demo Accounts:');
    console.log('Rider: rider@test.com / 123456');
    console.log('Driver: driver@test.com / 123456');
});
