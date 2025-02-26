import { IconCheck } from '@tabler/icons-react';
import { Button, Group, Image, List, Text, ThemeIcon, Title } from '@mantine/core';
import image from './image.svg';
import css from './Homepage.module.css';

export default function Homepage() {
  return (
    <div className={css.inner}>
      <div className={css.content}>
        <Title className={css.title}>
          A <span className={css.highlight}>modern</span> React <br /> components library
        </Title>
        <Text c="dimmed" mt="md">
          Build fully functional accessible web applications faster than ever – Mantine includes
          more than 120 customizable components and hooks to cover you in any situation
        </Text>

        <List
          mt={30}
          spacing="sm"
          size="sm"
          icon={
            <ThemeIcon size={20} radius="xl">
              <IconCheck size={12} stroke={1.5} />
            </ThemeIcon>
          }
        >
          <List.Item>
            <b>TypeScript based</b> – build type safe applications, all components and hooks export
            types
          </List.Item>
          <List.Item>
            <b>Free and open source</b> – all packages have MIT license, you can use Mantine in any
            project
          </List.Item>
          <List.Item>
            <b>No annoying focus ring</b> – focus ring will appear only when user navigates with
            keyboard
          </List.Item>
        </List>

        <Group mt={30}>
          <Button radius="xl" size="md" className={css.control}>
            Get started
          </Button>
          <Button variant="default" radius="xl" size="md" className={css.control}>
            Source code
          </Button>
        </Group>
      </div>
      <Image src={image.src} className={css.image} />
    </div>
  );
}
