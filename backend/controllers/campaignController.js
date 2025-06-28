const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const emailService = require('../services/emailService');

const campaignController = {
  // Create a new campaign
  createCampaign: async (req, res) => {
    try {
      const { subject, body, htmlBody, targetAudience, specificEmails, filters, scheduledFor } = req.body;

      const campaign = new Campaign({
        subject,
        body,
        htmlBody,
        targetAudience,
        specificEmails,
        filters,
        scheduledFor,
        sentBy: req.admin._id
      });

      await campaign.save();

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });

    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign'
      });
    }
  },

  // Get all campaigns
  getCampaigns: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const query = {};
      if (status) {
        query.status = status;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const campaigns = await Campaign.find(query)
        .populate('sentBy', 'username email')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Campaign.countDocuments(query);

      res.json({
        success: true,
        data: campaigns,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCampaigns: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaigns'
      });
    }
  },

  // Get campaign by ID
  getCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await Campaign.findById(id)
        .populate('sentBy', 'username email');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      res.json({
        success: true,
        data: campaign
      });

    } catch (error) {
      console.error('Get campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign'
      });
    }
  },

  // Update campaign
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow updating if campaign is already sent
      const existingCampaign = await Campaign.findById(id);
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      if (existingCampaign.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a sent campaign'
        });
      }

      const campaign = await Campaign.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('sentBy', 'username email');

      res.json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign
      });

    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign'
      });
    }
  },

  // Delete campaign
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      if (campaign.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a sent campaign'
        });
      }

      await Campaign.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });

    } catch (error) {
      console.error('Delete campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete campaign'
      });
    }
  },

  // Send campaign
  sendCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      if (campaign.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Campaign has already been sent'
        });
      }

      // Update campaign status to sending
      campaign.status = 'sending';
      await campaign.save();

      // Get recipients based on target audience
      let recipients = [];
      
      switch (campaign.targetAudience) {
        case 'all':
          recipients = await Subscriber.find({ isActive: true })
            .select('email unsubscribeToken');
          break;
          
        case 'specific':
          if (campaign.specificEmails && campaign.specificEmails.length > 0) {
            recipients = await Subscriber.find({
              email: { $in: campaign.specificEmails },
              isActive: true
            }).select('email unsubscribeToken');
          }
          break;
          
        case 'filtered':
          const filterQuery = { isActive: true };
          
          if (campaign.filters?.categories?.length > 0) {
            filterQuery['preferences.categories'] = { $in: campaign.filters.categories };
          }
          
          if (campaign.filters?.frequency) {
            filterQuery['preferences.frequency'] = campaign.filters.frequency;
          }
          
          if (campaign.filters?.subscribedAfter) {
            filterQuery.subscribedAt = { $gte: new Date(campaign.filters.subscribedAfter) };
          }
          
          if (campaign.filters?.subscribedBefore) {
            if (filterQuery.subscribedAt) {
              filterQuery.subscribedAt.$lte = new Date(campaign.filters.subscribedBefore);
            } else {
              filterQuery.subscribedAt = { $lte: new Date(campaign.filters.subscribedBefore) };
            }
          }
          
          recipients = await Subscriber.find(filterQuery)
            .select('email unsubscribeToken');
          break;
      }

      // Update campaign with recipient count
      campaign.recipientCount = recipients.length;
      await campaign.save();

      if (recipients.length === 0) {
        campaign.status = 'failed';
        campaign.failedCount = 0;
        await campaign.save();
        
        return res.status(400).json({
          success: false,
          message: 'No recipients found for this campaign'
        });
      }

      // Send emails
      const emailResults = await emailService.sendBulkEmails(
        recipients,
        campaign.subject,
        campaign.htmlBody
      );

      // Process results and update campaign
      let sentCount = 0;
      let failedCount = 0;
      const logs = [];

      emailResults.forEach(result => {
        if (result.success) {
          sentCount++;
          logs.push({
            email: result.email,
            status: 'sent',
            sentAt: new Date()
          });
        } else {
          failedCount++;
          logs.push({
            email: result.email,
            status: 'failed',
            error: result.error,
            sentAt: new Date()
          });
        }
      });

      // Update campaign with final status and logs
      campaign.status = failedCount === recipients.length ? 'failed' : 'sent';
      campaign.sentCount = sentCount;
      campaign.failedCount = failedCount;
      campaign.sentAt = new Date();
      campaign.logs = logs;
      await campaign.save();

      res.json({
        success: true,
        message: `Campaign sent successfully. ${sentCount} emails sent, ${failedCount} failed.`,
        data: {
          totalRecipients: recipients.length,
          sentCount,
          failedCount,
          successRate: campaign.successRate
        }
      });

    } catch (error) {
      console.error('Send campaign error:', error);
      
      // Update campaign status to failed if error occurs
      if (req.params.id) {
        try {
          await Campaign.findByIdAndUpdate(req.params.id, {
            status: 'failed',
            failedCount: 0
          });
        } catch (updateError) {
          console.error('Failed to update campaign status:', updateError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to send campaign'
      });
    }
  },

  // Get campaign statistics
  getCampaignStats: async (req, res) => {
    try {
      const totalCampaigns = await Campaign.countDocuments();
      const sentCampaigns = await Campaign.countDocuments({ status: 'sent' });
      const draftCampaigns = await Campaign.countDocuments({ status: 'draft' });
      const failedCampaigns = await Campaign.countDocuments({ status: 'failed' });

      const totalEmailsSent = await Campaign.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, total: { $sum: '$sentCount' } } }
      ]);

      const recentCampaigns = await Campaign.find({ status: 'sent' })
        .sort({ sentAt: -1 })
        .limit(5)
        .select('subject sentAt sentCount recipientCount');

      res.json({
        success: true,
        data: {
          totalCampaigns,
          sentCampaigns,
          draftCampaigns,
          failedCampaigns,
          totalEmailsSent: totalEmailsSent[0]?.total || 0,
          recentCampaigns
        }
      });

    } catch (error) {
      console.error('Get campaign stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign statistics'
      });
    }
  }
};

module.exports = campaignController; 