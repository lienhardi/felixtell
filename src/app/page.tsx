"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/config/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Models-Array mit 100 Platzhaltern
  const allModels = Array.from({ length: 100 }, (_, i) => ({ name: `Model ${i + 1}`, img: null }));
  const [modelsState, setModelsState] = useState(allModels);
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
  const handleTouchEnd = async (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping.current) return;
    setIsDragging(false);
    const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = endX - startX.current;
    
    if (diff > 60 || diff < -60) {
      const direction = diff > 60 ? 'right' : 'left';
      
      if (!user) {
        // Wenn nicht angemeldet, Swipe speichern und Anmeldung fordern
        const pendingSwipe = {
          model_name: modelsState[0]?.name,
          direction
        };
        localStorage.setItem('pendingSwipe', JSON.stringify(pendingSwipe));
        setShowBrandForm(true);
        setAuthMode('signup');
      } else {
        // Wenn angemeldet, Swipe in Supabase speichern
        const { error } = await supabase
          .from('swipes')
          .insert({
            brand_id: user.id,
            model_name: modelsState[0]?.name,
            direction
          });

        if (error) {
          console.error('Error saving swipe:', error);
        }

        // Bei Rechtsswipe Benachrichtigung senden
        if (direction === 'right') {
          await sendEmail(
            'family@felixtell.com',
            'New Match',
            `Brand ${user.email} matched with model ${modelsState[0]?.name}`
          );
        }
      }

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

  const sendEmail = async (to: string, subject: string, body: string) => {
    try {
      console.log('Sending email:', { to, subject, body });
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          reply_to: `"${to}" <${to}>`
        }),
      });
      
      console.log('Email API response status:', response.status);
      const responseData = await response.json();
      console.log('Email API response:', responseData);
      
      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status} ${JSON.stringify(responseData)}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactEmail) {
      await sendEmail(contactEmail, 'New Brand Inquiry', `Email: ${contactEmail}`);
      setContactEmail('');
      setShowContactForm(false);
    }
  };

  const handleBecomeModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (becomeModelEmail && becomeModelAge) {
      await sendEmail(becomeModelEmail, 'New Application', `Email: ${becomeModelEmail}, Age: ${becomeModelAge}`);
      setBecomeModelEmail('');
      setBecomeModelAge('');
      setShowBecomeModelForm(false);
    }
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
    const handleUp = async (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
      }
      const diff = clientX - startX.current;
      setIsDragging(false);
      
      if (diff > 60 || diff < -60) {
        const direction = diff > 60 ? 'right' : 'left';
        
        if (!user) {
          const pendingSwipe = {
            model_name: modelsState[0]?.name,
            direction
          };
          localStorage.setItem('pendingSwipe', JSON.stringify(pendingSwipe));
          setShowBrandForm(true);
          setAuthMode('signup');
        } else {
          const { error } = await supabase
            .from('swipes')
            .insert({
              brand_id: user.id,
              model_name: modelsState[0]?.name,
              direction
            });

          if (error) {
            console.error('Error saving swipe:', error);
          }

          if (direction === 'right') {
            await sendEmail(
              'family@felixtell.com',
              'New Match',
              `Brand ${user.email} matched with model ${modelsState[0]?.name}`
            );
          }
        }

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

  // Nach erfolgreicher Anmeldung/Registrierung den ausstehenden Swipe verarbeiten
  useEffect(() => {
    const processPendingSwipe = async () => {
      if (user) {
        const pendingSwipeStr = localStorage.getItem('pendingSwipe');
        if (pendingSwipeStr) {
          const pendingSwipe = JSON.parse(pendingSwipeStr);
          const { error } = await supabase
            .from('swipes')
            .insert({
              brand_id: user.id,
              model_name: pendingSwipe.model_name,
              direction: pendingSwipe.direction
            });

          if (error) {
            console.error('Error saving pending swipe:', error);
          }

          if (pendingSwipe.direction === 'right') {
            await sendEmail(
              'family@felixtell.com',
              'New Match',
              `Brand ${user.email} matched with model ${pendingSwipe.model_name}`
            );
          }

          localStorage.removeItem('pendingSwipe');
        }
      }
    };

    processPendingSwipe();
  }, [user]);

  // Beim User-Login: Geswipte Models filtern
  useEffect(() => {
    const fetchSwipedModels = async () => {
      if (user) {
        const { data: swipes, error } = await supabase
          .from('swipes')
          .select('model_name')
          .eq('brand_id', user.id);
        if (!error && swipes) {
          const swipedNames = new Set(swipes.map((s: any) => s.model_name));
          setModelsState(allModels.filter((m) => !swipedNames.has(m.name)));
        }
      } else {
        setModelsState(allModels);
      }
    };
    fetchSwipedModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) {
        setAuthError(error.message);
      } else {
        setShowBrandForm(false);
      }
    } else {
      try {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) {
          if (
            error.message.includes('duplicate key value') ||
            error.message.includes('users_email_partial_key')
          ) {
            setAuthError('This email address is already registered. Please log in or use another email address.');
          } else {
            setAuthError(error.message);
          }
        } else {
          setAuthError('Please check your email for the confirmation link.');
          setShowBrandForm(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail);
    if (error) {
      setForgotPasswordMessage('Error: ' + error.message);
    } else {
      setForgotPasswordMessage('If the email exists, a reset link has been sent.');
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-8"
      style={{
        background: `
          repeating-linear-gradient(
            135deg,
            #E8DCCE,
            #E8DCCE 36px,
            #F0C040 36px,
            #F0C040 38px,
            #F3EBDD 38px,
            #F3EBDD 76px
          )
        `
      }}
    >
      <div className="flex flex-col items-center mb-10 mt-4">
        <div className="w-full flex justify-center">
        <Image
            src="/Felix_Tell_logo.png"
            alt="Felix Tell Artists' Bureau 1842"
            width={420}
            height={300}
            style={{ maxWidth: '100%', height: 'auto' }}
          priority
        />
        </div>
      </div>
      <div className="elegant-divider"></div>
      <h2 className="text-4xl sm:text-5xl elegant-heading text-black mb-4 mt-3 text-center">
        Authentic talent. Timeless values.
      </h2>
      <p
        className="text-2xl sm:text-3xl"
        style={{
          color: "#3a2e1a",
          lineHeight: 1.6,
          maxWidth: 600,
          margin: "0 auto 2.5rem auto",
          textAlign: "center",
          fontWeight: 500,
          letterSpacing: "0.01em"
        }}
      >
        Discover your match.
      </p>
      
      {!user && (
        <div className="w-full flex justify-center mb-10">
          <button
            onClick={() => setShowBrandForm(true)}
            className="px-8 py-4 rounded-full bg-white/90 text-[var(--gold)] border border-[var(--gold)] font-semibold text-xl shadow-lg hover:bg-[var(--gold)] hover:text-white transition-all duration-300 hover:shadow-xl"
            style={{ minWidth: '180px', fontSize: '1.35rem' }}
          >
            Brand Login / Signup
          </button>
        </div>
      )}

      <div className="flex flex-col items-center mb-4" style={{position: 'relative', width: '18rem', height: '26rem'}}>
        {modelsState.length > 0 && !justRemoved && !showBecomeModelForm && (
          <div
            ref={swipeRef}
            className={`w-72 h-[26rem] bg-gray-100 flex flex-col items-center justify-between rounded-xl shadow-xl border border-[#E5C76B] mb-4 select-none p-6`}
            style={{ transform: `translateX(${dragX}px)` }}
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            onMouseMove={isDragging ? handleTouchMove : undefined}
            onTouchMove={isDragging ? handleTouchMove : undefined}
          >
            <span className="text-gray-600 font-medium text-2xl mt-4">{modelsState[0]?.name}</span>
            <div className="flex justify-center gap-10 mb-4 mt-auto">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-500 text-2xl shadow-lg hover:bg-red-200 transition-all duration-300 hover:shadow-xl"
                onClick={async () => {
                  const direction = 'left';
                  if (!user) {
                    const pendingSwipe = {
                      model_name: modelsState[0]?.name,
                      direction
                    };
                    localStorage.setItem('pendingSwipe', JSON.stringify(pendingSwipe));
                    setShowBrandForm(true);
                    setAuthMode('signup');
                  } else {
                    const { error } = await supabase
                      .from('swipes')
                      .insert({
                        brand_id: user.id,
                        model_name: modelsState[0]?.name,
                        direction
                      });
                    if (error) {
                      console.error('Error saving swipe:', error);
                    }
                  }
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
                className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-500 text-2xl shadow-lg hover:bg-green-200 transition-all duration-300 hover:shadow-xl"
                onClick={async () => {
                  const direction = 'right';
                  if (!user) {
                    const pendingSwipe = {
                      model_name: modelsState[0]?.name,
                      direction
                    };
                    localStorage.setItem('pendingSwipe', JSON.stringify(pendingSwipe));
                    setShowBrandForm(true);
                    setAuthMode('signup');
                  } else {
                    const { error } = await supabase
                      .from('swipes')
                      .insert({
                        brand_id: user.id,
                        model_name: modelsState[0]?.name,
                        direction
                      });
                    if (error) {
                      console.error('Error saving swipe:', error);
                    }
                    await sendEmail(
                      'family@felixtell.com',
                      'New Match',
                      `Brand ${user.email} matched with model ${modelsState[0]?.name}`
                    );
                  }
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

      {!user && (
        <>
          <div className="flex items-center w-full justify-center mb-4">
            <div className="w-24 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-lg font-medium mx-4">or</span>
            <div className="w-24 h-px bg-gray-300"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 mb-10">
            <button
              className="px-10 py-4 bg-[var(--gold)] text-white rounded-full text-xl font-semibold shadow-lg hover:bg-[var(--gold-light)] hover:text-[var(--gold)] transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              onClick={openBecomeModelForm}
              style={{ fontSize: '1.35rem', minWidth: '200px' }}
            >
              Become a Model
            </button>
          </div>
        </>
      )}

      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            {user ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (contactEmail.trim()) {
                    await sendEmail(
                      'family@felixtell.com',
                      'Brand Contact Message',
                      `Message from ${user.email}: ${contactEmail}`
                    );
                    setContactEmail('');
                    setShowContactForm(false);
                  }
                }}
              >
                <p className="mb-2 text-gray-700">
                  We will get back to you as soon as possible at your email address.
                </p>
                <textarea
                  className="border p-2 w-full mb-4 rounded"
                  placeholder="Your message"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  rows={4}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[var(--gold)] text-white rounded">Send</button>
                  <button type="button" className="px-4 py-2 bg-gray-300 text-black rounded" onClick={() => setShowContactForm(false)}>Close</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleContactSubmit}>
                <p>Please enter your email address or phone number <span className="text-gray-400">(for WhatsApp)</span>:</p>
                <input
                  type="text"
                  className="border p-2 w-full mb-4"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-[var(--gold)] text-white rounded">Send</button>
                  <button type="button" className="px-4 py-2 bg-gray-300 text-black rounded" onClick={() => setShowContactForm(false)}>Close</button>
                </div>
              </form>
            )}
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
            {!showForgotPassword ? (
              <>
                <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    className="border p-2 rounded"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 rounded"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    required
                  />
                  {authError && <div className="text-red-500 text-sm">{authError}</div>}
                  <button
                    type="submit"
                    className="bg-[var(--gold)] text-white rounded px-4 py-2 font-semibold"
                  >
                    {authMode === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      className="mt-2 text-sm text-[var(--gold)] underline hover:text-black transition"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  )}
                </form>
                <div className="flex flex-col gap-2 mt-6 w-full">
                  <button
                    type="button"
                    className="w-full py-2 rounded-full border border-[var(--gold)] bg-white text-[var(--gold)] text-sm font-medium transition hover:bg-[var(--gold)] hover:text-white focus:outline-none"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  >
                    {authMode === 'login' ? 'No account? Sign up' : 'Already have an account? Login'}
                  </button>
                  <button
                    type="button"
                    className="w-full py-2 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-sm font-medium transition hover:bg-gray-200 focus:outline-none"
                    onClick={() => setShowBrandForm(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-3">
                  <input type="email" placeholder="Email for reset link" className="border p-2 rounded" value={forgotPasswordEmail} onChange={e => setForgotPasswordEmail(e.target.value)} required />
                  <button type="submit" className="bg-[var(--gold)] text-white rounded px-4 py-2 font-semibold">Send reset link</button>
                </form>
                {forgotPasswordMessage && <div className="mt-2 text-green-600 text-sm">{forgotPasswordMessage}</div>}
                <button className="mt-4 text-sm text-gray-500 underline hover:text-gray-700" onClick={() => setShowForgotPassword(false)}>Back to login</button>
              </>
            )}
          </div>
        </div>
      )}

      {user && (
        <div className="mb-8 px-6 py-4 rounded-xl shadow-lg bg-white flex flex-col items-center border border-[#E5C76B] w-72" style={{boxShadow: '0 4px 24px 0 rgba(246,211,101,0.10)'}}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F6D365"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#222" fontWeight="bold">@</text></svg>
            <span className="font-medium text-gray-700">Logged in as</span>
          </div>
          <div className="font-semibold text-lg text-black mb-3 break-all text-center">{user.email}</div>
          <button
            className="px-5 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}

      <div className="mb-12 mt-0 pt-0 flex flex-col items-center w-full">
        <button
          className="px-8 py-3 rounded-full bg-white/90 text-[var(--gold)] border border-[var(--gold)] font-semibold text-xl shadow-lg hover:bg-[var(--gold)] hover:text-white transition-all duration-300 hover:shadow-xl mb-4"
          style={{ minWidth: '180px', fontSize: '1.25rem' }}
          onClick={openContactForm}
        >
          Contact
        </button>
        <div className="w-32 my-8 border-t border-gray-300"></div>
        <Link
          href="/about"
          className="text-gray-500 hover:text-[var(--gold)] transition-colors duration-300 text-lg font-medium tracking-wide"
          style={{ textAlign: 'center' }}
        >
          About Felix Tell
        </Link>
      </div>
    </div>
  );
}
