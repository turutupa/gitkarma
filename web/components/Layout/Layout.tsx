import { Container } from '@mantine/core';
import Footer from './Footer';
import Header from './Header';

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <Container fluid mih="100vh" pos="relative" p={0} style={{ overflow: 'hidden' }}>
      <Header />
      <Container mt="100px" pb="150px" size="lg">
        {children}
      </Container>
      <Container fluid w="100%" pos="absolute" bottom={0}>
        <Footer />
      </Container>
    </Container>
  );
};

export default Layout;
