const express = require('express');
const {
    getTestimonials,
    getTestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
} = require('../controllers/testimonialController');

const router = express.Router();

router.route('/')
    .get(getTestimonials)
    .post(createTestimonial);

router.route('/:id')
    .get(getTestimonial)
    .put(updateTestimonial)
    .delete(deleteTestimonial);

module.exports = router;