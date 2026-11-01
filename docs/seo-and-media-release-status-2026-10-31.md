# Mateshwari Travellers — image and search readiness (31 October 2026)

## Changes on review branch (not published)

- Fleet selection cards: consistent crop, restrained contrast/saturation lift, declared display dimensions and descriptive model-specific alt text.
- Kia Carens selection cover: now a front-facing Indian-spec 2022 Carens Luxury Plus reference (Kannada DriveSpark, CC BY 3.0), with original image page in catalog metadata. Source: https://commons.wikimedia.org/wiki/File:2022_Kia_Carens_1.4_Luxury_Plus_(India)_front_view_01.jpg . Variant remains a reference, not proof of an assigned Mateshwari vehicle.
- Gallery source attribution: configured author/source/license is included on matching cover photographs.
- Search: HTML title, robots and social preview metadata, basic Organization JSON-LD with published contact methods, public robots.txt, reserved exclusions for administrative and API paths.

## Outstanding before publication

1. **Ten-car photo audit**: individually visually inspect downloaded images, check source/rights and detect/redact registration plates; replace weak or wrongly matched model/trim photos. Avoid copying Google Images/third-party editorial photos without explicit commercial reuse rights. Current branch still uses several Commons-linked photographs and local assets; no claim that all images have passed full privacy review.
2. **Real website URL**: verify canonical HTTPS production domain, then add exact canonical tags, full absolute open-graph URLs, sitemap.xml and robots.txt Sitemap entry. Do not invent a domain.
3. **Indexing after launch**: production site must be publicly accessible and serve pages/content to crawlers; verify Google Search Console property, submit sitemap, inspect home and service URLs; monitor coverage and Core Web Vitals. Code commits cannot guarantee search indexing or search rankings.
4. **Local business structured data**: provide and independently verify physical trading location, opening hours and business identity before using LocalBusiness fields or maps. No invented office/address, ratings, reviews or Google Business Profile.
5. **Actual-device QA**: physical iPhone Safari and Android Chrome, with gallery layout, image loading, contact actions, quotation flow, keyboard and accessible controls.

## Release

No merge, deployment or live CRM writes authorized. All changes are staged on feature/mateshwari-cinematic-crm. Technical CI and actual-device/customer content approval are separate gates.
