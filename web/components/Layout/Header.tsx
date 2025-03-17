import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSun } from 'react-icons/fa';
import { MdOutlineDarkMode } from 'react-icons/md';
import {
  Burger,
  Container,
  Drawer,
  Group,
  Stack,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import AuthButton from '../AuthButton';
import css from './Header.module.css';

// import { MantineLogo } from '@mantinex/mantine-logo';

const links = [
  { link: '/', label: 'About' },
  { link: '/pricing', label: 'Pricing' },
  { link: '/contact', label: 'Contact' },
  { link: '/admin', label: 'Admin' },
];

const Header = () => {
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [active, setActive] = useState(router.asPath || links[0].link);
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (active !== router.asPath) {
      setActive(router.asPath);
    }
  }, [router]);

  const items = links.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={css.link}
      data-active={active === link.link || undefined}
      onClick={() => {
        setActive(link.link);
        close(); // Close the drawer when a link is clicked
      }}
    >
      {link.label}
    </Link>
  ));

  const mobileItems = links.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={css.mobileLink}
      data-active={active === link.link || undefined}
      onClick={() => {
        setActive(link.link);
        close();
      }}
    >
      {link.label}
    </Link>
  ));

  return (
    <header className={css.header}>
      <Drawer
        opened={opened}
        onClose={close}
        title={<Title order={3}>Navigation</Title>}
        padding="sm"
        size="100%"
        position="bottom"
        offset={8}
        radius="md"
      >
        <Stack pt="sm">
          {mobileItems}
          <Group justify="space-between">
            <AuthButton />
            <ThemeIcon
              variant="light"
              radius="lg"
              onClick={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
              className={css.pointer}
            >
              {colorScheme === 'light' ? <MdOutlineDarkMode /> : <FaSun />}
            </ThemeIcon>
          </Group>
        </Stack>
      </Drawer>

      <Container className={css.inner}>
        <Group gap={8} visibleFrom="xs">
          <ThemeIcon
            variant="light"
            radius="lg"
            onClick={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
            className={css.pointer}
          >
            {colorScheme === 'light' ? <MdOutlineDarkMode /> : <FaSun />}
          </ThemeIcon>
          {items}
        </Group>

        <AuthButton />

        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
};

export default Header;
