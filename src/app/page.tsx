"use client";
import React, { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBecomeModelForm, setShowBecomeModelForm] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [becomeModelEmail, setBecomeModelEmail] = useState('');
  const [becomeModelAge, setBecomeModelAge] = useState('');
  const [userType, setUserType] = useState<'talent' | 'brand' | null>(null);

  const models = [
    { name: 'Model 1', img: null },
    { name: 'Model 2', img: null },
    { name: 'Model 3', img: null },
    { name: 'Model 4', img: null },
  ];
  const [currentModel, setCurrentModel] = useState(0);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="flex flex-col items-center mb-10" style={{width: 'fit-content', minWidth: 'min-content'}}>
        <div className="border-2 border-[var(--gold)] bg-[var(--gold)] rounded-none px-8 py-5 flex flex-col items-center w-full">
          <h1 className="text-5xl font-bold font-playfair text-white">Felix Tell</h1>
        </div>
        <div className="bg-black px-8 py-3 flex flex-col items-center w-full rounded-none" style={{marginTop: 0}}>
          <p className="text-2xl font-playfair text-white tracking-wide">Talents for Brands</p>
        </div>
      </div>
      <h2 className="text-3xl font-playfair text-gray-800 mb-2">Match with your future brand ambassador</h2>
      <p className="text-lg text-gray-500 mb-8">Swipe to discover unique personalities for your brand</p>
      <div className="flex flex-col items-center mb-10">
        <div className="w-64 h-80 bg-gray-100 flex flex-col items-center justify-center rounded-xl shadow-md border border-gray-200 mb-4 relative">
          {/* Hier könnte später ein echtes Modelbild stehen */}
          <span className="text-gray-600 font-medium text-xl mb-2">{models[currentModel].name}</span>
          {/* Swipe-Buttons */}
          <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 hover:bg-gray-200" onClick={() => setCurrentModel((prev) => (prev === 0 ? models.length - 1 : prev - 1))} aria-label="Previous Model">&#8592;</button>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 hover:bg-gray-200" onClick={() => setCurrentModel((prev) => (prev === models.length - 1 ? 0 : prev + 1))} aria-label="Next Model">&#8594;</button>
        </div>
        <button className="mt-2 text-sm text-gray-500 underline" onClick={openContactForm}>Book this Talent</button>
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
    </div>
  );
}
