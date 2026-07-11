 const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح!'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// ================= MODELS =================

// 1. User Model
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// 2. Course Model (الموديل الجديد الخاص بالكورسات)
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true }, // رابط الفيديو
  instructor: { type: String, default: 'أكاديمية المستقبل' },
  createdAt: { type: Date, default: Date.now }
});
const Course = mongoose.model('Course', courseSchema);


// ================= ROUTES =================

// [أولاً: مسارات الحسابات وتوثيق المستخدمين]
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'هذا البريد الإلكتروني مسجل بالفعل' });

    user = new User({ fullName, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, fullName, email } });
  } catch (err) {
    res.status(500).send('خطأ في السيرفر');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, fullName: user.fullName, email } });
  } catch (err) {
    res.status(500).send('خطأ في السيرفر');
  }
});


// [ثانياً: مسارات الكورسات والدروس الجديدة]
// 1. إضافة كورس جديد (للمعلم)
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, videoUrl, instructor } = req.body;
    const newCourse = new Course({ title, description, videoUrl, instructor });
    await newCourse.save();
    res.json({ msg: '🎉 تم نشر الكورس بنجاح وحفظه سحابياً!', course: newCourse });
  } catch (err) {
    res.status(500).send('خطأ أثناء إضافة الكورس');
  }
});

// 2. جلب جميع الكورسات (ليراها الطلاب)
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).send('خطأ أثناء جلب الكورسات');
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 السيرفر يعمل الآن على المنفذ: ${PORT}`));
