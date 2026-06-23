# GuardianLink First Responder App

The **GuardianLink First Responder App** is a fast, lightweight, mobile-optimized console designed specifically for first responders (police, EMS, fire, and care facility staff) to access life-saving emergency medical details in under 5 seconds.

During a wandering/elopement incident, a responder can scan a wearable tracker or enter the device's unique serial number to view the patient's critical health alerts, medication dependencies, and caregiver contact information instantly.

---

## Key Design Principles

1. **🚨 Extreme High-Contrast & Readability**: Designed for high-stress situations. Features large bold text, dark layouts, and vivid colored cards (such as flashing red alert indicators for conditions, yellow for medications, and amber for allergies).
2. **📞 Instant Contact Linkage**: Click-to-call phone linkages let responders phone parents or caregivers directly with a single tap.
3. **🛰️ GPS/Location Transmission**: Simulates transmitting the wearable's current GPS telemetry back to the caregiver network.
4. **🔒 Secure Access & Safety Auditing**: Informative banners remind responders that access is legally monitored and registered with the caregiver's log for total safety and operational auditing.

---

## Features

- **⚡ Instant Serial Lookup**: Connects with active tracker records via alphanumeric key validation.
- **🚨 Top-Priority Medical Condition Alerts**: Critical medical conditions (like Autism, Alzheimer's, or Non-Verbal status) are highlighted in a prominent high-contrast Red Card.
- **💊 Detailed Medication & Allergy Cards**: Highlights critical daily medication schedules and allergen warnings.
- **⚙️ Dual Operation Modes**:
  - **Demo Mode**: Read mock patient records from local sandbox storage (shares simulation profiles created in the caregiver portal).
  - **Live Backend Mode**: Makes real authenticated REST requests to the Express backend on port `3001` using pre-shared secure API keys.

---

## Technical Stack & Configuration

- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS v4
- **Production Build Folder**: `dist/`

---

## Development & Build Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
