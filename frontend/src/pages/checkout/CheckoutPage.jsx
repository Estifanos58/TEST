import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Lock, CheckCircle, Clock, AlertCircle, 
  Shield, User, Ticket, Loader
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 15, seconds: 0 });
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    full_name: user?.full_name || ''
  });

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    if (reservations.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          clearInterval(timer);
          alert('Your reservation has expired. Please try again.');
          navigate('/saved-tickets');
          return prev;
        }
        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [reservations, navigate]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('checkoutReservations');
      if (saved) {
        const items = JSON.parse(saved);
        setReservations(items);
        setOrderNumber(`DEMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      } else {
        navigate('/discover');
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handlePayment = async () => {
    // Validate form
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.full_name) {
      setError('Please enter your full name');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    const total = reservations.reduce((sum, r) => sum + r.total_price, 0);
    const lineItems = reservations.map((item) => ({
      event_id: item.event_id,
      ticket_type_id: item.ticket_type?.id,
      quantity: item.quantity,
      unit_price: item.ticket_type?.price
    }));
    
    try {
      console.log('Sending payment request...');
      console.log('Order ID:', orderNumber);
      console.log('Total:', total);
      console.log('Email:', formData.email);
      
      const response = await fetch(`${API_URL}/payments/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          order_id: orderNumber,
          total_amount: total,
          user_email: formData.email,
          user_phone: formData.phone || '0912345678',
          user_name: formData.full_name,
          line_items: lineItems
        })
      });
      
      const data = await response.json();
      console.log('Payment response:', data);
      
      if (data.success && data.checkout_url) {
        // Redirect to Chapa payment page
        window.location.href = data.checkout_url;
      } else {
        if (data.code === 'BANNED_FROM_ORGANIZER') {
          const organizerName = data.ban?.organizer_name || 'this organizer';
          const reason = data.ban?.reason ? ` Reason: ${data.ban.reason}` : '';
          setError(`Booking blocked: You are banned from booking events by ${organizerName}.${reason}`);
        } else {
          setError(data.message || 'Payment initialization failed. Please try again.');
        }
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment service error. Please try again.');
      setProcessing(false);
    }
  };

  const totals = reservations.reduce(
    (acc, res) => ({
      subtotal: acc.subtotal + res.subtotal,
      service_fee: acc.service_fee + res.service_fee,
      total: acc.total + res.total_price,
    }),
    { subtotal: 0, service_fee: 0, total: 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="size-12 text-green-600 animate-spin" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Ticket className="size-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No items to checkout</h2>
          <p className="text-gray-500 mb-6">Your cart is empty.</p>
          <button onClick={() => navigate('/discover')} className="px-6 py-3 bg-green-600 text-white rounded-xl">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
<div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl shadow-lg mb-4">
            <CreditCard className="size-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase to secure your tickets</p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Complete checkout within</p>
                <p className="text-xs text-yellow-600">Your tickets are reserved until time expires</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-2xl font-bold text-gray-900">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-gray-400">:</span>
              <span className="text-2xl font-bold text-gray-900">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="size-5 text-green-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    name="full_name" 
                    value={formData.full_name} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" 
                    placeholder="you@example.com" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" 
                    placeholder="0912345678" 
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="size-5 text-green-600" />
                Order Items
              </h2>
              <div className="space-y-4">
                {reservations.map((res) => (
                  <div key={res.id} className="flex justify-between items-center py-3 border-b last:border-0">
                    <div>
                      <div className="font-semibold text-gray-900">{res.event.title?.split('|')[0]}</div>
                      <div className="text-sm text-gray-500">{res.ticket_type.tier_name} × {res.quantity}</div>
                    </div>
                    <div className="font-semibold text-gray-900">{res.subtotal} ETB</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{totals.subtotal.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Fee (10%)</span>
                  <span className="font-semibold">{totals.service_fee.toFixed(2)} ETB</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">{totals.total.toFixed(2)} ETB</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePayment} 
                disabled={processing} 
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="size-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="size-5" />
                    Pay {totals.total.toFixed(2)} ETB
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                You will be redirected to Chapa secure payment page
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Update for: feat(frontdoor): add POST /api/staff/scan flow for QR validation and check-in
// Update for: feat(frontdoor): add landing page hero section and search bar
// Update for: chore(frontdoor): update frontend flow documentation and API specs
// Update for: feat(frontdoor): build homepage with trending carousels and featured events
// Update for: feat(frontdoor): create event detail page with venue map and ticket tiers