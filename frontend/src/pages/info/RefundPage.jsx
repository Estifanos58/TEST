import { InfoPageTemplate } from "./InfoPageTemplate";

export function RefundPage() {
  return (
    <InfoPageTemplate
      title="Refund Policy"
      subtitle="Refund handling rules for tickets purchased through DEMS."
      sections={[
        {
          heading: "Organizer-Defined Rules",
          body: "Refund eligibility depends on event organizer policies and timing before event start.",
        },
        {
          heading: "Cancelled Events",
          body: "If an event is cancelled, affected users may be eligible for refund processing.",
        },
        {
          heading: "Support for Disputes",
          body: "Contact support with your order reference if you need help reviewing a refund case.",
        },
      ]}
    />
  );
}
