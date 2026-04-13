import { Link } from 'react-router-dom';
import { Calendar, MapPin, Star, Heart, Users, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

export function EventCard({ event, onSave, isSaved: propIsSaved }) {
  const [isSaved, setIsSaved] = useState(propIsSaved || false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem('savedEvents') || '[]');
    setIsSaved(savedEvents.includes(event.id));
  }, [event.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get the banner URL - check multiple possible field names
  const bannerUrl = event.banner_url || event.image_url || event.thumbnail_url;
  
  // Fallback image if none provided or if image fails to load
  const fallbackImage = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87';

  const handleSaveEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const savedEvents = JSON.parse(localStorage.getItem('savedEvents') || '[]');
    let newSavedEvents;
    
    if (isSaved) {
      newSavedEvents = savedEvents.filter(id => id !== event.id);
      localStorage.setItem('savedEvents', JSON.stringify(newSavedEvents));
      setIsSaved(false);
    } else {
      newSavedEvents = [...savedEvents, event.id];
      localStorage.setItem('savedEvents', JSON.stringify(newSavedEvents));
      setIsSaved(true);
      
      // Also save to checkout reservations format for cart
      const checkoutItems = JSON.parse(localStorage.getItem('checkoutReservations') || '[]');
      const existingItem = checkoutItems.find(item => item.event_id === event.id);
      
      if (!existingItem) {
        const newItem = {
          id: `res_${Date.now()}_${event.id}`,
          event_id: event.id,
          event: {
            id: event.id,
            title: event.title,
            image_url: bannerUrl || fallbackImage
          },
          ticket_type: {
            id: 'default',
            tier_name: event.ticket_type_name || 'General Admission',
            price: event.min_price || 250
          },
          quantity: 1,
          subtotal: event.min_price || 250,
          service_fee: (event.min_price || 250) * 0.1,
          total_price: (event.min_price || 250) * 1.1,
          reserved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
        checkoutItems.push(newItem);
        localStorage.setItem('checkoutReservations', JSON.stringify(checkoutItems));
      }
    }
    
    if (onSave) {
      onSave(event.id, !isSaved);
    }
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800">
      {/* Event Image */}
      <Link to={`/event/${event.id}`} className="block relative h-48 overflow-hidden">
        <img 
          src={!imageError && bannerUrl ? bannerUrl : fallbackImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        {event.category_name && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold rounded-lg">
            {event.category_name}
          </span>
        )}
        
        {/* Save Button */}
        <button 
          onClick={handleSaveEvent}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 transition group/btn z-10"
          aria-label={isSaved ? 'Remove from saved' : 'Save event'}
        >
          <Heart className={`size-4 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600 group-hover/btn:text-red-500'}`} />
        </button>
        
        {/* Price Badge */}
        {event.min_price !== undefined && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg">
            ETB {event.min_price}+
          </div>
        )}
        
        {/* Tickets Left Badge */}
        {event.tickets_left && event.tickets_left < 100 && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
            <Users className="size-3" />
            {event.tickets_left} left
          </div>
        )}
      </Link>
      
      {/* Event Info */}
      <div className="p-4">
        <Link to={`/event/${event.id}`}>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-green-600 transition-colors text-sm">
            {event.title}
          </h3>
        </Link>
        
        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3 text-green-600" />
            <span>{formatDate(event.start_datetime || event.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3 text-red-500" />
            <span className="line-clamp-1">{event.location || event.city || 'Addis Ababa, Ethiopia'}</span>
          </div>
          {event.rating && (
            <div className="flex items-center gap-1.5">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{event.rating}</span>
              <span className="text-gray-400">({event.review_count || 0})</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          {event.is_trending && (
            <div className="flex items-center gap-1 text-xs text-orange-500">
              <Eye className="size-3" />
              <span>Trending</span>
            </div>
          )}
          <Link 
            to={`/event/${event.id}`}
            className="ml-auto px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm"
          >
            Get Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}

// Update for: feat(frontdoor): add landing page hero section and search bar
// Update for: feat(frontdoor): add user profile page with settings and notifications
// Update for: feat(frontdoor): build homepage with trending carousels and featured events