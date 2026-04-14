// Centralized icon mapping for consistent usage across the project
import {
  Calendar, Tag, Users, CheckCircle, Star, Heart, Ticket, 
  Calendar as EventIcon, LayoutDashboard, UserCheck, Shield,
  Bell, Settings, HelpCircle, LogOut, Home, Search,
  MapPin, Clock, DollarSign, CreditCard, Smartphone,
  Building, Mail, Phone, Globe, Award, TrendingUp,
  BarChart3, Wallet, UserCog, PlusCircle, Eye, Trash2,
  Edit, RefreshCw, ChevronRight, ChevronLeft, X, Menu,
  Heart as HeartOutline, Star as StarOutline, Ticket as TicketOutline
} from 'lucide-react';

export const Icons = {
  // Navigation Icons
  dashboard: LayoutDashboard,
  events: Calendar,
  categories: Tag,
  users: Users,
  approvals: UserCheck,
  notifications: Bell,
  settings: Settings,
  help: HelpCircle,
  logout: LogOut,
  home: Home,
  search: Search,
  
  // Event Icons
  event: EventIcon,
  calendar: Calendar,
  location: MapPin,
  time: Clock,
  price: DollarSign,
  ticket: Ticket,
  
  // Payment Icons
  creditCard: CreditCard,
  smartphone: Smartphone,
  building: Building,
  wallet: Wallet,
  
  // Contact Icons
  email: Mail,
  phone: Phone,
  website: Globe,
  
  // Status Icons
  success: CheckCircle,
  pending: Clock,
  featured: Award,
  trending: TrendingUp,
  
  // Action Icons
  edit: Edit,
  delete: Trash2,
  view: Eye,
  refresh: RefreshCw,
  add: PlusCircle,
  save: CheckCircle,
  cancel: X,
  
  // User Icons
  user: Users,
  organizer: UserCog,
  attendee: Users,
  admin: Shield,
  staff: Users,
  
  // Rating Icons
  star: Star,
  starOutline: StarOutline,
  heart: Heart,
  heartOutline: HeartOutline,
  ticketOutline: TicketOutline,
  
  // Navigation
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  menu: Menu,
  close: X
};

export default Icons;
