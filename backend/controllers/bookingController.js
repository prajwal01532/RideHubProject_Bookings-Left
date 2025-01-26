import Booking from '../models/Booking.js';
import Car from '../models/Car.js';
import Bike from '../models/Bike.js';

// Get all bookings for a user
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
};

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, requiresDriver, message } = req.body;

        // Validate required fields
        if (!vehicleId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID, start date, and end date are required'
            });
        }

        // Calculate duration in days
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        const duration = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));

        if (duration < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid duration. End date must be after start date'
            });
        }

        // Determine vehicle type and find vehicle
        let vehicle;
        let vehicleType;
        try {
            vehicle = await Car.findById(vehicleId);
            if (vehicle) {
                vehicleType = 'car';
            } else {
                vehicle = await Bike.findById(vehicleId);
                if (vehicle) {
                    vehicleType = 'bike';
                }
            }
        } catch (error) {
            console.error('Error finding vehicle:', error);
        }

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Calculate total cost
        const driverCost = requiresDriver ? (500 * duration) : 0; // 500 per day for driver
        const vehicleCost = vehicle.pricePerDay * duration;
        const totalCost = vehicleCost + driverCost;

        // Create booking
        const booking = new Booking({
            user: req.user._id,
            vehicle: vehicleId,
            vehicleType,
            vehicleName: vehicle.name,
            vehicleBrand: vehicle.brand,
            startDate: startDateTime,
            duration,
            totalCost,
            requiresDriver,
            message
        });

        await booking.save();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create booking'
        });
    }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking belongs to user
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Update vehicle status
        const Model = booking.vehicleType === 'car' ? Car : Bike;
        const vehicle = await Model.findById(booking.vehicle);
        if (vehicle) {
            vehicle.status = 'available';
            await vehicle.save();
        }

        // Delete booking
        await booking.remove();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel booking'
        });
    }
};