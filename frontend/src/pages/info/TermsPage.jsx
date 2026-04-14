import { InfoPageTemplate } from "./InfoPageTemplate";

export function TermsPage() {
  return (
    <InfoPageTemplate
      title="Terms of Service"
      subtitle="Basic usage terms for DEMS platform users."
      sections={[
        {
          heading: "Account Responsibility",
          body: "Users are responsible for account security and accurate information.",
        },
        {
          heading: "Event Listings",
          body: "Organizers must publish truthful event details and comply with applicable laws.",
        },
        {
          heading: "Payments",
          body: "Platform fees and ticket payments are processed through supported payment channels.",
        },
      ]}
    />
  );
}
