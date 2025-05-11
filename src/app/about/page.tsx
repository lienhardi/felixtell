"use client";
import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-blue-50">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 mb-8">
        <h1 className="text-4xl font-playfair text-black mb-6 text-center">About Felix Tell</h1>
        
        <div className="space-y-6 text-gray-700">
          <p className="leading-relaxed">
            Dear talents, 
            dear brands,
            dear visitors and friends,
            <br />
            <br />
            Thanks for stopping by and spending your valuable time with us!
            <br />
            <br />
            Felix Tell supports and proudly presents talents who are worthy and who we protect.
            <br />
            <br />
            Dear talents: 
            <br />
            Do you feel like your potential isn't being used to the fullest or in a way that degrades you? Then we hope you find a safe haven here. Lifelong.
            <br />
            <br />
            Dear brands:
            <br />
             Are you tired of models or actors or brand ambassadors who are not really catching potential customers and viewers with their presence? Or are even repulsive to the eye or heart? We from Felix Tell are sometimes surprised by what bad models even the biggest companies use. A model should be a role model. A lot of people have to see your advertisements and your stock holders want revenue, so present responsibly!
            <br />
            <br />
            That being said: Let's make it light and fun and get your pictures on the walls and your products sold!
            <br />
            <br />
            Become a model with us or find a model for your projects by using Felix Tell.
            <br />
            Don't hesitate to contact us at family@felixtell.com
            <br />
            <br />
            Cheers,
            <br />
            Felix Tell
          </p>
        </div>
      </div>

      <Link 
        href="/"
        className="text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors duration-300 text-sm font-medium tracking-wide"
      >
        ← Back to Home
      </Link>
    </div>
  );
} 