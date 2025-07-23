// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  // Cambia esta URL base por tu dominio real cuando publiques el proyecto
  metadataBase: new URL('https://bolivia-decide-app.vercel.app'), // URL de ejemplo
  title: "Bolivia Decide 2025",
  description: "Tu opinión cuenta. Mira el mapa electoral en tiempo real y suma tu voz. ¿Quién va ganando en tu municipio?",
  openGraph: {
    title: "Bolivia Decide 2025",
    description: "Tu opinión cuenta. Mira el mapa electoral en tiempo real y suma tu voz.",
    // Recuerda poner una imagen llamada 'social-preview.jpg' en la carpeta /public
    images: ['/social-preview.jpg'], 
  },
  twitter: {
    card: 'summary_large_image',
    title: "Bolivia Decide 2025",
    description: "Tu opinión cuenta. Mira el mapa electoral en tiempo real y suma tu voz.",
    images: ['/social-preview.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}