import SharedSEO, { type SeoProps } from "@shared/components/SEO";

const SITE = "https://retreat.agentics.org";
const DEFAULT_DESC = "Join the Agentics Summer Retreat at RockyCrest Resort, Ontario — September 2026.";
const SITE_NAME = "Agentics Summer Retreat 2026";

type Props = Omit<SeoProps, "siteUrl" | "siteName" | "defaultDescription">;

export default function SEO(props: Props) {
  return (
    <SharedSEO
      {...props}
      siteUrl={SITE}
      siteName={SITE_NAME}
      defaultDescription={DEFAULT_DESC}
    />
  );
}
