// Simple Chatbot Widget Script
// Assumes Chatbot.jpg is in the root or assets folder

(function() {
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
        <form class="chatbot-input-area">
            <input type="text" id="chatbot-input" placeholder="Enter your message..." autocomplete="on" />
            <button type="submit">&#9658;</button>
        </form>
    `;
    document.body.appendChild(chatbotWindow);

    // Show/hide logic
    chatbotBtn.onclick = () => {
        chatbotWindow.classList.add('open');
        showContactOptions();
    };
    chatbotWindow.querySelector('#chatbot-close').onclick = () => chatbotWindow.classList.remove('open');

    // Basic chat logic (local only)
    const messages = chatbotWindow.querySelector('.chatbot-messages');
    const form = chatbotWindow.querySelector('.chatbot-input-area');
    const input = chatbotWindow.querySelector('#chatbot-input');
    form.onsubmit = async function(e) {
        e.preventDefault();
        const msg = input.value.trim();
        if (!msg) return;
        messages.innerHTML += `<div class='user-msg'>${msg}</div>`;
        // Send message to backend chatbot API
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
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
    };

    // Function to show contact options in the chatbot
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
        messages.innerHTML += `<div class='bot-msg'>${contactHTML}</div>`;
        messages.scrollTop = messages.scrollHeight;
    }

    // Actual handlers for buttons
    window.startLiveChat = function() {
        // Focus the chatbot input and show a message
        chatbotWindow.classList.add('open');
        input.focus();
        messages.innerHTML += `<div class='bot-msg'>You are now connected to our live chat. Please type your message below.</div>`;
        messages.scrollTop = messages.scrollHeight;
    };
    window.openContactForm = function() {
        // Open the contact us page in a new tab
        window.open('contactus.html', '_blank');
    };
})();
