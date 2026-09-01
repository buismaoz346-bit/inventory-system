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
  { id: 'cat-4', name: 'LEDs & Indicators', color: '#F59E0B', icon: 'lightbulb' },
  { id: 'cat-5', name: 'Sensors', color: '#F97316', icon: 'thermometer' },
  { id: 'cat-6', name: 'Connectors & Terminals', color: '#EF4444', icon: 'plug' },
  { id: 'cat-7', name: 'Passive Components', color: '#14B8A6', icon: 'disc' },
  { id: 'cat-8', name: 'Development Boards', color: '#6366F1', icon: 'circuit-board' },
  { id: 'cat-9', name: 'Motors & Actuators', color: '#EC4899', icon: 'fan' },
  { id: 'cat-10', name: 'Wires & Cables', color: '#F43F5E', icon: 'cable' },
  { id: 'cat-11', name: 'Gears & Mechanical', color: '#64748B', icon: 'settings' },
  { id: 'cat-12', name: 'Chemicals & Materials', color: '#06B6D4', icon: 'flask-conical' },
  { id: 'cat-13', name: 'Power & Batteries', color: '#84CC16', icon: 'battery' },
  { id: 'cat-14', name: 'Switches & Relays', color: '#A855F7', icon: 'toggle-left' },
  { id: 'cat-15', name: 'PCBs & Prototyping', color: '#10B981', icon: 'grid' },
  { id: 'cat-16', name: 'Fasteners & Hardware', color: '#64748B', icon: 'paperclip' },
  { id: 'cat-17', name: 'Tools & Equipment', color: '#F59E0B', icon: 'wrench' },
  { id: 'cat-18', name: 'Enclosures & Cases', color: '#3B82F6', icon: 'box' },
  { id: 'cat-19', name: 'Audio & Acoustics', color: '#EC4899', icon: 'volume-2' },
  { id: 'cat-20', name: 'RF & Wireless', color: '#6366F1', icon: 'radio' },
  { id: 'cat-21', name: 'Optoelectronics', color: '#14B8A6', icon: 'eye' },
  { id: 'cat-22', name: 'Diodes & Rectifiers', color: '#F43F5E', icon: 'fast-forward' },
  { id: 'cat-23', name: 'Transistors & Thyristors', color: '#8B5CF6', icon: 'share-2' },
  { id: 'cat-24', name: 'Protective Components', color: '#EF4444', icon: 'shield-alert' },
  { id: 'cat-25', name: 'Thermal Management', color: '#06B6D4', icon: 'snowflake' },
  { id: 'cat-26', name: 'Memory & Storage', color: '#3B82F6', icon: 'hard-drive' },
  { id: 'cat-27', name: 'Displays & Screens', color: '#10B981', icon: 'monitor' },
  { id: 'cat-28', name: 'Crystals & Oscillators', color: '#F59E0B', icon: 'activity' },
  { id: 'cat-29', name: 'Modules & Breakout Boards', color: '#A855F7', icon: 'layers' },
  { id: 'cat-30', name: 'Magnetics & Ferrites', color: '#EF4444', icon: 'magnet' },
  { id: 'cat-31', name: 'Optics & Lenses', color: '#84CC16', icon: 'camera' },
  { id: 'cat-32', name: 'Test & Measurement', color: '#F97316', icon: 'ruler' }
];

const SAMPLE_COMPONENTS = [];

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
      firebase.database().ref('users/' + uid).on('value', snap => {
        const data = snap.val();
        if (!data) {
          // Cloud is completely empty (new account). Upload local offline data to cloud!
          state.components = Storage.get(CONFIG.STORAGE.COMPONENTS) || [];
          state.categories = Storage.get(CONFIG.STORAGE.CATEGORIES) || [...DEFAULT_CATEGORIES];
          state.activity = Storage.get(CONFIG.STORAGE.ACTIVITY) || [];
          state.projects = Storage.get(CONFIG.STORAGE.PROJECTS) || [];
          Storage.saveComponents();
          Storage.saveCategories();
          Storage.saveActivity();
          Storage.saveProjects();
        } else {
          state.components = data.components || [];
          const cloudCats = data.categories || [];
            state.categories = [...DEFAULT_CATEGORIES];
            cloudCats.forEach(lc => { const idx = state.categories.findIndex(c => c.id === lc.id); if (idx >= 0) state.categories[idx] = lc; else state.categories.push(lc); });
          state.activity = data.activity || [];
          state.projects = data.projects || [];
        }
        UI.switchView(state.currentView);
      }, (error) => {
        console.error("Firebase Sync Error:", error);
        UI.showToast("Cloud Sync Blocked! Please check your Firebase Database Rules.", 'error');
      });
    } else {
      state.components = Storage.get(CONFIG.STORAGE.COMPONENTS) || [];
      const localCats = Storage.get(CONFIG.STORAGE.CATEGORIES) || [];
        state.categories = [...DEFAULT_CATEGORIES];
        localCats.forEach(lc => { const idx = state.categories.findIndex(c => c.id === lc.id); if (idx >= 0) state.categories[idx] = lc; else state.categories.push(lc); });
      state.activity = Storage.get(CONFIG.STORAGE.ACTIVITY) || [];
      state.projects = Storage.get(CONFIG.STORAGE.PROJECTS) || [];
    }
  },
  saveComponents() { 
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/components').set(state.components).catch(e => UI.showToast("Save failed: Check Database Rules", 'error'));
    }
    Storage.set(CONFIG.STORAGE.COMPONENTS, state.components);
  },
  saveCategories() { 
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/categories').set(state.categories).catch(e => UI.showToast("Save failed: Check Database Rules", 'error'));
    }
    Storage.set(CONFIG.STORAGE.CATEGORIES, state.categories); 
  },
  saveActivity() { 
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/activity').set(state.activity).catch(e => UI.showToast("Save failed: Check Database Rules", 'error'));
    }
    Storage.set(CONFIG.STORAGE.ACTIVITY, state.activity); 
  },
  saveProjects() {
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/projects').set(state.projects).catch(e => UI.showToast("Save failed: Check Database Rules", 'error'));
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
      
      // Make sure session persists!
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log("Firebase persistence set to LOCAL");
        })
        .catch((error) => {
          console.error("Error setting persistence:", error);
        });

      // Firebase Auth State Observer
      firebase.auth().onAuthStateChanged(user => {
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
      document.getElementById('googleSignInBtn').onclick = async () => {
        try {
          if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            const { FirebaseAuthentication } = Capacitor.Plugins;
            const result = await FirebaseAuthentication.signInWithGoogle();
            console.log('Native Google login success', result);
            
            // Pass the native Google token to our Firebase Web SDK so it logs us in!
            const credential = firebase.auth.GoogleAuthProvider.credential(result.credential.idToken, result.credential.accessToken);
            await firebase.auth().signInWithCredential(credential);
          } else {
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);
          }
        } catch (err) {
          document.getElementById('authError').textContent = err.message || 'Login failed';
        }
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

  async logout() {
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED) {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try { await Capacitor.Plugins.FirebaseAuthentication.signOut(); } catch(e) {}
      }
      firebase.auth().signOut().then(() => {
        localStorage.removeItem(CONFIG.STORAGE.COMPONENTS);
        localStorage.removeItem(CONFIG.STORAGE.CATEGORIES);
        localStorage.removeItem(CONFIG.STORAGE.PROJECTS);
        localStorage.removeItem(CONFIG.STORAGE.ACTIVITY);
        localStorage.removeItem(CONFIG.STORAGE.INITIALIZED);
        location.reload();
      });
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
      case 'map': UI.renderMap(); break;
      case 'activity': UI.renderActivity(); break;
      case 'tools': if(window.Tools) Tools.render(); break;
    }

    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
  },

  renderMap() {
    const grid = document.getElementById('mapGrid');
    if (!grid) return;
    
    // Extract unique locations, filter out empty ones
    const locations = {};
    state.components.forEach(c => {
      let loc = (c.location || '').trim();
      if (!loc) loc = 'Unassigned';
      if (!locations[loc]) locations[loc] = [];
      locations[loc].push(c);
    });
    
    const sortedLocs = Object.keys(locations).sort((a,b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });
    
    grid.innerHTML = sortedLocs.map(loc => {
      const comps = locations[loc];
      const itemsHtml = comps.slice(0, 5).map(c => `<div style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">• ${escapeHtml(c.name)}</div>`).join('');
      const moreHtml = comps.length > 5 ? `<div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">+ ${comps.length - 5} more</div>` : '';
      
      return `
        <div class="card" style="width:200px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'" onclick="UI.filterInventoryByLocation('${escapeHtml(loc)}')">
          <div class="card-header" style="background:var(--color-surface-hover); border-bottom:1px solid var(--border-color); padding:12px;">
            <h3 class="card-title" style="display:flex; align-items:center; gap:8px;"><i data-lucide="box" style="width:16px;"></i> ${escapeHtml(loc)}</h3>
          </div>
          <div style="padding:12px;">
            <div style="margin-bottom:8px; font-weight:600; font-size:12px;">${comps.length} Item(s)</div>
            ${itemsHtml}
            ${moreHtml}
          </div>
        </div>
      `;
    }).join('');
    refreshIcons();
  },

  filterInventoryByLocation(loc) {
    if (loc === 'Unassigned') loc = '^$'; // regex to match empty
    else loc = `^${loc}$`;
    
    UI.switchView('inventory');
    const invSearch = document.getElementById('inventorySearch');
    if (invSearch) {
      invSearch.value = `loc:${loc}`;
      state.searchQuery = `loc:${loc}`;
      UI.renderInventory();
    }
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

  renderInventory(bypassFilterRecalc = false) {
    if (!bypassFilterRecalc) {
      state.filteredComponents = Data.getFilteredComponents();
    }
    const filtered = state.filteredComponents;
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
            <div style="display:flex; align-items:center; justify-content:center; gap: 4px;">
              <button class="action-btn" data-action="quick-dec" data-id="${c.id}" style="width: 20px; height: 20px; padding: 0;"><i data-lucide="minus" style="width: 12px;"></i></button>
              <span class="qty-badge ${qtyClass}" style="min-width: 30px;">${c.quantity}</span>
              <button class="action-btn" data-action="quick-inc" data-id="${c.id}" style="width: 20px; height: 20px; padding: 0;"><i data-lucide="plus" style="width: 12px;"></i></button>
            </div>
            ${c.faultyQuantity ? `<br><span class="qty-badge qty-badge--warning" style="margin-top: 4px; font-size: 10px;">${c.faultyQuantity} faulty</span>` : ''}
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
              <button class="action-btn" data-action="duplicate" data-id="${c.id}" title="Duplicate" style="color:var(--color-primary);">
                <i data-lucide="copy"></i>
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
      document.getElementById('compFaultyQuantity').value = comp.faultyQuantity || 0;
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
    if (typeof JsBarcode !== 'undefined') {
      JsBarcode('#barcodeCanvas', comp.id, {
        format: 'CODE128',
        lineColor: '#000',
        width: 2,
        height: 60,
        displayValue: true
      });
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
          faultyQuantity: parseInt(document.getElementById('compFaultyQuantity').value) || 0,
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
        UI.showToast(comp?.name + ' deleted', 'warning');
        state.deletingId = null;
        UI.switchView(state.currentView);
      }
    });

    document.querySelector('.main-content')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-action="edit"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      const printBtn = e.target.closest('[data-action="print"]');
      const incBtn = e.target.closest('[data-action="quick-inc"]');
      const decBtn = e.target.closest('[data-action="quick-dec"]');
      const dupBtn = e.target.closest('[data-action="duplicate"]');
      
      if (editBtn) UI.showComponentModal(editBtn.dataset.id);
      if (deleteBtn) UI.showDeleteModal(deleteBtn.dataset.id);
      if (printBtn) UI.showQrPrintModal(printBtn.dataset.id);

      if (dupBtn) {
        const orig = state.components.find(c => c.id === dupBtn.dataset.id);
        if (orig) {
          const clone = JSON.parse(JSON.stringify(orig));
          clone.id = 'comp-' + Math.random().toString(36).substr(2, 5) + '-' + Date.now().toString(36);
          clone.name = orig.name + ' (Copy)';
          clone.dateAdded = new Date().toISOString().split('T')[0];
          clone.lastUpdated = clone.dateAdded;
          state.components.push(clone);
          Storage.saveComponents();
          Data.logActivity('added', clone);
          UI.renderInventory();
          UI.showComponentModal(clone.id);
          UI.showToast(`Duplicated "${orig.name}" — edit the copy now!`, 'success');
        }
      }
      
      if (incBtn) {
        const comp = state.components.find(c => c.id === incBtn.dataset.id);
        if (comp) {
          comp.quantity++;
          Storage.saveComponents();
          UI.renderInventory();
        }
      }
      if (decBtn) {
        const comp = state.components.find(c => c.id === decBtn.dataset.id);
        if (comp && comp.quantity > 0) {
          comp.quantity--;
          Storage.saveComponents();
          UI.renderInventory();
        }
      }
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
    
    document.getElementById('forceSyncBtn')?.addEventListener('click', () => {
      // Force save local state to cloud and local storage
      if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && firebase.auth().currentUser) {
        Storage.saveComponents();
        Storage.saveCategories();
        Storage.saveProjects();
        UI.showToast('Data forcefully synced to cloud!', 'success');
      } else {
        UI.showToast('Cannot sync: Not connected to cloud', 'error');
      }
    });

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

// ============================================================
// COMMAND PALETTE (Ctrl+K)
// ============================================================
const CommandPalette = {
  selectedIndex: -1,
  results: [],

  open() {
    const overlay = document.getElementById('cmdPaletteOverlay');
    overlay.style.display = 'flex';
    const input = document.getElementById('cmdPaletteInput');
    input.value = '';
    input.focus();
    this.selectedIndex = -1;
    this.renderDefault();
    refreshIcons();
  },

  close() {
    document.getElementById('cmdPaletteOverlay').style.display = 'none';
  },

  toggle() {
    const overlay = document.getElementById('cmdPaletteOverlay');
    if (overlay.style.display === 'none' || overlay.style.display === '') {
      this.open();
    } else {
      this.close();
    }
  },

  getActions() {
    return [
      { type: 'action', icon: 'plus', label: 'Add New Component', action: () => UI.showComponentModal() },
      { type: 'action', icon: 'scan', label: 'Scan Barcode', action: () => UI.showQrScannerModal() },
      { type: 'action', icon: 'download', label: 'Export CSV', action: () => document.getElementById('exportBtn')?.click() },
      { type: 'action', icon: 'upload', label: 'Import CSV', action: () => document.getElementById('importBtn')?.click() },
      { type: 'action', icon: 'refresh-cw', label: 'Force Sync', action: () => document.getElementById('forceSyncBtn')?.click() },
      { type: 'action', icon: 'moon', label: 'Toggle Theme', action: () => document.getElementById('themeToggle')?.click() },
      { type: 'view', icon: 'layout-dashboard', label: 'Go to Dashboard', action: () => UI.switchView('dashboard') },
      { type: 'view', icon: 'package', label: 'Go to Inventory', action: () => UI.switchView('inventory') },
      { type: 'view', icon: 'briefcase', label: 'Go to Projects (BOM)', action: () => UI.switchView('projects') },
      { type: 'view', icon: 'tags', label: 'Go to Categories', action: () => UI.switchView('categories') },
      { type: 'view', icon: 'map', label: 'Go to Location Map', action: () => UI.switchView('map') },
      { type: 'view', icon: 'history', label: 'Go to Activity Log', action: () => UI.switchView('activity') },
      { type: 'view', icon: 'wrench', label: 'Go to Engineering Tools', action: () => UI.switchView('tools') },
    ];
  },

  search(query) {
    if (!query.trim()) {
      this.renderDefault();
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search components
    state.components.forEach(c => {
      const searchStr = `${c.name} ${c.description || ''} ${c.location || ''} ${c.supplier || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
      if (searchStr.includes(q)) {
        results.push({
          type: 'component',
          icon: Data.getCategoryIcon(c.category),
          label: c.name,
          sublabel: `${Data.getCategoryName(c.category)} · Qty: ${c.quantity}${c.location ? ' · ' + c.location : ''}`,
          action: () => { UI.switchView('inventory'); UI.showComponentModal(c.id); }
        });
      }
    });

    // Search actions & views
    this.getActions().forEach(a => {
      if (a.label.toLowerCase().includes(q)) {
        results.push(a);
      }
    });

    this.results = results;
    this.selectedIndex = results.length > 0 ? 0 : -1;
    this.renderResults();
  },

  renderDefault() {
    const actions = this.getActions();
    this.results = actions;
    this.selectedIndex = -1;
    this.renderResults();
  },

  renderResults() {
    const container = document.getElementById('cmdPaletteResults');
    if (this.results.length === 0) {
      container.innerHTML = '<div class="cmd-palette-empty">No results found</div>';
      return;
    }

    const grouped = {};
    this.results.forEach(r => {
      const group = r.type === 'component' ? 'Components' : r.type === 'view' ? 'Navigation' : 'Actions';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(r);
    });

    let html = '';
    let globalIdx = 0;
    for (const [group, items] of Object.entries(grouped)) {
      html += `<div class="cmd-palette-group">${group}</div>`;
      items.forEach(item => {
        const isSelected = globalIdx === this.selectedIndex;
        html += `<div class="cmd-palette-item ${isSelected ? 'cmd-palette-item--selected' : ''}" data-index="${globalIdx}">
          <i data-lucide="${item.icon}"></i>
          <div class="cmd-palette-item-text">
            <span class="cmd-palette-item-label">${escapeHtml(item.label)}</span>
            ${item.sublabel ? `<span class="cmd-palette-item-sublabel">${escapeHtml(item.sublabel)}</span>` : ''}
          </div>
          ${item.type === 'component' ? '<kbd>Edit</kbd>' : item.type === 'view' ? '<kbd>Go</kbd>' : '<kbd>Run</kbd>'}
        </div>`;
        globalIdx++;
      });
    }

    container.innerHTML = html;
    refreshIcons();

    // Click handlers
    container.querySelectorAll('.cmd-palette-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        if (this.results[idx]) {
          this.results[idx].action();
          this.close();
        }
      });
    });
  },

  navigate(direction) {
    if (this.results.length === 0) return;
    this.selectedIndex += direction;
    if (this.selectedIndex < 0) this.selectedIndex = this.results.length - 1;
    if (this.selectedIndex >= this.results.length) this.selectedIndex = 0;
    this.renderResults();
    
    // Scroll selected into view
    const selected = document.querySelector('.cmd-palette-item--selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  },

  execute() {
    if (this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
      this.results[this.selectedIndex].action();
      this.close();
    }
  }
};

// Command Palette keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+K or Cmd+K to toggle
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    CommandPalette.toggle();
    return;
  }

  const overlay = document.getElementById('cmdPaletteOverlay');
  if (overlay.style.display === 'none' || overlay.style.display === '') return;

  if (e.key === 'Escape') {
    e.preventDefault();
    CommandPalette.close();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    CommandPalette.navigate(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    CommandPalette.navigate(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    CommandPalette.execute();
  }
});

// Command Palette input handler
document.getElementById('cmdPaletteInput')?.addEventListener('input', (e) => {
  CommandPalette.search(e.target.value);
});

// Click outside to close
document.getElementById('cmdPaletteOverlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) CommandPalette.close();
});

window.CommandPalette = CommandPalette;

// ============================================================
// AI INTEGRATIONS (Gemini API)
// ============================================================
const AI = {
  getApiKey() {
    let key = Storage.get('gemini_api_key');
    if (!key) {
      key = prompt("Please enter your Gemini API Key to use real AI features:\n\n(Or leave blank and click OK to use Demo Mode for portfolio viewing)");
      if (key && key.trim()) {
        Storage.set('gemini_api_key', key.trim());
      } else {
        UI.showToast("Running in AI Demo Mode", "info");
        return "DEMO_MODE";
      }
    }
    return key;
  },

  async callGemini(promptText, imageBase64 = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    UI.showToast("Asking AI... Please wait.", "info");

    // ============================================
    // DEMO MODE FOR RECRUITERS / PORTFOLIO VIEWERS
    // ============================================
    if (apiKey === "DEMO_MODE") {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (promptText.includes("match it against the inventory")) {
            const allIds = state.components.map(c => c.id);
            resolve(JSON.stringify(allIds.length > 0 ? [allIds[0]] : []));
          } else if (promptText.includes("Identify the electronic component")) {
            resolve(JSON.stringify({
              name: "Demo IC (LM555 Timer)",
              category: "ICs",
              description: "Standard 555 timer IC identified in demo mode.",
              tags: ["timing", "oscillator", "DIP-8"]
            }));
          } else {
            resolve("[]");
          }
        }, 1500); 
      });
    }

    const endpoint = imageBase64 
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let contents = [];
    
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'));
      
      contents = [{
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }];
    } else {
      contents = [{ parts: [{ text: promptText }] }];
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents })
      });

      const data = await response.json();
      
      if (data.error) {
        if (data.error.code === 400 && data.error.message.includes("API key not valid")) {
           Storage.set('gemini_api_key', null);
           UI.showToast("Invalid API Key. Please try again.", "error");
        } else {
           UI.showToast(`AI Error: ${data.error.message}`, "error");
        }
        return null;
      }

      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      return null;
    } catch (err) {
      console.error(err);
      UI.showToast("Network error connecting to AI.", "error");
      return null;
    }
  },

  async smartSearch() {
    const query = prompt("What are you looking for? (e.g. '3.3v regulators', 'red LEDs')");
    if (!query) return;

    const catalog = state.components.map(c => ({
      id: c.id,
      name: c.name,
      cat: Data.getCategoryName(c.category),
      tags: c.tags,
      desc: c.description
    }));

    const systemPrompt = `
      You are an AI assistant for an electronics inventory system.
      The user is searching for: "${query}"
      
      Here is their inventory:
      ${JSON.stringify(catalog)}
      
      Analyze the request and match it against the inventory.
      Return ONLY a JSON array of matching component IDs. No markdown.
      Example: ["comp-123", "comp-456"]
    `;

    const aiResponse = await this.callGemini(systemPrompt);
    if (!aiResponse) return;

    try {
      const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const matchedIds = JSON.parse(cleanJson);
      
      if (matchedIds.length === 0) {
        UI.showToast("AI found no matches.", "info");
      } else {
        UI.showToast(`AI found ${matchedIds.length} matches!`, "success");
        // Clear standard search string
        document.getElementById('inventorySearch').value = '';
        state.filters.search = '';
        
        // Render but filter manually
        state.filteredComponents = state.components.filter(c => matchedIds.includes(c.id));
        UI.renderInventory(true); // Need to modify renderInventory slightly to accept forceFiltered flag
      }
    } catch (e) {
      console.error(e);
      UI.showToast("AI returned invalid format.", "error");
    }
  },

  async identifyComponent(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target.result;
      
      const prompt = `
        Identify the electronic component in this image.
        Return strictly a JSON object. No markdown.
        {
          "name": "Clear name (e.g. 'LM317 Voltage Regulator')",
          "category": "Guess category",
          "description": "Brief description",
          "tags": ["tag1"]
        }
      `;

      const aiResponse = await this.callGemini(prompt, base64Image);
      if (!aiResponse) return;

      try {
        const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        
        if (data.name) document.getElementById('compName').value = data.name;
        if (data.description) document.getElementById('compDescription').value = data.description;
        if (data.tags && Array.isArray(data.tags)) document.getElementById('compTags').value = data.tags.join(', ');
        
        if (data.category) {
          const select = document.getElementById('compCategory');
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.toLowerCase().includes(data.category.toLowerCase())) {
              select.selectedIndex = i;
              select.dispatchEvent(new Event('change'));
              break;
            }
          }
        }
        UI.showToast("AI identified component!", "success");
      } catch (err) {
        UI.showToast("AI could not extract data.", "error");
      }
    };
    reader.readAsDataURL(file);
  }
};
window.AI = AI;

// AI Event Listeners
document.getElementById('aiSearchBtn')?.addEventListener('click', () => AI.smartSearch());
document.getElementById('aiIdentifyBtn')?.addEventListener('click', () => document.getElementById('aiCameraInput').click());
document.getElementById('aiCameraInput')?.addEventListener('change', (e) => {
  if (e.target.files.length > 0) AI.identifyComponent(e.target.files[0]);
});
