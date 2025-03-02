import { useEffect, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Center,
  Container,
  Group,
  SegmentedControl,
  Select,
  Skeleton,
  Title,
} from '@mantine/core';
import { useRepoContext } from '@/context/RepoContext';
import { TRepoAndUsers } from '@/models/UserRepo';
import { useAPI } from '@/utils/useAPI';
import RepoSettings from './RepoSettings';
import Users from './Users';
import css from './Admin.module.css';

export default function Admin() {
  const { data: user } = useSession();
  const { currentRepo, setCurrentRepo } = useRepoContext();
  const [currentTab, setCurrentTab] = useState('Users');

  if (!user) {
    return <></>;
  }

  const { data: reposAndUsers, error, isLoading } = useAPI<TRepoAndUsers[]>(`/repos`);

  // auto-populate select on data loaded
  useEffect(() => {
    if (reposAndUsers?.length && !currentRepo) {
      setCurrentRepo(reposAndUsers[0]);
    }
  }, [reposAndUsers, currentRepo, setCurrentRepo]);

  if (error) {
    return (
      <Center>
        <Alert
          mt="xl"
          maw="500"
          variant="light"
          color="red"
          title="Error Fetching Data"
          icon={<IconAlertCircle />}
        >
          An error occurred while retrieving your user information. Please try again later or
          contact support if the issue persists.
        </Alert>
      </Center>
    );
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

  const renderTabContent = () => {
    /** USERS LIST */
    if (currentTab === 'Users') {
      if (!currentRepo) {
        return null;
      }
      return reposAndUsers.map((repo: any) => (
        <div key={repo.id}>
          {currentRepo && <Users users={currentRepo.users} repoId={currentRepo.repo_id} />}
        </div>
      ));
    } else if (currentTab === 'Settings') {
      /** REPO SETTINGS */
      return <RepoSettings />;
    } else if (currentTab === 'Stats') {
      /** REPO STATS */
      return (
        <Center>
          <Title mt="xl" order={2}>
            🏗️ Stats page under construction 🚧
          </Title>
        </Center>
      );
    }
  };

  return (
    <Container>
      <Group align="center" justify="space-between" gap="md" mb="xl">
        <Group>
          <Title order={2}>Git Repository</Title>
          <Select
            maw="300px"
            data={reposAndUsers.map((rau) => rau.repo_name)}
            value={currentRepo?.repo_name}
            onChange={(val) => {
              const targetRepo = reposAndUsers.find((rau) => rau.repo_name === val);
              setCurrentRepo(targetRepo || null);
            }}
            allowDeselect={false}
          />
        </Group>
        <SegmentedControl
          radius="xl"
          size="sm"
          data={['Users', 'Settings', 'Stats']}
          classNames={css}
          value={currentTab}
          onChange={(value) => setCurrentTab(value)}
        />
      </Group>

      {renderTabContent()}
    </Container>
  );
}
