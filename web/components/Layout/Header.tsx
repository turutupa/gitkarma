import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FaSun } from 'react-icons/fa';
import { MdOutlineDarkMode } from 'react-icons/md';
import {
  Box,
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

type TLink = {
  link: string;
  label: string;
};

const defaultLinks: TLink[] = [
  { link: '/', label: 'About' },
  { link: '/docs', label: 'Docs' },
  { link: '/pricing', label: 'Pricing' },
  { link: '/contact', label: 'Contact' },
];
const authLinks: TLink[] = [{ link: '/admin', label: 'Admin' }];

const Header = () => {
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [active, setActive] = useState(router.asPath || defaultLinks[0].link);
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  const { data: session } = useSession();

  useEffect(() => {
    if (active !== router.asPath) {
      setActive(router.asPath);
    }
  }, [router]);

  const links: TLink[] = useMemo(() => {
    if (session) {
      return [...defaultLinks, ...authLinks];
    }
    return defaultLinks;
  }, [session]);

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
        title={
          <Group flex={1} wrap="nowrap">
            <Title order={3}>
              <Image
                src="/favicon.png"
                alt="Logo"
                width={38}
                height={38}
                className={css.mobileLogo}
              />
              Navigation
            </Title>
          </Group>
        }
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
              radius="xl"
              onClick={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
              className={css.pointer}
              size={38}
            >
              {colorScheme === 'light' ? <MdOutlineDarkMode size={18} /> : <FaSun size={18} />}
            </ThemeIcon>
          </Group>
        </Stack>
      </Drawer>

      <Container size="xl" className={css.inner}>
        <Group gap={8} visibleFrom="xs">
          <Box mr={6} mt={6}>
            <Image src="/favicon.png" alt="Logo" width={38} height={38} />
          </Box>
          {items}
        </Group>

        <Group gap={16} visibleFrom="xs">
          <ThemeIcon
            size={38}
            variant="light"
            radius="xl"
            onClick={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
            className={css.pointer}
          >
            {colorScheme === 'light' ? <MdOutlineDarkMode size={18} /> : <FaSun size={18} />}
          </ThemeIcon>
          <AuthButton />
        </Group>

        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
};

export default Header;
