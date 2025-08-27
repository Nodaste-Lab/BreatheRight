# PRD V2

Created by: Ana Steele
Created time: August 20, 2025 12:36 PM
Category: Proposal
Last edited by: Aaron Nichols
Last updated time: August 26, 2025 12:27 PM


# BreathRight PRD V2

BreathRight - Mobile-First Air Quality Management

## 1. TL;DR

BreathRight is a mobile-first B2C application delivering real-time AQI and pollen data alerts, to support health-conscious parents, outdoor enthusiasts, and smart home users.

The app provides neighborhood-level air quality insights, predictive health alerts, and actionable recommendations to help high-risk populations make informed decisions about outdoor activities and health management. 

Unlike existing apps, BreathRight combines health-focused recommendations with delightful kawaii characters that make complex environmental data accessible and engaging for families, and serves up that information real-time using proactive alerts that are configured based on risk thresholds. 

## 2. Differentiation

- Hyper-local AQI and pollen data **vs. general area readings**
    - Trust driven by data accuracy
    - Improved recommendations
    - AQI and pollen data in relationship to where users work, go to school, and play verses general readings that do not adequately account
- Push Alerting **vs. pull consumption where a user has to go to a site or app to get up to date information**
    - User customizable alerting based on:
        - AQI threshold changes
        - Pre-configured geographic areas based on profile
- Usability **vs. too technical, cluttered and hard to use**
    - Simple, intuitive, and visual digestible information that doesn’t require a science degree to understand
- Multiple profiles supported within a single account **vs. general AQI for only one location at a time with user intervention required to navigate to a new geographic area for AQI data**
    - I work in one zip code, my child goes to school in another and I want to be aware of both areas risk level from an AQI perspective to proactively adjust our behaviors

## 3. Goals

### Business Goals

- Achieve 38% trial-to-paid conversion rate within 12 months
- Generate $5-15/month subscription revenue from 10,000+ active users
- Establish market position as the premium consumer air quality management platform
- Build sustainable recurring revenue model with 85%+ monthly retention

### User Goals

- Receive air quality alerts that are
    - timely
    - actionable
    - based on hyper-local (neighborhood sensors vs generalized area level data city level data)
- Make informed outdoor activity decisions
    - bring medication (e.g. rescue inhaler)
    - adjust an activity to time with a lower risk prediction
- Access intuitive, delightful interface that simplifies complex environmental data
- Manage multiple profiles for myself and member(s) of my family

### Out of Scope

- Enterprise or B2B air quality monitoring solutions
- Indoor air quality hardware integration (initial phase)
- Social networking or community features (initial phase)
- Weather forecasting beyond air quality metrics
- Medical diagnosis or treatment recommendations

## 3. User Sketch

**Health-Conscious Parents** 

**(Emma, 34)**: "As a parent of asthmatic children, I need real-time school zone air quality alerts so I can adjust pick-up plans and medication schedules before pollution spikes affect my kids."

**Outdoor Enthusiasts** 

**(Marcus, 28)**: "As a runner and cyclist, I need hourly air quality forecasts with activity-specific recommendations so I can optimize my training schedule around clean air windows."

**Smart Home Adopters** 

**(Sarah, 42)**: "As a tech-savvy homeowner, I need automated air quality integration with my existing smart home ecosystem so my HVAC system responds to pollution levels without manual intervention."

## 4. Functional requirements

### Data Sources & Technical Specifications

- Primary AQI data: Google Maps Platform
    
    [APIs and Data Sources Report](./docs/specs/api-research.md)
    
- Pollen data: Google Maps Platform
- Performance targets: <2 second load times, <5MB monthly data usage
- Offline storage: 72-hour cache with 24-hour refresh cycles
- Platform support: iOS 14+ and Android 10+ with feature parity

### MVP - first market distribution

- Home area for quick at a glance information:
    - Mobile-optimized interface with iOS-style cards and dark theme (#17202b background)
    - A single location including defaulted into the home area prior to profile set-up
        - Real-time AQI display with kawaii character reactions and color-coded health levels
            - Color-coded Kawaii character system: 5 emotional states (happy, concerned, worried, alert, masked) with corresponding animations and health messages
        - Pollen count reading with icon related to risk level
        - Lightening risk with icon related to risk level
    - Including the timestamp and data source of the reading data when any icon is clicked on
    - Offline fallback with connection status indicators for each reading type
- On initial load offer a walk through tutorial of the icons, their meaning, how to change locations, and how to set up a multi-location profile and adjust push notifications
- Basic push notifications with daily summary alerts based on default location, until profile location is completed in set-up
- Profile Set-Up
    - Name the primary profile
        - Prompt to complete health concerns section of the profile
            - Multi-select
                - Asthma
                - Allergies
                - Other health concerns
        - Add up to 3 locations this profile wants to track in the home area
            - Each location in the set-up should be enabled by a search based on google maps
            - Each location can be named by the user for quick reference (e.g. soccer practice)
            - Each location in the profile should have an option to include it in the home area, and in the once daily push notification

**Measurement of MVP - first market distribution** 

- Conversion - app downloads from paid advertising
- Profile set-up
    - Configure and name a location for tracking on home area
- Enable basic push notifications
- Measure DAU to indicate usage
- Build a “Coming Soon” premium features view in the app with a “notify me when available” CTA to measure willingness to pay

**Considerations for MVP** 

- Ability for home area to visualize a single default location on first opening the newly installed app
- Ability once profile is configure to show up to 3 locations for a single profile in the home area
- Once daily push notification with the daily AQI forecast for a single location, up to 3 locations depending on the profile set-up
- Defining what the profile is and does inside the app

**Considerations for Tiers**

- Pay at install $2.99, with first 30 days free, cancel anytime
    - Default enable your location services to get the basic AQI and pollen data fed to you in a home area in the app
    - Default scheduled notifcations
- 
- 

$2.99 Tier 

unlimited 

scheduled push notifications - 1 x day (digest of all locations) 

Flow 

type an address in set up

prompted to name it - “Tommy’s Soccer Field” 