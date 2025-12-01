const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-tracker';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[DATABASE] Database Name: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('[DATABASE] Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[DATABASE ERROR] Mongoose connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[DATABASE] Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[DATABASE] MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`[DATABASE ERROR] Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;