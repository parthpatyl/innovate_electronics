const Category = require('../models/Category');
const Event = require('../models/Event');
const templates = require('./chatbotTemplates');

const getProductCategories = async () => {
  const categories = await Category.distinct('title');
  if (categories.length > 0) {
    return { reply: templates.productCategories(categories), options: [] };
  }
  return { reply: templates.productsGeneral(), options: [] };
};

const getUpcomingEvents = async () => {
  const upcomingEvents = await Event.find({ status: 'upcoming' }).sort({ date: 1 }).limit(3);
  if (upcomingEvents.length > 0) {
    return { reply: templates.upcomingEvents(upcomingEvents), options: [] };
  }
  return { reply: templates.noUpcomingEvents(), options: [] };
};

const intents = [
  {
    keywords: ['hi', 'hello', 'hey'],
    handler: () => ({
      reply: templates.greeting(),
      options: ['Products', 'Events', 'Support'],
    })
  },
  {
    keywords: ['options', 'help', 'menu'],
    handler: () => ({
      reply: templates.helpMenu(),
      options: ['Products', 'Events', 'Support', 'Newsletter', 'Contact Options'],
    })
  },
  {
    keywords: ['products', 'product', 'buy', 'shop'],
    handler: getProductCategories,
  },
  {
    keywords: ['events', 'event', 'workshop', 'webinar'],
    handler: getUpcomingEvents,
  },
  {
    keywords: ['support', 'contact', 'help me', 'talk to'],
    handler: () => ({
      reply: templates.support(),
      options: [],
    })
  },
  {
    keywords: ['newsletter', 'subscribe', 'updates', 'email'],
    handler: () => ({
      reply: templates.newsletter(),
      options: [],
    })
  },
  {
    keywords: ['thank', 'thanks'],
    handler: () => ({
      reply: templates.thankYou(),
      options: ['Products', 'Events', 'Support'],
    })
  },
  {
    keywords: ['bye', 'goodbye', 'see you'],
    handler: () => ({
      reply: templates.goodbye(),
      options: [],
    })
  },
];

exports.handleMessage = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: 'Please enter a message.', options: [] });
  }

  // Basic sanitization
  const sanitizedMessage = message.trim().toLowerCase();
  if (!sanitizedMessage) {
    return res.json({ reply: 'Please enter a message.', options: [] });
  }

  try {
    const matchedIntent = intents.find(intent =>
      intent.keywords.some(keyword => sanitizedMessage.includes(keyword))
    );

    let response;
    if (matchedIntent) {
      response = await matchedIntent.handler();
    } else {
      // Default fallback response
      response = {
        reply: templates.fallback(),
        options: ['Products', 'Events', 'Support', 'Newsletter'],
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Chatbot controller error:', error);
    res.json({ reply: templates.error(), options: [] });
  }
};