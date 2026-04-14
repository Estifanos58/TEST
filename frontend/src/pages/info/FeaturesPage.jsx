import { InfoPageTemplate } from "./InfoPageTemplate";

export function FeaturesPage() {
  return (
    <InfoPageTemplate
      title="Features"
      subtitle="Everything you need to run events and book tickets with confidence."
      sections={[
        {
          heading: "Organizer Tools",
          body: "Create events, manage staff, monitor analytics, and control payouts from one dashboard.",
        },
        {
          heading: "Attendee Experience",
          body: "Discover events, secure checkout, and access digital tickets quickly from your account.",
        },
        {
          heading: "Platform Safety",
          body: "Verified events, moderation workflows, and payment tracking to help protect users.",
        },
      ]}
    />
  );
}
