import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '@/lib/auth';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Vira Coaching — YKS Koçluk Platformu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="12. sınıf ve mezun öğrenciler için birebir ve grup YKS koçluğu: dersler, ödevler, denemeler, ilerleme takibi."
        />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
