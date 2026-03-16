// App State
let currentUser = null;
let userType = null;
let currentPage = 'home';
let mapInstance = null;

// Sample Users Data
let users = [
    { 
        id: 1, 
        name: 'Admin', 
        email: 'admin@wastewise.com', 
        phone: '01700000000', 
        address: 'Khulna', 
        type: 'admin', 
        password: 'admin123',
        createdAt: new Date().toISOString()
    },
    { 
        id: 2, 
        name: 'John Doe', 
        email: 'john@email.com', 
        phone: '01811111111', 
        address: 'Dhaka', 
        type: 'citizen', 
        password: 'pass123',
        createdAt: new Date().toISOString()
    },
    { 
        id: 3, 
        name: 'James Smith', 
        email: 'james@email.com', 
        phone: '01922222222', 
        address: 'Khulna', 
        type: 'collector', 
        password: 'collect123',
        createdAt: new Date().toISOString()
    }
];

// Reports Data
let reports = [];

// Recycling Items Data
const recyclingItems = [
    { id: 1, item: 'Plastic Bottle', category: 'Plastic', recyclable: true, instructions: 'Rinse and remove cap', disposal: 'Blue Bin' },
    { id: 2, item: 'Glass Bottle', category: 'Glass', recyclable: true, instructions: 'Clean and remove lid', disposal: 'Green Bin' },
    { id: 3, item: 'Newspaper', category: 'Paper', recyclable: true, instructions: 'Keep dry and bundle', disposal: 'Blue Bin' },
    { id: 4, item: 'Cardboard', category: 'Paper', recyclable: true, instructions: 'Flatten and keep dry', disposal: 'Blue Bin' },
    { id: 5, item: 'Aluminum Can', category: 'Metal', recyclable: true, instructions: 'Rinse and crush', disposal: 'Blue Bin' },
    { id: 6, item: 'Electronics', category: 'E-Waste', recyclable: true, instructions: 'Remove batteries', disposal: 'Special Collection' },
    { id: 7, item: 'Batteries', category: 'Hazardous', recyclable: false, instructions: 'Handle with care', disposal: 'Special Facility' },
    { id: 8, item: 'Food Waste', category: 'Organic', recyclable: true, instructions: 'Compostable', disposal: 'Green Bin' },
    { id: 9, item: 'Plastic Bag', category: 'Plastic', recyclable: false, instructions: 'Clean and dry', disposal: 'Red Bin' },
    { id: 10, item: 'Styrofoam', category: 'Plastic', recyclable: false, instructions: 'Not recyclable', disposal: 'General Waste' }
];

// Admin Secret Key
const ADMIN_SECRET_KEY = 'ADMIN123';

// DOM Elements
const splash = document.getElementById('splash');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const mainApp = document.getElementById('mainApp');
const contentArea = document.getElementById('contentArea');
const userName = document.getElementById('userName');
const userTypeSpan = document.getElementById('userType');
const logoutBtn = document.getElementById('logoutBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const navLinks = document.querySelectorAll('.nav-link');
const mobileLinks = document.querySelectorAll('.mobile-link');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const regType = document.getElementById('regType');
const adminSecretGroup = document.getElementById('adminSecretGroup');
const adminSecret = document.getElementById('adminSecret');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        userType = currentUser.type;
        updateUserDisplay();
        loginModal.classList.remove('active');
        mainApp.classList.remove('hidden');
        loadPage('home');
    }

    // Hide splash after 2 seconds
    setTimeout(() => {
        splash.style.display = 'none';
        if (!currentUser) {
            loginModal.classList.add('active');
        }
    }, 2000);

    setupEventListeners();
});

function setupEventListeners() {
    // Switch to Register
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        registerModal.classList.add('active');
    });

    // Switch to Login
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('active');
        loginModal.classList.add('active');
    });

    // Login Form
    loginForm.addEventListener('submit', handleLogin);

    // Register Form
    registerForm.addEventListener('submit', handleRegister);

    // User Type Change
    regType.addEventListener('change', () => {
        if (regType.value === 'admin') {
            adminSecretGroup.classList.remove('hidden');
            adminSecret.required = true;
        } else {
            adminSecretGroup.classList.add('hidden');
            adminSecret.required = false;
            adminSecret.value = '';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
            mobileMenu.classList.remove('active');
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
        if (e.target === registerModal) {
            registerModal.classList.remove('active');
        }
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const type = document.getElementById('loginType').value;

    if (!email || !password || !type) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    const user = users.find(u => 
        u.email === email && 
        u.password === password && 
        u.type === type
    );

    if (user) {
        currentUser = user;
        userType = user.type;
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        updateUserDisplay();
        loginModal.classList.remove('active');
        mainApp.classList.remove('hidden');
        
        showNotification(`Welcome back, ${user.name}!`, 'success');
        loadPage('home');
    } else {
        showNotification('Invalid email, password, or user type!', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const type = document.getElementById('regType').value;
    const terms = document.getElementById('terms').checked;

    // Validation
    if (!name || !email || !phone || !address || !password || !confirm || !type) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (phone.length < 11) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirm) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    if (!terms) {
        showNotification('Please accept the terms and conditions', 'error');
        return;
    }

    if (type === 'admin') {
        const secretKey = document.getElementById('adminSecret').value;
        if (secretKey !== ADMIN_SECRET_KEY) {
            showNotification('Invalid Admin Secret Key!', 'error');
            return;
        }
    }

    if (users.some(u => u.email === email)) {
        showNotification('Email already registered!', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email,
        phone,
        address,
        type,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    
    showNotification('Registration Successful! Please login.', 'success');
    registerModal.classList.remove('active');
    loginModal.classList.add('active');
    
    // Clear form
    registerForm.reset();
    adminSecretGroup.classList.add('hidden');
}

function handleLogout() {
    currentUser = null;
    userType = null;
    localStorage.removeItem('currentUser');
    mainApp.classList.add('hidden');
    loginModal.classList.add('active');
    showNotification('Logged out successfully', 'info');
}

function updateUserDisplay() {
    if (currentUser) {
        userName.textContent = currentUser.name;
        userTypeSpan.textContent = currentUser.type;
        
        // Hide admin tab for non-admin users
        const adminNav = document.querySelector('.nav-link[data-page="admin"]');
        if (adminNav) {
            if (currentUser.type === 'admin') {
                adminNav.style.display = 'flex';
            } else {
                adminNav.style.display = 'none';
            }
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function navigateTo(page) {
    currentPage = page;
    
    // Update active nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // Load page based on user role
    if (page === 'admin' && currentUser.type !== 'admin') {
        showNotification('Admin access only!', 'error');
        loadPage('home');
        return;
    }

    loadPage(page);
}

function loadPage(page) {
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'map':
            loadMapPage();
            break;
        case 'route':
            loadRoutePage();
            break;
        case 'recycle':
            loadRecyclePage();
            break;
        case 'feedback':
            loadFeedbackPage();
            break;
        case 'analytics':
            loadAnalyticsPage();
            break;
        case 'admin':
            loadAdminPage();
            break;
    }
}

function loadHomePage() {
    const features = currentUser.type === 'collector' ? [
        { icon: 'fa-route', title: 'Route Optimization', desc: 'Find shortest paths', page: 'route' },
        { icon: 'fa-map', title: 'City Map', desc: 'View collection points', page: 'map' },
        { icon: 'fa-chart-bar', title: 'Analytics', desc: 'View statistics', page: 'analytics' },
        { icon: 'fa-recycle', title: 'Recycle Guide', desc: 'Learn recycling', page: 'recycle' }
    ] : currentUser.type === 'admin' ? [
        { icon: 'fa-users', title: 'User Management', desc: 'Manage users', page: 'admin' },
        { icon: 'fa-file-alt', title: 'Reports', desc: 'View all reports', page: 'admin' },
        { icon: 'fa-chart-line', title: 'Analytics', desc: 'System analytics', page: 'analytics' },
        { icon: 'fa-cog', title: 'Settings', desc: 'System settings', page: 'settings' }
    ] : [
        { icon: 'fa-comment', title: 'Report Issue', desc: 'Report waste problems', page: 'feedback' },
        { icon: 'fa-recycle', title: 'Recycle Guide', desc: 'Learn recycling', page: 'recycle' },
        { icon: 'fa-map', title: 'City Map', desc: 'View collection points', page: 'map' },
        { icon: 'fa-chart-bar', title: 'Analytics', desc: 'View statistics', page: 'analytics' }
    ];

    const featuresHtml = features.map(f => `
        <div class="feature-card" onclick="navigateTo('${f.page}')">
            <i class="fas ${f.icon} feature-icon"></i>
            <h3>${f.title}</h3>
            <p>${f.desc}</p>
        </div>
    `).join('');

    const html = `
        <div class="page-container">
            <div class="hero-section">
                <h1 class="hero-title">Welcome back, ${currentUser.name}! 👋</h1>
                <p class="hero-text">You are logged in as <strong>${currentUser.type}</strong>. Help us make Khulna cleaner and greener.</p>
                ${currentUser.type === 'citizen' ? `
                    <button class="hero-btn" onclick="navigateTo('feedback')">
                        <i class="fas fa-plus"></i> Report Waste
                    </button>
                ` : ''}
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-route stat-icon"></i>
                    <div class="stat-number">15+</div>
                    <div class="stat-label">Active Routes</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-recycle stat-icon"></i>
                    <div class="stat-number">50+</div>
                    <div class="stat-label">Recyclable Items</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-file-alt stat-icon"></i>
                    <div class="stat-number">${reports.length}</div>
                    <div class="stat-label">Total Reports</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users stat-icon"></i>
                    <div class="stat-number">${users.length}</div>
                    <div class="stat-label">Active Users</div>
                </div>
            </div>

            <h2 class="section-title">Quick Actions</h2>
            <div class="features-grid">
                ${featuresHtml}
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
}

function loadMapPage() {
    const html = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-map title-icon"></i>
                    Khulna City Map
                </h1>
                <p class="page-subtitle">Interactive map of Khulna city with all waste collection points</p>
            </div>
            
            <div class="map-container">
                <div id="map"></div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    
    setTimeout(() => {
        mapInstance = initMap('map');
        addLocationMarkers();
    }, 100);
}

function loadRoutePage() {
    if (currentUser.type !== 'collector' && currentUser.type !== 'admin') {
        showNotification('This page is only for collectors and admins', 'error');
        loadHomePage();
        return;
    }

    const options = KHULNA_LOCATIONS.map(loc => 
        `<option value="${loc.name}">${loc.name}</option>`
    ).join('');

    const html = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-route title-icon"></i>
                    Route Optimization
                </h1>
                <p class="page-subtitle">Find the most efficient waste collection routes in Khulna City</p>
            </div>

            <div class="route-container">
                <div class="route-panel">
                    <div class="panel-header">
                        <i class="fas fa-map-marked-alt panel-icon"></i>
                        <h3>Route Details</h3>
                    </div>
                    
                    <select id="routeFrom" class="route-select">
                        <option value="">Select start point</option>
                        ${options}
                    </select>

                    <select id="routeTo" class="route-select">
                        <option value="">Select end point</option>
                        ${options}
                    </select>

                    <input type="text" id="routeVia" class="route-input" placeholder="Via (optional)">

                    <div class="route-buttons">
                        <button class="route-btn find-btn" onclick="findRoute()">
                            <i class="fas fa-search"></i> Find Route
                        </button>
                        ${currentUser.type === 'collector' ? `
                            <button class="route-btn save-btn" onclick="saveRoute()">
                                <i class="fas fa-save"></i> Save Route
                            </button>
                        ` : ''}
                    </div>

                    <div class="route-info" id="routeInfo">
                        <h4><i class="fas fa-info-circle"></i> Route Details</h4>
                        <div class="route-path" id="routePath">
                            <p>Select locations to find optimal route</p>
                        </div>
                        <div class="route-total" id="routeTotal"></div>
                    </div>
                </div>

                <div class="map-container">
                    <div id="routeMap"></div>
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    
    setTimeout(() => {
        mapInstance = initMap('routeMap');
        addLocationMarkers();
    }, 100);
}

function loadRecyclePage() {
    const tableRows = recyclingItems.map(item => `
        <tr>
            <td>${item.item}</td>
            <td>${item.category}</td>
            <td><span class="badge ${item.recyclable ? 'badge-success' : 'badge-danger'}">${item.recyclable ? 'Yes' : 'No'}</span></td>
            <td>${item.instructions}</td>
            <td>${item.disposal}</td>
        </tr>
    `).join('');

    const html = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-recycle title-icon"></i>
                    Recycling Guide
                </h1>
                <p class="page-subtitle">Learn how to properly recycle different types of waste</p>
            </div>

            <div class="search-section">
                <input type="text" id="searchInput" class="search-input" placeholder="Search items...">
                <button class="search-btn" onclick="searchRecycle()">
                    <i class="fas fa-search"></i> Search
                </button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Recyclable</th>
                            <th>Instructions</th>
                            <th>Disposal</th>
                        </tr>
                    </thead>
                    <tbody id="recycleTableBody">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
}

function loadFeedbackPage() {
    if (currentUser.type !== 'citizen') {
        showNotification('This page is only for citizens', 'error');
        loadHomePage();
        return;
    }

    const options = KHULNA_LOCATIONS.map(loc => 
        `<option value="${loc.name}">${loc.name}</option>`
    ).join('');

    const html = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-comment title-icon"></i>
                    Report Waste Issue
                </h1>
                <p class="page-subtitle">Help us keep Khulna clean by reporting waste problems</p>
            </div>

            <div class="feedback-form">
                <form id="feedbackForm">
                    <div class="form-group">
                        <label>Location:</label>
                        <select id="feedbackLocation" class="form-control" required>
                            <option value="">Select location</option>
                            ${options}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Waste Type:</label>
                        <select id="feedbackType" class="form-control" required>
                            <option value="">Select type</option>
                            <option value="Household">Household Waste</option>
                            <option value="Recyclable">Recyclable</option>
                            <option value="Hazardous">Hazardous</option>
                            <option value="Electronic">Electronic</option>
                            <option value="Construction">Construction</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="feedbackDesc" class="form-control" rows="5" placeholder="Describe the issue in detail..." required></textarea>
                    </div>

                    <div class="form-group">
                        <label>Image (optional):</label>
                        <div class="file-upload">
                            <input type="text" id="feedbackImage" class="form-control" placeholder="No file chosen" readonly>
                            <button type="button" class="upload-btn" onclick="browseFile()">
                                <i class="fas fa-folder-open"></i> Browse
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="submit-btn">
                        <i class="fas fa-paper-plane"></i> Submit Report
                    </button>
                </form>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    
    document.getElementById('feedbackForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitFeedback();
    });
}

function loadAnalyticsPage() {
    const html = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-chart-bar title-icon"></i>
                    Analytics Dashboard
                </h1>
                <p class="page-subtitle">View statistics and insights about waste management</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-truck stat-icon"></i>
                    <div class="stat-number">85%</div>
                    <div class="stat-label">Collection Efficiency</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-smile stat-icon"></i>
                    <div class="stat-number">92%</div>
                    <div class="stat-label">Citizen Satisfaction</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock stat-icon"></i>
                    <div class="stat-number">4.5h</div>
                    <div class="stat-label">Avg Response Time</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-leaf stat-icon"></i>
                    <div class="stat-number">45%</div>
                    <div class="stat-label">Recycling Rate</div>
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
}

function loadAdminPage() {
    if (currentUser.type !== 'admin') {
        showNotification('Admin access only!', 'error');
        loadHomePage();
        return;
    }

    const userRows = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.type}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');

    const reportRows = reports.map(report => `
        <tr>
            <td>${report.id}</td>
            <td>${report.location}</td>
            <td>${report.type}</td>
            <td>${report.status}</td>
            <td>${new Date(report.reportedAt).toLocaleString()}</td>
        </tr>
    `).join('');

    const html = `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-cog title-icon"></i>
                    Admin Panel
                </h1>
                <p class="page-subtitle">Manage users and reports</p>
            </div>

            <div class="admin-panel">
                <div class="admin-tabs">
                    <button class="admin-tab active" onclick="showAdminTab('users')">Users</button>
                    <button class="admin-tab" onclick="showAdminTab('reports')">Reports</button>
                </div>

                <div class="admin-content" id="adminContent">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Type</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
}

function showAdminTab(tab) {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'users') {
        const userRows = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.type}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');

        document.getElementById('adminContent').innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Type</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userRows}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        const reportRows = reports.map(report => `
            <tr>
                <td>${report.id}</td>
                <td>${report.location}</td>
                <td>${report.type}</td>
                <td>${report.status}</td>
                <td>${new Date(report.reportedAt).toLocaleString()}</td>
            </tr>
        `).join('');

        document.getElementById('adminContent').innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Location</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Reported</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportRows || '<tr><td colspan="5" style="text-align: center;">No reports yet</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// Route Functions
function findRoute() {
    const from = document.getElementById('routeFrom').value;
    const to = document.getElementById('routeTo').value;
    
    if (!from || !to) {
        showNotification('Please select both start and end points', 'error');
        return;
    }

    const result = findAndDisplayRoute(from, to);
    
    if (result) {
        const routePath = document.getElementById('routePath');
        const routeTotal = document.getElementById('routeTotal');
        
        let pathHtml = '';
        for (let i = 0; i < result.path.length - 1; i++) {
            pathHtml += `<p><i class="fas fa-arrow-right"></i> ${result.path[i]} → ${result.path[i + 1]}</p>`;
        }
        
        routePath.innerHTML = pathHtml;
        routeTotal.innerHTML = `Total Distance: ${result.distance.toFixed(1)} km`;
        
        showNotification('Route found!', 'success');
    }
}

function saveRoute() {
    showNotification('Route saved successfully!', 'success');
}

// Recycle Functions
function searchRecycle() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tbody = document.getElementById('recycleTableBody');
    
    const filtered = recyclingItems.filter(item => 
        item.item.toLowerCase().includes(searchTerm) || 
        item.category.toLowerCase().includes(searchTerm)
    );
    
    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${item.item}</td>
            <td>${item.category}</td>
            <td><span class="badge ${item.recyclable ? 'badge-success' : 'badge-danger'}">${item.recyclable ? 'Yes' : 'No'}</span></td>
            <td>${item.instructions}</td>
            <td>${item.disposal}</td>
        </tr>
    `).join('');
}

// Feedback Functions
function browseFile() {
    document.getElementById('feedbackImage').value = 'sample-image.jpg';
}

function submitFeedback() {
    const location = document.getElementById('feedbackLocation').value;
    const type = document.getElementById('feedbackType').value;
    const desc = document.getElementById('feedbackDesc').value;
    
    if (!location || !type || !desc) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const newReport = {
        id: reports.length + 1,
        userId: currentUser.id,
        userName: currentUser.name,
        location,
        type,
        description: desc,
        image: document.getElementById('feedbackImage').value,
        status: 'pending',
        reportedAt: new Date().toISOString()
    };

    reports.push(newReport);
    
    showNotification('Report submitted successfully!', 'success');
    
    document.getElementById('feedbackForm').reset();
    document.getElementById('feedbackImage').value = '';
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Make functions global
window.navigateTo = navigateTo;
window.findRoute = findRoute;
window.saveRoute = saveRoute;
window.searchRecycle = searchRecycle;
window.browseFile = browseFile;
window.submitFeedback = submitFeedback;
window.showAdminTab = showAdminTab;
window.showNotification = showNotification;