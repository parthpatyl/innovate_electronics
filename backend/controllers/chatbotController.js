exports.handleMessage = (req, res) => {
  const { message } = req.body;
  let reply = '';
  if (!message) {
    reply = 'Please enter a message.';
  } else {
    const msg = message.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      reply = 'Hello! 👋 How can I assist you today? You can ask about products, support, events, or more.';
    } else if (msg.includes('product')) {
      reply = 'We offer a wide range of electronic products including sensors, microcontrollers, and development kits. You can view our full catalog on the <a href="products.html">Products page</a>. Are you looking for something specific?';
    } else if (msg.includes('contact')) {
      reply = 'You can reach our sales team via Live Chat, call our toll-free number <a href="tel:008000404574">008000404574</a>, or use our <a href="contactus.html">Contact</a> to send a request.';
    } else if (msg.includes('price') || msg.includes('cost') || msg.includes('quote')) {
      reply = 'For pricing, please specify the product, or request a quote our team responds quickly to quote requests.';
    } else if (msg.includes('blog')) {
      reply = 'Check out our latest articles and insights on the <a href="blogs.html">Blogs page</a>!';
    } else if (msg.includes('newsletter')) {
      reply = 'Subscribe to our newsletter for updates about new products, events, and special offers. Would you like to receive a subscription link?';
    } else if (msg.includes('event') || msg.includes('register')) {
      reply = 'Interested in our upcoming events? Register easily using our <a href="events.html">event registration form</a>. Let me know if you want details on current events!';
    } else if (msg.includes('support') || msg.includes('help')) {
      reply = 'For technical support or help, you can chat with us here or use the <a href="contactus.html">contact form</a>. We\'re happy to assist!';
    } else {
      reply = "I'm sorry, I didn't quite get that. Could you please rephrase, or let me know if you need information on products, orders, support, or something else?";
    }
  }
  res.json({ reply });
}; 