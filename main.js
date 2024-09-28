import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { firebaseConfig, googleMapsAPIKey } from './config.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let map;
let userList = {};
let currentUser = null;
let watchId = null; // Declare watchId at the top
let previousPosition = null; // Variable to store the previous position

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
            { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9E9E9E" }] },
            { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
            { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
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

                    // Check if the user has moved significantly
                    if (previousPosition) {
                        const distanceMoved = calculateDistance(
                            previousPosition.lat,
                            previousPosition.lng,
                            latitude,
                            longitude
                        );
                        if (distanceMoved > 0.1) { // threshold in kilometers
                            alert(`${currentUser} is moving!`);
                        }
                    }

                    previousPosition = { lat: latitude, lng: longitude }; // Update previous position
                    updateDatabase();
                    updateUserList();
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
        userDiv.innerText = username;

        if (userList[username].lat && userList[username].lng) {
            const latLng = { lat: userList[username].lat, lng: userList[username].lng };
            const marker = new google.maps.Marker({
                position: latLng,
                map: map,
                title: username,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#00FF00',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: 'white'
                }
            });
            userListContainer.appendChild(userDiv);
        }
    });
}

// Function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in kilometers
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
