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
  Transition,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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
  // these 2 states are used to trigger transition when switching between repos
  const [isContentVisible, setIsVisible] = useState(true);
  const [prevRepoId, setPrevRepoId] = useState(currentRepoGithubId);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMobile = useMediaQuery('(max-width: 450px)');

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

  useEffect(() => {
    // If repo changed, trigger transition
    if (currentRepoGithubId !== prevRepoId) {
      setIsVisible(false);

      // Short timeout to let fade-out complete
      setTimeout(() => {
        setPrevRepoId(currentRepoGithubId);
        setIsVisible(true);
      }, 200); // Match duration with transition duration
    }
  }, [currentRepoGithubId, prevRepoId]);

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

  const renderTabContent = useCallback(() => {
    if (!currentRepoGithubId || !currentRepo) {
      return null;
    }

    // Create content based on current tab
    const getTabContent = () => {
      switch (currentTab) {
        case 'Users':
          currentRepo.users.sort((a, b) => a.github_username.localeCompare(b.github_username));
          return <Users users={currentRepo.users} repoId={currentRepo.repo_id} />;
        case 'Settings':
          return (
            <RepoSettings currentRepo={currentRepo} mutateReposAndUsers={mutateReposAndUsers} />
          );
        case 'Stats':
          return (
            <Center>
              <Title mt="xl" order={2}>
                🏗️ Stats page under construction 🚧
              </Title>
            </Center>
          );
        default:
          return null;
      }
    };

    // wrap content with transition
    return (
      <Transition
        key={`${currentRepo.repo_id}-${currentTab}`}
        mounted={isContentVisible}
        transition="scale-y"
        duration={200}
        timingFunction="ease"
      >
        {(styles) => <div style={styles}>{getTabContent()}</div>}
      </Transition>
    );
  }, [currentRepo, currentRepoGithubId, currentTab, isContentVisible, mutateReposAndUsers]);

  const errorComponent = (
    <Center>
      <Alert
        mt="xl"
        maw="500"
        variant="light"
        color="red"
        title="Error Fetching Data"
        icon={<IconAlertCircle />}
      >
        An error occurred while retrieving your user information. Please try again later or contact
        support if the issue persists.
      </Alert>
    </Center>
  );

  if (error) {
    return errorComponent;
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
    <Container p={0}>
      <Group align="center" justify="space-between" mb="xl">
        <Group>
          {isDesktop && <Title order={2}>Git Repository</Title>}
          <Select
            w={isMobile ? '150px' : '200px'}
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
          radius="md"
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
