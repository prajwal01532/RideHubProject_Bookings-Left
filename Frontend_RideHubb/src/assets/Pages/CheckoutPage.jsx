import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { generateUniqueId } from "esewajs";
import axios from 'axios';
import { FaCalendarAlt, FaUser, FaCar, FaMotorcycle, FaClock, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, format } from 'date-fns';

const DRIVER_PRICE_PER_DAY = 500;

const CheckoutPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [bookingDetails, setBookingDetails] = useState({
    startDate: null,
    endDate: null,
    requiresDriver: false,
    message: ''
  });

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const response = await api.get(`/vehicles/${type}/${id}`);
        if (response.data.success) {
          setVehicle(response.data.data);
        } else {
          throw new Error('Failed to fetch vehicle details');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load vehicle details');
        navigate('/vehicles/' + type);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [type, id, navigate]);

  const calculateTotalAmount = () => {
    if (!vehicle || !bookingDetails.startDate || !bookingDetails.endDate) return 0;
    
    const days = Math.ceil(
      (bookingDetails.endDate.getTime() - bookingDetails.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let totalAmount = days * vehicle.pricePerDay;
    if (bookingDetails.requiresDriver) {
      totalAmount += days * DRIVER_PRICE_PER_DAY;
    }
    
    return totalAmount;
  };

  const handleInputChange = (e) => {
    const { name, type, checked } = e.target;
    setBookingDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : e.target.value
    }));
  };

  const handleDateChange = (date, field) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: date,
      // Reset end date if start date is after current end date
      ...(field === 'startDate' && prev.endDate && date > prev.endDate 
        ? { endDate: addDays(date, 1) }
        : {})
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!bookingDetails.startDate || !bookingDetails.endDate) {
      toast.error('Please select booking dates');
      return;
    }

    const totalAmount = calculateTotalAmount();
    try {
      const response = await axios.post(
        "http://localhost:8000/initiate-payment",
        {
          amount: totalAmount,
          productId: generateUniqueId(),
        }
      );

      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error('Payment initiation failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const numberOfDays = bookingDetails.startDate && bookingDetails.endDate
    ? Math.ceil((bookingDetails.endDate - bookingDetails.startDate) / (1000 * 60 * 60 * 24))
    : 0;

  const CustomDatePickerInput = React.forwardRef(({ value, onClick, label, icon }, ref) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div 
        className="relative w-full cursor-pointer"
        onClick={onClick}
      >
        <input
          ref={ref}
          value={value}
          readOnly
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 cursor-pointer bg-white"
          placeholder="Select date"
        />
        {icon && <div className="absolute right-3 top-3 text-gray-400">{icon}</div>}
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vehicle Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  {type === 'car' ? <FaCar className="mr-2" /> : <FaMotorcycle className="mr-2" />}
                  Vehicle Details
                </h2>
                
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                  <img
                    src={vehicle?.images?.[0] || "/placeholder.svg"}
                    alt={vehicle?.name}
                    className="w-full md:w-64 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{vehicle?.name}</h3>
                    <p className="text-gray-600 mb-2">{vehicle?.brand}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-600">
                        <FaMoneyBillWave className="mr-2" />
                        <span>Rs. {vehicle?.pricePerDay}/day</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaClock className="mr-2" />
                        <span>Available Now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <DatePicker
                    selected={bookingDetails.startDate}
                    onChange={(date) => handleDateChange(date, 'startDate')}
                    minDate={new Date()}
                    customInput={
                      <CustomDatePickerInput
                        label="Start Date"
                        icon={<FaCalendarAlt />}
                      />
                    }
                  />
                  
                  <DatePicker
                    selected={bookingDetails.endDate}
                    onChange={(date) => handleDateChange(date, 'endDate')}
                    minDate={bookingDetails.startDate ? addDays(bookingDetails.startDate, 1) : new Date()}
                    customInput={
                      <CustomDatePickerInput
                        label="End Date"
                        icon={<FaCalendarAlt />}
                      />
                    }
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="requiresDriver"
                      checked={bookingDetails.requiresDriver}
                      onChange={handleInputChange}
                      className="form-checkbox h-5 w-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-gray-700">Need a Driver? (Rs. {DRIVER_PRICE_PER_DAY}/day)</span>
                  </label>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={bookingDetails.message}
                    onChange={handleInputChange}
                    rows="3"
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200"
                >
                  Pay with eSewa
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Duration:</span>
                    <span>{numberOfDays} days</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Vehicle Rate:</span>
                    <span>Rs. {vehicle?.pricePerDay}/day</span>
                  </div>
                  
                  {bookingDetails.requiresDriver && (
                    <div className="flex justify-between text-gray-600">
                      <span>Driver Rate:</span>
                      <span>Rs. {DRIVER_PRICE_PER_DAY}/day</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>Rs. {calculateTotalAmount()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-orange-500 mt-0.5 mr-3" />
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-orange-800">Payment Information</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Secure payment via eSewa</li>
                          <li>Instant booking confirmation</li>
                          <li>Free cancellation policy</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
