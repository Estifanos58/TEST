import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Clock, AlertCircle, Heart, Calendar, MapPin, Ticket } from 'lucide-react';

export function SavedTicketsPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState([]);
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    loadCartAndSavedItems();
  }, []);

  const loadCartAndSavedItems = async () => {
    // Get cart items from checkoutReservations
    const saved = localStorage.getItem('checkoutReservations');
    const cartData = saved ? JSON.parse(saved) : [];
    setCartItems(cartData);
    
    // Get saved event IDs
    const savedIds = JSON.parse(localStorage.getItem('savedEvents') || '[]');
    setSavedEventIds(savedIds);
    
    // If there are saved event IDs but no cart items, we need to fetch event details
    if (savedIds.length > 0 && cartData.length === 0) {
      // Try to get from mock events or create placeholder items
      const mockEvents = [
        { id: '1', title: 'ታላቁ የኢትዮጵያ ቡና ፌስቲቫል | Great Ethiopian Coffee Festival', image_url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31', min_price: 250, location: 'Addis Ababa', start_date: '2024-12-15' },
        { id: '2', title: 'ታላቁ የሐዋሳ ሙዚቃ ፌስቲቫል | Hawassa Music Festival', image_url: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c', min_price: 350, location: 'Hawassa', start_date: '2024-11-20' },
        { id: '3', title: 'የጎንደር ባህላዊ ዳንስ ትርኢት | Gondar Traditional Dance', image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077', min_price: 150, location: 'Gondar', start_date: '2024-10-10' }
      ];
      
      const savedEvents = mockEvents.filter(event => savedIds.includes(event.id));
      const newCartItems = savedEvents.map(event => ({
        id: `res_${Date.now()}_${event.id}`,
        event_id: event.id,
        event: {
          id: event.id,
          title: event.title,
          image_url: event.image_url,
          date: event.start_date,
          location: event.location
        },
        ticket_type: {
          id: 'default',
          tier_name: 'General Admission',
          price: event.min_price
        },
        quantity: 1,
        subtotal: event.min_price,
        service_fee: event.min_price * 0.1,
        total_price: event.min_price * 1.1,
        reserved_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }));
      
      if (newCartItems.length > 0) {
        localStorage.setItem('checkoutReservations', JSON.stringify(newCartItems));
        setCartItems(newCartItems);
      }
    }
  };

  const removeItem = (id, eventId) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('checkoutReservations', JSON.stringify(updated));
    
    // Also remove from saved events
    const savedIds = JSON.parse(localStorage.getItem('savedEvents') || '[]');
    const updatedSavedIds = savedIds.filter(sid => sid !== eventId);
    localStorage.setItem('savedEvents', JSON.stringify(updatedSavedIds));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newSubtotal = item.ticket_type.price * newQuantity;
        const newServiceFee = newSubtotal * 0.1;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newSubtotal,
          service_fee: newServiceFee,
          total_price: newSubtotal + newServiceFee
        };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('checkoutReservations', JSON.stringify(updated));
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigate('/checkout');
    }
  };

  const totals = cartItems.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.subtotal,
      service_fee: acc.service_fee + item.service_fee,
      total: acc.total + item.total_price,
    }),
    { subtotal: 0, service_fee: 0, total: 0 }
  );

  // Show saved events even if cart is empty
  if (cartItems.length === 0 && savedEventIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="size-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved tickets yet</h2>
          <p className="text-gray-500 mb-6">
            Save events you're interested in and they'll appear here
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Ethiopian Tricolor Accent */}
<div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl shadow-lg mb-4">
            <Heart className="size-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            የተቀመጡ ትኬቶች | Saved Tickets
          </h1>
          <p className="text-gray-600">Review your saved events and proceed to checkout</p>
        </div>

        {/* Countdown Banner if items exist */}
        {cartItems.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Complete your purchase within 15 minutes to secure these tickets!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 && savedEventIds.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertCircle className="size-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">No tickets selected</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You have saved events but haven't selected ticket quantities yet.
                </p>
                <Link 
                  to="/discover"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                >
                  Browse Events
                </Link>
              </div>
            )}
            
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex gap-4 flex-col sm:flex-row">
                  <img 
                    src={item.event.image_url} 
                    alt={item.event.title} 
                    className="w-full sm:w-32 h-32 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {item.event.title.split('|')[0]}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3" />
                        <span>{new Date(item.event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3" />
                        <span>{item.event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="size-3" />
                        <span>{item.ticket_type.tier_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{item.total_price} ETB</div>
                        <div className="text-xs text-gray-400">{item.ticket_type.price} ETB each</div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.event_id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24 border border-gray-100">
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
                  onClick={handleCheckout}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                >
                  Proceed to Checkout
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Tickets are reserved for 15 minutes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Link 
            to="/discover"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            ← Continue Browsing Events
          </Link>
        </div>
      </div>
    </div>
  );
}

// Update for: feat(frontdoor): add landing page hero section and search bar