const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const { protect, authorize } = require('../middleware/auth');
const { validateBusData, validateSearchParams } = require('../middleware/validator');
const { logActivity } = require('../middleware/logger');

// @route   POST /api/buses
// @desc    Add a new bus
// @access  Private (Driver, Admin only)
router.post('/', protect, authorize('driver', 'admin'), validateBusData, async (req, res) => {
  try {
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
      traffic,
      previousStops,
      fare,
      departureTime,
      arrivalTime,
      coordinates
    } = req.body;

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
    if (existingBus) {
      console.log(`[BUS ERROR] Bus number already exists: ${busNumber}`);
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      });
    }

    // Calculate estimated arrival time
    const estimatedTime = Bus.calculateArrivalTime(distance, traffic || 'low', previousStops || 0);

    // Create bus
    const bus = await Bus.create({
      busNumber: busNumber.toUpperCase(),
      busType,
      source,
      destination,
      currentLocation,
      nextStop,
      capacity,
      driverName,
      driverPhone,
      distance,
      traffic: traffic || 'low',
      previousStops: previousStops || 0,
      estimatedTime,
      addedBy: req.user._id,
      fare,
      departureTime,
      arrivalTime,
      coordinates
    });

    console.log(`[BUS ADDED] Bus ${bus.busNumber} added by ${req.user.email}`);
    logActivity('BUS_ADDED', req.user._id, { 
      busNumber: bus.busNumber, 
      route: `${source} to ${destination}` 
    });

    res.status(201).json({
      success: true,
      message: 'Bus added successfully',
      data: { bus }
    });
  } catch (error) {
    console.error('[BUS ADD ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error adding bus',
      error: error.message
    });
  }
});

// @route   GET /api/buses
// @desc    Get all buses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, busType, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (busType) query.busType = busType;

    const skip = (page - 1) * limit;

    const buses = await Bus.find(query)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bus.countDocuments(query);

    console.log(`[BUS FETCH] Retrieved ${buses.length} buses`);

    res.status(200).json({
      success: true,
      count: buses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { buses }
    });
  } catch (error) {
    console.error('[BUS FETCH ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buses',
      error: error.message
    });
  }
});

// @route   GET /api/buses/search
// @desc    Search buses by source and destination
// @access  Public
router.get('/search', validateSearchParams, async (req, res) => {
  try {
    const { source, destination } = req.query;

    const buses = await Bus.find({
      source: new RegExp(source, 'i'),
      destination: new RegExp(destination, 'i'),
      status: 'active'
    })
    .populate('addedBy', 'name email')
    .sort({ estimatedTime: 1 });

    console.log(`[BUS SEARCH] Search: ${source} to ${destination} - Found ${buses.length} buses`);
    logActivity('BUS_SEARCH', 'guest', { source, destination, results: buses.length });

    res.status(200).json({
      success: true,
      count: buses.length,
      data: { buses }
    });
  } catch (error) {
    console.error('[BUS SEARCH ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error searching buses',
      error: error.message
    });
  }
});

// @route   GET /api/buses/:id
// @desc    Get single bus by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('addedBy', 'name email phone');

    if (!bus) {
      console.log(`[BUS ERROR] Bus not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    console.log(`[BUS FETCH] Retrieved bus: ${bus.busNumber}`);

    res.status(200).json({
      success: true,
      data: { bus }
    });
  } catch (error) {
    console.error('[BUS FETCH ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bus',
      error: error.message
    });
  }
});

// @route   PUT /api/buses/:id
// @desc    Update bus information
// @access  Private (Driver, Admin only)
router.put('/:id', protect, authorize('driver', 'admin'), async (req, res) => {
  try {
    let bus = await Bus.findById(req.params.id);

    if (!bus) {
      console.log(`[BUS ERROR] Bus not found for update: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Check if user is authorized to update (owner or admin)
    if (bus.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log(`[BUS ERROR] Unauthorized update attempt by ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bus'
      });
    }

    // Recalculate estimated time if relevant fields changed
    if (req.body.distance || req.body.traffic || req.body.previousStops) {
      const distance = req.body.distance || bus.distance;
      const traffic = req.body.traffic || bus.traffic;
      const previousStops = req.body.previousStops || bus.previousStops;
      req.body.estimatedTime = Bus.calculateArrivalTime(distance, traffic, previousStops);
    }

    bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    console.log(`[BUS UPDATE] Bus ${bus.busNumber} updated by ${req.user.email}`);
    logActivity('BUS_UPDATED', req.user._id, { busNumber: bus.busNumber });

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: { bus }
    });
  } catch (error) {
    console.error('[BUS UPDATE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bus',
      error: error.message
    });
  }
});

// @route   PUT /api/buses/:id/location
// @desc    Update bus location
// @access  Private (Driver, Admin only)
router.put('/:id/location', protect, authorize('driver', 'admin'), async (req, res) => {
  try {
    const { currentLocation, nextStop, coordinates } = req.body;

    if (!currentLocation || !nextStop) {
      return res.status(400).json({
        success: false,
        message: 'Current location and next stop are required'
      });
    }

    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    bus.currentLocation = currentLocation;
    bus.nextStop = nextStop;
    if (coordinates) bus.coordinates = coordinates;
    bus.updatedAt = Date.now();

    await bus.save();

    console.log(`[BUS LOCATION] Location updated for bus ${bus.busNumber}`);
    logActivity('BUS_LOCATION_UPDATED', req.user._id, { 
      busNumber: bus.busNumber, 
      location: currentLocation 
    });

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: { bus }
    });
  } catch (error) {
    console.error('[BUS LOCATION ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

// @route   DELETE /api/buses/:id
// @desc    Delete a bus
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      console.log(`[BUS ERROR] Bus not found for deletion: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    await bus.deleteOne();

    console.log(`[BUS DELETE] Bus ${bus.busNumber} deleted by ${req.user.email}`);
    logActivity('BUS_DELETED', req.user._id, { busNumber: bus.busNumber });

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    console.error('[BUS DELETE ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bus',
      error: error.message
    });
  }
});

// @route   GET /api/buses/stats/overview
// @desc    Get bus statistics
// @access  Private (Admin only)
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const inactiveBuses = await Bus.countDocuments({ status: 'inactive' });
    
    const avgArrivalTime = await Bus.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$estimatedTime' } } }
    ]);

    const busTypeDistribution = await Bus.aggregate([
      { $group: { _id: '$busType', count: { $sum: 1 } } }
    ]);

    console.log(`[BUS STATS] Statistics retrieved by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: {
        totalBuses,
        activeBuses,
        inactiveBuses,
        avgArrivalTime: avgArrivalTime[0]?.avgTime || 0,
        busTypeDistribution
      }
    });
  } catch (error) {
    console.error('[BUS STATS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;