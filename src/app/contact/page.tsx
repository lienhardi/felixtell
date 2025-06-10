"use client";
import React, { useState } from "react";
import Image from 'next/image';
import Link from 'next/link';

const sendEmail = async (to: string, subject: string, body: string, attachments?: any[]) => {
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
        reply_to: `"${to}" <${to}>`,
        attachments
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("Brand");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    const body = `Contact form submission\n\nName: ${name}\nEmail: ${email}\nCompany/Brand: ${company}\nRole: ${role}\nMessage: ${message}`;
    const success = await sendEmail(
      "family@felixtell.com",
      "New Contact Submission",
      body
    );
    setLoading(false);
    if (success) {
      setStatus("Thank you for your message! We will get back to you soon.");
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
      setRole("Brand");
    } else {
      setStatus("There was an error sending your message. Please try again.");
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <div className="background-stripes" />
      <div className="flex flex-col items-center min-h-screen p-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="w-full flex justify-center mb-8 mt-4" style={{ minHeight: 180 }}>
          <Link href="/">
            <Image
              src="/Felix_Tell_logo.png"
              alt="Felix Tell Artists' Bureau 1842"
              width={320}
              height={120}
              style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer' }}
              priority
            />
          </Link>
        </div>
        <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-[#E5C76B] p-8 mt-2">
          <h1 className="text-4xl font-bold mb-2 text-center text-black">Partner with Felix Tell</h1>
          <p className="text-lg text-center text-gray-700 mb-6">
            Are you a brand looking for exceptional talent? Get in touch with us to discover unique models and creative collaborations. Models are also welcome to reach out here!
          </p>
          {status ? (
            <div className="flex flex-col items-center">
              <div className="text-center mt-2 text-base text-green-700 font-medium">{status}</div>
              <Link href="/" className="mt-6 px-6 py-3 rounded-full bg-[var(--gold)] text-white font-semibold text-lg hover:bg-[#c4a436] transition-colors">
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Company / Brand</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  required={role === "Brand"}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">I am a...</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="Brand">Brand</option>
                  <option value="Model">Model</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Message</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[var(--gold)] focus:border-[var(--gold)] outline-none"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[var(--gold)] text-white font-semibold text-lg hover:bg-[#c4a436] transition-colors mt-2 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
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