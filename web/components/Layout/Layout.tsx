import { Container } from '@mantine/core';
import Head from 'next/head';
import Footer from './Footer';
import Header from './Header';

type Props = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

const Layout: React.FC<Props> = ({ children, title, description }) => {
  // use this for different container width for dashboard page
  // const router = useRouter();
  // const [adminTab] = useSessionStorage('adminCurrentTab', 'Users');
  // const isDashboardRoute = router.asPath === '/admin' && adminTab === 'Dashboard';

  const pageTitle = title ? `${title} - gitkarma.dev` : 'gitkarma.dev';
  const baseDescription = "Boost your team's productivity with GitKarma, a karma-based economy system for streamlining pull request reviews.";
  const pageDescription = description ? `${baseDescription} ${description}` : baseDescription;

  return (
    <Container fluid mih="100vh" pos="relative" p={0} style={{ overflow: 'hidden' }}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      <Header />
      <Container mt="100px" pb="150px" size="xl">
        {children}
      </Container>
      <Container fluid w="100%" pos="absolute" bottom={0}>
        <Footer />
      </Container>
    </Container>
  );
};

export default Layout;
