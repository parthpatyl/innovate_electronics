const Subscriber = require('../models/Subscriber');
const Campaign = require('../models/Campaign');
const emailService = require('../services/emailService');
const crypto = require('crypto');

const newsletterController = {
  // Subscribe to newsletter
  subscribe: async (req, res) => {
    try {
      const { email, firstName, lastName, preferences } = req.body;

      // Check if subscriber already exists
      const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
      
      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          return res.status(400).json({
            success: false,
            message: 'You are already subscribed to our newsletter!'
          });
        } else {
          // Reactivate subscription
          existingSubscriber.isActive = true;
          existingSubscriber.firstName = firstName || existingSubscriber.firstName;
          existingSubscriber.lastName = lastName || existingSubscriber.lastName;
          existingSubscriber.preferences = preferences || existingSubscriber.preferences;
          await existingSubscriber.save();
          
          return res.json({
            success: true,
            message: 'Welcome back! Your subscription has been reactivated.'
          });
        }
      }

      // Create new subscriber
      const subscriber = new Subscriber({
        email: email.toLowerCase(),
        firstName,
        lastName,
        preferences,
        unsubscribeToken: crypto.randomBytes(32).toString('hex')
      });

      await subscriber.save();

      // Send welcome email (optional)
      try {
        await emailService.sendEmail(
          email,
          'Welcome to Innovate Electronics Newsletter!',
          `
            <h2>Welcome to Innovate Electronics!</h2>
            <p>Thank you for subscribing to our newsletter. You'll now receive updates about:</p>
            <ul>
              ${preferences?.categories?.map(cat => `<li>${cat.charAt(0).toUpperCase() + cat.slice(1)}</li>`).join('') || '<li>Latest electronics and technology news</li>'}
            </ul>
            <p>We're excited to keep you informed about the latest innovations!</p>
          `,
          subscriber.unsubscribeToken
        );
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
        // Don't fail the subscription if welcome email fails
      }

      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter!'
      });

    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe. Please try again.'
      });
    }
  },

  // Unsubscribe from newsletter
  unsubscribe: async (req, res) => {
    try {
      const { token, email } = req.query;

      let subscriber;
      
      if (token) {
        subscriber = await Subscriber.findOne({ unsubscribeToken: token });
      } else if (email) {
        subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
      }

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found.'
        });
      }

      subscriber.isActive = false;
      await subscriber.save();

      res.json({
        success: true,
        message: 'Successfully unsubscribed from newsletter.'
      });

    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      });
    }
  },

  // Get subscribers (admin only)
  getSubscribers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, sortBy = 'subscribedAt', sortOrder = 'desc' } = req.query;
      
      const query = { isActive: true };
      
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const subscribers = await Subscriber.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-unsubscribeToken');

      const total = await Subscriber.countDocuments(query);

      res.json({
        success: true,
        data: subscribers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSubscribers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get subscribers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscribers.'
      });
    }
  },

  // Get subscriber statistics
  getStats: async (req, res) => {
    try {
      const totalSubscribers = await Subscriber.countDocuments({ isActive: true });
      const newThisMonth = await Subscriber.countDocuments({
        isActive: true,
        subscribedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });
      
      const categoryStats = await Subscriber.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$preferences.categories' },
        { $group: { _id: '$preferences.categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const frequencyStats = await Subscriber.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$preferences.frequency', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          totalSubscribers,
          newThisMonth,
          categoryStats,
          frequencyStats
        }
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics.'
      });
    }
  },

  // Delete subscriber (admin only)
  deleteSubscriber: async (req, res) => {
    try {
      const { id } = req.params;

      const subscriber = await Subscriber.findByIdAndDelete(id);
      
      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found.'
        });
      }

      res.json({
        success: true,
        message: 'Subscriber deleted successfully.'
      });

    } catch (error) {
      console.error('Delete subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subscriber.'
      });
    }
  }
};

module.exports = newsletterController; 