import { InfoPageTemplate } from "./InfoPageTemplate";

export function PrivacyPage() {
  return (
    <InfoPageTemplate
      title="Privacy Policy"
      subtitle="How DEMS handles and protects user data."
      sections={[
        {
          heading: "Data We Collect",
          body: "We collect essential profile, event, and transaction data needed to operate the platform.",
        },
        {
          heading: "How We Use Data",
          body: "Data is used to provide platform features, improve services, and support account security.",
        },
        {
          heading: "Data Protection",
          body: "We apply access controls and operational safeguards to protect user information.",
        },
      ]}
    />
  );
}
