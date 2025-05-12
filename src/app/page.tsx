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
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
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
  const [showSplash, setShowSplash] = useState(true);
  const [hasLoadedLogo, setHasLoadedLogo] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [shouldStartAnimation, setShouldStartAnimation] = useState(false);
  const [showRejectedModels, setShowRejectedModels] = useState(false);
  const [rejectedModels, setRejectedModels] = useState<{name: string, id?: string}[]>([]);

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

  // Warte auf vollständiges Laden der Seite
  useEffect(() => {
    if (document.readyState === 'complete') {
      // Wenn die Seite bereits vollständig geladen ist
      setIsPageLoaded(true);
      // Verzögere den Start der Animation um 100ms
      setTimeout(() => {
        setShouldStartAnimation(true);
      }, 100);
    } else {
      // Warte auf vollständiges Laden
      const handleLoad = () => {
        setIsPageLoaded(true);
        // Verzögere den Start der Animation um 100ms
        setTimeout(() => {
          setShouldStartAnimation(true);
        }, 100);
      };
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Splash-Logik: Nur dieser eine useEffect
  useEffect(() => {
    if (!isPageLoaded) return;

    const fromAbout = typeof window !== "undefined" && sessionStorage.getItem("fromAbout") === "1";
    const isFromAbout = document.referrer.includes('/about') || fromAbout;

    if (isFromAbout) {
      setShowSplash(false);
      if (fromAbout) sessionStorage.removeItem("fromAbout");
    } else {
      const timeout = setTimeout(() => {
        setShowSplash(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isPageLoaded]);

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
    if (contactEmail && contactMessage) {
      const success = await sendEmail(
        'family@felixtell.com', 
        'New Brand Inquiry', 
        `Email: ${contactEmail}\n\nMessage: ${contactMessage}`
      );
      
      if (success) {
        setContactSuccess(true);
        
        // Zurücksetzen nach 3 Sekunden
        setTimeout(() => {
          setContactEmail('');
          setContactMessage('');
          setContactSuccess(false);
          setShowContactForm(false);
        }, 3000);
      }
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

  // Funktion zum Abrufen der abgelehnten Models (Linksswipes)
  const fetchRejectedModels = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('swipes')
      .select('id, model_name')
      .eq('brand_id', user.id)
      .eq('direction', 'left');
    
    if (error) {
      console.error('Error fetching rejected models:', error);
      return;
    }
    
    if (data) {
      setRejectedModels(data.map(swipe => ({
        name: swipe.model_name,
        id: swipe.id
      })));
    }
  };

  // Funktion zum Wiederherstellen eines abgelehnten Models
  const restoreRejectedModel = async (modelId: string, modelName: string) => {
    if (!user) return;
    
    // Lösche den Swipe aus der Datenbank
    const { error } = await supabase
      .from('swipes')
      .delete()
      .eq('id', modelId);
    
    if (error) {
      console.error('Error restoring model:', error);
      return;
    }
    
    // Aktualisiere die Liste der abgelehnten Models
    setRejectedModels(prev => prev.filter(model => model.id !== modelId));
    
    // Füge das Model wieder zum modelsState hinzu
    const modelToAdd = allModels.find(m => m.name === modelName);
    if (modelToAdd) {
      setModelsState(prev => [modelToAdd, ...prev]);
    }
  };

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
    <>
      {showSplash && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50, background: '#E8DCCE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.18s',
            opacity: showSplash ? 1 : 0
          }}
        >
          <svg width="320" height="180" viewBox="0 0 320 180" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="gold-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F0C040" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#BFA14A" />
              </linearGradient>
            </defs>
            {/* Body links bis zum linken Rand des Suchers */}
            <path
              d="
                M100,140
                Q85,140 85,120
                L85,80
                Q85,65 120,65
                L135,65
                L145,50
                L151,50
              "
              stroke="url(#gold-gradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: 180,
                strokeDashoffset: 180,
                animation: shouldStartAnimation ? 'drawBodyLeft 0.8s linear forwards' : 'none'
              }}
            />
            {/* Body rechts ab RECHTEM Rand des Suchers, läuft deutlich weiter nach links */}
            <path
              d="
                M169,50
                L175,50
                L185,65
                L200,65
                Q235,65 235,80
                L235,120
                Q235,140 220,140
                L100,140
              "
              stroke="url(#gold-gradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: 280,
                strokeDashoffset: 280,
                animation: shouldStartAnimation ? 'drawBodyRight 0.8s linear forwards' : 'none'
              }}
            />
            {/* Sucher exakt zwischen Body-Segmenten */}
            <rect
              x="151" y="40" width="18" height="14" rx="3"
              stroke="url(#gold-gradient)"
              strokeWidth="2.5"
              fill="none"
              style={{
                strokeDasharray: 64,
                strokeDashoffset: 64,
                animation: shouldStartAnimation ? 'drawFinder 0.8s linear forwards' : 'none'
              }}
            />
            {/* Objektiv */}
            <path
              d="
                M 178.4,81.6
                A 26,26 0 1,1 141.6,118.4
                A 26,26 0 1,1 178.4,81.6
              "
              stroke="url(#gold-gradient)"
              strokeWidth="2.5"
              fill="none"
              style={{
                strokeDasharray: 163.36,
                strokeDashoffset: 163.36,
                animation: shouldStartAnimation ? 'drawLens 0.8s linear forwards' : 'none'
              }}
            />
            {/* Blitz */}
            <circle
              cx="160" cy="34" r="9"
              fill="#fffbe6"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="0.08s"
                begin="0.9s"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                from="1"
                to="0"
                dur="0.25s"
                begin="0.98s"
                fill="freeze"
              />
              <animate
                attributeName="r"
                from="9"
                to="18"
                dur="0.25s"
                begin="0.98s"
                fill="freeze"
              />
            </circle>
            {/* Optional: Auslöser rechts oben */}
            <rect
              x="210" y="60" width="8" height="5" rx="2"
              stroke="url(#gold-gradient)"
              strokeWidth="2"
              fill="none"
              style={{
                strokeDasharray: 20,
                strokeDashoffset: 20,
                animation: 'drawKnob 0.3s linear 0.8s forwards'
              }}
            />
          </svg>
          <style>
            {`
              @keyframes drawBodyLeft {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawBodyRight {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawLens {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawFinder {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawKnob {
                to { stroke-dashoffset: 0; }
              }
            `}
          </style>
        </div>
      )}

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
          <div className="w-full flex justify-center" style={{ minHeight: 180 }}>
            <Image
              src="/Felix_Tell_logo.png"
              alt="Felix Tell Artists' Bureau 1842"
              width={420}
              height={180}
              style={{ maxWidth: '100%', height: 'auto' }}
              priority
            />
          </div>
        </div>
        <div className="elegant-divider"></div>
        <h2 className="text-4xl sm:text-5xl elegant-heading text-black mb-2 mt-8 text-center">
        Shine. Profit.
        </h2>
        <p
          className="text-2xl sm:text-3xl"
          style={{
            color: "#3a2e1a",
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto 1.5rem auto",
            textAlign: "center",
            fontWeight: 500,
            letterSpacing: "0.01em"
          }}
        >
          Win-Win.
        </p>
        
        {!user && (
          <div className="w-full flex justify-center mb-9">
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
              <div className="w-24 h-px" style={{ background: "#cccccc" }}></div>
              <span className="text-gray-500 text-lg font-medium mx-4">or</span>
              <div className="w-24 h-px" style={{ background: "#cccccc" }}></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 mb-11 mt-3">
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
              {contactSuccess ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-3xl mb-2">✓</div>
                  <p className="text-lg font-medium text-gray-800 mb-2">Message sent successfully!</p>
                  <p className="text-gray-600">We'll get back to you as soon as possible.</p>
                </div>
              ) : user ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (contactMessage.trim()) {
                      const success = await sendEmail(
                        'family@felixtell.com',
                        'Brand Contact Message',
                        `Message from ${user.email}: ${contactMessage}`
                      );
                      
                      if (success) {
                        setContactSuccess(true);
                        setTimeout(() => {
                          setContactMessage('');
                          setContactSuccess(false);
                          setShowContactForm(false);
                        }, 3000);
                      }
                    }
                  }}
                >
                  <p className="mb-2 text-gray-700">
                    We will get back to you as soon as possible at your email address.
                  </p>
                  <textarea
                    className="border p-2 w-full mb-4 rounded"
                    placeholder="Your message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
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
                  <p className="mb-2 text-gray-700">Please enter your email address:</p>
                  <input
                    type="email"
                    className="border p-2 w-full mb-4 rounded"
                    placeholder="Your email address"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                  <p className="mb-2 text-gray-700">Your message:</p>
                  <textarea
                    className="border p-2 w-full mb-4 rounded"
                    placeholder="How can we help you?"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-sm text-gray-600 mb-4">We'll get back to you as soon as possible.</p>
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
              className="px-5 py-2 rounded-full bg-white text-gray-600 border border-gray-300 text-sm font-medium shadow hover:bg-gray-100 transition"
              onClick={() => {
                setShowRejectedModels(true);
                fetchRejectedModels();
              }}
            >
              View Rejected Models
            </button>
            <button
              className="mt-3 px-5 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}

        {/* Dialog für abgelehnte Models */}
        {showRejectedModels && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Rejected Models</h2>
                <button 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                  onClick={() => setShowRejectedModels(false)}
                >
                  ×
                </button>
              </div>
              
              {rejectedModels.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No rejected models found.</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {rejectedModels.map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <span className="font-medium">{model.name}</span>
                      <button
                        className="px-3 py-1 rounded-full text-sm bg-white text-[var(--gold)] border border-[var(--gold)] font-medium hover:bg-[var(--gold)] hover:text-white transition"
                        onClick={() => model.id && restoreRejectedModel(model.id, model.name)}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-12 mt-0 pt-0 flex flex-col items-center w-full">
          <div className="w-full h-px bg-[#cccccc] mb-11"></div>
          <button
            className="px-8 py-3 rounded-full bg-white/90 text-[var(--gold)] border border-[var(--gold)] font-semibold text-xl shadow-lg hover:bg-[var(--gold)] hover:text-white transition-all duration-300 hover:shadow-xl mb-2"
            style={{ minWidth: '180px', fontSize: '1.25rem' }}
            onClick={openContactForm}
          >
            Contact
          </button>
          <div className="w-32 my-8 border-t" style={{ borderColor: "#cccccc" }}></div>
          <Link
            href="/about"
            className="text-gray-500 hover:text-[var(--gold)] transition-colors duration-300 text-lg font-medium tracking-wide"
            style={{ textAlign: 'center', marginBottom: '-3rem' }}
          >
            About Felix Tell
          </Link>
        </div>
    </div>
    </>
  );
}
