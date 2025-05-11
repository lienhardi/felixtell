"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createClient, User } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gzlaxsumaorevaxyswoc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bGF4c3VtYW9yZXZheHlzd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4ODAzMjQsImV4cCI6MjA2MjQ1NjMyNH0.3yVwPjm4wDpHPCvVbKoG-8-Tr_pw8vz0XZ8hkMxMKa8'
);

export default function Home() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBecomeModelForm, setShowBecomeModelForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [becomeModelEmail, setBecomeModelEmail] = useState('');
  const [becomeModelAge, setBecomeModelAge] = useState('');
  const [userType, setUserType] = useState<'talent' | 'brand' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const models = [
    { name: 'Model 1', img: null },
    { name: 'Model 2', img: null },
    { name: 'Model 3', img: null },
    { name: 'Model 4', img: null },
  ];
  const [modelsState, setModelsState] = useState(models);
  const [currentModel, setCurrentModel] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<null | 'left' | 'right'>(null);

  const swipeRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isSwiping = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [justRemoved, setJustRemoved] = useState(false);
  const [pendingModelRemove, setPendingModelRemove] = useState<null | number>(null);
  const [readyToRemove, setReadyToRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Vereinfachte Swipe-Logik: immer nur das erste Model anzeigen
  const handleRemoveModel = () => {
    setModelsState((prev) => prev.slice(1));
    setDragX(0);
  };

  // handleTouchEnd muss angepasst werden:
  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping.current) return;
    setIsDragging(false);
    const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = endX - startX.current;
    if (diff > 60 || diff < -60) {
      setModelsState((prev) => prev.slice(1));
      setDragX(0);
      setSwipeDirection(null);
      setJustRemoved(true);
      setTimeout(() => setJustRemoved(false), 0);
    } else {
      setDragX(0);
    }
    isSwiping.current = false;
  };

  useEffect(() => {
    if (!justRemoved) return;
    const timeout = setTimeout(() => setJustRemoved(false), 0);
    return () => clearTimeout(timeout);
  }, [justRemoved]);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isSwiping.current = true;
    setIsDragging(true);
    startX.current = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
  };

  const openContactForm = () => {
    setShowContactForm(true);
  };

  const openBecomeModelForm = () => {
    setShowBecomeModelForm(true);
  };

  const sendEmail = (to: string, subject: string, body: string) => {
    // Email logic placeholder
    console.log(`E-Mail an ${to} gesendet: ${subject} - ${body}`);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmail('felixtell123@gmail.com', 'New Brand Inquiry', `Email: ${contactEmail}`);
    setShowContactForm(false);
  };

  const handleBecomeModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmail('felixtell123@gmail.com', 'New Application', `Email: ${becomeModelEmail}, Age: ${becomeModelAge}`);
    setShowBecomeModelForm(false);
  };

  // handleTouchMove wieder aktivieren:
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping.current) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = currentX - startX.current;
    setDragX(diff);
  };

  // Globale Drag-Events für echtes Swipen
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
      }
      const diff = clientX - startX.current;
      setDragX(diff);
    };
    const handleUp = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
      }
      const diff = clientX - startX.current;
      setIsDragging(false);
      if (diff > 60 || diff < -60) {
        setModelsState((prev) => prev.slice(1));
        setDragX(0);
        setSwipeDirection(null);
        setJustRemoved(true);
      } else {
        setDragX(0);
      }
      isSwiping.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!justRemoved) return;
    const timeout = setTimeout(() => setJustRemoved(false), 0);
    return () => clearTimeout(timeout);
  }, [justRemoved]);

  // Supabase Auth
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
    } else {
      try {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) {
          if (error.message.includes('duplicate key value') || error.message.includes('users_email_partial_key')) {
            setAuthError('Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail-Adresse.');
          } else {
            setAuthError(error.message);
          }
        } else {
          setAuthError('Bitte überprüfen Sie Ihre E-Mails für den Bestätigungslink.');
        }
      } catch (err) {
        setAuthError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-blue-50">
      <div className="flex flex-col items-center mb-12 mt-6 shadow-lg rounded-xl overflow-hidden border-2 border-[var(--gold)] bg-white">
        <div className="bg-[var(--gold)] w-full px-8 py-5 flex flex-col items-center">
          <h1 className="text-5xl font-bold font-playfair text-white tracking-wider drop-shadow">Felix Tell</h1>
        </div>
        <div className="bg-black w-full px-8 py-3 flex flex-col items-center">
          <p className="text-2xl font-playfair text-white tracking-wide drop-shadow">Talents for Brands</p>
        </div>
      </div>
      <div className="border-t-2 border-[var(--gold)] w-24 mx-auto my-4"></div>
      <h2 className="text-3xl font-playfair text-black mb-2">Become Partners</h2>
      <p className="text-lg text-black mb-8">You need each other, swipe right!</p>
      <div className="w-full flex justify-center mb-8">
        <button
          onClick={() => setShowBrandForm(true)}
          className="px-4 py-1 rounded-full bg-white/80 text-[var(--gold)] border border-[var(--gold)] font-medium text-sm shadow-none hover:bg-[var(--gold)] hover:text-white transition-colors"
          style={{minWidth: '110px'}}>
          Brand Login / Register
        </button>
      </div>
      <div className="flex flex-col items-center mb-4" style={{position: 'relative', width: '16rem', height: '20rem'}}>
        {modelsState.length > 0 && !justRemoved && !showBecomeModelForm && (
          <div
            ref={swipeRef}
            className={`w-64 h-80 bg-gray-100 flex flex-col items-center justify-between rounded-xl shadow-md border border-gray-200 mb-4 select-none z-10 p-6`}
            style={{ transform: `translateX(${dragX}px)` }}
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            onMouseMove={isDragging ? handleTouchMove : undefined}
            onTouchMove={isDragging ? handleTouchMove : undefined}
          >
            <span className="text-gray-600 font-medium text-xl mt-4">{modelsState[0]?.name}</span>
            <div className="flex justify-center gap-8 mb-2 mt-auto">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-500 text-2xl shadow hover:bg-red-200 transition-colors"
                onClick={() => {
                  setModelsState((prev) => prev.slice(1));
                  setDragX(0);
                  setSwipeDirection(null);
                  setJustRemoved(true);
                }}
                aria-label="Dislike"
              >
                &#10006;
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl shadow hover:bg-green-200 transition-colors"
                onClick={() => {
                  setModelsState((prev) => prev.slice(1));
                  setDragX(0);
                  setSwipeDirection(null);
                  setJustRemoved(true);
                }}
                aria-label="Like"
              >
                &#10004;
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center w-full justify-center mb-4">
        <span className="text-gray-400 text-lg font-semibold">or</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <button className="px-8 py-3 bg-[var(--gold)] text-white rounded-full text-lg font-semibold shadow hover:bg-[var(--gold-light)] hover:text-[var(--gold)] transition-colors duration-200" onClick={openBecomeModelForm}>
          Become a Model
        </button>
      </div>

      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded">
            <h2 className="text-2xl font-bold mb-4">Book a Talent</h2>
            <form onSubmit={handleContactSubmit}>
              <p>Please enter your email address or phone number:</p>
              <input type="text" className="border p-2 w-full mb-4" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <button type="submit" className="px-4 py-2 bg-[var(--gold)] text-white rounded">Send</button>
              <button type="button" className="px-4 py-2 bg-gray-300 text-black rounded ml-2" onClick={() => setShowContactForm(false)}>Close</button>
            </form>
          </div>
        </div>
      )}

      {showBecomeModelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded">
            <h2 className="text-2xl font-bold mb-4">Become a Model</h2>
            <form onSubmit={handleBecomeModelSubmit}>
              <p>Please enter your email address or phone number:</p>
              <input type="text" className="border p-2 w-full mb-4" value={becomeModelEmail} onChange={(e) => setBecomeModelEmail(e.target.value)} />
              <p>Age:</p>
              <input type="number" className="border p-2 w-full mb-4" value={becomeModelAge} onChange={(e) => setBecomeModelAge(e.target.value)} />
              <p>Upload photos:</p>
              <input type="file" className="mb-4" />
              <button type="submit" className="px-4 py-2 bg-[var(--gold)] text-white rounded">Send</button>
              <button type="button" className="px-4 py-2 bg-gray-300 text-black rounded ml-2" onClick={() => setShowBecomeModelForm(false)}>Close</button>
            </form>
          </div>
        </div>
      )}

      {showBrandForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow flex flex-col items-center max-w-xs w-full">
            <h2 className="text-2xl font-bold mb-4">{authMode === 'login' ? 'Brand Login' : 'Brand Signup'}</h2>
            <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
              <input type="email" placeholder="E-Mail" className="border p-2 rounded" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
              <input type="password" placeholder="Password" className="border p-2 rounded" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
              {authError && <div className="text-red-500 text-sm">{authError}</div>}
              <button type="submit" className="bg-[var(--gold)] text-white rounded px-4 py-2 font-semibold">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
            </form>
            <button className="mt-2 text-sm text-gray-500 underline" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'No account? Sign up' : 'Already have an account? Login'}
            </button>
            <button className="mt-4 text-sm text-gray-500 underline" onClick={() => setShowBrandForm(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Nach Login: Begrüßung und Logout */}
      {user && (
        <div className="mb-8 w-full max-w-xs bg-white p-4 rounded shadow flex flex-col items-center">
          <span className="mb-2">Logged in as <b>{user.email}</b></span>
          <button className="bg-gray-300 text-black rounded px-4 py-2 font-semibold" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}
