"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/config/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import fs from 'fs';
import path from 'path';

// Define the model images path
const MODEL_IMAGES_PATH = '/models/2025-05-21';

// Helper function to get a deterministic image for a model name
const getModelImage = (modelName: string, availableImages: string[]) => {
  if (!availableImages || availableImages.length === 0) {
    return ''; // Return empty string if no images available
  }

  // Use the model name as a seed for consistent image selection
  const hash = modelName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Get a deterministic index into the available images array
  const imageIndex = hash % availableImages.length;
  return availableImages[imageIndex];
};

export default function Home() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBecomeModelForm, setShowBecomeModelForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [becomeModelEmail, setBecomeModelEmail] = useState('');
  const [becomeModelAge, setBecomeModelAge] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileUploadStatus, setFileUploadStatus] = useState('');
  const [userType, setUserType] = useState<'talent' | 'brand' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
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
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const processingSwipeRef = useRef(false);
  const swipeLockRef = useRef(false);
  const swipeHandledRef = useRef(false);

  // State for available images
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // cancelledPendingSwipe als number statt boolean:
  const [cancelledPendingSwipe, setCancelledPendingSwipe] = useState(0);

  // State for showBrandFormRequested
  const [showBrandFormRequested, setShowBrandFormRequested] = useState(false);

  // Globale Listener-Refs
  const globalMoveListener = useRef<((e: any) => void) | null>(null);
  const globalUpListener = useRef<((e: any) => void) | null>(null);

  // PATCH: Model erst entfernen, wenn das neue Bild geladen ist
  const [modelImageLoaded, setModelImageLoaded] = useState(true);

  // PATCH: fetchSwipedModels blockieren, wenn modelsState aus Storage geladen wurde
  const modelsStateRestoredRef = useRef(false);

  // Helper function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = <T extends unknown>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load the available images from the API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/model-images');
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        const data = await response.json();
        if (data.images && Array.isArray(data.images)) {
          // Deduplizieren
          const uniqueImages = Array.from(new Set(data.images)) as string[];
          setAvailableImages(uniqueImages);
          setImagesLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching model images:', error);
      }
    };
    fetchImages();
  }, []);

  // PATCH: createModels wieder einfügen (jetzt im Scope der Home-Komponente)
  const createModels = useCallback(() => {
    if (!imagesLoaded || availableImages.length === 0) {
      return [];
    }
    if (user) {
      // Jedes Bild exakt einmal als Model
      const models = availableImages.map((img, i) => ({
        id: i + 1,
        name: `Model ${i + 1}`,
        img,
        availableImagesCount: availableImages.length
      }));
      return shuffleArray(models);
    }
    // Gäste: sessionStorage wie gehabt
    const storedModels = sessionStorage.getItem('felixtell_models');
    if (storedModels) {
      try {
        const parsedModels = JSON.parse(storedModels);
        const storedImageCount = parsedModels.length > 0 ?
          parsedModels[0].availableImagesCount || 0 : 0;
        if (storedImageCount === availableImages.length) {
          return parsedModels;
        }
      } catch (e) {
        console.error('Error parsing stored models:', e);
      }
    }
    const models = availableImages.map((img, i) => ({
      id: i + 1,
      name: `Model ${i + 1}`,
      img,
      availableImagesCount: availableImages.length
    }));
    const shuffledModels = shuffleArray(models);
    try {
      sessionStorage.setItem('felixtell_models', JSON.stringify(shuffledModels));
    } catch (e) {
      console.error('Error storing models in session storage:', e);
    }
    return shuffledModels;
  }, [imagesLoaded, availableImages, user]);

  // NEU: Initialisierung nur einmal pro User/Bildset
  const modelsInitializedRef = useRef<{userId: string|null, imageCount: number}|null>(null);
  useEffect(() => {
    const userId = user?.id || null;
    const imageCount = availableImages.length;
    if (!imagesLoaded || imageCount === 0) return;
    if (
      modelsInitializedRef.current &&
      modelsInitializedRef.current.userId === userId &&
      modelsInitializedRef.current.imageCount === imageCount
    ) {
      return; // Schon initialisiert für diese Session
    }
    const initialModels = createModels();
    setAllModels(initialModels);
    setModelsState(initialModels);
    modelsInitializedRef.current = {userId, imageCount};
  }, [imagesLoaded, availableImages, user, createModels]);

  // Models-Array - lädt bestehende oder generiert neue
  const [allModels, setAllModels] = useState<{id: number, name: string, img: string}[]>([]);
  const [modelsState, setModelsState] = useState<{id: number, name: string, img: string}[]>([]);
  const [currentModel, setCurrentModel] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<null | 'left' | 'right'>(null);

  // Fetch swiped models to filter them out
  const fetchSwipedModels = async () => {
    if (user) {
      const { data: swipes, error } = await supabase
        .from('swipes')
        .select('image_name')
        .eq('brand_id', user.id);
      if (!error && swipes) {
        const swipedImages = new Set(swipes.map((s: any) => s.image_name));
        const filtered = allModels.filter((m) => !swipedImages.has(m.img));
        setModelsState(filtered);
        return filtered;
      } else {
        setModelsState(allModels);
        return allModels;
      }
    } else {
      setModelsState(allModels);
      return allModels;
    }
  };

  // PATCH: fetchSwipedModels für eingeloggte User immer aufrufen, für Gäste nur wenn modelsStateRestoredRef false ist
  useEffect(() => {
    if (user) {
      if (allModels.length > 0) fetchSwipedModels();
      return;
    }
    if (allModels.length > 0 && !modelsStateRestoredRef.current) {
      fetchSwipedModels();
    }
  }, [user, allModels]);

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

  // Hilfsfunktion: Swipe als Gast in pending_swipes speichern
  const savePendingSwipe = async (email: string, imageName: string, direction: string) => {
    if (!email) return;
    await supabase.from('pending_swipes').insert({
      email,
      image_name: imageName,
      direction
    });
  };

  // recordSwipe anpassen
  const recordSwipe = async (modelName: string, direction: string, imageNameOverride?: string) => {
    const imageName = imageNameOverride || modelsState[0]?.img || '';
    console.log('[recordSwipe] called', {modelName, direction, user, showBrandForm, isProcessingSwipe, processingSwipeRef: processingSwipeRef.current, modelsState: modelsState.map(m=>m.name)});
    
    // Combined check for existing processing or brand form open
    if (processingSwipeRef.current || (showBrandForm && user)) { // Allow if showBrandForm is true but user is null (initial swipe)
      console.log('Preventing duplicate swipe processing or form is open inappropriately', {isProcessingSwipe, processingSwipeRef: processingSwipeRef.current, cancelledPendingSwipe, showBrandForm, user});
      // Ensure flags are reset if we exit early due to form being open with a user
      if (showBrandForm && user) {
          setIsProcessingSwipe(false);
          processingSwipeRef.current = false;
      }
      return;
    }

    setIsProcessingSwipe(true);
    processingSwipeRef.current = true;

    try {
        if (!user) {
        // Gast: Swipes direkt in pending_swipes speichern
        if (direction === 'right' || direction === 'left') {
          await savePendingSwipe(authEmail, imageName, direction);
          if (direction === 'right' && !showBrandFormRequested) {
            setShowBrandFormRequested(true);
            setAuthMode('login');
            setAuthSuccess('');
            setAuthError('');
            setShowBrandForm(true);
          }
        }
        setTimeout(() => {
          setIsProcessingSwipe(false);
          processingSwipeRef.current = false;
        }, 100);
        return;
      }

      // Logged-in user logic from here
      // First check if this swipe already exists to avoid duplicates
      console.log('[DB INSERT DEBUG]', {
        user,
        userId: user.id,
        imageName,
        modelName,
        direction
      });
      const { data: existingSwipes, error: existingError } = await supabase
        .from('swipes')
        .select('*') // ALLE Felder loggen
        .eq('brand_id', user.id)
        .eq('image_name', imageName);
      console.log('[DB EXISTING SWIPES]', { existingSwipes, existingError, query: { brand_id: user.id, image_name: imageName } });
      if (existingError) {
        console.error('[DB EXISTING ERROR]', existingError);
      }
      if (!existingSwipes || existingSwipes.length === 0) {
        const { data: insertData, error: insertError } = await supabase
          .from('swipes')
          .insert({
            brand_id: user.id,
            model_name: modelName,
            direction,
            image_name: imageName
          })
          .select();
        console.log('[DB INSERT RESULT]', { insertData, insertError });
        if (insertError) {
          console.error('DB INSERT ERROR', insertError);
        } else {
          console.log('DB INSERT OK', {modelName, direction, user});
          if (direction === 'right') {
            // E-Mail-Versand asynchron, nicht blockierend
            sendEmail(
              'family@felixtell.com',
              'New Match',
              `Brand ${user.email} matched with model ${modelName}\nImage: ${imageName}\nDirektlink: https://felixtell.com${imageName}`
            );
          }
          // Nach jedem Swipe für eingeloggte User: Deck neu filtern
          await fetchSwipedModels();
        }
      } else {
        console.log(`Swipe already exists for ${imageName} by this user - preventing duplicate`);
      }

      // UI update for logged-in user (model removal will be handled by handleTouchEnd or button click)
        setDragX(0);
        setSwipeDirection(null);

    } catch (err) {
      console.error('Error in recordSwipe:', err);
    } finally {
      // Reset processing flags after a delay
      // This finally block will now primarily serve logged-in users due to early returns for guests
      if (user) {
        setTimeout(() => {
          setIsProcessingSwipe(false);
          processingSwipeRef.current = false;
          console.log('Swipe processing completed for logged-in user, allowing new swipes');
        }, 500);
      }
    }
  };

  // Hilfsfunktionen zum Hinzufügen/Entfernen der globalen Listener
  const addGlobalListeners = () => {
    if (!globalMoveListener.current) {
      globalMoveListener.current = (e: any) => handleTouchMove(e);
      window.addEventListener('mousemove', globalMoveListener.current as any);
      window.addEventListener('touchmove', globalMoveListener.current as any);
    }
    if (!globalUpListener.current) {
      globalUpListener.current = (e: any) => handleTouchEnd(e);
      window.addEventListener('mouseup', globalUpListener.current as any);
      window.addEventListener('touchend', globalUpListener.current as any);
    }
  };
  const removeGlobalListeners = () => {
    if (globalMoveListener.current) {
      window.removeEventListener('mousemove', globalMoveListener.current as any);
      window.removeEventListener('touchmove', globalMoveListener.current as any);
      globalMoveListener.current = null;
    }
    if (globalUpListener.current) {
      window.removeEventListener('mouseup', globalUpListener.current as any);
      window.removeEventListener('touchend', globalUpListener.current as any);
      globalUpListener.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isSwiping.current = true;
    const currentX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setIsDragging(true); // Dragging beginnt mit MouseDown/Tap
    startX.current = currentX;
    addGlobalListeners();
    console.log('handleTouchStart', { currentX, startX: startX.current });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    let currentX = 0;
    if ('touches' in e && e.touches && e.touches.length > 0) {
      currentX = e.touches[0].clientX;
    } else if ('clientX' in e) {
      currentX = (e as MouseEvent).clientX;
    } else {
      return;
    }
    let diff = currentX - startX.current;
    const max = window.innerWidth;
    if (diff > max) diff = max;
    if (diff < -max) diff = -max;
    setDragX(diff);
  };

  const handleTouchEnd = async (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    removeGlobalListeners();
    if (swipeHandledRef.current) return;
    swipeHandledRef.current = true;
    setIsDragging(false);
    isSwiping.current = false;
    let endX = 0;
    if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      endX = e.changedTouches[0].clientX;
    } else if ('clientX' in e) {
      endX = (e as MouseEvent).clientX;
    } else {
      // Fallback: keine Koordinate, kein Swipe
      setDragX(0);
      setTimeout(() => { swipeHandledRef.current = false; }, 300);
      return;
    }
    const diff = endX - startX.current;
    if (Math.abs(diff) > 60) {
      const direction = diff > 0 ? 'right' : 'left';
      setDragX(direction === 'right' ? window.innerWidth : -window.innerWidth);
      setTimeout(async () => {
        await recordSwipe(modelsState[0]?.name, direction, modelsState[0]?.img);
        if (!user && direction === 'left') {
          setDragX(-window.innerWidth);
          setModelImageLoaded(false);
          setTimeout(() => {
            setModelsState((prev) => prev.slice(1));
            setDragX(0);
          }, 250);
        }
        if (user && !showBrandForm && direction === 'left') {
          setDragX(-window.innerWidth);
          const nextImg = modelsState[1]?.img;
          if (nextImg) {
            const img = new window.Image();
            img.src = nextImg;
            img.onload = () => {
              setModelsState((prev) => {
                const newState = prev.slice(1);
                setModelImageLoaded(false);
                return newState;
              });
              setDragX(0);
            };
          } else {
            setModelsState((prev) => {
              const newState = prev.slice(1);
              setModelImageLoaded(false);
              return newState;
            });
            setDragX(0);
          }
        }
        if (user && !showBrandForm && direction !== 'left') {
          setModelImageLoaded(false);
          setModelsState((prev) => prev.slice(1));
        }
        setTimeout(() => { swipeHandledRef.current = false; }, 300);
      }, 250);
    } else {
      setDragX(0);
      setTimeout(() => { swipeHandledRef.current = false; }, 300);
    }
  };

  // Update the processPendingSwipe function
  useEffect(() => {
    if (!user) return; // Nur für eingeloggte User!
    console.log('[PENDING SWIPE CHECK]', {
      user,
      showBrandForm,
      showBrandFormRequested,
      pendingSwipe: localStorage.getItem('pendingSwipe'),
      pendingLeftSwipes: localStorage.getItem('pendingLeftSwipes')
    });
    if (showBrandForm) return;
    const pendingSwipeStr = localStorage.getItem('pendingSwipe');
    if (!pendingSwipeStr) return;
    try {
      const pendingSwipe = JSON.parse(pendingSwipeStr);
      if (pendingSwipe && pendingSwipe.image_name && pendingSwipe.direction) {
        console.log('[PENDING SWIPE] Übernehme pendingSwipe:', pendingSwipe);
        recordSwipe(pendingSwipe.image_name, pendingSwipe.direction, pendingSwipe.image_name);
        localStorage.removeItem('pendingSwipe');
        // Nach Login: Model auch aus modelsState entfernen, wenn es vorne liegt und Rechtsswipe war
        if (pendingSwipe.direction === 'right' && modelsState.length > 0 && modelsState[0].img === pendingSwipe.image_name) {
          setModelImageLoaded(false);
          setModelsState(prev => prev.slice(1));
        }
      }
    } catch (e) {
      localStorage.removeItem('pendingSwipe');
    }
  }, [user, showBrandForm]);

  const openContactForm = () => {
    setShowContactForm(true);
  };

  const openBecomeModelForm = () => {
    setShowBecomeModelForm(true);
  };

  const openBrandForm = () => {
    setAuthMode('login');
    setAuthSuccess('');
    setAuthError('');
    setShowBrandForm(true);
  };

  const sendEmail = async (to: string, subject: string, body: string, attachments?: any[]) => {
    try {
      console.log('Sending email:', { to, subject, body, hasAttachments: !!attachments });
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          reply_to: `"${to}" <${to}>`,
          attachments
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
      // Set loading state
      setFileUploadStatus('Sending application...');
      
      try {
        // Convert images to base64
        const filePromises = Array.from(selectedFiles).map(file => {
          return new Promise<{name: string, base64: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({ 
                name: file.name, 
                base64: reader.result as string 
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        
        const fileBase64Array = await Promise.all(filePromises);
        
        // Prepare email content
        const emailText = `Contact: ${becomeModelEmail}\n\nAbout: ${becomeModelAge}\n\n${selectedFiles.length} photo(s) attached`;
        
        // Send the email with attachments
        const success = await sendEmail(
          'family@felixtell.com',
          'New Model Application',
          emailText,
          fileBase64Array.map(file => ({
            filename: file.name,
            content: file.base64,
          }))
        );
        
        if (!success) {
          throw new Error('Failed to send application');
        }
        
        // Reset form and show success
        setFileUploadStatus('Application sent successfully!');
        setTimeout(() => {
          setBecomeModelEmail('');
          setBecomeModelAge('');
          setSelectedFiles([]);
          setFileUploadStatus('');
          setShowBecomeModelForm(false);
        }, 2000);
      } catch (error) {
        console.error('Error sending application:', error);
        setFileUploadStatus('Error sending application. Please try again.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Limit to maximum 5 files
      const fileArray = Array.from(files).slice(0, 5);
      setSelectedFiles(fileArray);
      setFileUploadStatus(`${fileArray.length} file(s) selected`);
    }
  };

  // Supabase Auth
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Bereinige pendingSwipe, wenn kein User eingeloggt ist
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('pendingSwipe');
    }
  }, [user]);

  // Funktion zum Abrufen der abgelehnten Models (Linksswipes)
  const fetchRejectedModels = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
            .from('swipes')
      .select('id, image_name')
      .eq('brand_id', user.id)
      .eq('direction', 'left');

          if (error) {
      console.error('Error fetching rejected models:', error);
      return;
    }
    
    if (data) {
      setRejectedModels(data.map(swipe => ({
        name: swipe.image_name,
        id: swipe.id
      })));
    }
  };

  // Funktion zum Wiederherstellen eines abgelehnten Models
  const restoreRejectedModel = async (modelId: string, imageName: string) => {
    if (!user) return;
    console.log('[RESTORE] Versuch zu löschen:', {
      userId: user.id,
      imageName,
      direction: 'left'
    });
    // Vor dem Löschen: Logge alle passenden Swipes
    const { data: swipesBefore, error: errorBefore } = await supabase
      .from('swipes')
      .select('*')
      .eq('brand_id', user.id)
      .eq('image_name', imageName)
      .eq('direction', 'left');
    console.log('[RESTORE] Swipes vor Delete:', { swipesBefore, errorBefore });
    const { error, data } = await supabase
      .from('swipes')
      .delete()
      .eq('brand_id', user.id)
      .eq('image_name', imageName)
      .eq('direction', 'left');
    console.log('[RESTORE] Delete result:', { error, data });
    // Nach dem Löschen: Logge alle passenden Swipes nochmal
    const { data: swipesAfter, error: errorAfter } = await supabase
      .from('swipes')
      .select('*')
      .eq('brand_id', user.id)
      .eq('image_name', imageName)
      .eq('direction', 'left');
    console.log('[RESTORE] Swipes nach Delete:', { swipesAfter, errorAfter });
    if (error) {
      console.error('Error restoring model:', error);
      return;
    }
    setRejectedModels(prev => prev.filter(model => model.name !== imageName));
    const modelToAdd = allModels.find(m => m.img === imageName);
    if (modelToAdd) {
      setModelsState(prev => [modelToAdd, ...prev]);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) {
        setAuthError(error.message);
      } else {
        setShowBrandForm(false);
        console.log('[handleAuth] Login success, user:', user, 'allModels:', allModels.map(m=>m.name));
        const filtered = await fetchSwipedModels();
        console.log('[handleAuth] filtered after login:', filtered.map(m=>m.name), 'modelsState:', modelsState.map(m=>m.name));
        if (filtered.length === 0 && allModels.length > 0) {
          // Kein Fallback mehr auf allModels, immer fetchSwipedModels nutzen
        }
      }
    } else {
      try {
        const { data: signUpData, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
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
          setAuthSuccess(`Confirmation email sent! Please check ${authEmail} and click the verification link to activate your account.`);
          setAuthEmail('');
          setAuthPassword('');
          // NEU: Swipes direkt nach Registrierung speichern
          const newUserId = signUpData?.user?.id;
          if (newUserId) {
            // Rightswipe (pendingSwipe)
            const pendingSwipeStr = localStorage.getItem('pendingSwipe');
            if (pendingSwipeStr) {
              try {
                const pendingSwipe = JSON.parse(pendingSwipeStr);
                if (pendingSwipe && pendingSwipe.image_name && pendingSwipe.direction) {
                  await supabase.from('swipes').insert({
                    brand_id: newUserId,
                    model_name: pendingSwipe.image_name,
                    direction: pendingSwipe.direction,
                    image_name: pendingSwipe.image_name
                  });
                }
              } catch {}
              localStorage.removeItem('pendingSwipe');
            }
            // Linksswipes (pendingLeftSwipes)
            const pendingLeftSwipesStr = localStorage.getItem('pendingLeftSwipes');
            if (pendingLeftSwipesStr) {
              try {
                const pendingLeftSwipes = JSON.parse(pendingLeftSwipesStr);
                if (Array.isArray(pendingLeftSwipes) && pendingLeftSwipes.length > 0) {
                  for (const swipe of pendingLeftSwipes) {
                    if (swipe.image_name) {
                      await supabase.from('swipes').insert({
                        brand_id: newUserId,
                        model_name: swipe.image_name,
                        direction: 'left',
                        image_name: swipe.image_name
                      });
                    }
                  }
                }
              } catch {}
              localStorage.removeItem('pendingLeftSwipes');
            }
          }
        }
      } catch (err) {
        setAuthError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthSuccess('');
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

  // useEffect auf showBrandForm:
  useEffect(() => {
    if (!showBrandForm) setShowBrandFormRequested(false);
  }, [showBrandForm]);

  // PATCH: modelsState für eingeloggte User NICHT persistent machen, sondern immer aus DB filtern
  useEffect(() => {
    if (!user) return;
    // Entferne persistente modelsState für eingeloggte User
    sessionStorage.removeItem('felixtell_modelsState');
  }, [user]);

  // PATCH: modelsStateRestoredRef nur für Gäste verwenden
  // modelsStateRestoredRef wird für eingeloggte User immer auf false gesetzt
  useEffect(() => {
    if (user) {
      modelsStateRestoredRef.current = false;
      return;
    }
    // Nur für Gäste: modelsState aus Storage wiederherstellen
    const stored = sessionStorage.getItem('felixtell_modelsState');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].img) {
          setModelsState(parsed);
          modelsStateRestoredRef.current = true;
          return;
        }
      } catch {}
    }
    modelsStateRestoredRef.current = false;
    if (allModels.length > 0) setModelsState(allModels);
  }, [user, allModels]);

  // PATCH: pendingLeftSwipes-Übernahme in useEffect nach Login
  useEffect(() => {
    if (!user) return;
    console.log('[PENDING LEFT SWIPES CHECK]', {
      user,
      pendingLeftSwipes: localStorage.getItem('pendingLeftSwipes')
    });
    const pendingLeftSwipesStr = localStorage.getItem('pendingLeftSwipes');
    if (!pendingLeftSwipesStr) return;
    (async () => {
      try {
        const pendingLeftSwipes = JSON.parse(pendingLeftSwipesStr);
        if (Array.isArray(pendingLeftSwipes) && pendingLeftSwipes.length > 0) {
          // Hole alle bereits geswipten Bilder (left) für diesen User
          const { data: existingLeft, error: errLeft } = await supabase
            .from('swipes')
            .select('image_name')
            .eq('brand_id', user.id)
            .eq('direction', 'left');
          const alreadyLeft = new Set((existingLeft || []).map((s: any) => s.image_name));
          for (const swipe of pendingLeftSwipes) {
            if (swipe.image_name && !alreadyLeft.has(swipe.image_name)) {
              console.log('[PENDING LEFT SWIPE] Übernehme:', swipe);
              await supabase.from('swipes').insert({
                brand_id: user.id,
                model_name: swipe.image_name,
                direction: 'left',
                image_name: swipe.image_name
              });
            }
          }
        }
      } catch {}
      localStorage.removeItem('pendingLeftSwipes');
      // Nach Übernahme: modelsState neu filtern
      await fetchSwipedModels();
    })();
  }, [user]);

  // Nach Login/Signup: pending_swipes übernehmen
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Hole alle pending_swipes für die E-Mail (user.email)
      const { data: pending, error } = await supabase
        .from('pending_swipes')
        .select('*')
        .eq('email', user.email);
      if (pending && pending.length > 0) {
        for (const swipe of pending) {
          // Prüfe, ob Swipe schon existiert
          const { data: existing, error: err2 } = await supabase
            .from('swipes')
            .select('id')
            .eq('brand_id', user.id)
            .eq('image_name', swipe.image_name)
            .eq('direction', swipe.direction);
          if (!existing || existing.length === 0) {
            await supabase.from('swipes').insert({
              brand_id: user.id,
              model_name: swipe.image_name,
              direction: swipe.direction,
              image_name: swipe.image_name
            });
          }
        }
        // Nach Übernahme: Lösche alle übernommenen pending_swipes
        await supabase.from('pending_swipes').delete().eq('email', user.email);
        // Deck neu filtern
        await fetchSwipedModels();
      }
    })();
  }, [user]);

  if (typeof window !== 'undefined' && (window as any).felixtell_modal_blocked === undefined) {
    (window as any).felixtell_modal_blocked = false;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <div className="background-stripes" />
      <div className="flex flex-col items-center justify-center min-h-screen p-8" style={{ position: 'relative', zIndex: 1 }}>        {showSplash && (
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
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
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
                onClick={openBrandForm}
                className="px-8 py-4 rounded-full bg-white/90 text-[var(--gold)] border border-[var(--gold)] font-semibold text-xl shadow-lg hover:bg-[var(--gold)] hover:text-white transition-all duration-300 hover:shadow-xl"
                style={{ minWidth: '180px', fontSize: '1.35rem' }}
              >
                Brand Login / Signup
              </button>
            </div>
          )}

          <div className="flex flex-col items-center mb-4" style={{position: 'relative', width: '20rem', height: '20rem'}}>
            {modelsState.length > 0 && !showBecomeModelForm && (
              <div
                ref={swipeRef}
                className={`w-80 h-80 bg-white flex flex-col items-center justify-between rounded-xl shadow-xl border border-[#E5C76B] mb-4 select-none overflow-hidden`}
                style={{
                  transform: `translateX(${dragX}px)`,
                  transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)'
                }}
                onMouseDown={handleTouchStart}
                onTouchStart={handleTouchStart}
                onMouseMove={handleTouchMove}
                onTouchMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onTouchEnd={handleTouchEnd}
              >
                {/* Display the model image - now square and full width */}
                <div className="w-full h-full relative">
                  {!modelImageLoaded && modelsState[0]?.img && (
                    <div style={{position:'absolute',inset:0,background:'#F0C040',zIndex:2,display:'flex',alignItems:'center',justifyContent:'center',transition:'opacity 0.2s',opacity:1}}>
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" fill="#F7E7B0" stroke="#F0C040" strokeWidth="4"/><text x="32" y="40" textAnchor="middle" fontSize="32" fill="#F0C040" fontWeight="bold">★</text></svg>
                    </div>
                  )}
                  {modelsState[0]?.img && (
                    <Image 
                      src={modelsState[0].img} 
                      alt={modelsState[0].name}
                      fill
                      sizes="100%"
                      style={{ objectFit: 'cover', pointerEvents: 'none', opacity: modelImageLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
                      priority
                      onLoadingComplete={() => setModelImageLoaded(true)}
                    />
                  )}
                </div>
                
                {/* Bottom action buttons overlaying the image */}
                <div className="absolute bottom-5 w-full flex justify-center gap-14 px-4">
                  <button
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100 text-red-500 text-3xl shadow-md hover:bg-red-200 transition-all duration-300 hover:shadow-lg"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isProcessingSwipe || processingSwipeRef.current || showBrandForm) {
                        return;
                      }
                      await recordSwipe(modelsState[0]?.name, 'left', modelsState[0]?.img);
                      if (!user) {
                        setDragX(-window.innerWidth);
                        setModelImageLoaded(false);
                        // Warte auf Bild-Load
                        const nextImg = modelsState[1]?.img;
                        if (nextImg) {
                          const img = new window.Image();
                          img.src = nextImg;
                          img.onload = () => {
                            setModelsState((prev) => prev.slice(1));
                            setDragX(0);
                          };
                        } else {
                          setModelsState((prev) => prev.slice(1));
                          setDragX(0);
                        }
                      }
                      if (user && !showBrandForm) {
                        setDragX(-window.innerWidth);
                        const nextImg = modelsState[1]?.img;
                        if (nextImg) {
                          const img = new window.Image();
                          img.src = nextImg;
                          img.onload = () => {
                            setModelsState((prev) => {
                              const newState = prev.slice(1);
                              setModelImageLoaded(false);
                              return newState;
                            });
                            setDragX(0);
                          };
                        } else {
                          setModelsState((prev) => {
                            const newState = prev.slice(1);
                            setModelImageLoaded(false);
                            return newState;
                          });
                          setDragX(0);
                        }
                      }
                    }}
                    aria-label="Dislike"
                  >
                    &#10006;
                  </button>
                  <button
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-500 text-3xl shadow-md hover:bg-green-200 transition-all duration-300 hover:shadow-lg"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isProcessingSwipe || processingSwipeRef.current || showBrandForm) {
                        return;
                      }
                      await recordSwipe(modelsState[0]?.name, 'right', modelsState[0]?.img);
                      if (user && !showBrandForm) {
                        setModelImageLoaded(false);
                        const nextImg = modelsState[1]?.img;
                        if (nextImg) {
                          const img = new window.Image();
                          img.src = nextImg;
                          img.onload = () => {
                            setModelsState((prev) => prev.slice(1));
                          };
                        } else {
                          setModelsState((prev) => prev.slice(1));
                        }
                      }
                    }}
                    aria-label="Like"
                  >
                    &#10004;
                  </button>
                </div>
              </div>
            )}
            
            {modelsState.length === 0 && (
              <div className="w-80 h-80 bg-white flex flex-col items-center justify-center rounded-xl shadow-xl border border-[#E5C76B] mb-4 p-6">
                <p className="text-gray-500 text-center">No more models to display</p>
                <p className="text-gray-400 text-sm text-center mt-2">Check back later for more</p>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl border border-[#E5C76B] w-full max-w-md p-4 sm:p-8 mx-2 box-border">
                <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4">Become a Model</h2>
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                    onClick={() => setShowBecomeModelForm(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleBecomeModelSubmit} className="flex flex-col space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Contact information:</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none" 
                      placeholder="Email address or phone number" 
                      value={becomeModelEmail} 
                      onChange={(e) => setBecomeModelEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Write something about yourself:</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none"
                      placeholder="Tell us about yourself, experience, height, age, interests..."
                      value={becomeModelAge} 
                      onChange={(e) => setBecomeModelAge(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Upload photos:</label>
                    <div className="relative">
                      <button
                        type="button"
                        className="px-4 py-2 border border-[var(--gold)] text-[var(--gold)] bg-white hover:bg-[var(--gold)] hover:text-white transition-colors rounded-lg"
                        onClick={() => document.getElementById('model-photos')?.click()}
                      >
                        Select Photos
                      </button>
                      <input 
                        id="model-photos" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileSelect}
                        lang="en"
                      />
                      <span className="ml-3 text-gray-500 text-sm">
                        {fileUploadStatus || "Up to 5 photos"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Please include a headshot and full body shot</p>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 p-2 border rounded-lg bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-1">Selected files:</p>
                        <ul className="text-xs text-gray-600">
                          {Array.from(selectedFiles).map((file, index) => (
                            <li key={index} className="truncate">
                              {file.name} ({Math.round(file.size / 1024)} KB)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-[var(--gold)] text-white rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
                      disabled={fileUploadStatus === 'Sending application...'}
                    >
                      {fileUploadStatus === 'Sending application...' ? 'Sending...' : 'Submit'}
                    </button>
                    <button 
                      type="button" 
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors" 
                      onClick={() => setShowBecomeModelForm(false)}
                      disabled={fileUploadStatus === 'Sending application...'}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showBrandForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl border border-[#E5C76B] w-full max-w-md p-4 sm:p-8 mx-2 box-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{authMode === 'login' ? 'Brand Login' : 'Brand Signup'}</h2>
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                    onClick={() => {
                      setShowBrandForm(false);
                      setAuthSuccess('');
                      setAuthError('');
                      localStorage.removeItem('pendingSwipe');
                      setShowBrandFormRequested(false);
                      setDragX(0);
                      if (!user && modelsState.length === 0 && allModels.length > 0) {
                        const missingModel = allModels.find(m => !modelsState.some(s => s.img === m.img));
                        if (missingModel) setModelsState(prev => [missingModel, ...prev]);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
                
                {!showForgotPassword ? (
                  <>
                    <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                            placeholder="Your email address"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none transition"
                          value={authEmail}
                          onChange={e => setAuthEmail(e.target.value)}
                          required
                        />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                          <input
                            type="password"
                              placeholder="Your password"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none transition"
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            required
                          />
                          </div>
                          
                          {authError && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                              {authError}
                            </div>
                          )}
                          
                          {authSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                              {authSuccess}
                            </div>
                          )}
                          
                          {authMode === 'signup' && !authSuccess && (
                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <p className="font-medium text-blue-800 mb-1">Important:</p>
                              <p>After signing up, you'll receive a confirmation email with a verification link from Felix Tell.</p>
                              <p className="mt-1">You must click this link to activate your account.</p>
                            </div>
                          )}
                          
                          <button
                            type="submit"
                            className="w-full py-3 rounded-lg bg-[var(--gold)] text-white font-semibold text-lg hover:bg-[#c4a436] transition-colors mt-2"
                          >
                            {authMode === 'login' ? 'Login' : 'Sign Up'}
                          </button>
                          
                          {authMode === 'login' && (
                            <button
                              type="button"
                              className="self-start text-sm text-[var(--gold)] hover:text-[#c4a436] transition"
                              onClick={() => setShowForgotPassword(true)}
                            >
                              Forgot password?
                            </button>
                          )}
                        </form>
                        
                        <div className="flex items-center my-6">
                          <div className="flex-1 h-px bg-gray-300"></div>
                          <span className="px-4 text-sm text-gray-500">or</span>
                          <div className="flex-1 h-px bg-gray-300"></div>
                        </div>
                        
                          <button
                            type="button"
                          className="w-full py-3 rounded-lg border border-[var(--gold)] bg-white text-[var(--gold)] font-medium transition hover:bg-[var(--gold)] hover:text-white focus:outline-none"
                          onClick={() => {
                            setAuthMode(authMode === 'login' ? 'signup' : 'login');
                            setAuthSuccess('');
                            setAuthError('');
                          }}
                        >
                          {authMode === 'login' ? 'New brand? Create account' : 'Already have an account? Login'}
                        </button>
                  </>
                ) : (
                  <>
                    <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="Enter your email" 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none transition"
                          value={forgotPasswordEmail} 
                          onChange={e => setForgotPasswordEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      
                      {forgotPasswordMessage && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                          {forgotPasswordMessage}
                        </div>
                      )}
                      
                      <button 
                        type="submit" 
                        className="w-full py-3 rounded-lg bg-[var(--gold)] text-white font-semibold text-lg hover:bg-[#c4a436] transition-colors"
                      >
                        Send Password Reset Link
                      </button>
                    </form>
                    
                    <button 
                      className="mt-4 text-sm text-[var(--gold)] hover:text-[#c4a436] transition" 
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to login
                    </button>
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
                  <div className="space-y-8 max-h-[60vh] overflow-y-auto px-2">
                    {[...new Map([...rejectedModels].reverse().map(m => [m.name, m])).values()].map((model) => (
                      <div key={model.id} className="flex flex-col items-center p-0 border rounded-xl bg-gray-50">
                        <div style={{width:'100%',maxWidth:320,aspectRatio:'1/1',position:'relative',borderRadius:16,overflow:'hidden',background:'#eee'}}>
                          <Image src={model.name} alt="Rejected model" fill style={{objectFit:'cover'}} />
                        </div>
                        <button
                          className="mt-4 mb-4 px-5 py-2 rounded-full text-base bg-white text-[var(--gold)] border border-[var(--gold)] font-medium hover:bg-[var(--gold)] hover:text-white transition"
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
      </div>
      <style>{`
        .background-stripes {
          position: fixed;
          inset: 0;
          z-index: 0;
          width: 100vw;
          height: 100vh;
          background: repeating-linear-gradient(
            135deg,
            #E8DCCE,
            #E8DCCE 36px,
            #F0C040 36px,
            #F0C040 38px,
            #F3EBDD 38px,
            #F3EBDD 76px
          );
        }
      `}</style>
    </div>
  );
}
