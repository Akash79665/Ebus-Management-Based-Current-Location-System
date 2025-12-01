const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Get current date for log file naming
const getLogFileName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
};

// Log to file
const logToFile = (message) => {
  const logFile = path.join(logsDir, getLogFileName());
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  const requestLog = `${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`;
  console.log(`[REQUEST] ${requestLog}`);
  logToFile(`[REQUEST] ${requestLog}`);

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = `${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`;
    console.log(`[RESPONSE] ${responseLog}`);
    logToFile(`[RESPONSE] ${responseLog}`);
  });

  next();
};

// Error logger
const errorLogger = (err, req, res, next) => {
  const errorLog = `ERROR: ${err.message} - Route: ${req.method} ${req.originalUrl} - Stack: ${err.stack}`;
  console.error(`[ERROR] ${errorLog}`);
  logToFile(`[ERROR] ${errorLog}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Activity logger (for important actions)
const logActivity = (action, userId, details) => {
  const activityLog = `ACTIVITY: ${action} - User: ${userId} - Details: ${JSON.stringify(details)}`;
  console.log(`[ACTIVITY] ${activityLog}`);
  logToFile(`[ACTIVITY] ${activityLog}`);
};

module.exports = { requestLogger, errorLogger, logActivity, logToFile };