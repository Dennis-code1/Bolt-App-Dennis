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
                "profileEmail"
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
                "totalRides"
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


        displayRideHistory();

    }


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