import type { MetadataRoute } from "next";

import { SITE_URL } from "@/shared/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }];
}
