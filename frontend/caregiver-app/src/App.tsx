import React, { useState, useEffect } from "react";

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface ActivationEvent {
  id: string;
  timestamp: string;
  location: string;
  responderId: string;
}

interface PatientProfile {
  id: string;
  name: string;
  photo: string; // Base64 or placeholder url
  conditions: string;
  medications: string;
  allergies: string;
  contacts: EmergencyContact[];
  trackerSerial: string;
  activations: ActivationEvent[];
}

// Initial Mock Data
const MOCK_PROFILES: PatientProfile[] = [
  {
    id: "p1",
    name: "Benjamin Smith",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
    conditions: "Autism Spectrum Disorder (ASD), non-verbal, sensitive to loud noises.",
    medications: "None.",
    allergies: "Peanuts, Gluten.",
    contacts: [
      { name: "Sarah Smith", relationship: "Mother", phone: "555-0199" },
      { name: "David Smith", relationship: "Father", phone: "555-0198" }
    ],
    trackerSerial: "GL-1049-X",
    activations: [
      { id: "a1", timestamp: "2026-06-17 14:32:10 PST", location: "Central Park Entrance, NY", responderId: "Badge #FR-882" }
    ]
  },
  {
    id: "p2",
    name: "Clara Jenkins",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200&h=200",
    conditions: "Dementia (Moderate stage), easily disoriented, answers to 'Nanna'.",
    medications: "Aricept (Donepezil) 10mg daily at night.",
    allergies: "Penicillin.",
    contacts: [
      { name: "Robert Jenkins", relationship: "Son / Primary Caregiver", phone: "555-0144" }
    ],
    trackerSerial: "GL-8820-A",
    activations: []
  }
];

export default function App() {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [apiUrl, setApiUrl] = useState<string>("http://localhost:3001");
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Form States
  const [formName, setFormName] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formConditions, setFormConditions] = useState("");
  const [formMedications, setFormMedications] = useState("");
  const [formAllergies, setFormAllergies] = useState("");
  const [formContacts, setFormContacts] = useState<EmergencyContact[]>([{ name: "", relationship: "", phone: "" }]);
  const [formTrackerSerial, setFormTrackerSerial] = useState("");

  // Load Initial Data from localStorage or fallback
  useEffect(() => {
    const saved = localStorage.getItem("guardianlink_profiles");
    const demoSetting = localStorage.getItem("guardianlink_demo_mode");
    const savedApiUrl = localStorage.getItem("guardianlink_api_url");

    if (saved) {
      setProfiles(JSON.parse(saved));
    } else {
      setProfiles(MOCK_PROFILES);
      localStorage.setItem("guardianlink_profiles", JSON.stringify(MOCK_PROFILES));
    }

    if (demoSetting !== null) {
      setIsDemoMode(demoSetting === "true");
    }

    if (savedApiUrl) {
      setApiUrl(savedApiUrl);
    }
  }, []);

  // Save changes helper
  const saveProfiles = (newProfiles: PatientProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem("guardianlink_profiles", JSON.stringify(newProfiles));
    
    // In real mode, we would also post to backend
    if (!isDemoMode) {
      fetch(`${apiUrl}/api/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfiles)
      }).catch(err => console.error("API sync error:", err));
    }
  };

  const handleToggleDemo = () => {
    const newMode = !isDemoMode;
    setIsDemoMode(newMode);
    localStorage.setItem("guardianlink_demo_mode", String(newMode));
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("guardianlink_api_url", apiUrl);
    alert("API URL configured!");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;

  // Open forms
  const startAddProfile = () => {
    setFormName("");
    setFormPhoto("");
    setFormConditions("");
    setFormMedications("");
    setFormAllergies("");
    setFormContacts([{ name: "", relationship: "", phone: "" }]);
    setFormTrackerSerial("");
    setIsAddingProfile(true);
  };

  const startEditProfile = (profile: PatientProfile) => {
    setFormName(profile.name);
    setFormPhoto(profile.photo);
    setFormConditions(profile.conditions);
    setFormMedications(profile.medications);
    setFormAllergies(profile.allergies);
    setFormContacts(profile.contacts.length > 0 ? [...profile.contacts] : [{ name: "", relationship: "", phone: "" }]);
    setFormTrackerSerial(profile.trackerSerial);
    setIsEditingProfile(true);
  };

  const handleAddContactField = () => {
    setFormContacts([...formContacts, { name: "", relationship: "", phone: "" }]);
  };

  const handleRemoveContactField = (index: number) => {
    const next = [...formContacts];
    next.splice(index, 1);
    setFormContacts(next);
  };

  const handleContactChange = (index: number, field: keyof EmergencyContact, val: string) => {
    const next = [...formContacts];
    next[index][field] = val;
    setFormContacts(next);
  };

  const submitAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newProfile: PatientProfile = {
      id: "p_" + Date.now(),
      name: formName,
      photo: formPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
      conditions: formConditions,
      medications: formMedications,
      allergies: formAllergies,
      contacts: formContacts.filter(c => c.name.trim() !== ""),
      trackerSerial: formTrackerSerial.trim(),
      activations: []
    };

    const next = [...profiles, newProfile];
    saveProfiles(next);
    setSelectedProfileId(newProfile.id);
    setIsAddingProfile(false);
  };

  const submitEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !formName.trim()) return;

    const next = profiles.map(p => {
      if (p.id === selectedProfileId) {
        return {
          ...p,
          name: formName,
          photo: formPhoto,
          conditions: formConditions,
          medications: formMedications,
          allergies: formAllergies,
          contacts: formContacts.filter(c => c.name.trim() !== ""),
          trackerSerial: formTrackerSerial.trim()
        };
      }
      return p;
    });

    saveProfiles(next);
    setIsEditingProfile(false);
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm("Are you sure you want to delete this profile? This cannot be undone.")) {
      const next = profiles.filter(p => p.id !== id);
      saveProfiles(next);
      if (selectedProfileId === id) setSelectedProfileId(null);
    }
  };

  // Pairing actions
  const handlePairTracker = (profileId: string, serial: string) => {
    const next = profiles.map(p => {
      if (p.id === profileId) {
        return { ...p, trackerSerial: serial.trim() };
      }
      return p;
    });
    saveProfiles(next);
  };

  const handleUnpairTracker = (profileId: string) => {
    const next = profiles.map(p => {
      if (p.id === profileId) {
        return { ...p, trackerSerial: "" };
      }
      return p;
    });
    saveProfiles(next);
  };

  // Simulation
  const simulateScan = (profile: PatientProfile) => {
    if (!profile.trackerSerial) {
      alert("Please pair a tracker serial first to simulate scans!");
      return;
    }
    
    const timestamp = new Date().toLocaleString() + " PST";
    const locations = [
      "Central Avenue near Library",
      "St. Jude Care Center Entrance",
      "Maple Street & 4th Blvd",
      "Metro Station Platform 3",
      "Riverwalk East Pathway"
    ];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomBadge = `First Responder Badge #${Math.floor(100 + Math.random() * 900)}`;

    const newActivation: ActivationEvent = {
      id: "act_" + Date.now(),
      timestamp,
      location: randomLocation,
      responderId: randomBadge
    };

    const next = profiles.map(p => {
      if (p.id === profile.id) {
        return {
          ...p,
          activations: [newActivation, ...p.activations]
        };
      }
      return p;
    });

    saveProfiles(next);
    alert(`Success: Simulated first responder scan of tracker [${profile.trackerSerial}]! A live alert has been added to their Activation History.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Top Header navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-500 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xl tracking-wider shadow-inner">
              GL
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight my-0 text-white">
                GuardianLink <span className="text-teal-400 font-medium text-sm align-super">Caregiver Portal</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Demo mode badge */}
            <button
              onClick={handleToggleDemo}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm border ${
                isDemoMode
                  ? "bg-amber-100/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/10"
                  : "bg-teal-500/15 text-teal-300 border-teal-500/40 hover:bg-teal-500/10"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-amber-400 animate-pulse" : "bg-teal-400"}`}></span>
              <span>{isDemoMode ? "Demo Mode (Mock)" : "Live API Mode"}</span>
            </button>

            <span className="text-sm text-slate-300 hidden sm:inline">Hello, Sarah Smith</span>
            <div className="w-9 h-9 rounded-full bg-teal-500 text-slate-900 font-bold flex items-center justify-center border-2 border-white shadow">
              SS
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* Settings/API configuration block */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Developer & Integration Settings</h2>
            <p className="text-xs text-gray-500">
              Set your backend API endpoints here to pair with local databases. Toggling Demo Mode bypasses the API to use offline browser storage.
            </p>
          </div>
          <form onSubmit={handleSaveApiUrl} className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64"
            />
            <button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors">
              Save API
            </button>
          </form>
        </div>

        {/* Two-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Loved Ones Profile list */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 my-0">Registered Profiles</h2>
              <button
                onClick={startAddProfile}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <span>+</span> <span>New Profile</span>
              </button>
            </div>

            {profiles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm mb-4">No active profiles registered yet.</p>
                <button
                  onClick={startAddProfile}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Create Your First Profile
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map(profile => {
                  const hasTracker = !!profile.trackerSerial;
                  return (
                    <div
                      key={profile.id}
                      onClick={() => setSelectedProfileId(profile.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between ${
                        selectedProfileId === profile.id
                          ? "border-teal-500 ring-2 ring-teal-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={profile.photo}
                          alt={profile.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 text-sm truncate">{profile.name}</h3>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {hasTracker ? (
                              <span className="bg-teal-50 text-teal-700 text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide flex items-center border border-teal-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1 animate-pulse"></span>
                                {profile.trackerSerial}
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide flex items-center border border-rose-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1"></span>
                                Unpaired
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-[10px] text-gray-400">
                          {profile.activations.length} Scans
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {profile.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Profile Detail view / Forms */}
          <div className="lg:col-span-8">
            {isAddingProfile ? (
              /* Add Profile Form Card */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 my-0">Register New Loved One</h2>
                  <button onClick={() => setIsAddingProfile(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
                <form onSubmit={submitAddProfile} className="space-y-6">
                  {/* Photo upload and basic info row */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {formPhoto ? (
                          <img src={formPhoto} alt="Upload preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-2">No Photo Selected</span>
                        )}
                      </div>
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-gray-300 cursor-pointer font-semibold transition-colors">
                        Choose Photo
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tracker Device Serial Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g., GL-2094-Z"
                          value={formTrackerSerial}
                          onChange={(e) => setFormTrackerSerial(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-mono uppercase"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Found on back of the physical wearable. Can pair/change later.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Medical Conditions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2">Emergency Medical Info</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Medical Conditions</label>
                        <textarea
                          placeholder="Autism, Dementia, Non-verbal status..."
                          value={formConditions}
                          onChange={(e) => setFormConditions(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Current Medications</label>
                        <textarea
                          placeholder="Aspirin 81mg, daily insulin..."
                          value={formMedications}
                          onChange={(e) => setFormMedications(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Allergies & Sensitivities</label>
                        <textarea
                          placeholder="Peanuts, latex, loud sirens..."
                          value={formAllergies}
                          onChange={(e) => setFormAllergies(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Emergency Contacts */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2">Emergency Contact Contacts</h3>
                      <button
                        type="button"
                        onClick={handleAddContactField}
                        className="text-teal-600 hover:text-teal-700 text-xs font-bold"
                      >
                        + Add Contact
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formContacts.map((contact, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Sarah Smith"
                            required
                            value={contact.name}
                            onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Relationship (e.g. Mother)"
                            value={contact.relationship}
                            onChange={(e) => handleContactChange(idx, "relationship", e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                          <input
                            type="tel"
                            placeholder="555-0100"
                            required
                            value={contact.phone}
                            onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                          {formContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContactField(idx)}
                              className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingProfile(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    >
                      Create Profile
                    </button>
                  </div>
                </form>
              </div>
            ) : isEditingProfile && selectedProfile ? (
              /* Edit Profile Form Card */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 my-0">Edit Profile: {selectedProfile.name}</h2>
                  <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
                <form onSubmit={submitEditProfile} className="space-y-6">
                  {/* Photo upload and basic info row */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {formPhoto ? (
                          <img src={formPhoto} alt="Upload preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-2">No Photo Selected</span>
                        )}
                      </div>
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-gray-300 cursor-pointer font-semibold transition-colors">
                        Choose Photo
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tracker Device Serial Number</label>
                        <input
                          type="text"
                          placeholder="e.g., GL-2094-Z"
                          value={formTrackerSerial}
                          onChange={(e) => setFormTrackerSerial(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-mono uppercase"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">To change tracker serials, just update it here.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Medical Conditions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2">Emergency Medical Info</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Medical Conditions</label>
                        <textarea
                          placeholder="Autism, Dementia, Non-verbal status..."
                          value={formConditions}
                          onChange={(e) => setFormConditions(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Current Medications</label>
                        <textarea
                          placeholder="Aspirin 81mg, daily insulin..."
                          value={formMedications}
                          onChange={(e) => setFormMedications(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Allergies & Sensitivities</label>
                        <textarea
                          placeholder="Peanuts, latex, loud sirens..."
                          value={formAllergies}
                          onChange={(e) => setFormAllergies(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Emergency Contacts */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2">Emergency Contacts</h3>
                      <button
                        type="button"
                        onClick={handleAddContactField}
                        className="text-teal-600 hover:text-teal-700 text-xs font-bold"
                      >
                        + Add Contact
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formContacts.map((contact, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Sarah Smith"
                            required
                            value={contact.name}
                            onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Relationship"
                            value={contact.relationship}
                            onChange={(e) => handleContactChange(idx, "relationship", e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                          <input
                            type="tel"
                            placeholder="555-0100"
                            required
                            value={contact.phone}
                            onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                          />
                          {formContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContactField(idx)}
                              className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedProfile ? (
              /* Profile Detail Viewer Card */
              <div className="space-y-6">
                
                {/* Header Information Box */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedProfile.photo}
                      alt={selectedProfile.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-slate-100"
                    />
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-800 my-0">{selectedProfile.name}</h2>
                      <div className="flex flex-wrap gap-2 items-center mt-2">
                        {selectedProfile.trackerSerial ? (
                          <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-teal-200">
                            <span className="w-2 h-2 rounded-full bg-teal-500 mr-1.5 animate-pulse"></span>
                            Tracker Connected: {selectedProfile.trackerSerial}
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                            No Wearable Connected
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono bg-slate-50 border border-slate-100 rounded px-2 py-0.5">ID: {selectedProfile.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                      onClick={() => simulateScan(selectedProfile)}
                      className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <span>⚡</span> <span>Simulate Tap Scan</span>
                    </button>
                    <button
                      onClick={() => startEditProfile(selectedProfile)}
                      className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg border border-gray-300 transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(selectedProfile.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-2.5 rounded-lg border border-rose-200 transition-colors flex items-center justify-center"
                      title="Delete Profile"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Grid of Medical & Emergency Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left sub-column: Critical Medical Data */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2 my-0">Critical Emergency Info</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-1.5">Known Medical Conditions</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedProfile.conditions || "None declared."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Current Active Medications</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedProfile.medications || "None declared."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100/50">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">Allergies & Sensitivities</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedProfile.allergies || "None declared."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right sub-column: Contact Contacts & Pair replacement section */}
                  <div className="space-y-6">
                    
                    {/* Emergency Contacts Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2 my-0">Authorized Emergency Contacts</h3>
                      
                      <div className="space-y-3">
                        {selectedProfile.contacts.map((contact, i) => (
                          <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{contact.name}</p>
                              <p className="text-xs text-gray-500">{contact.relationship}</p>
                            </div>
                            <a
                              href={`tel:${contact.phone}`}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-teal-200/50 flex items-center space-x-1"
                            >
                              <span>📞</span> <span>{contact.phone}</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracker Device Management card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2 my-0">GuardianLink Tracker Hub</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        The physical tracker acts like a lost debit card. If lost, easily unpair it below and pair a new discounted replacement device — keeping the loved one's medical history secure on this profile.
                      </p>
                      
                      {selectedProfile.trackerSerial ? (
                        <div className="flex flex-col space-y-2">
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400">PAIRED DEVICE</p>
                              <p className="text-sm font-bold font-mono text-slate-800 uppercase">{selectedProfile.trackerSerial}</p>
                            </div>
                            <button
                              onClick={() => handleUnpairTracker(selectedProfile.id)}
                              className="text-red-500 hover:text-red-600 text-xs font-semibold"
                            >
                              Unpair Device
                            </button>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-slate-500">
                            <span>Lost tracker?</span>
                            <button
                              onClick={() => {
                                const newSerial = prompt("Enter replacement GuardianLink tracker serial number:");
                                if (newSerial) handlePairTracker(selectedProfile.id, newSerial);
                              }}
                              className="text-teal-600 hover:text-teal-700 font-bold"
                            >
                              Replace Device
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => {
                              const newSerial = prompt("Enter GuardianLink tracker serial number to pair:");
                              if (newSerial) handlePairTracker(selectedProfile.id, newSerial);
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-2.5 rounded-xl shadow-sm transition-colors"
                          >
                            Pair Device Tracker Now
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Activations History Log */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase border-l-4 border-teal-500 pl-2 my-0">First Responder Activation History</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This log registers every instance a first responder has tapped or queried this loved one's wearable device. All access timestamps are stored securely.
                  </p>

                  {selectedProfile.activations.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 border border-dashed border-gray-200 rounded-xl">
                      <p className="text-xs text-slate-400">No emergency activations recorded. Device is secure.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                      {selectedProfile.activations.map(act => (
                        <div key={act.id} className="py-3 flex justify-between items-center gap-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-lg mt-0.5">🚨</span>
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">EMERGENCY ACCESS DETECTED</p>
                              <p className="text-xs text-slate-500">{act.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{act.timestamp}</p>
                            <p className="text-xs font-mono font-bold text-teal-600">{act.responderId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* No selected profile default card */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="bg-teal-50 text-teal-600 p-4 rounded-full text-3xl mb-4 shadow-inner">
                  👤
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1 my-0">Welcome to GuardianLink Portal</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Select a registered family member profile on the left side to pair trackers, view emergency medical configurations, and inspect activation logs.
                </p>
                <button
                  onClick={startAddProfile}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition-colors"
                >
                  Create New Profile
                </button>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-8 text-center text-xs text-slate-400">
        <p>© 2026 GuardianLink Inc. Ratified under Owner Business Strategy Revision 1. All Rights Reserved.</p>
        <p className="mt-1">Designed with privacy-first standards for first responder tracking integration.</p>
      </footer>
    </div>
  );
}
