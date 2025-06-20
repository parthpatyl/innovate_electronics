exports.handleMessage = (req, res) => {
  const { message } = req.body;
  let reply = '';
  if (!message) {
    reply = 'Please enter a message.';
  } else {
    const msg = message.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      reply = 'Hello! How can I help you today?';
    } else if (msg.includes('product')) {
      reply = 'We offer a wide range of electronic products. Can you specify what you are looking for?';
    } else if (msg.includes('contact')) {
      reply = 'You can contact us via the contact form or call our toll-free number: 008000404574.';
    } else if (msg.includes('price') || msg.includes('cost')) {
      reply = 'For pricing information, please specify the product or request a quote via our contact form.';
    } else if (msg.includes('blog')) {
      reply = 'You can read our latest blogs on the Blogs page.';
    } else if (msg.includes('newsletter')) {
      reply = 'Subscribe to our newsletter for updates!';
    } else {
      reply = "I'm sorry, I didn't understand that. Can you please rephrase your question?";
    }
  }
  res.json({ reply });
}; 