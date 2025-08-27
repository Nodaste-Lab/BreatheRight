# APIs and Data Sources Report

Created by: Ben Ogren
Created time: August 22, 2025 8:13 AM
Category: Tech Research
Last edited by: Ben Ogren
Last updated time: August 22, 2025 8:35 AM

# Air Quality & Pollen API Comparison for US Market

## Air Quality APIs for US Market

| API Provider | US Coverage | Resolution | Update Frequency | Free Tier | Paid Pricing | Key US Features | US-Specific Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **EPA AirNow** ⭐ | **Nationwide** | Station-based (~10km) | Hourly | **Free** (500/hour) | N/A | • Official EPA data<br>• 2,000+ US stations<br>• Health guidance<br>• Wildfire smoke<br>• School flag program | • Station gaps in rural areas<br>• No hyperlocal data |
| **PurpleAir** ⭐ | **Excellent** (15,000+ US sensors) | <100m | Every 2 minutes | 1M points/month | ~$0.001-0.005/point | • Dense US network<br>• Community-driven<br>• Real-time alerts<br>• Indoor sensors<br>• Research grade | • Requires EPA calibration<br>• Sensor reliability varies |
| **Google Air Quality** | All 50 states | 500m x 500m | Hourly | $200/month credit | $0.006/request | • Street-level accuracy<br>• Google Maps native<br>• US health standards<br>• Wildfire tracking | • Complex Google Cloud setup<br>• Costs add up quickly |
| **IQAir AirVisual** | Major US cities | City/station level | Real-time | 10,000 calls/month | $75-500/month | • US AQI standard<br>• City rankings<br>• Health recommendations<br>• Weather integration | • Limited rural coverage<br>• City-level only |
| **OpenWeatherMap** | Nationwide | 1km x 1km | Hourly | 1M calls/month | $0.0012/call | • Already in your PRD<br>• Weather bundled<br>• Simple integration<br>• Good documentation | • Basic AQI only<br>• No US-specific features |
| **Tomorrow.io** | Nationwide | 1km x 1km | Every 15 min | 500 calls/day | $99+/month | • US-based company<br>• NOAA integration<br>• Route optimization<br>• Severe weather alerts | • Weather-focused product<br>• Limited AQI detail |
| **Ambee** | US coverage | Hyperlocal | Every 30 min | 100 calls/day | $99/month | • Wildfire data<br>• Hyperlocal accuracy<br>• Activity recommendations<br>• Historical data | • Very limited free tier<br>• India-based support |

## Pollen APIs for US Market

| API Provider | US Coverage | Resolution | Pollen Types | Free Tier | Paid Pricing | Key US Features | US-Specific Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Google Pollen API** ⭐ | **All 50 states** | 1km x 1km | 15 US species | Pay-per-use | $0.005/request | • US allergen focus<br>• Ragweed tracking<br>• Regional species<br>• 5-day forecasts | • No free tier<br>• Pay-per-request only |
| **Ambee Pollen** | Nationwide | **500m x 500m** | US allergens | 100 calls/day | $99/month | • Highest resolution<br>• Seasonal patterns<br>• US species focus<br>• Risk levels | • Small free tier<br>• Foreign company |
| **Tomorrow.io** | Select US regions | 1km x 1km | Basic (3 types) | 500 calls/day | Bundled w/ weather | • US company<br>• Weather correlation<br>• Simple API<br>• Unified billing | • Limited pollen detail<br>• Not nationwide yet |
| **Pollen.com API** | US only | ZIP code level | US-specific | Limited/Partner | Contact for pricing | • US allergen experts<br>• Allergist network<br>• Treatment tips<br>• 5-day forecast | • Partnership required<br>• ZIP-level only |

## US-Specific Data Sources

| Data Type | Provider | Coverage | Cost | Key Advantage |
| --- | --- | --- | --- | --- |
| **Official AQI** | EPA AirNow | Nationwide | Free | Government authority |
| **Hyperlocal** | PurpleAir | 15,000+ sensors | Freemium | 2-minute updates |
| **School Locations** | NCES | 130,000+ schools | Free | Official ED.gov data |
| **Wildfire Smoke** | AirNow Fire & Smoke Map | Real-time | Free | USFS partnership |
| **State/Local** | State DEQ APIs | Varies by state | Usually free | Local compliance |

## Recommended US Market Strategy

### Phase 1: MVP (Free Tier Focus)

```
Air Quality:
- Primary: EPA AirNow (official, free, trusted)
- Enhancement: PurpleAir free tier (hyperlocal)
- Backup: OpenWeatherMap (1M free calls)

Pollen:
- Skip initially or use Ambee free tier (100 calls/day)

Cost: $0/month

```

### Phase 2: Growth (10K users)

```
Air Quality:
- Primary: PurpleAir API (hyperlocal precision)
- Official: EPA AirNow (trust factor)
- Weather: OpenWeatherMap (bundled data)

Pollen:
- Google Pollen API (pay-per-use, ~$50-200/month)

Cost: ~$100-300/month

```

### Phase 3: Premium (Revenue Generating)

```
Air Quality:
- Premium: Google Air Quality (street-level)
- Hyperlocal: PurpleAir (full access)
- Official: EPA AirNow (free backup)

Pollen:
- Primary: Google Pollen (comprehensive)
- Enhancement: Ambee (highest resolution)

Cost: ~$500-2000/month

```

## US Market Advantages

### Unique US Benefits:

1. **EPA Authority**: AirNow provides official government data that builds trust
2. **PurpleAir Density**: Highest sensor concentration globally is in US
3. **School Integration**: NCES provides comprehensive free school data
4. **Regulatory Alignment**: US AQI standards built into most APIs
5. **Wildfire Season**: Critical feature for Western states

### Implementation Tips for US Market:

- Always include EPA data for credibility ("EPA says...")
- Use PurpleAir for neighborhood-level precision
- Integrate wildfire smoke alerts (critical for West Coast)
- Support US AQI scale (0-500) not just "Good/Bad"
- Consider state-specific sources (California CARB, Texas TCEQ)
- Plan for seasonal patterns (wildfire summer, pollen spring)

### Cost Optimization for US Users:

- EPA AirNow is completely free and trusted
- PurpleAir's 1M free points = ~20,000 daily active users
- Cache by ZIP code to reduce redundant calls
- Many users cluster in major metros (optimize caching)
- State APIs often have higher rate limits than federal

---

# Comprehensive APIs and data sources for AirGuardian/BreathRight mobile app

Your mobile air quality management app has access to an extensive ecosystem of APIs covering all 10 required categories, with options ranging from free community-driven services to enterprise-grade commercial solutions. The research reveals over 50 distinct API providers with varying capabilities, coverage areas, and pricing models specifically suitable for mobile applications.

## Core air quality APIs offer diverse capabilities and pricing models

The air quality API landscape provides robust options for real-time monitoring, with **Google Air Quality API (Breezometer)** emerging as the premium choice offering 500m x 500m resolution globally, 96-hour forecasts, and seamless Google Maps integration at $200 monthly credit. For cost-conscious implementations, **World Air Quality Index (WAQI)** provides completely free access with no usage limits and 11,000+ monitoring stations worldwide, making it an excellent fallback option. **Ambee API** stands out for historical data access spanning 30+ years with hyperlocal accuracy, while **PurpleAir** offers the highest resolution through its 20,000+ community sensor network updating every 2 minutes at approximately $0.001-0.005 per point.

### Real-time AQI data coverage spans global to hyperlocal levels

**IQAir AirVisual API** covers 100+ countries with 10,000 monitoring stations, offering a generous free tier of 10,000 calls monthly and AI-powered data validation. **Tomorrow.io** distinguishes itself with weather-correlated air quality analysis updating every 15 minutes and route-based optimization features. **OpenWeatherMap**, while already mentioned in your PRD, offers exceptional value with up to 1 million free API calls monthly and integrated weather data, though its air quality historical data only extends back to November 2020.

For US-specific needs, **EPA AirNow API** provides official government data from 2,000+ monitoring stations with completely free access and 500 requests per hour, making it ideal for regulatory compliance and trusted data sources. The API updates hourly with forecasts for 300+ cities across North America.

## Health and environmental APIs enable personalized allergy management

**Google Pollen API** and **Ambee Pollen API** lead the pollen data category with dramatically different approaches. Google offers 1km resolution across 65+ countries with detailed plant species information and 5-day forecasts through its pay-as-you-go model. Ambee provides superior 500m resolution - the most granular available - covering 150+ countries with 14+ pollen sub-species and seasonal predictions. Both achieve 93%+ accuracy correlation with ground measurements.

### Hyperlocal air quality achieves sub-neighborhood precision

Community-driven networks provide unprecedented local granularity. **PurpleAir's sensor network** delivers real-time updates from 30,000+ individual sensors globally with less than 100m accuracy, updating every 40 seconds through their RESTful API. **Sensor Community** (formerly Luftdaten) maintains 34,000+ stations with strongest European coverage as a completely free service. University research networks like the University of North Texas's 99-station deployment offer research-grade precision for campus areas, though typically require partnership agreements.

Municipal sensor networks increasingly provide neighborhood-level data, with cities like Washington DC deploying PurpleAir networks accessible through standard APIs. IoT platforms including **ThingsBoard**, **Trackpac**, and **Attune** offer enterprise-grade monitoring with instant alerts and HVAC integration capabilities for indoor air quality management.

## Location services balance cost, accuracy, and mobile optimization

**Google Maps Platform** remains the gold standard with new March 2025 pricing offering 100,000 free monthly calls for Essential SKUs, though paid usage costs $7 per 1,000 map loads and $5 per 1,000 geocoding requests. Native mobile SDKs provide unlimited map loads with excellent caching capabilities. **Mapbox** presents a compelling alternative at $0.25 per Monthly Active User for mobile apps, with superior offline capabilities and customizable styling at 50,000 free map loads monthly.

**HERE Location Services** offers an impressive 250,000 free transactions monthly with $1 per 1,000 additional requests, particularly strong for European coverage. For budget-conscious development, **LocationIQ** provides 5,000 free daily requests using OpenStreetMap data, scaling to $0.03 per 1,000 requests on pro plans. **Radar.io** specializes in geofencing and location tracking, claiming 50-90% cost savings versus competitors with 100,000 free monthly tracked users.

### School location data combines official sources with commercial providers

The **National Center for Education Statistics (NCES)** provides comprehensive coverage of 100,000+ US public schools through free APIs with annual updates and JSON/CSV formats. **GreatSchools API** enhances this with 150,000+ schools including private and charter institutions, adding quality ratings through usage-based pricing requiring proper attribution. **Google Places API** offers real-time school information globally but at standard Places pricing of $17-32 per 1,000 requests.

State education departments provide additional granular data - the Urban Institute Education Data Portal aggregates multiple federal sources with RESTful APIs and programming language packages for easy integration.

## Integration APIs enable comprehensive ecosystem connectivity

### Strava fitness tracking requires careful OAuth implementation

Strava's OAuth 2.0 implementation uses 6-hour access tokens with refresh capabilities, requiring different flows for Android (Implicit Intent) versus iOS (SFAuthenticationSession). The API provides comprehensive activity data including GPS routes, performance metrics, and 50+ activity types with generous rate limits of 200 requests per 15 minutes and 2,000 daily. Real-time webhook support enables instant activity notifications without counting toward rate limits, crucial for correlating exercise with air quality exposure.

### Smart home platforms vary widely in complexity and capabilities

**IFTTT** offers the simplest integration path with webhook triggers accessible via `https://maker.ifttt.com/trigger/{event}/with/key/{webhooks_key}`, supporting real-time triggers within seconds and JSON payloads for complex data. **Google Home** integration faces commercial limitations as the Assistant SDK remains experimental-only, requiring App Actions for production mobile apps.

**Apple HomeKit** provides the most privacy-focused approach with end-to-end encryption and local processing, requiring MFi certification for commercial accessories but offering native iOS framework integration. **Samsung SmartThings** supports full Matter ecosystem integration with specialized APIs for device control, while **Philips Hue** requires HTTPS connections as of August 2024 with ~10 commands per second for individual lights and Server-Sent Events for real-time updates.

### Calendar integration offers native and cross-platform options

**Google Calendar API** provides 1 million queries daily with 100 queries per 100 seconds per user, supporting batch operations up to 1,000 items with comprehensive mobile SDKs. **Microsoft Graph API** enables Outlook Calendar access with 10,000 requests per 10 minutes per app, offering webhook support for real-time synchronization. **Apple EventKit** delivers the tightest iOS integration with automatic iCloud sync and new iOS 17+ write-only access options for enhanced privacy.

CalDAV protocol support enables generic calendar access across providers using RFC 4791 standards, though implementation complexity remains high with XML parsing requirements.

## Government and open data sources provide authoritative baselines

The **EPA ecosystem** offers multiple complementary services: AirNow for real-time data with 500 requests hourly, AQS for validated historical data back to the 1970s with 6+ month validation delays, and CASTNET for rural monitoring at 75+ locations. All provide free access with API keys and public domain licensing.

International sources expand coverage with the **European Environment Agency** providing EU-wide data through OGC-compliant APIs, **UK DEFRA** offering real-time monitoring back to 1973, and **Canadian AQHI** covering 122 locations with health-focused indices. **OpenAQ Platform** aggregates global government data through a unified API with extensive historical archives and excellent mobile-friendly documentation.

**NASA Earthdata** provides unique satellite-based measurements for areas without ground monitoring, offering near real-time data within 3 hours through LANCE APIs, though data formats (HDF5, NetCDF) require additional processing for mobile consumption.

## Implementation strategy optimizes cost, performance, and reliability

For production deployment, implement a **tiered API strategy**: use Google Air Quality API or Ambee as primary sources for accuracy and coverage, WAQI or EPA AirNow as free fallbacks, and PurpleAir for hyperlocal US precision. Cache results for 15-30 minutes to minimize API calls while maintaining data freshness. Implement exponential backoff for rate limit management and automatic token refresh for OAuth integrations.

Consider **hybrid approaches** combining free government sources for baseline data with commercial APIs for enhanced features like hyperlocal readings or advanced forecasts. For school data, leverage free NCES APIs supplemented by GreatSchools for quality ratings. Use native mobile SDKs where available (HomeKit, EventKit) for optimal performance, falling back to REST APIs for cross-platform compatibility.

Prioritize **webhook implementations** for real-time updates from Strava, smart home platforms, and calendar services to minimize battery drain from polling. Store all authentication tokens securely using platform-specific encryption, never in source code, and provide clear user controls for data access revocation in compliance with GDPR and privacy regulations.

## Mobile-specific considerations drive architecture decisions

Most APIs provide JSON responses ideal for mobile parsing, with rate limits generally accommodating typical app usage patterns. Implement intelligent caching strategies clustering users by location to minimize redundant API calls. For offline functionality, download and cache essential data during low-usage periods, particularly for frequently accessed locations.

Consider progressive data loading - fetch basic AQI first, then enhance with pollen counts, hyperlocal readings, and forecasts as needed. This approach optimizes initial app responsiveness while providing rich functionality for engaged users. Platform-specific considerations include using iOS background fetch judiciously given Apple's restrictions, and implementing Android's WorkManager for reliable background updates.

## Cost optimization through strategic API selection

Free tiers alone could support initial development and small-scale deployment: WAQI for unlimited air quality data, EPA AirNow for US coverage, 250,000 monthly HERE location requests, NCES school data, and government calendar APIs through EventKit/Google Calendar free tiers. As the app scales, transition to paid tiers strategically - Google Air Quality API for premium users, Ambee for advanced historical analysis, and usage-based pricing for location services.

Budget approximately $500-2,000 monthly for a production app with 10,000-50,000 active users, scaling with MAU-based pricing for mapping (Mapbox) and transaction-based costs for air quality APIs. Monitor usage patterns to identify optimization opportunities - perhaps certain regions rely more heavily on free government APIs while others require commercial providers for adequate coverage.