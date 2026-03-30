require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const { TranslatorTextClient } = require('@azure/cognitiveservices-translatortext');
const { CognitiveServicesCredentials } = require('@azure/ms-rest-azure-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sequelize = require('./config/database');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(express.json());

// Sync DB
sequelize.sync().then(() => console.log('DB synced'));

// AI Clients
let translatorClient = null;
if (process.env.AZURE_TRANSLATOR_KEY && process.env.AZURE_TRANSLATOR_ENDPOINT) {
  try {
    translatorClient = new TranslatorTextClient(new CognitiveServicesCredentials(process.env.AZURE_TRANSLATOR_KEY), process.env.AZURE_TRANSLATOR_ENDPOINT);
    console.log('Azure Translator initialized');
  } catch (e) {
    console.warn('Azure Translator init failed:', e.message);
  }
} else {
  console.warn('Azure Translator not configured - translation disabled');
}

// In-memory storage for MVP
let users = [];
let messages = [];

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Signup
app.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, username, password: hashedPassword });
  const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
  res.json({ userId: user.id, token });
});

// Signin
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
  res.json({ userId: user.id, token });
});

// Forgot password - generate reset code
const resetCodes = new Map();
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'No account found with that email' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  resetCodes.set(email, { code, expires: Date.now() + 15 * 60 * 1000 });
  // TODO: Send code via email when email provider is configured
  console.log(`Reset code for ${email}: ${code}`);
  res.json({ success: true });
});

// Reset password with code
app.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const entry = resetCodes.get(email);
  if (!entry || entry.code !== code || Date.now() > entry.expires) {
    return res.status(400).json({ error: 'Invalid or expired reset code' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword });
  resetCodes.delete(email);
  res.json({ success: true });
});

// Get users
app.get('/users', authenticate, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Get messages
app.get('/messages', authenticate, async (req, res) => {
  const messages = await Message.findAll({ where: { senderId: req.user.id } });
  res.json(messages);
});

// Payments
app.post('/create-payment-intent', authenticate, async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});

// Send Message (protected)
io.use((socket, next) => {
  // For simplicity, assume token in handshake
  next();
});

io.on('connection', (socket) => {
  socket.on('sendMessage', async (data) => {
    const { senderId, receiverId, content, type } = data;
    let translatedContent = content;
    const receiver = await User.findByPk(receiverId);
    if (receiver && type === 'text' && translatorClient) {
      try {
        const result = await translatorClient.translate([content], receiver.language);
        translatedContent = result[0].translations[0].text;
      } catch (error) {
        console.error('Translation error:', error);
      }
    }
    const message = await Message.create({ senderId, receiverId, content, translatedContent, type });
    io.to(receiverId).emit('receiveMessage', message);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
