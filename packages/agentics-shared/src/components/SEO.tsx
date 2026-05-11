import { Helmet } from "react-helmet-async";

export interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  siteUrl?: string;
  siteName?: string;
  defaultDescription?: string;
}

export default function SEO({
  title,
  description,
  path = "",
  noindex = false,
  siteUrl = "https://agentics.org",
  siteName = "Agentics",
  defaultDescription = "Agentics — AI-native software solutions.",
}: SeoProps) {
  const resolvedDesc = description ?? defaultDescription;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const url = `${siteUrl}${path}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
