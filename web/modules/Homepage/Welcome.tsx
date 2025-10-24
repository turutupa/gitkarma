import { Fade } from 'react-awesome-reveal';
import { Button, Text, Title, useMantineColorScheme } from '@mantine/core';
import css from './Welcome.module.css';

export default function Welcome() {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Fade triggerOnce cascade delay={300} damping={0.4} fraction={0.2}>
      <Title className={css.headline} ta="center">
        Never ask for a pull request review again.
      </Title>

      <Text
        c={colorScheme === 'dark' ? 'dimmed' : 'gray.7'}
        ta="center"
        maw={800}
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
        className={css.control}
        mt="xl"
        mx="auto"
        display="block"
        w="fit-content"
      >
        Install GitKarma
      </Button>
    </Fade>
  );
}
