import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

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
    if (role === 'farmer') setActiveTab('listings');
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
  };

  // Preset Auto-login helper for easy grading/testing
  const handlePresetLogin = (email, password, userRole) => {
    setLoginRole(userRole);
    setLoginEmail(email);
    setLoginPassword(password);
    performLogin(email, password, userRole);
  };

  const performLogin = async (email, password, userRole) => {
    try {
      setLoginError('');
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: userRole }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      saveAuthSession(data.access_token, data.role, data.user_id, data.name);
      setLastTriggerAction(`Logged in successfully as ${data.name} (${userRole}).`);
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
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      setRegSuccess('Registration successful! You can now log in.');
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      setLoginRole(regRole);
      setIsRegisterMode(false);
      setLastTriggerAction(`Successfully registered new ${regRole}: ${regName}.`);
      
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
      // Products CRUD
      const resProds = await fetch(`${API_BASE}/farmer/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataProds = await resProds.json();
      if (resProds.ok) setFarmerProducts(dataProds);

      // Incoming Orders
      const resOrders = await fetch(`${API_BASE}/farmer/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataOrders = await resOrders.json();
      if (resOrders.ok) setFarmerOrders(dataOrders);

      // Profile
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

      // Retrieve live triggers audit log
      const resAudit = await fetch(`${API_BASE}/admin/audit-logs`, { headers });
      const dataAudit = await resAudit.json();
      if (resAudit.ok) setAuditLogs(dataAudit);

      // Retrieve twilio queued logs
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
      
      // Auto-poll logs and notification queue every 3.5 seconds to show database triggers firing instantly!
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
        alert(`Cannot add more. Only ${product.stock_quantity} available in stock.`);
        return;
      }
      setCart(cart.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setLastTriggerAction(`Added '${product.name}' to cart.`);
  };

  const updateCartQty = (prodId, delta, stockLimit) => {
    const existing = cart.find(i => i.product_id === prodId);
    if (!existing) return;
    const nextQty = existing.quantity + delta;
    if (nextQty <= 0) {
      setCart(cart.filter(i => i.product_id !== prodId));
    } else {
      if (nextQty > stockLimit) {
        alert(`Only ${stockLimit} units of this product are in stock.`);
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
      fetchProductsFeed();
      fetchOrderHistory();
      fetchRecommendations();
      setLastTriggerAction(`Order #${data.order_id} successfully created. Database auto-deducted stock & computed co-occurrences.`);
      alert(`Success! Order #${data.order_id} placed. Recommendations re-calculated in MySQL!`);
    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
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
      alert(`Order status updated to '${newStatus}'. The database trigger has logged this action & queued a WhatsApp notification!`);
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
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
      }
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
    }
  };

  // --- RENDER METHODS ---

  if (!token) {
    return (
      <div className="container">
        <div className="login-container">
          <div className="login-card glass-panel">
            <div className="brand" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="brand-icon">🌱</div>
              <span className="gradient-text">Farmer Market Connect</span>
            </div>
            
            {regSuccess && (
              <div className="status-pill status-delivered" style={{ width: '100%', textAlign: 'center', marginBottom: '1.25rem', padding: '0.6rem' }}>
                {regSuccess}
              </div>
            )}

            {!isRegisterMode ? (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Demonstration Login</h2>
                
                {loginError && (
                  <div className="alert-info" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', marginBottom: '1.25rem' }}>
                    Error: {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginFormSubmit}>
                  <div className="form-group">
                    <label className="form-label">Demonstration Role</label>
                    <div className="nav-tabs" style={{ width: '100%', marginBottom: '1rem' }}>
                      <button 
                        type="button" 
                        className={`tab-btn ${loginRole === 'buyer' ? 'active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => setLoginRole('buyer')}
                      >
                        Buyer
                      </button>
                      <button 
                        type="button" 
                        className={`tab-btn ${loginRole === 'farmer' ? 'active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => setLoginRole('farmer')}
                      >
                        Farmer
                      </button>
                      <button 
                        type="button" 
                        className={`tab-btn ${loginRole === 'admin' ? 'active' : ''}`}
                        style={{ flex: 1 }}
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
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Access System Panel
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', marginBottom: '1.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Don't have an account? </span>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-mint)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '0.88rem', fontWeight: 'bold' }}
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
                  <span className="form-label" style={{ fontSize: '0.8rem', textAlign: 'center' }}>Or select a DBMS testing preset account:</span>
                  
                  <button 
                    type="button"
                    className="preset-btn"
                    onClick={() => handlePresetLogin('alice@example.com', 'password123', 'buyer')}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>Alice (Buyer Portal)</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Test purchases & recommendations</span>
                    </div>
                    <span className="role-tag role-buyer">Buyer</span>
                  </button>

                  <button 
                    type="button"
                    className="preset-btn"
                    onClick={() => handlePresetLogin('greenfarms@example.com', 'password123', 'farmer')}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>Green Farms (Farmer Portal)</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Post products & dispatch orders</span>
                    </div>
                    <span className="role-tag role-farmer">Farmer</span>
                  </button>

                  <button 
                    type="button"
                    className="preset-btn"
                    onClick={() => handlePresetLogin('admin@market.com', 'admin123', 'admin')}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>Database Administrator</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audit Live Triggers, logs & scheduler</span>
                    </div>
                    <span className="role-tag role-admin">Admin</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Register Account</h2>
                
                {regError && (
                  <div className="alert-info" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', marginBottom: '1.25rem' }}>
                    Error: {regError}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit}>
                  <div className="form-group">
                    <label className="form-label">Join As</label>
                    <div className="nav-tabs" style={{ width: '100%', marginBottom: '1rem' }}>
                      <button 
                        type="button" 
                        className={`tab-btn ${regRole === 'buyer' ? 'active' : ''}`}
                        style={{ flex: 1 }}
                        onClick={() => setRegRole('buyer')}
                      >
                        Buyer
                      </button>
                      <button 
                        type="button" 
                        className={`tab-btn ${regRole === 'farmer' ? 'active' : ''}`}
                        style={{ flex: 1 }}
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
                      value={regName} 
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={regRole === 'buyer' ? 'e.g. John Doe' : 'e.g. Sunny Orchards'}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={regEmail} 
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password (Min 6 chars)</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={regPassword} 
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone (WhatsApp format, e.g. +1234567890)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={regPhone} 
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+919876543210"
                      required 
                    />
                  </div>

                  {regRole === 'buyer' ? (
                    <div className="form-group">
                      <label className="form-label">Delivery Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={regAddress} 
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="e.g. 12 Pine Road, Sector 5" 
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
                        placeholder="e.g. Family-owned organic apple orchards since 1995." 
                      />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Register & Join Market
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Already have an account? </span>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-mint)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '0.88rem', fontWeight: 'bold' }}
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

  return (
    <div className="container">
      {/* Header and User Session Tag */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">🌱</div>
          <div>
            <span className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800 }}>Farmer Market Connect</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>DBMS College Mini-Project Dashboard</div>
          </div>
        </div>

        <div className="user-info">
          <div className="user-badge">
            <span style={{ color: 'var(--text-primary)' }}>{userName}</span>
            <span className={`role-tag role-${role}`}>{role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Global Live Action Console (Visualizes triggers in real-time) */}
      <div className="dbms-console">
        <div className="console-title">
          <span>🖥️ Live DBMS Spotlight Console</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected (MySQL 8)</span>
            <div className="pulse-dot"></div>
          </div>
        </div>
        <div className="log-entry">
          <span className="log-meta">[Action Log]: </span>
          <span>{lastTriggerAction}</span>
        </div>
        <div className="log-entry" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px dashed rgba(52, 211, 153, 0.08)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
          <span style={{ color: 'var(--accent-mint)', fontWeight: 600 }}>Featured DB Concepts demonstrated: </span>
          {role === 'buyer' && <span>Self-joins, dynamic Jaccard index similarity scores, co-occurrence catalog recommendations.</span>}
          {role === 'farmer' && <span>Transactional order dispatching, cascade deletions, triggers tracking log.</span>}
          {role === 'admin' && <span>AFTER UPDATE order trigger logging (`NOTIFICATION_TRIGGER_LOG`), auto-queued Twilio notification jobs (`NOTIFICATION_QUEUE`), full audit trails.</span>}
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
              ✨ Personalized Recommendations
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

          <div className="grid-main">
            {/* Left sidebar: Shopping Cart */}
            <div>
              <div className="glass-panel cart-panel">
                <h3 style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🛒 Basket</span>
                  <span className="status-pill status-delivered" style={{ fontSize: '0.75rem' }}>{cart.length} items</span>
                </h3>
                
                {cart.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem 0' }}>
                    Your basket is empty. Browse catalog to add items.
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {cart.map(item => (
                        <div key={item.product_id} className="cart-item">
                          <div className="cart-item-details">
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-mint)', fontWeight: 600 }}>
                              ${item.price} each
                            </span>
                          </div>
                          
                          <div className="cart-item-actions">
                            <button className="qty-btn" onClick={() => updateCartQty(item.product_id, -1, item.stock_quantity)}>-</button>
                            <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                            <button className="qty-btn" onClick={() => updateCartQty(item.product_id, 1, item.stock_quantity)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>
                        <span>Total:</span>
                        <span style={{ color: 'var(--accent-mint)' }}>
                          ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                      <button className="btn btn-primary" onClick={handleCheckout} style={{ width: '100%' }}>
                        Checkout Securely
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right main area: Tabs content */}
            <div>
              {activeTab === 'marketplace' && (
                <div>
                  {/* Filters Bar */}
                  <div className="glass-panel" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search crops, produce, dairy..." 
                      />
                    </div>
                    
                    <div>
                      <select 
                        className="form-control"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ minWidth: '150px' }}
                      >
                        <option value="All">All Categories</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains</option>
                      </select>
                    </div>
                  </div>

                  {/* Products Grid */}
                  {products.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>No items found matching your filters in current market catalog.</p>
                    </div>
                  ) : (
                    <div className="product-grid">
                      {products.map(prod => (
                        <div key={prod.product_id} className="glass-panel product-card hover-glow">
                          <span className="category-badge">{prod.category}</span>
                          <img 
                            className="product-image" 
                            src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} 
                            alt={prod.name} 
                          />
                          <h4 className="product-title">{prod.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Farm: <strong>{prod.farmer_farm_name}</strong>
                          </span>
                          
                          <div className="product-meta">
                            <div>
                              <div className="price-tag">${prod.price}</div>
                              <div className="stock-tag">{prod.stock_quantity} available</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => openReviewsModal(prod)}
                                title="Read Reviews"
                              >
                                ⭐
                              </button>
                              <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => addToCart(prod)}
                                disabled={prod.stock_quantity === 0}
                              >
                                {prod.stock_quantity === 0 ? 'Out of stock' : 'Add'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div>
                  <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                      ⚙️ MySQL Basket Co-occurrence engine
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      These recommendations are calculated by a MySQL Stored Procedure using a self-join query 
                      on past transactions across the whole marketplace. The similarity score represents the 
                      <strong> Jaccard Index</strong> of orders co-occurring between the products you've previously ordered 
                      and these suggested items.
                    </p>
                  </div>

                  <div className="product-grid">
                    {recommendations.map((rec, index) => {
                      const prod = rec.product;
                      return (
                        <div key={prod.product_id} className="glass-panel product-card hover-glow" style={{ borderTop: index < 3 ? '2px solid var(--accent-mint)' : '' }}>
                          <div className="recommendations-header">
                            <span className="category-badge">{prod.category}</span>
                            <span className="similarity-score-badge">Match: {(rec.score * 100).toFixed(0)}%</span>
                          </div>
                          
                          <img 
                            className="product-image" 
                            src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} 
                            alt={prod.name} 
                          />
                          <h4 className="product-title">{prod.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Farm: <strong>{prod.farmer_farm_name}</strong>
                          </span>
                          
                          <div className="product-meta">
                            <div>
                              <div className="price-tag">${prod.price}</div>
                              <div className="stock-tag">{prod.stock_quantity} available</div>
                            </div>
                            
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => addToCart(prod)}
                              disabled={prod.stock_quantity === 0}
                            >
                              Add suggested
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="glass-panel">
                  <h3 style={{ marginBottom: '1.5rem' }}>Your Past Orders</h3>
                  {orderHistory.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't placed any orders yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {orderHistory.map(order => (
                        <div key={order.order_id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <div>
                              <strong style={{ fontSize: '1rem' }}>Order #{order.order_id}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`status-pill status-${order.status}`}>{order.status}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {order.items.map(item => (
                              <div key={item.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>{item.product.name} (x{item.quantity})</span>
                                <span style={{ color: 'var(--text-secondary)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem', fontWeight: 700, fontSize: '0.95rem' }}>
                            <span>Total Price:</span>
                            <span style={{ color: 'var(--accent-mint)' }}>${parseFloat(order.total_price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

          {activeTab === 'listings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="gradient-text" style={{ fontSize: '1.3rem' }}>Crops & Produce Inventory</h3>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddProduct}>
                  + Add New Produce
                </button>
              </div>

              {farmerProducts.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Your product catalog is empty. Click "+ Add New Produce" above to create some.</p>
                </div>
              ) : (
                <div className="product-grid">
                  {farmerProducts.map(prod => (
                    <div key={prod.product_id} className="glass-panel product-card">
                      <span className="category-badge">{prod.category}</span>
                      <img 
                        className="product-image" 
                        src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} 
                        alt={prod.name} 
                      />
                      <h4 className="product-title">{prod.name}</h4>
                      
                      <div className="product-meta">
                        <div>
                          <div className="price-tag">${prod.price}</div>
                          <div className="stock-tag">{prod.stock_quantity} kg/units remaining</div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditProduct(prod)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProduct(prod.product_id)}
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
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem' }}>Orders Awaiting Shipment</h3>
              
              {farmerOrders.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No orders have been placed for your products yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {farmerOrders.map(order => (
                    <div key={order.order_id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div>
                          <strong>Order #{order.order_id}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                            Customer: <strong>{order.buyer_name}</strong>
                          </span>
                        </div>
                        
                        <div>
                          <span className={`status-pill status-${order.status}`} style={{ marginRight: '1rem' }}>{order.status}</span>
                        </div>
                      </div>

                      {/* Display items for this farmer */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {order.items.map(item => (
                          <div key={item.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span>🥬 {item.product.name} (x{item.quantity})</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          Earnings: <strong style={{ color: 'var(--accent-mint)' }}>${parseFloat(order.total_price).toFixed(2)}</strong>
                        </div>
                        
                        {/* Status controls */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', color: '#fff' }}
                              onClick={() => handleUpdateOrderStatus(order.order_id, 'shipped')}
                            >
                              Ship Cargo 🚀
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-mint)' }}
                              onClick={() => handleUpdateOrderStatus(order.order_id, 'delivered')}
                            >
                              Mark Delivered ✅
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transaction completed</span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- ADMIN PORTAL VIEW --- */}
      {role === 'admin' && (
        <div>
          {/* Sub Navigation */}
          <div className="nav-tabs" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
            <button 
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              📊 System Stats
            </button>
            <button 
              className={`tab-btn ${activeTab === 'markets' ? 'active' : ''}`}
              onClick={() => setActiveTab('markets')}
            >
              🏢 Markets Management
            </button>
            <button 
              className={`tab-btn ${activeTab === 'farmers' ? 'active' : ''}`}
              onClick={() => setActiveTab('farmers')}
            >
              🚜 Farmer Assignment
            </button>
            <button 
              className={`tab-btn ${activeTab === 'dbms' ? 'active' : ''}`}
              onClick={() => setActiveTab('dbms')}
            >
              ⚙️ live dbms logs
            </button>
          </div>

          {activeTab === 'stats' && (
            <div>
              {adminStats && (
                <div className="grid-3" style={{ marginBottom: '2rem' }}>
                  <div className="glass-panel stat-card">
                    <div className="stat-value">{adminStats.total_revenue ? `$${parseFloat(adminStats.total_revenue).toFixed(2)}` : '$0.00'}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                  <div className="glass-panel stat-card">
                    <div className="stat-value">{adminStats.total_orders}</div>
                    <div className="stat-label">Total Placed Orders</div>
                  </div>
                  <div className="glass-panel stat-card">
                    <div className="stat-value">{adminStats.total_farmers}</div>
                    <div className="stat-label">Registered Farmers</div>
                  </div>
                </div>
              )}

              {/* Global order logs */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1.25rem' }}>Global Order Book</h3>
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
                          <td>${parseFloat(order.total_price).toFixed(2)}</td>
                          <td>{new Date(order.created_at).toLocaleString()}</td>
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
            <div className="grid-main">
              {/* Left Side: Create Market */}
              <div>
                <div className="glass-panel">
                  <h3 style={{ marginBottom: '1.2rem' }}>Launch New Market</h3>
                  <form onSubmit={handleCreateMarket}>
                    <div className="form-group">
                      <label className="form-label">Market Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={marketFormName}
                        onChange={(e) => setMarketFormName(e.target.value)}
                        placeholder="e.g. City Greenfield Market" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={marketFormLocation}
                        onChange={(e) => setMarketFormLocation(e.target.value)}
                        placeholder="e.g. 5th Main Avenue, North Sector" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Operating Days</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={marketFormDays}
                        onChange={(e) => setMarketFormDays(e.target.value)}
                        placeholder="e.g. Mon, Wed, Sat" 
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                      Establish Market
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Side: Markets List */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1.2rem' }}>Current Active Markets</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Market ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Days Open</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminMarkets.map(m => (
                        <tr key={m.market_id}>
                          <td><strong>#{m.market_id}</strong></td>
                          <td>{m.name}</td>
                          <td>{m.location}</td>
                          <td>{m.open_days}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMarket(m.market_id)}>Delete</button>
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
            <div className="grid-main">
              {/* Left Form: Assign farmer */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1.2rem' }}>Link Farmer to Market Location</h3>
                <form onSubmit={handleAssignFarmer}>
                  <div className="form-group">
                    <label className="form-label">Select Farmer Farm</label>
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

                  <div className="form-group">
                    <label className="form-label">Assign to Market Place</label>
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

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Assign Farmer
                  </button>
                </form>
              </div>

              {/* Right Table: Assigned Farmers */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '1.2rem' }}>Registered Farmer Directory</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Farmer ID</th>
                        <th>Farm Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Assigned Market ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminFarmers.map(f => (
                        <tr key={f.farmer_id}>
                          <td><strong>#{f.farmer_id}</strong></td>
                          <td>{f.farm_name}</td>
                          <td>{f.email}</td>
                          <td>{f.phone}</td>
                          <td>
                            {f.market_id ? (
                              <span className="status-pill status-delivered">Market #{f.market_id}</span>
                            ) : (
                              <span className="status-pill status-pending">Unassigned</span>
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
            <div>
              {/* DBMS Logs */}
              <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️ NOTIFICATION_TRIGGER_LOG (Audit Trail)</span>
                  <span className="spotlight-tag">Trigger Log</span>
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  This table captures audits executed by the <strong>`tr_order_after_update`</strong> trigger in your MySQL database. 
                  Every time a farmer changes the status of an order, MySQL intercepts the action and writes to this audit table automatically.
                </p>

                <div className="data-table-container">
                  <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Log ID</th>
                        <th>Trigger Name</th>
                        <th>Action</th>
                        <th>Target Record ID</th>
                        <th>Audit Details</th>
                        <th>Fired Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.log_id}>
                          <td><strong>#{log.log_id}</strong></td>
                          <td><code style={{ color: 'var(--accent-mint)' }}>{log.trigger_name}</code></td>
                          <td><span className="status-pill status-confirmed">{log.action_type}</span></td>
                          <td>Order #{log.record_id}</td>
                          <td style={{ color: '#e2e8f0' }}>{log.details}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(log.fired_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Twilio Queue */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📨 Twilio WhatsApp Notification Queue (`NOTIFICATION_QUEUE`)</span>
                  <span className="spotlight-tag" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>Twilio Poller</span>
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  When orders change status, the MySQL trigger automatically queues formatted dispatch messages here. 
                  The FastAPI background worker polls this table and sends out notifications, updating the status from <code>pending</code> to <code>sent</code>.
                </p>

                <div className="data-table-container">
                  <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Queue ID</th>
                        <th>Order ID</th>
                        <th>Recipient Phone</th>
                        <th>Queued WhatsApp Message</th>
                        <th>Job Status</th>
                        <th>Queued At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationQueue.map(item => (
                        <tr key={item.notification_id}>
                          <td><strong>#{item.notification_id}</strong></td>
                          <td>Order #{item.order_id}</td>
                          <td><code>{item.phone}</code></td>
                          <td style={{ color: '#e2e8f0' }}>{item.message}</td>
                          <td>
                            <span className={`status-pill status-${item.status === 'sent' ? 'delivered' : 'pending'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- REVIEWS MODAL --- */}
      {activeReviewProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 className="gradient-text" style={{ fontSize: '1.25rem' }}>{activeReviewProduct.name} - Reviews</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveReviewProduct(null)}>Close</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <span className="category-badge" style={{ marginBottom: '0.5rem' }}>{activeReviewProduct.category}</span>
              <div style={{ fontSize: '1.15rem', color: 'var(--accent-mint)', fontWeight: 700 }}>Price: ${activeReviewProduct.price}</div>
            </div>

            {/* Write a review (Only Buyers can review) */}
            {role === 'buyer' && (
              <form onSubmit={submitReview} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Write a Review</h4>
                {reviewError && <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Error: {reviewError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Rating (1 to 5 Stars)</label>
                  <select className="form-control" value={newRating} onChange={(e) => setNewRating(e.target.value)}>
                    <option value="5">⭐⭐⭐⭐⭐ - 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ - 4 Stars</option>
                    <option value="3">⭐⭐⭐ - 3 Stars</option>
                    <option value="2">⭐⭐ - 2 Stars</option>
                    <option value="1">⭐ - 1 Star</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Provide your experience with this farmer's crop..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  Submit Customer Review
                </button>
              </form>
            )}

            <div className="reviews-section">
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Customer Feedbacks</h4>
              {productReviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No reviews posted for this item yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {productReviews.map(rev => (
                    <div key={rev.review_id} className="review-item">
                      <div className="review-header">
                        <strong>👤 {rev.buyer_name}</strong>
                        <span className="stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>{rev.comment}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 className="gradient-text" style={{ fontSize: '1.25rem' }}>
                {editingProduct ? 'Modify Crop Listing' : 'List New Fresh Cargo'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowProductModal(false)}>Cancel</button>
            </div>

            {prodFormError && (
              <div style={{ color: '#fca5a5', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
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
                  placeholder="e.g. Sweet Organic Carrots" 
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price per Unit ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="form-control" 
                    value={prodFormPrice} 
                    onChange={(e) => setProdFormPrice(e.target.value)} 
                    placeholder="e.g. 2.99" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Stock Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-control" 
                    value={prodFormStock} 
                    onChange={(e) => setProdFormStock(e.target.value)} 
                    placeholder="e.g. 100" 
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
                  placeholder="Paste direct URL to unsplash image" 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {editingProduct ? 'Save Crop Changes' : 'Launch Listing into Market'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
