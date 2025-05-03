import Layout from '@/components/Layout';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
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
  return (
    <SessionProvider session={session}>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Head>
          <title>gitkarma</title>
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
          />
          <link rel="shortcut icon" href="/favicon.png" />
        </Head>
        <Notifications />
        <RepoProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </RepoProvider>
      </MantineProvider>
    </SessionProvider>
  );
}
