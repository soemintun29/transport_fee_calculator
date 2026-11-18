# Midea Transport + Service Charge Calculator

Standalone application for home-service **transport** fees (Yangon / Mandalay) and **service / diagnosis** charges from the official matrix.

## Features
- **Transport:** Region → Township → Ward → map pin, OSRM driving distance.
- **Service charge:** Product category → sub-category → **multiple** service types.
- **Toggle:** Service fee (default) or Diagnosis fee.
- **CAC:** Separate commercial layout (repair group → job → series → capacity). Add several jobs.
- Pricing from `data/20260728_Service Charges.xlsx` (standard sheet **20261001**, CAC sheet **CAC**).

## Setup
1. `npm install`
2. `npm run dev`

To rebuild prices after a workbook change:

`python scripts/build_service_pricing.py`

## Data Sources
- MIMU Admin Level 5 (Wards) for spatial fallbacks.
- OpenStreetMap for base mapping.
- VSK service charge workbook (28 Jul 2026 file, Oct 2026 price tab).
