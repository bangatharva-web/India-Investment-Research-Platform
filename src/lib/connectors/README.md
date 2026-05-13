# Data connectors

This folder is for live data ingestion modules.

Planned connectors:
- `nse.ts` — NSE company filings, announcements, financial results, shareholding data
- `bse.ts` — BSE corporate announcements and filings
- `sebi.ts` — SEBI/regulatory disclosures where relevant
- `companyIr.ts` — annual reports, investor presentations, official IR pages
- `marketData.ts` — price history from approved market data provider

Rule: every extracted data point must include source name, source URL, filing/report date, and extraction timestamp.
