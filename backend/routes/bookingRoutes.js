import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings for a user
router.get('/', verifyToken, bookingController.getBookings);

// Create a new booking
router.post('/', verifyToken, bookingController.createBooking);

// Cancel booking
router.patch('/:id/cancel', verifyToken, bookingController.cancelBooking);

export default router;