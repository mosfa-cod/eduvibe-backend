const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// ============ جلب كل الكورسات ============
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ في جلب البيانات' });
  }
});

module.exports = router;
