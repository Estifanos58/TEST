import { InfoPageTemplate } from "./InfoPageTemplate";

export function HelpPage() {
  return (
    <InfoPageTemplate
      title="Help Center"
      subtitle="Quick guidance for common actions on DEMS."
      sections={[
        {
          heading: "Booking Tickets",
          body: "Go to Discover, choose an event, and complete checkout to receive your digital ticket.",
        },
        {
          heading: "Organizer Onboarding",
          body: "Sign up as organizer, submit required information, and wait for approval before publishing events.",
        },
        {
          heading: "Payment Support",
          body: "If payment verification is delayed, contact support with your transaction reference.",
        },
      ]}
    />
  );
}
