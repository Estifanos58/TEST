import { InfoPageTemplate } from "./InfoPageTemplate";

export function ContactPage() {
  return (
    <InfoPageTemplate
      title="Contact Us"
      subtitle="Need help or have a partnership idea? We are here to assist."
      sections={[
        {
          heading: "Customer Support",
          body: "Email us at support@dems.com for account, ticket, or payment questions.",
        },
        {
          heading: "Phone",
          body: "Call +25982310974 during business hours for urgent support cases.",
        },
        {
          heading: "Office",
          body: "Addis Ababa, Ethiopia.",
        },
      ]}
    />
  );
}
