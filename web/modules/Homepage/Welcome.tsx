import { Fade } from 'react-awesome-reveal';
import { Button, Text, Title } from '@mantine/core';
import ParticlesCanvas from './ParticlesCanvas';
import css from './Welcome.module.css';

export default function Welcome() {
  return (
    <div className={css.wrapper}>
      <div className={css.container}>
        <Fade triggerOnce cascade delay={350} damping={0.4}>
          <Title className={css.title} ta="center" mb="lg">
            <span className={css.git}>Git</span>
            <span className={css.bright}>Karma</span>
          </Title>

          <Title
            className={css.headline}
            ta="center"
            data-text="Never ask for a pull request review again."
          >
            Never ask for a <br />
            PR review again.
          </Title>

          <Text ta="center" mx="auto" className={css.subtitle}>
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
      </div>

      {/* background effect */}
      <div className={css.backgroundVideo}>
        <ParticlesCanvas />
      </div>
    </div>
  );
}
