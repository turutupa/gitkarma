import {
  Button,
  Center,
  Container,
  Group,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';

const Contact = () => {
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validate: {
      name: (value: string) => value.trim().length < 2,
      email: (value: string) => !/^\S+@\S+$/.test(value),
      subject: (value: string) => value.trim().length === 0,
    },
  });

  return (
    <Container size="sm" p={0}>
      <Title ta="center" order={1} mb="sm" fw={900}>
        Get in touch
      </Title>
      <Text ta="center" mb="xl" fw={500} c="dimmed" maw={400} m="auto">
        We're all ears! Whether you need help, want a quote, or just want to chat — we'd love to
        hear from you!
      </Text>
      <form onSubmit={form.onSubmit(() => {})}>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Name"
            placeholder="Your name"
            name="name"
            variant="filled"
            disabled
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Email"
            placeholder="Your email"
            name="email"
            variant="filled"
            disabled
            {...form.getInputProps('email')}
          />
        </SimpleGrid>

        <TextInput
          label="Subject"
          placeholder="Subject"
          mt="md"
          name="subject"
          variant="filled"
          disabled
          {...form.getInputProps('subject')}
        />
        <Textarea
          mt="md"
          label="Message"
          placeholder="Your message"
          maxRows={10}
          minRows={5}
          autosize
          name="message"
          variant="filled"
          disabled
          {...form.getInputProps('message')}
        />
        <Group justify="center" mt="xl">
          <Button type="submit" size="md" disabled>
            Send message
          </Button>
        </Group>
        <Center mt="xl">Temporarily disabled. Sorry for the inconvenience.</Center>
      </form>
    </Container>
  );
};

export default Contact;
