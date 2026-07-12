const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // لازم يكون عندك موديل User مبني بـ mongoose

// ============ تسجيل حساب جديد ============
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ msg: 'من فضلك أدخل كل البيانات المطلوبة' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ msg: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'حدث خطأ في السيرفر' });
  }
});

// ============ تسجيل الدخول ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'من فضلك أدخل البريد وكلمة المرور' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ في السيرفر' });
  }
});

module.exports = router;