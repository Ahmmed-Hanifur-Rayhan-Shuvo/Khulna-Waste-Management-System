// Map Management
let map = null;
let markers = [];
let routeLayer = null;

// Initialize Map
function initMap(containerId = 'map', center = [22.8456, 89.5400], zoom = 12) {
    if (!map) {
        map = L.map(containerId).setView(center, zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
    }
    return map;
}

// Add Markers for All Locations
function addLocationMarkers() {
    clearMarkers();
    
    KHULNA_LOCATIONS.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng]).addTo(map);
        
        // Customize marker icon based on location type
        const icon = L.divIcon({
            className: `marker-${loc.type}`,
            html: `<i class="fas fa-map-marker-alt" style="color: ${getMarkerColor(loc.type)}; font-size: 24px;"></i>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });
        
        marker.setIcon(icon);
        
        marker.bindPopup(`
            <b>${loc.name}</b><br>
            Type: ${loc.type}<br>
            <button onclick="showLocationDetails('${loc.name}')" class="popup-btn">View Details</button>
        `);
        
        markers.push(marker);
    });
}

// Get Marker Color based on type
function getMarkerColor(type) {
    switch(type) {
        case 'educational': return '#1e5e80';
        case 'medical': return '#28a745';
        case 'industrial': return '#dc3545';
        default: return '#ffc107';
    }
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
}

// Draw Route on Map
function drawRoute(path, color = '#1e5e80') {
    // Clear previous route
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    // Get coordinates for path
    const points = path.map(locName => {
        const loc = KHULNA_LOCATIONS.find(l => l.name === locName);
        return [loc.lat, loc.lng];
    });

    // Create polyline
    routeLayer = L.polyline(points, {
        color: color,
        weight: 5,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(map);

    // Fit map to route bounds
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

    // Add markers for start and end
    if (points.length > 0) {
        L.marker(points[0], {
            icon: L.divIcon({
                className: 'start-marker',
                html: '<i class="fas fa-play-circle" style="color: #28a745; font-size: 30px;"></i>',
                iconSize: [30, 30]
            })
        }).addTo(map).bindPopup('Start Point');

        L.marker(points[points.length - 1], {
            icon: L.divIcon({
                className: 'end-marker',
                html: '<i class="fas fa-stop-circle" style="color: #dc3545; font-size: 30px;"></i>',
                iconSize: [30, 30]
            })
        }).addTo(map).bindPopup('End Point');
    }
}

// Find and display route between two locations
function findAndDisplayRoute(from, to) {
    const result = routeGraph.findShortestPath(from, to);
    
    if (result) {
        drawRoute(result.path);
        return result;
    } else {
        showNotification('No route found between these locations', 'error');
        return null;
    }
}

// Show location details
function showLocationDetails(locationName) {
    const loc = KHULNA_LOCATIONS.find(l => l.name === locationName);
    if (loc) {
        showNotification(`
            📍 ${loc.name}\n
            Type: ${loc.type}\n
            Coordinates: ${loc.lat}, ${loc.lng}
        `, 'info');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initMap, addLocationMarkers, findAndDisplayRoute, drawRoute };
}