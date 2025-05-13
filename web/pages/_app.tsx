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
  return (
    <SessionProvider session={session}>
      <Head>
        <title>gitkarma.dev</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="shortcut icon" href="/favicon.png" />
        <meta
          name="description"
          content="Boost your team's productivity with gitkarma.dev, a karma-based economy system for streamlining pull request reviews."
        />
        <meta
          name="keywords"
          content="gitkarma, pull request, pull request review, review, github, git, gitkarma.dev, git karma"
        />
        <meta property="og:title" content="gitkarma.dev" />
        <meta
          property="og:description"
          content="Boost your team's productivity with gitkarma.dev, a karma-based economy system for streamlining pull request reviews."
        />
        <meta property="og:image" content="/gitkarma.png" />
        <meta property="og:url" content="https://gitkarma.dev" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="gitkarma.dev" />
        <meta
          name="twitter:description"
          content="Accelerate Pull Request Reviews using karma economy system."
        />
        <meta name="twitter:image" content="/gitkarma.png" />
        <meta name="twitter:site" content="@gitkarma" />
        <meta name="twitter:creator" content="@gitkarma" />
        <meta name="author" content="gitkarma.dev" />
      </Head>
      <MantineProvider theme={theme} defaultColorScheme="dark">
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
