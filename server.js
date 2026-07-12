 const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ============ إعداد CORS ============
const allowedOrigins = [
  'https://mosfa-cod.github.io' // الدومين بتاع GitHub Pages بتاعك (من غير مسار بعده)
];

const corsOptions = {
  origin: function (origin, callback) {
    // السماح بالطلبات اللي مالهاش origin (زي Postman أو curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // التعامل الصريح مع preflight requests

app.use(express.json());

// ============ الاتصال بقاعدة البيانات ============
// نستخدم متغير global عشان نتجنب فتح اتصال جديد مع كل serverless invocation
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// ============ Routes ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));

// Route اختباري للتأكد إن السيرفر شغال
app.get('/', (req, res) => {
  res.json({ status: 'EduVibe API is running' });
});

// ============ معالجة الأخطاء العامة ============
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy blocked this request' });
  }
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// ============ مهم جداً لـ Vercel ============
// متستخدمش app.listen() هنا، Vercel بيتعامل مع الـ app كـ serverless function
module.exports = app;