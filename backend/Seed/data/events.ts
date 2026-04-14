import { organizerUserIds, type SeedEventId, eventCodeById } from '../utils/ids';
import { addHours, daysFromNowAtUtc, subtractDays } from '../utils/helpers';

type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
type EventVisibility = 'public' | 'private';

export interface EventSeedRecord {
  id: SeedEventId;
  code: string;
  organizer_id: string;
  title: string;
  category_id: string;
  event_type: string;
  description: string;
  banner_url: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  is_featured: boolean;
  start_datetime: Date;
  end_datetime: Date;
  city: string;
  venue_name: string | null;
  address_line1: string | null;
  created_at: Date;
}

const e01Start = daysFromNowAtUtc(18, 9, 0);
const e02Start = daysFromNowAtUtc(12, 16, 0);
const e03Start = daysFromNowAtUtc(9, 13, 0);
const e04Start = daysFromNowAtUtc(22, 8, 30);
const e05Start = daysFromNowAtUtc(14, 9, 0);
const e06Start = daysFromNowAtUtc(7, 17, 0);
const e07Start = daysFromNowAtUtc(5, 15, 0);
const e08Start = daysFromNowAtUtc(28, 9, 30);
const e09Start = daysFromNowAtUtc(40, 10, 0);
const e10Start = daysFromNowAtUtc(20, 12, 0);
const e11Start = daysFromNowAtUtc(-45, 9, 0);
const e12Start = daysFromNowAtUtc(-20, 18, 0);

export const events: EventSeedRecord[] = [
  {
    id: 'event_01',
    code: eventCodeById.event_01,
    organizer_id: organizerUserIds[0],
    title: 'Addis AI Summit 2026',
    category_id: 'cat_technology',
    event_type: 'Conference',
    description: 'A two-track summit focused on applied AI, enterprise automation, and local startup case studies.',
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    status: 'published',
    visibility: 'public',
    is_featured: true,
    start_datetime: e01Start,
    end_datetime: addHours(e01Start, 8),
    city: 'Addis Ababa',
    venue_name: 'Millennium Hall',
    address_line1: 'Bole Road, Addis Ababa',
    created_at: subtractDays(e01Start, 30)
  },
  {
    id: 'event_02',
    code: eventCodeById.event_02,
    organizer_id: organizerUserIds[3],
    title: 'Hawassa Lakeside Music Night',
    category_id: 'cat_music',
    event_type: 'Festival',
    description: 'An evening lakeside showcase featuring contemporary Ethiopian bands and curated food vendors.',
    banner_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    status: 'published',
    visibility: 'public',
    is_featured: true,
    start_datetime: e02Start,
    end_datetime: addHours(e02Start, 7),
    city: 'Hawassa',
    venue_name: 'Haile Resort Amphitheater',
    address_line1: 'Lakeside Road, Hawassa',
    created_at: subtractDays(e02Start, 35)
  },
  {
    id: 'event_03',
    code: eventCodeById.event_03,
    organizer_id: organizerUserIds[1],
    title: 'Startup Demo Day Addis',
    category_id: 'cat_startup',
    event_type: 'Meetup',
    description: 'Seed-stage founders pitch to local investors and ecosystem mentors in a one-day format.',
    banner_url: 'https://images.unsplash.com/photo-1515169067868-5387ec356754',
    status: 'published',
    visibility: 'public',
    is_featured: false,
    start_datetime: e03Start,
    end_datetime: addHours(e03Start, 5),
    city: 'Addis Ababa',
    venue_name: 'Friendship Business Center',
    address_line1: 'Kazanchis, Addis Ababa',
    created_at: subtractDays(e03Start, 28)
  },
  {
    id: 'event_04',
    code: eventCodeById.event_04,
    organizer_id: organizerUserIds[5],
    title: 'Health Innovation Forum Ethiopia',
    category_id: 'cat_health',
    event_type: 'Conference',
    description: 'Public and private health leaders discuss digital health implementation and care delivery.',
    banner_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f',
    status: 'published',
    visibility: 'public',
    is_featured: true,
    start_datetime: e04Start,
    end_datetime: addHours(e04Start, 8),
    city: 'Addis Ababa',
    venue_name: 'Skylight Hotel Conference Center',
    address_line1: 'Airport Road, Addis Ababa',
    created_at: subtractDays(e04Start, 31)
  },
  {
    id: 'event_05',
    code: eventCodeById.event_05,
    organizer_id: organizerUserIds[8],
    title: 'Bahir Dar Product Design Workshop',
    category_id: 'cat_workshop',
    event_type: 'Workshop',
    description: 'Hands-on product design clinic for teams building consumer and SME-focused digital products.',
    banner_url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad',
    status: 'published',
    visibility: 'public',
    is_featured: false,
    start_datetime: e05Start,
    end_datetime: addHours(e05Start, 7),
    city: 'Bahir Dar',
    venue_name: 'Blue Nile Convention Center',
    address_line1: 'Kebele 14, Bahir Dar',
    created_at: subtractDays(e05Start, 26)
  },
  {
    id: 'event_06',
    code: eventCodeById.event_06,
    organizer_id: organizerUserIds[4],
    title: 'Adama Business Networking Evening',
    category_id: 'cat_networking',
    event_type: 'Meetup',
    description: 'An after-hours networking event connecting founders, operators, and service providers.',
    banner_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
    status: 'published',
    visibility: 'public',
    is_featured: false,
    start_datetime: e06Start,
    end_datetime: addHours(e06Start, 4),
    city: 'Adama',
    venue_name: 'Adama Ras Hotel',
    address_line1: 'Main Street, Adama',
    created_at: subtractDays(e06Start, 24)
  },
  {
    id: 'event_07',
    code: eventCodeById.event_07,
    organizer_id: organizerUserIds[0],
    title: 'Cloud Cost Optimization Webinar',
    category_id: 'cat_technology',
    event_type: 'Webinar',
    description: 'A practical live webinar for engineering teams reducing cloud spend and improving performance.',
    banner_url: 'https://images.unsplash.com/photo-1584697964358-3e14ca57658b',
    status: 'published',
    visibility: 'public',
    is_featured: false,
    start_datetime: e07Start,
    end_datetime: addHours(e07Start, 3),
    city: 'Addis Ababa',
    venue_name: null,
    address_line1: null,
    created_at: subtractDays(e07Start, 20)
  },
  {
    id: 'event_08',
    code: eventCodeById.event_08,
    organizer_id: organizerUserIds[7],
    title: 'Education Leadership Bootcamp',
    category_id: 'cat_education',
    event_type: 'Workshop',
    description: 'A full-day bootcamp for school leaders implementing blended learning programs.',
    banner_url: null,
    status: 'published',
    visibility: 'public',
    is_featured: false,
    start_datetime: e08Start,
    end_datetime: addHours(e08Start, 8),
    city: 'Addis Ababa',
    venue_name: 'UNECA Training Center',
    address_line1: 'Menelik II Avenue, Addis Ababa',
    created_at: subtractDays(e08Start, 18)
  },
  {
    id: 'event_09',
    code: eventCodeById.event_09,
    organizer_id: organizerUserIds[6],
    title: 'Ethiopian Cultural Festival (Draft)',
    category_id: 'cat_festival',
    event_type: 'Festival',
    description: 'A planned multi-day culture festival featuring regional performances and artisan markets.',
    banner_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
    status: 'draft',
    visibility: 'private',
    is_featured: false,
    start_datetime: e09Start,
    end_datetime: addHours(e09Start, 10),
    city: 'Bahir Dar',
    venue_name: 'Bahir Dar Stadium Grounds',
    address_line1: 'Stadium District, Bahir Dar',
    created_at: subtractDays(e09Start, 15)
  },
  {
    id: 'event_10',
    code: eventCodeById.event_10,
    organizer_id: organizerUserIds[9],
    title: 'Addis Food Street Festival (Cancelled)',
    category_id: 'cat_festival',
    event_type: 'Festival',
    description: 'A city food and culture weekend that was cancelled due to permit scheduling constraints.',
    banner_url: null,
    status: 'cancelled',
    visibility: 'public',
    is_featured: false,
    start_datetime: e10Start,
    end_datetime: addHours(e10Start, 9),
    city: 'Addis Ababa',
    venue_name: 'Meskel Square',
    address_line1: 'Meskel Square, Addis Ababa',
    created_at: subtractDays(e10Start, 22)
  },
  {
    id: 'event_11',
    code: eventCodeById.event_11,
    organizer_id: organizerUserIds[2],
    title: 'Women in Startup Leadership Summit 2025',
    category_id: 'cat_conference',
    event_type: 'Conference',
    description: 'A completed leadership summit featuring founders, operators, and ecosystem partners.',
    banner_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
    status: 'completed',
    visibility: 'public',
    is_featured: false,
    start_datetime: e11Start,
    end_datetime: addHours(e11Start, 8),
    city: 'Addis Ababa',
    venue_name: 'Elilly Hotel Conference Hall',
    address_line1: 'Kazanchis, Addis Ababa',
    created_at: subtractDays(e11Start, 40)
  },
  {
    id: 'event_12',
    code: eventCodeById.event_12,
    organizer_id: organizerUserIds[3],
    title: 'Lakeside Jazz and Business Mixer 2025',
    category_id: 'cat_music',
    event_type: 'Meetup',
    description: 'A completed business-music mixer for professionals, creators, and local entrepreneurs.',
    banner_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    status: 'completed',
    visibility: 'public',
    is_featured: true,
    start_datetime: e12Start,
    end_datetime: addHours(e12Start, 6),
    city: 'Hawassa',
    venue_name: 'Lewi Resort Hall',
    address_line1: 'Lake Hawassa Shore, Hawassa',
    created_at: subtractDays(e12Start, 30)
  }
];

export const eventById = events.reduce<Record<string, EventSeedRecord>>((acc, event) => {
  acc[event.id] = event;
  return acc;
}, {});
