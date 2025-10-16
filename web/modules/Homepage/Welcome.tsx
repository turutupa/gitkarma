import { Text, Title } from '@mantine/core';
import css from './Welcome.module.css';

export default function Welcome() {
  return (
    <div className="reveal fade-in">
      <Title className={css.title} ta="center" mt="xl" mb="xl">
        GitKarma
      </Title>

      {/* blockquote */}
      <blockquote className={css.quote}>
        <Text className={css.quoteMarks} aria-hidden="true" mt="xs">
          “
        </Text>
        <Text ta="center" size="xl" fw={700} className={css.quoteText}>
          Can you review my PR?
        </Text>
        <Text ta="center" size="lg" className={css.quoteAttribution}>
          – <span className={css.quoteAuthor}>said no one ever again</span>
        </Text>
      </blockquote>

      <Text color="dimmed" ta="center" size="lg" maw={700} mx="auto" mt="xl">
        No more Slack chasing. Merge PRs faster with a karma-based reward system. Boost developer
        productivity, incentivize collaboration, and improve code quality across your team.
      </Text>
    </div>
  );
}
