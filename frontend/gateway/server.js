const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// 1. API proxy route: Forward /api/* requests to localhost:3001 (stripping the /api prefix)
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Strip /api from the beginning of the request path
  },
}));

// Define absolute paths for the built frontends
const CAREGIVER_DIST = path.join(__dirname, '..', 'caregiver-app', 'dist');
const RESPONDER_DIST = path.join(__dirname, '..', 'responder-app', 'dist');

// 2. Serve Caregiver Dashboard static assets
app.use('/caregiver', express.static(CAREGIVER_DIST));

// SPA Fallback for Caregiver App: serve index.html for any remaining routes under /caregiver
app.use('/caregiver', (req, res) => {
  res.sendFile(path.join(CAREGIVER_DIST, 'index.html'));
});

// 3. Serve First Responder App static assets
app.use('/responder', express.static(RESPONDER_DIST));

// SPA Fallback for Responder App: serve index.html for any remaining routes under /responder
app.use('/responder', (req, res) => {
  res.sendFile(path.join(RESPONDER_DIST, 'index.html'));
});

// 4. Serve a landing page at `/` to let users choose between Caregiver or First Responder apps
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GuardianLink Platform Gateway</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        body {
          background-color: #020617;
        }
      </style>
    </head>
    <body class="min-h-screen flex flex-col justify-between text-slate-100">
      <main class="max-w-4xl mx-auto px-6 py-16 flex-grow flex flex-col justify-center items-center text-center space-y-12">
        <div class="space-y-4">
          <span class="bg-red-600 text-white font-extrabold px-3.5 py-1.5 rounded-md text-sm tracking-widest border border-white uppercase shadow-md">
            GuardianLink System Gateway
          </span>
          <h1 class="text-4xl md:text-5xl font-black tracking-tight text-white mt-4">
            Protecting Loved Ones, Empowering First Responders
          </h1>
          <p class="text-slate-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            GuardianLink pairs secure medical profiles with wearable trackers that only first responders can scan to view critical details instantly in emergencies.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl pt-4">
          <!-- Caregiver Portal -->
          <div class="bg-slate-900 border-2 border-slate-800 hover:border-teal-500 rounded-2xl p-8 flex flex-col justify-between text-left transition-all hover:shadow-2xl shadow-lg space-y-6">
            <div class="space-y-3">
              <span class="text-4xl">👤</span>
              <h2 class="text-2xl font-extrabold text-white">Caregiver Dashboard</h2>
              <p class="text-sm text-slate-400 leading-relaxed">
                Register loved ones, fill medical details, pair/replace trackers, view activation logs, and manage account preferences securely.
              </p>
            </div>
            <a href="/caregiver/" class="bg-teal-600 hover:bg-teal-500 text-white text-center font-bold py-3.5 px-6 rounded-xl transition-all shadow-md">
              Launch Caregiver Dashboard →
            </a>
          </div>

          <!-- First Responder App -->
          <div class="bg-slate-900 border-2 border-slate-800 hover:border-red-600 rounded-2xl p-8 flex flex-col justify-between text-left transition-all hover:shadow-2xl shadow-lg space-y-6">
            <div class="space-y-3">
              <span class="text-4xl">🚨</span>
              <h2 class="text-2xl font-extrabold text-white">First Responder App</h2>
              <p class="text-sm text-slate-400 leading-relaxed">
                Connect to wearables during wandering incidents. High-contrast, stress-optimized mobile lookup of critical conditions, medications, and emergency contacts.
              </p>
            </div>
            <a href="/responder/" class="bg-red-600 hover:bg-red-500 text-white text-center font-bold py-3.5 px-6 rounded-xl transition-all shadow-md">
              Launch Responder Console →
            </a>
          </div>
        </div>

        <div class="pt-6">
          <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            ⚡ Platform Status: <span class="text-emerald-500">All Systems Operational</span>
          </p>
        </div>
      </main>

      <footer class="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500 w-full">
        <p>© 2026 GuardianLink Inc. Ratified under Owner Business Strategy Revision 1. All Rights Reserved.</p>
        <p class="mt-1">Serving public requests under Single-Origin Port 3000.</p>
      </footer>
    </body>
    </html>
  `);
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`GuardianLink Gateway is running publicly at http://0.0.0.0:${PORT}`);
  console.log(`Caregiver Dashboard path: http://localhost:${PORT}/caregiver/`);
  console.log(`Responder App path: http://localhost:${PORT}/responder/`);
});
