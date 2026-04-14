import { InfoPageTemplate } from "./InfoPageTemplate";

export function FaqPage() {
  return (
    <InfoPageTemplate
      title="Frequently Asked Questions"
      subtitle="Answers to the most common questions from attendees and organizers."
      sections={[
        {
          heading: "How do I get my ticket?",
          body: "After successful payment, your ticket is available in My Tickets.",
        },
        {
          heading: "Why is my event pending?",
          body: "New organizer events remain pending until required platform fee and admin confirmation are completed.",
        },
        {
          heading: "Can I request support?",
          body: "Yes. Use the Contact page and include your account email and transaction/event details.",
        },
      ]}
    />
  );
}
