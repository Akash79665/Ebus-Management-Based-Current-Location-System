import React, { useState, useEffect } from 'react';
import { MapPin, Bus, Clock, User, LogIn, UserPlus, Search, Menu, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔗 API URL:', API_URL);

// Toast notification helpers
const showToast = {
  success: (message) => toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  }),
  
  error: (message) => toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  }),
  
  info: (message) => toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
      fontWeight: '500',
    },
  }),
  
  loading: (message) => toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#6366F1',
      color: '#fff',
      fontWeight: '500',
    },
  }),
};

// API functions
const API = {
  login: async (email, password, role) => {
    try {
      console.log('📡 Attempting login...');
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await response.json();
      console.log('✅ Login response:', data.success ? 'Success' : 'Failed');
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      }
      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: 'Cannot connect to server. Make sure backend is running on port 5000.' 
      };
    }
  },
  
  register: async (userData) => {
    try {
      console.log('📡 Attempting registration...');
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      console.log('✅ Registration response:', data.success ? 'Success' : 'Failed');
      return data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        message: 'Cannot connect to server. Make sure backend is running.' 
      };
    }
  },
  
  addBus: async (busData, token) => {
    try {
      console.log('📡 Adding bus...');
      const response = await fetch(`${API_URL}/buses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(busData)
      });
      
      const data = await response.json();
      console.log('✅ Add bus response:', data.success ? 'Success' : 'Failed');
      return data;
    } catch (error) {
      console.error('❌ Add bus error:', error);
      return { 
        success: false, 
        message: 'Cannot connect to server' 
      };
    }
  },
  
  getBuses: async () => {
    try {
      console.log('📡 Fetching all buses...');
      const response = await fetch(`${API_URL}/buses`);
      const data = await response.json();
      console.log('✅ Buses loaded:', data.data?.buses?.length || 0);
      return data.data?.buses || [];
    } catch (error) {
      console.error('❌ Get buses error:', error);
      return [];
    }
  },
  
  searchBuses: async (source, destination) => {
    try {
      console.log('📡 Searching buses:', source, '→', destination);
      const response = await fetch(`${API_URL}/buses/search?source=${source}&destination=${destination}`);
      const data = await response.json();
      console.log('✅ Search results:', data.data?.buses?.length || 0);
      return data.data?.buses || [];
    } catch (error) {
      console.error('❌ Search error:', error);
      return [];
    }
  },

  checkHealth: async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Server not reachable' };
    }
  }
};

const BusTrackingSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'user' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [busData, setBusData] = useState({
    busNumber: '', busType: '', source: '', destination: '',
    currentLocation: '', nextStop: '', capacity: '', driverName: '',
    driverPhone: '', distance: 10, traffic: 'low', previousStops: 0
  });
  const [searchData, setSearchData] = useState({ source: '', destination: '' });
  const [buses, setBuses] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
        setView('dashboard');
      } catch (error) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
    checkServerHealth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadBuses();
    }
  }, [currentUser]);

  const checkServerHealth = async () => {
    const health = await API.checkHealth();
    setServerStatus(health.success ? 'connected' : 'disconnected');
    if (!health.success) {
      showToast.error('⚠️ Cannot connect to backend server');
    }
  };

  const loadBuses = async () => {
    const data = await API.getBuses();
    setBuses(data);
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      showToast.error('Please enter email and password');
      return;
    }

    const loadingToast = showToast.loading('Logging in...');
    
    const result = await API.login(loginData.email, loginData.password, loginData.role);
    
    toast.dismiss(loadingToast);
    
    if (result.success) {
      setCurrentUser(result.data.user);
      setView('dashboard');
      showToast.success(`🎉 Welcome back, ${result.data.user.name}!`);
    } else {
      showToast.error(result.message || 'Login failed');
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      showToast.error('Please fill all fields');
      return;
    }

    if (registerData.password.length < 6) {
      showToast.error('Password must be at least 6 characters');
      return;
    }

    const loadingToast = showToast.loading('Creating account...');
    
    const result = await API.register(registerData);
    
    toast.dismiss(loadingToast);
    
    if (result.success) {
      showToast.success('✅ Registration successful! Please login.');
      setView('login');
      setRegisterData({ name: '', email: '', password: '', role: 'user' });
    } else {
      showToast.error(result.message || 'Registration failed');
    }
  };

  const handleAddBus = async () => {
    if (!busData.busNumber || !busData.busType || !busData.source || !busData.destination) {
      showToast.error('Please fill all required fields');
      return;
    }

    const token = localStorage.getItem('token');
    const loadingToast = showToast.loading('Adding bus...');
    
    const result = await API.addBus(busData, token);
    
    toast.dismiss(loadingToast);
    
    if (result.success) {
      showToast.success(`🚌 Bus ${busData.busNumber} added successfully!`);
      setBusData({
        busNumber: '', busType: '', source: '', destination: '',
        currentLocation: '', nextStop: '', capacity: '', driverName: '',
        driverPhone: '', distance: 10, traffic: 'low', previousStops: 0
      });
      loadBuses();
    } else {
      showToast.error(result.message || 'Error adding bus');
    }
  };

  const handleSearch = async () => {
    if (!searchData.source || !searchData.destination) {
      showToast.error('Please enter source and destination');
      return;
    }

    const loadingToast = showToast.loading('Searching buses...');
    
    const results = await API.searchBuses(searchData.source, searchData.destination);
    
    toast.dismiss(loadingToast);
    
    setSearchResults(results);
    
    if (results.length > 0) {
      showToast.success(`Found ${results.length} bus(es) 🚌`);
    } else {
      showToast.info('No buses found for this route');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setView('login');
    showToast.info('👋 Logged out successfully');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Toaster />
        
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex items-center justify-center mb-6">
            <Bus className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Bus Tracker</h1>
          </div>

          <div className={`mb-4 p-2 rounded text-center text-sm ${
            serverStatus === 'connected' ? 'bg-green-100 text-green-800' : 
            serverStatus === 'disconnected' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {serverStatus === 'connected' ? ' Server Connected' : 
             serverStatus === 'disconnected' ? '❌ Server Disconnected - Check if backend is running' : 
             '🔄 Checking server...'}
          </div>

          <div className="flex mb-6 border-b">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-2 font-medium ${view === 'login' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex-1 py-2 font-medium ${view === 'register' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              Register
            </button>
          </div>

          {view === 'login' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={loginData.role}
                  onChange={(e) => setLoginData({...loginData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={serverStatus === 'disconnected'}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Demo: admin@bus.com / admin123
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={serverStatus === 'disconnected'}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster />
      
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold">Bus Tracker</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-indigo-800 rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-2">
          {(currentUser.role === 'driver' || currentUser.role === 'admin') && (
            <button
              onClick={() => setView('addBus')}
              className={`w-full flex items-center p-3 rounded hover:bg-indigo-800 ${view === 'addBus' ? 'bg-indigo-800' : ''}`}
            >
              <Bus className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Add Bus</span>}
            </button>
          )}
          
          <button
            onClick={() => setView('search')}
            className={`w-full flex items-center p-3 rounded hover:bg-indigo-800 ${view === 'search' ? 'bg-indigo-800' : ''}`}
          >
            <Search className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Search Bus</span>}
          </button>
          
          <button
            onClick={() => setView('viewBuses')}
            className={`w-full flex items-center p-3 rounded hover:bg-indigo-800 ${view === 'viewBuses' ? 'bg-indigo-800' : ''}`}
          >
            <MapPin className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">All Buses</span>}
          </button>
        </nav>
        
        <div className="p-4 border-t border-indigo-800">
          <div className={`${sidebarOpen ? '' : 'text-center'} mb-2`}>
            <p className={`text-sm font-medium ${sidebarOpen ? '' : 'hidden'}`}>{currentUser.name}</p>
            <p className="text-xs text-indigo-300">{currentUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-800 hover:bg-indigo-700 py-2 rounded transition"
          >
            {sidebarOpen ? 'Logout' : <LogIn className="w-5 h-5 mx-auto" />}
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {view === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, {currentUser.name}!</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Bus className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Total Buses</h3>
                <p className="text-3xl font-bold text-indigo-600">{buses.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <User className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Role</h3>
                <p className="text-2xl font-bold text-green-600 capitalize">{currentUser.role}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Clock className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Active Now</h3>
                <p className="text-3xl font-bold text-purple-600">{buses.filter(b => b.status === 'active').length}</p>
              </div>
            </div>
          </div>
        )}

        {view === 'addBus' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Add New Bus</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Bus Number *"
                value={busData.busNumber}
                onChange={(e) => setBusData({...busData, busNumber: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={busData.busType}
                onChange={(e) => setBusData({...busData, busType: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Bus Type *</option>
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Sleeper">Sleeper</option>
                <option value="Semi-Sleeper">Semi-Sleeper</option>
              </select>
              <input placeholder="Source *" value={busData.source} onChange={(e) => setBusData({...busData, source: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Destination *" value={busData.destination} onChange={(e) => setBusData({...busData, destination: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Current Location *" value={busData.currentLocation} onChange={(e) => setBusData({...busData, currentLocation: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Next Stop *" value={busData.nextStop} onChange={(e) => setBusData({...busData, nextStop: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input type="number" placeholder="Capacity *" value={busData.capacity} onChange={(e) => setBusData({...busData, capacity: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Driver Name *" value={busData.driverName} onChange={(e) => setBusData({...busData, driverName: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Driver Phone (10 digits) *" value={busData.driverPhone} onChange={(e) => setBusData({...busData, driverPhone: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input type="number" placeholder="Distance (km)" value={busData.distance} onChange={(e) => setBusData({...busData, distance: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleAddBus} className="md:col-span-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">Add Bus</button>
            </div>
          </div>
        )}

        {view === 'search' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Search Buses</h2>
            <div className="flex gap-4 mb-6">
              <input placeholder="Source" value={searchData.source} onChange={(e) => setSearchData({...searchData, source: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Destination" value={searchData.destination} onChange={(e) => setSearchData({...searchData, destination: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleSearch} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((bus) => (
                  <div key={bus._id} className="border border-gray-200 p-5 rounded-lg hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-indigo-600 mb-1">{bus.busNumber}</h3>
                        <p className="text-gray-700">{bus.source} → {bus.destination}</p>
                        <p className="text-sm text-gray-500 mt-1">Driver: {bus.driverName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-bold text-lg">{bus.estimatedTime} min</p>
                        <p className="text-sm text-gray-500">ETA</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No buses found. Try different source/destination.</p>
              )}
            </div>
          </div>
        )}

        {view === 'viewBuses' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">All Buses ({buses.length})</h2>
            <div className="space-y-4">
              {buses.length > 0 ? (
                buses.map((bus) => (
                  <div key={bus._id} className="border border-gray-200 p-5 rounded-lg hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-indigo-600 mb-1">{bus.busNumber}</h3>
                        <p className="text-gray-700 mb-1">{bus.source} → {bus.destination}</p>
                        <p className="text-sm text-gray-500">Driver: {bus.driverName} | Type: {bus.busType}</p>
                        <p className="text-sm text-gray-500">Capacity: {bus.capacity} | Status: <span className={`font-semibold ${bus.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{bus.status}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-bold text-lg">{bus.estimatedTime} min</p>
                        <p className="text-sm text-gray-500">ETA</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No buses available</p>
                  {(currentUser.role === 'driver' || currentUser.role === 'admin') && (
                    <button 
                      onClick={() => setView('addBus')}
                      className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Add First Bus
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusTrackingSystem;