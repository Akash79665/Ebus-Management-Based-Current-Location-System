const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  busType: {
    type: String,
    required: [true, 'Bus type is required'],
    enum: ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Luxury', 'Volvo'],
    default: 'Non-AC'
  },
  source: {
    type: String,
    required: [true, 'Source location is required'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  currentLocation: {
    type: String,
    required: [true, 'Current location is required'],
    trim: true
  },
  nextStop: {
    type: String,
    required: [true, 'Next stop is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [10, 'Capacity must be at least 10'],
    max: [100, 'Capacity cannot exceed 100']
  },
  driverName: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true
  },
  driverPhone: {
    type: String,
    required: [true, 'Driver phone is required'],
    trim: true,
    match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number']
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [0, 'Distance cannot be negative']
  },
  traffic: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  previousStops: {
    type: Number,
    default: 0,
    min: [0, 'Previous stops cannot be negative']
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: [0, 'Estimated time cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'delayed', 'cancelled'],
    default: 'active'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  fare: {
    type: Number,
    min: [0, 'Fare cannot be negative']
  },
  departureTime: {
    type: String,
    trim: true
  },
  arrivalTime: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
busSchema.index({ source: 1, destination: 1 });
busSchema.index({ busNumber: 1 });
busSchema.index({ status: 1 });
busSchema.index({ createdAt: -1 });

// Update timestamp on modification
busSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to calculate arrival time
busSchema.statics.calculateArrivalTime = function(distance, traffic, previousStops) {
  const baseSpeed = 40; // km/h
  const trafficMultiplier = {
    'low': 1.0,
    'medium': 0.75,
    'high': 0.5
  };
  
  const effectiveSpeed = baseSpeed * trafficMultiplier[traffic];
  const travelTime = (distance / effectiveSpeed) * 60; // minutes
  const stopDelay = previousStops * 2; // 2 minutes per stop
  
  return Math.round(travelTime + stopDelay);
};

// Instance method to update location
busSchema.methods.updateLocation = function(newLocation, nextStop) {
  this.currentLocation = newLocation;
  this.nextStop = nextStop;
  this.updatedAt = Date.now();
  return this.save();
};

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;