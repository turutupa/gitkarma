import Layout from '@/components/Layout';

import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { RepoProvider } from '../context/RepoContext';
import { theme } from '../theme';

import './global.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const { title, description } = (Component as any).meta || {};

  return (
    <SessionProvider session={session}>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications />
        <RepoProvider>
          <Layout title={title} description={description}>
            <Component {...pageProps} />
          </Layout>
        </RepoProvider>
      </MantineProvider>
    </SessionProvider>
  );
}
