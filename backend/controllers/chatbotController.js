exports.handleMessage = (req, res) => {
  const { message } = req.body;
  let reply = '';
  let options = [];

  if (!message) {
    reply = 'Please enter a message.';
  } else {
    const msg = message.toLowerCase();
    if (msg.includes('options') || msg.includes('help')) {
      reply = 'Please choose one of the following options:';
      options = ['Products', 'Events', 'Support', 'Newsletter'];
    } else if (msg.includes('products')) {
      reply = 'We offer a wide range of electronic products...';
    } else if (msg.includes('events')) {
      reply = 'You can register for events using our event form...';
    } else if (msg.includes('support')) {
      reply = 'Please describe the issue you’re facing. We’re here to help.';
    } else if (msg.includes('newsletter')) {
      reply = 'Would you like to subscribe to our newsletter?';
    } else {
      reply = "I'm sorry, I didn't quite get that. Try typing 'help' to see options.";
    }
  }

  res.json({ reply, options });
};
