import { useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
  IconGitPullRequest,
} from '@tabler/icons-react';
import { ActionIcon, Container, Group } from '@mantine/core';
import css from './Footer.module.css';

const Footer = () => {
  const router = useRouter();

  const onLogoClick = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className={css.footer}>
      <Container className={css.inner} size="lg">
        <ActionIcon
          size="lg"
          color="var(--mantine-colors-primary-6)"
          radius="xl"
          onClick={onLogoClick}
        >
          <IconGitPullRequest size={22} stroke={1.5} />
        </ActionIcon>
        <Group gap={0} className={css.links} justify="flex-end" wrap="nowrap">
          <ActionIcon size="lg" color="gray" variant="subtle">
            <IconBrandTwitter size={18} stroke={1.5} />
          </ActionIcon>
          <ActionIcon size="lg" color="gray" variant="subtle">
            <IconBrandYoutube size={18} stroke={1.5} />
          </ActionIcon>
          <ActionIcon size="lg" color="gray" variant="subtle">
            <IconBrandInstagram size={18} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Container>
    </div>
  );
};

export default Footer;
