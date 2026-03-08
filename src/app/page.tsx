"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Calendar from "react-calendar";
import { createClient } from "@supabase/supabase-js";
import {
  ExternalLink, Lock, Unlock, ChevronDown, ChevronUp, Pencil,
  Image as ImageIcon, Loader2, BookOpen, Coffee, X, Plus, Trash2, Layers, Upload, Sparkles, LogIn, LogOut, Share2, Save, Clock, ArrowRight, HelpCircle, Star, Globe
} from "lucide-react";
import { format } from "date-fns";
import "react-calendar/dist/Calendar.css";
import Joyride, { Step } from "react-joyride";
import { parseScheduleAction, generateLinkTitleAction, shortenUrlAction } from "./actions";

// ==========================================
// 1. CONFIGURATION (ILAGAY ANG API KEYS DITO)
// ==========================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAILS = [
  'public.y2026@gmail.com',
  'antoniotagaruma7@gmail.com',
  'antoniotagaruma8@gmail.com'
];

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

interface FavoriteLink {
  id: string;
  title: string;
  url: string;
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

const SCHEDULE_PROFILES: ScheduleProfile[] = [
  {
    id: 'main',
    name: 'myLesson Hub',
    subtitle: 'IES Simone Veil • UAH',
    schedule: MAIN_SCHEDULE
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
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <LessonArchiveContent />
    </Suspense>
  );
}

function LessonArchiveContent() {
  const searchParams = useSearchParams();
  const publicUserId = searchParams.get('uid');

  const [date, setDate] = useState<Date>(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<Record<string, LessonEntry>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<string>('main');
  const [profiles, setProfiles] = useState<ScheduleProfile[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newScheduleSubtitle, setNewScheduleSubtitle] = useState("");
  const [editingSlot, setEditingSlot] = useState<{ dayIndex: number, slotIndex: number, slot: ScheduleSlot } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Favorite Links State
  const [favoriteLinks, setFavoriteLinks] = useState<FavoriteLink[]>([]);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteLink | null>(null);
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);

  // Tour State
  const [runTour, setRunTour] = useState(false);

  // We define all steps here
  const [tourSteps, setTourSteps] = useState<Step[]>([
    {
      target: '.tour-step-calendar',
      content: 'Welcome to Lesson Hub! 📅 Please select a date on the calendar to open your dashboard.',
      placement: 'right',
      spotlightClicks: true,
      disableBeacon: true
    }
  ]);

  // Handle tour progression based on panel opening
  useEffect(() => {
    if (isPanelOpen) {
      setTourSteps([
        {
          target: '.tour-step-profile',
          content: '1️⃣ To get started, hover here and click "Add Schedule". You can simply upload your PDF schedule and our AI will automatically build it for you!',
          placement: 'bottom'
        },
        {
          target: '.tour-step-admin',
          content: '2️⃣ Toggle between ADMIN MODE (to edit your lessons) and VIEW ONLY mode (how your students will see it).',
          placement: 'bottom'
        },
        {
          target: '.tour-step-schedule',
          content: '3️⃣ This is where your classes live. Click on any class to add notes, links, or image resources.',
          placement: 'left'
        },
        {
          target: 'body',
          content: '✨ You can access your lessons from anywhere, anytime, just by logging into this app! Happy teaching! 🍎',
          placement: 'center'
        }
      ]);

      // Auto-continue the tour if they just opened the panel and haven't finished yet
      const hasSeenTour = localStorage.getItem('lesson_hub_has_seen_tour');
      if (!hasSeenTour) {
        setRunTour(true);
      }
    } else {
      setTourSteps([
        {
          target: '.tour-step-calendar',
          content: 'Welcome to Lesson Hub! 📅 Please select a date on the calendar to open your dashboard.',
          placement: 'right',
          spotlightClicks: true,
          disableBeacon: true
        }
      ]);
    }
  }, [isPanelOpen]);


  // Check if it's the user's first time logging in to auto-start the tour
  useEffect(() => {
    if (user && !publicUserId) {
      const hasSeenTour = localStorage.getItem('lesson_hub_has_seen_tour');
      if (!hasSeenTour) {
        setRunTour(true);
      }
    }
  }, [user, publicUserId]);

  const handleTourCallback = (data: any) => {
    const { status, action, index } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      // Only mark as completely seen if they finished the second half of the tour
      if (isPanelOpen) {
        localStorage.setItem('lesson_hub_has_seen_tour', 'true');
      }
    }
  };

  // CHECK: Kung naka-placeholder pa rin ang URL, ipakita ang error screen
  if (SUPABASE_URL.includes("placeholder")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-lg">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Missing Configuration</h2>
          <p className="text-slate-600 mb-6">
            The app is trying to connect to a placeholder Supabase URL. This usually means your environment variables are missing locally.
          </p>
          <div className="bg-slate-900 text-slate-200 p-4 rounded-lg text-left text-xs font-mono mb-6 overflow-x-auto">
            <p># .env.local</p>
            <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
          </div>
          <p className="text-sm text-slate-500">
            Create a <code>.env.local</code> file in your project folder and restart the server.
          </p>
        </div>
      </div>
    );
  }

  const dateKey = format(date, 'yyyy-MM-dd');
  const dayIndex = date.getDay();
  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0];
  const schedule = currentProfile?.schedule[dayIndex] || [];
  const holidayName = HOLIDAYS[dateKey];

  // Determine target user (URL param takes precedence for viewing, fallback to logged-in user)
  const targetUserId = publicUserId || user?.id;
  const isOwner = user && targetUserId === user.id;

  // Init: Check URL params & Auth Session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    // Ensure this URL is allowed in Supabase Dashboard > Authentication > URL Configuration
    // If not allowed, Supabase will fallback to the default Site URL (usually localhost)
    const redirectTo = window.location.href;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setEntries({});
    window.location.reload();
  };

  // Disable admin mode if viewing someone else's schedule
  useEffect(() => {
    if (!isOwner) setIsAdmin(false);
  }, [isOwner]);

  // Load Favorite Links from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lesson_hub_favorite_links');
      if (saved) setFavoriteLinks(JSON.parse(saved));
    } catch { }
  }, []);

  // Save Favorite Links to localStorage
  const saveFavoriteLinks = (links: FavoriteLink[]) => {
    setFavoriteLinks(links);
    localStorage.setItem('lesson_hub_favorite_links', JSON.stringify(links));
  };

  const handleSaveFavorite = () => {
    if (!editingFavorite || !editingFavorite.title.trim() || !editingFavorite.url.trim()) return;
    const existing = favoriteLinks.find(l => l.id === editingFavorite.id);
    if (existing) {
      saveFavoriteLinks(favoriteLinks.map(l => l.id === editingFavorite.id ? editingFavorite : l));
    } else {
      saveFavoriteLinks([...favoriteLinks, editingFavorite]);
    }
    setEditingFavorite(null);
    setIsFavModalOpen(false);
  };

  const handleDeleteFavorite = (id: string) => {
    saveFavoriteLinks(favoriteLinks.filter(l => l.id !== id));
  };

  // Load Schedules from DB
  useEffect(() => {
    if (!targetUserId) return;

    const fetchSchedules = async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', targetUserId);

      let loadedProfiles: ScheduleProfile[] = [];
      const isUserAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

      // Only show hardcoded profiles if user is an admin
      if (isUserAdmin) {
        loadedProfiles = [...SCHEDULE_PROFILES];
      }

      if (data && data.length > 0) {
        const dbProfiles = data.map((d: any) => ({
          id: d.profile_id,
          name: d.name,
          subtitle: d.subtitle,
          schedule: d.schedule
        }));

        dbProfiles.forEach(dbp => {
          // If the profile is one of the pre-loaded admin schedules, hide it from non-admins
          const isRestrictedAdminProfile = SCHEDULE_PROFILES.some(adminProf => adminProf.id === dbp.id);
          if (!isUserAdmin && isRestrictedAdminProfile) {
            return;
          }

          if (!loadedProfiles.find(p => p.id === dbp.id)) {
            loadedProfiles.push(dbp);
          }
        });
      }

      setProfiles(loadedProfiles);

      if (loadedProfiles.length > 0) {
        // If current profile is not in loaded, switch to first
        if (!loadedProfiles.find((p: any) => p.id === currentProfileId)) {
          setCurrentProfileId(loadedProfiles[0].id);
        }
      }
    };

    fetchSchedules();
  }, [targetUserId]);

  // Helper to save a specific profile to DB
  const saveProfileToDB = async (profile: ScheduleProfile) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('schedules').upsert({
        user_id: user.id,
        profile_id: profile.id,
        name: profile.name,
        subtitle: profile.subtitle,
        schedule: profile.schedule
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error saving schedule:", err);
    }
  };

  // Helper to delete a profile from DB
  const deleteProfileFromDB = async (profileId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('schedules').delete().eq('user_id', user.id).eq('profile_id', profileId);
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  // Load Data
  useEffect(() => {
    if (!targetUserId) {
      setEntries({}); // Clear data when logged out
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lesson_plan')
          .select('*')
          .eq('date', dateKey)
          .eq('user_id', targetUserId);

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
  }, [dateKey, targetUserId]);

  // Save Data
  const saveData = async (slotId: string, updates: any) => {
    if (!user || !isOwner) return;
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

  // Delete Data
  const handleDeleteLesson = async (slotId: string) => {
    if (!user || !isOwner) return;
    if (!confirm("Are you sure you want to clear all data for this lesson?")) return;

    try {
      const { error } = await supabase
        .from('lesson_plan')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateKey)
        .eq('slot_id', slotId);

      if (error) throw error;

      setEntries(prev => {
        const newEntries = { ...prev };
        delete newEntries[slotId];
        return newEntries;
      });
    } catch (err) {
      console.error("Error deleting lesson:", err);
      alert("Failed to delete lesson");
    }
  };

  // Upload Image
  const handleUpload = async (slotId: string, file: File) => {
    if (!file || !user || !isOwner) return;
    const fileName = `${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from('lesson-gallery').upload(fileName, file);
    if (data) {
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
        name: newScheduleTitle || 'Imported Schedule',
        subtitle: newScheduleSubtitle || 'AI Generated',
        schedule: result.data
      };

      setProfiles(prev => [...prev, newProfile]);
      saveProfileToDB(newProfile); // Save imported
      setCurrentProfileId(newProfile.id);
      setIsAddScheduleModalOpen(false);
      setNewScheduleTitle("");
      setNewScheduleSubtitle("");
      alert("Schedule imported successfully!");
    } else {
      alert(result.message || "Failed to import schedule.");
    }
    setIsImporting(false);
    e.target.value = ""; // Reset input
  };

  // Handle Slot Editing
  const handleSaveSlot = () => {
    if (!editingSlot) return;

    let updatedProfile: ScheduleProfile | null = null;

    const newProfiles = profiles.map(p => {
      if (p.id !== currentProfileId) return p;

      const newSchedule = { ...p.schedule };
      const daySlots = [...(newSchedule[editingSlot.dayIndex] || [])];

      if (editingSlot.slotIndex === -1) {
        // Add new
        daySlots.push(editingSlot.slot);
      } else {
        // Update existing
        daySlots[editingSlot.slotIndex] = editingSlot.slot;
      }

      // Sort by time
      daySlots.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      newSchedule[editingSlot.dayIndex] = daySlots;
      updatedProfile = { ...p, schedule: newSchedule };
      return updatedProfile;
    });

    setProfiles(newProfiles);

    if (updatedProfile) {
      saveProfileToDB(updatedProfile);
    }
    setEditingSlot(null);
  };

  const handleDeleteSlot = () => {
    if (!editingSlot || editingSlot.slotIndex === -1) return;

    let updatedProfile: ScheduleProfile | null = null;

    const newProfiles = profiles.map(p => {
      if (p.id !== currentProfileId) return p;

      const newSchedule = { ...p.schedule };
      const daySlots = [...(newSchedule[editingSlot.dayIndex] || [])];
      daySlots.splice(editingSlot.slotIndex, 1);

      newSchedule[editingSlot.dayIndex] = daySlots;
      updatedProfile = { ...p, schedule: newSchedule };
      return updatedProfile;
    });

    setProfiles(newProfiles);

    if (updatedProfile) {
      saveProfileToDB(updatedProfile);
    }
    setEditingSlot(null);
  };

  // Debugging
  console.log("Auth Status:", { isAuthChecking, hasUser: !!user, publicUserId });

  // ------------------------------------------
  // LOADING STATE
  // ------------------------------------------
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // ------------------------------------------
  // MARKETING PAGE (If not logged in)
  // ------------------------------------------
  if (!user && !publicUserId) {
    return (
      <div className="min-h-screen bg-[#0a0a0e] flex flex-col font-sans text-slate-200 selection:bg-blue-500/30 selection:text-white relative overflow-hidden">

        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] opacity-40 pointer-events-none"></div>
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>

        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

        {/* Navbar */}
        <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
          <div className="flex items-center gap-3 font-extrabold text-2xl tracking-tight text-white">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-xl shadow-lg shadow-blue-500/20 border border-white/10">
              <Layers size={24} />
            </div>
            Lesson Hub
          </div>
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all text-sm shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-5xl mx-auto relative z-10 w-full mb-12">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-inset ring-emerald-500/20">
            <Sparkles size={14} className="text-emerald-400" />
            100% Free Forever
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Organize your teaching <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 drop-shadow-sm">
              in one place, for free.
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-14 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium">
            Say goodbye to messy paper planners and expensive subscriptions. Manage your schedules, lesson plans, and resources effortlessly without paying a dime.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <button
              onClick={handleLogin}
              className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group border border-white"
            >
              Start Using for Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => window.open('https://github.com', '_blank')}
              className="px-8 py-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all hover:border-white/20"
            >
              Learn More
            </button>
          </div>

          {/* Feature Grid - Bento Box Style */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mt-32 text-left w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 max-w-6xl">

            {/* Main Free Feature - Spans full width */}
            <div className="md:col-span-6 p-8 md:p-12 rounded-3xl bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-colors"></div>
              <div className="flex items-start md:items-center gap-8 flex-col md:flex-row relative z-10">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Unlock size={40} />
                </div>
                <div>
                  <h3 className="font-bold text-3xl mb-3 text-white tracking-tight">Completely Free, No Hidden Costs</h3>
                  <p className="text-emerald-100/70 leading-relaxed text-lg font-medium">We believe essential tools for educators should be accessible to everyone. There are no premium tiers, no paywalls, and no hidden subscriptions. Everything is available to you right from the start.</p>
                </div>
              </div>
            </div>

            {/* Sub feature 1 */}
            <div className="md:col-span-3 lg:col-span-2 p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] group-hover:bg-blue-500/30 transition-colors"></div>
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <Clock size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">Smart Scheduling</h3>
              <p className="text-slate-400 leading-relaxed">Visualize your daily classes with an intuitive calendar view designed specifically for academic schedules.</p>
            </div>

            {/* Sub feature 2 */}
            <div className="md:col-span-3 lg:col-span-2 p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-violet-500/30 hover:bg-white/[0.07] transition-all group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-[40px] group-hover:bg-violet-500/30 transition-colors"></div>
              <div className="w-14 h-14 bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <BookOpen size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">Lesson Planning</h3>
              <p className="text-slate-400 leading-relaxed">Attach notes, resources, and links directly to your class slots. Keep everything organized and accessible.</p>
            </div>

            {/* Sub feature 3 */}
            <div className="md:col-span-3 lg:col-span-2 p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] group-hover:bg-indigo-500/30 transition-colors"></div>
              <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <Share2 size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">Easy Sharing</h3>
              <p className="text-slate-400 leading-relaxed">Share your schedule or specific lesson resources with students or colleagues via a simple, secure link.</p>
            </div>

            {/* Sub feature 4 - Wide bottom */}
            <div className="md:col-span-3 lg:col-span-6 p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-fuchsia-500/30 hover:bg-white/[0.07] transition-all group flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden">
              <div className="absolute bottom-0 right-1/4 w-64 h-32 bg-fuchsia-500/10 rounded-full blur-[60px] group-hover:bg-fuchsia-500/20 transition-colors"></div>
              <div className="w-14 h-14 bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                <Layers size={28} />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2 text-white">Multiple Profiles</h3>
                <p className="text-slate-400 leading-relaxed max-w-3xl">Manage different schedule profiles for different schools or semesters and switch between them seamlessly. Your entire teaching life organized under one hub.</p>
              </div>
            </div>

          </div>
        </main>

        <footer className="py-8 text-center text-slate-500 text-sm border-t border-white/10 bg-white/[0.02] backdrop-blur-md relative z-10 w-full mt-auto">
          <p>© {new Date().getFullYear()} Lesson Hub. Built with ❤️ for teachers.</p>
        </footer>
      </div>
    );
  }

  // ------------------------------------------
  // MAIN APP (If logged in)
  // ------------------------------------------
  return (
    <div className="h-screen bg-[#0a0a0e] text-slate-200 font-sans flex flex-col overflow-hidden selection:bg-blue-500/30 selection:text-white relative">

      {/* Background Effects matching landing page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        hideCloseButton
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6', // blue-500
            zIndex: 1000,
            backgroundColor: '#1e1e24',
            textColor: '#f8fafc',
            arrowColor: '#1e1e24',
          },
        }}
      />

      {/* 1. TOP NAVIGATION */}
      <nav className="shrink-0 p-4 border-b border-white/10 bg-[#0a0a0e]/60 backdrop-blur-md z-50 flex justify-between items-center shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl shadow-lg shadow-blue-500/20 text-white border border-white/10">
            <Layers size={20} />
          </div>
          <div className="relative group tour-step-profile">
            <button className="text-left flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div>
                <h1 className="font-bold text-lg leading-tight text-white">{currentProfile?.name || 'No Schedule'}</h1>
                <p className="text-[10px] text-slate-400 tracking-wider font-bold">{currentProfile?.subtitle || 'Please import or add one'}</p>
              </div>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 pt-2 w-56 hidden group-hover:block z-50">
              <div className="bg-[#13131a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setCurrentProfileId(profile.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${currentProfileId === profile.id ? 'bg-blue-500/10 text-blue-400 font-bold border-l-2 border-blue-500' : 'text-slate-300'}`}
                  >
                    <span>{profile.name}</span>
                    {currentProfileId === profile.id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
                  </button>
                ))}

                {/* Actions */}
                <div className="border-t border-white/10 p-2 space-y-1 bg-white/5">
                  <button
                    onClick={() => {
                      if (!currentProfile) return;
                      setNewScheduleTitle(currentProfile.name);
                      setNewScheduleSubtitle(currentProfile.subtitle);
                      setIsEditScheduleModalOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={!currentProfile}
                  >
                    <Pencil size={14} />
                    Edit Info
                  </button>
                  <button
                    onClick={() => {
                      setNewScheduleTitle("");
                      setNewScheduleSubtitle("");
                      setIsAddScheduleModalOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                  >
                    <Plus size={14} />
                    Add Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* User Email Indicator */}
          {user && (
            <span className="hidden md:block text-xs font-medium text-slate-400 mr-2">
              {user.email}
            </span>
          )}

          {/* Share Button */}
          {targetUserId && (
            <button
              onClick={async () => {
                if (isSharing) return;
                setIsSharing(true);
                const baseUrl = window.location.origin + window.location.pathname;
                const longUrl = `${baseUrl}?uid=${targetUserId}`;
                const result = await shortenUrlAction(longUrl);
                const shareUrl = result.success && result.shortUrl ? result.shortUrl : longUrl;
                const shareTitle = currentProfile?.name || 'My Schedule';
                const shareText = `Check out my schedule on Lesson Hub!`;

                // Try native Web Share API first
                if (navigator.share) {
                  try {
                    await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
                  } catch (err: any) {
                    if (err.name !== 'AbortError') console.error('Share failed:', err);
                  }
                } else {
                  // Fallback: show a custom share popup
                  const encodedUrl = encodeURIComponent(shareUrl);
                  const encodedText = encodeURIComponent(shareText + ' ' + shareUrl);
                  const shareOptions = [
                    { name: 'WhatsApp', url: `https://wa.me/?text=${encodedText}`, color: 'bg-green-600' },
                    { name: 'Telegram', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`, color: 'bg-blue-500' },
                    { name: 'Email', url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodedText}`, color: 'bg-slate-600' },
                    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: 'bg-blue-700' },
                    { name: 'X (Twitter)', url: `https://twitter.com/intent/tweet?text=${encodedText}`, color: 'bg-slate-800' },
                  ];

                  // Create and show a share modal
                  const overlay = document.createElement('div');
                  overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4';
                  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

                  const modal = document.createElement('div');
                  modal.className = 'bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300 text-slate-200 mb-4 sm:mb-0';
                  modal.innerHTML = `
                    <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 class="font-bold text-white text-sm">Share Schedule</h3>
                      <button id="share-close" class="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">✕</button>
                    </div>
                    <div class="p-4 space-y-2">
                      ${shareOptions.map(opt => `
                        <a href="${opt.url}" target="_blank" rel="noopener noreferrer"
                          class="flex items-center gap-3 w-full px-4 py-3 rounded-xl ${opt.color} hover:opacity-90 text-white text-sm font-bold transition-all">
                          ${opt.name}
                        </a>
                      `).join('')}
                      <button id="share-copy" class="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all border border-white/10">
                        📋 Copy Link
                      </button>
                    </div>
                    <div class="px-4 pb-4">
                      <input readonly value="${shareUrl}" class="w-full bg-[#0a0a0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono select-all" />
                    </div>
                  `;

                  overlay.appendChild(modal);
                  document.body.appendChild(overlay);

                  modal.querySelector('#share-close')?.addEventListener('click', () => overlay.remove());
                  modal.querySelector('#share-copy')?.addEventListener('click', () => {
                    navigator.clipboard.writeText(shareUrl);
                    const btn = modal.querySelector('#share-copy');
                    if (btn) btn.innerHTML = '✅ Copied!';
                    setTimeout(() => overlay.remove(), 1200);
                  });

                  // Close share options when clicking any share link
                  modal.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(() => overlay.remove(), 500)));
                }
                setIsSharing(false);
              }}
              className={`p-2.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-full transition-colors tour-step-share border border-transparent hover:border-blue-500/20 ${isSharing ? 'opacity-50 cursor-wait' : ''}`}
              title="Share Schedule"
            >
              {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            </button>
          )}

          {/* Tour Button */}
          {user && (
            <button
              onClick={() => setRunTour(true)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/10"
              title="Start Tour"
            >
              <HelpCircle size={18} />
            </button>
          )}

          {/* Guest Indicator */}
          {!user && publicUserId && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 shadow-inner">
              <BookOpen size={14} />
              Guest View
            </span>
          )}

          {user ? (
            <>
              {isOwner && (
                <button
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-2 transition-all font-medium tour-step-admin shadow-sm ${isAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'}`}
                >
                  {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
                  {isAdmin ? 'ADMIN MODE' : 'VIEW ONLY'}
                </button>
              )}
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors ml-1" title="Sign Out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="text-xs px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500"
            >
              <LogIn size={14} />
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* FAVORITE LINKS BAR */}
      {(favoriteLinks.length > 0 || (isAdmin && isOwner)) && (
        <div className="shrink-0 px-4 py-2.5 border-b border-white/10 bg-[#0a0a0e]/60 backdrop-blur-md z-40 flex items-center gap-3 overflow-x-auto relative">
          <div className="flex items-center gap-1.5 text-yellow-400/80 shrink-0">
            <Star size={14} fill="currentColor" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My Links</span>
          </div>
          <div className="h-4 w-px bg-white/10 shrink-0"></div>
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {favoriteLinks.map(link => (
              <div key={link.id} className="group relative shrink-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 text-xs font-medium text-slate-300 hover:text-white transition-all"
                >
                  <Globe size={12} className="text-blue-400" />
                  {link.title}
                </a>
                {isAdmin && isOwner && (
                  <div className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5 z-10">
                    <button
                      onClick={(e) => { e.preventDefault(); setEditingFavorite(link); setIsFavModalOpen(true); }}
                      className="p-1 bg-[#13131a] border border-white/20 rounded-full text-slate-400 hover:text-blue-400 transition-colors shadow-lg"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDeleteFavorite(link.id); }}
                      className="p-1 bg-[#13131a] border border-white/20 rounded-full text-slate-400 hover:text-red-400 transition-colors shadow-lg"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {isAdmin && isOwner && (
            <button
              onClick={() => { setEditingFavorite({ id: `fav_${Date.now()}`, title: '', url: '' }); setIsFavModalOpen(true); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 hover:border-yellow-500/40 transition-all"
            >
              <Plus size={12} />
              Add
            </button>
          )}
        </div>
      )}

      {/* Favorite Link Modal */}
      {isFavModalOpen && editingFavorite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Star size={16} className="text-yellow-400" />
                {favoriteLinks.find(l => l.id === editingFavorite.id) ? 'Edit Link' : 'Add Favorite Link'}
              </h3>
              <button onClick={() => { setIsFavModalOpen(false); setEditingFavorite(null); }} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Title</label>
                <input
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500/50 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                  placeholder="e.g. Google Classroom"
                  value={editingFavorite.title}
                  onChange={(e) => setEditingFavorite({ ...editingFavorite, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">URL</label>
                <input
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500/50 focus:bg-white/5 transition-all text-white placeholder-slate-600 font-mono"
                  placeholder="https://..."
                  value={editingFavorite.url}
                  onChange={(e) => setEditingFavorite({ ...editingFavorite, url: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setIsFavModalOpen(false); setEditingFavorite(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFavorite}
                  disabled={!editingFavorite.title.trim() || !editingFavorite.url.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-bold hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* 2. CALENDAR WIDGET (Left / Center) */}
        <div className={`transition-all duration-500 ease-in-out flex flex-col items-center p-6 overflow-y-auto ${isPanelOpen ? 'w-full md:w-1/3 justify-start pt-10' : 'w-full'}`}>
          <div className={`bg-[#13131a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl transition-all w-full tour-step-calendar relative overflow-hidden ${isPanelOpen ? 'max-w-full' : 'max-w-lg my-auto'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <Calendar
              onChange={(v) => {
                setDate(v as Date);
                setIsPanelOpen(true);
              }}
              value={date}
              locale="es-ES"
              calendarType="iso8601"
              className="w-full bg-transparent border-none font-sans text-slate-200 relative z-10"
              tileClassName={({ date, view }) => {
                const dKey = format(date, 'yyyy-MM-dd');
                if (HOLIDAYS[dKey]) return 'text-red-400 font-bold bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20';
                if (dKey === format(new Date(), 'yyyy-MM-dd')) return 'bg-blue-600/90 text-white rounded-md shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500 font-bold';
                return 'hover:bg-white/5 rounded-lg text-slate-300 transition-colors';
              }}
              tileContent={({ date, view }) => {
                const dKey = format(date, 'yyyy-MM-dd');
                if (view === 'month' && HOLIDAYS[dKey]) {
                  return (
                    <div className="w-full flex justify-center mt-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <p className="text-center text-slate-400 mt-8 text-sm font-medium animate-pulse relative z-10">
              {isPanelOpen ? "Viewing schedule..." : "Select a date to view classes"}
            </p>
          </div>
        </div>

        {/* 3. CLASSES PANEL (Right) */}
        <div className={`bg-[#0a0a0e]/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out flex flex-col overflow-hidden absolute inset-0 z-50 md:static tour-step-schedule ${isPanelOpen ? 'translate-x-0 opacity-100 md:w-2/3' : 'translate-x-full opacity-0 md:w-0 md:translate-x-0'}`}>
          <div className="w-full h-full flex flex-col min-w-[320px] relative">


            <div className="flex-1 overflow-y-auto p-6 pt-6 z-10 relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="mb-8 flex items-center justify-between relative z-10">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight mb-1">
                    {date.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}, {date.getDate()} de {date.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  </h2>
                  {holidayName ? (
                    <span className="inline-block mt-2 px-3 py-1 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm">
                      🇪🇸 HOLIDAY: {holidayName}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium">Classes for today</span>
                  )}
                </div>
                {loading && <Loader2 className="animate-spin text-blue-500" />}
              </div>

              <div className="space-y-4 relative z-10">
                {/* Empty State */}
                {schedule.length === 0 && !holidayName && (
                  <div className="p-10 text-center bg-white/5 border border-dashed border-white/20 rounded-2xl text-slate-400 backdrop-blur-sm shadow-inner">
                    {isAdmin && currentProfile ? (
                      <button
                        onClick={() => setEditingSlot({ dayIndex, slotIndex: -1, slot: { id: `slot_${Date.now()}`, time: '', subject: 'New Class', room: '', color: 'bg-blue-600' } })}
                        className="flex flex-col items-center gap-3 w-full h-full hover:text-blue-400 transition-colors group"
                      >
                        <div className="p-4 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform">
                          <Plus size={32} className="text-blue-400" />
                        </div>
                        <p className="font-medium">Add your first class for today</p>
                      </button>
                    ) : !currentProfile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Layers size={36} className="text-slate-600 mb-3" />
                        <p className="text-base font-medium text-slate-300">No schedule profile found.</p>
                        {isOwner && (
                          <button
                            onClick={() => setIsAddScheduleModalOpen(true)}
                            className="mt-4 text-sm font-bold text-blue-400 bg-blue-500/10 px-6 py-2.5 rounded-full hover:bg-blue-500/20 border border-blue-500/20 transition-colors shadow-sm"
                          >
                            Create or Import a Schedule
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <Coffee className="mx-auto mb-3 text-slate-500" size={36} />
                        <p className="font-medium">No classes found. Import a schedule to get started.</p>
                      </>
                    )}
                  </div>
                )}

                {/* Cards Loop */}
                {schedule.map((slot: ScheduleSlot, idx: number) => {
                  // Render Break
                  if (slot.isBreak) return (
                    <div key={idx} className="flex items-center gap-4 py-3 opacity-60 group relative">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-[#0a0a0e] px-2">Recreo</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                      {isAdmin && (
                        <button
                          onClick={() => setEditingSlot({ dayIndex, slotIndex: idx, slot })}
                          className="absolute right-0 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all bg-[#0a0a0e]"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  );

                  const data = entries[slot.id] || ({} as Partial<LessonEntry>);
                  const isOpen = expanded === slot.id;

                  return (
                    <div key={slot.id} className={`group border transition-all duration-300 rounded-2xl overflow-hidden backdrop-blur-md ${isOpen ? 'bg-[#13131a]/90 border-blue-500 ring-1 ring-blue-500/20 shadow-xl shadow-blue-900/10' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 shadow-sm'}`}>

                      {/* A. COMPACT VIEW (Head) */}
                      <div
                        onClick={() => setExpanded(isOpen ? null : slot.id)}
                        className="p-4 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`w-1.5 h-12 rounded-full shadow-sm ${slot.color}`}></div>
                          <div>
                            <div className="text-[11px] text-slate-400 font-mono tracking-tight">{slot.time}</div>
                            <div className="font-bold text-slate-100 truncate pr-2 text-base">{slot.subject}</div>
                            <div className="text-xs text-slate-400 font-medium">{slot.room}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Icons */}
                          {data.link && <ExternalLink size={16} className="text-blue-400" />}
                          {isAdmin && data.notes && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSlot({ dayIndex, slotIndex: idx, slot });
                              }}
                              className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all"
                              title="Edit Class Details"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {isOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />}
                        </div>
                      </div>

                      {/* B. EXPANDED VIEW (Body) */}
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0 border-t border-white/10 bg-[#0a0a0e]/40">

                          {/* Edit Info Button (Visible inside expanded) */}
                          {isAdmin && (
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => setEditingSlot({ dayIndex, slotIndex: idx, slot })}
                                className="text-xs flex items-center gap-1.5 text-slate-400 font-bold hover:text-blue-400 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10 bg-white/5"
                              >
                                <Pencil size={12} />
                                Edit Time/Subject
                              </button>
                            </div>
                          )}

                          {/* 1. PRESENTATION LINK (Public) */}
                          <div className="mt-4">
                            {isAdmin ? (
                              <div className="relative">
                                <span className="absolute -top-2.5 left-3 bg-[#13131a] px-2 text-[10px] text-blue-400 font-bold uppercase border border-white/10 rounded-full shadow-sm">Public Links</span>
                                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl p-4 pt-5">
                                  {getLinks(data.link).map((linkItem, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-3 bg-[#0a0a0e]/60 rounded-lg border border-white/5">
                                      <div className="flex gap-2 items-center">
                                        <input
                                          className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-blue-500 focus:bg-white/10 outline-none transition-all placeholder-slate-500"
                                          placeholder="Link Title (e.g., Slides)"
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
                                          className={`p-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all ${generatingLink === `${slot.id}-${i}` ? 'text-violet-500 cursor-wait' : ''}`}
                                          title="Auto-generate Title via AI"
                                          disabled={generatingLink === `${slot.id}-${i}`}
                                        >
                                          {generatingLink === `${slot.id}-${i}` ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        </button>
                                        <button
                                          onClick={() => {
                                            const newLinks = getLinks(data.link).filter((_, idx) => idx !== i);
                                            saveData(slot.id, { link: JSON.stringify(newLinks) });
                                          }}
                                          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
                                          title="Remove Link"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <input
                                        className="w-full bg-[#13131a] border border-white/10 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all text-slate-300 placeholder-slate-600 font-mono"
                                        placeholder="Paste URL here..."
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
                                            } catch { }
                                          }

                                          saveData(slot.id, { link: JSON.stringify(newLinks) });
                                        }}
                                      />
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => saveData(slot.id, { link: JSON.stringify([...getLinks(data.link), { url: "", title: "New Link" }]) })}
                                    className="flex items-center justify-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 py-2.5 rounded-lg border border-dashed border-blue-500/30 hover:border-blue-500/50 transition-all"
                                  >
                                    <Plus size={14} /> ADD ANOTHER LINK
                                  </button>
                                </div>
                              </div>
                            ) : (
                              getLinks(data.link).length > 0 ? (
                                <div className="flex flex-col gap-2.5">
                                  {getLinks(data.link).map((linkItem, i) => (
                                    <a key={i} href={linkItem.url} target="_blank" className="group flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition-all font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500">
                                      <ExternalLink size={18} className="text-blue-200 group-hover:text-white transition-colors" /> {linkItem.title}
                                    </a>
                                  ))}
                                </div>
                              ) : <div className="text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/5 text-slate-500 text-sm italic backdrop-blur-sm">No links available for this class.</div>
                            )}
                          </div>

                          {/* 2. ADMIN PANEL (Notes & Images) */}
                          {isAdmin && (
                            <div className="mt-8 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                              <div className="grid grid-cols-1 gap-6">

                                {/* Notes */}
                                <div className="relative">
                                  <span className="absolute -top-2.5 left-3 bg-[#13131a] px-2 text-[10px] text-yellow-500 font-bold uppercase border border-white/10 rounded-full shadow-sm">Private Notes</span>
                                  <textarea
                                    className="w-full bg-[#0a0a0e]/60 border border-white/10 rounded-xl p-4 pt-5 text-sm h-28 resize-none focus:border-yellow-500/50 focus:bg-white/5 outline-none transition-all text-slate-300 placeholder-slate-600"
                                    placeholder="Jot down ideas, exam pointers, or reminders..."
                                    value={data.notes || ''}
                                    onChange={(e) => saveData(slot.id, { notes: e.target.value })}
                                  />
                                </div>

                                {/* Gallery */}
                                <div className="relative">
                                  <span className="absolute -top-2.5 left-3 bg-[#13131a] px-2 text-[10px] text-emerald-500 font-bold uppercase border border-white/10 rounded-full shadow-sm">Gallery</span>
                                  <div className="flex gap-3 items-start bg-white/5 border border-white/10 rounded-xl p-4 pt-5">
                                    {/* Upload Button */}
                                    <div className="relative group cursor-pointer border-2 border-dashed border-white/20 bg-[#0a0a0e]/60 rounded-xl w-20 h-20 flex flex-col items-center justify-center hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400 transition-all text-slate-500 shrink-0">
                                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleUpload(slot.id, e.target.files[0])} />
                                      <ImageIcon size={20} className="mb-1" />
                                      <span className="text-[10px] font-bold">ADD</span>
                                    </div>

                                    {/* Thumbnails */}
                                    <div className="flex gap-3 overflow-x-auto pb-2 h-24 items-center">
                                      {data.images?.map((img: string, i: number) => (
                                        <a key={i} href={img} target="_blank" className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden hover:opacity-80 transition-opacity shrink-0 shadow-md">
                                          <img src={img} className="w-full h-full object-cover" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Delete Lesson Button */}
                                <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
                                  <button
                                    onClick={() => handleDeleteLesson(slot.id)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                  >
                                    <Trash2 size={14} />
                                    Clear Lesson Data
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Class Button (Admin Only) */}
                {isAdmin && schedule.length > 0 && (
                  <button
                    onClick={() => setEditingSlot({ dayIndex, slotIndex: -1, slot: { id: `slot_${Date.now()}`, time: '', subject: '', room: '', color: 'bg-blue-600' } })}
                    className="w-full py-4 mt-4 border-2 border-dashed border-white/10 bg-white/5 hover:bg-blue-500/10 rounded-2xl text-slate-400 font-bold text-xs hover:border-blue-500/30 hover:text-blue-400 transition-all flex items-center justify-center gap-2 group shadow-sm backdrop-blur-sm"
                  >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                    ADD NEW CLASS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
              <h3 className="font-bold text-white">Add New Schedule</h3>
              <button onClick={() => setIsAddScheduleModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-[#13131a]">
              {/* Inputs for Name and Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Schedule Name</label>
                  <input
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                    placeholder="e.g. My Class Schedule"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Description / Subtitle</label>
                  <input
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                    placeholder="e.g. Semester 1 • 2026"
                    value={newScheduleSubtitle}
                    onChange={(e) => setNewScheduleSubtitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Option 1: AI Import */}
              <div className="space-y-3 p-4 border border-violet-500/20 bg-violet-500/5 rounded-xl">
                <div className="flex items-center gap-2 text-violet-400 mb-1">
                  <Sparkles size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">AI Auto-Create</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Upload a document (PDF or Image) of your schedule. AI will interpret it and create a profile for you.
                </p>

                <form>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-violet-500/30 rounded-xl bg-[#0a0a0e]/50 hover:bg-violet-500/5 hover:border-violet-500/50 cursor-pointer transition-all group ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isImporting ? (
                        <>
                          <Loader2 size={32} className="text-violet-500 animate-spin mb-2" />
                          <p className="text-sm text-violet-400 font-medium">Analyzing document...</p>
                        </>
                      ) : (
                        <>
                          <Upload size={32} className="text-violet-500 group-hover:text-violet-400 group-hover:-translate-y-1 mb-2 transition-all" />
                          <p className="text-sm text-slate-300 font-medium">Click to upload</p>
                          <p className="text-xs text-slate-500">PDF, PNG, JPG</p>
                        </>
                      )}
                    </div>
                    <input
                      name="file"
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleImportSchedule}
                      disabled={isImporting}
                    />
                  </label>
                </form>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Option 2: Manual */}
              <button
                className="w-full py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                onClick={() => {
                  const newProfile: ScheduleProfile = {
                    id: `manual_${Date.now()}`,
                    name: newScheduleTitle || 'New Schedule',
                    subtitle: newScheduleSubtitle || 'Manual Entry',
                    schedule: {}
                  };
                  setProfiles(prev => [...prev, newProfile]);
                  saveProfileToDB(newProfile); // Save new manual
                  setCurrentProfileId(newProfile.id);
                  setIsAddScheduleModalOpen(false);
                  setNewScheduleTitle("");
                  setNewScheduleSubtitle("");
                }}
              >
                <Plus size={16} />
                Create Empty Schedule
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {isEditScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
              <h3 className="font-bold text-white">Edit Schedule Info</h3>
              <button onClick={() => setIsEditScheduleModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-[#13131a]">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Schedule Name</label>
                  <input
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Description / Subtitle</label>
                  <input
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                    value={newScheduleSubtitle}
                    onChange={(e) => setNewScheduleSubtitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {profiles.length > 1 && (
                  <button
                    className="flex-1 py-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this schedule?")) {
                        const newProfiles = profiles.filter(p => p.id !== currentProfileId);
                        deleteProfileFromDB(currentProfileId); // Delete from DB
                        setProfiles(newProfiles);
                        if (newProfiles.length > 0) {
                          setCurrentProfileId(newProfiles[0].id);
                        } else {
                          setCurrentProfileId('main');
                        }
                        setIsEditScheduleModalOpen(false);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button
                  className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500"
                  onClick={() => {
                    let updatedProfile: ScheduleProfile | null = null;
                    setProfiles(prev => prev.map(p => {
                      if (p.id === currentProfileId) {
                        updatedProfile = { ...p, name: newScheduleTitle, subtitle: newScheduleSubtitle };
                        return updatedProfile;
                      }
                      return p;
                    }));
                    if (updatedProfile) saveProfileToDB(updatedProfile); // Save info update
                    setIsEditScheduleModalOpen(false);
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
              <h3 className="font-bold text-white">{editingSlot.slotIndex === -1 ? 'Add Class' : 'Edit Class'}</h3>
              <button onClick={() => setEditingSlot(null)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-[#13131a]">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Time</label>
                <input
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600 font-mono"
                  placeholder="e.g. 08:00-09:00"
                  value={editingSlot.slot.time || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, time: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Subject</label>
                <input
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                  placeholder="e.g. Mathematics"
                  value={editingSlot.slot.subject || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, subject: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Room / Teacher</label>
                <input
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                  placeholder="e.g. Room 101 (Mr. Smith)"
                  value={editingSlot.slot.room || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, room: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Color Class (Tailwind)</label>
                <input
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white/5 transition-all text-white placeholder-slate-600"
                  placeholder="e.g. bg-blue-600"
                  value={editingSlot.slot.color || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, color: e.target.value } })}
                />
                <div className="flex gap-2.5 mt-3 flex-wrap">
                  {['bg-blue-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-500', 'bg-violet-600', 'bg-slate-600', 'bg-teal-600', 'bg-indigo-600', 'bg-fuchsia-600', 'bg-[#0a0a0e]', 'bg-white/10'].map(c => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-full ${c} border border-white/20 ring-offset-2 ring-offset-[#13131a] hover:ring-2 ring-blue-500 transition-all ${editingSlot.slot.color === c ? 'ring-2' : ''}`}
                      onClick={() => setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, color: c } })}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                <input
                  type="checkbox"
                  id="isBreak"
                  className="w-5 h-5 text-blue-600 rounded bg-[#0a0a0e] border-white/20 focus:ring-blue-500 focus:ring-offset-[#13131a]"
                  checked={editingSlot.slot.isBreak || false}
                  onChange={(e) => setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, isBreak: e.target.checked } })}
                />
                <label htmlFor="isBreak" className="text-sm font-bold text-slate-300 cursor-pointer select-none tracking-wide">Mark as Break / Recess</label>
              </div>

              <div className="flex gap-3 pt-4">
                {editingSlot.slotIndex !== -1 && (
                  <button
                    className="flex-1 py-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
                    onClick={handleDeleteSlot}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button
                  className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500"
                  onClick={handleSaveSlot}
                >
                  <Save size={16} />
                  Save Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL STYLES FOR CALENDAR */}
      <style jsx global>{`
        .react-calendar { width: 100%; background: transparent; font-family: inherit; border: none; }
        .react-calendar__navigation button { color: #e2e8f0; font-size: 1.1rem; font-weight: bold; min-width: 44px; background: none; }
        .react-calendar__navigation button:disabled { background-color: transparent; }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus { background-color: rgba(255,255,255,0.05); border-radius: 8px; }
        .react-calendar__month-view__weekdays { text-transform: uppercase; font-weight: 700; font-size: 0.7em; color: #64748b; }
        .react-calendar__month-view__weekdays__weekday { padding: 0.5em; text-align: center; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
        .react-calendar__month-view__days { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; }
        .react-calendar__month-view__days__day--weekend { color: #f43f5e; }
        .react-calendar__month-view__days__day--neighboringMonth { color: #334155; }
        .react-calendar__tile { max-width: 100%; padding: 0.5em 0.5em; background: none; text-align: center; line-height: 16px; border-radius: 50%; color: #94a3b8; transition: all 0.2s; font-weight: 600; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; margin: 0 !important; }
        .react-calendar__tile:disabled { background-color: transparent; border-radius: 50%; }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus { background-color: rgba(255,255,255,0.05); border-radius: 50%; color: white; }
        .react-calendar__tile--now { background: rgba(59,130,246,0.1); border-radius: 50%; font-weight: bold; color: #3b82f6; }
        .react-calendar__tile--now:enabled:hover,
        .react-calendar__tile--now:enabled:focus { background: rgba(59,130,246,0.2); }
        .react-calendar__tile--hasActive { background: #3b82f6; border-radius: 50%; font-weight: bold; color: white!important; }
        .react-calendar__tile--hasActive:enabled:hover,
        .react-calendar__tile--hasActive:enabled:focus { background: #2563eb; }
        .react-calendar__tile--active { background: #3b82f6; border-radius: 50%; color: white!important; font-weight: bold; box-shadow: 0 4px 10px rgba(59,130,246,0.5); }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus { background: #2563eb; }
      `}</style>
    </div>
  );
}

