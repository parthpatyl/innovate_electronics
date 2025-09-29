const contactOptionsHTML = `
  <div class="contact-options">
    <div class="contact-card">
      <div class="contact-title">
        Live chat
        <span class="contact-status online">ONLINE</span>
      </div>
      <div class="contact-desc">Our sales team is available to chat.</div>
      <button class="contact-btn" onclick="startLiveChat()">Start Chat</button>
    </div>
    <div class="contact-card">
      <div class="contact-title">Call Us</div>
      <div class="contact-desc">Reach our team via phone.</div>
      <a href="tel:+918123155600" class="contact-link">+91 81231 55600</a>
    </div>
    <div class="contact-card">
      <div class="contact-title">Contact Form</div>
      <div class="contact-desc">Send us your request through our contact page.</div>
      <button class="contact-btn" onclick="openContactForm()">Contact Sales</button>
    </div>
  </div>`;

exports.greeting = () => `
  <div class="greeting-response">
    <div class="greeting-text">
      <strong>Hello! Welcome to Innovate Electronics!</strong>
      <p>I'm your virtual assistant, here to help you discover our latest products, upcoming events, and support options.</p>
      <p class="greeting-question">What would you like to explore today?</p>
    </div>
  </div>`;

exports.helpMenu = () => `
  <div class="help-response">
    <div class="help-content">
      <strong>I'm here to assist you with:</strong>
      <div class="help-features">
        <div class="help-item"><span><strong>Products</strong> - Browse our electronic categories</span></div>
        <div class="help-item"><span><strong>Events</strong> - View upcoming tech events</span></div>
        <div class="help-item"><span><strong>Support</strong> - Get help from our team</span></div>
        <div class="help-item"><span><strong>Newsletter</strong> - Stay updated with us</span></div>
        <div class="help-item"><span><strong>Contact</strong> - Multiple ways to reach us</span></div>
      </div>
      <p class="help-prompt">Simply click any option below or type your question!</p>
    </div>
  </div>`;

exports.productCategories = (categories) => `
  <div class="products-response">
    <div class="products-content">
      <strong>Our Product Categories:</strong>
      <p class="products-intro">We offer premium electronics across multiple categories. Here's what we have:</p>
      <ul class="bot-list styled-list">
        ${categories.map(c => `<li class="bot-list-item">${c}</li>`).join('')}
      </ul>
      <div class="cta-box">
        <p><a href="/products.html" target="_blank" class="inline-link">Explore our full product catalog</a> for detailed specifications and pricing!</p>
      </div>
    </div>
  </div>`;

exports.productsGeneral = () => `
  <div class="products-response">
    <div class="products-content">
      <strong>Discover Our Electronics!</strong>
      <p>We have an extensive range of cutting-edge electronic products waiting for you.</p>
      <div class="cta-box">
        <p>👉 <a href="/products.html" target="_blank" class="inline-link">Visit our Products Page</a> to explore everything we offer!</p>
      </div>
    </div>
  </div>`;

exports.upcomingEvents = (events) => `
  <div class="events-response">
    <div class="events-content">
      <strong>Upcoming Events You Don't Want to Miss!</strong>
      <p class="events-intro">Join us at our next tech gatherings:</p>
      <ul class="bot-list events-list">
        ${events.map(e => `
          <li class="bot-list-item event-item">
            <div class="event-details">
              <span class="event-name">${e.title}</span>
              <span class="event-date">${new Date(e.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </li>
        `).join('')}
      </ul>
      <div class="cta-box">
        <p><a href="/events.html" target="_blank" class="inline-link">View all events and register</a> for your favorites!</p>
      </div>
    </div>
  </div>`;

exports.noUpcomingEvents = () => `
  <div class="events-response">    
    <div class="events-content">
      <strong>No Upcoming Events Right Now</strong>
      <p>We're currently planning our next exciting tech events and workshops!</p>
      <div class="cta-box info-box">
        <p>🔔 <a href="/events.html" target="_blank" class="inline-link">Check our Events Page</a> regularly for announcements, or subscribe to our newsletter to get notified first!</p>
      </div>
    </div>
  </div>`;

exports.support = () => `
  <div class="support-response">
    <div class="support-content">
      <strong>We're Here to Help!</strong>
      <p class="support-intro">Choose the best way to connect with our team:</p>
    </div>
  </div>${contactOptionsHTML}`;

exports.newsletter = () => `
  <div class="newsletter-response">
    <div class="newsletter-content">
      <strong>Stay in the Loop!</strong>
      <p>Subscribe to our newsletter and get:</p>
      <ul class="bot-list benefits-list">
        <li class="bot-list-item">Latest product launches</li>
        <li class="bot-list-item">Exclusive deals & offers</li>
        <li class="bot-list-item">Tech tips & innovations</li>
        <li class="bot-list-item">Event notifications</li>
      </ul>
      <div class="cta-box highlight-box">
        <p>Find the subscription form at the bottom of any page on our website!</p>
      </div>
    </div>
  </div>`;

exports.thankYou = () => `
  <div class="thanks-response">
    <div class="thanks-content">
      <strong>You're very welcome!</strong>
      <p>It's my pleasure to assist you. Is there anything else you'd like to know about our products, events, or services?</p>
    </div>
  </div>`;

exports.goodbye = () => `
  <div class="goodbye-response">
    <div class="goodbye-content">
      <strong>Thanks for chatting with us!</strong>
      <p>Have a great day! Feel free to come back anytime you need assistance.</p>
      <p class="goodbye-tag">— Team Innovate Electronics</p>
    </div>
  </div>`;

exports.fallback = () => `
  <div class="fallback-response">
    <div class="fallback-content">
      <strong>Hmm, I didn't quite catch that!</strong>
      <p>I'm here to help with information about our products, events, and support options.</p>
      <p class="fallback-suggestion">Try asking me about:</p>
      <div class="suggestion-tags">
        <span class="suggestion-tag">Products</span>
        <span class="suggestion-tag">Events</span>
        <span class="suggestion-tag">Support</span>
        <span class="suggestion-tag">Newsletter</span>
      </div>
    </div>
  </div>`;

exports.error = () => `
  <div class="error-response">
    <div class="error-content">
      <strong>Oops! Something went wrong.</strong>
      <p>I encountered an error while fetching information. Please try again in a moment.</p>
    </div>
  </div>`;
