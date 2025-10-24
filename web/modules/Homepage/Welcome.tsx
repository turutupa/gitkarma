import { Fade } from 'react-awesome-reveal';
import { Button, Text, Title, useMantineColorScheme } from '@mantine/core';
import css from './Welcome.module.css';

export default function Welcome() {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Fade triggerOnce cascade delay={350} damping={0.4}>
      <Title className={css.title} ta="center" mb="lg">
        Git<span className={css.bright}>Karma</span>
      </Title>
      <Title
        className={css.headline}
        ta="center"
        data-text="Never ask for a pull request review again."
      >
        Never ask for a <br />
        PR review again.
      </Title>

      <Text
        c={colorScheme === 'dark' ? 'dimmed' : 'gray.7'}
        ta="center"
        mx="auto"
        className={css.subtitle}
      >
        A karma-based reward system that incentivizes code reviews and speeds up time to merge.
      </Text>

      <Button
        component="a"
        href="https://github.com/apps/gitkarma-dev"
        target="_blank"
        radius="xl"
        size="xl"
        className={css.installButton}
        mt="xl"
        mx="auto"
        display="block"
        w="fit-content"
        variant="default"
        styles={{
          inner: { position: 'relative', zIndex: 1 },
        }}
      >
        Install GitKarma
      </Button>
    </Fade>
  );
}
