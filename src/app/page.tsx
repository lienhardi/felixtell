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
              <clipPath id="shield-clip">
                <path d="M160,30 L200,50 A80,80 0 0 1 160,150 A80,80 0 0 1 120,50 Z" />
              </clipPath>
            </defs>
            
            {/* Elegantes Schild/Wappen */}
            <path 
              d="M160,30 L200,50 A80,80 0 0 1 160,150 A80,80 0 0 1 120,50 Z" 
              stroke="url(#gold-gradient)" 
              strokeWidth="2" 
              fill="none"
              style={{
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: shouldStartAnimation ? 'drawOutline 1.2s ease-in-out forwards' : 'none'
              }}
            />
            
            {/* Horizontale Linien im Inneren */}
            <g clipPath="url(#shield-clip)">
              <path 
                d="M120,65 L200,65" 
                stroke="url(#gold-gradient)" 
                strokeWidth="1.5" 
                opacity="0.7"
                style={{
                  strokeDasharray: 80,
                  strokeDashoffset: 80,
                  animation: shouldStartAnimation ? 'drawLine 0.6s ease-in-out 0.6s forwards' : 'none'
                }}
              />
              <path 
                d="M120,90 L200,90" 
                stroke="url(#gold-gradient)" 
                strokeWidth="1.5" 
                opacity="0.7"
                style={{
                  strokeDasharray: 80,
                  strokeDashoffset: 80,
                  animation: shouldStartAnimation ? 'drawLine 0.6s ease-in-out 0.7s forwards' : 'none'
                }}
              />
              <path 
                d="M130,115 L190,115" 
                stroke="url(#gold-gradient)" 
                strokeWidth="1.5" 
                opacity="0.7"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60,
                  animation: shouldStartAnimation ? 'drawLine 0.6s ease-in-out 0.8s forwards' : 'none'
                }}
              />
            </g>
            
            {/* Subtile Stern/Kompass-Form in der Mitte */}
            <circle 
              cx="160" 
              cy="75" 
              r="15" 
              fill="none" 
              stroke="url(#gold-gradient)" 
              strokeWidth="1"
              style={{
                strokeDasharray: 94,
                strokeDashoffset: 94,
                animation: shouldStartAnimation ? 'drawCircle 0.8s ease-in-out 0.9s forwards' : 'none'
              }}
            />
            <path 
              d="M160,60 L160,90 M145,75 L175,75" 
              stroke="url(#gold-gradient)" 
              strokeWidth="1"
              style={{
                strokeDasharray: 60,
                strokeDashoffset: 60,
                animation: shouldStartAnimation ? 'drawCross 0.6s ease-in-out 1.1s forwards' : 'none'
              }}
            />
            
            {/* FT Initialen, subtil und dezent */}
            <text 
              x="152" 
              y="80" 
              fontFamily="serif" 
              fontSize="16" 
              fill="url(#gold-gradient)"
              opacity="0"
              style={{
                animation: shouldStartAnimation ? 'fadeIn 0.5s ease-in-out 1.3s forwards' : 'none'
              }}
            >
              FT
            </text>
          </svg>
          <style>
            {`
              @keyframes drawOutline {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawLine {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawCircle {
                to { stroke-dashoffset: 0; }
              }
              @keyframes drawCross {
                to { stroke-dashoffset: 0; }
              }
              @keyframes fadeIn {
                to { opacity: 1; }
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
              <p className="text-sm uppercase tracking-widest text-gray-600">WEALTH MANAGEMENT</p>
            </div>
          </div>
        </div>
        
        <div className="w-20 h-px bg-gray-300 my-8"></div>
        
        <h2 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-6 text-center tracking-wide">
          Excellence and Efficiency
        </h2>
        
        <div className="max-w-2xl text-center px-4 mb-12">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            For nearly two centuries, Felix Tell has delivered consistent, superior investment results. 
            Our approach combines time-tested strategies with forward-looking market insights.
          </p>
          
          <p className="text-lg text-gray-700 leading-relaxed">
            We operate with unwavering dedication to performance and innovation.
            Our reputation is built on the trust of generations of discerning clients
            seeking stability in an ever-changing world. As you have likely been 
            referred to us, we invite you to consider yourself part of the family.
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
                  <p className="text-gray-600">We will respond promptly.</p>
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
            © 2025 Felix Tell Wealth Management
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Established 1837
          </p>
        </div>
      </div>
    </>
  );
}
