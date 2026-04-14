import { organizerUserIds, attendeeUserIds } from '../utils/ids';
import { addHours } from '../utils/helpers';
import { eventById } from './events';

type ReviewStatus = 'visible' | 'hidden' | 'pending';

export interface ReviewSeedRecord {
  id: string;
  user_id: string;
  event_id: string;
  rating: number;
  review_text: string;
  status: ReviewStatus;
  created_at: Date;
}

export interface ReviewReplySeedRecord {
  id: string;
  review_id: string;
  organizer_id: string;
  reply_text: string;
  created_at: Date;
}

const event11ReviewBase = addHours(eventById.event_11.end_datetime, 14);
const event12ReviewBase = addHours(eventById.event_12.end_datetime, 12);

export const reviews: ReviewSeedRecord[] = [
  {
    id: 'review_001',
    user_id: attendeeUserIds[0],
    event_id: 'event_11',
    rating: 5,
    review_text: 'Excellent speaker lineup and practical breakout sessions. I left with actionable playbooks.',
    status: 'visible',
    created_at: addHours(event11ReviewBase, 2)
  },
  {
    id: 'review_002',
    user_id: attendeeUserIds[1],
    event_id: 'event_11',
    rating: 4,
    review_text: 'Great networking quality. Schedule could have included a longer Q&A segment.',
    status: 'visible',
    created_at: addHours(event11ReviewBase, 4)
  },
  {
    id: 'review_003',
    user_id: attendeeUserIds[2],
    event_id: 'event_11',
    rating: 3,
    review_text: 'Solid event with good logistics, but one workshop started late.',
    status: 'visible',
    created_at: addHours(event11ReviewBase, 6)
  },
  {
    id: 'review_004',
    user_id: attendeeUserIds[3],
    event_id: 'event_11',
    rating: 2,
    review_text: 'Topic quality was mixed. Venue audio in the second hall was weak.',
    status: 'hidden',
    created_at: addHours(event11ReviewBase, 8)
  },
  {
    id: 'review_005',
    user_id: attendeeUserIds[4],
    event_id: 'event_11',
    rating: 1,
    review_text: 'Registration queue was too long and one keynote was cancelled at short notice.',
    status: 'visible',
    created_at: addHours(event11ReviewBase, 10)
  },
  {
    id: 'review_006',
    user_id: attendeeUserIds[5],
    event_id: 'event_11',
    rating: 4,
    review_text: 'Mentor office hours were a highlight. Would attend the next edition.',
    status: 'visible',
    created_at: addHours(event11ReviewBase, 12)
  },
  {
    id: 'review_007',
    user_id: attendeeUserIds[6],
    event_id: 'event_12',
    rating: 5,
    review_text: 'Fantastic atmosphere. The mix of live music and founder networking worked very well.',
    status: 'visible',
    created_at: addHours(event12ReviewBase, 1)
  },
  {
    id: 'review_008',
    user_id: attendeeUserIds[7],
    event_id: 'event_12',
    rating: 4,
    review_text: 'Good crowd and smooth check-in flow. Food options could improve.',
    status: 'visible',
    created_at: addHours(event12ReviewBase, 3)
  },
  {
    id: 'review_009',
    user_id: attendeeUserIds[8],
    event_id: 'event_12',
    rating: 3,
    review_text: 'Enjoyable event overall, but venue seating became crowded toward peak hours.',
    status: 'pending',
    created_at: addHours(event12ReviewBase, 4)
  },
  {
    id: 'review_010',
    user_id: attendeeUserIds[9],
    event_id: 'event_12',
    rating: 2,
    review_text: 'Music quality was strong but the program started almost an hour late.',
    status: 'visible',
    created_at: addHours(event12ReviewBase, 5)
  },
  {
    id: 'review_011',
    user_id: attendeeUserIds[10],
    event_id: 'event_12',
    rating: 1,
    review_text: 'Could not find clear signage for session zones and rest areas.',
    status: 'visible',
    created_at: addHours(event12ReviewBase, 6)
  },
  {
    id: 'review_012',
    user_id: attendeeUserIds[11],
    event_id: 'event_12',
    rating: 4,
    review_text: 'Strong community vibe and useful conversations with local founders.',
    status: 'visible',
    created_at: addHours(event12ReviewBase, 8)
  }
];

const organizerByCompletedEvent: Record<string, string> = {
  event_11: organizerUserIds[2],
  event_12: organizerUserIds[3]
};

export const reviewReplies: ReviewReplySeedRecord[] = reviews
  .filter((review) => ['review_001', 'review_002', 'review_003', 'review_005', 'review_006', 'review_007', 'review_008', 'review_010', 'review_011', 'review_012'].includes(review.id))
  .map((review, index) => ({
    id: `review_reply_${String(index + 1).padStart(3, '0')}`,
    review_id: review.id,
    organizer_id: organizerByCompletedEvent[review.event_id],
    reply_text:
      review.rating >= 4
        ? 'Thank you for attending and for sharing thoughtful feedback. We are glad the session value came through.'
        : 'Thank you for the honest feedback. We have documented this and are adjusting operations for the next edition.',
    created_at: addHours(review.created_at, 18)
  }));
