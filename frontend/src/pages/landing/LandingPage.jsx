import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  Award,
  Globe,
  Smartphone,
  CreditCard,
  Headphones,
  ArrowRight,
  Star,
  CheckCircle,
  Zap,
  BarChart3,
  Ticket,
  MapPin,
  Clock,
  ChevronRight,
  Play,
  Mail,
  Phone,
  Map,
  Coffee,
  Music,
  Mic,
  Palette,
  Heart,
  Gift,
  Rocket,
  Crown,
  DollarSign,
  Eye,
  Activity,
  Compass,
  PartyPopper,
  Sparkle,
  User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const counterRef = useRef(null);
  const [counts, setCounts] = useState({
    events: 0,
    tickets: 0,
    organizers: 0,
    satisfaction: 0,
  });
  const [featuredEvents, setFeaturedEvents] = useState([]);

  const testimonials = [
    {
      name: "Nahom Wondale",
      role: "Event Organizer",
      content:
        "DEMS has transformed how I manage my events. The platform is intuitive and the support team is amazing! My ticket sales increased by 200%.",
      rating: 5,
      image: "https://i.imgur.com/ryO91vr.png",
      event: "Ethiopian Coffee Festival",
    },
    {
      name: "Helen Mekonnen",
      role: "Attendee",
      content:
        "Finding and booking tickets has never been easier. The QR code check-in is seamless and I love the digital wallet feature!",
      rating: 5,
      image:
        "https://plus.unsplash.com/premium_photo-1745624797642-4f522d5bcbfe?q=80&w=687&auto=format&fit=crop",
      event: "Addis Jazz Festival",
    },
    {
      name: "Abdisa Waritu",
      role: "Event Organizer",
      content:
        "The analytics dashboard gives me real insights into my event performance. I can track sales, revenue, and attendance in real-time.",
      rating: 5,
      image: "https://i.imgur.com/ndMwXNm.png",
      event: "Tech Summit 2026",
    },
    {
      name: "Meron Assefa",
      role: "Attendee",
      content:
        "I've attended over 20 events through DEMS. The platform is reliable, secure, and the customer support is exceptional!",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop",
      event: "Various Events",
    },
  ];

  const features = [
    {
      icon: Rocket,
      title: "Instant Booking",
      description: "Book tickets in seconds with our one-click checkout",
      color: "from-blue-500 to-cyan-500",
      delay: 0,
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Protected by Chapa, Ethiopia's leading payment gateway",
      color: "from-green-500 to-emerald-500",
      delay: 0.1,
    },
    {
      icon: Smartphone,
      title: "Digital Tickets",
      description: "QR code tickets for contactless entry",
      color: "from-purple-500 to-pink-500",
      delay: 0.2,
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights into your event performance",
      color: "from-orange-500 to-red-500",
      delay: 0.3,
    },
    {
      icon: Users,
      title: "Audience Insights",
      description: "Understand your attendees with detailed demographics",
      color: "from-indigo-500 to-purple-500",
      delay: 0.4,
    },
    {
      icon: Gift,
      title: "Promo Tools",
      description: "Create discount codes and run marketing campaigns",
      color: "from-pink-500 to-rose-500",
      delay: 0.5,
    },
  ];

  const stats = [
    { value: 10000, label: "Events Hosted", icon: Calendar, suffix: "+" },
    { value: 500000, label: "Tickets Sold", icon: Ticket, suffix: "+" },
    { value: 5000, label: "Happy Organizers", icon: Users, suffix: "+" },
    { value: 98, label: "Satisfaction Rate", icon: Star, suffix: "%" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % Math.max(featuredEvents.length, 1),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  useEffect(() => {
    const fetchPopularEvents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/events`,
        );
        const data = await response.json();

        if (!data.success || !Array.isArray(data.events)) {
          return;
        }

        const mappedEvents = data.events
          .map((event) => {
            const ticketTypes = Array.isArray(event.ticket_types)
              ? event.ticket_types
              : [];
            const totalSold = ticketTypes.reduce(
              (sum, ticket) =>
                sum +
                Math.max(
                  0,
                  Number(ticket.capacity) - Number(ticket.remaining_quantity),
                ),
              0,
            );
            const totalCapacity = ticketTypes.reduce(
              (sum, ticket) => sum + Number(ticket.capacity || 0),
              0,
            );
            const soldPercentage =
              totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
            const minPrice =
              ticketTypes.length > 0
                ? Math.min(
                    ...ticketTypes.map((ticket) => Number(ticket.price || 0)),
                  )
                : 0;

            let badge = "Popular";
            if (soldPercentage >= 90) {
              badge = "Almost Sold Out";
            } else if (totalSold >= 50) {
              badge = "Trending";
            }

            return {
              id: event.id,
              title: event.title,
              category: event.category_name || "Event",
              date: event.start_datetime
                ? new Date(event.start_datetime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "TBA",
              location: event.city || "Ethiopia",
              image:
                event.banner_url ||
                "https://images.unsplash.com/photo-1511578314322-379afb476865",
              price: `ETB ${Math.round(minPrice).toLocaleString()}`,
              badge,
              ticketsSold: totalSold,
            };
          })
          .sort((a, b) => b.ticketsSold - a.ticketsSold)
          .slice(0, 3);

        setFeaturedEvents(mappedEvents);
      } catch (error) {
        console.error("Error loading popular events:", error);
      }
    };

    fetchPopularEvents();
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(testimonialInterval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Animate counters when in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          stats.forEach((stat, idx) => {
            let start = 0;
            const end = stat.value;
            const duration = 2000;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                clearInterval(timer);
                start = end;
              }
              setCounts((prev) => ({
                ...prev,
                [stat.label]: Math.floor(start),
              }));
            }, 16);
          });
          observer.disconnect();
        }
      });
    });

    if (counterRef.current) observer.observe(counterRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0 animate-spin-slow"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23fff' d='M10,10 L20,10 L15,20 Z'/%3E%3C/svg%3E")`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float">
          <Ticket className="size-12 text-green-400/20" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float-delayed">
          <Music className="size-16 text-yellow-400/20" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float-slow">
          <Coffee className="size-10 text-red-400/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="text-center">
            <div className="animate-fadeInUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 hover:scale-105 transition-transform cursor-pointer">
                <Sparkles className="size-4 text-yellow-400 animate-pulse" />
                <span className="text-sm font-medium">
                  Ethiopia's #1 Event Platform
                </span>
                <TrendingUp className="size-3 text-green-400" />
              </div>

              <div className="mb-6">
                <div className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 relative inline-block">
                  <span className="bg-gradient-to-r from-green-400 via-yellow-300 to-red-400 bg-clip-text text-transparent animate-gradient">
                    DEMS
                  </span>
                  <div className="absolute -top-2 -right-8">
                    <Crown className="size-8 text-yellow-400 animate-bounce" />
                  </div>
                </div>
                <div className="h-1 w-32 mx-auto mb-8 flex rounded-full overflow-hidden">
                  <div className="flex-1 bg-green-500 animate-pulse" />
                  <div className="flex-1 bg-yellow-400 animate-pulse delay-100" />
                  <div className="flex-1 bg-red-500 animate-pulse delay-200" />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Discover. Experience.{" "}
                <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                  Connect.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Ethiopia's premier platform for discovering amazing events,
                booking tickets instantly, and creating unforgettable
                experiences.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link
                  to="/discover"
                  className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden"
                >
                  <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
                  <span className="relative flex items-center gap-2">
                    Explore Events
                    <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/organizer/signup"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center gap-2 group"
                >
                  <Calendar className="size-5 group-hover:rotate-12 transition-transform" />
                  Start Organizing
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Trusted by 5,000+ organizers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="size-4 text-green-500" />
                  <span>Secure payments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Headphones className="size-4 text-green-500" />
                  <span>24/7 support</span>
                </div>
              </div>

              {/* Stats Banner */}
              <div
                ref={counterRef}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              >
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="text-center animate-fadeInUp group"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl group-hover:bg-green-500/30 transition-all"></div>
                      <stat.icon className="size-8 mx-auto mb-2 text-green-400 relative z-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold">
                      {counts[stat.label]?.toLocaleString() || 0}
                      {stat.suffix}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center hover:bg-white/10 transition">
            <div className="w-1 h-2 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 px-6 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-50 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full mb-4 animate-pulse">
              <TrendingUp className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Trending Now
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Events <span className="text-green-600">Near You</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the most anticipated events happening across Ethiopia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEvents.map((event, idx) => (
              <div
                key={event.id || idx}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full shadow-lg">
                      {event.category}
                    </span>
                    {event.badge && (
                      <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full shadow-lg animate-pulse">
                        {event.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-sm font-bold rounded-lg">
                      {event.price}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {event.title}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="size-4 text-green-600" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="size-4 text-red-500" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Ticket className="size-4 text-yellow-600" />
                      <span className="text-sm">
                        {event.ticketsSold?.toLocaleString() || 0} tickets sold
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/discover"
                    className="inline-flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all"
                  >
                    Book Now <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {featuredEvents.length === 0 && (
            <div className="text-center text-gray-500 mt-6">
              No popular events available right now.
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-4">
              <Zap className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Why Choose DEMS
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in{" "}
              <span className="text-green-600">One Platform</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features to make event management and ticket booking
              seamless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeInUp"
                style={{ animationDelay: `${feature.delay}s` }}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="size-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-green-600 text-sm font-medium">
                    Learn more →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-4">
              <Play className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Simple Process
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How <span className="text-green-600">DEMS Works</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 -translate-y-1/2 z-0">
              <div className="absolute left-1/3 top-1/2 w-3 h-3 bg-green-500 rounded-full -translate-y-1/2 animate-ping"></div>
              <div className="absolute right-1/3 top-1/2 w-3 h-3 bg-red-500 rounded-full -translate-y-1/2 animate-ping"></div>
            </div>

            {[
              {
                step: "01",
                title: "Discover",
                description:
                  "Browse through hundreds of events happening near you",
                icon: Compass,
                color: "from-green-500 to-emerald-500",
              },
              {
                step: "02",
                title: "Book",
                description: "Select your tickets and checkout securely",
                icon: CreditCard,
                color: "from-yellow-500 to-orange-500",
              },
              {
                step: "03",
                title: "Experience",
                description: "Scan your QR code and enjoy the event",
                icon: PartyPopper,
                color: "from-red-500 to-pink-500",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 text-center group">
                <div className="relative inline-block mb-4">
                  <div
                    className={`w-24 h-24 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <step.icon className="size-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md font-bold text-green-600">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 px-4">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23fff' d='M10,10 L20,10 L15,20 Z'/%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Star className="size-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium">Loved by Thousands</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our <span className="text-green-400">Users Say</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Trusted by thousands of event organizers and attendees across
              Ethiopia
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${activeTestimonial * 100}%)`,
                }}
              >
                {testimonials.map((testimonial, idx) => (
                  <div key={idx} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-green-500"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                            <CheckCircle className="size-3 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="size-5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-gray-200 italic mb-6">
                        "{testimonial.content}"
                      </p>
                      <div>
                        <p className="font-semibold text-white">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-green-400">
                          {testimonial.role} • {testimonial.event}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`transition-all duration-300 ${
                    activeTestimonial === idx
                      ? "w-8 h-2 bg-green-500 rounded-full"
                      : "w-2 h-2 bg-gray-500 rounded-full hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-900 to-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 animate-pulse">
            <Sparkle className="size-4 text-yellow-400" />
            <span className="text-sm font-medium">Ready to Get Started?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Join Ethiopia's Premier{" "}
            <span className="text-yellow-400">Event Platform</span>
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Whether you're looking to attend events or host your own, DEMS has
            you covered.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/discover"
              className="group relative px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden"
            >
              <span className="relative flex items-center gap-2">
                Start Exploring
                <Rocket className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/organizer/signup"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center gap-2 group"
            >
              <Calendar className="size-5 group-hover:rotate-12 transition-transform" />
              Become an Organizer
            </Link>
          </div>
          <p className="text-sm text-green-200 mt-8">
            Join 5,000+ organizers already using DEMS • No setup fees • Cancel
            anytime
          </p>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}

// Update for: feat(frontdoor): implement POST /api/payments/init with reservation and cart lock checks
// Update for: chore(frontdoor): update frontend flow documentation and API specs
// Update for: feat(frontdoor): build homepage with trending carousels and featured events