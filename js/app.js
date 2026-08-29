/* ============================================================
   ElectroParts IMS — Main Application Logic
   Professional Inventory Management for Electronic Components
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  STORAGE: {
    COMPONENTS: 'ep_components',
    CATEGORIES: 'ep_categories',
    ACTIVITY: 'ep_activity',
    PROJECTS: 'ep_projects',
    THEME: 'ep_theme',
    AUTH: 'ep_auth',
    INITIALIZED: 'ep_initialized'
  }
};

// ============================================================
// DEFAULT DATA
// ============================================================
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Resistors', color: '#3B82F6', icon: 'zap' },
  { id: 'cat-2', name: 'Capacitors', color: '#10B981', icon: 'battery-charging' },
  { id: 'cat-3', name: 'ICs & Microcontrollers', color: '#8B5CF6', icon: 'cpu' },
  { id: 'cat-4', name: 'LEDs & Displays', color: '#F59E0B', icon: 'lightbulb' },
  { id: 'cat-5', name: 'Sensors', color: '#F97316', icon: 'thermometer' },
  { id: 'cat-6', name: 'Connectors', color: '#EF4444', icon: 'plug' },
  { id: 'cat-7', name: 'Passive Components', color: '#14B8A6', icon: 'disc' },
  { id: 'cat-8', name: 'Development Boards', color: '#6366F1', icon: 'circuit-board' }
];

const SAMPLE_COMPONENTS = [
  {
    id: 'comp-1', name: 'Arduino Uno R3', category: 'cat-8',
    quantity: 5, minStock: 2, location: 'Shelf A-3',
    description: 'ATmega328P based development board',
    purchasePrice: 3500, supplier: 'Daraz',
    tags: ['arduino', 'mcu', 'dev-board'], imageUrl: '',
    dateAdded: '2026-08-15', lastUpdated: '2026-08-15'
  },
  {
    id: 'comp-2', name: '10kΩ Resistor Pack (100pcs)', category: 'cat-1',
    quantity: 85, minStock: 20, location: 'Drawer B-1',
    description: '1/4W metal film resistors, ±1% tolerance',
    purchasePrice: 450, supplier: 'Hall Road',
    tags: ['resistor', '10k', 'through-hole'], imageUrl: '',
    dateAdded: '2026-08-10', lastUpdated: '2026-08-20'
  },
  {
    id: 'comp-3', name: 'ESP32-WROOM-32D', category: 'cat-8',
    quantity: 4, minStock: 2, location: 'Shelf A-3',
    description: 'Wi-Fi + Bluetooth dual-mode module',
    purchasePrice: 1200, supplier: 'AliExpress',
    tags: ['esp32', 'wifi', 'iot'], imageUrl: '',
    dateAdded: '2026-08-22', lastUpdated: '2026-08-22'
  }
];

// ============================================================
// APPLICATION STATE
// ============================================================
const state = {
  components: [],
  categories: [],
  activity: [],
  projects: [],
  isAuthenticated: false,
  currentUser: null,
  currentView: 'dashboard',
  searchQuery: '',
  categoryFilter: '',
  sortBy: 'name-asc',
  editingId: null,
  deletingId: null,
  charts: { category: null, stock: null },
  isLoginMode: true // true = login, false = signup
};

// ============================================================
// STORAGE HELPERS
// ============================================================
const Storage = {
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error('Storage error:', e); }
  },
  loadAll() {
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      const uid = firebase.auth().currentUser.uid;
      firebase.database().ref('users/' + uid).once('value').then(snap => {
        const data = snap.val() || {};
        state.components = data.components || [];
        state.categories = data.categories || [...DEFAULT_CATEGORIES];
        state.activity = data.activity || [];
        state.projects = data.projects || [];
        UI.switchView(state.currentView);
      });
    } else {
      state.components = Storage.get(CONFIG.STORAGE.COMPONENTS) || [];
      state.categories = Storage.get(CONFIG.STORAGE.CATEGORIES) || [];
      state.activity = Storage.get(CONFIG.STORAGE.ACTIVITY) || [];
      state.projects = Storage.get(CONFIG.STORAGE.PROJECTS) || [];
    }
  },
  saveComponents() { 
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/components').set(state.components);
    }
    Storage.set(CONFIG.STORAGE.COMPONENTS, state.components);
  },
  saveCategories() { 
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/categories').set(state.categories);
    }
    Storage.set(CONFIG.STORAGE.CATEGORIES, state.categories); 
  },
  saveActivity() { 
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/activity').set(state.activity);
    }
    Storage.set(CONFIG.STORAGE.ACTIVITY, state.activity); 
  },
  saveProjects() {
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/projects').set(state.projects);
    }
    Storage.set(CONFIG.STORAGE.PROJECTS, state.projects);
  }
};

// ============================================================
// AUTHENTICATION (Firebase + Local Mock)
// ============================================================
const Auth = {
  init() {
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED) {
      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          if (!user.emailVerified) {
            Auth.showEmailVerificationNotice(user.email);
            return;
          }
          Auth.handleLoginSuccess({ name: user.displayName || user.email, email: user.email });
        } else {
          Auth.showLoginScreen();
        }
      });

      // Bind Firebase specific buttons
      document.getElementById('googleSignInBtn').onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).catch(err => {
          document.getElementById('authError').textContent = err.message;
        });
      };
      
      document.getElementById('resendVerificationBtn').onclick = () => {
        const user = firebase.auth().currentUser;
        if (user) {
          user.sendEmailVerification().then(() => {
            UI.showToast('Verification email resent', 'success');
          });
        }
      };

      document.getElementById('checkVerificationBtn').onclick = () => {
        const user = firebase.auth().currentUser;
        if (user) {
          user.reload().then(() => {
            if (user.emailVerified) {
              UI.hideModal('verifyEmailModal');
              Auth.handleLoginSuccess({ name: user.displayName || user.email, email: user.email });
            } else {
              UI.showToast('Email not verified yet. Please check your inbox.', 'warning');
            }
          });
        }
      };

    } else {
      // Local Mock Auth (For Demo / Free setup)
      
      // Bind mock Google button
      document.getElementById('googleSignInBtn').onclick = () => {
        Auth.handleLoginSuccess({ name: 'Demo User', email: 'demo@gmail.com' });
      };

      const savedUser = sessionStorage.getItem(CONFIG.STORAGE.AUTH);
      if (savedUser) {
        Auth.handleLoginSuccess(JSON.parse(savedUser));
      } else {
        Auth.showLoginScreen();
      }
    }
  },

  handleEmailSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();
    const errorEl = document.getElementById('authError');
    errorEl.textContent = '';

    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED) {
      const auth = firebase.auth();
      if (state.isLoginMode) {
        auth.signInWithEmailAndPassword(email, password)
          .catch(err => errorEl.textContent = err.message);
      } else {
        auth.createUserWithEmailAndPassword(email, password)
          .then(cred => {
            return cred.user.updateProfile({ displayName: name }).then(() => {
              cred.user.sendEmailVerification();
              Auth.showEmailVerificationNotice(email);
            });
          })
          .catch(err => errorEl.textContent = err.message);
      }
    } else {
      // Local Mock Auth
      if (state.isLoginMode) {
        // Mock Login
        if (email && password.length >= 6) {
          Auth.handleLoginSuccess({ name: email.split('@')[0], email: email });
        } else {
          errorEl.textContent = 'Invalid credentials. Hint: Any email + 6 char password works in demo mode.';
        }
      } else {
        // Mock Signup with OTP
        if (email && password.length >= 6 && name) {
          Auth.showOTPModal(email, name);
        } else {
          errorEl.textContent = 'Please fill all fields.';
        }
      }
    }
  },

  showLoginScreen() {
    state.isAuthenticated = false;
    state.currentUser = null;
    document.getElementById('appLayout').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
  },

  handleLoginSuccess(user) {
    state.isAuthenticated = true;
    state.currentUser = user;
    if (!(typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED)) {
      sessionStorage.setItem(CONFIG.STORAGE.AUTH, JSON.stringify(user));
    }
    
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appLayout').style.display = 'flex';
    
    // Load their cloud data
    Storage.loadAll();
    
    // Refresh UI
    UI.switchView('dashboard');
    UI.showToast(`Welcome back, ${user.name || user.email.split('@')[0]}! 👋`, 'success');
  },

  logout() {
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED) {
      firebase.auth().signOut();
    } else {
      sessionStorage.removeItem(CONFIG.STORAGE.AUTH);
      Auth.showLoginScreen();
    }
  },

  toggleAuthMode(e) {
    e.preventDefault();
    state.isLoginMode = !state.isLoginMode;
    const nameGroup = document.getElementById('authNameGroup');
    const authName = document.getElementById('authName');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleLink = document.getElementById('authToggle');
    const switchText = document.getElementById('authSwitchText');
    const errorEl = document.getElementById('authError');

    errorEl.textContent = '';

    if (state.isLoginMode) {
      nameGroup.style.display = 'none';
      authName.removeAttribute('required');
      submitBtn.textContent = 'Sign In';
      switchText.textContent = "Don't have an account?";
      toggleLink.textContent = 'Sign Up';
    } else {
      nameGroup.style.display = 'block';
      authName.setAttribute('required', 'true');
      submitBtn.textContent = 'Create Account';
      switchText.textContent = "Already have an account?";
      toggleLink.textContent = 'Sign In';
    }
  },

  // --- Local OTP Simulation ---
  showOTPModal(email, name) {
    document.getElementById('otpEmailDisplay').textContent = email;
    document.getElementById('otpError').textContent = '';
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach(input => input.value = '');
    UI.showModal('otpModal');
    
    // Simulate sending OTP
    UI.showToast('Demo Mode: OTP is 123456', 'info');
    
    // Store temp data
    Auth.tempSignupData = { email, name };
  },

  verifyOTP() {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const code = inputs.map(i => i.value).join('');
    
    if (code === '123456') { // Demo OTP
      UI.hideModal('otpModal');
      Auth.handleLoginSuccess(Auth.tempSignupData);
    } else {
      document.getElementById('otpError').textContent = 'Invalid OTP. Try 123456 for demo.';
    }
  },

  showEmailVerificationNotice(email) {
    document.getElementById('verifyEmailDisplay').textContent = email;
    UI.showModal('verifyEmailModal');
  }
};

// ============================================================
// DATA OPERATIONS
// ============================================================
const Data = {
  initSampleData() {
    if (Storage.get(CONFIG.STORAGE.INITIALIZED)) return;
    state.categories = [...DEFAULT_CATEGORIES];
    state.components = [...SAMPLE_COMPONENTS];
    Storage.saveCategories();
    Storage.saveComponents();
    Storage.set(CONFIG.STORAGE.INITIALIZED, true);
  },

  generateId() {
    return 'comp-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  addComponent(comp) {
    comp.id = Data.generateId();
    comp.dateAdded = new Date().toISOString().split('T')[0];
    comp.lastUpdated = comp.dateAdded;
    state.components.unshift(comp);
    Storage.saveComponents();
    Data.logActivity('added', comp);
  },

  updateComponent(id, updates) {
    const idx = state.components.findIndex(c => c.id === id);
    if (idx === -1) return;
    state.components[idx] = { ...state.components[idx], ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
    Storage.saveComponents();
    Data.logActivity('updated', state.components[idx]);
  },

  deleteComponent(id) {
    const comp = state.components.find(c => c.id === id);
    if (!comp) return;
    state.components = state.components.filter(c => c.id !== id);
    Storage.saveComponents();
    Data.logActivity('deleted', comp);
  },

  getFilteredComponents() {
    let results = [...state.components];
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.supplier.toLowerCase().includes(q) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (state.categoryFilter) {
      results = results.filter(c => c.category === state.categoryFilter);
    }
    const [field, dir] = state.sortBy.split('-');
    results.sort((a, b) => {
      let va, vb;
      switch (field) {
        case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
        case 'qty': va = a.quantity; vb = b.quantity; break;
        case 'date': va = a.dateAdded; vb = b.dateAdded; break;
        default: va = a.name.toLowerCase(); vb = b.name.toLowerCase();
      }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return results;
  },

  getCategoryName(id) {
    const cat = state.categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  },

  getCategoryColor(id) {
    const cat = state.categories.find(c => c.id === id);
    return cat ? cat.color : '#94A3B8';
  },

  getCategoryIcon(id) {
    const cat = state.categories.find(c => c.id === id);
    return cat ? cat.icon : 'box';
  },

  getStats() {
    const totalQty = state.components.reduce((sum, c) => sum + c.quantity, 0);
    const uniqueItems = state.components.length;
    const lowStock = state.components.filter(c => c.quantity <= c.minStock).length;
    const totalValue = state.components.reduce((sum, c) => sum + (c.quantity * (c.purchasePrice || 0)), 0);
    return { totalQty, uniqueItems, lowStock, totalValue };
  },

  getLowStockComponents() {
    return state.components
      .filter(c => c.quantity <= c.minStock)
      .sort((a, b) => (a.quantity / Math.max(a.minStock, 1)) - (b.quantity / Math.max(b.minStock, 1)));
  },

  logActivity(action, comp) {
    const entry = {
      id: 'act-' + Date.now(),
      action,
      componentId: comp.id,
      componentName: comp.name,
      quantity: comp.quantity,
      timestamp: Date.now(),
      platform: 'web'
    };
    state.activity.unshift(entry);
    if (state.activity.length > 100) state.activity = state.activity.slice(0, 100);
    Storage.saveActivity();
  }
};

// ============================================================
// UI RENDERING
// ============================================================
const UI = {
  switchView(viewName) {
    state.currentView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewName + 'View')?.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-view="${viewName}"]`)?.classList.add('active');

    switch (viewName) {
      case 'dashboard': UI.renderDashboard(); break;
      case 'inventory': UI.renderInventory(); break;
      case 'categories': UI.renderCategories(); break;
      case 'projects': UI.renderProjects(); break;
      case 'activity': UI.renderActivity(); break;
      case 'calculator': ResistorCalc.init(); break;
    }

    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
  },

  renderDashboard() {
    const stats = Data.getStats();
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Quantity</span>
          <span class="stat-value">${stats.totalQty.toLocaleString()}</span>
        </div>
        <div class="stat-icon stat-icon--green"><i data-lucide="layers"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Unique Items</span>
          <span class="stat-value">${stats.uniqueItems}</span>
        </div>
        <div class="stat-icon stat-icon--blue"><i data-lucide="box"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Low Stock</span>
          <span class="stat-value">${stats.lowStock}</span>
        </div>
        <div class="stat-icon stat-icon--yellow"><i data-lucide="alert-triangle"></i></div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <span class="stat-label">Total Value</span>
          <span class="stat-value">PKR ${stats.totalValue.toLocaleString()}</span>
        </div>
        <div class="stat-icon stat-icon--green"><i data-lucide="banknote"></i></div>
      </div>
    `;

    const lowStockList = document.getElementById('lowStockList');
    const lowStockItems = Data.getLowStockComponents();
    if (lowStockItems.length === 0) {
      lowStockList.innerHTML = '<div class="empty-state" style="padding:24px"><i data-lucide="check-circle"></i><p>All items are well stocked!</p></div>';
    } else {
      lowStockList.innerHTML = lowStockItems.map(c => `
        <div class="low-stock-item">
          <div class="low-stock-info">
            <span class="low-stock-dot"></span>
            <span class="low-stock-name">${escapeHtml(c.name)}</span>
          </div>
          <span class="low-stock-qty">${c.quantity} / ${c.minStock}</span>
        </div>
      `).join('');
    }

    const recentActivity = document.getElementById('recentActivity');
    const recentItems = state.activity.slice(0, 8);
    if (recentItems.length === 0) {
      recentActivity.innerHTML = '<div class="empty-state" style="padding:24px"><i data-lucide="clock"></i><p>No activity yet</p></div>';
    } else {
      recentActivity.innerHTML = recentItems.map(a => {
        const actionText = a.action === 'added' ? 'Added' : a.action === 'updated' ? 'Updated' : 'Deleted';
        return `
          <div class="activity-item">
            <span class="activity-dot activity-dot--${a.action}"></span>
            <div class="activity-content">
              <div class="activity-text"><strong>${actionText}</strong> ${escapeHtml(a.componentName)}</div>
              <div class="activity-time">${formatTimeAgo(a.timestamp)}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    Charts.update();
    refreshIcons();
  },

  renderInventory() {
    const filtered = Data.getFilteredComponents();
    const tbody = document.getElementById('inventoryTableBody');
    const empty = document.getElementById('emptyInventory');
    const table = document.getElementById('inventoryTable');
    const count = document.getElementById('resultsCount');

    count.textContent = `${filtered.length} component${filtered.length !== 1 ? 's' : ''}`;

    const catFilter = document.getElementById('categoryFilter');
    const currentVal = catFilter.value;
    catFilter.innerHTML = '<option value="">All Categories</option>' +
      state.categories.map(c => `<option value="${c.id}" ${c.id === currentVal ? 'selected' : ''}>${c.name}</option>`).join('');

    if (filtered.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'flex';
      refreshIcons();
      return;
    }

    table.style.display = '';
    empty.style.display = 'none';

    tbody.innerHTML = filtered.map(c => {
      const catColor = Data.getCategoryColor(c.category);
      const catName = Data.getCategoryName(c.category);
      const isLow = c.quantity <= c.minStock;
      const isWarning = c.quantity <= c.minStock * 1.5 && !isLow;
      const qtyClass = isLow ? 'qty-badge--low' : isWarning ? 'qty-badge--warning' : 'qty-badge--ok';

      return `
        <tr>
          <td>
            <div class="component-cell">
              <div class="component-img">
                ${c.imageUrl ? `<img src="${escapeHtml(c.imageUrl)}" alt="${escapeHtml(c.name)}">` : `<i data-lucide="${Data.getCategoryIcon(c.category)}"></i>`}
              </div>
              <div>
                <div class="component-name">
                  ${escapeHtml(c.name)}
                  ${c.datasheetUrl ? `<a href="${escapeHtml(c.datasheetUrl)}" target="_blank" title="View Datasheet" style="margin-left:8px; color:var(--color-primary);"><i data-lucide="file-text" style="width:14px;height:14px;"></i></a>` : ''}
                </div>
                ${c.description ? `<div class="component-desc">${escapeHtml(c.description)}</div>` : ''}
                ${c.attributes && Object.keys(c.attributes).length > 0 ? 
                  `<div class="component-specs" style="font-size: 11px; margin-top: 4px; color: var(--color-primary);">
                    ${Object.entries(c.attributes).map(([k,v]) => `<strong>${k}:</strong> ${escapeHtml(v)}`).join(' | ')}
                   </div>` : ''}
              </div>
            </div>
          </td>
          <td>
            <span class="category-badge">
              <span class="category-dot" style="background:${catColor}"></span>
              ${escapeHtml(catName)}
            </span>
          </td>
          <td class="text-center">
            <span class="qty-badge ${qtyClass}">${c.quantity}</span>
          </td>
          <td class="text-center" style="color:var(--color-text-muted)">${c.minStock}</td>
          <td>
            ${c.location ? `<span class="location-text"><i data-lucide="map-pin"></i>${escapeHtml(c.location)}</span>` : '—'}
          </td>
          <td class="text-right">
            <span class="price-text">${c.purchasePrice ? 'PKR ' + c.purchasePrice.toLocaleString() : '—'}</span>
          </td>
          <td class="text-center">
            <div class="action-btns">
              <button class="action-btn action-btn--print" data-action="print" data-id="${c.id}" title="Print Label">
                <i data-lucide="printer"></i>
              </button>
              <button class="action-btn action-btn--edit" data-action="edit" data-id="${c.id}" title="Edit">
                <i data-lucide="pencil"></i>
              </button>
              <button class="action-btn action-btn--delete" data-action="delete" data-id="${c.id}" title="Delete">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    refreshIcons();
  },

  renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = state.categories.map(cat => {
      const count = state.components.filter(c => c.category === cat.id).length;
      const totalQty = state.components.filter(c => c.category === cat.id).reduce((s, c) => s + c.quantity, 0);
      return `
        <div class="category-card" style="--cat-color:${cat.color}">
          <div class="category-icon" style="background:${cat.color}">
            <i data-lucide="${cat.icon}"></i>
          </div>
          <div class="category-info">
            <h3>${escapeHtml(cat.name)}</h3>
            <div class="category-count">${count} item${count !== 1 ? 's' : ''} · ${totalQty} total units</div>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.category-card').forEach(card => {
      card.style.setProperty('--cat-color', card.style.getPropertyValue('--cat-color'));
      card.querySelector('::before')?.style?.setProperty('background', card.style.getPropertyValue('--cat-color'));
    });

    const style = document.createElement('style');
    style.textContent = state.categories.map((cat, i) =>
      `.category-card:nth-child(${i + 1})::before { background: ${cat.color}; }`
    ).join('\n');
    const oldStyle = document.getElementById('categoryBorderStyle');
    if (oldStyle) oldStyle.remove();
    style.id = 'categoryBorderStyle';
    document.head.appendChild(style);

    refreshIcons();
  },

  renderActivity() {
    const timeline = document.getElementById('activityTimeline');
    const empty = document.getElementById('emptyActivity');

    if (state.activity.length === 0) {
      timeline.style.display = 'none';
      empty.style.display = 'flex';
      refreshIcons();
      return;
    }

    timeline.style.display = '';
    empty.style.display = 'none';

    const groups = {};
    state.activity.forEach(a => {
      const date = new Date(a.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    });

    timeline.innerHTML = Object.entries(groups).map(([date, items]) => `
      <div class="timeline-date">${date}</div>
      ${items.map(a => {
        const actionText = a.action === 'added' ? 'Added' : a.action === 'updated' ? 'Updated' : 'Deleted';
        return `
          <div class="activity-item">
            <span class="activity-dot activity-dot--${a.action}"></span>
            <div class="activity-content">
              <div class="activity-text">
                <strong>${actionText}</strong> ${escapeHtml(a.componentName)}
                ${a.action !== 'deleted' ? ` — Qty: ${a.quantity}` : ''}
              </div>
              <div class="activity-time">${new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · ${a.platform}</div>
            </div>
          </div>
        `;
      }).join('')}
    `).join('');

    refreshIcons();
  },

  renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    if (!state.projects || state.projects.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><i data-lucide="briefcase" class="empty-icon"></i><p>No projects yet.</p><button class="btn btn-primary" onclick="UI.showProjectModal()">Create Project</button></div>`;
      refreshIcons();
      return;
    }
    
    grid.innerHTML = state.projects.map(p => {
      let canConsume = true;
      const itemsHtml = p.items.map(item => {
        const comp = state.components.find(c => c.id === item.componentId);
        if (!comp) return '';
        const hasEnough = comp.quantity >= item.requiredQty;
        if (!hasEnough) canConsume = false;
        return `
          <div style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid var(--border-color);">
            <span>${escapeHtml(comp.name)}</span>
            <span style="color: ${hasEnough ? 'var(--color-success)' : 'var(--color-danger)'}">${comp.quantity} / ${item.requiredQty}</span>
          </div>
        `;
      }).join('');
      
      return `
        <div class="card" style="display:flex; flex-direction:column;">
          <div class="card-header" style="display:flex; justify-content:space-between;">
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
            <button class="btn-icon btn-icon--danger" onclick="UI.deleteProject('${p.id}')"><i data-lucide="trash-2"></i></button>
          </div>
          <div style="padding:16px; flex:1;">
            <div style="margin-bottom:8px; font-weight:600; font-size:12px;">Requirements:</div>
            ${itemsHtml || '<p style="font-size:12px; color:var(--text-secondary);">No components added.</p>'}
          </div>
          <div style="padding:16px; border-top:1px solid var(--border-color);">
            <button class="btn btn-primary btn-full" ${!canConsume || p.items.length===0 ? 'disabled' : ''} onclick="UI.consumeProject('${p.id}')">
              <i data-lucide="check-circle"></i> Consume Parts
            </button>
          </div>
        </div>
      `;
    }).join('');
    refreshIcons();
  },

  deleteProject(id) {
    if(confirm('Delete this project?')) {
      state.projects = state.projects.filter(p => p.id !== id);
      Storage.saveProjects();
      UI.renderProjects();
      UI.showToast('Project deleted');
    }
  },

  consumeProject(id) {
    const p = state.projects.find(proj => proj.id === id);
    if (!p) return;
    if(confirm(`Deduct components for ${p.name}? This will permanently remove stock.`)) {
      p.items.forEach(item => {
        const comp = state.components.find(c => c.id === item.componentId);
        if (comp) {
          comp.quantity -= item.requiredQty;
          comp.lastUpdated = new Date().toISOString().split('T')[0];
        }
      });
      Storage.saveComponents();
      UI.renderProjects();
      UI.showToast('Stock consumed successfully', 'success');
    }
  },

  tempProjectItems: [],

  showProjectModal() {
    UI.tempProjectItems = [];
    document.getElementById('projName').value = '';
    
    // Populate select
    const select = document.getElementById('projAddComponent');
    select.innerHTML = '<option value="">Select component...</option>' + 
      state.components.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.quantity} in stock)</option>`).join('');
      
    UI.renderTempProjectItems();
    UI.showModal('projectModal');
  },

  addProjectItem() {
    const compId = document.getElementById('projAddComponent').value;
    const qty = parseInt(document.getElementById('projAddQty').value);
    if (!compId || qty < 1) return;
    
    const existing = UI.tempProjectItems.find(i => i.componentId === compId);
    if (existing) {
      existing.requiredQty += qty;
    } else {
      UI.tempProjectItems.push({ componentId: compId, requiredQty: qty });
    }
    
    document.getElementById('projAddComponent').value = '';
    document.getElementById('projAddQty').value = 1;
    UI.renderTempProjectItems();
  },

  removeProjectItem(index) {
    UI.tempProjectItems.splice(index, 1);
    UI.renderTempProjectItems();
  },

  renderTempProjectItems() {
    const tbody = document.getElementById('projItemsList');
    if (!tbody) return;
    tbody.innerHTML = UI.tempProjectItems.map((item, idx) => {
      const comp = state.components.find(c => c.id === item.componentId);
      if (!comp) return '';
      return `
        <tr>
          <td>${escapeHtml(comp.name)}</td>
          <td>${item.requiredQty}</td>
          <td>${comp.quantity}</td>
          <td><button class="btn-icon btn-icon--danger" onclick="UI.removeProjectItem(${idx})"><i data-lucide="x"></i></button></td>
        </tr>
      `;
    }).join('');
    refreshIcons();
  },

  saveProject() {
    const name = document.getElementById('projName').value.trim();
    if (!name) {
      UI.showToast('Please enter a project name', 'error');
      return;
    }
    
    const proj = {
      id: 'proj-' + Date.now(),
      name: name,
      items: [...UI.tempProjectItems],
      createdAt: new Date().toISOString()
    };
    
    state.projects.push(proj);
    Storage.saveProjects();
    UI.hideModal('projectModal');
    UI.renderProjects();
    UI.showToast('Project created', 'success');
  },

  // ---- MODALS ----
  showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      setTimeout(() => {
        const input = modal.querySelector('input:not([type="hidden"])');
        if (input) input.focus();
      }, 100);
    }
  },

  hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  },

  showComponentModal(componentId) {
    const isEdit = !!componentId;
    state.editingId = componentId || null;

    document.getElementById('componentModalTitle').textContent = isEdit ? 'Edit Component' : 'Add New Component';

    const catSelect = document.getElementById('compCategory');
    catSelect.innerHTML = '<option value="">Select category</option>' +
      state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const dynamicFields = document.getElementById('dynamicFields');
    dynamicFields.style.display = 'none';
    dynamicFields.innerHTML = '';

    if (isEdit) {
      const comp = state.components.find(c => c.id === componentId);
      if (!comp) return;
      document.getElementById('compName').value = comp.name;
      document.getElementById('compCategory').value = comp.category;
      document.getElementById('compQuantity').value = comp.quantity;
      document.getElementById('compMinStock').value = comp.minStock;
      document.getElementById('compLocation').value = comp.location || '';
      document.getElementById('compPrice').value = comp.purchasePrice || '';
      document.getElementById('compDatasheet').value = comp.datasheetUrl || '';
      document.getElementById('compSupplier').value = comp.supplier || '';
      document.getElementById('compTags').value = (comp.tags || []).join(', ');
      document.getElementById('compDescription').value = comp.description || '';
      document.getElementById('compImageUrl').value = comp.imageUrl || '';
      
      UI.renderDynamicFields(comp.category, comp.attributes || {});
    } else {
      document.getElementById('componentForm').reset();
      document.getElementById('compMinStock').value = '0';
    }

    UI.showModal('componentModal');
  },

  renderDynamicFields(categoryId, existingData = {}) {
    const container = document.getElementById('dynamicFields');
    if (!categoryId) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }
    
    const catName = Data.getCategoryName(categoryId).toLowerCase();
    let html = '';

    if (catName.includes('resistor')) {
      html = `
        <h4 style="margin-bottom:8px; font-size:12px; color:var(--color-text-muted); text-transform:uppercase;">Resistor Specifications</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Resistance Value (e.g. 10kΩ) OR Colors (e.g. RED RED BROWN GOLD)</label>
            <input type="text" id="attr_resistance" value="${escapeHtml(existingData.resistance || '')}" placeholder="Value or Color Bands" class="input">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Wattage Rating</label>
            <input type="text" id="attr_wattage" value="${escapeHtml(existingData.wattage || '')}" placeholder="e.g. 1/4W, 1W" class="input">
          </div>
        </div>
      `;
    } else if (catName.includes('capacitor')) {
      html = `
        <h4 style="margin-bottom:8px; font-size:12px; color:var(--color-text-muted); text-transform:uppercase;">Capacitor Specifications</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Capacitance</label>
            <input type="text" id="attr_capacitance" value="${escapeHtml(existingData.capacitance || '')}" placeholder="e.g. 100µF, 104" class="input">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Voltage Rating</label>
            <input type="text" id="attr_voltage" value="${escapeHtml(existingData.voltage || '')}" placeholder="e.g. 16V, 50V" class="input">
          </div>
        </div>
      `;
    } else if (catName.includes('led') || catName.includes('diode')) {
      html = `
        <h4 style="margin-bottom:8px; font-size:12px; color:var(--color-text-muted); text-transform:uppercase;">Diode/LED Specifications</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Forward Voltage / Color</label>
            <input type="text" id="attr_voltage" value="${escapeHtml(existingData.voltage || '')}" placeholder="e.g. 2.2V / Red" class="input">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Max Current</label>
            <input type="text" id="attr_current" value="${escapeHtml(existingData.current || '')}" placeholder="e.g. 20mA, 1A" class="input">
          </div>
        </div>
      `;
    } else {
      html = `
        <h4 style="margin-bottom:8px; font-size:12px; color:var(--color-text-muted); text-transform:uppercase;">General Specifications</h4>
        <div class="form-group" style="margin-bottom:0;">
          <label style="font-size:11px;">Rating / Package Type</label>
          <input type="text" id="attr_rating" value="${escapeHtml(existingData.rating || '')}" placeholder="e.g. 5V, DIP-8, SMD-0805" class="input">
        </div>
      `;
    }

    if (html) {
      container.innerHTML = html;
      container.style.display = 'block';
    } else {
      container.innerHTML = '';
      container.style.display = 'none';
    }
    
    // Auto-calculate logic if Resistor colors are typed
    const resInput = document.getElementById('attr_resistance');
    if (resInput) {
      resInput.addEventListener('blur', (e) => {
        const val = e.target.value.toUpperCase().trim();
        // Check if looks like colors (at least two words)
        if (val.split(' ').length >= 2 && !val.includes('Ω')) {
          const colors = val.split(' ');
          let b1 = ResistorCalc.findClosestColor(colors[0], 'digit');
          let b2 = ResistorCalc.findClosestColor(colors[1], 'digit');
          let b3 = colors[2] ? ResistorCalc.findClosestColor(colors[2], 'mult') : null;
          let b4 = colors[3] ? ResistorCalc.findClosestColor(colors[3], 'tol') : null;
          
          if (b1 && b2 && b3) {
            const d1 = ResistorCalc.COLORS[b1].val;
            const d2 = ResistorCalc.COLORS[b2].val;
            const mult = ResistorCalc.COLORS[b3].mult;
            let resistance = ((d1 * 10) + d2) * mult;
            let unit = 'Ω';
            if (resistance >= 1000000) { resistance /= 1000000; unit = 'MΩ'; }
            else if (resistance >= 1000) { resistance /= 1000; unit = 'kΩ'; }
            resistance = Math.round(resistance * 100) / 100;
            let tolStr = '';
            if (b4 && ResistorCalc.COLORS[b4].tol) tolStr = `±${ResistorCalc.COLORS[b4].tol}%`;
            
            // Auto correct input
            e.target.value = `${resistance} ${unit} ${tolStr}`;
            UI.showToast(`Auto-calculated from colors: ${b1} ${b2} ${b3} ${b4 || ''}`, 'info');
          }
        }
      });
    }
  },

  showDeleteModal(componentId) {
    state.deletingId = componentId;
    const comp = state.components.find(c => c.id === componentId);
    if (!comp) return;
    document.getElementById('deleteComponentName').textContent = comp.name;
    UI.showModal('deleteModal');
  },

  showQrPrintModal(componentId) {
    const comp = state.components.find(c => c.id === componentId);
    if (!comp) return;
    document.getElementById('qrPrintName').textContent = comp.name;
    const canvasContainer = document.getElementById('qrCodeCanvas');
    canvasContainer.innerHTML = ''; // clear previous
    if (typeof QRCode !== 'undefined') {
      new QRCode(canvasContainer, {
        text: comp.id,
        width: 128,
        height: 128
      });
    } else {
      canvasContainer.textContent = 'QR Library not loaded';
    }
    UI.showModal('qrPrintModal');
  },

  showQrScannerModal() {
    UI.showModal('qrScannerModal');
    if (typeof Html5QrcodeScanner !== 'undefined') {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", { fps: 10, qrbox: 250 }, false);
        
      html5QrcodeScanner.render((decodedText, decodedResult) => {
        // Stop scanning when found
        html5QrcodeScanner.clear();
        UI.hideModal('qrScannerModal');
        
        // Find component
        const comp = state.components.find(c => c.id === decodedText);
        if (comp) {
          UI.showToast(`Found ${comp.name}`, 'success');
          UI.showComponentModal(comp.id);
        } else {
          UI.showToast('Component not found in inventory', 'error');
        }
      }, (errorMessage) => {
        // parse error, ignore
      });

      // Cleanup if modal closes manually
      document.querySelector('[data-close="qrScannerModal"]').addEventListener('click', () => {
        try { html5QrcodeScanner.clear(); } catch(e){}
      }, { once: true });
    }
  },

  // ---- TOASTS ----
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// ============================================================
// RESISTOR CALCULATOR
// ============================================================
const ResistorCalc = {
  COLORS: {
    'BLACK':  { val: 0, mult: 1,           hex: '#000000', font: '#fff' },
    'BROWN':  { val: 1, mult: 10,          tol: 1,    hex: '#8B4513', font: '#fff' },
    'RED':    { val: 2, mult: 100,         tol: 2,    hex: '#FF0000', font: '#fff' },
    'ORANGE': { val: 3, mult: 1000,                   hex: '#FF8C00', font: '#000' },
    'YELLOW': { val: 4, mult: 10000,                  hex: '#FFD700', font: '#000' },
    'GREEN':  { val: 5, mult: 100000,      tol: 0.5,  hex: '#228B22', font: '#fff' },
    'BLUE':   { val: 6, mult: 1000000,     tol: 0.25, hex: '#0000FF', font: '#fff' },
    'VIOLET': { val: 7, mult: 10000000,    tol: 0.1,  hex: '#8B00FF', font: '#fff' },
    'GREY':   { val: 8, mult: 100000000,   tol: 0.05, hex: '#808080', font: '#fff' },
    'WHITE':  { val: 9, mult: 1000000000,             hex: '#FFFFFF', font: '#000' },
    'GOLD':   {         mult: 0.1,         tol: 5,    hex: '#D4AF37', font: '#000' },
    'SILVER': {         mult: 0.01,        tol: 10,   hex: '#C0C0C0', font: '#000' }
  },

  init() {
    ['calcBand1', 'calcBand2', 'calcBand3', 'calcBand4'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          e.target.value = e.target.value.toUpperCase(); // Force uppercase
          ResistorCalc.validateInput(e.target, i + 1);
        });
      }
    });

    document.getElementById('calcBtn')?.addEventListener('click', ResistorCalc.calculate);
    document.getElementById('calcClearBtn')?.addEventListener('click', () => {
      ['calcBand1', 'calcBand2', 'calcBand3', 'calcBand4'].forEach(id => {
        const el = document.getElementById(id);
        el.value = '';
        el.className = 'calc-input';
        document.getElementById(`calcHint${id.slice(-1)}`).textContent = '';
        document.getElementById(`calcHint${id.slice(-1)}`).className = 'calc-hint';
        document.getElementById(`bandVisual${id.slice(-1)}`).style.background = '#ddd';
      });
      document.getElementById('calcResultValue').textContent = '—';
      document.getElementById('calcResultTolerance').textContent = '';
    });
  },

  // Simple string similarity (Levenshtein distance simplified) to auto-correct colors
  findClosestColor(input, type) {
    if (!input) return null;
    let bestMatch = null;
    let minDistance = 3; // Max allowed typos

    for (const color of Object.keys(this.COLORS)) {
      // Filter out invalid colors for specific bands
      const data = this.COLORS[color];
      if (type === 'digit' && data.val === undefined) continue;
      if (type === 'mult' && data.mult === undefined) continue;
      if (type === 'tol' && data.tol === undefined) continue;

      let distance = 0;
      const len = Math.max(input.length, color.length);
      for (let i = 0; i < len; i++) {
        if (input[i] !== color[i]) distance++;
      }
      
      // If substring matches start, favor it highly
      if (color.startsWith(input) && input.length >= 3) {
        return color;
      }

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = color;
      }
    }
    return bestMatch;
  },

  validateInput(inputEl, bandIndex) {
    const val = inputEl.value.trim();
    const hintEl = document.getElementById(`calcHint${bandIndex}`);
    const visualEl = document.getElementById(`bandVisual${bandIndex}`);
    
    inputEl.className = 'calc-input';
    hintEl.className = 'calc-hint';
    hintEl.textContent = '';
    
    if (!val) {
      visualEl.style.background = '#ddd';
      return null;
    }

    let type = 'digit';
    if (bandIndex === 3) type = 'mult';
    if (bandIndex === 4) type = 'tol';

    const exactMatch = this.COLORS[val];
    let isValidExact = exactMatch && 
      ((type === 'digit' && exactMatch.val !== undefined) ||
       (type === 'mult' && exactMatch.mult !== undefined) ||
       (type === 'tol' && exactMatch.tol !== undefined));

    if (isValidExact) {
      inputEl.classList.add('valid');
      visualEl.style.background = exactMatch.hex;
      return val;
    } else {
      // Try to auto-correct
      const closest = this.findClosestColor(val, type);
      if (closest) {
        inputEl.classList.add('invalid');
        hintEl.classList.add('suggestion');
        hintEl.textContent = `Did you mean ${closest}?`;
        // Don't color visual yet if it's just a suggestion
        return null; 
      } else {
        inputEl.classList.add('invalid');
        hintEl.classList.add('error');
        hintEl.textContent = 'Invalid color';
        return null;
      }
    }
  },

  calculate() {
    const b1Str = document.getElementById('calcBand1').value.trim();
    const b2Str = document.getElementById('calcBand2').value.trim();
    const b3Str = document.getElementById('calcBand3').value.trim();
    const b4Str = document.getElementById('calcBand4').value.trim();

    // Auto-correct if they hit calculate while there are suggestions
    const bands = [b1Str, b2Str, b3Str, b4Str].map((b, i) => {
      const type = i < 2 ? 'digit' : (i === 2 ? 'mult' : 'tol');
      const data = ResistorCalc.COLORS[b];
      const isValid = data && (
        (type === 'digit' && data.val !== undefined) ||
        (type === 'mult' && data.mult !== undefined) ||
        (type === 'tol' && data.tol !== undefined)
      );
      
      if (!isValid && b) {
        const closest = ResistorCalc.findClosestColor(b, type);
        if (closest) {
          const el = document.getElementById(`calcBand${i+1}`);
          el.value = closest;
          ResistorCalc.validateInput(el, i+1);
          return closest;
        }
      }
      return b;
    });

    if (!bands[0] || !bands[1] || !bands[2]) {
      UI.showToast('Please enter at least the first 3 bands', 'warning');
      return;
    }

    const d1 = ResistorCalc.COLORS[bands[0]].val;
    const d2 = ResistorCalc.COLORS[bands[1]].val;
    const mult = ResistorCalc.COLORS[bands[2]].mult;
    
    let resistance = ((d1 * 10) + d2) * mult;
    
    // Format output
    let unit = 'Ω';
    if (resistance >= 1000000) {
      resistance = resistance / 1000000;
      unit = 'MΩ';
    } else if (resistance >= 1000) {
      resistance = resistance / 1000;
      unit = 'kΩ';
    }

    // Fix floating point issues
    resistance = Math.round(resistance * 100) / 100;

    let tolStr = '';
    if (bands[3]) {
      const tol = ResistorCalc.COLORS[bands[3]].tol;
      if (tol) tolStr = `±${tol}%`;
    }

    document.getElementById('calcResultValue').textContent = `${resistance} ${unit}`;
    document.getElementById('calcResultTolerance').textContent = tolStr;
  }
};

// ============================================================
// CHARTS
// ============================================================
const Charts = {
  init() {
    if (typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#64748B';
    const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)';

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = textColor;

    // Category Doughnut Chart
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
      if (state.charts.category) state.charts.category.destroy();
      const catData = state.categories.map(cat => ({
        label: cat.name,
        count: state.components.filter(c => c.category === cat.id).length,
        color: cat.color
      })).filter(d => d.count > 0);

      state.charts.category = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: catData.map(d => d.label),
          datasets: [{
            data: catData.map(d => d.count),
            backgroundColor: catData.map(d => d.color),
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 } } }
        }
      });
    }

    // Stock Bar Chart
    const stockCtx = document.getElementById('stockChart');
    if (stockCtx) {
      if (state.charts.stock) state.charts.stock.destroy();
      const stockData = state.components.slice(0, 10).map(c => ({
        name: c.name.length > 18 ? c.name.substring(0, 18) + '…' : c.name,
        qty: c.quantity,
        min: c.minStock,
        color: c.quantity <= c.minStock ? '#DC2626' : '#059669'
      }));

      state.charts.stock = new Chart(stockCtx, {
        type: 'bar',
        data: {
          labels: stockData.map(d => d.name),
          datasets: [
            {
              label: 'Current Stock',
              data: stockData.map(d => d.qty),
              backgroundColor: stockData.map(d => d.color + '40'),
              borderColor: stockData.map(d => d.color),
              borderWidth: 2,
              borderRadius: 4,
              barPercentage: 0.6
            },
            {
              label: 'Min Stock',
              data: stockData.map(d => d.min),
              backgroundColor: 'transparent',
              borderColor: '#F59E0B',
              borderWidth: 2,
              borderDash: [5, 5],
              borderRadius: 4,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { precision: 0 } }
          },
          plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 } } }
        }
      });
    }
  },
  update() { Charts.init(); }
};

// ============================================================
// EVENT HANDLERS
// ============================================================
const Handlers = {
  init() {
    // --- Auth Handlers ---
    document.getElementById('authForm')?.addEventListener('submit', Auth.handleEmailSubmit);
    document.getElementById('authToggle')?.addEventListener('click', Auth.toggleAuthMode);
    
    // OTP Modal
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });
    
    document.getElementById('verifyOtpBtn')?.addEventListener('click', Auth.verifyOTP);
    document.getElementById('resendOtpBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      UI.showToast('New OTP sent (Hint: 123456)', 'info');
    });

    // --- Logout ---
    document.getElementById('logoutBtn')?.addEventListener('click', Auth.logout);

    // --- Component Actions ---
    document.getElementById('compCategory')?.addEventListener('change', (e) => {
      UI.renderDynamicFields(e.target.value);
    });

    document.getElementById('addComponentBtn')?.addEventListener('click', () => {
      UI.showComponentModal();
    });

    document.getElementById('componentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const attributes = {};
      const attrInputs = document.querySelectorAll('#dynamicFields input');
      attrInputs.forEach(input => {
        const key = input.id.replace('attr_', '');
        if (input.value.trim()) {
          attributes[key] = input.value.trim();
        }
      });

      const comp = {
        name: document.getElementById('compName').value.trim(),
        category: document.getElementById('compCategory').value,
        quantity: parseInt(document.getElementById('compQuantity').value) || 0,
        minStock: parseInt(document.getElementById('compMinStock').value) || 0,
        location: document.getElementById('compLocation').value.trim(),
        purchasePrice: parseFloat(document.getElementById('compPrice').value) || 0,
        supplier: document.getElementById('compSupplier').value.trim(),
        tags: document.getElementById('compTags').value.split(',').map(t => t.trim()).filter(Boolean),
        description: document.getElementById('compDescription').value.trim(),
        imageUrl: document.getElementById('compImageUrl').value.trim(),
        datasheetUrl: document.getElementById('compDatasheet').value.trim(),
        attributes: attributes
      };

      if (!comp.name || !comp.category) {
        UI.showToast('Please fill in all required fields', 'error');
        return;
      }

      if (state.editingId) {
        Data.updateComponent(state.editingId, comp);
        UI.showToast(`${comp.name} updated successfully`, 'success');
      } else {
        Data.addComponent(comp);
        UI.showToast(`${comp.name} added to inventory`, 'success');
      }

      UI.hideModal('componentModal');
      state.editingId = null;
      UI.switchView(state.currentView);
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
      if (state.deletingId) {
        const comp = state.components.find(c => c.id === state.deletingId);
        Data.deleteComponent(state.deletingId);
        UI.hideModal('deleteModal');
        UI.showToast(`${comp?.name || 'Component'} deleted`, 'warning');
        state.deletingId = null;
        UI.switchView(state.currentView);
      }
    });

    document.querySelector('.main-content')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      const printBtn = e.target.closest('[data-action="print"]');
      if (editBtn) UI.showComponentModal(editBtn.dataset.id);
      if (deleteBtn) UI.showDeleteModal(deleteBtn.dataset.id);
      if (printBtn) UI.showQrPrintModal(printBtn.dataset.id);
    });

    document.getElementById('scanQrBtn')?.addEventListener('click', () => {
      UI.showQrScannerModal();
    });

    document.getElementById('printQrBtn')?.addEventListener('click', () => {
      const printContent = document.getElementById('qrPrintArea').innerHTML;
      const printWindow = window.open('', '_blank', 'width=400,height=400');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label</title>
            <style>
              body { font-family: sans-serif; text-align: center; margin: 0; padding: 20px; }
              h3 { margin: 0 0 10px 0; font-size: 16px; }
              img { display: block; margin: 0 auto; max-width: 100%; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    });

    // --- Navigation ---
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        UI.switchView(link.dataset.view);
      });
    });

    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebarOverlay')?.classList.toggle('active');
    });

    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebarOverlay')?.classList.remove('active');
    });

    // --- Theme toggle ---
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      Storage.set(CONFIG.STORAGE.THEME, next);
      const icon = document.getElementById('themeIcon');
      if (icon) {
        icon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
        refreshIcons();
      }
      if (state.currentView === 'dashboard') Charts.update();
    });

    // --- Global search ---
    document.getElementById('globalSearch')?.addEventListener('input', debounce((e) => {
      state.searchQuery = e.target.value.trim();
      if (state.currentView !== 'inventory') UI.switchView('inventory');
      else UI.renderInventory();
      const invSearch = document.getElementById('inventorySearch');
      if (invSearch) invSearch.value = state.searchQuery;
    }, 250));

    document.getElementById('inventorySearch')?.addEventListener('input', debounce((e) => {
      state.searchQuery = e.target.value.trim();
      UI.renderInventory();
    }, 250));

    document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      UI.renderInventory();
    });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      UI.renderInventory();
    });

    document.getElementById('exportBtn')?.addEventListener('click', exportCSV);
    
    document.getElementById('importBtn')?.addEventListener('click', () => {
      document.getElementById('importCsv')?.click();
    });
    document.getElementById('importCsv')?.addEventListener('change', importCSV);

    // --- Modals ---
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => UI.hideModal(btn.dataset.close));
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && overlay.id !== 'otpModal' && overlay.id !== 'verifyEmailModal') {
          overlay.classList.remove('active');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
          if (m.id !== 'otpModal' && m.id !== 'verifyEmailModal') m.classList.remove('active');
        });
      }
    });
  }
};

// ============================================================
// UTILITIES
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    try { lucide.createIcons(); } catch (e) { /* ignore */ }
  }
}

function exportCSV() {
  const components = Data.getFilteredComponents();
  if (components.length === 0) {
    UI.showToast('No components to export', 'warning');
    return;
  }
  const headers = ['Name', 'Category', 'Quantity', 'Min Stock', 'Location', 'Price (PKR)', 'Supplier', 'Description', 'Tags', 'Date Added'];
  const rows = components.map(c => [
    c.name, Data.getCategoryName(c.category), c.quantity, c.minStock, c.location, c.purchasePrice, c.supplier, c.description, (c.tags || []).join('; '), c.dateAdded
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `electroparts_inventory_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  UI.showToast(`Exported ${components.length} components to CSV`, 'success');
}

function importCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      UI.showToast('CSV is empty or invalid', 'error');
      return;
    }
    
    let imported = 0;
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      // Basic CSV parser (handles simple quoted fields)
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
      if (row.length < 3) continue; // Need at least Name, Category, Qty
      
      const name = row[0];
      const categoryName = row[1];
      let catId = state.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())?.id;
      if (!catId) catId = 'cat-7'; // Default to Passives if not found
      
      const quantity = parseInt(row[2]) || 0;
      const minStock = parseInt(row[3]) || 0;
      const location = row[4] || '';
      const price = parseFloat(row[5]) || 0;
      const supplier = row[6] || '';
      const desc = row[7] || '';
      const tags = (row[8] || '').split(';').map(t => t.trim()).filter(Boolean);
      
      const comp = {
        id: 'comp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: name,
        category: catId,
        quantity: quantity,
        minStock: minStock,
        location: location,
        purchasePrice: price,
        supplier: supplier,
        description: desc,
        tags: tags,
        dateAdded: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      state.components.push(comp);
      imported++;
    }
    
    if (imported > 0) {
      Storage.saveComponents();
      Data.logActivity('imported', imported + ' components via CSV', imported);
      UI.renderInventory();
      UI.updateDashboard();
      UI.showToast(`Successfully imported ${imported} components!`, 'success');
    }
    
    // Reset file input
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  const savedTheme = Storage.get(CONFIG.STORAGE.THEME);
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.setAttribute('data-lucide', savedTheme === 'dark' ? 'sun' : 'moon');
  }

  Auth.init();
  Data.initSampleData();
  Storage.loadAll();
  Handlers.init();
  refreshIcons();

  console.log('⚡ ElectroParts IMS initialized');
}

// START APP
document.addEventListener('DOMContentLoaded', init);
window.UI = UI;