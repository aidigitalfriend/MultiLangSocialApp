require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const { TranslatorTextClient } = require('@azure/cognitiveservices-translatortext');
const { CognitiveServicesCredentials } = require('@azure/ms-rest-azure-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sequelize = require('./config/database');

// Models
const User = require('./models/User');
const Message = require('./models/Message');
const Contact = require('./models/Contact');
const Group = require('./models/Group');
const GroupMember = require('./models/GroupMember');
const CallHistory = require('./models/CallHistory');
const Notification = require('./models/Notification');

// ── Associations ──
Contact.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });
Contact.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
Group.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Group.hasMany(GroupMember, { foreignKey: 'groupId', onDelete: 'CASCADE' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });
GroupMember.belongsTo(User, { foreignKey: 'userId' });
CallHistory.belongsTo(User, { as: 'caller', foreignKey: 'callerId' });
CallHistory.belongsTo(User, { as: 'callReceiver', foreignKey: 'receiverId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(Message, { as: 'replyTo', foreignKey: 'replyToId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// ── Upload directories ──
const voiceDir = path.join(__dirname, 'uploads', 'voices');
const mediaDir = path.join(__dirname, 'uploads', 'media');
if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

const voiceUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, voiceDir),
    filename: (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}.webm`),
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only audio files are allowed'));
  },
});

const ALLOWED_MIME = /^(image|video|audio)\//;
const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, mediaDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${req.user.id}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// ── App & Server ──
const app = express();
const server = http.createServer(app);
const ORIGINS = ['https://v4u.ai', 'https://www.v4u.ai', 'https://auth.v4u.ai', 'https://app.v4u.ai', 'https://global.v4u.ai'];
const io = socketIo(server, { cors: { origin: ORIGINS, methods: ['GET', 'POST'], credentials: true } });

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sync DB (alter: true adds new columns without dropping)
sequelize.sync({ alter: true }).then(() => console.log('DB synced'));

// ── Azure Translator ──
let translatorClient = null;
if (process.env.AZURE_TRANSLATOR_KEY && process.env.AZURE_TRANSLATOR_ENDPOINT) {
  try {
    translatorClient = new TranslatorTextClient(new CognitiveServicesCredentials(process.env.AZURE_TRANSLATOR_KEY), process.env.AZURE_TRANSLATOR_ENDPOINT);
    console.log('Azure Translator initialized');
  } catch (e) { console.warn('Azure Translator init failed:', e.message); }
} else {
  console.warn('Azure Translator not configured - translation disabled');
}

// ── Track online users (userId → Set<socketId>) ──
const onlineUsers = new Map();

// ── Auth middleware ──
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.user = jwt.verify(token, process.env.SECRET_KEY);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// ═══════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════

app.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: 'Email, username, and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address', field: 'email' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore only)', field: 'username' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters', field: 'password' });
    if (await User.findOne({ where: { email } })) return res.status(409).json({ error: 'An account with this email already exists', field: 'email' });
    if (await User.findOne({ where: { username } })) return res.status(409).json({ error: 'This username is already taken', field: 'username' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password: hashedPassword });
    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
    res.json({ userId: user.id, token });
  } catch (err) { console.error('Signup error:', err); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address', field: 'email' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'No account found with this email', field: 'email' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Incorrect password', field: 'password' });
    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
    res.json({ userId: user.id, token });
  } catch (err) { console.error('Signin error:', err); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

const resetCodes = new Map();

app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'No account found with that email' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(email, { code, expires: Date.now() + 15 * 60 * 1000 });
    console.log(`Reset code for ${email}: ${code}`);
    res.json({ success: true });
  } catch (err) { console.error('Forgot password error:', err); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const entry = resetCodes.get(email);
    if (!entry || entry.code !== code || Date.now() > entry.expires) return res.status(400).json({ error: 'Invalid or expired reset code' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    resetCodes.delete(email);
    res.json({ success: true });
  } catch (err) { console.error('Reset password error:', err); res.status(500).json({ error: 'Something went wrong. Please try again.' }); }
});

// ═══════════════════════════════════════════
// USER / PROFILE ROUTES
// ═══════════════════════════════════════════

app.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'language', 'isOnline', 'lastSeen', 'about'] });
    res.json(users);
  } catch (err) { console.error('Get users error:', err); res.status(500).json({ error: 'Failed to load users' }); }
});

// Search users by username or email
app.get('/users/search', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
        [Op.or]: [
          { username: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'username', 'email', 'about', 'isOnline', 'lastSeen', 'language'],
      limit: 20,
    });
    res.json(users);
  } catch (err) { console.error('Search users error:', err); res.status(500).json({ error: 'Search failed' }); }
});

app.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'language', 'voiceSample', 'about', 'isOnline', 'lastSeen'] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { console.error('Get profile error:', err); res.status(500).json({ error: 'Failed to load profile' }); }
});

app.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { username, email, language, about } = req.body;
    if (username !== undefined) {
      const trimmed = username.trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore)' });
      const existing = await User.findOne({ where: { username: trimmed } });
      if (existing && existing.id !== req.user.id) return res.status(409).json({ error: 'Username already taken' });
      user.username = trimmed;
    }
    if (email !== undefined) {
      const trimmed = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return res.status(400).json({ error: 'Invalid email address' });
      const existing = await User.findOne({ where: { email: trimmed } });
      if (existing && existing.id !== req.user.id) return res.status(409).json({ error: 'Email already in use' });
      user.email = trimmed;
    }
    if (language !== undefined) user.language = language;
    if (about !== undefined) user.about = String(about).slice(0, 140);
    await user.save();
    res.json({ success: true });
  } catch (err) { console.error('Update profile error:', err); res.status(500).json({ error: 'Failed to update profile' }); }
});

// Upload voice sample
app.post('/voice-sample', authenticate, (req, res) => {
  voiceUpload.single('voice')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.voiceSample) {
        const oldPath = path.join(__dirname, user.voiceSample);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.voiceSample = path.join('uploads', 'voices', req.file.filename);
      await user.save();
      res.json({ success: true });
    } catch (e) { console.error('Voice upload error:', e); res.status(500).json({ error: 'Failed to save voice sample' }); }
  });
});

// ═══════════════════════════════════════════
// CONTACT / FRIEND REQUEST ROUTES
// ═══════════════════════════════════════════

// Send friend request
app.post('/contacts/request', authenticate, async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
    if (receiverId === req.user.id) return res.status(400).json({ error: 'Cannot send request to yourself' });
    const existing = await Contact.findOne({
      where: {
        [Op.or]: [
          { requesterId: req.user.id, receiverId },
          { requesterId: receiverId, receiverId: req.user.id },
        ],
      },
    });
    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ error: 'Already friends' });
      if (existing.status === 'blocked') return res.status(400).json({ error: 'Cannot send request' });
      return res.status(400).json({ error: 'Request already pending' });
    }
    const contact = await Contact.create({ requesterId: req.user.id, receiverId, status: 'pending' });
    // Create notification for receiver
    const sender = await User.findByPk(req.user.id, { attributes: ['username'] });
    await Notification.create({ userId: receiverId, type: 'friend_request', title: 'New Friend Request', body: `${sender.username} sent you a friend request`, relatedId: req.user.id });
    // Push notification via socket
    io.to(String(receiverId)).emit('notification', { type: 'friend_request', fromUserId: req.user.id, fromUsername: sender.username });
    res.json(contact);
  } catch (err) { console.error('Send request error:', err); res.status(500).json({ error: 'Failed to send request' }); }
});

// Get accepted contacts (friends list)
app.get('/contacts', authenticate, async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [{ requesterId: req.user.id }, { receiverId: req.user.id }],
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username', 'email', 'about', 'isOnline', 'lastSeen', 'language'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'email', 'about', 'isOnline', 'lastSeen', 'language'] },
      ],
    });
    // Return the other user for each contact
    const friends = contacts.map(c => {
      const friend = c.requesterId === req.user.id ? c.receiver : c.requester;
      return { contactId: c.id, ...friend.toJSON() };
    });
    res.json(friends);
  } catch (err) { console.error('Get contacts error:', err); res.status(500).json({ error: 'Failed to load contacts' }); }
});

// Get pending requests (sent & received)
app.get('/contacts/pending', authenticate, async (req, res) => {
  try {
    const received = await Contact.findAll({
      where: { receiverId: req.user.id, status: 'pending' },
      include: [{ model: User, as: 'requester', attributes: ['id', 'username', 'email', 'about', 'isOnline'] }],
    });
    const sent = await Contact.findAll({
      where: { requesterId: req.user.id, status: 'pending' },
      include: [{ model: User, as: 'receiver', attributes: ['id', 'username', 'email', 'about', 'isOnline'] }],
    });
    res.json({ received, sent });
  } catch (err) { console.error('Get pending error:', err); res.status(500).json({ error: 'Failed to load pending requests' }); }
});

// Accept friend request
app.put('/contacts/:id/accept', authenticate, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Request not found' });
    if (contact.receiverId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (contact.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });
    contact.status = 'accepted';
    await contact.save();
    const user = await User.findByPk(req.user.id, { attributes: ['username'] });
    await Notification.create({ userId: contact.requesterId, type: 'friend_accepted', title: 'Friend Request Accepted', body: `${user.username} accepted your friend request`, relatedId: req.user.id });
    io.to(String(contact.requesterId)).emit('notification', { type: 'friend_accepted', fromUserId: req.user.id, fromUsername: user.username });
    res.json({ success: true });
  } catch (err) { console.error('Accept error:', err); res.status(500).json({ error: 'Failed to accept request' }); }
});

// Decline friend request
app.put('/contacts/:id/decline', authenticate, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Request not found' });
    if (contact.receiverId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await contact.destroy();
    res.json({ success: true });
  } catch (err) { console.error('Decline error:', err); res.status(500).json({ error: 'Failed to decline request' }); }
});

// Block contact
app.put('/contacts/:id/block', authenticate, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (contact.requesterId !== req.user.id && contact.receiverId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    contact.status = 'blocked';
    await contact.save();
    res.json({ success: true });
  } catch (err) { console.error('Block error:', err); res.status(500).json({ error: 'Failed to block contact' }); }
});

// Delete / cancel contact
app.delete('/contacts/:id', authenticate, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (contact.requesterId !== req.user.id && contact.receiverId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await contact.destroy();
    res.json({ success: true });
  } catch (err) { console.error('Delete contact error:', err); res.status(500).json({ error: 'Failed to delete contact' }); }
});

// ═══════════════════════════════════════════
// MESSAGE ROUTES
// ═══════════════════════════════════════════

// Get all messages for current user (DMs + groups)
app.get('/messages', authenticate, async (req, res) => {
  try {
    // Get user's group IDs
    const memberships = await GroupMember.findAll({ where: { userId: req.user.id }, attributes: ['groupId'] });
    const groupIds = memberships.map(m => m.groupId);
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id },
          ...(groupIds.length ? [{ groupId: { [Op.in]: groupIds } }] : []),
        ],
      },
      order: [['createdAt', 'ASC']],
    });
    res.json(messages);
  } catch (err) { console.error('Get messages error:', err); res.status(500).json({ error: 'Failed to load messages' }); }
});

// Delete message
app.delete('/messages/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const { forEveryone } = req.body;
    if (forEveryone) {
      message.deletedForEveryone = true;
      message.content = '';
      message.translatedContent = '';
      message.mediaUrl = null;
      await message.save();
      // Notify receiver/group
      const targetId = message.groupId ? `group_${message.groupId}` : String(message.receiverId);
      io.to(targetId).emit('messageDeleted', { messageId: message.id, forEveryone: true });
      io.to(String(message.senderId)).emit('messageDeleted', { messageId: message.id, forEveryone: true });
    } else {
      await message.destroy();
    }
    res.json({ success: true });
  } catch (err) { console.error('Delete message error:', err); res.status(500).json({ error: 'Failed to delete message' }); }
});

// Update message status (delivered/read)
app.put('/messages/:id/status', authenticate, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.receiverId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const { status } = req.body;
    if (!['delivered', 'read'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    message.status = status;
    await message.save();
    io.to(String(message.senderId)).emit('messageStatus', { messageId: message.id, status });
    res.json({ success: true });
  } catch (err) { console.error('Update status error:', err); res.status(500).json({ error: 'Failed to update status' }); }
});

// Mark all messages from a user as read
app.put('/messages/read/:senderId', authenticate, async (req, res) => {
  try {
    const senderId = parseInt(req.params.senderId, 10);
    await Message.update({ status: 'read' }, {
      where: { senderId, receiverId: req.user.id, status: { [Op.ne]: 'read' } },
    });
    io.to(String(senderId)).emit('messagesRead', { readBy: req.user.id });
    res.json({ success: true });
  } catch (err) { console.error('Mark read error:', err); res.status(500).json({ error: 'Failed to mark as read' }); }
});

// ═══════════════════════════════════════════
// MEDIA UPLOAD
// ═══════════════════════════════════════════

app.post('/media', authenticate, (req, res) => {
  mediaUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const url = `https://api.v4u.ai/uploads/media/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype });
  });
});

// ═══════════════════════════════════════════
// GROUP ROUTES
// ═══════════════════════════════════════════

// Create group
app.post('/groups', authenticate, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });
    const group = await Group.create({ name: name.trim(), description: description || '', createdBy: req.user.id });
    // Add creator as admin
    await GroupMember.create({ groupId: group.id, userId: req.user.id, role: 'admin' });
    // Add members
    if (Array.isArray(memberIds)) {
      for (const uid of memberIds) {
        if (uid !== req.user.id) {
          await GroupMember.create({ groupId: group.id, userId: uid, role: 'member' });
          // Notify member
          const creator = await User.findByPk(req.user.id, { attributes: ['username'] });
          await Notification.create({ userId: uid, type: 'group_invite', title: 'Added to Group', body: `${creator.username} added you to "${group.name}"`, relatedId: group.id });
          io.to(String(uid)).emit('notification', { type: 'group_invite', groupId: group.id, groupName: group.name });
        }
      }
    }
    res.json(group);
  } catch (err) { console.error('Create group error:', err); res.status(500).json({ error: 'Failed to create group' }); }
});

// Get user's groups
app.get('/groups', authenticate, async (req, res) => {
  try {
    const memberships = await GroupMember.findAll({ where: { userId: req.user.id }, attributes: ['groupId', 'role'] });
    const groupIds = memberships.map(m => m.groupId);
    if (!groupIds.length) return res.json([]);
    const groups = await Group.findAll({
      where: { id: { [Op.in]: groupIds } },
      include: [
        { model: GroupMember, include: [{ model: User, attributes: ['id', 'username', 'isOnline'] }] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
      ],
    });
    res.json(groups);
  } catch (err) { console.error('Get groups error:', err); res.status(500).json({ error: 'Failed to load groups' }); }
});

// Update group
app.put('/groups/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const membership = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id, role: 'admin' } });
    if (!membership) return res.status(403).json({ error: 'Only admins can update the group' });
    const { name, description } = req.body;
    if (name !== undefined) group.name = name.trim();
    if (description !== undefined) group.description = description;
    await group.save();
    res.json(group);
  } catch (err) { console.error('Update group error:', err); res.status(500).json({ error: 'Failed to update group' }); }
});

// Delete group
app.delete('/groups/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.createdBy !== req.user.id) return res.status(403).json({ error: 'Only the creator can delete the group' });
    await GroupMember.destroy({ where: { groupId: group.id } });
    await group.destroy();
    res.json({ success: true });
  } catch (err) { console.error('Delete group error:', err); res.status(500).json({ error: 'Failed to delete group' }); }
});

// Add member to group
app.post('/groups/:id/members', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const admin = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id, role: 'admin' } });
    if (!admin) return res.status(403).json({ error: 'Only admins can add members' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const existing = await GroupMember.findOne({ where: { groupId: group.id, userId } });
    if (existing) return res.status(400).json({ error: 'User is already a member' });
    const member = await GroupMember.create({ groupId: group.id, userId, role: 'member' });
    const adder = await User.findByPk(req.user.id, { attributes: ['username'] });
    await Notification.create({ userId, type: 'group_invite', title: 'Added to Group', body: `${adder.username} added you to "${group.name}"`, relatedId: group.id });
    io.to(String(userId)).emit('notification', { type: 'group_invite', groupId: group.id, groupName: group.name });
    res.json(member);
  } catch (err) { console.error('Add member error:', err); res.status(500).json({ error: 'Failed to add member' }); }
});

// Remove member from group
app.delete('/groups/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const requesterMembership = await GroupMember.findOne({ where: { groupId: group.id, userId: req.user.id } });
    const targetUserId = parseInt(req.params.userId, 10);
    // Allow admins to remove others, or users to leave
    if (targetUserId !== req.user.id) {
      if (!requesterMembership || requesterMembership.role !== 'admin') return res.status(403).json({ error: 'Only admins can remove members' });
    }
    await GroupMember.destroy({ where: { groupId: group.id, userId: targetUserId } });
    res.json({ success: true });
  } catch (err) { console.error('Remove member error:', err); res.status(500).json({ error: 'Failed to remove member' }); }
});

// ═══════════════════════════════════════════
// CALL HISTORY ROUTES
// ═══════════════════════════════════════════

app.get('/calls', authenticate, async (req, res) => {
  try {
    const calls = await CallHistory.findAll({
      where: { [Op.or]: [{ callerId: req.user.id }, { receiverId: req.user.id }] },
      include: [
        { model: User, as: 'caller', attributes: ['id', 'username'] },
        { model: User, as: 'callReceiver', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json(calls);
  } catch (err) { console.error('Get calls error:', err); res.status(500).json({ error: 'Failed to load calls' }); }
});

// ═══════════════════════════════════════════
// NOTIFICATION ROUTES
// ═══════════════════════════════════════════

app.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(notifications);
  } catch (err) { console.error('Get notifications error:', err); res.status(500).json({ error: 'Failed to load notifications' }); }
});

app.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
    res.json({ success: true });
  } catch (err) { console.error('Mark all read error:', err); res.status(500).json({ error: 'Failed to mark all as read' }); }
});

app.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (notif.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    notif.read = true;
    await notif.save();
    res.json({ success: true });
  } catch (err) { console.error('Mark notif read error:', err); res.status(500).json({ error: 'Failed to mark as read' }); }
});

app.delete('/notifications', authenticate, async (req, res) => {
  try {
    await Notification.destroy({ where: { userId: req.user.id } });
    res.json({ success: true });
  } catch (err) { console.error('Clear notifications error:', err); res.status(500).json({ error: 'Failed to clear notifications' }); }
});

// ═══════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════

app.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'usd' });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) { console.error('Payment error:', err); res.status(500).json({ error: 'Payment failed' }); }
});

// ═══════════════════════════════════════════
// SOCKET.IO
// ═══════════════════════════════════════════

io.on('connection', (socket) => {
  let currentUserId = null;

  // ── Join: user comes online ──
  socket.on('join', async (userId) => {
    currentUserId = userId;
    socket.join(String(userId));
    // Track online
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    // Update DB
    try { await User.update({ isOnline: true, lastSeen: new Date() }, { where: { id: userId } }); } catch (e) {}
    // Join group rooms
    try {
      const memberships = await GroupMember.findAll({ where: { userId }, attributes: ['groupId'] });
      memberships.forEach(m => socket.join(`group_${m.groupId}`));
    } catch (e) {}
    // Broadcast online status to all
    io.emit('userOnline', { userId });
    console.log(`User ${userId} connected (${onlineUsers.get(userId).size} sockets)`);
  });

  // ── Send DM ──
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, content, type, mediaUrl, replyToId } = data;
      let translatedContent = content;
      if (type === 'text' && translatorClient && receiverId) {
        const receiver = await User.findByPk(receiverId);
        if (receiver && receiver.language) {
          try {
            const result = await translatorClient.translate([content], receiver.language);
            translatedContent = result[0].translations[0].text;
          } catch (e) { console.error('Translation error:', e); }
        }
      }
      const message = await Message.create({
        senderId, receiverId, content, translatedContent, type: type || 'text',
        mediaUrl: mediaUrl || null, replyToId: replyToId || null, status: 'sent',
      });
      io.to(String(receiverId)).emit('receiveMessage', message);
      socket.emit('receiveMessage', message);
    } catch (err) { console.error('sendMessage error:', err); }
  });

  // ── Send Group Message ──
  socket.on('sendGroupMessage', async (data) => {
    try {
      const { senderId, groupId, content, type, mediaUrl, replyToId } = data;
      const message = await Message.create({
        senderId, groupId, content, type: type || 'text',
        mediaUrl: mediaUrl || null, replyToId: replyToId || null, status: 'sent',
      });
      // Include sender info for display
      const sender = await User.findByPk(senderId, { attributes: ['id', 'username'] });
      const payload = { ...message.toJSON(), sender: sender ? sender.toJSON() : null };
      io.to(`group_${groupId}`).emit('receiveGroupMessage', payload);
    } catch (err) { console.error('sendGroupMessage error:', err); }
  });

  // ── Typing indicators ──
  socket.on('typing', (data) => {
    const { userId, receiverId, groupId, username } = data;
    if (groupId) {
      socket.to(`group_${groupId}`).emit('typing', { userId, groupId, username });
    } else if (receiverId) {
      io.to(String(receiverId)).emit('typing', { userId, username });
    }
  });
  socket.on('stopTyping', (data) => {
    const { userId, receiverId, groupId } = data;
    if (groupId) {
      socket.to(`group_${groupId}`).emit('stopTyping', { userId, groupId });
    } else if (receiverId) {
      io.to(String(receiverId)).emit('stopTyping', { userId });
    }
  });

  // ── Call signaling ──
  socket.on('callUser', async (data) => {
    const { callerId, receiverId, callType, callerName } = data;
    try {
      const call = await CallHistory.create({ callerId, receiverId, callType: callType || 'voice', status: 'missed' });
      io.to(String(receiverId)).emit('incomingCall', { callId: call.id, callerId, callerName, callType });
    } catch (e) { console.error('callUser error:', e); }
  });
  socket.on('answerCall', async (data) => {
    const { callId, callerId } = data;
    try {
      await CallHistory.update({ status: 'answered' }, { where: { id: callId } });
      io.to(String(callerId)).emit('callAnswered', { callId });
    } catch (e) { console.error('answerCall error:', e); }
  });
  socket.on('rejectCall', async (data) => {
    const { callId, callerId } = data;
    try {
      await CallHistory.update({ status: 'rejected' }, { where: { id: callId } });
      io.to(String(callerId)).emit('callRejected', { callId });
    } catch (e) { console.error('rejectCall error:', e); }
  });
  socket.on('endCall', async (data) => {
    const { callId, otherUserId, duration } = data;
    try {
      if (callId && duration) await CallHistory.update({ duration }, { where: { id: callId } });
      if (otherUserId) io.to(String(otherUserId)).emit('callEnded', { callId });
    } catch (e) { console.error('endCall error:', e); }
  });

  // ── Disconnect ──
  socket.on('disconnect', async () => {
    if (currentUserId) {
      const sockets = onlineUsers.get(currentUserId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(currentUserId);
          try { await User.update({ isOnline: false, lastSeen: new Date() }, { where: { id: currentUserId } }); } catch (e) {}
          io.emit('userOffline', { userId: currentUserId, lastSeen: new Date() });
        }
      }
      console.log(`User ${currentUserId} disconnected`);
    }
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
