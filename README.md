# Midea Transport Charge Calculator

Standalone application for calculating home service transportation fees in Yangon and Mandalay.

## Features
- **Form-First Workflow:** Structured address entry (Region -> Township -> Ward -> Details).
- **Automated Geocoding:** Integration with OpenStreetMap Nominatim.
- **Real-Time Routing:** OSRM-based driving distance calculation.
- **Map Fallback:** Draggable pin for manual location adjustment.
- **Dynamic Fees:** Configurable base fee and per-km rates.

## Setup
1. `npm install`
2. `npm run dev`

## Data Sources
- MIMU Admin Level 5 (Wards) for spatial fallbacks.
- OpenStreetMap for base mapping.
