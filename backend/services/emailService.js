const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

class EmailService {
  constructor() {
    this.transporter = null;
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many email requests from this IP, please try again later.'
    });
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // If using Gmail, you might need to use an app password
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransporter(emailConfig);
    } else {
      console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    }
  }

  generateEmailTemplate(subject, htmlBody, unsubscribeToken = null) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const unsubscribeLink = unsubscribeToken 
      ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
      : `${baseUrl}/unsubscribe`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #e1e5e9;
            padding-top: 20px;
            font-size: 0.9rem;
            color: #666;
          }
          .unsubscribe-link {
            color: #667eea;
            text-decoration: none;
          }
          .unsubscribe-link:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .email-container {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Innovate Electronics</div>
            <h1>${subject}</h1>
          </div>
          
          <div class="content">
            ${htmlBody}
          </div>
          
          <div class="footer">
            <p>© 2024 Innovate Electronics. All rights reserved.</p>
            <p>
              You're receiving this email because you subscribed to our newsletter.
              <br>
              <a href="${unsubscribeLink}" class="unsubscribe-link">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(to, subject, htmlBody, unsubscribeToken = null) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const htmlContent = this.generateEmailTemplate(subject, htmlBody, unsubscribeToken);

    const mailOptions = {
      from: `"Innovate Electronics" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: this.stripHtml(htmlBody) // Fallback text version
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        email: to
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message,
        email: to
      };
    }
  }

  async sendBulkEmails(recipients, subject, htmlBody, batchSize = 10) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const results = [];
    const batches = this.chunkArray(recipients, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Sending batch ${i + 1}/${batches.length} (${batch.length} emails)`);

      const batchPromises = batch.map(recipient => 
        this.sendEmail(recipient.email, subject, htmlBody, recipient.unsubscribeToken)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
            email: batch[index].email
          });
        }
      });

      // Rate limiting: wait between batches to avoid spam flags
      if (i < batches.length - 1) {
        await this.delay(1000); // 1 second delay between batches
      }
    }

    return results;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRateLimiter() {
    return this.rateLimiter;
  }
}

module.exports = new EmailService(); 