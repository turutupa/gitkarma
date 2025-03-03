import { useCallback, useEffect, useState } from 'react';
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
import { useSessionStorage } from '@/utils/useSessionStorage';
import RepoSettings from './RepoSettings';
import Users from './Users';
import css from './Admin.module.css';

export default function Admin() {
  const { data: user } = useSession();
  const { currentRepoGithubId, setCurrentRepoGithubId } = useRepoContext();
  const [currentRepo, setCurrentRepo] = useState<TRepoAndUsers | null>(null);
  const [currentTab, setCurrentTab] = useSessionStorage('adminCurrentTab', 'Users');

  const { data: reposAndUsers, error, isLoading, mutate } = useAPI<TRepoAndUsers[]>(`/repos`);

  useEffect(() => {
    if (!reposAndUsers) {
      return;
    }
    const repo = reposAndUsers.find((repo) => repo.repo_id === currentRepoGithubId);
    if (!repo) {
      return;
    }
    setCurrentRepo(repo);
  }, [currentRepoGithubId, reposAndUsers]);

  if (!user) {
    return <></>;
  }

  const mutateReposAndUsers = useCallback(
    (repoData: Record<string, string | number>) => {
      const updatedReposAndUsers = reposAndUsers.map((repo) => {
        if (repo.repo_id === repoData.repo_id) {
          return { ...repo, ...repoData };
        }
        return repo;
      });
      mutate(updatedReposAndUsers);
    },
    [reposAndUsers]
  );

  // auto-populate select on data loaded
  useEffect(() => {
    if (reposAndUsers?.length && !currentRepoGithubId) {
      const repoId = reposAndUsers[0].repo_id;
      setCurrentRepoGithubId(repoId);
    }
  }, [reposAndUsers, currentRepoGithubId, setCurrentRepoGithubId]);

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
    if (!currentRepoGithubId || !currentRepo) {
      return null;
    }

    /** USERS LIST */
    if (currentTab === 'Users') {
      return reposAndUsers.map((repo: any) => (
        <div key={repo.id}>
          {currentRepoGithubId && <Users users={currentRepo.users} repoId={currentRepo.repo_id} />}
        </div>
      ));
    } else if (currentTab === 'Settings') {
      /** REPO SETTINGS */
      return <RepoSettings currentRepo={currentRepo} mutateReposAndUsers={mutateReposAndUsers} />;
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
              setCurrentRepoGithubId(targetRepo?.repo_id || null);
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
