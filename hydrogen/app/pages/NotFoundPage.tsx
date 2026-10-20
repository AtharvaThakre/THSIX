import { AnnouncementBar } from '../components/Header/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';

export function NotFoundPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '64px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>PAGE NOT FOUND</h1>
        <p style={{ color: '#666' }}>This page doesn&apos;t exist yet.</p>
        <a href="/" style={{ padding: '14px 28px', background: '#111', color: '#fff', fontSize: '13px', letterSpacing: '0.1em', fontWeight: 600 }}>BACK TO HOME</a>
      </main>
      <Footer />
    </>
  );
}
