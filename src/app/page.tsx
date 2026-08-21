import { HomePage } from "@/_pages/home";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/shared/config";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: ["듀웍스", "duworks.kr"],
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  inLanguage: "ko-KR",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomePage />
    </>
  );
}
