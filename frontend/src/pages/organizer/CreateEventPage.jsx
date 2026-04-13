import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, DollarSign, ImageIcon, ArrowLeft, Upload, X, Ticket, CheckCircle } from 'lucide-react';
import { categoryAPI, eventAPI } from '../../api/client';

const MAX_BANNER_URL_LENGTH = 2048;
const CLOUDINARY_WIDGET_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const loadCloudinaryWidgetScript = () => {
  if (typeof window !== 'undefined' && window.cloudinary) {
    return Promise.resolve(window.cloudinary);
  }

  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Cloudinary uploader is unavailable in this environment.'));
      return;
    }

    const existingScript = document.querySelector(`script[src="${CLOUDINARY_WIDGET_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.cloudinary), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Cloudinary upload widget.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = CLOUDINARY_WIDGET_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.cloudinary);
    script.onerror = () => reject(new Error('Failed to load Cloudinary upload widget.'));
    document.body.appendChild(script);
  });
};

export function CreateEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const cloudinaryWidgetRef = useRef(null);
  const cloudinaryScriptPromiseRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    event_type: 'festival',
    description: '',
    start_datetime: '',
    end_datetime: '',
    venue_name: '',
    address_line1: '',
    city: 'Addis Ababa',
    banner_url: '',
    ticket_types: [
      { tier_name: 'Normal', price: '', capacity: '', benefits: 'Standard entry' },
      { tier_name: 'VIP', price: '', capacity: '', benefits: 'Priority entry, VIP seating' },
      { tier_name: 'VVIP', price: '', capacity: '', benefits: 'All VIP benefits, Backstage access' }
    ]
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...formData.ticket_types];
    updatedTickets[index][field] = value;
    setFormData(prev => ({ ...prev, ticket_types: updatedTickets }));
  };

  useEffect(() => {
    return () => {
      if (cloudinaryWidgetRef.current && typeof cloudinaryWidgetRef.current.destroy === 'function') {
        cloudinaryWidgetRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError('');

      try {
        const response = await categoryAPI.getAll();
        const categoryList = Array.isArray(response?.categories)
          ? response.categories.map((category) => ({ id: category.id, name: category.name }))
          : [];

        if (!isMounted) {
          return;
        }

        setCategories(categoryList);
        setFormData((prev) => {
          if (!prev.category_id) {
            return prev;
          }

          const exists = categoryList.some((category) => category.id === prev.category_id);
          return exists ? prev : { ...prev, category_id: '' };
        });

        if (categoryList.length === 0) {
          setCategoriesError('No categories are available. Please contact support.');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCategories([]);
        setCategoriesError(error.message || 'Failed to load categories. Please refresh and try again.');
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCloudinaryWidget = async () => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    if (!cloudinaryScriptPromiseRef.current) {
      cloudinaryScriptPromiseRef.current = loadCloudinaryWidgetScript();
    }

    const cloudinary = await cloudinaryScriptPromiseRef.current;
    if (!cloudinary || typeof cloudinary.createUploadWidget !== 'function') {
      throw new Error('Cloudinary upload widget is unavailable.');
    }

    if (!cloudinaryWidgetRef.current) {
      cloudinaryWidgetRef.current = cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          sources: ['local'],
          multiple: false,
          maxFiles: 1,
          resourceType: 'image',
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          maxFileSize: 5 * 1024 * 1024,
          singleUploadAutoClose: true
        },
        (error, result) => {
          if (error) {
            setWidgetLoading(false);
            setUploadSuccess(false);
            setUploadError(error?.message || 'Cloudinary upload failed. Please try again.');
            return;
          }

          if (!result) {
            return;
          }

          if (result.event === 'success') {
            const uploadedImageUrl = result.info?.secure_url || result.info?.url || '';

            if (!uploadedImageUrl) {
              setWidgetLoading(false);
              setUploadSuccess(false);
              setUploadError('Cloudinary did not return an image URL.');
              return;
            }

            if (uploadedImageUrl.length > MAX_BANNER_URL_LENGTH) {
              setWidgetLoading(false);
              setUploadSuccess(false);
              setUploadError(`Image URL is too long. Maximum length is ${MAX_BANNER_URL_LENGTH} characters.`);
              setFormData(prev => ({ ...prev, banner_url: '' }));
              setBannerPreview(null);
              return;
            }

            setFormData(prev => ({ ...prev, banner_url: uploadedImageUrl }));
            setBannerPreview(uploadedImageUrl);
            setUploadSuccess(true);
            setUploadError('');
            setWidgetLoading(false);
          }

          if (result.event === 'close' || result.event === 'abort') {
            setWidgetLoading(false);
          }
        }
      );
    }

    return cloudinaryWidgetRef.current;
  };

  const handleOpenCloudinaryWidget = async () => {
    setUploadError('');
    setUploadSuccess(false);
    setWidgetLoading(true);

    try {
      const widget = await getCloudinaryWidget();
      widget.open();
    } catch (error) {
      setWidgetLoading(false);
      setUploadSuccess(false);
      setUploadError(error.message || 'Failed to open Cloudinary uploader.');
    }
  };

  const handleRemoveImage = () => {
    setBannerPreview(null);
    setFormData(prev => ({ ...prev, banner_url: '' }));
    setUploadSuccess(false);
    setUploadError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_id) {
      alert('Please select a valid category before creating the event.');
      return;
    }

    const selectedCategoryExists = categories.some((category) => category.id === formData.category_id);
    if (!selectedCategoryExists) {
      alert('Selected category is no longer valid. Please reselect category and try again.');
      return;
    }
    
    if (!formData.banner_url) {
      alert('Please upload a banner image before creating the event.');
      return;
    }

    if (formData.banner_url.startsWith('data:image/')) {
      alert('Base64 image data is not supported. Please upload the image through Cloudinary.');
      return;
    }

    if (formData.banner_url.length > MAX_BANNER_URL_LENGTH) {
      alert(`Image URL is too long. Maximum length is ${MAX_BANNER_URL_LENGTH} characters.`);
      return;
    }
    
    setLoading(true);

    const validTicketTypes = formData.ticket_types.filter(t => t.price && t.capacity);
    
    const eventData = {
      title: formData.title,
      category_id: formData.category_id,
      event_type: formData.event_type,
      description: formData.description,
      start_datetime: formData.start_datetime,
      end_datetime: formData.end_datetime,
      city: formData.city,
      venue_name: formData.venue_name,
      address_line1: formData.address_line1,
      banner_url: formData.banner_url,
      ticket_types: validTicketTypes.map(t => ({
        tier_name: t.tier_name,
        price: parseFloat(t.price),
        capacity: parseInt(t.capacity),
        remaining_quantity: parseInt(t.capacity),
        benefits: t.benefits
      }))
    };

    console.log('Submitting event with banner_url:', eventData.banner_url);

    try {
      const response = await eventAPI.create(eventData);
      if (response.success) {
        alert('Event created successfully!');
        navigate('/organizer/dashboard');
      } else {
        alert(response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Create event error:', error);
      if (error?.data?.code === 'ORGANIZER_BANNED') {
        const reason = error?.data?.ban?.reason ? ` Reason: ${error.data.ban.reason}` : '';
        alert(`Event creation blocked. Your organizer account is currently banned.${reason}`);
      } else {
        alert(error.message || 'Failed to create event');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/organizer/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4">
            <ArrowLeft className="size-5" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl flex items-center justify-center">
              <Calendar className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-gray-600">Fill in the details to create your event</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="size-5 text-green-600" /> Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl" placeholder="e.g., Ethiopian Coffee Festival" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    disabled={categoriesLoading || categories.length === 0}
                    className="w-full px-4 py-3 border rounded-xl disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">
                      {categoriesLoading
                        ? 'Loading categories...'
                        : categories.length === 0
                          ? 'No categories available'
                          : 'Select category'}
                    </option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  {categoriesError && <p className="text-xs text-red-600 mt-1">{categoriesError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select name="event_type" value={formData.event_type} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl">
                    <option value="festival">Festival</option>
                    <option value="conference">Conference</option>
                    <option value="concert">Concert</option>
                    <option value="workshop">Workshop</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={5} className="w-full px-4 py-3 border rounded-xl" />
              </div>
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="size-5 text-green-600" /> Banner Image *
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image with Cloudinary</label>
              <button
                type="button"
                onClick={handleOpenCloudinaryWidget}
                disabled={widgetLoading}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                <Upload className="size-4" />
                {widgetLoading ? 'Opening uploader...' : 'Upload Banner Image'}
              </button>
              <p className="text-xs text-gray-500 mt-2">Use the Cloudinary uploader to select or drag and drop an image (JPG, PNG, GIF, WEBP up to 5MB).</p>

              {uploadError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              {uploadSuccess && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600" />
                  <p className="text-sm text-green-600">Image uploaded to Cloudinary successfully.</p>
                </div>
              )}
            </div>

            {bannerPreview && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Preview:</p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="size-4" /> Remove Image
                  </button>
                </div>
                <img 
                  src={bannerPreview} 
                  alt="Banner preview" 
                  className="w-full h-56 object-cover rounded-xl border border-gray-200 shadow-sm"
                  onError={(e) => {
                    console.error('Image failed to load:', bannerPreview);
                    e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87';
                  }}
                />
                {formData.banner_url && (
                  <p className="text-xs text-green-600 mt-2 break-all">
                    ✓ Image URL: {formData.banner_url.length > 80 ? `${formData.banner_url.substring(0, 80)}...` : formData.banner_url}
                  </p>
                )}
              </div>
            )}
            {!bannerPreview && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-700">⚠️ Banner image is required. Please upload one using the Cloudinary button above.</p>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="size-5 text-green-600" /> Date & Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label><input type="datetime-local" name="start_datetime" value={formData.start_datetime} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label><input type="datetime-local" name="end_datetime" value={formData.end_datetime} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl" /></div>
            </div>
          </div>

          {/* Venue */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-green-600" /> Venue
            </h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label><input type="text" name="venue_name" value={formData.venue_name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl" placeholder="Millennium Hall" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address *</label><input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl" placeholder="Bole Road" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl" /></div>
            </div>
          </div>

          {/* Ticket Types */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="size-5 text-green-600" /> Ticket Types
            </h2>
            <div className="space-y-4">
              {formData.ticket_types.map((ticket, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{ticket.tier_name} Tickets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB)</label><input type="number" value={ticket.price} onChange={(e) => handleTicketChange(index, 'price', e.target.value)} className="w-full px-4 py-2 border rounded-xl" placeholder="250" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" value={ticket.capacity} onChange={(e) => handleTicketChange(index, 'capacity', e.target.value)} className="w-full px-4 py-2 border rounded-xl" placeholder="500" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => navigate('/organizer/dashboard')} className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold">Cancel</button>
            <button type="submit" disabled={loading || !formData.banner_url || categoriesLoading || !formData.category_id} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold disabled:opacity-50">
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Update for: feat(controlroom): add organizer management UI and verification states
// Update for: feat(controlroom): add payout history and reconciliation services
// Update for: feat(controlroom): build dashboard UI with KPI widgets and summaries
// Update for: feat(controlroom): create events, ticket tiers, and transactions schema indexes