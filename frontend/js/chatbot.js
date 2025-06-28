(function () {
  // Create chatbot button
  const chatbotBtn = document.createElement('div');
  chatbotBtn.id = 'chatbot-btn';
  chatbotBtn.innerHTML = `<img src="assets/chatbot_icon.png" alt="Chatbot" style="width:48px;height:48px;">`;
  document.body.appendChild(chatbotBtn);

  // Create chatbot window
  const chatbotWindow = document.createElement('div');
  chatbotWindow.id = 'chatbot-window';
  chatbotWindow.innerHTML = `
      <div class="chatbot-header">
          <span>Support</span>
          <button id="chatbot-close">&times;</button>
      </div>
      <div class="chatbot-messages"></div>
      <div class="chatbot-quick-buttons">
          <button class="quick-btn" data-msg="Hi">Hello</button>
          <button class="quick-btn" data-msg="Products">Products</button>
          <button class="quick-btn" data-msg="Events">Events</button>
          <button class="quick-btn" data-msg="Support">Support</button>
          <button class="quick-btn" data-msg="Newsletter">Newsletter</button>
          <button class="quick-btn" data-msg="contact-options">Contact Options</button>
      </div>
      <form class="chatbot-input-area">
          <input type="text" id="chatbot-input" placeholder="Enter your message..." autocomplete="on" />
          <button type="submit">&#9658;</button>
      </form>
  `;
  document.body.appendChild(chatbotWindow);

  // Show/hide logic
  chatbotBtn.onclick = () => {
      chatbotWindow.classList.add('open');
  };
  chatbotWindow.querySelector('#chatbot-close').onclick = () => chatbotWindow.classList.remove('open');

  // DOM elements
  const messages = chatbotWindow.querySelector('.chatbot-messages');
  const form = chatbotWindow.querySelector('.chatbot-input-area');
  const input = chatbotWindow.querySelector('#chatbot-input');

  // Form submit logic
  form.onsubmit = async function (e) {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;

      addUserMessage(msg);
      await sendMessageToBot(msg);
      input.value = '';
  };

  // Add user message
  function addUserMessage(text) {
      messages.innerHTML += `<div class='user-msg'>${text}</div>`;
      messages.scrollTop = messages.scrollHeight;
  }

  // Add bot message
  function addBotMessage(text) {
      messages.innerHTML += `<div class='bot-msg'>${text}</div>`;
      messages.scrollTop = messages.scrollHeight;
  }

  // Add bot options
  function addBotOptions(options) {
      let buttonsHTML = `<div class='bot-options'>`;
      options.forEach(opt => {
          buttonsHTML += `<button class='chat-option-btn' onclick="handleOptionClick('${opt}')">${opt}</button>`;
      });
      buttonsHTML += `</div>`;
      messages.innerHTML += buttonsHTML;
      messages.scrollTop = messages.scrollHeight;
  }

  // Send message to backend
  async function sendMessageToBot(msg) {
      try {
          const res = await fetch('/api/chatbot/message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: msg })
          });
          const data = await res.json();
          addBotMessage(data.reply);
          if (data.options && data.options.length > 0) {
              addBotOptions(data.options);
          }
      } catch (err) {
          addBotMessage('Sorry, there was an error contacting the chatbot.');
      }
  }

  // Global button click handler
  window.handleOptionClick = function (optionText) {
      input.value = optionText;
      form.dispatchEvent(new Event('submit'));
  };

  // Show contact cards (optional, on initial open)
  function showContactOptions() {
      const contactHTML = `
      <div class="contact-options">
        <div class="contact-card">
          <div class="contact-title">
            <span>💬</span> Live chat
            <span class="contact-status online">ONLINE</span>
          </div>
          <div class="contact-desc">Our sales team is available to chat</div>
          <button class="contact-btn" onclick="startLiveChat()">Start chat</button>
        </div>
        <div class="contact-card">
          <div class="contact-title">
            <span>📞</span> Call
            <span class="contact-status online">ONLINE</span>
          </div>
          <div class="contact-desc">Call our Sales team via a Toll-Free Number</div>
          <a href="tel:008000404574" class="contact-link">008000404574</a>
        </div>
        <div class="contact-card">
          <div class="contact-title">
            <span>✉️</span> Contact form
          </div>
          <div class="contact-desc">Send us your request</div>
          <button class="contact-btn" onclick="openContactForm()">Contact Sales</button>
        </div>
      </div>
      `;
      addBotMessage(contactHTML);
  }

  // Chatbot live chat handler
  window.startLiveChat = function () {
      chatbotWindow.classList.add('open');
      input.focus();
      addBotMessage('You are now connected to our live chat. Please type your message below.');
  };

  // Contact form link
  window.openContactForm = function () {
      window.open('contactus.html', '_blank');
  };

  // Quick buttons event listener
  chatbotWindow.addEventListener('click', async function(e) {
      if (e.target.classList.contains('quick-btn')) {
          const msg = e.target.getAttribute('data-msg');
          
          if (msg === 'contact-options') {
              showContactOptions();
              return;
          }
          
          messages.innerHTML += `<div class='user-msg'>${msg}</div>`;
          try {
              const res = await fetch('/api/chatbot/message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: msg })
              });
              const data = await res.json();
              messages.innerHTML += `<div class='bot-msg'>${data.reply}</div>`;
          } catch (err) {
              messages.innerHTML += `<div class='bot-msg'>Sorry, there was an error contacting the chatbot.</div>`;
          }
          messages.scrollTop = messages.scrollHeight;
      }
  });

  // Optional: add styles dynamically (recommended for self-contained deployment)
})();
