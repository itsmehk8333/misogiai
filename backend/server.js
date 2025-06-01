const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medications');
const regimenRoutes = require('./routes/regimens');
const dosesRoutes = require('./routes/doses');
const reportsRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const rewardsRoutes = require('./routes/rewards');
const schedulerService = require('./services/schedulerService');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple origins during development
const allowedOrigins = [
  'https://quiet-daffodil-293b8e.netlify.app/',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
// More lenient limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 auth requests per 15 minutes
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Stricter limiter for other routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per 15 minutes
});

// Apply rate limiters
app.use('/api/auth', authLimiter); // Auth routes limiter
app.use('/api', apiLimiter); // General API limiter

// Debug middleware to log all requests (temporary)
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.get('Content-Type'));
  
  // Capture raw body for debugging
  let rawBody = '';
  req.on('data', chunk => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    if (rawBody) {
      console.log('Raw Body:', rawBody);
      console.log('Raw Body Length:', rawBody.length);
      console.log('Contains #:', rawBody.includes('#'));
      console.log('Contains ":', rawBody.includes('"'));
      
      // Try to identify problematic characters
      const suspiciousChars = rawBody.match(/[^\x20-\x7E\r\n\t]/g);
      if (suspiciousChars) {
        console.log('Suspicious characters found:', suspiciousChars);
      }
    }
    console.log('=== End Request Log ===\n');
  });
  
  next();
});

// Body parsing middleware with better error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (err) {
      console.error('Invalid JSON received:', buf.toString());
      console.error('JSON Parse Error:', err.message);
      throw new Error('Invalid JSON payload');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medtrack')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/regimens', regimenRoutes);
app.use('/api/doses', dosesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    body: req.body,
    headers: req.headers,
    url: req.url,
    method: req.method
  });

  // Handle JSON parsing errors specifically
  if (err.type === 'entity.parse.failed' || err.message.includes('JSON')) {
    return res.status(400).json({ 
      message: 'Invalid JSON format in request body',
      error: 'Please check your request format and try again'
    });
  }

  // Handle other validation errors
  if (err.message === 'Invalid JSON payload') {
    return res.status(400).json({ 
      message: 'Invalid JSON payload',
      error: 'Request body contains invalid JSON characters'
    });
  }

  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start notification scheduler
  if (process.env.NODE_ENV !== 'test') {
    schedulerService.start();
  }
});
