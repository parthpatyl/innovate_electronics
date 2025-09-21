// emailService.integration.test.js
const emailService = require('../services/emailService');
require('dotenv').config();

describe('EmailService Integration Tests', () => {
  // Only run these tests when explicitly requested
  const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
  const testEmail = process.env.TEST_EMAIL; // Your email address

  beforeAll(async () => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests. Set RUN_INTEGRATION_TESTS=true and TEST_EMAIL in .env to enable.');
      return;
    }

    if (!testEmail) {
      throw new Error('TEST_EMAIL environment variable is required for integration tests');
    }

    // Verify SMTP configuration
    const status = emailService.getStatus();
    console.log('EmailService Status:', JSON.stringify(status, null, 2));

    if (!status.configured) {
      throw new Error('Email service is not properly configured. Check your SMTP environment variables.');
    }
  });

  (runIntegrationTests ? describe : describe.skip)('Real Email Tests', () => {
    
    it('should verify SMTP connection', async () => {
      const connectionResult = await emailService.verifyConnection();
      console.log('Connection verification:', connectionResult);
      
      expect(connectionResult.status).toBe('connected');
      expect(connectionResult.config).toHaveProperty('host');
      expect(connectionResult.config).toHaveProperty('port');
      expect(connectionResult.config).toHaveProperty('auth.user');
    }, 30000); // 30 second timeout

    it('should send a simple test email', async () => {
      const subject = 'EmailService Test - Simple Email';
      const htmlBody = `
        <h2>Test Email</h2>
        <p>This is a test email sent on ${new Date().toLocaleString()}</p>
        <p>If you received this, your EmailService is working correctly!</p>
        <ul>
          <li>Service: Configured ✅</li>
          <li>SMTP: Connected ✅</li>
          <li>Email Delivery: Working ✅</li>
        </ul>
      `;

      const result = await emailService.sendEmail(testEmail, subject, htmlBody);
      
      console.log('Send result:', result);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.email).toBe(testEmail);
      expect(result.timestamp).toBeDefined();
    }, 30000);

    it('should send email with unsubscribe token', async () => {
      const subject = 'EmailService Test - With Unsubscribe Token';
      const htmlBody = `
        <h2>Test Email with Unsubscribe</h2>
        <p>This email includes an unsubscribe token for testing.</p>
        <p>Check the footer for the unsubscribe link.</p>
      `;
      const unsubscribeToken = 'test-token-123';

      const result = await emailService.sendEmail(testEmail, subject, htmlBody, unsubscribeToken);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    }, 30000);

    it('should send rich HTML email', async () => {
      const subject = 'EmailService Test - Rich HTML Content';
      const htmlBody = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; margin-bottom: 20px;">
          <h1>🎉 Rich HTML Email Test</h1>
          <p>This email tests various HTML elements and styling.</p>
        </div>
        
        <h2>Features Tested:</h2>
        <ol>
          <li><strong>Bold text</strong> and <em>italic text</em></li>
          <li><a href="https://example.com" style="color: #667eea;">Links</a></li>
          <li>Lists (this is an ordered list)</li>
          <li>Images: <img src="https://via.placeholder.com/100x50/667eea/white?text=Test" alt="Test Image" style="vertical-align: middle; border-radius: 5px;"></li>
        </ol>

        <blockquote style="border-left: 4px solid #667eea; padding-left: 15px; margin: 20px 0; font-style: italic; color: #666;">
          "This is a blockquote to test styling."
        </blockquote>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 8px;">Feature</th>
              <th style="border: 1px solid #dee2e6; padding: 8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 8px;">HTML Rendering</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">✅ Working</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 8px;">CSS Styles</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">✅ Applied</td>
            </tr>
          </tbody>
        </table>

        <p style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
          📧 <strong>Test completed successfully!</strong> Your EmailService is handling rich HTML content properly.
        </p>
      `;

      const result = await emailService.sendEmail(testEmail, subject, htmlBody, 'rich-html-test');
      
      expect(result.success).toBe(true);
    }, 30000);

    it('should handle bulk email sending (small batch)', async () => {
      const recipients = [
        { email: testEmail, unsubscribeToken: 'bulk-test-1' },
        { email: testEmail, unsubscribeToken: 'bulk-test-2' } // Sending to same email for testing
      ];

      const subject = 'EmailService Test - Bulk Email';
      const htmlBody = `
        <h2>Bulk Email Test</h2>
        <p>This is part of a bulk email test sent on ${new Date().toLocaleString()}</p>
        <p>Testing batch processing capabilities.</p>
      `;

      const results = await emailService.sendBulkEmails(recipients, subject, htmlBody, 1);
      
      console.log('Bulk email results:', results);
      
      expect(results).toHaveLength(2);
      expect(results.every(result => result.success)).toBe(true);
      expect(results.every(result => result.email === testEmail)).toBe(true);
    }, 60000);

    it('should handle email with special characters', async () => {
      const subject = 'EmailService Test - Special Characters: "Quotes", <Brackets>, & Symbols 🚀';
      const htmlBody = `
        <h2>Testing Special Characters</h2>
        <p>This email contains various special characters:</p>
        <ul>
          <li>Quotes: "Double" and 'Single'</li>
          <li>HTML entities: &amp; &lt; &gt;</li>
          <li>Unicode: 🚀 📧 ✅ 🎉</li>
          <li>Accented characters: café, résumé, naïve</li>
        </ul>
        <p>Special symbols: © ® ™ € £ ¥ § ¶</p>
      `;

      const result = await emailService.sendEmail(testEmail, subject, htmlBody);
      
      expect(result.success).toBe(true);
    }, 30000);
  });

  // Performance tests (optional)
  (runIntegrationTests ? describe : describe.skip)('Performance Tests', () => {
    
    it('should handle reasonable email sending time', async () => {
      const startTime = Date.now();
      
      const result = await emailService.sendEmail(
        testEmail, 
        'Performance Test', 
        '<p>Testing email sending performance</p>'
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Email sent in ${duration}ms`);
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    }, 15000);
  });
});

// Manual testing script (can be run separately)
// To run: node backend/tests/emailService.test.js
async function runManualTests() {
  console.log('🚀 Starting manual email tests...\n');
  
  try {
    // Check service status
    console.log('📊 Service Status:');
    const status = emailService.getStatus();
    console.log(JSON.stringify(status, null, 2));
    if (!status.configured) {
      throw new Error('Email service not configured. Check .env file.');
    }
    console.log('');

    // Verify connection
    console.log('🔗 Verifying SMTP connection...');
    const connectionResult = await emailService.verifyConnection();
    console.log(connectionResult);
    console.log('');

    if (connectionResult.status !== 'connected') {
      throw new Error('SMTP connection failed');
    }

    const testEmail = process.env.TEST_EMAIL;
    if (!testEmail) {
      throw new Error('TEST_EMAIL environment variable not set');
    }

    // Test 1: Simple email
    console.log(`📧 Test 1: Sending simple email to ${testEmail}...`);
    const simpleResult = await emailService.sendEmail(
      testEmail,
      'Manual Test - Simple Email',
      '<h2>Hello!</h2><p>This is a simple test email.</p>'
    );
    console.log('Result:', simpleResult);
    console.log('');

    console.log('✅ Manual tests completed successfully!');
    console.log('Check your email inbox for the test messages.');

  } catch (error) {
    console.error('❌ Manual test failed:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runManualTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}