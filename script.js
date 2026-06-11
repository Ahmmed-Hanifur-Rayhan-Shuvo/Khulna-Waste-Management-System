// ============================================================================
// ECOCLEAN - Complete Smart Waste Management System
// Version: 2.0 | Language: JavaScript | Database: localStorage
// ============================================================================

// ------------------------------------------
// 1. GLOBAL VARIABLES DECLARATION
// ------------------------------------------
let currentUser = null;          // Currently logged in user data
let currentPage = 'home';        // Current page name
let iotInt = null;               // Interval ID for IoT updates

// ------------------------------------------
// 2. DOM ELEMENTS SELECTION
// ------------------------------------------
const splash = document.getElementById('splash');                     // Splash screen element
const loginModal = document.getElementById('loginModal');             // Login modal element
const registerModal = document.getElementById('registerModal');       // Register modal element
const mainApp = document.getElementById('mainApp');                   // Main app container
const contentArea = document.getElementById('contentArea');           // Content display area
const userName = document.getElementById('userName');                 // User name display element
const userTypeSpan = document.getElementById('userType');             // User type display element
const logoutBtn = document.getElementById('logoutBtn');               // Logout button
const navMenu = document.getElementById('navMenu');                   // Desktop navigation menu
const mobileMenu = document.getElementById('mobileMenu');             // Mobile navigation menu

// ------------------------------------------
// 3. NOTIFICATION FUNCTION - Display messages to user
// ------------------------------------------
function showNotification(msg, type) {
    // Create notification div
    const n = document.createElement('div');
    n.className = `notification notification-${type || 'info'}`;
    
    // Icon mapping based on notification type
    const icons = {
        success: 'fa-check-circle',      // Success icon
        error: 'fa-exclamation-circle',  // Error icon
        info: 'fa-info-circle',          // Info icon
        warning: 'fa-exclamation-triangle' // Warning icon
    };
    
    // Set notification HTML with icon and message
    n.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    
    // Add notification to page
    document.body.appendChild(n);
    
    // Auto-remove after 3 seconds
    setTimeout(() => n.remove(), 3000);
}

// ============================================================================
// AI SCANNER MODULE - YOLO + OpenCV based waste detection
// ============================================================================

// ------------------------------------------
// 4. SIMULATE YOLO OBJECT DETECTION
// ------------------------------------------
async function performYOLODetection() {
    // Returns a promise that resolves after 800ms (simulating AI processing)
    return new Promise(r => {
        setTimeout(() => {
            // Get all waste categories
            let items = Object.keys(wasteCategories);
            // Pick random waste item
            let ri = items[Math.floor(Math.random() * items.length)];
            let w = wasteCategories[ri];
            // Generate random confidence score (85-99%)
            let c = (85 + Math.random() * 14).toFixed(1);
            
            // Return detection result
            r({
                item: w.name,           // Waste item name
                category: w.category,   // Category (Plastic, Glass, etc.)
                recyclable: w.recyclable, // Is it recyclable?
                disposal: w.disposal,   // Disposal instructions
                co2Saved: w.co2Saved,   // CO2 saved if recycled
                confidence: c,          // Detection confidence percentage
                edges: Math.floor(500 + Math.random() * 1000),  // OpenCV edge detection
                contours: Math.floor(10 + Math.random() * 30)    // OpenCV contour detection
            });
        }, 800);
    });
}

// ------------------------------------------
// 5. MAIN SCAN FUNCTION - Process scanned waste
// ------------------------------------------
async function scanWaste() {
    // Get result display element
    let rd = document.getElementById('scanResult');
    rd.style.display = 'block';
    rd.innerHTML = '<div class="loader"></div><p>🧠 YOLO + OpenCV Processing...</p>';
    
    // Perform AI detection
    let r = await performYOLODetection();
    
    // If user is citizen, add eco points
    if (currentUser?.type === 'citizen') {
        let p = parseInt(localStorage.getItem('ecoPoints') || '0');
        p += r.recyclable ? 10 : 2;  // 10 points for recyclable, 2 for non-recyclable
        localStorage.setItem('ecoPoints', p);
    }
    
    // Save to scan history
    let sh = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    sh.unshift({ ...r, timestamp: new Date().toISOString() });
    localStorage.setItem('scanHistory', JSON.stringify(sh.slice(0, 20)));  // Keep last 20 scans
    
    // Save to database
    db.insert('scans', {
        user_id: currentUser?.id || 1,
        item: r.item,
        category: r.category,
        recyclable: r.recyclable ? 1 : 0,
        confidence: r.confidence,
        timestamp: new Date().toISOString()
    });
    
    // Display scan result
    rd.innerHTML = `
        <div style="text-align:center">
            <i class="fas fa-robot" style="font-size:3rem;color:${r.recyclable ? '#28a745' : '#dc3545'}"></i>
            <h3>${r.item}</h3>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Category</div><div class="stat-number">${r.category}</div></div>
                <div class="stat-card"><div class="stat-label">Recyclable</div><div class="stat-number">${r.recyclable ? 'Yes' : 'No'}</div></div>
                <div class="stat-card"><div class="stat-label">Disposal</div><div class="stat-number">${r.disposal}</div></div>
                <div class="stat-card"><div class="stat-label">CO₂ Saved</div><div class="stat-number">${r.co2Saved} kg</div></div>
            </div>
            <div class="progress-fill"><div style="width:${r.confidence}%;background:#1e5e80;padding:8px;color:white">Confidence: ${r.confidence}%</div></div>
            <div style="padding:10px;background:#e9ecef;border-radius:10px"><small>🔬 OpenCV: ${r.edges} edges | ${r.contours} contours</small></div>
            <button class="btn btn-success" style="margin-top:1rem" onclick="showNotification('Saved!','success')">Save</button>
        </div>
    `;
    
    // Show notification
    showNotification(`${r.item} detected!`, r.recyclable ? 'success' : 'warning');
}

// ------------------------------------------
// 6. OPEN CAMERA SCANNER
// ------------------------------------------
function openScanner() {
    // Show scanner modal
    document.getElementById('scannerModal').classList.add('active');
    
    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => document.getElementById('video').srcObject = s)
        .catch(() => showNotification('Camera error', 'error'));
}

// ------------------------------------------
// 7. CAPTURE AND SCAN
// ------------------------------------------
function captureAndScan() {
    scanWaste();  // Process the captured image
}

// ------------------------------------------
// 8. UPLOAD AND SCAN
// ------------------------------------------
function uploadAndScan() {
    // Trigger file input click
    document.getElementById('fileInput').click();
    // When file selected, scan it
    document.getElementById('fileInput').onchange = () => scanWaste();
}

// ============================================================================
// ESP32 IOT MODULE - Smart bin monitoring with sensors
// ============================================================================

// ------------------------------------------
// 9. SIMULATE IOT SENSOR DATA (Blynk Platform)
// ------------------------------------------
async function fetchBlynkFillLevel() { return Math.floor(Math.random() * 101); }      // Random fill level 0-100%
async function fetchBlynkDistance() { return (Math.random() * 200).toFixed(1); }     // Random distance in cm
async function fetchBlynkServo() { return Math.random() > 0.5 ? 1 : 0; }             // Random servo status

// ------------------------------------------
// 10. UPDATE IOT BIN DATA
// ------------------------------------------
async function updateIoTBin() {
    // Fetch sensor data
    let fl = await fetchBlynkFillLevel();
    let dist = await fetchBlynkDistance();
    let serv = await fetchBlynkServo();
    
    // Find IoT enabled bin
    let iot = db.selectAll('smart_bins').find(b => b.is_iot === 1);
    
    // Update bin if found
    if (iot && fl !== null) {
        // Determine status based on fill level
        let status = fl >= 85 ? 'critical' : (fl >= 70 ? 'warning' : 'normal');
        
        // Update database
        db.update('smart_bins', iot.id, {
            fill_level: fl,
            status: status,
            last_updated: new Date().toISOString()
        });
        
        // Refresh UI if on relevant pages
        if (currentPage === 'citizen-bin-status') loadCitizenBinStatus();
        if (currentPage === 'collector-iot') loadCollectorIoT();
        if (currentPage === 'admin-iot') refreshBinsTable();
    }
}

// ------------------------------------------
// 11. START IOT UPDATES (5 second interval)
// ------------------------------------------
function startIoTUpdates() {
    if (iotInt) clearInterval(iotInt);  // Clear existing interval
    iotInt = setInterval(updateIoTBin, 5000);  // Update every 5 seconds
    updateIoTBin();  // Immediate first update
}

// ------------------------------------------
// 12. STOP IOT UPDATES
// ------------------------------------------
function stopIoTUpdates() {
    if (iotInt) clearInterval(iotInt);
}

// ============================================================================
// SMART BINS MODULE - CRUD operations for bins
// ============================================================================

// ------------------------------------------
// 13. REFRESH BINS TABLE (Admin view)
// ------------------------------------------
function refreshBinsTable() {
    let tb = document.getElementById('binsTable');
    if (tb) {
        // Map each bin to table row HTML
        tb.innerHTML = db.selectAll('smart_bins').map(b => `
            <tr>
                <td>${b.id}</td>
                <td><strong>${b.name}${b.is_iot ? ' <i class="fas fa-microchip"></i>' : ''}</strong></td>
                <td>${b.location}</td>
                <td><div style="width:80px;background:#e9ecef;border-radius:10px"><div style="width:${b.fill_level}%;background:${b.fill_level >= 85 ? 'red' : b.fill_level >= 70 ? 'orange' : 'green'};padding:4px;color:white">${b.fill_level}%</div></div></td>
                <td><span class="badge ${b.status === 'critical' ? 'badge-danger' : b.status === 'warning' ? 'badge-warning' : 'badge-success'}">${b.status}</span></td>
                <td>${b.type}</td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" onclick='editBin(${b.id})' ${b.is_iot ? 'disabled' : ''}>Edit</button>
                    <button class="action-btn delete-btn" onclick='deleteBin(${b.id})' ${b.is_iot ? 'disabled' : ''}>Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

// ------------------------------------------
// 14. ADD NEW BIN
// ------------------------------------------
function addBin(d) {
    // Validate location
    if (!d.lat || !d.lng) {
        showNotification('Select location from map first!', 'error');
        return false;
    }
    // Insert into database
    db.insert('smart_bins', d);
    showNotification('Bin added!', 'success');
    if (currentPage === 'admin-iot') loadAdminIoT();
    return true;
}

// ------------------------------------------
// 15. UPDATE EXISTING BIN
// ------------------------------------------
function updateBin(id, d) {
    db.update('smart_bins', id, d);
    showNotification('Bin updated!', 'success');
    if (currentPage === 'admin-iot') loadAdminIoT();
}

// ------------------------------------------
// 16. DELETE BIN
// ------------------------------------------
function deleteBin(id) {
    if (confirm('Delete this bin?')) {
        db.delete('smart_bins', id);
        showNotification('Deleted!', 'success');
        if (currentPage === 'admin-iot') loadAdminIoT();
    }
}

// ------------------------------------------
// 17. EDIT BIN (Open modal with data)
// ------------------------------------------
function editBin(id) {
    let bin = db.selectOne('smart_bins', 'id', id);
    if (bin) openBinModal(bin);
}

// ------------------------------------------
// 18. OPEN BIN MODAL (Add/Edit)
// ------------------------------------------
function openBinModal(b = null) {
    // Set modal title based on mode
    document.getElementById('binModalTitle').innerText = b ? 'Edit Bin' : 'Add Bin';
    // Populate form fields
    document.getElementById('binName').value = b?.name || '';
    document.getElementById('binLocation').value = b?.location || '';
    document.getElementById('binLat').value = b?.lat || '';
    document.getElementById('binLng').value = b?.lng || '';
    document.getElementById('binFillLevel').value = b?.fill_level || 0;
    document.getElementById('binType').value = b?.type || 'Mixed';
    document.getElementById('binForm').dataset.editId = b?.id || '';
    // Show modal
    document.getElementById('binModal').classList.add('active');
}

// ============================================================================
// CITIZEN MODULE - Regular user functionalities
// ============================================================================

// ------------------------------------------
// 19. LOAD CITIZEN HOME DASHBOARD
// ------------------------------------------
function loadCitizenHome() {
    currentPage = 'citizen-home';
    // Get user statistics
    let myR = db.selectWhere('reports', 'user_id', currentUser.id).length;  // User's reports count
    let eco = localStorage.getItem('ecoPoints') || '0';                     // Eco points
    let sc = JSON.parse(localStorage.getItem('scanHistory') || '[]');       // Scan history
    let bins = db.selectAll('smart_bins');                                   // Total bins
    
    // Render dashboard HTML
    contentArea.innerHTML = `
        <div class="hero-section">
            <h1 class="hero-title">Welcome, ${currentUser.name}! 👋</h1>
            <p class="hero-text">Help us make Khulna cleaner!</p>
            <button class="hero-btn" onclick="openScanner()"><i class="fas fa-brain"></i> AI Scanner</button>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><i class="fas fa-leaf stat-icon"></i><div class="stat-number">${eco}</div><div class="stat-label">Eco Points</div></div>
            <div class="stat-card"><i class="fas fa-camera stat-icon"></i><div class="stat-number">${sc.length}</div><div class="stat-label">AI Scans</div></div>
            <div class="stat-card"><i class="fas fa-file-alt stat-icon"></i><div class="stat-number">${myR}</div><div class="stat-label">My Reports</div></div>
            <div class="stat-card"><i class="fas fa-trash-alt stat-icon"></i><div class="stat-number">${bins.length}</div><div class="stat-label">Smart Bins</div></div>
        </div>
        <div class="features-grid">
            <div class="feature-card" onclick="openScanner()"><i class="fas fa-brain feature-icon"></i><h3>AI Scanner</h3></div>
            <div class="feature-card" onclick="navigateTo('citizen-bin-status')"><i class="fas fa-chart-line feature-icon"></i><h3>Bin Status</h3></div>
            <div class="feature-card" onclick="navigateTo('map')"><i class="fas fa-map feature-icon"></i><h3>City Map</h3></div>
            <div class="feature-card" onclick="navigateTo('report')"><i class="fas fa-flag feature-icon"></i><h3>Report Issue</h3></div>
            <div class="feature-card" onclick="navigateTo('my-reports')"><i class="fas fa-list feature-icon"></i><h3>My Reports</h3></div>
            <div class="feature-card" onclick="navigateTo('recycle-guide')"><i class="fas fa-recycle feature-icon"></i><h3>Recycle Guide</h3></div>
            <div class="feature-card" onclick="navigateTo('gps-track')"><i class="fas fa-location-dot feature-icon"></i><h3>GPS Tracking</h3></div>
        </div>
    `;
}

// ------------------------------------------
// 20. LOAD BIN STATUS PAGE (Citizen view)
// ------------------------------------------
function loadCitizenBinStatus() {
    currentPage = 'citizen-bin-status';
    let bins = db.selectAll('smart_bins');
    
    // Render page with map and bin grid
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title"><i class="fas fa-trash-alt title-icon"></i> Smart Bin Status</h1></div>
        <div class="map-container"><div id="binMap"></div></div>
        <div class="features-grid" id="binsGrid"></div>
    `;
    
    // Initialize map after render
    setTimeout(() => { initMap('binMap'); addBinMarkers(); }, 100);
    
    // Render bin cards
    document.getElementById('binsGrid').innerHTML = bins.map(b => `
        <div class="stat-card">
            <div style="display:flex;justify-content:space-between">
                <h3>${b.name}${b.is_iot ? ' <i class="fas fa-microchip"></i>' : ''}</h3>
                <span class="badge ${b.status === 'critical' ? 'badge-danger' : b.status === 'warning' ? 'badge-warning' : 'badge-success'}">${b.status}</span>
            </div>
            <p><i class="fas fa-map-marker-alt"></i> ${b.location}</p>
            <div class="progress-fill"><div style="width:${b.fill_level}%;background:${b.fill_level >= 85 ? '#dc3545' : b.fill_level >= 70 ? '#ffc107' : '#28a745'};padding:8px;color:white">${b.fill_level}% Full</div></div>
            <p><i class="fas fa-clock"></i> Updated: ${new Date(b.last_updated).toLocaleTimeString()}</p>
            <button class="btn btn-primary btn-sm" onclick="reportBinIssue(${b.id})">Report Issue</button>
        </div>
    `).join('');
}

// ------------------------------------------
// 21. LOAD MAP PAGE
// ------------------------------------------
function loadCitizenMap() {
    contentArea.innerHTML = `<div class="map-container"><div id="map"></div></div>`;
    setTimeout(() => { initMap('map'); addLocationMarkers(); addBinMarkers(); }, 100);
}

// ------------------------------------------
// 22. LOAD RECYCLING GUIDE PAGE
// ------------------------------------------
function loadRecycleGuide() {
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title"><i class="fas fa-recycle title-icon"></i> Recycling Guide</h1></div>
        <div class="table-container">
            <table>
                <thead><tr><th>Item</th><th>Category</th><th>Recyclable</th><th>Instructions</th><th>Disposal</th></tr></thead>
                <tbody>${recyclingItems.map(i => `
                    <tr>
                        <td>${i.item}</td>
                        <td>${i.category}</td>
                        <td><span class="badge badge-success">Yes</span></td>
                        <td>${i.instructions}</td>
                        <td>${i.disposal}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------
// 23. LOAD REPORT FORM PAGE
// ------------------------------------------
function loadReportPage() {
    contentArea.innerHTML = `
        <div class="fine-form">
            <h2>Report Issue</h2>
            <form id="reportForm">
                <div class="form-group"><label>Location</label><input id="reportLocation" class="form-control" required></div>
                <div class="form-group"><label>Type</label><select id="reportType" class="form-control"><option>Household</option><option>Recyclable</option><option>Hazardous</option></select></div>
                <div class="form-group"><label>Description</label><textarea id="reportDesc" class="form-control" rows="3" required></textarea></div>
                <button type="submit" class="btn btn-success btn-block">Submit</button>
            </form>
        </div>
    `;
    
    // Handle form submission
    document.getElementById('reportForm').addEventListener('submit', (e) => {
        e.preventDefault();
        // Save report to database
        db.insert('reports', {
            user_id: currentUser.id,
            user_name: currentUser.name,
            location: document.getElementById('reportLocation').value,
            type: document.getElementById('reportType').value,
            description: document.getElementById('reportDesc').value,
            status: 'pending',
            reported_at: new Date().toISOString(),
            lat: 22.8456,  // Default Khulna coordinates
            lng: 89.5400
        });
        showNotification('Report submitted!', 'success');
        navigateTo('my-reports');
    });
}

// ------------------------------------------
// 24. LOAD MY REPORTS PAGE
// ------------------------------------------
function loadMyReports() {
    let ur = db.selectWhere('reports', 'user_id', currentUser.id);
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title"><i class="fas fa-list title-icon"></i> My Reports</h1></div>
        <div class="table-container">
            <table>
                <thead><tr><th>ID</th><th>Location</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>${ur.map(r => `
                    <tr>
                        <td>#${r.id}</td>
                        <td>${r.location}</td>
                        <td>${r.type}</td>
                        <td class="badge badge-warning">${r.status}</td>
                        <td>${new Date(r.reported_at).toLocaleDateString()}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------
// 25. LOAD GPS TRACKING PAGE
// ------------------------------------------
function loadGPSTracking() {
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title"><i class="fas fa-location-dot title-icon"></i> GPS Tracking</h1></div>
        <div class="map-container" style="height:500px;position:relative"><div id="trackingMap"></div><div id="gpsStatus" class="gps-status">GPS Inactive</div></div>
        <div class="stats-grid"><div class="stat-card"><div class="stat-number" id="nearbyCount">--</div><div class="stat-label">Nearby Bins</div></div></div>
        <div class="features-grid">
            <div class="feature-card" onclick="startGPSTracking()">Start GPS</div>
            <div class="feature-card" onclick="findNearbyBinsGPS()">Find Nearby Bins</div>
        </div>
    `;
    setTimeout(() => { initMap('trackingMap'); addBinMarkers(); }, 100);
}

// ------------------------------------------
// 26. FIND NEARBY BINS USING GPS
// ------------------------------------------
async function findNearbyBinsGPS() {
    if (currentPositionMarker) {
        let lat = currentPositionMarker.getLatLng().lat;
        let lng = currentPositionMarker.getLatLng().lng;
        let nearby = findNearbyBins(lat, lng);
        document.getElementById('nearbyCount').innerHTML = nearby.length;
        showNotification(`Found ${nearby.length} nearby bins!`, 'success');
    } else {
        showNotification('Start GPS first', 'warning');
    }
}

// ------------------------------------------
// 27. REPORT ISSUE WITH SPECIFIC BIN
// ------------------------------------------
function reportBinIssue(bid) {
    let bin = db.selectOne('smart_bins', 'id', bid);
    if (bin) {
        db.insert('reports', {
            user_id: currentUser.id,
            user_name: currentUser.name,
            location: bin.location,
            type: 'Bin Issue',
            description: `Issue with ${bin.name} - Fill: ${bin.fill_level}%`,
            status: 'pending',
            reported_at: new Date().toISOString(),
            lat: bin.lat,
            lng: bin.lng
        });
        showNotification('Issue reported!', 'success');
    }
}

// ============================================================================
// COLLECTOR MODULE - Waste collection staff functionalities
// ============================================================================

// ------------------------------------------
// 28. LOAD COLLECTOR HOME DASHBOARD
// ------------------------------------------
function loadCollectorHome() {
    currentPage = 'collector-home';
    let tasks = db.selectWhere('tasks', 'assigned_to', currentUser.id);
    
    contentArea.innerHTML = `
        <div class="hero-section" style="background:linear-gradient(135deg,#28a745,#20c997)">
            <h1>Welcome Collector ${currentUser.name}!</h1>
            <p>Vehicle: ${currentUser.vehicleNo || 'KHL-1234'} | Area: ${currentUser.assignedArea || 'Gollamari'}</p>
            <button class="hero-btn" onclick="startGPSTracking()"><i class="fas fa-location-dot"></i> Enable GPS</button>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><i class="fas fa-tasks stat-icon"></i><div class="stat-number">${tasks.length}</div><div class="stat-label">Assigned Tasks</div></div>
            <div class="stat-card"><i class="fas fa-check-circle stat-icon"></i><div class="stat-number">${db.selectAll('proofs').filter(p => p.collector_id === currentUser.id).length}</div><div class="stat-label">Completed</div></div>
            <div class="stat-card"><i class="fas fa-money-bill stat-icon"></i><div class="stat-number">${db.selectAll('fines').filter(f => f.issued_by === currentUser.id).length}</div><div class="stat-label">Issued Fines</div></div>
        </div>
        <div class="features-grid">
            <div class="feature-card" onclick="navigateTo('collector-tasks')"><i class="fas fa-tasks feature-icon"></i><h3>My Tasks</h3></div>
            <div class="feature-card" onclick="navigateTo('collector-iot')"><i class="fas fa-microchip feature-icon"></i><h3>Bin Status</h3></div>
            <div class="feature-card" onclick="navigateTo('collector-proof')"><i class="fas fa-camera feature-icon"></i><h3>Upload Proof</h3></div>
            <div class="feature-card" onclick="navigateTo('collector-fine')"><i class="fas fa-gavel feature-icon"></i><h3>Issue Fine</h3></div>
        </div>
    `;
}

// ------------------------------------------
// 29. LOAD COLLECTOR TASKS PAGE
// ------------------------------------------
function loadCollectorTasks() {
    let at = db.selectWhere('tasks', 'assigned_to', currentUser.id);
    
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title"><i class="fas fa-tasks title-icon"></i> My Tasks</h1></div>
        <div class="features-grid">${at.map(t => {
            let r = db.selectOne('reports', 'id', t.report_id);
            return `
                <div class="stat-card" style="text-align:left">
                    <h3>📍 ${t.location}</h3>
                    <p><strong>Type:</strong> ${t.waste_type}</p>
                    <p><strong>Description:</strong> ${r?.description || 'N/A'}</p>
                    <p><strong>Reported by:</strong> ${r?.user_name || 'N/A'}</p>
                    <button class="btn btn-primary" onclick="markTaskComplete(${t.id})">Mark Complete & Upload Proof</button>
                </div>
            `;
        }).join('') || '<p>No tasks assigned</p>'}</div>
    `;
}

// ------------------------------------------
// 30. MARK TASK AS COMPLETE (Redirect to proof)
// ------------------------------------------
function markTaskComplete(tid) { 
    navigateTo('collector-proof'); 
}

// ------------------------------------------
// 31. LOAD PROOF UPLOAD PAGE
// ------------------------------------------
function loadCollectorProof() {
    contentArea.innerHTML = `
        <div class="fine-form">
            <h2>Upload Collection Proof</h2>
            <form id="proofForm">
                <div class="form-group"><label>Task ID</label><input id="proofTask" class="form-control" placeholder="Task ID"></div>
                <div class="form-group"><label>Notes</label><textarea id="proofNotes" class="form-control" rows="3"></textarea></div>
                <div class="form-group"><label>Photo URL</label><input id="proofImage" class="form-control" placeholder="Image URL"></div>
                <button type="submit" class="btn btn-success btn-block">Submit Proof</button>
            </form>
        </div>
    `;
    
    document.getElementById('proofForm').addEventListener('submit', (e) => {
        e.preventDefault();
        // Save proof to database
        db.insert('proofs', {
            task_id: document.getElementById('proofTask').value,
            collector_id: currentUser.id,
            notes: document.getElementById('proofNotes').value,
            image: document.getElementById('proofImage').value,
            submitted_at: new Date().toISOString()
        });
        
        // Update task and report status
        let task = db.selectOne('tasks', 'id', parseInt(document.getElementById('proofTask').value));
        if (task) {
            let r = db.selectOne('reports', 'id', task.report_id);
            if (r) db.update('reports', r.id, { status: 'completed', collected_at: new Date().toISOString() });
            db.update('tasks', task.id, { status: 'completed' });
        }
        showNotification('Proof submitted!', 'success');
        navigateTo('collector-home');
    });
}

// ------------------------------------------
// 32. LOAD FINE ISSUING PAGE
// ------------------------------------------
function loadCollectorFine() {
    let citizens = db.selectAll('users').filter(u => u.type === 'citizen');
    
    contentArea.innerHTML = `
        <div class="fine-form">
            <h2>Issue Fine</h2>
            <form id="fineForm">
                <div class="form-group"><label>Citizen</label><select id="fineCitizen" class="form-control">${citizens.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Amount (BDT)</label><input type="number" id="fineAmount" class="form-control" placeholder="500" required></div>
                <div class="form-group"><label>Reason</label><textarea id="fineReason" class="form-control" rows="3" placeholder="Reason..." required></textarea></div>
                <button type="submit" class="btn btn-warning btn-block">Issue Fine</button>
            </form>
        </div>
    `;
    
    document.getElementById('fineForm').addEventListener('submit', (e) => {
        e.preventDefault();
        let citizen = db.selectOne('users', 'id', parseInt(document.getElementById('fineCitizen').value));
        // Save fine to database
        db.insert('fines', {
            user_id: citizen.id,
            user_name: citizen.name,
            location: 'Khulna',
            amount: parseFloat(document.getElementById('fineAmount').value),
            reason: document.getElementById('fineReason').value,
            issued_by: currentUser.id,
            issued_at: new Date().toISOString(),
            status: 'pending'
        });
        showNotification(`Fine issued to ${citizen.name}!`, 'success');
        navigateTo('collector-home');
    });
}

// ------------------------------------------
// 33. LOAD IOT BIN STATUS FOR COLLECTOR
// ------------------------------------------
function loadCollectorIoT() {
    currentPage = 'collector-iot';
    let bins = db.selectAll('smart_bins');
    
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title"><i class="fas fa-microchip title-icon"></i> Bin Status</h1></div>
        <div class="map-container"><div id="collectorBinMap"></div></div>
        <div class="features-grid" id="binsGrid"></div>
    `;
    
    setTimeout(() => { initMap('collectorBinMap'); addBinMarkers(); }, 100);
    
    document.getElementById('binsGrid').innerHTML = bins.map(b => `
        <div class="stat-card">
            <h3>${b.name}${b.is_iot ? ' <i class="fas fa-microchip"></i>' : ''}</h3>
            <div class="progress-fill"><div style="width:${b.fill_level}%;background:${b.fill_level >= 85 ? '#dc3545' : b.fill_level >= 70 ? '#ffc107' : '#28a745'};padding:8px;color:white">${b.fill_level}% Full</div></div>
            <button class="btn btn-primary" onclick="showNotification('Navigate','info')"><i class="fas fa-directions"></i> Navigate</button>
        </div>
    `).join('');
}

// ============================================================================
// ADMIN MODULE - System administrator functionalities
// ============================================================================

// ------------------------------------------
// 34. LOAD ADMIN HOME DASHBOARD
// ------------------------------------------
function loadAdminHome() {
    currentPage = 'admin-home';
    contentArea.innerHTML = `
        <div class="hero-section"><h1>Welcome Admin ${currentUser.name}! 👑</h1></div>
        <div class="stats-grid">
            <div class="stat-card"><i class="fas fa-users stat-icon"></i><div class="stat-number">${db.selectAll('users').length}</div><div class="stat-label">Users</div></div>
            <div class="stat-card"><i class="fas fa-trash-alt stat-icon"></i><div class="stat-number">${db.selectAll('smart_bins').length}</div><div class="stat-label">Smart Bins</div></div>
            <div class="stat-card"><i class="fas fa-file-alt stat-icon"></i><div class="stat-number">${db.selectAll('reports').length}</div><div class="stat-label">Reports</div></div>
            <div class="stat-card"><i class="fas fa-gavel stat-icon"></i><div class="stat-number">${db.selectAll('fines').length}</div><div class="stat-label">Fines</div></div>
        </div>
        <div class="features-grid">
            <div class="feature-card" onclick="navigateTo('admin-iot')"><i class="fas fa-microchip feature-icon"></i><h3>IoT Control</h3></div>
            <div class="feature-card" onclick="navigateTo('admin-users')"><i class="fas fa-users feature-icon"></i><h3>Users</h3></div>
            <div class="feature-card" onclick="navigateTo('admin-reports')"><i class="fas fa-file-alt feature-icon"></i><h3>Reports</h3></div>
            <div class="feature-card" onclick="navigateTo('admin-collectors')"><i class="fas fa-truck feature-icon"></i><h3>Collectors</h3></div>
            <div class="feature-card" onclick="navigateTo('admin-fines')"><i class="fas fa-gavel feature-icon"></i><h3>Fines</h3></div>
            <div class="feature-card" onclick="navigateTo('admin-analytics')"><i class="fas fa-chart-bar feature-icon"></i><h3>Analytics</h3></div>
            <div class="feature-card" onclick="document.getElementById('csvModal').classList.add('active')"><i class="fas fa-database feature-icon"></i><h3>CSV DB</h3></div>
        </div>
    `;
}

// ------------------------------------------
// 35. LOAD ADMIN IOT CONTROL PAGE
// ------------------------------------------
function loadAdminIoT() {
    currentPage = 'admin-iot';
    contentArea.innerHTML = `
        <div class="page-header"><h1 class="page-title">IoT Control</h1><button class="btn btn-success" onclick="openBinModal()">+ Add Bin</button></div>
        <div class="map-container"><div id="adminBinMap"></div><div style="position:absolute;bottom:20px;left:20px;background:white;padding:8px 15px;border-radius:20px;font-size:12px">Click on map to select location</div></div>
        <div class="table-container"><h3>All Smart Bins</h3><table><thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Fill</th><th>Status</th><th>Type</th><th>Actions</th></tr></thead><tbody id="binsTable"></tbody></table></div>
    `;
    setTimeout(() => { initMap('adminBinMap'); addBinMarkers(); }, 100);
    refreshBinsTable();
}

// ------------------------------------------
// 36. LOAD ADMIN USER MANAGEMENT PAGE
// ------------------------------------------
function loadAdminUsers() {
    let u = db.selectAll('users');
    contentArea.innerHTML = `
        <div class="table-container">
            <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>${u.map(us => `
                    <tr>
                        <td>${us.id}</td>
                        <td>${us.name}</td>
                        <td>${us.email}</td>
                        <td><span class="badge ${us.type === 'admin' ? 'badge-danger' : us.type === 'collector' ? 'badge-info' : 'badge-success'}">${us.type}</span></td>
                        <td><button class="btn btn-sm btn-danger" onclick="deleteUser(${us.id})">Delete</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------
// 37. DELETE USER (Admin only)
// ------------------------------------------
function deleteUser(id) {
    if (confirm('Delete user?')) {
        db.delete('users', id);
        showNotification('User deleted', 'success');
        loadAdminUsers();
    }
}

// ------------------------------------------
// 38. LOAD ADMIN REPORTS MANAGEMENT PAGE
// ------------------------------------------
function loadAdminReports() {
    let r = db.selectAll('reports');
    let c = db.selectAll('users').filter(u => u.type === 'collector');
    
    contentArea.innerHTML = `
        <div class="table-container">
            </table>
                <thead><tr><th>ID</th><th>Location</th><th>Type</th><th>Description</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>${r.map(rep => `
                    <tr>
                        <td>#${rep.id}</td>
                        <td>${rep.location}</td>
                        <td>${rep.type}</td>
                        <td>${rep.description.substring(0, 50)}</td>
                        <td class="badge badge-warning">${rep.status}</td>
                        <td><select id="assign_${rep.id}">${c.map(co => `<option value="${co.id}">${co.name}</option>`).join('')}</select><button class="btn btn-sm btn-success" onclick="assignReport(${rep.id})">Assign</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------
// 39. ASSIGN REPORT TO COLLECTOR
// ------------------------------------------
function assignReport(id) {
    let sel = document.getElementById(`assign_${id}`);
    let cid = parseInt(sel.value);
    
    if (cid) {
        // Update report status
        db.update('reports', id, { status: 'assigned', collector_id: cid });
        let r = db.selectOne('reports', 'id', id);
        // Create task for collector
        db.insert('tasks', {
            report_id: id,
            location: r.location,
            waste_type: r.type,
            status: 'pending',
            assigned_to: cid,
            assigned_at: new Date().toISOString(),
            lat: r.lat,
            lng: r.lng
        });
        showNotification('Report assigned!', 'success');
        loadAdminReports();
    }
}

// ------------------------------------------
// 40. LOAD ADMIN COLLECTOR MANAGEMENT PAGE
// ------------------------------------------
function loadAdminCollectors() {
    let c = db.selectAll('users').filter(u => u.type === 'collector');
    
    contentArea.innerHTML = `
        <div class="page-header"><button class="btn btn-success" onclick="addCollector()">+ Add Collector</button></div>
        <div class="table-container">
            表
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Vehicle</th><th>Area</th><th>Action</th></tr></thead>
                <tbody>${c.map(col => `
                    <tr>
                        <td>${col.id}</td>
                        <td>${col.name}</td>
                        <td>${col.email}</td>
                        <td>${col.vehicleNo || 'N/A'}</td>
                        <td>${col.assignedArea || 'N/A'}</td>
                        <td><button class="btn btn-sm btn-info" onclick="editCollector(${col.id})">Edit</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------
// 41. ADD NEW COLLECTOR
// ------------------------------------------
function addCollector() {
    let n = prompt('Name:');
    let e = prompt('Email:');
    let p = prompt('Phone:');
    
    if (n && e) {
        db.insert('users', {
            name: n,
            email: e,
            password: '123456',  // Default password
            type: 'collector',
            phone: p,
            address: 'Khulna',
            status: 'active',
            vehicleNo: 'Pending',
            assignedArea: 'Pending'
        });
        showNotification('Collector added!', 'success');
        loadAdminCollectors();
    }
}

// ------------------------------------------
// 42. EDIT COLLECTOR DETAILS
// ------------------------------------------
function editCollector(id) {
    let col = db.selectOne('users', 'id', id);
    if (col) {
        let v = prompt('Vehicle No:', col.vehicleNo);
        let a = prompt('Assigned Area:', col.assignedArea);
        db.update('users', id, { vehicleNo: v, assignedArea: a });
        showNotification('Updated!', 'success');
        loadAdminCollectors();
    }
}

// ------------------------------------------
// 43. LOAD ADMIN FINE MANAGEMENT PAGE
// ------------------------------------------
function loadAdminFines() {
    let f = db.selectAll('fines');
    
    contentArea.innerHTML = `
        <div class="table-container">
            表
                <thead><tr><th>ID</th><th>Citizen</th><th>Amount</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>${f.map(fi => `
                    <tr>
                        <td>#${fi.id}</td>
                        <td>${fi.user_name}</td>
                        <td>${fi.amount} BDT</td>
                        <td>${fi.reason.substring(0, 50)}</td>
                        <td class="badge badge-warning">${fi.status}</td>
                        <td><button class="btn btn-sm btn-success" onclick="markPaid(${fi.id})">Mark Paid</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------
// 44. MARK FINE AS PAID
// ------------------------------------------
function markPaid(id) {
    db.update('fines', id, { status: 'paid' });
    showNotification('Marked paid!', 'success');
    loadAdminFines();
}

// ------------------------------------------
// 45. LOAD ADMIN ANALYTICS DASHBOARD
// ------------------------------------------
function loadAdminAnalytics() {
    let r = db.selectAll('reports');
    let c = r.filter(rr => rr.status === 'completed').length;
    let b = db.selectAll('smart_bins').filter(bb => bb.fill_level >= 85).length;
    
    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-number">${r.length}</div><div class="stat-label">Total Reports</div></div>
            <div class="stat-card"><div class="stat-number">${((c / r.length) * 100 || 0).toFixed(1)}%</div><div class="stat-label">Completion Rate</div></div>
            <div class="stat-card"><div class="stat-number">${b}</div><div class="stat-label">Critical Bins</div></div>
            <div class="stat-card"><div class="stat-number">${db.selectAll('users').filter(u => u.type === 'citizen').length}</div><div class="stat-label">Citizens</div></div>
        </div>
        <button class="btn btn-primary" onclick="updateSmartBinLevels()">Simulate Sensor Data</button>
    `;
}

// ------------------------------------------
// 46. SIMULATE SENSOR DATA FOR NON-IOT BINS
// ------------------------------------------
function updateSmartBinLevels() {
    let bins = db.selectAll('smart_bins');
    bins.forEach(b => {
        if (!b.is_iot) {
            // Random change between -5% to +5%
            let nl = Math.max(0, Math.min(100, b.fill_level + (Math.random() - 0.5) * 10));
            db.update('smart_bins', b.id, {
                fill_level: Math.round(nl),
                status: nl >= 85 ? 'critical' : (nl >= 70 ? 'warning' : 'normal'),
                last_updated: new Date().toISOString()
            });
        }
    });
    showNotification('Sensor data simulated!', 'success');
    if (currentPage === 'admin-iot') loadAdminIoT();
}

// ============================================================================
// NAVIGATION MODULE - Page routing
// ============================================================================

// ------------------------------------------
// 47. NAVIGATE TO DIFFERENT PAGES
// ------------------------------------------
function navigateTo(p) {
    // Page mapping with corresponding load functions
    let pages = {
        home: loadCitizenHome,
        'citizen-bin-status': loadCitizenBinStatus,
        map: loadCitizenMap,
        'recycle-guide': loadRecycleGuide,
        report: loadReportPage,
        'my-reports': loadMyReports,
        'gps-track': loadGPSTracking,
        'collector-home': loadCollectorHome,
        'collector-tasks': loadCollectorTasks,
        'collector-proof': loadCollectorProof,
        'collector-fine': loadCollectorFine,
        'collector-iot': loadCollectorIoT,
        'admin-home': loadAdminHome,
        'admin-iot': loadAdminIoT,
        'admin-users': loadAdminUsers,
        'admin-reports': loadAdminReports,
        'admin-collectors': loadAdminCollectors,
        'admin-fines': loadAdminFines,
        'admin-analytics': loadAdminAnalytics
    };
    
    // Load the requested page or default to citizen home
    if (pages[p]) pages[p]();
    else loadCitizenHome();
}

// ------------------------------------------
// 48. UPDATE NAVIGATION MENU BASED ON USER TYPE
// ------------------------------------------
function updateNavMenu() {
    let menuItems = [];
    
    // Define menu items based on user role
    if (currentUser?.type === 'citizen') {
        menuItems = [
            { page: 'home', icon: 'fa-home', text: 'Home' },
            { page: 'citizen-bin-status', icon: 'fa-chart-line', text: 'Bin Status' },
            { page: 'map', icon: 'fa-map', text: 'Map' },
            { page: 'recycle-guide', icon: 'fa-recycle', text: 'Recycle' },
            { page: 'report', icon: 'fa-flag', text: 'Report' },
            { page: 'my-reports', icon: 'fa-list', text: 'My Reports' },
            { page: 'gps-track', icon: 'fa-location-dot', text: 'GPS' }
        ];
    } else if (currentUser?.type === 'collector') {
        menuItems = [
            { page: 'collector-home', icon: 'fa-home', text: 'Home' },
            { page: 'collector-tasks', icon: 'fa-tasks', text: 'Tasks' },
            { page: 'collector-iot', icon: 'fa-microchip', text: 'Bin Status' },
            { page: 'collector-proof', icon: 'fa-camera', text: 'Proof' },
            { page: 'collector-fine', icon: 'fa-gavel', text: 'Fine' }
        ];
    } else if (currentUser?.type === 'admin') {
        menuItems = [
            { page: 'admin-home', icon: 'fa-home', text: 'Home' },
            { page: 'admin-iot', icon: 'fa-microchip', text: 'IoT Control' },
            { page: 'admin-users', icon: 'fa-users', text: 'Users' },
            { page: 'admin-reports', icon: 'fa-file-alt', text: 'Reports' },
            { page: 'admin-collectors', icon: 'fa-truck', text: 'Collectors' },
            { page: 'admin-fines', icon: 'fa-gavel', text: 'Fines' },
            { page: 'admin-analytics', icon: 'fa-chart-bar', text: 'Analytics' }
        ];
    }
    
    // Update desktop navigation
    navMenu.innerHTML = menuItems.map(item => 
        `<a href="#" class="nav-link" data-page="${item.page}"><i class="fas ${item.icon}"></i> ${item.text}</a>`
    ).join('');
    
    // Add click handlers to desktop nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
    
    // Update mobile navigation
    mobileMenu.innerHTML = menuItems.map(item => 
        `<a href="#" class="mobile-link" data-page="${item.page}"><i class="fas ${item.icon}"></i> ${item.text}</a>`
    ).join('');
    
    // Add click handlers to mobile nav
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
            mobileMenu.classList.remove('active');
        });
    });
}

// ============================================================================
// AUTHENTICATION MODULE - Login, Register, Logout
// ============================================================================

// ------------------------------------------
// 49. HANDLE LOGIN FORM SUBMISSION
// ------------------------------------------
function handleLogin(e) {
    e.preventDefault();
    let email = document.getElementById('loginEmail').value;
    let pass = document.getElementById('loginPassword').value;
    let type = document.getElementById('loginType').value;
    
    // Find user in database
    let user = db.selectAll('users').find(u => u.email === email && u.password === pass && u.type === type);
    
    if (user) {
        // Set current user
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update UI
        userName.textContent = user.name;
        userTypeSpan.textContent = user.type;
        loginModal.classList.remove('active');
        mainApp.classList.remove('hidden');
        updateNavMenu();
        
        // Load appropriate dashboard
        if (user.type === 'citizen') loadCitizenHome();
        else if (user.type === 'collector') loadCollectorHome();
        else loadAdminHome();
        
        // Start IoT updates
        startIoTUpdates();
        showNotification(`Welcome ${user.name}!`, 'success');
    } else {
        showNotification('Invalid credentials!', 'error');
    }
}

// ------------------------------------------
// 50. HANDLE LOGOUT
// ------------------------------------------
function handleLogout() {
    stopGPSTracking();  // Stop GPS tracking if active
    stopIoTUpdates();   // Stop IoT updates
    currentUser = null;
    localStorage.removeItem('currentUser');
    mainApp.classList.add('hidden');
    loginModal.classList.add('active');
    showNotification('Logged out!', 'success');
}

// ------------------------------------------
// 51. HANDLE REGISTRATION FORM SUBMISSION
// ------------------------------------------
function handleRegister(e) {
    e.preventDefault();
    let name = document.getElementById('regName').value;
    let email = document.getElementById('regEmail').value;
    let pass = document.getElementById('regPassword').value;
    let conf = document.getElementById('regConfirm').value;
    let type = document.getElementById('regType').value;
    let terms = document.getElementById('terms').checked;
    
    // Validate password match
    if (pass !== conf) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    // Validate terms acceptance
    if (!terms) {
        showNotification('Accept terms!', 'error');
        return;
    }
    
    // Validate admin secret key
    if (type === 'admin' && document.getElementById('adminSecret').value !== ADMIN_SECRET_KEY) {
        showNotification('Invalid Admin Key!', 'error');
        return;
    }
    
    // Check if email already exists
    if (db.selectAll('users').some(u => u.email === email)) {
        showNotification('Email exists!', 'error');
        return;
    }
    
    // Create new user
    db.insert('users', {
        name: name,
        email: email,
        password: pass,
        type: type,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value,
        status: 'active'
    });
    
    showNotification('Registered! Please login', 'success');
    registerModal.classList.remove('active');
    loginModal.classList.add('active');
}

// ============================================================================
// INITIALIZATION - Application startup
// ============================================================================

// ------------------------------------------
// 52. DOM CONTENT LOADED EVENT HANDLER
// ------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved user session
    let saved = localStorage.getItem('currentUser');
    
    if (saved) {
        currentUser = JSON.parse(saved);
        userName.textContent = currentUser.name;
        userTypeSpan.textContent = currentUser.type;
        mainApp.classList.remove('hidden');
        updateNavMenu();
        
        // Load appropriate dashboard
        if (currentUser.type === 'citizen') loadCitizenHome();
        else if (currentUser.type === 'collector') loadCollectorHome();
        else loadAdminHome();
        
        startIoTUpdates();
    }
    
    // Hide splash screen after 2 seconds
    setTimeout(() => {
        splash.style.display = 'none';
        if (!currentUser) loginModal.classList.add('active');
    }, 2000);
    
    // ========== EVENT LISTENER SETUP ==========
    
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Switch to register modal
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        registerModal.classList.add('active');
    });
    
    // Switch to login modal
    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('active');
        loginModal.classList.add('active');
    });
    
    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    
    // Close scanner button
    document.getElementById('closeScannerBtn')?.addEventListener('click', () => {
        let v = document.getElementById('video');
        if (v.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
        document.getElementById('scannerModal').classList.remove('active');
    });
    
    // Capture button
    document.getElementById('captureBtn')?.addEventListener('click', captureAndScan);
    
    // Upload button
    document.getElementById('uploadBtn')?.addEventListener('click', uploadAndScan);
    
    // Close bin modal button
    document.getElementById('closeBinBtn')?.addEventListener('click', () => 
        document.getElementById('binModal').classList.remove('active')
    );
    
    // Bin form submission
    document.getElementById('binForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        let lat = document.getElementById('binLat').value;
        let lng = document.getElementById('binLng').value;
        
        if (!lat || !lng) {
            showNotification('Select location from map first!', 'error');
            return;
        }
        
        let id = e.target.dataset.editId;
        let data = {
            name: document.getElementById('binName').value,
            location: document.getElementById('binLocation').value,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            fill_level: parseInt(document.getElementById('binFillLevel').value),
            type: document.getElementById('binType').value,
            status: parseInt(document.getElementById('binFillLevel').value) >= 85 ? 'critical' : 
                    (parseInt(document.getElementById('binFillLevel').value) >= 70 ? 'warning' : 'normal'),
            is_iot: 0,
            last_updated: new Date().toISOString()
        };
        
        if (id) updateBin(parseInt(id), data);
        else addBin(data);
        
        document.getElementById('binModal').classList.remove('active');
    });
    
    // Mobile menu toggle
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => 
        mobileMenu.classList.toggle('active')
    );
    
    // Registration type change (show/hide admin secret)
    document.getElementById('regType')?.addEventListener('change', () => {
        if (document.getElementById('regType').value === 'admin') {
            document.getElementById('adminSecretGroup').classList.remove('hidden');
        } else {
            document.getElementById('adminSecretGroup').classList.add('hidden');
        }
    });
    
    // Close CSV modal
    document.getElementById('closeCsvBtn')?.addEventListener('click', () => 
        document.getElementById('csvModal').classList.remove('active')
    );
});

// ============================================================================
// EXPOSE GLOBAL FUNCTIONS FOR HTML ONCLICK
// ============================================================================
window.navigateTo = navigateTo;
window.openScanner = openScanner;
window.openBinModal = openBinModal;
window.deleteBin = deleteBin;
window.editBin = editBin;
window.captureAndScan = captureAndScan;
window.uploadAndScan = uploadAndScan;
window.findNearbyBinsGPS = findNearbyBinsGPS;
window.refreshBinsTable = refreshBinsTable;
window.updateSmartBinLevels = updateSmartBinLevels;
window.deleteUser = deleteUser;
window.assignReport = assignReport;
window.addCollector = addCollector;
window.editCollector = editCollector;
window.markPaid = markPaid;
window.markTaskComplete = markTaskComplete;
