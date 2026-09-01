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

const ridePricing = {
    economy: { baseFare: 12, perKm: 2.3, minimum: 18 },
    comfort: { baseFare: 18, perKm: 3.4, minimum: 28 },
    premium: { baseFare: 26, perKm: 4.9, minimum: 42 }
};

function formatGhanaCurrency(value) {
    return `GH₵${Number(value).toFixed(2)}`;
}

function getRidePricePlan(type) {
    return ridePricing[type] || ridePricing.economy;
}

function calculateDistanceKm(start, end) {
    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371;
    const dLat = toRadians(end.lat - start.lat);
    const dLon = toRadians(end.lon - start.lon);
    const lat1 = toRadians(start.lat);
    const lat2 = toRadians(end.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function getDynamicFare(type, distanceKm) {
    const plan = getRidePricePlan(type);
    return Math.max(plan.minimum, plan.baseFare + distanceKm * plan.perKm);
}

async function estimateRideFareFromRoute(type, pickupAddress, destinationAddress) {
    const pickupValue = (pickupAddress || '').trim();
    const dropoffValue = (destinationAddress || '').trim();

    if (!pickupValue || !dropoffValue) {
        return null;
    }

    const pickupCoords = await geocodeLocation(pickupValue);
    const destinationCoords = await geocodeLocation(dropoffValue);

    if (!pickupCoords || !destinationCoords) {
        return null;
    }

    const distanceKm = calculateDistanceKm(pickupCoords, destinationCoords);
    const fare = getDynamicFare(type, distanceKm);

    return {
        distanceKm,
        fare,
        routeText: `${distanceKm.toFixed(1)} km away`
    };
}

async function updateFareEstimate() {
    const fareEstimateValue = document.getElementById('fareEstimateValue');
    const fareDistanceText = document.getElementById('fareDistanceText');
    const rideType = document.getElementById('rideType')?.value || 'economy';
    const pickupAddress = document.getElementById('pickupLocation')?.value || '';
    const destinationAddress = document.getElementById('dropoffLocation')?.value || '';
    const navigateBtn = document.getElementById('navigateRouteBtn');

    if (!fareEstimateValue || !fareDistanceText) return;

    if (!pickupAddress || !destinationAddress) {
        fareEstimateValue.textContent = 'GH₵0.00';
        fareDistanceText.textContent = 'Pricing changes based on distance, pickup, and drop-off locations.';
        if (navigateBtn) navigateBtn.style.display = 'none';
        return;
    }

    try {
        const quote = await estimateRideFareFromRoute(rideType, pickupAddress, destinationAddress);
        if (!quote) {
            fareEstimateValue.textContent = 'Could not estimate';
            fareDistanceText.textContent = 'Please enter a more specific pickup and destination.';
            if (navigateBtn) navigateBtn.style.display = 'none';
            return;
        }

        fareEstimateValue.textContent = formatGhanaCurrency(quote.fare);
        fareDistanceText.textContent = `${quote.routeText} • ${rideType.charAt(0).toUpperCase() + rideType.slice(1)} ride`;

        const routeReady = await updateRideMapFromAddresses(pickupAddress, destinationAddress);
        if (routeReady && navigateBtn) {
            navigateBtn.style.display = 'block';
            navigateBtn.dataset.origin = pickupAddress;
            navigateBtn.dataset.destination = destinationAddress;
        } else if (navigateBtn) {
            navigateBtn.style.display = 'none';
        }
    } catch (error) {
        fareEstimateValue.textContent = 'Could not estimate';
        fareDistanceText.textContent = 'Please check your pickup and destination details.';
        if (navigateBtn) navigateBtn.style.display = 'none';
    }
}

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
    const page = document.getElementById(pageId);
    if (!page) return;

    document.querySelectorAll('.page').forEach(pageEl => {
        pageEl.classList.remove('active');
    });

    page.classList.add('active');
    window.scrollTo(0, 0);
    resizeMaps();
}

function populateQuickBookingFromInputs() {
    const pickup = document.getElementById('quickPickup')?.value?.trim() || '';
    const dropoff = document.getElementById('quickDestination')?.value?.trim() || '';

    if (!pickup || !dropoff) {
        showNotification('Please enter both a pickup and destination to continue.', 'error');
        return false;
    }

    const pickupInput = document.getElementById('pickupLocation');
    const dropoffInput = document.getElementById('dropoffLocation');
    const rideTypeInput = document.getElementById('rideType');

    if (pickupInput) pickupInput.value = pickup;
    if (dropoffInput) dropoffInput.value = dropoff;
    if (rideTypeInput) rideTypeInput.value = 'economy';

    showPage('ridePage');
    return launchRideBookingFlow();
}

async function launchRideBookingFlow() {
    if (!appState.isLoggedIn) {
        showNotification('Please login first', 'error');
        return false;
    }

    const pickupLocation = document.getElementById('pickupLocation')?.value?.trim() || '';
    const dropoffLocation = document.getElementById('dropoffLocation')?.value?.trim() || '';
    const rideType = document.getElementById('rideType')?.value || 'economy';
    const passengers = document.getElementById('passengers')?.value || '1';

    if (!pickupLocation || !dropoffLocation) {
        showNotification('Please enter valid pickup and drop-off locations.', 'error');
        return false;
    }

    try {
        const routeQuote = await estimateRideFareFromRoute(rideType, pickupLocation, dropoffLocation);
        if (!routeQuote) {
            showNotification('Please enter valid pickup and drop-off locations.', 'error');
            return false;
        }

        appState.currentRide = {
            id: Math.random(),
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            type: rideType,
            passengers,
            distanceKm: routeQuote.distanceKm,
            fare: routeQuote.fare,
            status: 'searching',
            createdAt: new Date()
        };

        const routeReady = await updateRideMapFromAddresses(pickupLocation, dropoffLocation);
        if (!routeReady) {
            return false;
        }
    } catch (error) {
        console.error('Map geocoding failed:', error);
        showNotification('Map lookup failed. Please enter a more specific address.', 'error');
        return false;
    }

    populateAvailableDrivers();
    showNotification('Finding drivers for you...', 'info');
    return true;
}

function preparePaymentFromCurrentRide() {
    if (!appState.currentRide) {
        showNotification('There is no active ride to pay for yet.', 'error');
        return;
    }

    const totalAmount = Number(appState.currentRide.fare || 0);
    const baseAmount = totalAmount * 0.25;
    const distanceAmount = totalAmount - baseAmount;

    const baseFareEl = document.getElementById('baseFare');
    const distanceFareEl = document.getElementById('distanceFare');
    const totalAmountEl = document.getElementById('totalAmount');

    if (baseFareEl) baseFareEl.textContent = formatGhanaCurrency(baseAmount);
    if (distanceFareEl) distanceFareEl.textContent = formatGhanaCurrency(distanceAmount);
    if (totalAmountEl) totalAmountEl.textContent = formatGhanaCurrency(totalAmount);

    showPage('paymentPage');
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

function getFallbackLocationCoords(query) {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return null;

    const cityCenters = {
        accra: { lat: 5.6037, lon: -0.1870, displayName: 'Accra, Greater Accra, Ghana' },
        osu: { lat: 5.5573, lon: -0.1860, displayName: 'Osu, Accra, Ghana' },
        'kotoka airport': { lat: 5.6044, lon: -0.1668, displayName: 'Kotoka International Airport, Accra, Ghana' },
        airport: { lat: 5.6044, lon: -0.1668, displayName: 'Kotoka International Airport, Accra, Ghana' },
        tema: { lat: 5.6698, lon: -0.0164, displayName: 'Tema, Greater Accra, Ghana' },
        kasoa: { lat: 5.5344, lon: -0.4270, displayName: 'Kasoa, Central Region, Ghana' },
        kumasi: { lat: 6.6885, lon: -1.6232, displayName: 'Kumasi, Ashanti, Ghana' },
        ejisu: { lat: 6.7145, lon: -1.3786, displayName: 'Ejisu, Ashanti, Ghana' },
        cape: { lat: 5.1053, lon: -1.2466, displayName: 'Cape Coast, Central Region, Ghana' },
        'cape coast': { lat: 5.1053, lon: -1.2466, displayName: 'Cape Coast, Central Region, Ghana' },
        takoradi: { lat: 4.8935, lon: -1.7600, displayName: 'Takoradi, Western Region, Ghana' },
        sunyani: { lat: 7.3398, lon: -2.3260, displayName: 'Sunyani, Bono Region, Ghana' },
        elmina: { lat: 5.0839, lon: -1.3500, displayName: 'Elmina, Central Region, Ghana' },
        madina: { lat: 5.6778, lon: -0.1695, displayName: 'Madina, Accra, Ghana' },
        legon: { lat: 5.6508, lon: -0.1849, displayName: 'Legon, Accra, Ghana' },
        'accra mall': { lat: 5.6370, lon: -0.1535, displayName: 'Accra Mall, Accra, Ghana' },
        mall: { lat: 5.6370, lon: -0.1535, displayName: 'Accra Mall, Accra, Ghana' },
        'kaneshie': { lat: 5.5714, lon: -0.2124, displayName: 'Kaneshie, Accra, Ghana' },
        'circle': { lat: 5.5607, lon: -0.2060, displayName: 'Circle, Accra, Ghana' }
    };

    for (const [key, value] of Object.entries(cityCenters)) {
        if (normalized.includes(key)) {
            return value;
        }
    }

    const firstWord = normalized.split(/\s+/)[0];
    if (firstWord && firstWord.length > 2) {
        return {
            lat: 5.6037 + ((firstWord.charCodeAt(0) % 10) * 0.05),
            lon: -0.1870 + ((firstWord.charCodeAt(firstWord.length - 1) % 10) * 0.05),
            displayName: `${query}, Ghana`
        };
    }

    return {
        lat: 5.6037,
        lon: -0.1870,
        displayName: `${query}, Ghana`
    };
}

async function geocodeLocation(query) {
    const cleanedQuery = String(query || '').trim();

    if (!cleanedQuery) {
        return null;
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(cleanedQuery + ', Ghana')}`;

        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'en'
            }
        });

        if (!response.ok) {
            return getFallbackLocationCoords(cleanedQuery);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return getFallbackLocationCoords(cleanedQuery);
        }

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name
        };
    } catch (error) {
        return getFallbackLocationCoords(cleanedQuery);
    }
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

document.getElementById('homeLogo')?.addEventListener('click', (event) => {
    event.preventDefault();
    showPage('homePage');
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
        const accountType = document.getElementById('accountType');
        if (accountType) {
            accountType.value = 'driver';
            updateAccountTypeFields();
        }
        showPage('signupPage');
    }
});

document.getElementById('quickBookBtn')?.addEventListener('click', () => {
    const ok = populateQuickBookingFromInputs();
    if (ok) {
        updateFareEstimate();
    }
});

document.getElementById('safetyBookBtn')?.addEventListener('click', () => {
    if (appState.isLoggedIn) {
        showPage('ridePage');
    } else {
        showPage('loginPage');
        showNotification('Please login to book a safe ride.', 'info');
    }
});

document.getElementById('footerHomeBtn')?.addEventListener('click', () => showPage('homePage'));
document.getElementById('footerRideBtn')?.addEventListener('click', () => {
    if (appState.isLoggedIn && appState.userType === 'rider') {
        showPage('ridePage');
    } else {
        showPage('loginPage');
        showNotification('Please login as a rider to continue.', 'info');
    }
});
document.getElementById('footerDriveBtn')?.addEventListener('click', () => {
    if (appState.isLoggedIn && appState.userType === 'driver') {
        showPage('driverPage');
    } else {
        showPage('loginPage');
        showNotification('Please login as a driver to continue.', 'info');
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

document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('forgotPasswordPage');
});

document.getElementById('backToLoginFromForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
});

document.getElementById('backToLoginFromReset')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
});

document.getElementById('accountType')?.addEventListener('change', updateAccountTypeFields);

document.getElementById('signupPassword')?.addEventListener('input', (event) => {
    updatePasswordStrengthUI(event.target.value);
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginCode = document.getElementById('loginCode').value.trim();
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    clearValidationError(emailInput);
    clearValidationError(passwordInput);

    if (!isValidEmail(email)) {
        showValidationError(emailInput, 'Please enter a valid email address.');
        showNotification('Please enter a valid email.', 'error');
        return;
    }

    if (!password || password.length < 6) {
        showValidationError(passwordInput, 'Password must be at least 6 characters.');
        showNotification('Password must be at least 6 characters.', 'error');
        return;
    }
    
    const user = mockDatabase.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
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
            showNotification(`Two-factor authentication is enabled. Use the 6-digit code: ${requiredCode}`, 'info');
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
    
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const phoneInput = document.getElementById('signupPhone');
    const passwordInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('confirmPassword');
    const accountType = document.getElementById('accountType').value;
    const termsAccepted = document.getElementById('termsAccepted');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    [nameInput, emailInput, phoneInput, passwordInput, confirmInput].forEach(clearValidationError);

    if (!name || name.length < 2) {
        showValidationError(nameInput, 'Please enter your full name.');
        return;
    }

    if (!isValidEmail(email)) {
        showValidationError(emailInput, 'Please use a valid email address.');
        return;
    }

    if (mockDatabase.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showValidationError(emailInput, 'This email is already registered.');
        showNotification('Email already registered', 'error');
        return;
    }

    if (!isValidGhanaPhone(phone)) {
        showValidationError(phoneInput, 'Use a valid Ghana phone number like 0551234567.');
        return;
    }

    if (password.length < 8 || getPasswordStrength(password) < 3) {
        showValidationError(passwordInput, 'Use 8+ characters with letters, numbers and symbols.');
        showNotification('Choose a stronger password.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showValidationError(confirmInput, 'Passwords do not match.');
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (accountType === 'driver') {
        const driverLicence = document.getElementById('driverLicence');
        const vehicleType = document.getElementById('vehicleType');
        const vehicleMake = document.getElementById('vehicleMake');
        const vehicleModel = document.getElementById('vehicleModel');
        const vehiclePlate = document.getElementById('vehiclePlate');

        if (!driverLicence.value.trim() || !vehicleType.value || !vehicleMake.value.trim() || !vehicleModel.value.trim() || !vehiclePlate.value.trim()) {
            showNotification('Please complete the driver details before registering.', 'error');
            return;
        }
    }

    if (!termsAccepted.checked) {
        showNotification('Please accept the Terms & Conditions to continue.', 'error');
        return;
    }
    
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
        twoFactor: false,
        memberSince: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        dob: '',
        gender: 'not-set',
        driverInfo: accountType === 'driver' ? {
            licence: document.getElementById('driverLicence').value.trim(),
            vehicleType: document.getElementById('vehicleType').value,
            vehicleMake: document.getElementById('vehicleMake').value.trim(),
            vehicleModel: document.getElementById('vehicleModel').value.trim(),
            vehiclePlate: document.getElementById('vehiclePlate').value.trim()
        } : null,
        avatar: null
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
    updateAccountTypeFields();
    updatePasswordStrengthUI('');
});

document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('forgotEmail');
    const email = emailInput.value.trim();
    clearValidationError(emailInput);

    if (!isValidEmail(email)) {
        showValidationError(emailInput, 'Please enter a valid email address.');
        showNotification('Please enter a valid email.', 'error');
        return;
    }

    const match = mockDatabase.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (match) {
        appState.user = match;
    }

    showNotification('A password reset link has been sent to your email.', 'success');
    showPage('resetPasswordPage');
});

document.getElementById('resetPasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPasswordInput = document.getElementById('newResetPassword');
    const confirmPasswordInput = document.getElementById('confirmResetPassword');
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    clearValidationError(newPasswordInput);
    clearValidationError(confirmPasswordInput);

    if (newPassword.length < 8 || getPasswordStrength(newPassword) < 3) {
        showValidationError(newPasswordInput, 'Use 8+ characters with letters, numbers and symbols.');
        showNotification('Choose a stronger password.', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showValidationError(confirmPasswordInput, 'Passwords do not match.');
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (appState.user) {
        appState.user.password = newPassword;
    }

    showNotification('Your password has been updated successfully.', 'success');
    document.getElementById('resetPasswordForm').reset();
    showPage('loginPage');
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

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidGhanaPhone(phone) {
    return /^(\+233|233|0)(20|24|26|27|28|50|54|55|57|59)\d{7}$/.test(phone.replace(/\s+/g, ''));
}

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

function updatePasswordStrengthUI(password) {
    const indicator = document.querySelector('#passwordStrength .strength-bar');
    const strengthText = document.getElementById('strengthText');
    if (!indicator || !strengthText) return;

    const score = getPasswordStrength(password);
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#22c55e', '#16a34a'];
    const labels = [
        'Very weak',
        'Weak',
        'Fair',
        'Good',
        'Strong'
    ];

    indicator.style.width = widths[score];
    indicator.style.background = colors[score];
    strengthText.textContent = score === 0 ? 'Use 8+ characters with letters, numbers and symbols.' : `Password strength: ${labels[score]}`;
}

function togglePasswordVisibility(button) {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    const icon = button.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-eye', !show);
        icon.classList.toggle('fa-eye-slash', show);
    }
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

function bindPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', () => togglePasswordVisibility(button));
    });
}

function updateAccountTypeFields() {
    const accountType = document.getElementById('accountType');
    const driverFields = document.getElementById('driverFields');
    if (!accountType || !driverFields) return;

    const isDriver = accountType.value === 'driver';
    driverFields.classList.toggle('hidden', !isDriver);
}

function showValidationError(input, message) {
    if (!input) return;
    input.classList.add('input-error');
    const existingMessage = input.parentElement?.parentElement?.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.textContent = message;
        return;
    }

    const errorEl = document.createElement('small');
    errorEl.className = 'validation-message';
    errorEl.textContent = message;
    input.parentElement?.parentElement?.appendChild(errorEl);
}

function clearValidationError(input) {
    if (!input) return;
    input.classList.remove('input-error');
    const errorEl = input.parentElement?.parentElement?.querySelector('.validation-message');
    if (errorEl) errorEl.remove();
}

// ============================================
// RIDE BOOKING
// ============================================

document.getElementById('rideForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await launchRideBookingFlow();
});

function populateAvailableDrivers() {
    const driversList = document.getElementById('driversList');
    driversList.innerHTML = '';
    const routeDistance = appState.currentRide?.distanceKm || 12;

    mockDatabase.drivers.forEach(driver => {
        const driverRate = Math.max(18, appState.currentRide ? getDynamicFare(appState.currentRide.type, routeDistance + driver.id * 0.8) : 20);
        const driverItem = document.createElement('div');
        driverItem.className = 'driver-item';
        driverItem.innerHTML = `
            <div class="driver-item-header">
                <div>
                    <div class="driver-item-name">${driver.name}</div>
                    <div class="driver-item-rating">${driver.rating} ⭐</div>
                </div>
                <div class="driver-item-price">${formatGhanaCurrency(driverRate)}</div>
            </div>
            <div class="driver-item-car">${driver.car}</div>
            <div class="driver-item-distance">${driver.distance}</div>
        `;
        
        driverItem.addEventListener('click', () => {
            selectDriver(driver, driverRate);
        });
        
        driversList.appendChild(driverItem);
    });
}

function selectDriver(driver, selectedFare) {
    appState.currentRide.driver = driver;
    appState.currentRide.status = 'confirmed';
    appState.currentRide.fare = selectedFare || appState.currentRide.fare || 0;
    
    document.getElementById('driverName').textContent = driver.name;
    document.getElementById('driverCar').textContent = driver.car;
    document.getElementById('driverRatingActive').textContent = `⭐ ${driver.rating} (250 rides)`;
    document.getElementById('activePickup').textContent = appState.currentRide.pickup;
    document.getElementById('activeDropoff').textContent = appState.currentRide.dropoff;
    
    const fareValue = Number(appState.currentRide.fare || 0);
    const baseFare = Math.max(5, fareValue * 0.2);
    const distanceFare = fareValue - baseFare;
    document.getElementById('estimatedFare').textContent = formatGhanaCurrency(fareValue);
    document.getElementById('baseFare').textContent = formatGhanaCurrency(baseFare);
    document.getElementById('distanceFare').textContent = formatGhanaCurrency(distanceFare);
    document.getElementById('totalAmount').textContent = formatGhanaCurrency(fareValue);
    
    showNotification(`Driver ${driver.name} accepted your ride!`, 'success');
    showPage('activeRidePage');
    startRideSimulation();
}

function startRideSimulation() {
    let arrivalTime = 5;
    const etaElement = document.getElementById('eta');
    
    const countdownInterval = setInterval(() => {
        if (arrivalTime <= 0) {
            clearInterval(countdownInterval);
            if (etaElement) {
                etaElement.textContent = 'Driver arrived!';
            }
            showNotification('Your driver has arrived. Please complete the ride payment.', 'success');
            const completeBtn = document.getElementById('completeRideBtn');
            if (completeBtn) {
                completeBtn.style.display = 'block';
            }
        } else {
            if (etaElement) {
                etaElement.textContent = `${arrivalTime} minute${arrivalTime === 1 ? '' : 's'}`;
            }
            arrivalTime--;
        }
    }, 1000);
}

const callDriverBtn = document.getElementById('callDriverBtn');
if (callDriverBtn) {
    callDriverBtn.addEventListener('click', () => {
        showNotification('Calling driver...', 'info');
    });
}

document.getElementById('completeRideBtn')?.addEventListener('click', () => {
    if (!appState.currentRide) {
        showNotification('No ride is active right now.', 'error');
        return;
    }

    preparePaymentFromCurrentRide();
});

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
    const cardFields = document.getElementById('cardFields');
    const shouldShowMomo = this.value === 'momo';
    const shouldShowCard = this.value === 'card';

    if (momoFields) momoFields.style.display = shouldShowMomo ? 'block' : 'none';
    if (cardFields) cardFields.style.display = shouldShowCard ? 'block' : 'none';
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

    if (paymentMethod === 'card') {
        const cardName = document.getElementById('cardName').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const cardExpiry = document.getElementById('cardExpiry').value.trim();
        const cardCvv = document.getElementById('cardCvv').value.trim();

        if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
            showNotification('Please complete all card details', 'error');
            return;
        }
    }
    
    showNotification(`Payment of ${totalAmount} processed successfully!`, 'success');
    
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

    const profileAvatarPreview = document.getElementById('profileAvatarPreview');
    if (profileAvatarPreview) {
        if (user.avatar) {
            profileAvatarPreview.innerHTML = `<img src="${user.avatar}" alt="Profile photo">`;
        } else {
            profileAvatarPreview.innerHTML = '<i class="fas fa-user"></i>';
        }
    }
    
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    const profilePhone = document.getElementById('profilePhone');
    if (profilePhone) profilePhone.textContent = user.phone;

    document.getElementById('displayName').textContent = user.name || 'Not provided';
    document.getElementById('displayEmail').textContent = user.email || 'Not provided';
    document.getElementById('displayPhone').textContent = user.phone || 'Not provided';
    document.getElementById('displayDOB').textContent = user.dob ? new Date(user.dob).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : 'Not provided';
    document.getElementById('displayGender').textContent = user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not provided';
    document.getElementById('displayMemberSince').textContent = user.memberSince || 'August 2024';

    const securityLoginEmail = document.getElementById('securityLoginEmail');
    const securityPhone = document.getElementById('securityPhone');
    if (securityLoginEmail) securityLoginEmail.textContent = user.email || 'Not provided';
    if (securityPhone) securityPhone.textContent = user.phone || 'Not provided';

    const totalRidesStats = document.getElementById('totalRidesStats');
    const ratingStats = document.getElementById('ratingStats');
    const spentStats = document.getElementById('spentStats');

    if (totalRidesStats) totalRidesStats.textContent = user.type === 'rider' ? String(user.totalRides) : String(user.completedRides || 0);
    if (ratingStats) ratingStats.textContent = `${user.rating} ⭐`;
    if (spentStats) spentStats.textContent = `GH₵${(user.type === 'rider' ? user.totalSpent : user.totalEarnings || 0).toFixed(2)}`;
    
    populateRideHistory();
    renderSavedPlaces();
    updateTwoFactorStatus();
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
    const lists = document.querySelectorAll('.addresses-list');
    if (!lists.length) return;

    lists.forEach(list => {
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
        const displayDOB = document.getElementById('displayDOB').textContent.trim();
        const displayGender = document.getElementById('displayGender').textContent.trim();

        document.getElementById('editName').value = displayName === 'Not provided' ? '' : displayName;
        document.getElementById('editPhone').value = displayPhone === 'Not provided' ? '' : displayPhone;
        document.getElementById('editDOB').value = appState.user?.dob || '';
        document.getElementById('editGender').value = (appState.user?.gender || '').toLowerCase();
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

        if (appState.user) {
            appState.user.name = name;
            appState.user.phone = phone;
            appState.user.dob = dob;
            appState.user.gender = gender;
            document.getElementById('profileName').textContent = name;
            document.getElementById('profilePhone').textContent = phone;
        }

        personalEditForm.reset();
        personalEditForm.classList.add('hidden');
        showNotification('Personal information saved successfully.', 'success');
    });
}

const profilePhotoInput = document.getElementById('profilePhotoInput');
if (profilePhotoInput) {
    profilePhotoInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file || !appState.user) {
            showNotification('Please log in before uploading a profile picture.', 'info');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showNotification('Please upload a valid image file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (readEvent) => {
            appState.user.avatar = readEvent.target.result;
            const preview = document.getElementById('profileAvatarPreview');
            if (preview) {
                preview.innerHTML = `<img src="${readEvent.target.result}" alt="Profile photo">`;
            }
            showNotification('Profile photo updated successfully.', 'success');
        };
        reader.readAsDataURL(file);
    });
}

const rideTypeSelect = document.getElementById('rideType');
const pickupLocationInput = document.getElementById('pickupLocation');
const dropoffLocationInput = document.getElementById('dropoffLocation');
const navigateRouteBtn = document.getElementById('navigateRouteBtn');

[rideTypeSelect, pickupLocationInput, dropoffLocationInput].forEach(element => {
    if (element) {
        element.addEventListener('input', updateFareEstimate);
        element.addEventListener('change', updateFareEstimate);
    }
});

if (navigateRouteBtn) {
    navigateRouteBtn.addEventListener('click', () => {
        const origin = navigateRouteBtn.dataset.origin || pickupLocationInput?.value || '';
        const destination = navigateRouteBtn.dataset.destination || dropoffLocationInput?.value || '';

        if (!origin || !destination) {
            showNotification('Please add both pickup and drop-off locations first.', 'error');
            return;
        }

        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    });
}

const paymentHistoryBtn = document.getElementById('paymentHistoryBtn');
if (paymentHistoryBtn) {
    paymentHistoryBtn.addEventListener('click', () => {
        showNotification('Payment history coming soon!', 'info');
    });
}

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

const cityInfo = {
    accra: {
        title: 'Accra',
        subtitle: 'The energetic heart of Ghana, full of life, music, and coastal charm.',
        text: 'Accra is Ghana’s vibrant capital, where busy markets, welcoming people, and creative energy meet the Atlantic coastline. It is the perfect destination for work, celebration, and discovery, with a rhythm that never slows down.',
        highlights: ['Live music and nightlife', 'Beautiful coastal views', 'Busy markets and local culture'],
        image: 'Acca.jpg'
    },
    kumasi: {
        title: 'Kumasi',
        subtitle: 'A cultural treasure known for tradition, craft, and warm hospitality.',
        text: 'Kumasi is celebrated as the cultural capital of Ghana. From its rich heritage and traditional markets to its strong community spirit, the city offers a truly authentic experience rooted in art, storytelling, and friendship.',
        highlights: ['Rich cultural heritage', 'Traditional craft markets', 'Friendly people and lively streets'],
        image: 'view-from-kejetia-market-kumasi-1.jpg'
    },
    tema: {
        title: 'Tema',
        subtitle: 'A fast-growing port city that connects movement, trade, and opportunity.',
        text: 'Tema is known for its strategic importance and modern progress. With its port, busy commercial activity, and easy access to Accra, it reflects the strength and momentum of Ghana’s growing urban life.',
        highlights: ['Major port city', 'Strong business energy', 'Easy access to the capital'],
        image: '0100r12000kyudifu10B8_W_480_0_Q50.webp'
    },
    'cape-coast': {
        title: 'Cape Coast',
        subtitle: 'A historic coastal city with beauty, heritage, and peaceful ocean views.',
        text: 'Cape Coast is one of Ghana’s most memorable destinations, where old forts, sea breezes, and history come together. It offers visitors a calm yet inspiring atmosphere shaped by culture, memory, and natural beauty.',
        highlights: ['Historic forts and landmarks', 'Beautiful shoreline', 'A calm cultural atmosphere'],
        image: 'caption.jpg'
    },
    takoradi: {
        title: 'Takoradi',
        subtitle: 'A lively sea city filled with energy, trade, and breathtaking coastline.',
        text: 'Takoradi is a dynamic city with a rich maritime identity and scenic coastal atmosphere. It blends urban energy with open spaces and ocean views, making it one of Ghana’s most beautiful and welcoming ports.',
        highlights: ['Seaside beauty', 'Commercial activity', 'Warm local communities'],
        image: 'planter-s-lodge.jpg'
    },
    kakum: {
        title: 'Kakum',
        subtitle: 'A gateway to nature, rainforest adventure, and fresh green beauty.',
        text: 'Kakum is known for its rainforest beauty and unforgettable eco-adventures. It is the ideal place for visitors who want to experience Ghana’s natural environment through canopy walkways, scenic trails, and peaceful green landscapes.',
        highlights: ['Rainforest adventure', 'Nature and canopy walks', 'Eco-tourism and scenic views'],
        image: 'unnamed.webp'
    },
    sunyani: {
        title: 'Sunyani',
        subtitle: 'A delightful city of friendliness, calm surroundings, and inner-city warmth.',
        text: 'Sunyani offers a refreshing and welcoming experience in the heart of Ghana. Known for its relaxed pace and community spirit, it is a place where visitors feel at ease while enjoying a simpler and more peaceful side of the country.',
        highlights: ['Friendly communities', 'A calm city feel', 'A welcoming atmosphere'],
        image: 'images.jfif'
    },
    elmina: {
        title: 'Elmina',
        subtitle: 'A historic coastal town where heritage and beauty live together.',
        text: 'Elmina is one of Ghana’s most treasured historical towns, known for its castle and coastal charm. It offers a rich sense of the past while still feeling vibrant, scenic, and deeply connected to the sea.',
        highlights: ['Historic castle heritage', 'Scenic sea views', 'Quiet coastal beauty'],
        image: '68.jpg'
    }
};

function openCityModal(cityKey) {
    const city = cityInfo[cityKey];
    const modal = document.getElementById('cityModal');
    if (!city || !modal) return;

    const title = document.getElementById('cityModalTitle');
    const subtitle = document.getElementById('cityModalSubtitle');
    const text = document.getElementById('cityModalText');
    const image = document.getElementById('cityModalImage');
    const highlights = document.getElementById('cityModalHighlights');

    title.textContent = city.title;
    subtitle.textContent = city.subtitle;
    text.innerHTML = `<p>${city.text}</p>`;
    image.src = city.image;
    image.alt = `${city.title} city view`;
    highlights.innerHTML = city.highlights.map(item => `<li>${item}</li>`).join('');

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function closeCityModal() {
    const modal = document.getElementById('cityModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.city-card').forEach((card) => {
    card.addEventListener('click', () => openCityModal(card.dataset.city));
});

document.querySelectorAll('[data-close-city-modal="true"]').forEach((element) => {
    element.addEventListener('click', closeCityModal);
});

document.querySelector('.city-modal-close')?.addEventListener('click', closeCityModal);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeCityModal();
    }
});

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

const themeModeToggle = document.getElementById('themeModeToggle');

if (themeModeToggle) {
    themeModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme', themeModeToggle.checked);
        showNotification(themeModeToggle.checked ? 'Night mode enabled' : 'Day mode enabled', 'info');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Louise Transport App Loaded!');
    initializeMap('mapContainer', GHANA_CENTER);
    initializeMap('liveMapContainer', GHANA_CENTER);
    showPage('homePage');
    updateNavbar();
    updateTwoFactorStatus();
    renderSavedPlaces();
    
    // For demo purposes, log available test accounts
    console.log('Demo Accounts:');
    console.log('Rider: rider@test.com / 123456');
    console.log('Driver: driver@test.com / 123456');
});
