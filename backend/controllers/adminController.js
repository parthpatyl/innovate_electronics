const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const adminController = {
  // Admin login
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find admin by username
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (admin.isLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      // Check if account is active
      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        await admin.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Reset login attempts on successful login
      await admin.resetLoginAttempts();

      // Generate JWT token
      const token = jwt.sign(
        { id: admin._id, username: admin.username, role: admin.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin
          }
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  },

  // Admin registration (super admin only)
  register: async (req, res) => {
    try {
      const { username, email, password, role = 'admin' } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ username }, { email }]
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      // Create new admin
      const admin = new Admin({
        username,
        email,
        password,
        role
      });

      await admin.save();

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });

    } catch (error) {
      console.error('Admin registration error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create admin'
      });
    }
  },

  // Get current admin profile
  getProfile: async (req, res) => {
    try {
      const admin = await Admin.findById(req.admin.id).select('-password');
      
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        data: admin
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  },

  // Update admin profile
  updateProfile: async (req, res) => {
    try {
      const { username, email } = req.body;
      const updateData = {};

      if (username) updateData.username = username;
      if (email) updateData.email = email;

      // Check if username or email already exists
      if (username || email) {
        const existingAdmin = await Admin.findOne({
          $or: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : [])
          ],
          _id: { $ne: req.admin.id }
        });

        if (existingAdmin) {
          return res.status(400).json({
            success: false,
            message: 'Username or email already exists'
          });
        }
      }

      const admin = await Admin.findByIdAndUpdate(
        req.admin.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: admin
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const admin = await Admin.findById(req.admin.id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  },

  // Get all admins (super admin only)
  getAllAdmins: async (req, res) => {
    try {
      const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

      res.json({
        success: true,
        data: admins
      });

    } catch (error) {
      console.error('Get all admins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admins'
      });
    }
  },

  // Deactivate admin (super admin only)
  deactivateAdmin: async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deactivating self
      if (id === req.admin.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      const admin = await Admin.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      ).select('-password');

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        message: 'Admin deactivated successfully',
        data: admin
      });

    } catch (error) {
      console.error('Deactivate admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate admin'
      });
    }
  },

  // Activate admin (super admin only)
  activateAdmin: async (req, res) => {
    try {
      const { id } = req.params;

      const admin = await Admin.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
      ).select('-password');

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        message: 'Admin activated successfully',
        data: admin
      });

    } catch (error) {
      console.error('Activate admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate admin'
      });
    }
  },

  // Logout (client-side token removal)
  logout: async (req, res) => {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
};

module.exports = adminController; 