import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { firebaseConfig, googleMapsAPIKey } from './config.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let map;
let userList = {};
let currentUser = null;
let watchId = null; // Declare watchId at the top
let lastPosition = {}; // Track last position to detect movement

// Load Google Maps
function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsAPIKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Initialize Google Map
window.initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 2,
        styles: [
            { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
            { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
            { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
            { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#454545" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
        ]
    });
}

// Username setup
document.getElementById('setUsernameButton').addEventListener('click', function () {
    const username = document.getElementById('usernameField').value.trim();
    if (username) {
        currentUser = username;
        userList[username] = { lat: null, lng: null };
        document.getElementById('usernameOverlay').style.display = 'none';
        document.getElementById('welcomeMessage').innerText = `Welcome, ${currentUser}!`;
        document.getElementById('gpsToggle').style.display = 'block';
        loadGoogleMaps();
        updateUserList();
    }
});

// GPS toggle
document.getElementById('gpsToggle').addEventListener('click', function () {
    if (this.classList.contains('active')) {
        navigator.geolocation.clearWatch(watchId);
        this.classList.remove('active');
        this.innerText = 'Enable GPS';
    } else {
        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    userList[currentUser] = { lat: latitude, lng: longitude };
                    updateDatabase();
                    updateUserList();

                    // Alert if user is moving
                    if (lastPosition[currentUser] && 
                        (lastPosition[currentUser].lat !== latitude || lastPosition[currentUser].lng !== longitude)) {
                        alert(`${currentUser} is moving!`);
                    }
                    lastPosition[currentUser] = { lat: latitude, lng: longitude }; // Update last position
                },
                error => {
                    console.error("Geolocation error: ", error);
                    alert("Unable to access your location. Please enable location services.");
                },
                { enableHighAccuracy: true }
            );
            this.classList.add('active');
            this.innerText = 'Disable GPS';
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }
});

// Update Firebase database
function updateDatabase() {
    const userRef = ref(database, `users/${currentUser}`);
    set(userRef, userList[currentUser]).catch((error) => {
        console.error('Error updating database:', error);
    });
}

// Update user list display
function updateUserList() {
    const userListContainer = document.getElementById('userList');
    userListContainer.innerHTML = '';
    Object.keys(userList).forEach(username => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user';
        userDiv.innerText = `${username} - Lat: ${userList[username].lat}, Lng: ${userList[username].lng}`;
        userListContainer.appendChild(userDiv);
    });
}

// Listen for user updates from Firebase
const usersRef = ref(database, 'users');
onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        userList = data;
        updateUserList();
    }
});
