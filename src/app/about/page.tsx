"use client";
import React from 'react';
import Link from 'next/link';

const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        from: to
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8"
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
         }}>
      <div className="max-w-3xl w-full elegant-card mb-8">
        <h1 className="text-4xl elegant-heading text-black mb-8 text-center">About Felix Tell</h1>
        
        <div className="space-y-6 text-gray-700">
          <p className="leading-relaxed text-xl">
            Founded in 1842 as a small European atelier, Felix Tell has supported creative expression and business growth for over 180 years.
          </p>

          <p className="leading-relaxed text-xl">
            <strong>For new talents:</strong> If your new to real modelling, then this is your strength. Find here a safe and dignified way to start your modelling career.
          </p>

          <p className="leading-relaxed text-xl">
          <strong>For modelling experts:</strong> Gain access to more brands and projects here.
          </p>

          <p className="leading-relaxed text-xl">
            <strong>For brands:</strong> Beautiful models, that's what catches the customer. We are surprised to see a lot of huge companies let unappealing models represent their brand and products. Let's get your brand <em>loved</em>.
          </p>


          <p className="leading-relaxed text-xl font-medium">
            Contact: <strong>family@felixtell.com</strong>
            <br /><br />
            The Felix Tell Family
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="px-8 py-3 rounded-full bg-white/90 text-[var(--gold)] border border-[var(--gold)] font-semibold text-xl shadow-lg hover:bg-[var(--gold)] hover:text-white transition-all duration-300 hover:shadow-xl mb-2"
        onClick={() => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("fromAbout", "1");
          }
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
} 