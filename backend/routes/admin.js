const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bus = require('../models/Bus');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    console.log(`[ADMIN] Retrieved ${users.length} users by ${req.user.email}`);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { users }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   POST /api/admin/create-driver
// @desc    Create a driver account
// @access  Private (Admin only)
router.post('/create-driver', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[ADMIN ERROR] Email already exists: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create driver account
    const driver = await User.create({
      name,
      email,
      password,
      role: 'driver',
      phone
    });

    console.log(`[ADMIN] Driver account created: ${email} by admin ${req.user.email}`);
    logActivity('DRIVER_CREATED', req.user._id, { 
      driverEmail: email, 
      createdBy: req.user.email 
    });

    res.status(201).json({
      success: true,
      message: 'Driver account created successfully',
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          role: driver.role
        }
      }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error creating driver account',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user by ID
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, phone, isActive } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (phone) updateFields.phone = phone;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log(`[ADMIN ERROR] User not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`[ADMIN] User ${user.email} updated by ${req.user.email}`);
    logActivity('USER_UPDATED', req.user._id, { 
      updatedUser: user.email, 
      changes: updateFields 
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user by ID
// @access  Private (Admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      console.log(`[ADMIN ERROR] User not found for deletion: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    console.log(`[ADMIN] User ${user.email} deleted by ${req.user.email}`);
    logActivity('USER_DELETED', req.user._id, { 
      deletedUser: user.email 
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Activate/Deactivate user
// @access  Private (Admin only)
router.put('/users/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    console.log(`[ADMIN] User ${user.email} status changed to ${user.isActive ? 'active' : 'inactive'} by ${req.user.email}`);
    logActivity('USER_STATUS_CHANGED', req.user._id, { 
      user: user.email, 
      isActive: user.isActive 
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error changing user status',
      error: error.message
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Bus statistics
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const busesByType = await Bus.aggregate([
      { $group: { _id: '$busType', count: { $sum: 1 } } }
    ]);

    // Recent activities
    const recentBuses = await Bus.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('addedBy', 'name email');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    console.log(`[ADMIN] Dashboard accessed by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole
        },
        buses: {
          total: totalBuses,
          active: activeBuses,
          byType: busesByType
        },
        recent: {
          buses: recentBuses,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/logs
// @desc    Get system logs (if stored in DB)
// @access  Private (Admin only)
router.get('/logs', protect, authorize('admin'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logsDir = path.join(__dirname, '../logs');
    const logFiles = fs.existsSync(logsDir) ? fs.readdirSync(logsDir) : [];

    console.log(`[ADMIN] Logs accessed by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: { logFiles }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: error.message
    });
  }
});

// @route   POST /api/admin/bulk-action
// @desc    Perform bulk actions on users
// @access  Private (Admin only)
router.post('/bulk-action', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Action and userIds array are required'
      });
    }

    let result;
    
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
      
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
      
      case 'delete':
        // Prevent deleting admin's own account
        const filteredIds = userIds.filter(id => id !== req.user._id.toString());
        result = await User.deleteMany({ _id: { $in: filteredIds } });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    console.log(`[ADMIN] Bulk action '${action}' performed on ${userIds.length} users by ${req.user.email}`);
    logActivity('BULK_ACTION', req.user._id, { action, userCount: userIds.length });

    res.status(200).json({
      success: true,
      message: `Bulk action '${action}' completed successfully`,
      data: { result }
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk action',
      error: error.message
    });
  }
});

module.exports = router;