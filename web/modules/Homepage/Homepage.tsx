import Link from 'next/link';
import { IconCoin } from '@tabler/icons-react';
import { Button, Group, Image, List, Text, ThemeIcon, Title } from '@mantine/core';
import image from './image.svg';
import css from './Homepage.module.css';

export default function Homepage() {
  return (
    <div className={css.inner}>
      <div className={css.content}>
        <Title className={css.title}>Instant Reduced Time to Merge.</Title>
        <Text c="dimmed" mt="md">
          GitKarma speeds up pull request merges by requiring developers to review others’ PRs
          before merging their own. Build a collaborative, fair workflow that rewards meaningful
          code reviews and keeps your team moving fast.
        </Text>

        <List
          mt={30}
          spacing="sm"
          size="sm"
          icon={
            <ThemeIcon size={20} radius="xl" color="#2CDD66">
              <IconCoin size={12} stroke={1.5} />
            </ThemeIcon>
          }
        >
          <List.Item>
            <b>Karma economy</b> – Developers earn karma points for reviewing PRs and spend them to
            create their own
          </List.Item>
          <List.Item>
            <b>AI-powered code analysis</b> – Automatic evaluation of PR complexity and review
            quality for fair karma distribution
          </List.Item>
          <List.Item>
            <b>Team metrics dashboard</b> – Track development velocity, code quality trends, and
            team collaboration
          </List.Item>
        </List>

        <Group mt={30}>
          <Button
            component="a"
            href="https://github.com/apps/gitkarma-dev"
            target="_blank"
            radius="xl"
            size="md"
            className={css.control}
          >
            Install App
          </Button>
          <Button
            component={Link}
            href="/docs"
            variant="default"
            radius="xl"
            size="md"
            className={css.control}
          >
            Documentation
          </Button>
        </Group>
      </div>
      <Image src={image.src} className={css.image} />
    </div>
  );
}
