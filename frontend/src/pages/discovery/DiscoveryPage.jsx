import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  MapPin,
  Star,
  Heart,
  Users,
  TrendingUp,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  SlidersHorizontal,
  Coffee,
  Music,
  Mic,
  Palette,
  Briefcase,
  GraduationCap,
  Zap,
  Clock,
  DollarSign,
  Tag,
  Sparkles,
  Award,
  Eye,
  Share2,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { eventAPI } from "../../api/client";

export function DiscoveryPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedCity, setSelectedCity] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedEvents, setSavedEvents] = useState([]);
  const eventsPerPage = 12;

  const categories = [
    {
      id: "all",
      name: "All Events",
      icon: Sparkles,
      color: "from-gray-500 to-gray-600",
    },
    {
      id: "Music",
      name: "Music",
      icon: Music,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "Cultural",
      name: "Cultural",
      icon: Palette,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "Technology",
      name: "Technology",
      icon: Coffee,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "Business",
      name: "Business",
      icon: Briefcase,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "Educational",
      name: "Educational",
      icon: GraduationCap,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "Sports",
      name: "Sports",
      icon: Zap,
      color: "from-red-500 to-orange-500",
    },
  ];

  const ethiopianCities = [
    "Addis Ababa",
    "Bahir Dar",
    "Gondar",
    "Lalibela",
    "Axum",
    "Hawassa",
    "Dire Dawa",
    "Mekelle",
    "Jimma",
    "Harar",
  ];

  const sortOptions = [
    { value: "latest", label: "Latest Events", icon: Clock },
    { value: "price_low", label: "Price: Low to High", icon: DollarSign },
    { value: "price_high", label: "Price: High to Low", icon: DollarSign },
    { value: "popular", label: "Most Popular", icon: TrendingUp },
  ];

  useEffect(() => {
    fetchEvents();
    loadSavedEvents();
  }, []);

  const loadSavedEvents = () => {
    const saved = localStorage.getItem("savedEvents");
    if (saved) {
      setSavedEvents(JSON.parse(saved));
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventAPI.getAll();
      if (response.success) {
        let publishedEvents = (response.events || []).filter(
          (e) => e.status === "published",
        );

        publishedEvents = publishedEvents.map((event) => ({
          ...event,
          min_price:
            event.ticket_types?.length > 0
              ? Math.min(...event.ticket_types.map((t) => t.price))
              : 0,
          total_tickets:
            event.ticket_types?.reduce(
              (sum, t) => sum + (t.capacity - t.remaining_quantity),
              0,
            ) || 0,
        }));

        setEvents(publishedEvents);
        setFilteredEvents(publishedEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...events];

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.category_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          event.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) => event.category_name === selectedCategory,
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((event) => event.city === selectedCity);
    }

    if (priceRange.min) {
      filtered = filtered.filter(
        (event) => (event.min_price || 0) >= Number(priceRange.min),
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(
        (event) => (event.min_price || 0) <= Number(priceRange.max),
      );
    }

    if (showSavedOnly) {
      filtered = filtered.filter((event) => savedEvents.includes(event.id));
    }

    switch (sortBy) {
      case "latest":
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        break;
      case "price_low":
        filtered.sort((a, b) => (a.min_price || 0) - (b.min_price || 0));
        break;
      case "price_high":
        filtered.sort((a, b) => (b.min_price || 0) - (a.min_price || 0));
        break;
      case "popular":
        filtered.sort(
          (a, b) => (b.total_tickets || 0) - (a.total_tickets || 0),
        );
        break;
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedCity,
    priceRange,
    events,
    sortBy,
    showSavedOnly,
    savedEvents,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Event Ended";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedCity(null);
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
    setSortBy("latest");
    setShowSavedOnly(false);
  };

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent,
  );
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin size-16 border-4 border-green-200 border-t-green-600 rounded-full mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="size-6 text-green-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-500 mt-4">Discovering amazing events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23fff' d='M10,10 L20,10 L15,20 Z'/%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="size-4 text-yellow-400" />
              <span className="text-sm font-medium">
                Discover Amazing Events
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Find Your Next Experience
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Discover and book tickets for the best events across Ethiopia
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title, category, city, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-2xl"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(cat.id === "all" ? null : cat.id)
                }
                className={`group flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:-translate-y-0.5 ${
                  selectedCategory === cat.id ||
                  (cat.id === "all" && !selectedCategory)
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                    : "bg-white text-gray-700 hover:shadow-md border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <cat.icon className="size-4" />
                  {cat.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {filteredEvents.length}
              </span>{" "}
              events found
            </p>
            {showSavedOnly && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                <Heart className="size-3 fill-green-600" /> Saved Only
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500 text-sm"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition text-sm"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {(selectedCity ||
                priceRange.min ||
                priceRange.max ||
                showSavedOnly) && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>

            <div className="flex items-center gap-2 bg-white rounded-xl border p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Grid3x3 className="size-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                Filter Events
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={selectedCity || ""}
                  onChange={(e) => setSelectedCity(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">All Cities</option>
                  {ethiopianCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (ETB)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSavedOnly}
                    onChange={(e) => setShowSavedOnly(e.target.checked)}
                    className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show only saved events
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Events Grid/List */}
        {currentEvents.length > 0 ? (
          <>
            <div
              className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-6`}
            >
              {currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  formatDate={formatDate}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-xl font-medium transition ${
                            currentPage === page
                              ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                              : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={i} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Search className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Modern Event Card Component - No ticket count displayed
function EventCard({ event, formatDate, viewMode }) {
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem("savedEvents") || "[]");
    setIsSaved(savedEvents.includes(event.id));
  }, [event.id]);

  const bannerUrl = event.banner_url || event.image_url;
  const fallbackImage =
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87";
  const isEventToday =
    new Date(event.start_datetime).toDateString() === new Date().toDateString();
  const isEventEnded = new Date(event.end_datetime) < new Date();

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
        <Link to={`/event/${event.id}`} className="flex flex-col md:flex-row">
          <div className="relative md:w-64 h-48 overflow-hidden">
            <img
              src={!imageError && bannerUrl ? bannerUrl : fallbackImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
            {event.is_featured && (
              <span className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-semibold rounded-lg flex items-center gap-1">
                <Award className="size-3" /> Featured
              </span>
            )}
          </div>
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                    {event.category_name || "Event"}
                  </span>
                  {isEventToday && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg animate-pulse">
                      Today
                    </span>
                  )}
                  {event.is_trending && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg flex items-center gap-1">
                      <TrendingUp className="size-3" /> Trending
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2 hover:text-green-600 transition-colors line-clamp-1">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4 text-green-600" />
                    {formatDate(event.start_datetime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4 text-red-500" />
                    {event.city}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ETB {event.min_price || 250}+
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const savedEvents = JSON.parse(
                      localStorage.getItem("savedEvents") || "[]",
                    );
                    if (isSaved) {
                      const newSaved = savedEvents.filter(
                        (id) => id !== event.id,
                      );
                      localStorage.setItem(
                        "savedEvents",
                        JSON.stringify(newSaved),
                      );
                      setIsSaved(false);
                    } else {
                      savedEvents.push(event.id);
                      localStorage.setItem(
                        "savedEvents",
                        JSON.stringify(savedEvents),
                      );
                      setIsSaved(true);
                    }
                  }}
                  className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
                >
                  <Heart
                    className={`size-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <Link to={`/event/${event.id}`} className="block">
        <div className="relative h-52 overflow-hidden">
          <img
            src={!imageError && bannerUrl ? bannerUrl : fallbackImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {event.is_featured && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-semibold rounded-lg flex items-center gap-1">
              <Award className="size-3" /> Featured
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              const savedEvents = JSON.parse(
                localStorage.getItem("savedEvents") || "[]",
              );
              if (isSaved) {
                const newSaved = savedEvents.filter((id) => id !== event.id);
                localStorage.setItem("savedEvents", JSON.stringify(newSaved));
                setIsSaved(false);
              } else {
                savedEvents.push(event.id);
                localStorage.setItem(
                  "savedEvents",
                  JSON.stringify(savedEvents),
                );
                setIsSaved(true);
              }
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 transition z-10"
          >
            <Heart
              className={`size-4 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>

          <div className="absolute bottom-3 right-3 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg">
            ETB {event.min_price || 250}+
          </div>

          {isEventToday && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 animate-pulse">
              <Clock className="size-3" /> Today
            </div>
          )}

          {isEventEnded && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1 bg-gray-800 text-white text-sm font-semibold rounded-full">
                Event Ended
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg">
              {event.category_name || "Event"}
            </span>
            {event.is_trending && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-lg flex items-center gap-1">
                <TrendingUp className="size-3" /> Hot
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors text-sm">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3 text-green-600" />
              <span>{formatDate(event.start_datetime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3 text-red-500" />
              <span className="line-clamp-1">{event.city}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Update for: feat(frontdoor): add order creation and Chapa payment initialization integration