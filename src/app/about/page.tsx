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
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl w-full elegant-card mb-8">
        <h1 className="text-4xl elegant-heading text-black mb-8 text-center">About Felix Tell</h1>
        
        <div className="space-y-8 text-gray-700">
          <p className="leading-relaxed text-lg">
            Established in 1842 by the visionary Felix Tell, our agency has stood as a beacon of artistic excellence and human potential for over 180 years. What began as a small atelier in the heart of Europe has evolved into a sanctuary for emerging talent, while maintaining the timeless values of our founder.
          </p>

          <p className="leading-relaxed text-lg">
            Felix Tell believed that true beauty lies not in perfection, but in authenticity. In an era where artistic expression was often confined to the privileged few, he opened his doors to those with raw talent and genuine passion. This revolutionary approach, which once challenged the conventions of his time, remains at the core of our philosophy today.
          </p>

          <p className="leading-relaxed text-lg">
            In our modern age, we continue Felix Tell's legacy by embracing technology while preserving the human touch. We understand that the journey of a new talent begins in the comfort of their home, with a simple photograph that captures their essence. This intimate beginning is not a limitation, but rather a testament to the authentic nature of true potential.
          </p>

          <p className="leading-relaxed text-lg">
            To our cherished talents:
            <br />
            Your journey begins with a single step - a photograph taken in your own space, where you feel most comfortable. We believe that this authenticity is your greatest strength. Our role is to nurture this raw potential, to guide you through the early stages of your career, and to ensure that your introduction to the world of modeling is both safe and dignified.
          </p>

          <p className="leading-relaxed text-lg">
            To our valued brands:
            <br />
            In a world of polished perfection, we offer something different - the genuine spark of emerging talent. Our models are not just faces; they are individuals with unique stories, ready to bring authenticity to your brand. We carefully curate these connections, ensuring that each match represents not just a business opportunity, but a meaningful partnership.
          </p>

          <p className="leading-relaxed text-lg">
            The digital age has transformed how we discover talent, but our commitment to excellence remains unchanged. We bridge the gap between tradition and innovation, between established prestige and emerging potential. Every new face that joins us becomes part of our legacy, continuing the story that Felix Tell began nearly two centuries ago.
          </p>

          <p className="leading-relaxed text-lg">
            Join us in this journey of discovery and growth. Whether you're taking your first steps in modeling or seeking authentic talent for your brand, we invite you to be part of our continuing story.
          </p>

          <p className="leading-relaxed text-lg">
            Contact us at family@felixtell.com
            <br />
            <br />
            With timeless dedication,
            <br />
            The Felix Tell Family
          </p>
        </div>
      </div>

      <Link 
        href="/"
        className="elegant-button"
      >
        ← Back to Home
      </Link>
    </div>
  );
} 