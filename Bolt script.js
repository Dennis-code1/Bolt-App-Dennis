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
    rating: 0
};

// Mock Database for Demo
const mockDatabase = {
    users: [
        { id: 1, email: 'rider@test.com', password: '123456', name: 'John Doe', phone: '0559999999', type: 'rider', rating: 4.8, totalRides: 12, totalSpent: 250 },
        { id: 2, email: 'driver@test.com', password: '123456', name: 'John Mensah', phone: '0551234567', type: 'driver', rating: 4.9, completedRides: 250, totalEarnings: 5000 }
    ],
    drivers: [
        { id: 1, name: 'John Mensah', rating: 4.9, car: 'Toyota Corolla • GR 1234 PM', distance: '2 km away', price: 'GHS 15.50' },
        { id: 2, name: 'Samuel Agyeman', rating: 4.7, car: 'Honda Civic • GR 5678 PM', distance: '3 km away', price: 'GHS 18.00' },
        { id: 3, name: 'Kwame Boateng', rating: 4.8, car: 'Nissan Altima • GR 9012 PM', distance: '4 km away', price: 'GHS 22.50' }
    ],
    rides: [
        { id: 1, from: 'Osu, Accra', to: 'Airport, Accra', fare: 25.50, date: '2024-05-10', driver: 'John Mensah', rating: 5 },
        { id: 2, from: 'Tema, Accra', to: 'Kasoa, Central Region', fare: 45.00, date: '2024-05-09', driver: 'Samuel Agyeman', rating: 4 },
        { id: 3, from: 'Kumasi', to: 'Ejisu, Ashanti', fare: 35.75, date: '2024-05-08', driver: 'Kwame Boateng', rating: 5 }
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
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Mock authentication
    const user = mockDatabase.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        appState.user = user;
        appState.isLoggedIn = true;
        appState.userType = user.type;
        
        updateNavbar();
        showNotification(`Welcome ${user.name}!`, 'success');
        showPage('homePage');
        
        // Reset form
        document.getElementById('loginForm').reset();
    } else {
        showNotification('Invalid email or password', 'error');
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
        totalEarnings: 0
    };
    
    mockDatabase.users.push(newUser);
    appState.user = newUser;
    appState.isLoggedIn = true;
    appState.userType = accountType;
    
    updateNavbar();
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

document.getElementById('rideForm').addEventListener('submit', (e) => {
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

document.getElementById('editProfileBtn').addEventListener('click', () => {
    showNotification('Profile editing coming soon!', 'info');
});

document.getElementById('paymentHistoryBtn').addEventListener('click', () => {
    showNotification('Payment history coming soon!', 'info');
});

document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        logout();
        showNotification('Account deleted', 'success');
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Louise Transport App Loaded!');
    showPage('homePage');
    updateNavbar();
    
    // For demo purposes, log available test accounts
    console.log('Demo Accounts:');
    console.log('Rider: rider@test.com / 123456');
    console.log('Driver: driver@test.com / 123456');
});
