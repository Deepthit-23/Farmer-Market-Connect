import React, { useState, useEffect } from 'react';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import FarmerTrendsDashboard from './components/FarmerTrendsDashboard.jsx';

const API_BASE = '/api';

function App() {
  // Authentication & Session State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  
  // Login / Register Mode States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('buyer');
  const [loginError, setLoginError] = useState('');
  
  // Register Form States
  const [regRole, setRegRole] = useState('buyer');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDetails, setRegDetails] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Active Screen View state (depending on role)
  const [activeTab, setActiveTab] = useState('');

  // UI Flow States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Buyer States
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [buyerProfile, setBuyerProfile] = useState(null);
  
  // Product details/reviews modal state
  const [activeReviewProduct, setActiveReviewProduct] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Farmer States
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [farmerProfile, setFarmerProfile] = useState(null);
  
  // Farmer CRUD Add/Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState('Vegetables');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormStock, setProdFormStock] = useState('');
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormError, setProdFormError] = useState('');

  // Admin States
  const [adminStats, setAdminStats] = useState(null);
  const [adminMarkets, setAdminMarkets] = useState([]);
  const [adminFarmers, setAdminFarmers] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notificationQueue, setNotificationQueue] = useState([]);
  
  // Admin Creation Forms
  const [marketFormName, setMarketFormName] = useState('');
  const [marketFormLocation, setMarketFormLocation] = useState('');
  const [marketFormDays, setMarketFormDays] = useState('Mon, Wed, Fri');
  const [assignFarmerId, setAssignFarmerId] = useState('');
  const [assignMarketId, setAssignMarketId] = useState('');

  // Auto-updating DBMS Log console trigger
  const [lastTriggerAction, setLastTriggerAction] = useState('System initialized.');

  // Set default tabs based on role
  useEffect(() => {
    if (role === 'buyer') setActiveTab('marketplace');
    if (role === 'farmer') setActiveTab('dashboard');
    if (role === 'admin') setActiveTab('stats');
  }, [role]);

  // Sync auth variables with localStorage
  const saveAuthSession = (tok, r, uid, name) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('role', r);
    localStorage.setItem('userId', uid);
    localStorage.setItem('userName', name);
    setToken(tok);
    setRole(r);
    setUserId(uid);
    setUserName(name);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setRole('');
    setUserId('');
    setUserName('');
    setCart([]);
    setProducts([]);
    setOrderHistory([]);
    setRecommendations([]);
    setFarmerProducts([]);
    setFarmerOrders([]);
    setAdminStats(null);
    setIsCartOpen(false);
    triggerToast('Logged out successfully.');
  };

  // Toast handler
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // User initials helper
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Preset Auto-login helper for easy grading/testing
  const handlePresetLogin = (email, password, userRole) => {
    setLoginRole(userRole);
    setLoginEmail(email);
    setLoginPassword(password);
    performLogin(email, password, userRole);
  };

  const parseResponseBody = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();

    if (contentType.includes('application/json')) {
      try {
        return raw ? JSON.parse(raw) : {};
      } catch {
        return { detail: raw || 'Request failed' };
      }
    }

    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return { detail: raw || 'Request failed' };
    }
  };

  const performLogin = async (email, password, userRole) => {
    try {
      setLoginError('');
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: userRole }),
      });

      const data = await parseResponseBody(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      saveAuthSession(data.access_token, data.role, data.user_id, data.name);
      setLastTriggerAction(`Logged in successfully as ${data.name} (${userRole}).`);
      triggerToast(`Welcome back, ${data.name}!`);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLoginFormSubmit = (e) => {
    e.preventDefault();
    performLogin(loginEmail, loginPassword, loginRole);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    
    try {
      let endpoint = '';
      let payload = {};
      
      if (regRole === 'buyer') {
        endpoint = `${API_BASE}/auth/register/buyer`;
        payload = {
          email: regEmail,
          password: regPassword,
          name: regName,
          phone: regPhone,
          address: regAddress || null
        };
      } else {
        endpoint = `${API_BASE}/auth/register/farmer`;
        payload = {
          email: regEmail,
          password: regPassword,
          farm_name: regName,
          phone: regPhone,
          farm_details: regDetails || null
        };
      }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await parseResponseBody(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      setRegSuccess('Registration successful! You can now log in.');
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      setLoginRole(regRole);
      setIsRegisterMode(false);
      setLastTriggerAction(`Successfully registered new ${regRole}: ${regName}.`);
      triggerToast('Registration completed successfully!');
      
      // Clear inputs
      setRegEmail('');
      setRegPassword('');
      setRegName('');
      setRegPhone('');
      setRegAddress('');
      setRegDetails('');
    } catch (err) {
      setRegError(err.message);
    }
  };

  // --- API CONSUMPTION HOOKS ---

  // Load products feed for Buyer
  const fetchProductsFeed = async () => {
    try {
      let url = `${API_BASE}/buyer/products?`;
      if (selectedCategory && selectedCategory !== 'All') {
        url += `category=${selectedCategory}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      console.error('Failed to load products feed', err);
    }
  };

  // Load recommendations for Buyer (Calls the recommendation generator stored procedure)
  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/buyer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    }
  };

  // Load order history for Buyer
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/buyer/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrderHistory(data);
    } catch (err) {
      console.error('Failed to load order history', err);
    }
  };

  // Fetch farmer profile and data
  const fetchFarmerData = async () => {
    try {
      const resProds = await fetch(`${API_BASE}/farmer/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataProds = await resProds.json();
      if (resProds.ok) setFarmerProducts(dataProds);

      const resOrders = await fetch(`${API_BASE}/farmer/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataOrders = await resOrders.json();
      if (resOrders.ok) setFarmerOrders(dataOrders);

      const resProf = await fetch(`${API_BASE}/farmer/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataProf = await resProf.json();
      if (resProf.ok) setFarmerProfile(dataProf);
    } catch (err) {
      console.error('Failed to load farmer portal data', err);
    }
  };

  // Fetch admin console statistics and database audit tools
  const fetchAdminData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const resStats = await fetch(`${API_BASE}/admin/stats`, { headers });
      const dataStats = await resStats.json();
      if (resStats.ok) setAdminStats(dataStats);

      const resMarkets = await fetch(`${API_BASE}/admin/markets`, { headers });
      const dataMarkets = await resMarkets.json();
      if (resMarkets.ok) setAdminMarkets(dataMarkets);

      const resFarmers = await fetch(`${API_BASE}/admin/farmers`, { headers });
      const dataFarmers = await resFarmers.json();
      if (resFarmers.ok) setAdminFarmers(dataFarmers);

      const resOrders = await fetch(`${API_BASE}/admin/orders`, { headers });
      const dataOrders = await resOrders.json();
      if (resOrders.ok) setAdminOrders(dataOrders);

      const resAudit = await fetch(`${API_BASE}/admin/audit-logs`, { headers });
      const dataAudit = await resAudit.json();
      if (resAudit.ok) setAuditLogs(dataAudit);

      const resQueue = await fetch(`${API_BASE}/admin/notifications`, { headers });
      const dataQueue = await resQueue.json();
      if (resQueue.ok) setNotificationQueue(dataQueue);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    }
  };

  // Multi-context loading orchestrator
  useEffect(() => {
    if (!token) return;
    if (role === 'buyer') {
      fetchProductsFeed();
      fetchOrderHistory();
      fetchRecommendations();
    } else if (role === 'farmer') {
      fetchFarmerData();
    } else if (role === 'admin') {
      fetchAdminData();
      
      // Auto-poll logs and notification queue every 3.5 seconds
      const pollInterval = setInterval(() => {
        fetchAdminData();
      }, 3500);
      return () => clearInterval(pollInterval);
    }
  }, [token, role, searchQuery, selectedCategory]);

  // --- BUYER ACTIONS ---

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.product_id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        triggerToast(`Only ${product.stock_quantity} remaining in stock.`);
        return;
      }
      setCart(cart.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setLastTriggerAction(`Added '${product.name}' to cart.`);
    triggerToast(`Added ${product.name} to basket!`);
  };

  const updateCartQty = (prodId, delta, stockLimit) => {
    const existing = cart.find(i => i.product_id === prodId);
    if (!existing) return;
    const nextQty = existing.quantity + delta;
    if (nextQty <= 0) {
      setCart(cart.filter(i => i.product_id !== prodId));
      triggerToast('Removed item from basket.');
    } else {
      if (nextQty > stockLimit) {
        triggerToast(`Only ${stockLimit} units of this product are in stock.`);
        return;
      }
      setCart(cart.map(i => i.product_id === prodId ? { ...i, quantity: nextQty } : i));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const itemsPayload = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
      const res = await fetch(`${API_BASE}/buyer/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsPayload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failing checkout transaction');
      
      setCart([]);
      setIsCartOpen(false);
      fetchProductsFeed();
      fetchOrderHistory();
      fetchRecommendations();
      setLastTriggerAction(`Order #${data.order_id} successfully created. Database auto-deducted stock & computed co-occurrences.`);
      triggerToast(`Success! Placed Order #${data.order_id}`);
    } catch (err) {
      triggerToast(`Checkout failed: ${err.message}`);
    }
  };

  const openReviewsModal = async (product) => {
    setActiveReviewProduct(product);
    setNewRating(5);
    setNewComment('');
    setReviewError('');
    try {
      const res = await fetch(`${API_BASE}/buyer/products/${product.product_id}/reviews`);
      const data = await res.json();
      if (res.ok) setProductReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      const res = await fetch(`${API_BASE}/buyer/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: activeReviewProduct.product_id,
          rating: parseInt(newRating),
          comment: newComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not post review');
      
      // reload reviews
      const reloadRes = await fetch(`${API_BASE}/buyer/products/${activeReviewProduct.product_id}/reviews`);
      const reloadData = await reloadRes.json();
      if (reloadRes.ok) setProductReviews(reloadData);
      
      setNewComment('');
      setLastTriggerAction(`Submitted a ${newRating}-star review for '${activeReviewProduct.name}'.`);
      triggerToast('Review submitted successfully!');
    } catch (err) {
      setReviewError(err.message);
    }
  };

  // --- FARMER PORTAL ACTIONS ---

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/farmer/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update order status');

      fetchFarmerData();
      setLastTriggerAction(`Order #${orderId} status changed to '${newStatus}'. Fired MySQL AFTER UPDATE audit trigger.`);
      triggerToast(`Order #${orderId} status updated to ${newStatus}!`);
    } catch (err) {
      triggerToast(`Failed: ${err.message}`);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormCategory('Vegetables');
    setProdFormPrice('');
    setProdFormStock('');
    setProdFormImage('');
    setProdFormError('');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdFormName(prod.name);
    setProdFormCategory(prod.category);
    setProdFormPrice(prod.price);
    setProdFormStock(prod.stock_quantity);
    setProdFormImage(prod.image_url || '');
    setProdFormError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProdFormError('');
    try {
      const payload = {
        name: prodFormName,
        category: prodFormCategory,
        price: parseFloat(prodFormPrice),
        stock_quantity: parseInt(prodFormStock),
        image_url: prodFormImage || null
      };

      let res, data;
      if (editingProduct) {
        res = await fetch(`${API_BASE}/farmer/products/${editingProduct.product_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/farmer/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not complete CRUD action');

      setShowProductModal(false);
      fetchFarmerData();
      setLastTriggerAction(editingProduct ? `Updated product '${prodFormName}' details.` : `Added new product '${prodFormName}' to market catalog.`);
      triggerToast(editingProduct ? 'Crop updated successfully!' : 'Listed new produce successfully!');
    } catch (err) {
      setProdFormError(err.message);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE}/farmer/products/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete call returned non-204');
      
      fetchFarmerData();
      setLastTriggerAction(`Deleted product ID ${prodId} from farmer catalog.`);
      triggerToast('Crop listing deleted.');
    } catch (err) {
      triggerToast(err.message);
    }
  };

  // --- ADMIN PORTAL ACTIONS ---

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: marketFormName,
          location: marketFormLocation,
          open_days: marketFormDays
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not create market');

      setMarketFormName('');
      setMarketFormLocation('');
      fetchAdminData();
      setLastTriggerAction(`Market '${data.name}' established successfully.`);
      triggerToast(`Market '${data.name}' launched!`);
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleDeleteMarket = async (marketId) => {
    if (!confirm('Delete this market?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/markets/${marketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
        setLastTriggerAction(`Disassembled Market ID ${marketId}.`);
        triggerToast('Market disassembled successfully.');
      }
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleAssignFarmer = async (e) => {
    e.preventDefault();
    if (!assignFarmerId || !assignMarketId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/farmers/${assignFarmerId}/assign/${assignMarketId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed assigning farmer to market');

      setAssignFarmerId('');
      setAssignMarketId('');
      fetchAdminData();
      setLastTriggerAction(`Assigned Farmer '${data.farm_name}' to Market ID ${assignMarketId}.`);
      triggerToast(`Linked ${data.farm_name} successfully!`);
    } catch (err) {
      triggerToast(err.message);
    }
  };

  // --- SVGs for empty states ---
  const renderEmptyState = (title, subtitle) => (
    <div className="empty-state">
      <svg className="empty-state-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="#101A15" />
        <path d="M70 90C70 73.4315 83.4315 60 100 60C116.569 60 130 73.4315 130 90V130H70V90Z" fill="#1B2E24" />
        <rect x="60" y="110" width="80" height="30" rx="10" fill="#2D6A4F" />
        <circle cx="90" cy="90" r="5" fill="#52B788" />
        <circle cx="110" cy="90" r="5" fill="#52B788" />
      </svg>
      <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{title}</h4>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
    </div>
  );

  // --- RENDER LOGIN VIEW ---
  if (!token) {
    return (
      <div className="login-split-container fade-in-section">
        {/* Left mural banner */}
        <div className="login-left-mural" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200')` }}>
          <div className="login-mural-text">
            <h1 style={{ fontSize: '3.6rem', color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>AgriFlow Direct</h1>
            <p style={{ fontSize: '1.25rem', color: '#E8ECE4', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
              Connecting fresh produce to your table
            </p>
          </div>
        </div>

        {/* Right side form card */}
        <div className="login-right-form">
          <div className="login-card">
            <div className="brand" style={{ justifyContent: 'center', marginBottom: '1.75rem' }}>
              <div className="brand-icon">🌱</div>
              <span className="brand-title">AgriFlow Direct</span>
            </div>
            
            {regSuccess && (
              <div className="status-pill status-delivered" style={{ width: '100%', textAlign: 'center', marginBottom: '1.25rem', padding: '0.6rem', display: 'block' }}>
                {regSuccess}
              </div>
            )}

            {!isRegisterMode ? (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                  Sign In to AgriFlow
                </h2>
                
                {loginError && (
                  <div className="status-pill status-pending" style={{ width: '100%', color: '#FFA7A7', background: '#3E2723', border: '1px solid #FF8A80', textAlign: 'center', marginBottom: '1.25rem', padding: '0.6rem', display: 'block' }}>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginFormSubmit}>
                  <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Demonstration Role</label>
                    <div className="role-pill-tabs">
                      <button 
                         type="button" 
                         className={`role-pill-btn ${loginRole === 'buyer' ? 'active' : ''}`}
                         onClick={() => setLoginRole('buyer')}
                      >
                        Buyer
                      </button>
                      <button 
                         type="button" 
                         className={`role-pill-btn ${loginRole === 'farmer' ? 'active' : ''}`}
                         onClick={() => setLoginRole('farmer')}
                      >
                        Farmer
                      </button>
                      <button 
                         type="button" 
                         className={`role-pill-btn ${loginRole === 'admin' ? 'active' : ''}`}
                         onClick={() => setLoginRole('admin')}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="alice@buyer.com"
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••"
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', display: 'block' }}>
                    Sign In
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>Don't have an account? </span>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--color-forest)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '0.88rem', fontWeight: 'bold' }}
                    onClick={() => {
                      setIsRegisterMode(true);
                      setRegSuccess('');
                      setRegError('');
                    }}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="preset-login-grid">
                  <span className="form-label" style={{ fontSize: '0.78rem', textAlign: 'center', margin: '0.5rem 0' }}>
                    Or select an Enterprise Sandbox Account:
                  </span>
                  
                  <button
                    type="button"
                    className="preset-card"
                    onClick={() => handlePresetLogin('alice@buyer.com', 'password123', 'buyer')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="preset-avatar">A</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-forest)' }}>Alice</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Standard Consumer</span>
                      </div>
                    </div>
                    <span className="role-badge">Buyer</span>
                  </button>

                  <button
                    type="button"
                    className="preset-card"
                    onClick={() => handlePresetLogin('john@farmer.com', 'password123', 'farmer')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="preset-avatar">J</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-forest)' }}>John's Organic Acres</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Certified Farm Partner</span>
                      </div>
                    </div>
                    <span className="role-badge" style={{ backgroundColor: '#004D40', color: '#4DB6AC' }}>Farmer</span>
                  </button>

                  <button 
                    type="button"
                    className="preset-card"
                    onClick={() => handlePresetLogin('admin@market.com', 'admin123', 'admin')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="preset-avatar">AD</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--color-forest)' }}>Database Admin</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>System Logistics Console</span>
                      </div>
                    </div>
                    <span className="role-badge" style={{ backgroundColor: '#3E2723', color: '#FFB74D' }}>Admin</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                  Create Account
                </h2>
                
                {regError && (
                  <div className="status-pill status-pending" style={{ width: '100%', color: '#FFA7A7', background: '#3E2723', border: '1px solid #FF8A80', textAlign: 'center', marginBottom: '1.25rem', padding: '0.6rem', display: 'block' }}>
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit}>
                  <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Join As</label>
                    <div className="role-pill-tabs">
                      <button 
                        type="button" 
                        className={`role-pill-btn ${regRole === 'buyer' ? 'active' : ''}`}
                        onClick={() => setRegRole('buyer')}
                      >
                        Buyer
                      </button>
                      <button 
                        type="button" 
                        className={`role-pill-btn ${regRole === 'farmer' ? 'active' : ''}`}
                        onClick={() => setRegRole('farmer')}
                      >
                        Farmer
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{regRole === 'buyer' ? 'Full Name' : 'Farm Name'}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={regRole === 'buyer' ? 'Jane Doe' : 'Sunny Valley Farm'}
                      value={regName} 
                      onChange={(e) => setRegName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="name@example.com"
                      value={regEmail} 
                      onChange={(e) => setRegEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••"
                      value={regPassword} 
                      onChange={(e) => setRegPassword(e.target.value)}
                      minLength={6}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="+919876543210"
                      value={regPhone} 
                      onChange={(e) => setRegPhone(e.target.value)}
                      required 
                    />
                  </div>

                  {regRole === 'buyer' ? (
                    <div className="form-group">
                      <label className="form-label">Delivery Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="12 Pine Road, Sector 5"
                        value={regAddress} 
                        onChange={(e) => setRegAddress(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Farm Details / Bio</label>
                      <textarea 
                        className="form-control" 
                        rows="2"
                        value={regDetails} 
                        onChange={(e) => setRegDetails(e.target.value)}
                        placeholder="Family-owned organic farm..." 
                      />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', display: 'block' }}>
                    Register & Sign Up
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>Already have an account? </span>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--color-forest)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '0.88rem', fontWeight: 'bold' }}
                    onClick={() => {
                      setIsRegisterMode(false);
                      setRegSuccess('');
                      setRegError('');
                    }}
                  >
                    Login
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER APPLICATION ---
  return (
    <div className="container fade-in-section">
      {/* Header Sticky Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">🌱</div>
          <div>
            <span className="brand-title">AgriFlow Direct</span>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 500, letterSpacing: '0.02em', marginTop: '-2px' }}>
              Connecting fresh produce to your table
            </div>
          </div>
        </div>

        <div className="user-info">
          <LanguageSwitcher role={role} />
          <div className="user-badge">
            <div className="user-avatar">{getInitials(userName)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--color-text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>{userName}</span>
              <span className={`role-badge role-${role}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.4rem', marginTop: '2px' }}>{role}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Global Live Action Console (Visualizes supply chain audits in real-time) */}
      <div className="dbms-console" style={{ marginTop: '2rem' }}>
        <div className="console-title">
          <span>🖥️ Supply Chain Logistics Audit Ledger</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Event-Driven Broadcaster</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '99px', background: 'var(--color-mint)', animation: 'pulse 1.5s infinite' }}></div>
          </div>
        </div>
        <div className="log-entry">
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>[System Audit]: </span>
          <span>{lastTriggerAction}</span>
        </div>
        <div className="log-entry" style={{ fontSize: '0.75rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
          <span style={{ color: 'var(--color-forest)', fontWeight: 600 }}>Engine Logistics Highlights: </span>
          {role === 'buyer' && <span>Direct farm crop feeds, similarity basket recommendation algorithms.</span>}
          {role === 'farmer' && <span>Transactional logistics fulfillment updates, catalog inventory stock-quantity controls.</span>}
          {role === 'admin' && <span>Event-triggered supply chain logs, message dispatch broadcasting queues.</span>}
        </div>
      </div>

      {/* --- BUYER PORTAL VIEW --- */}
      {role === 'buyer' && (
        <div>
          {/* Sub Navigation */}
          <div className="nav-tabs" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            <button 
              className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              🥦 Fresh Catalog
            </button>
            <button 
              className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('recommendations');
                fetchRecommendations();
              }}
            >
              ✨ Recommendations
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                fetchOrderHistory();
              }}
            >
              📦 My Orders
            </button>
          </div>

          {/* Hero Welcome banner */}
          <div className="organic-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #101A15 0%, #16221C 100%)', borderLeft: '4px solid var(--color-forest)', padding: '1.5rem 2rem' }}>
            <h2 style={{ fontSize: '1.65rem', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)', marginBottom: '0.35rem' }}>
              Good morning, {userName}!
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
              Here's what's fresh and harvested straight from our certified partner farms today.
            </p>
          </div>

          {/* Persistent Two-Column Layout */}
          <div className="grid-buyer-layout">
            
            {/* Left Column: Buyer Tabs content */}
            <div>
              {activeTab === 'marketplace' && (
                <div>
                  {/* Category filters & Search in unified row */}
                  <div className="organic-card" style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search crops, organic vegetables, dairy..." 
                      />
                    </div>
                    
                    {/* Filter chips selector */}
                    <div className="category-chips">
                      {['All', 'Vegetables', 'Fruits', 'Dairy', 'Grains'].map(cat => (
                        <button 
                          key={cat} 
                          type="button" 
                          className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid */}
                  {products.length === 0 ? (
                    <div className="organic-card" style={{ display: 'flex', justifyContent: 'center' }}>
                      {renderEmptyState('No fresh crops found', 'Try adjusting your search query or filter chips')}
                    </div>
                  ) : (
                    <div className="product-grid">
                      {products.map(prod => (
                        <div key={prod.product_id} className="organic-card product-card hover-glow">
                          <span className="category-badge">{prod.category}</span>
                          <img 
                            className="product-image" 
                            src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'} 
                            alt={prod.name} 
                          />
                          <h4 className="product-title">{prod.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                            Farm: <strong style={{ color: 'var(--color-forest)' }}>{prod.farmer_farm_name}</strong>
                          </span>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                            <div>
                              <div className="price-tag">${prod.price}</div>
                              <div className="stock-tag">{prod.stock_quantity} remaining</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => openReviewsModal(prod)}
                                style={{ padding: '0.4rem 0.6rem' }}
                                title="Read Reviews"
                              >
                                ⭐
                              </button>
                              <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => addToCart(prod)}
                                disabled={prod.stock_quantity === 0}
                              >
                                {prod.stock_quantity === 0 ? 'Sold Out' : 'Add to Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations Horizontal Scroll Row */}
              {activeTab === 'recommendations' && (
                <div>
                  <div className="organic-card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--color-forest)', fontFamily: 'var(--font-heading)' }}>
                      ✨ Personalized Produce Pairings
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      Based on crops you and similar consumers have selected in the past, our demand algorithms recommend these co-occurring pairings harvested fresh this morning.
                    </p>
                  </div>

                  {recommendations.length === 0 ? (
                    <div className="organic-card" style={{ display: 'flex', justifyContent: 'center' }}>
                      {renderEmptyState('No recommendations yet', 'Add items to your basket and complete a purchase to generate demand pairings!')}
                    </div>
                  ) : (
                    <div className="recommendations-scroll-container">
                      {recommendations.map((rec) => {
                        const prod = rec.product;
                        return (
                          <div key={prod.product_id} className="organic-card recommendation-card hover-glow" style={{ borderTop: '4px solid var(--color-mint)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span className="category-badge" style={{ margin: 0 }}>{prod.category}</span>
                              <span className="role-badge" style={{ background: '#1B2E24', color: 'var(--color-forest)' }}>
                                {(rec.score * 100).toFixed(0)}% Match
                              </span>
                            </div>
                            
                            <img 
                              className="product-image" 
                              style={{ height: '140px' }}
                              src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'} 
                              alt={prod.name} 
                            />
                            <h4 className="product-title" style={{ fontSize: '1.1rem' }}>{prod.name}</h4>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                              Farm: {prod.farmer_farm_name}
                            </span>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.6rem' }}>
                              <span className="price-tag" style={{ fontSize: '1.1rem' }}>${prod.price}</span>
                              <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => addToCart(prod)}
                                disabled={prod.stock_quantity === 0}
                              >
                                {prod.stock_quantity === 0 ? 'Out' : '+ Add'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Order History */}
              {activeTab === 'history' && (
                <div className="organic-card">
                  <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Your Past Orders</h3>
                  {orderHistory.length === 0 ? (
                    renderEmptyState('No orders placed yet', 'Browse our catalog and make your first fresh delivery')
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {orderHistory.map(order => (
                        <div key={order.order_id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', background: '#101A15' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                            <div>
                              <strong style={{ fontSize: '1rem', color: 'var(--color-forest)' }}>Order #{order.order_id}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: '1rem' }}>
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`status-pill status-${order.status}`}>{order.status}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {order.items.map(item => (
                              <div key={item.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>{item.product.name} (x{item.quantity})</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem', fontWeight: 700, fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--color-text-primary)' }}>Total Price:</span>
                            <span style={{ color: 'var(--color-forest)' }}>${parseFloat(order.total_price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Permanent Shopping Basket Sidebar */}
            <div className="organic-card cart-sidebar-panel">
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🛒 Shopping Basket</span>
                <span className="role-badge" style={{ background: 'var(--color-forest)', color: '#0C140F', border: 'none' }}>
                  {cart.length} crops
                </span>
              </h3>

              {cart.length === 0 ? (
                <div style={{ flex: 1, padding: '2rem 0' }}>
                  {renderEmptyState('Your Basket is Empty', 'Select organic produce on the left to add items to your cart')}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', paddingRight: '4px', maxHeight: '380px', flex: 1 }}>
                    {cart.map(item => (
                      <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#101A15', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '60%' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-mint)', fontWeight: 600, marginTop: '2px' }}>
                            ${item.price} each
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => updateCartQty(item.product_id, -1, item.stock_quantity)}>-</button>
                          <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 600 }}>{item.quantity}</span>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => updateCartQty(item.product_id, 1, item.stock_quantity)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                      <span style={{ color: 'var(--color-text-primary)' }}>Grand Total:</span>
                      <span style={{ color: 'var(--color-forest)', fontSize: '1.2rem' }}>
                        ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Highly visible Proceed to Checkout CTA */}
                    <button 
                      className="btn btn-primary" 
                      onClick={handleCheckout} 
                      style={{ width: '100%', display: 'block', fontSize: '1rem', padding: '0.9rem 1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      💳 Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- FARMER PORTAL VIEW --- */}
      {role === 'farmer' && (
        <div>
          {/* Sub Navigation */}
          <div className="nav-tabs" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📈 Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              🧺 Farm Listings ({farmerProducts.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('incoming')}
            >
              📥 Incoming Orders ({farmerOrders.length})
            </button>
          </div>

          {activeTab === 'dashboard' && <FarmerTrendsDashboard token={token} />}

          {activeTab === 'listings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Crops & Produce Catalog</h3>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddProduct}>
                  + Add New Produce
                </button>
              </div>

              {farmerProducts.length === 0 ? (
                <div className="organic-card" style={{ display: 'flex', justifyContent: 'center' }}>
                  {renderEmptyState('No crops listed yet', 'Click the "+ Add New Produce" button above to publish your first crop')}
                </div>
              ) : (
                <div className="product-grid">
                  {farmerProducts.map(prod => (
                    <div key={prod.product_id} className="organic-card product-card hover-glow">
                      <span className="category-badge">{prod.category}</span>
                      <img 
                        className="product-image" 
                        src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'} 
                        alt={prod.name} 
                      />
                      <h4 className="product-title">{prod.name}</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                        <div>
                          <div className="price-tag">${prod.price}</div>
                          <div className="stock-tag">{prod.stock_quantity} available</div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditProduct(prod)}
                            style={{ padding: '0.4rem 0.8rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProduct(prod.product_id)}
                            style={{ padding: '0.4rem 0.8rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'incoming' && (
            <div className="organic-card">
              <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Incoming Order Ledger</h3>
              
              {farmerOrders.length === 0 ? (
                renderEmptyState('No active orders received', 'Orders placed by B2B/B2C buyers will automatically appear here')
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Buyer Client</th>
                        <th>Harvested Cargo</th>
                        <th>Fulfillment Earnings</th>
                        <th>Transit Status</th>
                        <th style={{ textAlign: 'right' }}>Logistics Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmerOrders.map(order => (
                        <tr key={order.order_id}>
                          <td><strong>#{order.order_id}</strong></td>
                          <td>{order.buyer_name}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {order.items.map(item => (
                                <span key={item.order_item_id} style={{ fontSize: '0.82rem' }}>
                                  {item.product.name} (x{item.quantity})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ color: 'var(--color-forest)', fontWeight: 700 }}>
                            ${parseFloat(order.total_price).toFixed(2)}
                          </td>
                          <td>
                            <span className={`status-pill status-${order.status}`}>{order.status}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {order.status === 'pending' && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdateOrderStatus(order.order_id, 'confirmed')}
                              >
                                Confirm Order
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button 
                                className="btn btn-primary btn-sm"
                                style={{ backgroundColor: '#8B5CF6', color: '#0C140F', boxShadow: 'none' }}
                                onClick={() => handleUpdateOrderStatus(order.order_id, 'shipped')}
                              >
                                Ship Cargo 🚀
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ borderColor: 'var(--color-mint)', color: 'var(--color-forest)' }}
                                onClick={() => handleUpdateOrderStatus(order.order_id, 'delivered')}
                              >
                                Mark Delivered ✅
                              </button>
                            )}
                            {order.status === 'delivered' && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- ADMIN PORTAL VIEW --- */}
      {role === 'admin' && (
        <div className="admin-layout-container">
          {/* Sidebar Navigation */}
          <aside className="admin-sidebar">
            <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-forest)', padding: '0.5rem 1rem 1rem 1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
              System Control
            </h4>
            <button 
              className={`admin-sidebar-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              📊 Core Overview
            </button>
            <button 
              className={`admin-sidebar-btn ${activeTab === 'markets' ? 'active' : ''}`}
              onClick={() => setActiveTab('markets')}
            >
              🏢 Local Markets
            </button>
            <button 
              className={`admin-sidebar-btn ${activeTab === 'farmers' ? 'active' : ''}`}
              onClick={() => setActiveTab('farmers')}
            >
              🚜 Farm Assigns
            </button>
            <button 
              className={`admin-sidebar-btn ${activeTab === 'dbms' ? 'active' : ''}`}
              onClick={() => setActiveTab('dbms')}
            >
              🔒 System Logs
            </button>
          </aside>

          {/* Admin Main content */}
          <main className="admin-content">
            {activeTab === 'stats' && (
              <div>
                {adminStats && (
                  <div className="stats-grid-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card">
                      <div style={{ flex: 1 }}>
                        <div className="stat-value">
                          {adminStats.total_revenue ? `$${parseFloat(adminStats.total_revenue).toFixed(2)}` : '$0.00'}
                        </div>
                        <div className="stat-label">Total Pipeline Revenue</div>
                      </div>
                      <div className="sparkline-container">
                        <div className="sparkline-bar" style={{ height: '30%' }} />
                        <div className="sparkline-bar" style={{ height: '55%' }} />
                        <div className="sparkline-bar" style={{ height: '40%' }} />
                        <div className="sparkline-bar" style={{ height: '75%' }} />
                        <div className="sparkline-bar" style={{ height: '90%' }} />
                      </div>
                    </div>
                    <div className="stat-card">
                      <div style={{ flex: 1 }}>
                        <div className="stat-value">{adminStats.total_orders}</div>
                        <div className="stat-label">Dispatched Orders</div>
                      </div>
                      <div className="sparkline-container">
                        <div className="sparkline-bar orange" style={{ height: '20%' }} />
                        <div className="sparkline-bar orange" style={{ height: '45%' }} />
                        <div className="sparkline-bar orange" style={{ height: '70%' }} />
                        <div className="sparkline-bar orange" style={{ height: '50%' }} />
                        <div className="sparkline-bar orange" style={{ height: '85%' }} />
                      </div>
                    </div>
                    <div className="stat-card">
                      <div style={{ flex: 1 }}>
                        <div className="stat-value">{adminStats.total_farmers}</div>
                        <div className="stat-label">Connected Farms</div>
                      </div>
                      <div className="sparkline-container">
                        <div className="sparkline-bar" style={{ height: '40%' }} />
                        <div className="sparkline-bar" style={{ height: '30%' }} />
                        <div className="sparkline-bar" style={{ height: '60%' }} />
                        <div className="sparkline-bar" style={{ height: '80%' }} />
                        <div className="sparkline-bar" style={{ height: '95%' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Global order logs */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Global Order Book</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Buyer</th>
                          <th>Total Value</th>
                          <th>Created At</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOrders.map(order => (
                          <tr key={order.order_id}>
                            <td><strong>#{order.order_id}</strong></td>
                            <td>{order.buyer_name}</td>
                            <td style={{ fontWeight: 600 }}>${parseFloat(order.total_price).toFixed(2)}</td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{new Date(order.created_at).toLocaleString()}</td>
                            <td>
                              <span className={`status-pill status-${order.status}`}>{order.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'markets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Create Market Form */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Launch New Local Market</h3>
                  <form onSubmit={handleCreateMarket} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Market Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={marketFormName}
                        onChange={(e) => setMarketFormName(e.target.value)}
                        placeholder="City Greenfield Market" 
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Location Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={marketFormLocation}
                        onChange={(e) => setMarketFormLocation(e.target.value)}
                        placeholder="5th Main Avenue, North Sector" 
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Operating Days</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={marketFormDays}
                        onChange={(e) => setMarketFormDays(e.target.value)}
                        placeholder="Mon, Wed, Sat" 
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
                      Establish Market
                    </button>
                  </form>
                </div>

                {/* Markets List */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Current Active Markets</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Market ID</th>
                          <th>Name</th>
                          <th>Location</th>
                          <th>Days Open</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminMarkets.map(m => (
                          <tr key={m.market_id}>
                            <td><strong>#{m.market_id}</strong></td>
                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                            <td>{m.location}</td>
                            <td>{m.open_days}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMarket(m.market_id)}>Disassemble</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'farmers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Assign farmer */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Link Farmer to Market Location</h3>
                  <form onSubmit={handleAssignFarmer} style={{ display: 'flex', gap: '1.5rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Select Certified Farm Partner</label>
                      <select 
                        className="form-control" 
                        value={assignFarmerId} 
                        onChange={(e) => setAssignFarmerId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Farmer --</option>
                        {adminFarmers.map(f => (
                          <option key={f.farmer_id} value={f.farmer_id}>{f.farm_name} (ID: {f.farmer_id})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Link to Local Market Hub</label>
                      <select 
                        className="form-control" 
                        value={assignMarketId} 
                        onChange={(e) => setAssignMarketId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Market --</option>
                        {adminMarkets.map(m => (
                          <option key={m.market_id} value={m.market_id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Assign Partner
                    </button>
                  </form>
                </div>

                {/* Assigned Farmers */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>Registered Farm Directory</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Farmer ID</th>
                          <th>Farm Name</th>
                          <th>Email Address</th>
                          <th>Contact Phone</th>
                          <th>Assigned Market Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminFarmers.map(f => (
                          <tr key={f.farmer_id}>
                            <td><strong>#{f.farmer_id}</strong></td>
                            <td style={{ fontWeight: 600 }}>{f.farm_name}</td>
                            <td>{f.email}</td>
                            <td><code>{f.phone}</code></td>
                            <td>
                              {f.market_id ? (
                                <span className="status-pill status-delivered">Market Hub #{f.market_id}</span>
                              ) : (
                                <span className="status-pill status-pending">Pending Assignment</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dbms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Supply Chain Audit Ledger */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>
                    <span>🛡️ Supply Chain Logistics Ledger</span>
                    <span className="role-badge" style={{ fontSize: '0.65rem' }}>Write-Once Trigger Logs</span>
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                    This ledger displays real-time secure automated audit rows. Any status change on cargo dispatches updates a write-once ledger entry in MySQL to ensure absolute traceably secure supply chains.
                  </p>

                  <div className="data-table-container">
                    <table className="data-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Log ID</th>
                          <th>Secure Database Auditor</th>
                          <th>Trigger Event</th>
                          <th>Target ID</th>
                          <th>Audit Details</th>
                          <th>Fired Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map(log => (
                          <tr key={log.log_id}>
                            <td><strong>#{log.log_id}</strong></td>
                            <td><code style={{ color: 'var(--color-forest)' }}>{log.trigger_name}</code></td>
                            <td><span className="status-pill status-confirmed">{log.action_type}</span></td>
                            <td>Order #{log.record_id}</td>
                            <td>{log.details}</td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{new Date(log.fired_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Broadcast Notification Queue */}
                <div className="organic-card">
                  <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>
                    <span>📨 Customer Notification Broadcast Queue</span>
                    <span className="role-badge" style={{ backgroundColor: '#101A15', color: '#74C69D', fontSize: '0.65rem' }}>Scheduler active</span>
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                    Automated background queue logs dispatch requests in real-time. An event poller continually processes the broadcast rows to send SMS/WhatsApp notifications on crop updates.
                  </p>

                  <div className="data-table-container">
                    <table className="data-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Queue ID</th>
                          <th>Dispatch Target</th>
                          <th>Recipient</th>
                          <th>Generated Broadcast Notification</th>
                          <th>Poller Status</th>
                          <th>Queued Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notificationQueue.map(item => (
                          <tr key={item.notification_id}>
                            <td><strong>#{item.notification_id}</strong></td>
                            <td>Order #{item.order_id}</td>
                            <td><code>{item.phone}</code></td>
                            <td>{item.message}</td>
                            <td>
                              <span className={`status-pill status-${item.status === 'sent' ? 'delivered' : 'pending'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{new Date(item.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* --- REVIEW MODAL (OVERLAY SHEET) --- */}
      {activeReviewProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>
                {activeReviewProduct.name} - Reviews
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveReviewProduct(null)}>Close</button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="category-badge" style={{ margin: 0 }}>{activeReviewProduct.category}</span>
              <div style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                Price: ${activeReviewProduct.price}
              </div>
            </div>

            {/* Write a review form */}
            {role === 'buyer' && (
              <form onSubmit={submitReview} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', background: '#101A15' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-forest)', fontWeight: 600 }}>Write a Review</h4>
                {reviewError && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Error: {reviewError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Your Rating</label>
                  <select className="form-control" value={newRating} onChange={(e) => setNewRating(e.target.value)}>
                    <option value="5">⭐⭐⭐⭐⭐ - Exceptional</option>
                    <option value="4">⭐⭐⭐⭐ - Very Good</option>
                    <option value="3">⭐⭐⭐ - Good</option>
                    <option value="2">⭐⭐ - Fair</option>
                    <option value="1">⭐ - Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Description</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Provide your experience with this farmer's organic produce..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  Submit Customer Review
                </button>
              </form>
            )}

            <div className="reviews-section">
              <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--color-forest)', fontWeight: 600 }}>Customer Feedback</h4>
              {productReviews.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>No reviews posted for this item yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {productReviews.map(rev => (
                    <div key={rev.review_id} style={{ padding: '0.85rem', background: '#101A15', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>👤 {rev.buyer_name}</strong>
                        <span className="stars" style={{ color: '#F4A261' }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{rev.comment}</p>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', textAlign: 'right' }}>
                        {new Date(rev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- FARMER ADD/EDIT PRODUCT MODAL --- */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: 'var(--color-forest)' }}>
                {editingProduct ? 'Modify Crop Details' : 'List New Fresh Cargo'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowProductModal(false)}>Cancel</button>
            </div>

            {prodFormError && (
              <div style={{ color: '#EF4444', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                Error: {prodFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Produce Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={prodFormName} 
                  onChange={(e) => setProdFormName(e.target.value)} 
                  placeholder="e.g. Honey Sweet Strawberries" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={prodFormCategory} onChange={(e) => setProdFormCategory(e.target.value)}>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Grains">Grains</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Price ($ / Unit)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="form-control" 
                    value={prodFormPrice} 
                    onChange={(e) => setProdFormPrice(e.target.value)} 
                    placeholder="e.g. 3.49" 
                    required 
                  />
                </div>

                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">Initial Stock Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-control" 
                    value={prodFormStock} 
                    onChange={(e) => setProdFormStock(e.target.value)} 
                    placeholder="e.g. 50" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={prodFormImage} 
                  onChange={(e) => setProdFormImage(e.target.value)} 
                  placeholder="Paste direct Unsplash URL..." 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', display: 'block' }}>
                {editingProduct ? 'Save Crop Changes' : 'Launch Crop Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success/Toast Notification bottom-right */}
      {toastMessage && (
        <div className="toast-notification">
          <span>✨</span> {toastMessage}
        </div>
      )}

    </div>
  );
}

export default App;
