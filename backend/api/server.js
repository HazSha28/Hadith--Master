// Hadith Master API Server
// Open Source REST API for Hadith Data

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import hadithRoutes from './hadithApi.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});

// Middleware
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin or origins from ALLOWED_ORIGINS
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:8081', 'http://localhost:5173'];
    if (!origin || origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      hadith: '/api/hadith',
      books: '/api/hadith/books',
      categories: '/api/hadith/categories',
      random: '/api/hadith/random',
      search: '/api/hadith/search',
      aiSearch: '/api/hadith/search/ai'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Hadith Master API',
    version: '1.0.0',
    description: 'Open Source REST API for accessing authentic Hadith collections',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      hadith: {
        getAll: 'GET /api/hadith',
        getById: 'GET /api/hadith/:id',
        getRandom: 'GET /api/hadith/random',
        search: 'GET /api/hadith/search',
        aiSearch: 'POST /api/hadith/search/ai',
        getBooks: 'GET /api/hadith/books',
        getCategories: 'GET /api/hadith/categories'
      }
    },
    parameters: {
      pagination: {
        page: 'Page number (default: 1)',
        limit: 'Items per page (default: 20, max: 100)'
      },
      filters: {
        book: 'Filter by book name',
        category: 'Filter by category',
        difficulty: 'Filter by difficulty level',
        tags: 'Filter by tags (comma-separated)',
        search: 'Search in text, narrator, or tags'
      }
    },
    examples: {
      getAllHadiths: '/api/hadith?page=1&limit=10&book=Sahih%20Bukhari',
      searchHadiths: '/api/hadith/search?q=prayer&category=general',
      randomHadith: '/api/hadith/random?count=3',
      specificHadith: '/api/hadith/abc123'
    }
  });
});

// Mount hadith routes
app.use('/api/hadith', hadithRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.originalUrl} not found`,
    availableEndpoints: '/api/docs'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🕌 Hadith Master API Server Started Successfully!

📍 Server: http://localhost:${PORT}
📚 API Documentation: http://localhost:${PORT}/api/docs
💚 Health Check: http://localhost:${PORT}/health
📖 Hadith Endpoints: http://localhost:${PORT}/api/hadith

🔐 Security Features:
   - Rate limiting enabled
   - CORS configured
   - Helmet security headers
   - Request logging

📊 Ready to serve authentic Hadith data!
  `);
});

export default app;
