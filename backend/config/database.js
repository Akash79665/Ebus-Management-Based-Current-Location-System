const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variable
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-tracker';
    
    console.log('[DATABASE] 🔄 Attempting to connect to MongoDB...');
    console.log('[DATABASE] 📍 Connection type:', mongoURI.includes('mongodb+srv') ? 'MongoDB Atlas ☁️' : 'Local MongoDB 💻');
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log('');
    console.log('========================================');
    console.log('[DATABASE] ✅ MongoDB Connected Successfully!');
    console.log(`[DATABASE] 🌐 Host: ${conn.connection.host}`);
    console.log(`[DATABASE] 📊 Database: ${conn.connection.name}`);
    console.log(`[DATABASE] 🔌 Port: ${conn.connection.port}`);
    console.log('========================================');
    console.log('');

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('[DATABASE] ✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[DATABASE] ❌ Mongoose connection error:', err.message);
      console.error('');
      console.error('💡 Troubleshooting Tips:');
      console.error('   1. Check if MONGODB_URI is set correctly in .env file');
      console.error('   2. Verify MongoDB Atlas password is correct');
      console.error('   3. Ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access');
      console.error('   4. Make sure your MongoDB cluster is active');
      console.error('');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[DATABASE] ⚠️ Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DATABASE] 🔄 Mongoose reconnected to MongoDB');
    });

    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[DATABASE] 🛑 MongoDB connection closed due to app termination (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('[DATABASE] 🛑 MongoDB connection closed due to app termination (SIGTERM)');
      process.exit(0);
    });

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('[DATABASE] ❌ FAILED to connect to MongoDB');
    console.error('[DATABASE] 🔴 Error:', error.message);
    console.error('========================================');
    console.error('');
    console.error('💡 Common Solutions:');
    console.error('   1. Check .env file exists in backend folder');
    console.error('   2. Verify MONGODB_URI in .env file');
    console.error('   3. If using Atlas: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error('   4. If using local: mongodb://localhost:27017/bus-tracker');
    console.error('   5. Whitelist your IP in MongoDB Atlas (0.0.0.0/0 for all IPs)');
    console.error('');
    process.exit(1);
  }
};

module.exports = connectDB;