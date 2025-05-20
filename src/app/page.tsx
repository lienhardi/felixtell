"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [shouldStartAnimation, setShouldStartAnimation] = useState(false);

  // Warte auf vollständiges Laden der Seite
  useEffect(() => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
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

    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [isPageLoaded]);

  const openContactForm = () => {
    setShowContactForm(true);
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
        'info@felixtell.com', 
        'New Inquiry', 
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

  return (
    <>
      {showSplash && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50, background: '#F5F5F5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.18s',
            opacity: showSplash ? 1 : 0
          }}
        >
          <svg width="320" height="180" viewBox="0 0 320 180" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="gold-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8E7D3A" />
                <stop offset="50%" stopColor="#6B5E2C" />
                <stop offset="100%" stopColor="#4D4420" />
              </linearGradient>
            </defs>
            {/* Logo für Vermögensverwaltung - einfaches FT Monogramm */}
            <path
              d="
                M110,50 H190
                M110,50 V130
                M110,90 H170
                M150,50 V130
              "
              stroke="url(#gold-gradient)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: 500,
                strokeDashoffset: 500,
                animation: shouldStartAnimation ? 'drawLogo 1.2s ease-in-out forwards' : 'none'
              }}
            />
          </svg>
          <style>
            {`
              @keyframes drawLogo {
                to { stroke-dashoffset: 0; }
              }
            `}
          </style>
        </div>
      )}

      <div
        className="flex flex-col items-center justify-center min-h-screen p-8"
        style={{
          background: "#F5F5F5",
          color: "#333333"
        }}
      >
        <div className="flex flex-col items-center mb-10 mt-4">
          <div className="w-full flex justify-center" style={{ minHeight: 120 }}>
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-serif tracking-wider mb-2">FELIX TELL</h1>
              <p className="text-sm uppercase tracking-widest text-gray-600">EST. 1842</p>
            </div>
          </div>
        </div>
        
        <div className="w-20 h-px bg-gray-300 my-8"></div>
        
        <h2 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-6 text-center tracking-wide">
          Tradition. Excellence. Trust.
        </h2>
        
        <div className="max-w-2xl text-center px-4 mb-12">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            For nearly two centuries, Felix Tell has cultivated relationships based on 
            discretion and mutual respect. Our long-standing heritage combines timeless 
            principles with a contemporary perspective.
          </p>
          
          <p className="text-lg text-gray-700 leading-relaxed">
            We operate with unwavering dedication to confidentiality and excellence.
            Our reputation is built on the trust of generations of discerning clients
            seeking stability in an ever-changing world.
          </p>
        </div>
        
        <div className="w-20 h-px bg-gray-300 my-8"></div>
        
        <div className="flex flex-col gap-6 items-center">
          <button
            className="px-8 py-3 bg-white text-gray-800 border border-gray-400 hover:bg-gray-100 transition-colors text-lg"
            onClick={openContactForm}
          >
            Contact Us
          </button>
        </div>

        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded shadow max-w-md w-full">
              <h2 className="text-2xl font-serif mb-4">Contact Felix Tell</h2>
              {contactSuccess ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-3xl mb-2">✓</div>
                  <p className="text-lg font-medium text-gray-800 mb-2">Message sent successfully</p>
                  <p className="text-gray-600">We will respond with the utmost discretion.</p>
                </div>
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
                    placeholder="How can we assist you?"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-sm text-gray-600 mb-4">All communications are held in the strictest confidence.</p>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white">Send</button>
                    <button type="button" className="px-4 py-2 bg-gray-300 text-black" onClick={() => setShowContactForm(false)}>Close</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-16 pt-8 border-t border-gray-300 w-full max-w-2xl text-center">
          <p className="text-sm text-gray-500">
            Felix Tell © 1842-{new Date().getFullYear()}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Private. Discreet. Exclusive.
          </p>
        </div>
      </div>
    </>
  );
}
