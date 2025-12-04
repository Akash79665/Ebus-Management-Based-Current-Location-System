require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Bus = require('../models/Bus');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-tracker';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Bus.deleteMany({});
    console.log('✅ Existing data cleared');
    console.log('');

    // Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@bus.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      phone: '9876543210',
      isActive: true
    });
    console.log('✅ Admin user created:', admin.email);
    console.log('');

    // Create Sample Driver
    console.log('👤 Creating sample driver...');
    const driver = await User.create({
      name: 'Rajesh Kumar',
      email: 'driver@bus.com',
      password: 'driver123',
      role: 'driver',
      phone: '9876543211',
      isActive: true
    });
    console.log('✅ Driver user created:', driver.email);
    console.log('');

    // Create Sample User
    console.log('👤 Creating sample user...');
    const user = await User.create({
      name: 'John Doe',
      email: 'user@bus.com',
      password: 'user123',
      role: 'user',
      phone: '9876543212',
      isActive: true
    });
    console.log('✅ Regular user created:', user.email);
    console.log('');

    // Create Sample Buses
    console.log('🚌 Creating sample buses...');
    
    const sampleBuses = [
      {
        busNumber: 'MH12AB1234',
        busType: 'AC',
        source: 'Mumbai',
        destination: 'Pune',
        currentLocation: 'Mumbai Central',
        nextStop: 'Dadar',
        capacity: 40,
        driverName: 'Rajesh Kumar',
        driverPhone: '9876543211',
        distance: 150,
        traffic: 'medium',
        previousStops: 2,
        estimatedTime: 180,
        status: 'active',
        addedBy: admin._id,
        fare: 350,
        departureTime: '08:00 AM',
        arrivalTime: '11:00 AM'
      },
      {
        busNumber: 'MH14CD5678',
        busType: 'Non-AC',
        source: 'Nagpur',
        destination: 'Mumbai',
        currentLocation: 'Nashik',
        nextStop: 'Thane',
        capacity: 50,
        driverName: 'Amit Sharma',
        driverPhone: '9876543213',
        distance: 200,
        traffic: 'low',
        previousStops: 5,
        estimatedTime: 240,
        status: 'active',
        addedBy: admin._id,
        fare: 500,
        departureTime: '06:00 AM',
        arrivalTime: '10:00 AM'
      },
      {
        busNumber: 'MH31XY9012',
        busType: 'Sleeper',
        source: 'Pune',
        destination: 'Goa',
        currentLocation: 'Satara',
        nextStop: 'Kolhapur',
        capacity: 30,
        driverName: 'Suresh Patil',
        driverPhone: '9876543214',
        distance: 450,
        traffic: 'low',
        previousStops: 3,
        estimatedTime: 540,
        status: 'active',
        addedBy: driver._id,
        fare: 800,
        departureTime: '10:00 PM',
        arrivalTime: '07:00 AM'
      },
      {
        busNumber: 'MH02EF3456',
        busType: 'Semi-Sleeper',
        source: 'Nagpur',
        destination: 'Pune',
        currentLocation: 'Aurangabad',
        nextStop: 'Ahmednagar',
        capacity: 45,
        driverName: 'Vijay Desai',
        driverPhone: '9876543215',
        distance: 350,
        traffic: 'medium',
        previousStops: 4,
        estimatedTime: 420,
        status: 'active',
        addedBy: driver._id,
        fare: 600,
        departureTime: '05:00 AM',
        arrivalTime: '12:00 PM'
      },
      {
        busNumber: 'MH20GH7890',
        busType: 'Volvo',
        source: 'Mumbai',
        destination: 'Bangalore',
        currentLocation: 'Pune',
        nextStop: 'Satara',
        capacity: 35,
        driverName: 'Prakash Rao',
        driverPhone: '9876543216',
        distance: 850,
        traffic: 'high',
        previousStops: 1,
        estimatedTime: 960,
        status: 'active',
        addedBy: admin._id,
        fare: 1200,
        departureTime: '09:00 PM',
        arrivalTime: '01:00 PM'
      }
    ];

    const buses = await Bus.insertMany(sampleBuses);
    console.log(`✅ ${buses.length} sample buses created`);
    console.log('');

    // Summary
    console.log('========================================');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Buses: ${await Bus.countDocuments()}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('');
    console.log('   Admin:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('');
    console.log('   Driver:');
    console.log(`   📧 Email: ${driver.email}`);
    console.log(`   🔑 Password: driver123`);
    console.log('');
    console.log('   User:');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔑 Password: user123`);
    console.log('');
    console.log('========================================');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error seeding database:', error.message);
    console.error('');
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('');
    process.exit(1);
  }
};

// Run seeder
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
};

runSeeder();