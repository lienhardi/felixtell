import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Definiere den Pfad zum Modell-Ordner
    const modelDir = path.join(process.cwd(), 'public', 'models', '2025-05-21');
    
    // Lese alle Dateien im Verzeichnis
    const files = fs.readdirSync(modelDir);
    
    // Filtere nur Bilddateien (jpg, jpeg, png)
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(extension);
    });
    
    // Erstelle die Bild-URLs für jedes Bild
    const imageUrls = imageFiles.map(file => `/models/2025-05-21/${file}`);
    
    // Gib die Liste zurück
    return NextResponse.json({ images: imageUrls });
  } catch (error) {
    console.error('Error reading model images directory:', error);
    return NextResponse.json(
      { error: 'Failed to read model images' },
      { status: 500 }
    );
  }
} 