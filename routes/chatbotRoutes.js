/**
 * NGALAM FIX PRO - Chatbot AI, Cost Estimator & Testimonial Routes
 * Dedicated routes for real-time customer AI assistant, price calculator, and customer reviews.
 */

const express = require('express');
const router = express.Router();
const { processChatMessage } = require('../services/chatbotService');
const { getEstimatorData, calculateEstimate } = require('../services/estimatorService');
const { getAllTestimonials, addTestimonial } = require('../services/testimonialService');

// POST /api/chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }
    const result = await processChatMessage(message);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/estimator/data
router.get('/estimator/data', (req, res) => {
  try {
    const data = getEstimatorData();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/estimator/calculate
router.post('/estimator/calculate', (req, res) => {
  try {
    const { brand, model, damage } = req.body;
    const result = calculateEstimate({ brand, model, damage });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/testimonials
router.get('/testimonials', (req, res) => {
  try {
    const testimonials = getAllTestimonials();
    res.json({ success: true, count: testimonials.length, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/testimonials
router.post('/testimonials', (req, res) => {
  try {
    const newTestimonial = addTestimonial(req.body);
    res.status(201).json({
      success: true,
      message: 'Testimoni Anda berhasil dikirim dan diverifikasi.',
      data: newTestimonial,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
