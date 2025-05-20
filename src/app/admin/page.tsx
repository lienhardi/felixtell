"use client";
import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [useHtml, setUseHtml] = useState(false);
  const [htmlBody, setHtmlBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Passwortprüfung
  const authenticate = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'Felix1837') {
      setIsAuthenticated(true);
      setLoginError('');
      // Passwort im Session Storage speichern
      sessionStorage.setItem('ftauth', 'true');
    } else {
      setLoginError('Falsches Passwort');
    }
  };

  // Beim Laden prüfen, ob bereits authentifiziert
  useEffect(() => {
    if (sessionStorage.getItem('ftauth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // HTML-Template erstellen wenn Plaintext geändert wird
  useEffect(() => {
    if (useHtml && emailBody) {
      // Einfache Konvertierung von Plaintext zu HTML
      const paragraphs = emailBody.split('\n\n').filter(p => p.trim());
      const formattedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          </style>
        </head>
        <body>
          ${paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
        </body>
        </html>
      `;
      setHtmlBody(formattedHtml);
    }
  }, [emailBody, useHtml]);

  const sendEmail = async () => {
    try {
      setIsSending(true);
      setSendResult(null);
      
      const emailData: any = {
        to: emailTo,
        subject: emailSubject,
        body: emailBody
      };
      
      // Wenn HTML aktiviert ist, füge es hinzu
      if (useHtml) {
        emailData.html = htmlBody;
      }
      
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden der E-Mail');
      }
      
      setSendResult({ success: true, message: 'E-Mail wurde erfolgreich gesendet' });
      // Felder zurücksetzen
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      setHtmlBody('');
    } catch (error: any) {
      setSendResult({ success: false, message: error.message || 'Fehler beim Senden der E-Mail' });
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-8 shadow-md">
          <h1 className="text-2xl font-serif mb-6 pb-2 border-b">Felix Tell Admin</h1>
          
          {loginError && (
            <div className="p-4 mb-6 bg-red-100 text-red-800">
              {loginError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Passwort:</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && authenticate()}
            />
          </div>
          
          <button
            onClick={authenticate}
            className="px-6 py-2 bg-gray-800 text-white hover:bg-gray-700"
          >
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-md">
        <div className="flex justify-between items-center mb-6 pb-2 border-b">
          <h1 className="text-2xl font-serif">Felix Tell Admin - E-Mail senden</h1>
          <button 
            onClick={() => {
              sessionStorage.removeItem('ftauth');
              setIsAuthenticated(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Abmelden
          </button>
        </div>
        
        {sendResult && (
          <div className={`p-4 mb-6 ${sendResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {sendResult.message}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">An:</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="Empfänger E-Mail-Adresse"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Betreff:</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Betreff der E-Mail"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-gray-700 mb-2">Nachricht:</label>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Inhalt der E-Mail"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={10}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={useHtml}
              onChange={(e) => setUseHtml(e.target.checked)}
              className="mr-2"
            />
            <span className="text-gray-700">HTML-E-Mail senden (mit Formatierung und Signatur)</span>
          </label>
        </div>
        
        <div>
          <button
            onClick={sendEmail}
            disabled={isSending || !emailTo || !emailSubject || !emailBody}
            className={`px-6 py-2 bg-gray-800 text-white ${isSending || !emailTo || !emailSubject || !emailBody ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
          >
            {isSending ? 'Wird gesendet...' : 'E-Mail senden'}
          </button>
        </div>
      </div>
    </div>
  );
} 