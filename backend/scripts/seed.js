require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Bus = require('../models/Bus');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-tracker');
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Bus.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@bus.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      phone: '9876543210'
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Create driver users
    console.log('🚗 Creating driver accounts...');
    const drivers = await User.create([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@driver.com',
        password: 'driver123',
        role: 'driver',
        phone: '9876543211'
      },
      {
        name: 'Amit Sharma',
        email: 'amit@driver.com',
        password: 'driver123',
        role: 'driver',
        phone: '9876543212'
      },
      {
        name: 'Priya Singh',
        email: 'priya@driver.com',
        password: 'driver123',
        role: 'driver',
        phone: '9876543213'
      }
    ]);
    console.log(`✅ ${drivers.length} drivers created`);

    // Create regular users
    console.log('👥 Creating user accounts...');
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@user.com',
        password: 'user123',
        role: 'user',
        phone: '9876543214'
      },
      {
        name: 'Jane Smith',
        email: 'jane@user.com',
        password: 'user123',
        role: 'user',
        phone: '9876543215'
      }
    ]);
    console.log(`✅ ${users.length} users created`);

    // Create sample buses
    console.log('🚌 Creating sample buses...');
    const buses = await Bus.create([
      {
        busNumber: 'MH12AB1234',
        busType: 'AC',
        source: 'Mumbai',
        destination: 'Pune',
        currentLocation: 'Lonavala',
        nextStop: 'Khandala',
        capacity: 45,
        driverName: 'Rajesh Kumar',
        driverPhone: '9876543211',
        distance: 25,
        traffic: 'low',
        previousStops: 2,
        estimatedTime: 45,
        addedBy: drivers[0]._id,
        fare: 350,
        departureTime: '08:00 AM',
        arrivalTime: '11:30 AM',
        status: 'active'
      },
      {
        busNumber: 'MH14CD5678',
        busType: 'Non-AC',
        source: 'Delhi',
        destination: 'Jaipur',
        currentLocation: 'Gurgaon',
        nextStop: 'Neemrana',
        capacity: 50,
        driverName: 'Amit Sharma',
        driverPhone: '9876543212',
        distance: 220,
        traffic: 'medium',
        previousStops: 1,
        estimatedTime: 280,
        addedBy: drivers[1]._id,
        fare: 450,
        departureTime: '06:00 AM',
        arrivalTime: '11:00 AM',
        status: 'active'
      },
      {
        busNumber: 'KA01EF9012',
        busType: 'Sleeper',
        source: 'Bangalore',
        destination: 'Hyderabad',
        currentLocation: 'Anantapur',
        nextStop: 'Kurnool',
        capacity: 40,
        driverName: 'Priya Singh',
        driverPhone: '9876543213',
        distance: 150,
        traffic: 'high',
        previousStops: 3,
        estimatedTime: 360,
        addedBy: drivers[2]._id,
        fare: 800,
        departureTime: '10:00 PM',
        arrivalTime: '06:00 AM',
        status: 'active'
      },
      {
        busNumber: 'TN05GH3456',
        busType: 'Volvo',
        source: 'Chennai',
        destination: 'Coimbatore',
        currentLocation: 'Salem',
        nextStop: 'Erode',
        capacity: 48,
        driverName: 'Rajesh Kumar',
        driverPhone: '9876543211',
        distance: 120,
        traffic: 'low',
        previousStops: 2,
        estimatedTime: 210,
        addedBy: drivers[0]._id,
        fare: 650,
        departureTime: '07:00 AM',
        arrivalTime: '11:30 AM',
        status: 'active'
      },
      {
        busNumber: 'GJ09IJ7890',
        busType: 'Semi-Sleeper',
        source: 'Ahmedabad',
        destination: 'Surat',
        currentLocation: 'Vadodara',
        nextStop: 'Bharuch',
        capacity: 42,
        driverName: 'Amit Sharma',
        driverPhone: '9876543212',
        distance: 80,
        traffic: 'medium',
        previousStops: 1,
        estimatedTime: 120,
        addedBy: drivers[1]._id,
        fare: 300,
        departureTime: '09:00 AM',
        arrivalTime: '12:00 PM',
        status: 'active'
      }
    ]);
    console.log(`✅ ${buses.length} buses created`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\nDrivers:');
    drivers.forEach((driver, i) => {
      console.log(`  ${i + 1}. Email: ${driver.email} | Password: driver123`);
    });
    console.log('\nUsers:');
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. Email: ${user.email} | Password: user123`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();