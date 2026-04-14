export interface EventCategorySeedRecord {
  id: string;
  name: string;
  slug: string;
}

export const categories: EventCategorySeedRecord[] = [
  { id: 'cat_technology', name: 'Technology', slug: 'technology' },
  { id: 'cat_music', name: 'Music', slug: 'music' },
  { id: 'cat_business', name: 'Business', slug: 'business' },
  { id: 'cat_education', name: 'Education', slug: 'education' },
  { id: 'cat_health', name: 'Health', slug: 'health' },
  { id: 'cat_networking', name: 'Networking', slug: 'networking' },
  { id: 'cat_startup', name: 'Startup', slug: 'startup' },
  { id: 'cat_workshop', name: 'Workshop', slug: 'workshop' },
  { id: 'cat_festival', name: 'Festival', slug: 'festival' },
  { id: 'cat_conference', name: 'Conference', slug: 'conference' }
];
