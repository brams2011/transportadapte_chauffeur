import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transport Adapté et Régulier Chauffeur',
  description: 'Tableau de bord pour chauffeurs de transport adapté',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
