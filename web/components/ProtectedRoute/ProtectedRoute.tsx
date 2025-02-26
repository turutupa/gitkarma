import { useSession } from 'next-auth/react';
import { Center, Loader, Stack, Text } from '@mantine/core';
import AuthButton from '../AuthButton';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <Center mih="100px">
        <Loader />
      </Center>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Center px="xl">
        <Stack align="center" gap="md">
          <Text size="xl" fw={700}>
            You need to sign in to view this page.
          </Text>
          <AuthButton />
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}
