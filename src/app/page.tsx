"use client";
import React, { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showBecomeModelForm, setShowBecomeModelForm] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [becomeModelEmail, setBecomeModelEmail] = useState('');
  const [becomeModelAge, setBecomeModelAge] = useState('');

  const openContactForm = () => {
    setShowContactForm(true);
  };

  const openBecomeModelForm = () => {
    setShowBecomeModelForm(true);
  };

  const sendEmail = (to: string, subject: string, body: string) => {
    // Hier später die E-Mail-Versand-Logik implementieren
    console.log(`E-Mail an ${to} gesendet: ${subject} - ${body}`);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmail('felixtell123@gmail.com', 'Neue Kontaktanfrage', `E-Mail: ${contactEmail}`);
    setShowContactForm(false);
  };

  const handleBecomeModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmail('felixtell123@gmail.com', 'Neue Bewerbung', `E-Mail: ${becomeModelEmail}, Alter: ${becomeModelAge}`);
    setShowBecomeModelForm(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold text-[var(--gold)] mb-8">Felix Tell</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Platzhalter für Model-Bilder */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-40 h-40 bg-gray-200 flex items-center justify-center cursor-pointer" onClick={openContactForm}>
            <span>Model {i}</span>
          </div>
        ))}
      </div>
      <button className="px-4 py-2 bg-[var(--gold)] text-white rounded hover:bg-[var(--gold-light)]" onClick={openBecomeModelForm}>
        Become a Model
      </button>

      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded">
            <h2 className="text-2xl font-bold mb-4">Book a Tellent</h2>
            <form onSubmit={handleContactSubmit}>
              <p>Bitte geben Sie Ihre E-Mail-Adresse oder Handynummer ein:</p>
              <input type="text" className="border p-2 w-full mb-4" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <button type="submit" className="px-4 py-2 bg-[var(--gold)] text-white rounded">Absenden</button>
              <button type="button" className="px-4 py-2 bg-gray-300 text-black rounded ml-2" onClick={() => setShowContactForm(false)}>Schließen</button>
            </form>
          </div>
        </div>
      )}

      {showBecomeModelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded">
            <h2 className="text-2xl font-bold mb-4">Become a Model</h2>
            <form onSubmit={handleBecomeModelSubmit}>
              <p>Bitte geben Sie Ihre E-Mail-Adresse oder Handynummer ein:</p>
              <input type="text" className="border p-2 w-full mb-4" value={becomeModelEmail} onChange={(e) => setBecomeModelEmail(e.target.value)} />
              <p>Alter:</p>
              <input type="number" className="border p-2 w-full mb-4" value={becomeModelAge} onChange={(e) => setBecomeModelAge(e.target.value)} />
              <p>Fotos hochladen:</p>
              <input type="file" className="mb-4" />
              <button type="submit" className="px-4 py-2 bg-[var(--gold)] text-white rounded">Absenden</button>
              <button type="button" className="px-4 py-2 bg-gray-300 text-black rounded ml-2" onClick={() => setShowBecomeModelForm(false)}>Schließen</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
