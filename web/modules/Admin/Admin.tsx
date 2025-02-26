import { useEffect, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { Alert, Center, Container, Divider, Group, Select, Skeleton, Title } from '@mantine/core';
import { TRepoAndUsers } from '@/models/UserRepo';
import { useAPI } from '@/utils/useAPI';
import RepoSettings from './RepoSettings';
import Users from './Users';

export default function Admin() {
  const { data: user } = useSession();
  const [currentRepo, setCurrentRepo] = useState<TRepoAndUsers | null>(null);

  if (!user) {
    return <></>;
  }

  // @ts-ignore
  const userId = user!.sub;
  const { data: reposAndUsers, error, isLoading } = useAPI<TRepoAndUsers[]>(`repos/${userId}`);

  // auto-populate select on data loaded
  useEffect(() => {
    if (reposAndUsers?.length && !currentRepo) {
      setCurrentRepo(reposAndUsers[0]);
    }
  }, [reposAndUsers]);

  if (error) {
    return <div>Error loading repos.</div>;
  }

  if (isLoading) {
    return (
      <>
        <Skeleton height={50} circle mb="xl" />
        <Skeleton height={8} radius="sm" />
        <Skeleton height={8} mt={6} radius="sm" />
        <Skeleton height={8} mt={6} width="70%" radius="sm" />
      </>
    );
  }

  if (!reposAndUsers || !reposAndUsers.length) {
    return (
      <Center style={{ width: '100vw', height: '100vh' }}>
        <Alert icon={<IconAlertCircle size={16} />} title="No Data Found" color="red">
          We couldn't find any repositories or users associated with your account.
        </Alert>
      </Center>
    );
  }

  return (
    <Container>
      <Group align="center" gap="md" mb="xl">
        <Title order={2}>Git Repository</Title>
        <Select
          maw="300px"
          data={reposAndUsers.map((rau) => rau.repo_name)}
          value={currentRepo?.repo_name}
          onChange={(val) => {
            const targetRepo = reposAndUsers.find((rau) => rau.repo_name === val);
            if (!targetRepo) {
              return;
            }
            setCurrentRepo(targetRepo);
          }}
          allowDeselect={false}
        />
      </Group>

      {reposAndUsers.map((repo: any) => (
        <div key={repo.id}>{currentRepo && <Users users={currentRepo.users} />}</div>
      ))}

      <Divider mt="xl" mb="xl" />

      <RepoSettings />
    </Container>
  );
}
