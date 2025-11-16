const emailService = require('../services/emailService');

const contactController = {
  // Handle contact form submission
  submitContact: async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email, and message.'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }

      // Prepare email content
      const emailSubject = subject || `Contact Form Submission from ${name}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #003366; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; border-left: 4px solid #003366;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>This email was sent from the Innovate Electronics contact form.</p>
          </div>
        </div>
      `;

      // Send email to company (use environment variable or default)
      const recipientEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'info@innovate-electronics.com';
      
      const emailResult = await emailService.sendEmail(
        recipientEmail,
        emailSubject,
        htmlBody
      );

      if (emailResult.success) {
        // Optionally send confirmation email to user
        const confirmationHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto;">
            <div style="background-color: #003366; color: #ffffff; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Thank You for Contacting Us!</h2>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p>Dear ${name},</p>
              <p>Thank you for reaching out to Innovate Electronics. We have received your message and will get back to you as soon as possible.</p>
              <p>Your inquiry is important to us, and we typically respond within 24-48 hours.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 14px; color: #666;">If you have any urgent questions, please call us at +91 81231 55600.</p>
            </div>
          </div>
        `;

        // Send confirmation email (don't fail if this fails)
        try {
          await emailService.sendEmail(
            email,
            'Thank You for Contacting Innovate Electronics',
            confirmationHtml
          );
        } catch (confirmationError) {
          console.error('Failed to send confirmation email:', confirmationError);
          // Continue anyway
        }

        return res.json({
          success: true,
          message: 'Thank you for your message! We will get back to you soon.'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send email. Please try again later or contact us directly.'
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request. Please try again later.'
      });
    }
  }
};

module.exports = contactController;

