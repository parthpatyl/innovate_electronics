const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add a default from address
  from: process.env.SMTP_FROM || `"Innovate Electronics" <no-reply@example.com>`,
};

let transporter;
let isConfigured = false;

if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
  transporter = nodemailer.createTransport(emailConfig);
  isConfigured = true;
}

const emailService = {
  getStatus: () => ({
    configured: isConfigured,
    host: emailConfig.host,
    port: emailConfig.port,
    user: emailConfig.auth.user ? '******' : undefined,
  }),

  /**
   * Verifies the SMTP connection.
   * @returns {Promise<object>} Connection status.
   */
  verifyConnection: async () => {
    if (!isConfigured) {
      return { status: 'unconfigured', message: 'Email service is not configured.' };
    }
    try {
      await transporter.verify();
      return { status: 'connected', message: 'SMTP connection successful.', config: emailConfig };
    } catch (error) {
      console.error('❌ SMTP Connection Error:', error);
      return { status: 'error', message: 'SMTP connection failed.', error: error.message };
    }
  },

  /**
   * Sends a single email.
   * @param {string} to - Recipient's email address.
   * @param {string} subject - Email subject.
   * @param {string} htmlBody - HTML content of the email.
   * @param {string} [imageData] - Optional Base64 image data to be embedded as 'main_image'.
   * @param {string} [unsubscribeToken] - Optional token for unsubscribe link.
   * @param {Array} [attachments] - Optional array of attachments for nodemailer.
   * @returns {Promise<object>} Result of the send operation.
   */
  sendEmail: async (to, subject, htmlBody, { imageData, unsubscribeToken, attachments = [] } = {}) => {
    if (!isConfigured) {
      console.error('Email service not configured. Cannot send email.');
      return { success: false, message: 'Email service not configured.' };
    }

    let finalHtml = htmlBody || '';
    const finalAttachments = [...attachments];

    // Embed the main imageData if provided
    if (imageData && imageData.startsWith('data:image')) {
      const [header, base64Data] = imageData.split(',');
      const imageType = header.match(/data:image\/([^;]+)/)?.[1] || 'png';
      const cid = 'main_image'; // Predictable CID

      finalAttachments.push({
        filename: `main_image.${imageType}`,
        content: base64Data,
        encoding: 'base64',
        cid: cid
      });
      // Note: The user is now responsible for adding <img src="cid:main_image"> to their htmlBody
    }

    // Find all base64 images and convert them to CID attachments
    const base64ImageRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"/g;
    let match;
    while ((match = base64ImageRegex.exec(finalHtml)) !== null) {
      const [fullMatch, imageType, base64Data] = match;
      const cid = `${crypto.randomBytes(16).toString('hex')}@innovate.electronics`;
      
      finalAttachments.push({
        filename: `image.${imageType}`,
        content: base64Data,
        encoding: 'base64',
        cid: cid
      });

      // Replace the original base64 src with the CID
      const newImgTag = fullMatch.replace(match[0], `<img src="cid:${cid}"`);
      finalHtml = finalHtml.replace(fullMatch, newImgTag);
    }

    if (unsubscribeToken) {
      const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/newsletter/unsubscribe/${unsubscribeToken}`;
      finalHtml += `<br><hr><p style="font-size: 12px; color: #888;">To unsubscribe from future emails, <a href="${unsubscribeUrl}">click here</a>.</p>`;
    }

    const mailOptions = {
      from: emailConfig.from,
      to,
      subject,
      html: finalHtml,
      // You can add a plain text version for clients that don't support HTML
      text: (htmlBody || '').replace(/<[^>]*>?/gm, ''), // Basic text conversion
      attachments: finalAttachments,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        email: to,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error);
      return {
        success: false,
        email: to,
        error: error.message,
      };
    }
  },

  /**
   * Sends emails to multiple recipients.
   * @param {Array<object>} recipients - Array of { email, unsubscribeToken }.
   * @param {string} subject - Email subject.
   * @param {string} htmlBody - HTML content of the email.
   * @param {string} [imageData] - Optional Base64 image data to be embedded as 'main_image'.
   * @param {Array} [attachments] - Optional array of attachments for nodemailer.
   * @param {number} [batchSize=10] - Number of emails to send in parallel.
   * @returns {Promise<Array<object>>} Array of results for each send operation.
   */
  sendBulkEmails: async (recipients, subject, htmlBody, { imageData, attachments = [], batchSize = 10 } = {}) => {
    if (!isConfigured) {
      console.error('Email service not configured. Cannot send bulk emails.');
      return recipients.map(r => ({ success: false, email: r.email, message: 'Email service not configured.' }));
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return [];
    }

    console.log(`🚀 Starting bulk email send for ${recipients.length} recipients...`);

    const allResults = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      console.log(`- Sending batch ${i / batchSize + 1} of ${Math.ceil(recipients.length / batchSize)}...`);
      
      const batchPromises = batch.map(recipient =>
        emailService.sendEmail(recipient.email, subject, htmlBody, {
          imageData,
          unsubscribeToken: recipient.unsubscribeToken,
          attachments
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);

      // Optional delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
      }
    }

    const successCount = allResults.filter(r => r.success).length;
    const failedCount = allResults.length - successCount;
    console.log(`✅ Bulk send complete. Success: ${successCount}, Failed: ${failedCount}`);

    return allResults;
  },
};

// Self-executing function for a quick connection check on startup
(async () => {
  if (isConfigured) {
    try {
      const verification = await emailService.verifyConnection();
      if (verification.status === 'connected') {
        console.log('📧 SMTP Connection Verified Successfully.');
      } else {
        console.warn('⚠️ SMTP Connection Verification Failed:', verification.message);
      }
    } catch (error) {
      console.error('Error during initial SMTP verification:', error);
    }
  }
})();

module.exports = emailService;
