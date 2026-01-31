"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { createClient } from "@supabase/supabase-js";
import { 
  ExternalLink, Lock, Unlock, ChevronDown, ChevronUp, 
  Image as ImageIcon, Loader2, BookOpen, Coffee, X, Plus, Trash2, Layers, Upload, Sparkles, LogIn, LogOut
} from "lucide-react";
import { format } from "date-fns";
import "react-calendar/dist/Calendar.css";
import { parseScheduleAction, generateLinkTitleAction } from "./actions";

// ==========================================
// 1. CONFIGURATION (ILAGAY ANG API KEYS DITO)
// ==========================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. MASTER SCHEDULE (Based on Image + UAH)
// ==========================================
interface ScheduleSlot {
  id: string;
  isBreak?: boolean;
  time?: string;
  subject?: string;
  room?: string;
  color?: string;
}

interface LessonEntry {
  id?: string;
  date: string;
  slot_id: string;
  link?: string;
  notes?: string;
  images?: string[];
}

interface LinkItem {
  url: string;
  title: string;
}

interface ScheduleProfile {
  id: string;
  name: string;
  subtitle: string;
  schedule: Record<number, ScheduleSlot[]>;
}

const MAIN_SCHEDULE: Record<number, ScheduleSlot[]> = {
  1: [ // LUNES
    { id: 'mon_1', time: '08:00-08:55', subject: 'Geography & History', room: 'Aula C01 (Álvaro)', color: 'bg-blue-700' },
    { id: 'mon_2', time: '08:55-09:50', subject: 'VACANT / PREP', room: '', color: 'bg-slate-700' },
    { id: 'mon_3', time: '09:50-10:45', subject: 'Geography & History', room: 'Aula N15 (Álvaro)', color: 'bg-blue-700' },
    { id: 'break', isBreak: true },
    { id: 'mon_4', time: '11:10-12:05', subject: 'Inglés Avanzado', room: 'Aula C04 (Mamen)', color: 'bg-yellow-600 text-black' },
    { id: 'mon_5', time: '12:05-13:00', subject: 'Inglés Avanzado', room: 'Aula N03 (Florenta)', color: 'bg-yellow-600 text-black' },
    { id: 'mon_6', time: '13:00-13:55', subject: 'Inglés Avanzado', room: 'Aula C13 (Rocío)', color: 'bg-teal-600' },
  ],
  2: [ // MARTES
    { id: 'tue_1', time: '08:00-08:55', subject: 'Geography & History', room: 'Aula C14 (Álvaro)', color: 'bg-blue-700' },
    { id: 'tue_2', time: '08:55-09:50', subject: 'Geography & History', room: 'Aula N05 (Javier)', color: 'bg-green-700' },
    { id: 'tue_3', time: '09:50-10:45', subject: 'Reunión Bilingüe', room: '', color: 'bg-slate-200 text-black' },
    { id: 'break', isBreak: true },
    { id: 'tue_4', time: '11:10-12:05', subject: 'Inglés Avanzado', room: 'Aula N03 (Florenta)', color: 'bg-yellow-600 text-black' },
    { id: 'tue_5', time: '12:05-13:00', subject: 'Geography & History', room: 'Aula N01 (Javier)', color: 'bg-green-700' },
    { id: 'tue_6', time: '13:00-13:55', subject: 'Inglés', room: 'Aula C11 (Florenta)', color: 'bg-yellow-200 text-black' },
  ],
  3: [ // MIERCOLES
    { id: 'wed_1', time: '08:00-08:55', subject: 'Geography & History', room: 'Aula C12 (Javier)', color: 'bg-blue-700' },
    { id: 'wed_2', time: '08:55-09:50', subject: 'Inglés Avanzado', room: 'Aula N01 (Camelia)', color: 'bg-purple-700' },
    { id: 'wed_3', time: '09:50-10:45', subject: 'Inglés Avanzado', room: 'Aula N14 (Camelia)', color: 'bg-purple-700' },
    { id: 'break', isBreak: true },
    { id: 'wed_4', time: '11:10-12:05', subject: 'Inglés (Bach)', room: 'Modular 2 (Daniel)', color: 'bg-gray-400 text-black' },
    { id: 'wed_6', time: '13:00-13:55', subject: 'Inglés', room: 'Aula C11 (Florenta)', color: 'bg-yellow-200 text-black' },
  ],
  4: [ // JUEVES
    { id: 'thu_1', time: '08:00-08:55', subject: 'Inglés Avanzado', room: 'Aula N01 (Camelia)', color: 'bg-purple-700' },
    { id: 'thu_2', time: '08:55-09:50', subject: 'Inglés Avanzado', room: 'Aula C01 (Camelia)', color: 'bg-purple-700' },
    { id: 'thu_3', time: '09:50-10:45', subject: 'Reunión Coordinadora', room: '', color: 'bg-slate-200 text-black' },
  ],
  5: [ // FRIDAY (MASTERS)
    { id: 'fri_master', time: '15:30-20:30', subject: 'MASTER CLASS (UAH)', room: 'Universidad de Alcalá', color: 'bg-red-800 border-2 border-red-500' },
  ]
};

const ACADEMY_SCHEDULE: Record<number, ScheduleSlot[]> = {
  1: [ // MONDAY
    { id: 'aca_mon_1', time: '16:00-17:00', subject: 'Academy English', room: 'Room A', color: 'bg-indigo-600' },
    { id: 'aca_mon_2', time: '17:00-18:00', subject: 'Academy Speaking', room: 'Room B', color: 'bg-indigo-500' },
  ],
  3: [ // WEDNESDAY
    { id: 'aca_wed_1', time: '16:00-17:30', subject: 'Exam Prep', room: 'Room A', color: 'bg-violet-600' },
  ]
};

const SCHEDULE_PROFILES: ScheduleProfile[] = [
  {
    id: 'main',
    name: 'myLesson Hub',
    subtitle: 'IES Simone Veil • UAH',
    schedule: MAIN_SCHEDULE
  },
  {
    id: 'academy',
    name: 'Academy B',
    subtitle: 'Afternoon Classes',
    schedule: ACADEMY_SCHEDULE
  }
];

// Spain/Madrid Holidays
const HOLIDAYS: Record<string, string> = {
  "2026-01-01": "Año Nuevo", "2026-01-06": "Reyes",
  "2026-03-28": "Jueves Santo", "2026-03-29": "Viernes Santo",
  "2026-05-01": "Fiesta del Trabajo", "2026-05-02": "Comunidad de Madrid",
  "2026-05-15": "San Isidro", "2026-10-12": "Fiesta Nacional",
  "2026-11-01": "Todos los Santos", "2026-12-06": "Constitución",
  "2026-12-08": "Inmaculada", "2026-12-25": "Navidad"
};

export default function LessonArchive() {
  const [date, setDate] = useState<Date>(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<Record<string, LessonEntry>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<string>('main');
  const [profiles, setProfiles] = useState<ScheduleProfile[]>(SCHEDULE_PROFILES);
  const [isImporting, setIsImporting] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const dateKey = format(date, 'yyyy-MM-dd');
  const dayIndex = date.getDay();
  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0];
  const schedule = currentProfile.schedule[dayIndex] || [];
  const holidayName = HOLIDAYS[dateKey];

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Load Data
  useEffect(() => {
    if (!user) return; // Don't load if not logged in
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('lesson_plan').select('*').eq('date', dateKey);
        if (error) throw error;
        if (data) {
          const map: Record<string, LessonEntry> = {};
          data.forEach((item: LessonEntry) => {
            if (item.slot_id) map[item.slot_id] = item;
          });
          setEntries(map);
        } else {
          setEntries({}); // Clear entries if no data found for this user
        }
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
      }
      setLoading(false);
    }
    loadData();
  }, [dateKey, user]);

  // Save Data
  const saveData = async (slotId: string, updates: any) => {
    if (!user) return;
    try {
      setEntries(prev => ({ ...prev, [slotId]: { ...prev[slotId], ...updates } }));
      const { error } = await supabase.from('lesson_plan').upsert({
        user_id: user.id, // Important: Associate data with current user
        date: dateKey,
        slot_id: slotId,
        ...entries[slotId],
        ...updates
      }, { onConflict: 'user_id, date, slot_id' }); // Updated conflict target
      if (error) throw error;
    } catch (err) {
      console.error("Error saving to Supabase:", err);
    }
  };

  // Upload Image
  const handleUpload = async (slotId: string, file: File) => {
    if(!file || !user) return;
    const fileName = `${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from('lesson-gallery').upload(fileName, file);
    if(data) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/lesson-gallery/${fileName}`;
      const currentImages = entries[slotId]?.images || [];
      saveData(slotId, { images: [...currentImages, publicUrl] });
    }
  };

  // Helper to handle multiple links (JSON or single string)
  const getLinks = (str?: string): LinkItem[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map((item, i) => {
          if (typeof item === 'string') return { url: item, title: `Link ${i + 1}` };
          return { url: item.url, title: item.title || `Link ${i + 1}` };
        });
      }
      return [{ url: str, title: 'Link 1' }];
    } catch {
      return [{ url: str, title: 'Link 1' }];
    }
  };

  // Handle AI Schedule Import
  const handleImportSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const result = await parseScheduleAction(new FormData(e.target.form!));
    
    if (result.success && result.data) {
      const newProfile: ScheduleProfile = {
        id: `imported_${Date.now()}`,
        name: 'Imported Schedule',
        subtitle: 'AI Generated',
        schedule: result.data
      };
      
      setProfiles(prev => [...prev, newProfile]);
      setCurrentProfileId(newProfile.id);
      alert("Schedule imported successfully!");
    } else {
      alert(result.message || "Failed to import schedule.");
    }
    setIsImporting(false);
    e.target.value = ""; // Reset input
  };

  // ------------------------------------------
  // LANDING PAGE (If not logged in)
  // ------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <BookOpen size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">myLesson Hub</h1>
          <p className="text-slate-500 mb-8">Your personal lesson planning assistant. Organize schedules, links, and notes in one place.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          <p className="mt-6 text-xs text-slate-400">IES Simone Veil • UAH</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // MAIN APP (If logged in)
  // ------------------------------------------
  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-blue-200 selection:text-blue-900">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="shrink-0 p-4 border-b border-slate-200 bg-white/80 backdrop-blur z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Layers size={20} />
          </div>
          <div className="relative group">
            <button className="text-left flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-900">{currentProfile.name}</h1>
                <p className="text-[10px] text-slate-500 tracking-wider font-bold">{currentProfile.subtitle}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => setCurrentProfileId(profile.id)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${currentProfileId === profile.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
                >
                  <span>{profile.name}</span>
                  {currentProfileId === profile.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                </button>
              ))}
              
              {/* Import Button */}
              <div className="border-t border-slate-100 p-2">
                <form>
                  <label className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg cursor-pointer transition-colors ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImportSchedule} disabled={isImporting} />
                    {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isImporting ? "ANALYZING..." : "AI IMPORT SCHEDULE"}
                  </label>
                </form>
              </div>

            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-2 transition-all font-medium ${isAdmin ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isAdmin ? <Unlock size={14} /> : <Lock size={14} />} 
            {isAdmin ? 'ADMIN MODE' : 'VIEW ONLY'}
          </button>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 2. CALENDAR WIDGET (Left / Center) */}
        <div className={`transition-all duration-500 ease-in-out flex flex-col items-center p-6 overflow-y-auto bg-slate-50 ${isPanelOpen ? 'w-full md:w-1/3 justify-start pt-10' : 'w-full'}`}>
          <div className={`bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all w-full ${isPanelOpen ? 'max-w-full' : 'max-w-lg my-auto'}`}>
          <Calendar 
            onChange={(v) => {
              setDate(v as Date);
              setIsPanelOpen(true);
            }} 
            value={date}
            className="w-full bg-transparent border-none font-sans"
            tileClassName={({ date, view }) => {
              const dKey = format(date, 'yyyy-MM-dd');
              if(HOLIDAYS[dKey]) return 'text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-lg transition-colors';
              if(dKey === format(new Date(), 'yyyy-MM-dd')) return 'bg-blue-600 text-white rounded-md shadow-lg shadow-blue-500/30';
              return null;
            }}
            tileContent={({ date, view }) => {
              const dKey = format(date, 'yyyy-MM-dd');
              if (view === 'month' && HOLIDAYS[dKey]) {
                return (
                  <div className="w-full flex justify-center mt-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  </div>
                );
              }
              return null;
            }}
          />
          <p className="text-center text-slate-400 mt-8 text-sm font-medium animate-pulse">
            {isPanelOpen ? "Viewing schedule..." : "Select a date to view classes"}
          </p>
          </div>
        </div>

        {/* 3. CLASSES PANEL (Right) */}
        <div className={`bg-white border-l border-slate-200 shadow-xl transition-all duration-500 ease-in-out flex flex-col overflow-hidden absolute inset-0 z-50 md:static ${isPanelOpen ? 'translate-x-0 opacity-100 md:w-2/3' : 'translate-x-full opacity-0 md:w-0 md:translate-x-0'}`}>
          <div className="w-full h-full flex flex-col min-w-[320px]">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur shrink-0">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Schedule</span>
             <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
               <X size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
            <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}, {date.getDate()} de {date.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
            </h2>
            {holidayName ? (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                 🇪🇸 HOLIDAY: {holidayName}
              </span>
            ) : (
              <span className="text-slate-500 text-sm">Classes for today</span>
            )}
            </div>
            {loading && <Loader2 className="animate-spin text-blue-600" />}
            </div>

            <div className="space-y-4">
          {/* Empty State */}
          {schedule.length === 0 && !holidayName && (
             <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-400">
               <Coffee className="mx-auto mb-2 opacity-50" />
               <p>No classes found. Import a schedule to get started.</p>
             </div>
          )}

          {/* Cards Loop */}
          {schedule.map((slot: ScheduleSlot, idx: number) => {
            // Render Break
            if(slot.isBreak) return (
              <div key={idx} className="flex items-center gap-4 py-2 opacity-40">
                 <div className="h-px bg-slate-300 flex-1"></div>
                 <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Recreo</span>
                 <div className="h-px bg-slate-300 flex-1"></div>
              </div>
            );

            const data = entries[slot.id] || {};
            const isOpen = expanded === slot.id;

            return (
              <div key={slot.id} className={`group border transition-all duration-300 rounded-xl overflow-hidden ${isOpen ? 'bg-white border-blue-500 ring-1 ring-blue-500/20 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                
                {/* A. COMPACT VIEW (Head) */}
                <div 
                  onClick={() => setExpanded(isOpen ? null : slot.id)}
                  className="p-4 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-1.5 h-12 rounded-full shadow-sm ${slot.color}`}></div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-mono tracking-tight">{slot.time}</div>
                      <div className="font-bold text-slate-900 truncate pr-2">{slot.subject}</div>
                      <div className="text-xs text-slate-500">{slot.room}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Icons */}
                    {data.link && <ExternalLink size={16} className="text-blue-600" />}
                    {isAdmin && data.notes && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>}
                    {isOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                  </div>
                </div>

                {/* B. EXPANDED VIEW (Body) */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                    
                    {/* 1. PRESENTATION LINK (Public) */}
                    <div className="mt-4">
                       {isAdmin ? (
                         <div className="relative">
                           <span className="absolute -top-2 left-2 bg-slate-50 px-1 text-[10px] text-blue-600 font-bold uppercase">Public Links</span>
                           <div className="flex flex-col gap-2 bg-white border border-slate-200 rounded-lg p-3">
                             {getLinks(data.link).map((linkItem, i) => (
                               <div key={i} className="flex flex-col gap-1 p-2 bg-slate-50 rounded border border-slate-100">
                                 <div className="flex gap-2 items-center">
                                   <input 
                                     className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none transition-colors"
                                     placeholder="Link Title"
                                     value={linkItem.title}
                                     onChange={(e) => {
                                       const newLinks = getLinks(data.link);
                                       newLinks[i].title = e.target.value;
                                       saveData(slot.id, { link: JSON.stringify(newLinks) });
                                     }}
                                   />
                                   <button 
                                     onClick={async () => {
                                       if (!linkItem.url) return;
                                       setGeneratingLink(`${slot.id}-${i}`);
                                       const res = await generateLinkTitleAction(linkItem.url);
                                       if (res.success && res.title) {
                                         const newLinks = getLinks(data.link);
                                         newLinks[i].title = res.title;
                                         await saveData(slot.id, { link: JSON.stringify(newLinks) });
                                       }
                                       setGeneratingLink(null);
                                     }}
                                     className={`text-slate-400 hover:text-violet-500 transition-colors ${generatingLink === `${slot.id}-${i}` ? 'text-violet-500 cursor-wait' : ''}`}
                                     title="Auto-generate Title & Save"
                                     disabled={generatingLink === `${slot.id}-${i}`}
                                   >
                                     {generatingLink === `${slot.id}-${i}` ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                   </button>
                                   <button 
                                     onClick={() => {
                                       const newLinks = getLinks(data.link).filter((_, idx) => idx !== i);
                                       saveData(slot.id, { link: JSON.stringify(newLinks) });
                                     }}
                                     className="text-slate-400 hover:text-red-500 transition-colors"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                                 <input 
                                   className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none transition-colors text-slate-900"
                                   placeholder="Paste URL..."
                                   value={linkItem.url}
                                   onChange={(e) => {
                                     const newUrl = e.target.value;
                                     const newLinks = getLinks(data.link);
                                     newLinks[i].url = newUrl;
                                     
                                     // Auto-generate title if generic
                                     if (newLinks[i].title === "New Link" || newLinks[i].title === "" || newLinks[i].title.startsWith("Link ")) {
                                        try {
                                          const urlObj = new URL(newUrl);
                                          let domain = urlObj.hostname.replace('www.', '').split('.')[0];
                                          if (domain) {
                                            newLinks[i].title = domain.charAt(0).toUpperCase() + domain.slice(1);
                                          }
                                        } catch {}
                                     }

                                     saveData(slot.id, { link: JSON.stringify(newLinks) });
                                   }}
                                 />
                               </div>
                             ))}
                             <button 
                               onClick={() => saveData(slot.id, { link: JSON.stringify([...getLinks(data.link), { url: "", title: "New Link" }]) })}
                               className="flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 py-2 rounded border border-dashed border-blue-200 transition-colors"
                             >
                               <Plus size={14} /> ADD LINK
                             </button>
                           </div>
                         </div>
                       ) : (
                         getLinks(data.link).length > 0 ? (
                           <div className="flex flex-col gap-2">
                             {getLinks(data.link).map((linkItem, i) => (
                               <a key={i} href={linkItem.url} target="_blank" className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition font-medium shadow-lg shadow-blue-500/20">
                                 <ExternalLink size={18} /> {linkItem.title}
                               </a>
                             ))}
                           </div>
                         ) : <div className="text-center p-3 rounded-lg border border-dashed border-slate-200 bg-slate-100 text-slate-500 text-sm italic">No links available.</div>
                       )}
                    </div>

                    {/* 2. ADMIN PANEL (Notes & Images) */}
                    {isAdmin && (
                      <div className="mt-6 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 gap-4">
                          
                          {/* Notes */}
                          <div className="relative">
                            <span className="absolute -top-2 left-2 bg-slate-50 px-1 text-[10px] text-yellow-600 font-bold uppercase">Private Notes</span>
                            <textarea 
                              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm h-24 resize-none focus:border-yellow-500 outline-none transition-colors text-slate-700"
                              placeholder="Ideas, exam pointers, reminders..."
                              value={data.notes || ''}
                              onChange={(e) => saveData(slot.id, { notes: e.target.value })}
                            />
                          </div>

                          {/* Gallery */}
                          <div className="relative">
                             <span className="absolute -top-2 left-2 bg-slate-50 px-1 text-[10px] text-emerald-600 font-bold uppercase">Gallery</span>
                             <div className="flex gap-2 items-start">
                               {/* Upload Button */}
                               <div className="relative group cursor-pointer border border-dashed border-slate-300 bg-white rounded-lg w-20 h-20 flex flex-col items-center justify-center hover:border-emerald-500 hover:text-emerald-500 transition text-slate-400 shrink-0">
                                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUpload(slot.id, e.target.files[0])} />
                                 <ImageIcon size={20} />
                                 <span className="text-[9px] mt-1 font-bold">ADD</span>
                               </div>

                               {/* Thumbnails */}
                               <div className="flex gap-2 overflow-x-auto pb-2 h-24 items-center">
                                 {data.images?.map((img:string, i:number) => (
                                   <a key={i} href={img} target="_blank" className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition shrink-0">
                                     <img src={img} className="w-full h-full object-cover" />
                                   </a>
                                 ))}
                               </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* GLOBAL STYLES FOR CALENDAR */}
      <style jsx global>{`
        .react-calendar { width: 100%; background: transparent; font-family: inherit; border: none; }
        .react-calendar__navigation button { color: #334155; font-size: 1.1rem; font-weight: bold; }
        .react-calendar__month-view__weekdays { text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; opacity: 0.6; color: #64748b; }
        .react-calendar__tile { padding: 0.5rem; color: #64748b; font-size: 1rem; font-weight: 500; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 3.5rem; }
        .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #f1f5f9; border-radius: 8px; color: #0f172a; }
        .react-calendar__month-view__days__day--weekend { color: #94a3b8; }
        .react-calendar__tile--now { background: transparent; }
        abbr[title] { text-decoration: none; }
      `}</style>
    </div>
  );
}