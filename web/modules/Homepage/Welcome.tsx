import { Text, Title, useMantineColorScheme } from '@mantine/core';
import css from './Welcome.module.css';

export default function Welcome() {
  const { colorScheme } = useMantineColorScheme();

  return (
    <>
      <Title className={css.title} ta="center" mt={100}>
        Welcome to{' '}
        <Text
          inherit
          variant="gradient"
          component="span"
          gradient={{ from: '#2CDD66', to: colorScheme === 'light' ? 'black' : 'white', deg: 90 }}
        >
          gitkarma
        </Text>
      </Title>
      <Text color="dimmed" ta="center" size="lg" maw={700} mx="auto" mt="xl">
        Boost developer productivity with a token-based reward system for pull request reviews. Get
        insights, incentivize collaboration, and improve code quality across your team.
      </Text>
    </>
  );
}
