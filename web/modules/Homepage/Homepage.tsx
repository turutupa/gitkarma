import Link from 'next/link';
import { IconCoin } from '@tabler/icons-react';
import {
  Button,
  Group,
  List,
  Paper,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { GitHubCheck } from '../../components/GitHubCheck/GitHubCheck';
import css from './Homepage.module.css';

export default function Homepage() {
  const { colorScheme } = useMantineColorScheme();

  return (
    <div className={css.container}>
      <div className={css.content}>
        <Title className={css.title}>Instant Reduced Time to Merge.</Title>
        <Text c={colorScheme === 'dark' ? 'dimmed' : ''} mt="md">
          Remember chasing teammates on Slack just to get your PR reviewed?{' '}
          <b>“Can you review my PR?”</b> was a daily ritual.
        </Text>

        <Text c={colorScheme === 'dark' ? 'dimmed' : ''} mt="md">
          With GitKarma, that’s history.
        </Text>

        <Text c={colorScheme === 'dark' ? 'dimmed' : ''} mt="md">
          Now, developers earn karma by reviewing others’ PRs and spend it to merge their own—no
          more nagging, just a fair, collaborative workflow that rewards meaningful code reviews and
          keeps your team moving fast.
        </Text>

        <Paper shadow="xs" p="lg" mt="lg" mb="lg">
          <Text ta="center" size="lg" maw={700}>
            It's a <span className={css.highlightGate}>gate</span> – not a game.
          </Text>
        </Paper>

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

      <div className={css.slackColumn}>
        <div className={css.transitionWrapper}>
          <div className={css.slackPosition}>
            <div className={css.slackWindow}>
              <div className={css.slackHeader}>
                <span className={css.slackHeaderDot} />
              </div>
              <div className={css.slackMessage}>
                <img
                  src="https://raw.githubusercontent.com/mantinedev/mantine/refs/heads/master/.demo/avatars/avatar-2.png"
                  alt="Slack Avatar"
                  className={css.slackAvatar}
                />
                <div className={css.slackText}>
                  <div className={css.slackMeta}>
                    <span className={css.slackUsername}>johndoe</span>
                    <span className={css.slackTimestamp}>10:24 AM</span>
                  </div>
                  <div className={css.slackContent}>Can you review my PR?</div>
                </div>
              </div>
            </div>
          </div>

          {/* Present: GitHubCheck */}
          <div className={css.githubCheckPosition}>
            <GitHubCheck
              variant="completed"
              oldBalance={120}
              newBalance={100}
              mergePenalty={20}
              title="GitKarma Check"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
