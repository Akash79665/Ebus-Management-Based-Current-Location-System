import React, { useState, useEffect } from 'react';
import { MapPin, Bus, Clock, User, LogIn, UserPlus, Search, Menu, X, AlertCircle } from 'lucide-react';

// API Configuration - CONNECT TO YOUR BACKEND
const API_URL = 'http://localhost:5000/api';

// API functions
const API = {
  login: async (email, password, role) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      }
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },
  
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },
  
  addBus: async (busData, token) => {
    try {
      const response = await fetch(`${API_URL}/buses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(busData)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },
  
  getBuses: async () => {
    try {
      const response = await fetch(`${API_URL}/buses`);
      const data = await response.json();
      return data.data?.buses || [];
    } catch (error) {
      return [];
    }
  },
  
  searchBuses: async (source, destination) => {
    try {
      const response = await fetch(`${API_URL}/buses/search?source=${source}&destination=${destination}`);
      const data = await response.json();
      return data.data?.buses || [];
    } catch (error) {
      return [];
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
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadBuses();
    }
  }, [currentUser]);

  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 3000);
  };

  const loadBuses = async () => {
    const data = await API.getBuses();
    setBuses(data);
  };

  const handleLogin = async () => {
    const result = await API.login(loginData.email, loginData.password, loginData.role);
    if (result.success) {
      setCurrentUser(result.data.user);
      setView('dashboard');
      showAlert('Login successful!', 'success');
    } else {
      showAlert(result.message, 'error');
    }
  };

  const handleRegister = async () => {
    const result = await API.register(registerData);
    if (result.success) {
      showAlert('Registration successful! Please login.', 'success');
      setView('login');
    } else {
      showAlert(result.message, 'error');
    }
  };

  const handleAddBus = async () => {
    const token = localStorage.getItem('token');
    const result = await API.addBus(busData, token);
    if (result.success) {
      showAlert('Bus added successfully!', 'success');
      setBusData({
        busNumber: '', busType: '', source: '', destination: '',
        currentLocation: '', nextStop: '', capacity: '', driverName: '',
        driverPhone: '', distance: 10, traffic: 'low', previousStops: 0
      });
      loadBuses();
    } else {
      showAlert(result.message || 'Error adding bus', 'error');
    }
  };

  const handleSearch = async () => {
    const results = await API.searchBuses(searchData.source, searchData.destination);
    setSearchResults(results);
    showAlert(`Found ${results.length} buses`, 'info');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setView('login');
    showAlert('Logged out successfully', 'info');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex items-center justify-center mb-6">
            <Bus className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Bus Tracker</h1>
          </div>

          {alert.show && (
            <div className={`mb-4 p-3 rounded-lg flex items-center ${
              alert.type === 'success' ? 'bg-green-100 text-green-800' :
              alert.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <AlertCircle className="w-5 h-5 mr-2" />
              {alert.message}
            </div>
          )}

          <div className="flex mb-6 border-b">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-2 ${view === 'login' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex-1 py-2 ${view === 'register' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
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
      {/* Sidebar */}
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
            <p className={`text-sm ${sidebarOpen ? '' : 'hidden'}`}>{currentUser.name}</p>
            <p className="text-xs text-indigo-300">{currentUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-800 hover:bg-indigo-700 py-2 rounded"
          >
            {sidebarOpen ? 'Logout' : <LogIn className="w-5 h-5 mx-auto" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {alert.show && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            alert.type === 'success' ? 'bg-green-100 text-green-800' :
            alert.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <AlertCircle className="w-5 h-5 mr-2" />
            {alert.message}
          </div>
        )}

        {view === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, {currentUser.name}!</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Bus className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Total Buses</h3>
                <p className="text-3xl font-bold text-indigo-600">{buses.length}</p>
              </div>
            </div>
          </div>
        )}

        {view === 'addBus' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Add New Bus</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Bus Number"
                value={busData.busNumber}
                onChange={(e) => setBusData({...busData, busNumber: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={busData.busType}
                onChange={(e) => setBusData({...busData, busType: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Bus Type</option>
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Sleeper">Sleeper</option>
                <option value="Semi-Sleeper">Semi-Sleeper</option>
              </select>
              <input placeholder="Source" value={busData.source} onChange={(e) => setBusData({...busData, source: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input placeholder="Destination" value={busData.destination} onChange={(e) => setBusData({...busData, destination: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input placeholder="Current Location" value={busData.currentLocation} onChange={(e) => setBusData({...busData, currentLocation: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input placeholder="Next Stop" value={busData.nextStop} onChange={(e) => setBusData({...busData, nextStop: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="number" placeholder="Capacity" value={busData.capacity} onChange={(e) => setBusData({...busData, capacity: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input placeholder="Driver Name" value={busData.driverName} onChange={(e) => setBusData({...busData, driverName: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input placeholder="Driver Phone" value={busData.driverPhone} onChange={(e) => setBusData({...busData, driverPhone: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="number" placeholder="Distance (km)" value={busData.distance} onChange={(e) => setBusData({...busData, distance: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <button onClick={handleAddBus} className="md:col-span-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Add Bus</button>
            </div>
          </div>
        )}

        {view === 'search' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Search Buses</h2>
            <div className="flex gap-4 mb-6">
              <input placeholder="Source" value={searchData.source} onChange={(e) => setSearchData({...searchData, source: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg" />
              <input placeholder="Destination" value={searchData.destination} onChange={(e) => setSearchData({...searchData, destination: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg" />
              <button onClick={handleSearch} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Search</button>
            </div>
            <div className="space-y-4">
              {searchResults.map((bus) => (
                <div key={bus._id} className="border p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-indigo-600">{bus.busNumber}</h3>
                  <p>{bus.source} → {bus.destination}</p>
                  <p className="text-green-600 font-bold">{bus.estimatedTime} min ETA</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'viewBuses' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">All Buses</h2>
            <div className="space-y-4">
              {buses.map((bus) => (
                <div key={bus._id} className="border p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-indigo-600">{bus.busNumber}</h3>
                  <p>{bus.source} → {bus.destination}</p>
                  <p>Driver: {bus.driverName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusTrackingSystem;