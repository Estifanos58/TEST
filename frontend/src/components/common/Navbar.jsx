import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  LogOut,
  Ticket,
  Calendar,
  PlusCircle,
  LayoutDashboard,
  Shield,
  UserCog,
  Heart,
  Menu,
  X,
  Home,
  Star,
  Settings,
  HelpCircle,
  LogIn,
  Coffee,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Award,
  Bell,
  BellRing,
  UserCheck,
  Eye,
  Globe,
  Building,
  Mail,
  Phone,
  Tag,
  BarChart3,
  Wallet,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "../../contexts/AuthContext";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`);
      setShowMobileMenu(false);
    }
  };

  const role = user?.role_id || (isAuthenticated ? 3 : 0);
  // role_id: 1=admin, 2=organizer, 3=attendee, 4=staff, 5=security

  // ── Security / Staff Navbar ──────────────────────────────────────────────
  if (role === 5 || role === 4) {
    return (
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/staff/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="size-6 text-green-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
            <div>
              <span className="text-lg font-bold">DEMS Security</span>
              <p className="hidden sm:block text-xs text-gray-400">
                Event Check-in System
              </p>
            </div>
          </Link>
          <div className="w-full sm:w-auto flex items-center justify-end gap-2 sm:gap-4">
            <Link
              to="/security/scanner"
              className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Open Scanner
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600 rounded-lg transition"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ── Admin Navbar ─────────────────────────────────────────────────────────
  if (role === 1) {
    return (
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">ዲ</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold">DEMS</span>
              <span className="ml-2 text-xs bg-red-500 px-2 py-0.5 rounded-full font-semibold">
                ADMIN
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/admin/dashboard"
              className={`relative text-sm flex items-center gap-2 px-3 py-2 rounded-lg transition ${location.pathname === "/admin/dashboard" ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link
              to="/admin/approvals"
              className={`relative text-sm flex items-center gap-2 px-3 py-2 rounded-lg transition ${location.pathname === "/admin/approvals" ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              <UserCheck className="size-4" /> Approvals
            </Link>
            {/* <Link to="/admin/events" className={`relative text-sm flex items-center gap-2 px-3 py-2 rounded-lg transition ${location.pathname === '/admin/events' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
              <Calendar className="size-4" /> Events
            </Link> */}
            {/* <Link to="/admin/categories" className={`relative text-sm flex items-center gap-2 px-3 py-2 rounded-lg transition ${location.pathname === '/admin/categories' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
              <Tag className="size-4" /> Categories
            </Link> */}
            <Link
              to="/admin/users"
              className={`relative text-sm flex items-center gap-2 px-3 py-2 rounded-lg transition ${location.pathname === "/admin/users" ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              <Users className="size-4" /> Users
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-sm text-gray-300">
                {user?.full_name?.split(" ")[0] || "Admin"}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <Link
              to="/admin/dashboard"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/admin/dashboard" ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/approvals"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/admin/approvals" ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              Approvals
            </Link>
            <Link
              to="/admin/users"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/admin/users" ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              Users
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // ── Organizer Navbar ─────────────────────────────────────────────────────
  if (role === 2) {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link
            to="/organizer/dashboard"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">ዲ</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                DEMS
              </span>
              <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">
                Organizer
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/organizer/dashboard"
              className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition ${location.pathname === "/organizer/dashboard" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link
              to="/organizer/create-event"
              className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition ${location.pathname === "/organizer/create-event" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              <PlusCircle className="size-4" /> Create Event
            </Link>
            <Link
              to="/staff/management"
              className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition ${location.pathname === "/staff/management" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              <UserCog className="size-4" /> Staff
            </Link>
            <Link
              to="/organizer/payouts"
              className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition ${location.pathname === "/organizer/payouts" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              <Wallet className="size-4" /> Payouts
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.full_name?.charAt(0) || "O"}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:inline-block">
                  {user?.full_name?.split(" ")[0] || "Organizer"}
                </span>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 z-50 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <User className="size-4" /> Profile Settings
                    </Link>

                    <Link
                      to="/organizer/payouts"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <DollarSign className="size-4" /> Payouts
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="size-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <Link
              to="/organizer/dashboard"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/organizer/dashboard" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400"}`}
            >
              Dashboard
            </Link>
            <Link
              to="/organizer/create-event"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/organizer/create-event" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400"}`}
            >
              Create Event
            </Link>
            <Link
              to="/staff/management"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/staff/management" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400"}`}
            >
              Staff
            </Link>
            <Link
              to="/organizer/payouts"
              className={`whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${location.pathname === "/organizer/payouts" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-gray-600 dark:text-gray-400"}`}
            >
              Payouts
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // ── Attendee / Guest Navbar (Main Public Navbar) ────────────────────────
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-base">ዲ</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              DEMS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 ml-8">
            <Link
              to="/discover"
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition ${location.pathname === "/discover" ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              Discover Events
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/saved-tickets"
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${location.pathname === "/saved-tickets" ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
                >
                  <Heart className="size-4" /> Saved
                </Link>
                <Link
                  to="/my-tickets"
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${location.pathname === "/my-tickets" ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
                >
                  <Ticket className="size-4" /> My Tickets
                </Link>
              </>
            )}
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, category, or tags..."
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-gray-50 border-gray-200 focus:border-green-400 focus:ring-green-100"
              />
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-gray-100"
            >
              {showMobileMenu ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>

            {/* Notification Bell (only for logged in users) */}
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.full_name?.charAt(0) ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {user?.full_name?.split(" ")[0] || "User"}
                  </span>
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border py-2 z-50 bg-white border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="size-4" /> Profile Settings
                      </Link>
                      <Link
                        to="/saved-tickets"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart className="size-4" /> Saved Tickets
                      </Link>
                      <Link
                        to="/my-tickets"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Ticket className="size-4" /> My Tickets
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="size-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl bg-gray-50 border-gray-200 focus:border-green-400 focus:ring-green-100"
              />
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slideDown">
            <div className="space-y-2">
              <Link
                to="/discover"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <Calendar className="size-4" /> Discover Events
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/saved-tickets"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Heart className="size-4" /> Saved Tickets
                  </Link>
                  <Link
                    to="/my-tickets"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Ticket className="size-4" /> My Tickets
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="size-4" /> Profile
                  </Link>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 mx-4 mt-4 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <LogIn className="size-4" /> Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
