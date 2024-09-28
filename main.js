// Obfuscated code (simulated)

import { initializeApp as _0x3d91 } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase as _0x3d92, ref as _0x3d93, set as _0x3d94, onValue as _0x3d95 } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { firebaseConfig as _0x3d96, googleMapsAPIKey as _0x3d97 } from './config.js';

const _0x3d98 = _0x3d91(_0x3d96);
const _0x3d99 = _0x3d92(_0x3d98);

let _0x3d9a; // map variable
let _0x3d9b = {}; // userList
let _0x3d9c = null; // currentUser
let _0x3d9d = null; // watchId
let _0x3d9e = {}; // lastPosition

// Load Google Maps
function _0x3d9f() {
    const _0x3da0 = document.createElement('script');
    _0x3da0.src = `https://maps.googleapis.com/maps/api/js?key=${_0x3d97}&callback=_0x3db0`;
    _0x3da0.async = true;
    _0x3da0.defer = true;
    document.head.appendChild(_0x3da0);
}

// Initialize Google Map
window._0x3db0 = function () {
    _0x3d9a = new google.maps.Map(document.getElementById('map'), {
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
    const _0x3db1 = document.getElementById('usernameField').value.trim();
    if (_0x3db1) {
        _0x3d9c = _0x3db1;
        _0x3d9b[_0x3db1] = { lat: null, lng: null };
        document.getElementById('usernameOverlay').style.display = 'none';
        document.getElementById('welcomeMessage').innerText = `Welcome, ${_0x3d9c}!`;
        document.getElementById('gpsToggle').style.display = 'block';
        _0x3d9f();
        _0x3db2();
    }
});

// GPS toggle
document.getElementById('gpsToggle').addEventListener('click', function () {
    if (this.classList.contains('active')) {
        navigator.geolocation.clearWatch(_0x3d9d);
        this.classList.remove('active');
        this.innerText = 'Enable GPS';
    } else {
        if ("geolocation" in navigator) {
            _0x3d9d = navigator.geolocation.watchPosition(
                position => {
                    const { latitude: _0x3db3, longitude: _0x3db4 } = position.coords;
                    _0x3d9b[_0x3d9c] = { lat: _0x3db3, lng: _0x3db4 };
                    _0x3db5();
                    _0x3db2();

                    // Alert if user is moving
                    if (_0x3d9e[_0x3d9c] && 
                        (_0x3d9e[_0x3d9c].lat !== _0x3db3 || _0x3d9e[_0x3d9c].lng !== _0x3db4)) {
                        alert(`${_0x3d9c} is moving!`);
                    }
                    _0x3d9e[_0x3d9c] = { lat: _0x3db3, lng: _0x3db4 }; // Update last position
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
function _0x3db5() {
    const _0x3db6 = _0x3d93(_0x99, `users/${_0x3d9c}`);
    _0x3d94(_0x3db6, _0x3d9b[_0x3d9c]).catch((error) => {
        console.error('Error updating database:', error);
    });
}

// Update user list display
function _0x3db2() {
    const _0x3db7 = document.getElementById('userList');
    _0x3db7.innerHTML = '';
    Object.keys(_0x3d9b).forEach(_0x3db8 => {
        const _0x3db9 = document.createElement('div');
        _0x3db9.className = 'user';
        _0x3db9.innerText = `${_0x3db8} - Lat: ${_0x3d9b[_0x3db8].lat}, Lng: ${_0x3d9b[_0x3db8].lng}`;
        _0x3db7.appendChild(_0x3db9);
    });
}

// Listen for user updates from Firebase
const _0x3dba = _0x3d93(_0x99, 'users');
_onValue(_0x3dba, (snapshot) => {
    const _0x3dbc = snapshot.val();
    if (_0x3dbc) {
        _0x3d9b = _0x3dbc;
        _0x3db2();
    }
});
