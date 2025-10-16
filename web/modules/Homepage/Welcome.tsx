import { Fade } from 'react-awesome-reveal';
import { Text, Title, useMantineColorScheme } from '@mantine/core';
import css from './Welcome.module.css';

export default function Welcome() {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Fade triggerOnce cascade damping={0.2} fraction={0.2}>
      <Title className={css.title} ta="center">
        Git<span className={css.bright}>Karma</span>
      </Title>

      {/* blockquote */}
      <blockquote className={css.quote}>
        <Text className={css.quoteMarks} aria-hidden="true" mt="xs">
          “
        </Text>
        <Text ta="center" size="xl" fw={700} className={css.quoteText}>
          Can you review my PR?
        </Text>
        <Text
          ta="center"
          size="lg"
          fs="italic"
          className={css.quoteAttribution}
          color={colorScheme === 'dark' && 'dimmed'}
        >
          – said no one ever again
        </Text>
      </blockquote>

      <Text
        color={colorScheme === 'dark' && 'dimmed'}
        ta="center"
        size="lg"
        maw={700}
        mx="auto"
        mt="xl"
      >
        No more Slack chasing. Merge PRs faster with a karma-based reward system. Boost developer
        productivity, incentivize collaboration, and improve code quality across your team.
      </Text>
    </Fade>
  );
}
