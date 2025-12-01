// Validation middleware for different routes

const validateRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Role validation
  const validRoles = ['admin', 'driver', 'user'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role specified');
  }

  if (errors.length > 0) {
    console.log('[VALIDATION ERROR] Registration validation failed:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  }

  if (!password || !password.trim()) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    console.log('[VALIDATION ERROR] Login validation failed:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateBusData = (req, res, next) => {
  const {
    busNumber,
    busType,
    source,
    destination,
    currentLocation,
    nextStop,
    capacity,
    driverName,
    driverPhone,
    distance,
    previousStops
  } = req.body;

  const errors = [];

  // Bus number validation
  if (!busNumber || busNumber.trim().length < 2) {
    errors.push('Bus number is required and must be at least 2 characters');
  }

  // Bus type validation
  const validBusTypes = ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Luxury', 'Volvo'];
  if (!busType || !validBusTypes.includes(busType)) {
    errors.push(`Bus type must be one of: ${validBusTypes.join(', ')}`);
  }

  // Location validations
  if (!source || source.trim().length < 2) {
    errors.push('Source location is required');
  }

  if (!destination || destination.trim().length < 2) {
    errors.push('Destination is required');
  }

  if (!currentLocation || currentLocation.trim().length < 2) {
    errors.push('Current location is required');
  }

  if (!nextStop || nextStop.trim().length < 2) {
    errors.push('Next stop is required');
  }

  // Capacity validation
  if (!capacity || capacity < 10 || capacity > 100) {
    errors.push('Capacity must be between 10 and 100');
  }

  // Driver validations
  if (!driverName || driverName.trim().length < 2) {
    errors.push('Driver name is required');
  }

  const phoneRegex = /^\d{10}$/;
  if (!driverPhone || !phoneRegex.test(driverPhone)) {
    errors.push('Driver phone must be a valid 10-digit number');
  }

  // Distance validation
  if (distance === undefined || distance < 0) {
    errors.push('Distance must be a non-negative number');
  }

  // Previous stops validation
  if (previousStops !== undefined && (previousStops < 0 || !Number.isInteger(Number(previousStops)))) {
    errors.push('Previous stops must be a non-negative integer');
  }

  if (errors.length > 0) {
    console.log('[VALIDATION ERROR] Bus data validation failed:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateSearchParams = (req, res, next) => {
  const { source, destination } = req.query;
  const errors = [];

  if (!source || source.trim().length < 1) {
    errors.push('Source parameter is required for search');
  }

  if (!destination || destination.trim().length < 1) {
    errors.push('Destination parameter is required for search');
  }

  if (errors.length > 0) {
    console.log('[VALIDATION ERROR] Search validation failed:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateBusData,
  validateSearchParams
};