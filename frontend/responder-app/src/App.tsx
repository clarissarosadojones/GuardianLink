import React, { useState, useEffect } from "react";

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface PatientProfile {
  id: string;
  name: string;
  photo: string; // Base64 or placeholder URL
  conditions: string;
  medications: string;
  allergies: string;
  emergency_contacts?: EmergencyContact[]; // Handle backend key format
  contacts?: EmergencyContact[]; // Handle mock format
  trackerSerial?: string;
  notes?: string;
}

export default function App() {
  const [serialInput, setSerialInput] = useState("");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings / Demo state
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [apiUrl, setApiUrl] = useState("http://localhost:3001");
  const [responderKey, setResponderKey] = useState("gl_responder_default_key_123");
  const [showSettings, setShowSettings] = useState(false);
  
  // GPS simulation state
  const [gpsSimulated, setGpsSimulated] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: 40.7128, lng: -74.0060 });
  const [gpsLogging, setGpsLogging] = useState(false);

  useEffect(() => {
    const savedDemo = localStorage.getItem("guardianlink_demo_mode");
    const savedApiUrl = localStorage.getItem("guardianlink_api_url");
    const savedKey = localStorage.getItem("guardianlink_responder_key");

    if (savedDemo !== null) {
      setIsDemoMode(savedDemo === "true");
    }
    if (savedApiUrl) {
      setApiUrl(savedApiUrl);
    }
    if (savedKey) {
      setResponderKey(savedKey);
    }
  }, []);

  const handleToggleDemo = () => {
    const next = !isDemoMode;
    setIsDemoMode(next);
    localStorage.setItem("guardianlink_demo_mode", String(next));
    setProfile(null);
    setError(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("guardianlink_api_url", apiUrl);
    localStorage.setItem("guardianlink_responder_key", responderKey);
    setShowSettings(false);
    alert("Responder configuration saved successfully.");
  };

  const handleLookup = async (serial: string) => {
    const targetSerial = serial.trim().toUpperCase();
    if (!targetSerial) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    setGpsSimulated(false);

    if (isDemoMode) {
      // Simulate Lookup using LocalStorage shared with caregiver portal
      setTimeout(() => {
        try {
          const savedProfilesRaw = localStorage.getItem("guardianlink_profiles");
          if (!savedProfilesRaw) {
            setError("No caregiver profiles exist in browser storage. Please register profiles in the Caregiver Dashboard first.");
            setLoading(false);
            return;
          }

          const savedProfiles: PatientProfile[] = JSON.parse(savedProfilesRaw);
          const matched = savedProfiles.find(
            (p: any) => (p.trackerSerial || "").trim().toUpperCase() === targetSerial
          );

          if (matched) {
            setProfile(matched);
            // Simulate random GPS coordinates for the responder
            setGpsCoordinates({
              lat: 40.7128 + (Math.random() - 0.5) * 0.05,
              lng: -74.0060 + (Math.random() - 0.5) * 0.05,
            });
          } else {
            setError(`No matched emergency profile found for tracker serial "${targetSerial}". Make sure it is paired in the Caregiver Dashboard.`);
          }
        } catch (err: any) {
          setError("Failed to query localized simulator: " + err.message);
        } finally {
          setLoading(false);
        }
      }, 600);
    } else {
      // Live Backend API Mode
      try {
        const response = await fetch(`${apiUrl}/api/patients/by-device/${targetSerial}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${responderKey}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Device serial "${targetSerial}" is not registered or paired with an active profile.`);
          } else if (response.status === 401) {
            throw new Error("Invalid Responder API key. Please check settings.");
          } else {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || `Server returned error status ${response.status}`);
          }
        }

        const data = await response.json();
        setProfile(data.patient);
        setGpsCoordinates({
          lat: 40.7128 + (Math.random() - 0.5) * 0.02,
          lng: -74.0060 + (Math.random() - 0.5) * 0.02,
        });
      } catch (err: any) {
        setError(err.message || "Failed to connect to Live API. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSimulateGPS = () => {
    setGpsLogging(true);
    setTimeout(() => {
      setGpsLogging(false);
      setGpsSimulated(true);
    }, 1200);
  };

  // Extract contact array safely considering format differences
  const getContacts = (p: PatientProfile) => {
    return p.emergency_contacts || p.contacts || [];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* High Contrast Header Navbar */}
      <header className="bg-slate-900 border-b-2 border-red-600 sticky top-0 z-40 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="bg-red-600 text-white font-extrabold px-2.5 py-1 rounded text-lg tracking-wider border-2 border-white">
              GL FIRST RESPONDER
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleDemo}
              className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition-colors shadow border ${
                isDemoMode
                  ? "bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400"
                  : "bg-teal-600 text-white border-teal-700 hover:bg-teal-50"
              }`}
            >
              {isDemoMode ? "⚠️ Sim Mode" : "⚡ Live API"}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-slate-300 border border-slate-700"
              title="Configure API/Keys"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Main Responder Container */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Settings Dialog Overlay */}
        {showSettings && (
          <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-5 mb-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-teal-400 my-0">First Responder configuration</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Backend Server Address</label>
                <input
                  type="text"
                  required
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pre-shared Responder API Key</label>
                <input
                  type="password"
                  required
                  value={responderKey}
                  onChange={(e) => setResponderKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-100 font-mono text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded text-xs font-bold"
                >
                  Save Config
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Input Panel / Serial Scanner */}
        {!profile && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-xl mx-auto my-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white my-0">LOOKUP EMERGENCY PROFILE</h2>
              <p className="text-slate-400 text-sm">
                Enter the alphanumeric serial number located on the back of the GuardianLink wearable tracker.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-red-500 tracking-widest mb-1.5">
                  Tracker Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. GL-1049-X"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup(serialInput);
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-red-600 rounded-xl px-4 py-4 text-center font-mono text-2xl text-white tracking-widest outline-none uppercase"
                />
              </div>

              <button
                disabled={loading || !serialInput.trim()}
                onClick={() => handleLookup(serialInput)}
                className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-800 disabled:text-slate-500 py-4 rounded-xl text-lg font-black uppercase tracking-wider transition-colors shadow-lg border-2 border-red-500"
              >
                {loading ? "SEARCHING REGISTRY..." : "CONNECT TO TRACKER"}
              </button>
            </div>

            {/* Quick Simulation Selectors */}
            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider text-center mb-3">
                Simulator Sandbox - Quick Scans
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSerialInput("GL-1049-X");
                    handleLookup("GL-1049-X");
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg py-2.5 px-3 text-left text-xs space-y-0.5"
                >
                  <p className="font-mono font-bold text-amber-400 text-center">GL-1049-X</p>
                  <p className="text-slate-400 text-[10px] text-center">Benjamin (Autism)</p>
                </button>
                <button
                  onClick={() => {
                    setSerialInput("GL-8820-A");
                    handleLookup("GL-8820-A");
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg py-2.5 px-3 text-left text-xs space-y-0.5"
                >
                  <p className="font-mono font-bold text-amber-400 text-center">GL-8820-A</p>
                  <p className="text-slate-400 text-[10px] text-center">Clara (Dementia)</p>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border-2 border-red-900 rounded-xl p-4 text-sm text-red-300 leading-relaxed text-center font-semibold">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* Emergency Medical Profile Loaded State */}
        {profile && (
          <div className="space-y-6">
            {/* Top Action / Back Nav Block */}
            <div className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setProfile(null);
                  setError(null);
                }}
                className="text-slate-300 hover:text-white text-sm font-bold flex items-center space-x-1"
              >
                <span>←</span> <span>Look Up Another</span>
              </button>

              <div className="text-xs text-red-500 font-black animate-pulse flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                <span>AUDIT SECURED ACCESS LOGGED</span>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-600 bg-slate-950 flex-shrink-0">
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to silhouette if image fails to load
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200";
                  }}
                />
              </div>

              <div className="text-center md:text-left space-y-2 flex-grow">
                <span className="bg-red-600 text-white text-[11px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                  Active Patient Record
                </span>
                <h1 className="text-3xl font-black tracking-tight text-white my-0">{profile.name}</h1>
                <p className="text-sm font-mono text-slate-400">
                  Tracker Serial: <span className="text-red-500 font-bold">{serialInput || "GL-MOCK-ID"}</span>
                </p>
              </div>

              {/* Transmission panel */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 w-full md:w-auto text-center space-y-1.5 flex-shrink-0">
                <p className="text-[10px] font-black uppercase text-slate-400">GPS Tracker Link</p>
                <p className="text-xs font-mono text-teal-400 font-bold">
                  {gpsCoordinates.lat.toFixed(5)}, {gpsCoordinates.lng.toFixed(5)}
                </p>
                <button
                  onClick={handleSimulateGPS}
                  disabled={gpsLogging || gpsSimulated}
                  className={`w-full py-1.5 px-3 rounded text-xs font-black uppercase transition-colors ${
                    gpsSimulated
                      ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-500 text-white"
                  }`}
                >
                  {gpsLogging ? "TRANSMITTING..." : gpsSimulated ? "✅ COORDINATES SENT" : "📡 TRANSMIT GPS"}
                </button>
              </div>
            </div>

            {/* CRITICAL MEDICAL CONDITIONS - RED CARD (TOP PRIORITY) */}
            <div className="bg-red-950/30 border-4 border-red-600 rounded-2xl shadow-xl p-6 space-y-3">
              <div className="flex items-center space-x-2 text-red-500">
                <span className="text-2.5xl">🚨</span>
                <h2 className="text-xl font-black uppercase tracking-wider my-0">Critical Medical Conditions</h2>
              </div>
              <p className="text-lg md:text-xl font-bold text-white leading-relaxed whitespace-pre-line bg-red-950/50 p-4 rounded-xl border border-red-900/60">
                {profile.conditions || "No conditions reported."}
              </p>
            </div>

            {/* Grid for Medications & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Medications Card */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="flex items-center space-x-2 text-amber-500 border-b border-slate-800 pb-3">
                  <span className="text-xl">💊</span>
                  <h3 className="text-md font-black uppercase tracking-wider my-0">Medications & Dosages</h3>
                </div>
                <p className="text-sm md:text-base text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  {profile.medications || "No medications listed."}
                </p>
              </div>

              {/* Allergies Card */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="flex items-center space-x-2 text-orange-500 border-b border-slate-800 pb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-md font-black uppercase tracking-wider my-0">Allergies & Sensitivities</h3>
                </div>
                <p className="text-sm md:text-base text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  {profile.allergies || "No allergies listed."}
                </p>
              </div>

            </div>

            {/* Authorized Caregiver Contacts */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center space-x-2 text-teal-400 border-b border-slate-800 pb-3">
                <span className="text-xl">👤</span>
                <h3 className="text-md font-black uppercase tracking-wider my-0">Authorized Caregivers & Contacts</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getContacts(profile).length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-2">No contact contacts registered.</p>
                ) : (
                  getContacts(profile).map((contact, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-black text-white leading-tight">{contact.name}</p>
                        <p className="text-xs text-teal-500 font-bold uppercase tracking-wider mt-0.5">{contact.relationship}</p>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg border border-red-500 shadow-md flex items-center space-x-1.5"
                      >
                        <span>📞</span> <span>CALL NOW</span>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Additional Safety Notes */}
            {profile.notes && (
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest my-0">Special Handling Instructions</h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  {profile.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* High Contrast Informative Footer */}
      <footer className="mt-20 border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 GuardianLink Inc. Ratified under Owner Business Strategy Revision 1. All Rights Reserved.</p>
        <p className="mt-1">For Authorization, Legal, or Device support issues, contact firstresponder@guardianlink.com.</p>
      </footer>
    </div>
  );
}
