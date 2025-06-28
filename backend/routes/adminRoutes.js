const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireRole } = require('../middleware/auth');
const { validateAdminLogin, validateAdminRegistration } = require('../middleware/validation');

// Public routes
router.post('/login', validateAdminLogin, adminController.login);
router.post('/register', validateAdminRegistration, adminController.register);

// Protected routes
router.use(auth);

// Profile management
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);
router.post('/change-password', adminController.changePassword);
router.post('/logout', adminController.logout);

// Admin management (super admin only)
router.get('/admins', requireRole(['super_admin']), adminController.getAllAdmins);
router.post('/admins/:id/deactivate', requireRole(['super_admin']), adminController.deactivateAdmin);
router.post('/admins/:id/activate', requireRole(['super_admin']), adminController.activateAdmin);

module.exports = router; 