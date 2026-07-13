# Pricing

Market anchors (2026):

- NationBuilder Starter ~$34/mo · Pro ~$160/mo  
- Action Network roughly $15–$125+/mo by volume  
- Meetup organizers ~$15–$50/mo for a single group  

Katalyst bundles more infrastructure (files, meetings, PM, identity, edge), so tiers sit slightly under NationBuilder Pro at mid-market while staying accessible for local races.

| Plan | Monthly | Annual | Audience |
|------|---------|--------|----------|
| **S — Local** | **$49** | $490 | School board, DSA chapter, neighborhood |
| **M — District** | **$129** | $1,290 | City council, state house, 50501 hubs |
| **L — Statewide / Federal** | **$349** | $3,490 | Congressional, statewide, multi-chapter |

Defaults:

- Trial: 14 days on S  
- Annual: ~2 months free  
- Stripe: stubbed behind flags for localhost  

Limits are defined in `@katalyst/config` (`plans` object) and enforced lightly in the billing overview UI.
