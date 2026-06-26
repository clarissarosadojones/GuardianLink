# GuardianLink Frontend Platform & Gateway Server

Welcome to the frontend deployment repository of **GuardianLink**. 

Under owner-ratified Business Strategy Revision 1, our system publishes **one single web platform on Port 3000** bound to all interfaces (`0.0.0.0`). This directory hosts our unified single-origin gateway, serving two independent mobile-responsive applications side-by-side:

1. **Caregiver Dashboard (`/caregiver/`)** — An interactive administrative dashboard for caregivers and families.
2. **First Responder App (`/responder/`)** — A mobile-first, high-contrast console for emergency profile lookups.
3. **API Routing Proxy (`/api/*`)** — Automatically forwards authenticated calls to our Express backend API.

---

## Architecture Overview

```
                           +--------------------------------------+
                           |  Public Browser Access (Port 3000)   |
                           +------------------+-------------------+
                                              |
                                              v
                           +------------------+-------------------+
                           |  Platform Gateway Server (server.js) |
                           +---------+----------------+-----------+
                                     |                |
                +--------------------+                +-------------------+
                |                                                         |
                v                                                         v
  +-------------+---------------+                           +-------------+---------------+
  |  Caregiver Dashboard App    |                           |    First Responder App     |
  |  Path: /caregiver/          |                           |    Path: /responder/        |
  |  Build: /caregiver-app/dist |                           |    Build: /responder-app/dist|
  +-----------------------------+                           +-----------------------------+
                                              |
                                              | (Reverse Proxy via http-proxy-middleware)
                                              v
                           +------------------+-------------------+
                           |      Express Backend API (Port 3001) |
                           +--------------------------------------+
```

---

## Directory Structure

```
/home/team/shared/frontend/
├── caregiver-app/          # Caregiver Dashboard source (React + TypeScript + Vite)
├── responder-app/          # First Responder App source (React + TypeScript + Vite)
├── gateway/                # Unified single-origin production server (Port 3000)
│   ├── server.js           # Express gateway and reverse proxy script
│   └── package.json        # Dependencies (Express & http-proxy-middleware)
└── README.md               # Main architecture documentation (this file)
```

---

## How to Run & Deploy the Platform

To deploy the entire GuardianLink frontend platform in your workspace, follow these simple steps:

### Step 1: Compile the Applications
Make sure both apps are compiled to their respective `dist/` directories:
```bash
# Build the Caregiver Dashboard
cd /home/team/shared/frontend/caregiver-app
npm install && npm run build

# Build the First Responder App
cd /home/team/shared/frontend/responder-app
npm install && npm run build
```

### Step 2: Ensure the Backend is Running
The gateway expects the Express backend API to be running locally on port `3001`:
```bash
cd /home/team/shared/backend
npm install && npm start
```

### Step 3: Start the Gateway Server
Start the gateway server in the background so it survives shell disconnection:
```bash
cd /home/team/shared/frontend/gateway
npm install
nohup node server.js > /tmp/gateway.log 2>&1 &
```

Once started, the gateway is publicly live at:
- **Landing Gateway**: `http://localhost:3000/`
- **Caregiver Dashboard**: `http://localhost:3000/caregiver/`
- **First Responder App**: `http://localhost:3000/responder/`
- **Secure Backend Access**: `http://localhost:3000/api/health`
