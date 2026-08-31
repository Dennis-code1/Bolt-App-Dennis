/* =========================================
   LOUISE TRANSPORT
   JAVASCRIPT
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       VARIABLES
       ===================================== */

    const pages =
        document.querySelectorAll(".page");

    const navMenu =
        document.getElementById("navMenu");

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

    const notification =
        document.getElementById("notification");


    let currentUser =
        JSON.parse(
            localStorage.getItem("louiseUser")
        ) || null;


    let currentRide =
        JSON.parse(
            localStorage.getItem("louiseCurrentRide")
        ) || null;


    let rideHistory =
        JSON.parse(
            localStorage.getItem("louiseRideHistory")
        ) || [];


    let selectedRating = 0;


    let earnings = 0;

    let completedRides = 0;


    /* =====================================
       VALID LOCATIONS (GHANA CITIES)
       ===================================== */

    const validLocations = [
        "Accra",
        "Kumasi",
        "Tema",
        "Cape Coast",
        "Takoradi",
        "Sekondi",
        "Senya",
        "Koforidua",
        "Tamale",
        "Osu",
        "Labadi",
        "Madina",
        "Legon",
        "Kasoa",
        "Ashaiman"
    ];

    let isPickupValid = false;
    let isDestinationValid = false;


    /* =====================================
       DRIVER DATA
       ===================================== */

    const drivers = [

        {
            name: "John Mensah",
            car: "Toyota Corolla",
            plate: "GR 1234 PM",
            rating: "4.9",
            eta: 4
        },

        {
            name: "Michael Asare",
            car: "Hyundai Elantra",
            plate: "GT 5521 A",
            rating: "4.8",
            eta: 6
        },

        {
            name: "Daniel Owusu",
            car: "Kia Rio",
            plate: "GW 9034 B",
            rating: "4.7",
            eta: 8
        }

    ];


    /* =====================================
       FARE RATES
       ===================================== */

    const fareRates = {

        economy: {

            base: 5,

            perKm: 1.35

        },


        comfort: {

            base: 8,

            perKm: 1.70

        },


        premium: {

            base: 12,

            perKm: 2.20

        }

    };


    /* =====================================
       PAGE NAVIGATION
       ===================================== */

    function showPage(pageId) {

        pages.forEach(function (page) {

            page.classList.remove("active");

        });


        const page =
            document.getElementById(pageId);


        if (page) {

            page.classList.add("active");

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }


        navMenu.classList.remove("open");


        mobileMenuBtn.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    /* =====================================
       NOTIFICATION
       ===================================== */

    function notify(message) {

        notification.textContent =
            message;


        notification.classList.add("show");


        setTimeout(function () {

            notification.classList.remove(
                "show"
            );

        }, 3000);

    }


    /* =====================================
       REAL-TIME LOCATION VALIDATION
       ===================================== */

    function validateLocation(input) {

        const value =
            input.value.trim();

        const isValid =
            validLocations.some(
                location =>
                    location.toLowerCase() ===
                    value.toLowerCase()
            );

        return isValid;

    }


    function updateLocationValidation(input) {

        const isValid =
            validateLocation(input);

        const wrapper =
            input.parentElement;

        const feedback =
            wrapper.querySelector(
                ".location-feedback"
            );


        if (!feedback) {

            return;

        }


        if (input.value.trim() === "") {

            feedback.innerHTML = "";
            feedback.className =
                "location-feedback";

            input.classList.remove(
                "valid",
                "invalid"
            );

        } else if (isValid) {

            feedback.innerHTML =
                '<i class="fas fa-check-circle"></i> Valid location';

            feedback.className =
                "location-feedback valid-feedback";

            input.classList.remove(
                "invalid"
            );
            input.classList.add("valid");

        } else {

            const suggestions =
                getLocationSuggestions(
                    input.value
                );

            let suggestionText =
                '<i class="fas fa-exclamation-circle"></i> Invalid location';

            if (
                suggestions.length > 0
            ) {

                suggestionText +=
                    '<div class="suggestions">' +
                    suggestions
                        .map(
                            location =>
                                `<span>${location}</span>`
                        )
                        .join("") +
                    "</div>";

            }

            feedback.innerHTML =
                suggestionText;

            feedback.className =
                "location-feedback invalid-feedback";

            input.classList.remove(
                "valid"
            );
            input.classList.add("invalid");

        }

    }


    function getLocationSuggestions(input) {

        const term =
            input.toLowerCase();

        return validLocations
            .filter(
                location =>
                    location
                        .toLowerCase()
                        .includes(term)
            )
            .slice(0, 3);

    }


    function getSuggestionClick(suggestion, inputId) {

        document
            .getElementById(inputId)
            .value = suggestion;

        const input =
            document.getElementById(inputId);

        updateLocationValidation(input);

        // Update validity flags
        if (inputId === "pickupLocation") {

            isPickupValid =
                validateLocation(input);

        } else if (
            inputId === "dropoffLocation"
        ) {

            isDestinationValid =
                validateLocation(input);

        }

    }


    /* =====================================
       UPDATE LOGIN UI
       ===================================== */

    function updateAuthUI() {

        const loggedIn =
            Boolean(currentUser);


        document
            .getElementById("profileBtn")
            .classList.toggle(
                "hidden",
                !loggedIn
            );


        document
            .getElementById("logoutBtn")
            .classList.toggle(
                "hidden",
                !loggedIn
            );


        document
            .getElementById("loginBtn")
            .classList.toggle(
                "hidden",
                loggedIn
            );


        if (loggedIn) {

            document
                .getElementById("profileName")
                .textContent =
                currentUser.name;


            document
                .getElementById("profileEmail")
                .textContent =
                currentUser.email;


            document
                .getElementById("profilePhone")
                .textContent =
                currentUser.phone;

        }

    }


    /* =====================================
       SHOW DRIVERS
       ===================================== */

    function populateDrivers() {

        const list =
            document.getElementById(
                "driversList"
            );


        list.innerHTML = "";


        drivers.forEach(function (driver) {

            const item =
                document.createElement("div");


            item.className =
                "driver-item";


            item.innerHTML = `

                <div class="driver-avatar">

                    <i class="fas fa-user"></i>

                </div>

                <div>

                    <strong>
                        ${driver.name}
                    </strong>

                    <span>
                        ${driver.car}
                        •
                        ${driver.plate}
                    </span>

                    <span>
                        ⭐ ${driver.rating}
                        •
                        ${driver.eta} min away
                    </span>

                </div>

            `;


            list.appendChild(item);

        });

    }


    /* =====================================
       CALCULATE FARE
       ===================================== */

    function calculateFare(
        rideType,
        passengers
    ) {

        const rate =
            fareRates[rideType];


        /*
            Demo distance.

            Later we can connect this
            to Google Maps or another
            routing API.
        */

        const distance =
            15;


        const passengerFee =
            Math.max(
                0,
                passengers - 1
            ) * 1.50;


        const distanceFare =
            distance * rate.perKm;


        const total =
            rate.base +
            distanceFare +
            passengerFee;


        return {

            base: rate.base,

            distance: distanceFare,

            passengerFee: passengerFee,

            total: total,

            distanceKm: distance

        };

    }


    /* =====================================
       FARE PREVIEW
       ===================================== */

    function updateFarePreview() {

        const type =
            document.getElementById(
                "rideType"
            ).value;


        const passengers =
            Number(
                document.getElementById(
                    "passengers"
                ).value
            );


        const fare =
            calculateFare(
                type,
                passengers
            );


        const preview =
            document.getElementById(
                "fareEstimate"
            );


        preview.classList.remove(
            "hidden"
        );


        preview.innerHTML = `

            Estimated Fare:

            <strong>
                GHS ${fare.total.toFixed(2)}
            </strong>

            <br>

            <small>
                Estimated distance:
                ${fare.distanceKm} km
            </small>

        `;

    }


    /* =====================================
       NAVIGATION EVENTS
       ===================================== */

    document
        .getElementById("logoBtn")
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showPage("homePage");

            }
        );


    document
        .getElementById("homeBtn")
        .addEventListener(
            "click",
            function () {

                showPage("homePage");

            }
        );


    document
        .getElementById("rideBtn")
        .addEventListener(
            "click",
            function () {

                showPage("ridePage");

            }
        );


    document
        .getElementById("rideNowBtn")
        .addEventListener(
            "click",
            function () {

                showPage("ridePage");

            }
        );


    document
        .getElementById("driveBtn")
        .addEventListener(
            "click",
            function () {

                showPage("driverPage");

            }
        );


    document
        .getElementById("becomeDriverBtn")
        .addEventListener(
            "click",
            function () {

                showPage("driverPage");

            }
        );


    document
        .getElementById("loginBtn")
        .addEventListener(
            "click",
            function () {

                showPage("loginPage");

            }
        );


    document
        .getElementById("profileBtn")
        .addEventListener(
            "click",
            function () {

                showPage("profilePage");

                updateProfile();

            }
        );


    /* =====================================
       QUICK BOOKING TO RIDE PAGE
       ===================================== */

    document
        .getElementById("quickBookBtn")
        .addEventListener(
            "click",
            function () {

                const pickup =
                    document
                        .getElementById(
                            "quickPickup"
                        )
                        .value.trim();


                const destination =
                    document
                        .getElementById(
                            "quickDestination"
                        )
                        .value.trim();


                if (!pickup ||
                    !destination) {

                    notify(
                        "Please enter pickup and destination locations."
                    );

                    return;

                }


                if (
                    !validateLocation(
                        document
                            .getElementById(
                                "quickPickup"
                            )
                    )
                ) {

                    notify(
                        "Please enter a valid pickup location."
                    );

                    return;

                }


                if (
                    !validateLocation(
                        document
                            .getElementById(
                                "quickDestination"
                            )
                    )
                ) {

                    notify(
                        "Please enter a valid destination location."
                    );

                    return;

                }


                if (
                    pickup.toLowerCase() ===
                    destination.toLowerCase()
                ) {

                    notify(
                        "Pickup and destination cannot be the same."
                    );

                    return;

                }


                // Transfer values to main ride form
                document
                    .getElementById(
                        "pickupLocation"
                    )
                    .value = pickup;


                document
                    .getElementById(
                        "dropoffLocation"
                    )
                    .value = destination;


                // Update validation for main form
                updateLocationValidation(
                    document.getElementById(
                        "pickupLocation"
                    )
                );

                updateLocationValidation(
                    document.getElementById(
                        "dropoffLocation"
                    )
                );


                // Navigate to ride page
                showPage("ridePage");


                // Show notification
                notify(
                    "Ready to book your ride! Select ride type and confirm."
                );

            }
        );


    /* =====================================
       MOBILE MENU
       ===================================== */

    mobileMenuBtn.addEventListener(
        "click",
        function () {

            navMenu.classList.toggle(
                "open"
            );

        }
    );


    /* =====================================
       SIGN UP
       ===================================== */

    document
        .getElementById("signupForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById(
                            "signupName"
                        )
                        .value.trim();


                const email =
                    document
                        .getElementById(
                            "signupEmail"
                        )
                        .value.trim();


                const phone =
                    document
                        .getElementById(
                            "signupPhone"
                        )
                        .value.trim();


                const password =
                    document
                        .getElementById(
                            "signupPassword"
                        )
                        .value;


                const accountType =
                    document
                        .getElementById(
                            "accountType"
                        )
                        .value;


                if (password.length < 6) {

                    notify(
                        "Password must be at least 6 characters."
                    );

                    return;

                }


                currentUser = {

                    name: name,

                    email: email,

                    phone: phone,

                    accountType: accountType

                };


                localStorage.setItem(

                    "louiseUser",

                    JSON.stringify(
                        currentUser
                    )

                );


                updateAuthUI();


                this.reset();


                notify(
                    "Account created successfully!"
                );


                if (
                    accountType ===
                    "driver"
                ) {

                    showPage(
                        "driverPage"
                    );

                } else {

                    showPage(
                        "ridePage"
                    );

                }

            }
        );


    /* =====================================
       LOGIN
       ===================================== */

    document
        .getElementById("loginForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        .value.trim();


                const password =
                    document
                        .getElementById(
                            "loginPassword"
                        )
                        .value;


                if (!email || !password) {

                    notify(
                        "Please complete all fields."
                    );

                    return;

                }


                currentUser = {

                    name:
                        "Louise Transport User",

                    email: email,

                    phone:
                        "Not provided"

                };


                localStorage.setItem(

                    "louiseUser",

                    JSON.stringify(
                        currentUser
                    )

                );


                updateAuthUI();


                this.reset();


                notify(
                    "Login successful!"
                );


                showPage("homePage");

            }
        );


    /* =====================================
       SWITCH LOGIN / SIGNUP
       ===================================== */

    document
        .getElementById(
            "switchToSignup"
        )
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showPage(
                    "signupPage"
                );

            }
        );


    document
        .getElementById(
            "switchToLogin"
        )
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showPage(
                    "loginPage"
                );

            }
        );


    /* =====================================
       FARE INPUT
       ===================================== */

    document
        .getElementById("rideType")
        .addEventListener(
            "change",
            updateFarePreview
        );


    document
        .getElementById("passengers")
        .addEventListener(
            "input",
            updateFarePreview
        );


    /* =====================================
       REQUEST RIDE
       ===================================== */

    document
        .getElementById("rideForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const pickup =
                    document
                        .getElementById(
                            "pickupLocation"
                        )
                        .value.trim();


                const destination =
                    document
                        .getElementById(
                            "dropoffLocation"
                        )
                        .value.trim();


                const rideType =
                    document
                        .getElementById(
                            "rideType"
                        )
                        .value;


                const passengers =
                    Number(
                        document
                            .getElementById(
                                "passengers"
                            )
                            .value
                    );


                if (!pickup ||
                    !destination) {

                    notify(
                        "Please enter pickup and destination."
                    );

                    return;

                }


                if (
                    !validateLocation(
                        document
                            .getElementById(
                                "pickupLocation"
                            )
                    )
                ) {

                    notify(
                        "Please enter a valid pickup location."
                    );

                    return;

                }


                if (
                    !validateLocation(
                        document
                            .getElementById(
                                "dropoffLocation"
                            )
                    )
                ) {

                    notify(
                        "Please enter a valid destination location."
                    );

                    return;

                }


                if (
                    pickup.toLowerCase() ===
                    destination.toLowerCase()
                ) {

                    notify(
                        "Pickup and destination cannot be the same."
                    );

                    return;

                }


                const fare =
                    calculateFare(
                        rideType,
                        passengers
                    );


                currentRide = {

                    pickup: pickup,

                    destination:
                        destination,

                    rideType: rideType,

                    passengers:
                        passengers,

                    fare: fare.total

                };


                localStorage.setItem(

                    "louiseCurrentRide",

                    JSON.stringify(
                        currentRide
                    )

                );


                /* ACTIVE RIDE DATA */

                document
                    .getElementById(
                        "activePickup"
                    )
                    .textContent =
                    pickup;


                document
                    .getElementById(
                        "activeDropoff"
                    )
                    .textContent =
                    destination;


                document
                    .getElementById(
                        "estimatedFare"
                    )
                    .textContent =
                    `GHS ${fare.total.toFixed(2)}`;


                /* PAYMENT */

                document
                    .getElementById(
                        "baseFare"
                    )
                    .textContent =
                    `GHS ${fare.base.toFixed(2)}`;


                document
                    .getElementById(
                        "distanceFare"
                    )
                    .textContent =
                    `GHS ${fare.distance.toFixed(2)}`;


                document
                    .getElementById(
                        "totalAmount"
                    )
                    .textContent =
                    `GHS ${fare.total.toFixed(2)}`;


                notify(
                    "Finding a driver..."
                );


                setTimeout(
                    function () {

                        showPage(
                            "activeRidePage"
                        );


                        notify(
                            "Driver found! Your driver is on the way."
                        );

                    },
                    1500
                );

            }
        );


    /* =====================================
       REAL-TIME LOCATION VALIDATION LISTENERS
       ===================================== */

    document
        .getElementById(
            "pickupLocation"
        )
        .addEventListener(
            "input",
            function () {

                updateLocationValidation(
                    this
                );

                isPickupValid =
                    validateLocation(
                        this
                    );

            }
        );


    document
        .getElementById(
            "dropoffLocation"
        )
        .addEventListener(
            "input",
            function () {

                updateLocationValidation(
                    this
                );

                isDestinationValid =
                    validateLocation(
                        this
                    );

            }
        );


    document
        .getElementById(
            "quickPickup"
        )
        .addEventListener(
            "input",
            function () {

                updateLocationValidation(
                    this
                );

            }
        );


    document
        .getElementById(
            "quickDestination"
        )
        .addEventListener(
            "input",
            function () {

                updateLocationValidation(
                    this
                );

            }
        );


    /* =====================================
       CANCEL RIDE
       ===================================== */

    document
        .getElementById(
            "cancelRideBtn"
        )
        .addEventListener(
            "click",
            function () {

                const confirmCancel =
                    confirm(
                        "Are you sure you want to cancel this ride?"
                    );


                if (!confirmCancel) {

                    return;

                }


                currentRide = null;


                localStorage.removeItem(
                    "louiseCurrentRide"
                );


                notify(
                    "Ride cancelled."
                );


                showPage(
                    "homePage"
                );

            }
        );


    /* =====================================
       PAYMENT PAGE
       ===================================== */

    document
        .getElementById(
            "goPaymentBtn"
        )
        .addEventListener(
            "click",
            function () {

                showPage(
                    "paymentPage"
                );

            }
        );


    /* =====================================
       PAYMENT METHOD
       ===================================== */

    document
        .getElementById(
            "paymentMethod"
        )
        .addEventListener(
            "change",
            function () {

                const momoFields =
                    document.getElementById(
                        "momoFields"
                    );


                if (
                    this.value === "momo"
                ) {

                    momoFields.classList.remove(
                        "hidden"
                    );

                } else {

                    momoFields.classList.add(
                        "hidden"
                    );

                }

            }
        );


    /* =====================================
       COMPLETE PAYMENT
       ===================================== */

    document
        .getElementById(
            "paymentForm"
        )
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                if (!currentRide) {

                    notify(
                        "No active ride found."
                    );

                    return;

                }


                rideHistory.push({

                    pickup:
                        currentRide.pickup,

                    destination:
                        currentRide.destination,

                    fare:
                        currentRide.fare,

                    date:
                        new Date()
                            .toLocaleString()

                });


                localStorage.setItem(

                    "louiseRideHistory",

                    JSON.stringify(
                        rideHistory
                    )

                );


                document
                    .getElementById(
                        "ratingSection"
                    )
                    .classList.remove(
                        "hidden"
                    );


                notify(
                    "Payment completed successfully!"
                );

            }
        );


    /* =====================================
       DRIVER ONLINE
       ===================================== */

    document
        .getElementById(
            "goOnlineBtn"
        )
        .addEventListener(
            "click",
            function () {

                const status =
                    document.getElementById(
                        "driverStatus"
                    );


                status.textContent =
                    "Online";


                status.className =
                    "status-online";


                this.classList.add(
                    "hidden"
                );


                document
                    .getElementById(
                        "goOfflineBtn"
                    )
                    .classList.remove(
                        "hidden"
                    );


                notify(
                    "You are now online."
                );

            }
        );


    /* =====================================
       DRIVER OFFLINE
       ===================================== */

    document
        .getElementById(
            "goOfflineBtn"
        )
        .addEventListener(
            "click",
            function () {

                const status =
                    document.getElementById(
                        "driverStatus"
                    );


                status.textContent =
                    "Offline";


                status.className =
                    "status-offline";


                this.classList.add(
                    "hidden"
                );


                document
                    .getElementById(
                        "goOnlineBtn"
                    )
                    .classList.remove(
                        "hidden"
                    );


                notify(
                    "You are now offline."
                );

            }
        );


    /* =====================================
       CALL DRIVER
       ===================================== */

    document
        .getElementById(
            "callDriverBtn"
        )
        .addEventListener(
            "click",
            function () {

                notify(
                    "Calling driver..."
                );

            }
        );


    /* =====================================
       RATINGS
       ===================================== */

    document
        .querySelectorAll(
            ".rating-star"
        )
        .forEach(
            function (star) {

                star.addEventListener(
                    "click",
                    function () {

                        selectedRating =
                            Number(
                                this.dataset.rating
                            );


                        document
                            .querySelectorAll(
                                ".rating-star"
                            )
                            .forEach(
                                function (
                                    item
                                ) {

                                    item.classList.toggle(

                                        "selected",

                                        Number(
                                            item.dataset.rating
                                        ) <=
                                        selectedRating

                                    );

                                }
                            );

                    }
                );

            }
        );


    /* =====================================
       SUBMIT RATING
       ===================================== */

    document
        .getElementById(
            "submitRatingBtn"
        )
        .addEventListener(
            "click",
            function () {

                if (
                    selectedRating === 0
                ) {

                    notify(
                        "Please select a rating."
                    );

                    return;

                }


                notify(
                    `Thank you! You rated your driver ${selectedRating} stars.`
                );


                showPage(
                    "profilePage"
                );


                updateProfile();

            }
        );


    /* =====================================
       PROFILE
       ===================================== */

    function updateProfile() {

        if (!currentUser) {

            return;

        }


        document
            .getElementById(
                "profileName"
            )
            .textContent =
            currentUser.name;


        document
            .getElementById(
                "displayName"
            )
            .textContent =
            currentUser.name;


        document
            .getElementById(
                "profileEmail"
            )
            .textContent =
            currentUser.email;


        document
            .getElementById(
                "displayEmail"
            )
            .textContent =
            currentUser.email;


        document
            .getElementById(
                "profilePhone"
            )
            .textContent =
            currentUser.phone;


        document
            .getElementById(
                "displayPhone"
            )
            .textContent =
            currentUser.phone;


        document
            .getElementById(
                "totalRides"
            )
            .textContent =
            rideHistory.length;


        document
            .getElementById(
                "totalRidesStats"
            )
            .textContent =
            rideHistory.length;


        const totalSpent =
            rideHistory.reduce(

                function (
                    total,
                    ride
                ) {

                    return total +
                        Number(
                            ride.fare
                        );

                },

                0

            );


        document
            .getElementById(
                "totalSpent"
            )
            .textContent =
            `GHS ${totalSpent.toFixed(2)}`;


        document
            .getElementById(
                "spentStats"
            )
            .textContent =
            `GHS ${totalSpent.toFixed(2)}`;


        displayRideHistory();

    }


    /* =====================================
       PROFILE TABS
       ===================================== */

    // Tab switching
    const profileTabBtns =
        document.querySelectorAll(
            ".profile-tab-btn"
        );

    profileTabBtns.forEach(
        function (btn) {

            btn.addEventListener(
                "click",
                function () {

                    const tabName =
                        this.getAttribute(
                            "data-tab"
                        );


                    // Remove active from all
                    profileTabBtns.forEach(
                        function (b) {

                            b.classList.remove(
                                "active"
                            );

                        }
                    );

                    const contents =
                        document.querySelectorAll(
                            ".profile-tab-content"
                        );

                    contents.forEach(
                        function (content) {

                            content.classList.remove(
                                "active"
                            );

                        }
                    );


                    // Add active to clicked
                    this.classList.add(
                        "active"
                    );

                    document
                        .getElementById(
                            tabName +
                            "-tab"
                        )
                        .classList.add(
                            "active"
                        );

                }
            );

        }
    );


    // Edit Personal Info
    document
        .getElementById(
            "editPersonalBtn"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "personalEditForm"
                    )
                    .classList.remove(
                        "hidden"
                    );

            }
        );


    document
        .getElementById(
            "cancelPersonalBtn"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "personalEditForm"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
        );


    document
        .getElementById(
            "personalEditForm"
        )
        .addEventListener(
            "submit",
            function (e) {

                e.preventDefault();

                currentUser.name =
                    document
                        .getElementById(
                            "editName"
                        ).value;

                currentUser.phone =
                    document
                        .getElementById(
                            "editPhone"
                        ).value;


                localStorage.setItem(
                    "louiseUser",
                    JSON.stringify(
                        currentUser
                    )
                );


                updateProfile();


                notify(
                    "Profile updated successfully!"
                );


                document
                    .getElementById(
                        "personalEditForm"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
        );


    // Add Address
    document
        .getElementById(
            "addAddressBtn"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "addAddressForm"
                    )
                    .classList.remove(
                        "hidden"
                    );

            }
        );


    document
        .getElementById(
            "cancelAddressBtn"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "addAddressForm"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
        );


    document
        .getElementById(
            "addAddressForm"
        )
        .addEventListener(
            "submit",
            function (e) {

                e.preventDefault();

                notify(
                    "Address saved successfully!"
                );


                document
                    .getElementById(
                        "addAddressForm"
                    )
                    .classList.add(
                        "hidden"
                    );

            }
        );


    // Change Password
    document
        .getElementById(
            "changePasswordBtn"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "changePasswordForm"
                    )
                    .style.display =
                    "block";

            }
        );


    document
        .getElementById(
            "cancelPasswordBtn"
        )
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById(
                        "changePasswordForm"
                    )
                    .style.display =
                    "none";

            }
        );


    // Calendar
    document
        .getElementById(
            "viewCalendarBtn"
        )
        .addEventListener(
            "click",
            function () {

                const calendar =
                    document.getElementById(
                        "activityCalendar"
                    );

                if (
                    calendar.style.display ===
                    "none"
                ) {

                    calendar.style.display =
                        "block";

                    generateCalendar(
                        new Date()
                    );

                } else {

                    calendar.style.display =
                        "none";

                }

            }
        );


    function generateCalendar(date) {

        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay =
            new Date(
                year,
                month,
                1
            );

        const lastDay =
            new Date(
                year,
                month + 1,
                0
            );

        const prevLastDay =
            new Date(
                year,
                month,
                0
            );


        const calendarDays =
            document.getElementById(
                "calendarDays"
            );

        calendarDays.innerHTML = "";


        const monthYear =
            new Date(year, month);

        document
            .getElementById(
                "calendarMonth"
            )
            .textContent =
            monthYear.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    year: "numeric"
                }
            );


        // Previous month days
        for (
            let i =
            prevLastDay.getDate() -
            firstDay.getDay() +
            1;
            i <= prevLastDay.getDate();
            i++
        ) {

            const dayEl =
                document.createElement(
                    "div"
                );

            dayEl.className =
                "calendar-day other-month";

            dayEl.textContent = i;

            calendarDays.appendChild(
                dayEl
            );

        }


        // Current month days
        for (
            let i = 1;
            i <= lastDay.getDate();
            i++
        ) {

            const dayEl =
                document.createElement(
                    "div"
                );

            dayEl.className =
                "calendar-day";

            dayEl.textContent = i;


            const dateStr =
                `${year}-${String(
                    month + 1
                ).padStart(2, "0")}-${String(
                    i
                ).padStart(2, "0")}`;


            // Check if has ride
            const hasRide =
                rideHistory.some(
                    function (ride) {

                        return ride.date ===
                            dateStr;

                    }
                );

            if (hasRide) {

                dayEl.classList.add(
                    "has-ride"
                );

            }


            // Highlight today
            const today = new Date();

            if (
                i === today.getDate() &&
                month ===
                today.getMonth() &&
                year ===
                today.getFullYear()
            ) {

                dayEl.classList.add(
                    "today"
                );

            }


            calendarDays.appendChild(
                dayEl
            );

        }


        // Next month days
        for (
            let i = 1;
            i <= (42 - lastDay.getDate() -
                firstDay.getDay());
            i++
        ) {

            const dayEl =
                document.createElement(
                    "div"
                );

            dayEl.className =
                "calendar-day other-month";

            dayEl.textContent = i;

            calendarDays.appendChild(
                dayEl
            );

        }

    }


    document
        .getElementById(
            "prevMonth"
        )
        .addEventListener(
            "click",
            function () {

                const monthText =
                    document
                        .getElementById(
                            "calendarMonth"
                        ).textContent;

                const date = new Date(
                    monthText
                );

                date.setMonth(
                    date.getMonth() - 1
                );

                generateCalendar(date);

            }
        );


    document
        .getElementById(
            "nextMonth"
        )
        .addEventListener(
            "click",
            function () {

                const monthText =
                    document
                        .getElementById(
                            "calendarMonth"
                        ).textContent;

                const date = new Date(
                    monthText
                );

                date.setMonth(
                    date.getMonth() + 1
                );

                generateCalendar(date);

            }
        );


    // Language selector
    document
        .getElementById(
            "languageSelect"
        )
        .addEventListener(
            "change",
            function () {

                notify(
                    "Language changed to " +
                    this.options[
                        this.selectedIndex
                    ].text

                );

            }
        );


    /* =====================================
       RIDE HISTORY
       ===================================== */

    function displayRideHistory() {

        const history =
            document.getElementById(
                "rideHistoryList"
            );


        if (
            rideHistory.length === 0
        ) {

            history.innerHTML =
                "<p>No rides yet.</p>";

            return;

        }


        history.innerHTML = "";


        rideHistory.forEach(
            function (ride) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "history-item";


                item.innerHTML = `

                    <div>

                        <strong>
                            ${ride.pickup}
                        </strong>

                        <small>
                            To:
                            ${ride.destination}
                        </small>

                        <small>
                            ${ride.date}
                        </small>

                    </div>

                    <strong>
                        GHS
                        ${Number(
                            ride.fare
                        ).toFixed(2)}
                    </strong>

                `;


                history.appendChild(
                    item
                );

            }
        );

    }


    /* =====================================
       EDIT PROFILE
       ===================================== */

    document
        .getElementById(
            "editProfileBtn"
        )
        .addEventListener(
            "click",
            function () {

                if (!currentUser) {

                    return;

                }


                const newName =
                    prompt(
                        "Enter your new name:",
                        currentUser.name
                    );


                if (
                    newName &&
                    newName.trim()
                ) {

                    currentUser.name =
                        newName.trim();


                    localStorage.setItem(

                        "louiseUser",

                        JSON.stringify(
                            currentUser
                        )

                    );


                    updateAuthUI();


                    updateProfile();


                    notify(
                        "Profile updated successfully."
                    );

                }

            }
        );


    /* =====================================
       DELETE ACCOUNT
       ===================================== */

    document
        .getElementById(
            "deleteAccountBtn"
        )
        .addEventListener(
            "click",
            function () {

                const confirmDelete =
                    confirm(
                        "Are you sure you want to delete your account?"
                    );


                if (!confirmDelete) {

                    return;

                }


                localStorage.removeItem(
                    "louiseUser"
                );


                localStorage.removeItem(
                    "louiseRideHistory"
                );


                localStorage.removeItem(
                    "louiseCurrentRide"
                );


                currentUser = null;

                rideHistory = [];

                currentRide = null;


                updateAuthUI();


                showPage(
                    "homePage"
                );


                notify(
                    "Account deleted."
                );

            }
        );


    /* =====================================
       CITY SELECTION
       ===================================== */

    document
        .querySelectorAll(
            ".city-card"
        )
        .forEach(
            function (city) {

                city.addEventListener(
                    "click",
                    function () {

                        const selectedCity =
                            this.dataset.city;


                        document
                            .getElementById(
                                "pickupLocation"
                            )
                            .value =
                            selectedCity;


                        showPage(
                            "ridePage"
                        );


                        notify(
                            `${selectedCity} selected as pickup location.`
                        );

                    }
                );

            }
        );


    /* =====================================
       INITIALIZE WEBSITE
       ===================================== */

    populateDrivers();

    updateAuthUI();

    updateFarePreview();

    updateProfile();

    showPage("homePage");

});