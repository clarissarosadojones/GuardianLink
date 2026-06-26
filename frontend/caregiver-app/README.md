# GuardianLink Caregiver Dashboard

The **GuardianLink Caregiver Dashboard** is a secure, state-of-the-art administrative portal designed for parents and caregivers of special needs children and elderly adults with dementia or Alzheimer's.

It provides a central location to manage account credentials, register patient profiles, add essential emergency medical information, pair secure wearable trackers, and track active responder lookups.

---

## Features

- **🔐 Robust Caregiver Authentication**: Register, log in, and securely manage your workspace.
- **👤 Interactive Patient Registry**: Complete profile management with support for high-contrast photo upload representation, name, date of birth, and notes.
- **🚨 Essential Emergency Details**: Add and update critical medical conditions, daily medications + dosages, and dangerous allergies.
- **📱 Quick Contact Hot-lines**: Configure priority contact lists with relationships and click-to-call phone linkages.
- **🛰️ Wearable Pair & Replace Flow**: Pair serial-numbered GuardianLink trackers instantly. In case of lost devices, caregivers can trigger the **Lost Card/Tracker Replacement Flow** to pair a new tracker while keeping the patient profile intact.
- **📡 Simulated First Responder Activation History**: View access logs indicating when first responders scanned or looked up a loved one's profile, including agency and access timestamps.
- **🛠️ Offline Simulator / Hybrid Mode**: Includes a configurable settings overlay to toggle between high-fidelity **Demo Mode** (localStorage-based) and **Live API Backend Mode** on port `3001`!

---

## Technical Stack & Configuration

- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS v4 for fully responsive layouts
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
*(The production build compiles assets into the `dist/` directory, optimized for light memory footprints).*
