// =============================================
// pages/_app.tsx
// 앱 루트 — 전역 CSS import
// =============================================

import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
