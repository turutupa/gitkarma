import { Fade } from 'react-awesome-reveal';
import {
  Button,
  Container,
  Group,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';

const Contact = () => {
  const { colorScheme } = useMantineColorScheme();

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validate: {
      name: (value: string) =>
        value.trim().length < 2 ? 'Name must have at least 2 characters' : null,
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      subject: (value: string) => (value.trim().length === 0 ? 'Subject is required' : null),
    },
  });

  return (
    <Container size="sm" p={0}>
      <Fade triggerOnce direction="down" delay={300}>
        <Title ta="center" order={1} mb="sm" fw={900}>
          Get in touch
        </Title>
      </Fade>

      <Fade triggerOnce delay={400} duration={1200}>
        <Text
          ta="center"
          mb="xl"
          fw={500}
          c={colorScheme === 'dark' ? 'dimmed' : ''}
          maw={400}
          m="auto"
        >
          We're all ears! Whether you need help, want a quote, or just want to chat — we'd love to
          hear from you!
        </Text>
      </Fade>

      <form name="contact" action="https://formspree.io/f/xwprylwk" method="POST" noValidate>
        <input type="hidden" name="form-name" value="contact" />
        <input type="text" name="bot-field" style={{ display: 'none' }} />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Fade triggerOnce cascade direction="right" damping={0.1}>
            <TextInput
              label="Name"
              placeholder="Your name"
              {...form.getInputProps('name')}
              name="name"
              required
              variant="filled"
              autoFocus
            />
            <TextInput
              label="Email"
              placeholder="Your email"
              {...form.getInputProps('email')}
              name="email"
              required
              variant="filled"
              type="email"
            />
          </Fade>
        </SimpleGrid>

        <Fade triggerOnce cascade direction="right" damping={0.1}>
          <TextInput
            label="Subject"
            placeholder="Subject"
            {...form.getInputProps('subject')}
            name="subject"
            required
            mt="md"
            variant="filled"
          />
          <Textarea
            label="Message"
            placeholder="Your message"
            {...form.getInputProps('message')}
            name="message"
            required
            mt="md"
            maxRows={10}
            minRows={5}
            autosize
            variant="filled"
          />
          <Group justify="center" mt="xl">
            <Button type="submit" size="md" color="primary.7" disabled={!form.isValid()}>
              Send message
            </Button>
          </Group>
        </Fade>

        <Fade triggerOnce cascade direction="up" delay={800}>
          <Text
            ta="center"
            pt="xl"
            mt="xl"
            mb="xl"
            fw={500}
            c={colorScheme === 'dark' ? 'dimmed' : ''}
            maw={300}
            m="auto"
          >
            We’ll get back to you faster than a caffeinated squirrel 🐿️.
          </Text>
        </Fade>
      </form>
    </Container>
  );
};

export default Contact;
