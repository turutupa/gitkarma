import { FaGithub } from 'react-icons/fa';
import { Avatar, Button, Card, Group, Text } from '@mantine/core';
import { TUsersGlobalStats } from '@/models/Analytics';
import { GITHUB_AVATAR_URL } from '@/src/endpoints';
import css from './UserProfile.module.css';

type Props = {
  usersGlobalStats: TUsersGlobalStats | undefined;
};

const UserProfile: React.FC<Props> = ({ usersGlobalStats }) => {
  if (!usersGlobalStats) {
    return <></>;
  }
  const { github_id, github_username, github_url, pull_request_count, review_count, debits } =
    usersGlobalStats;

  return (
    <Card withBorder padding="xl" radius="md" className={css.card}>
      <Card.Section
        h={100}
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80)',
        }}
      />
      <Avatar
        src={`${GITHUB_AVATAR_URL}/${github_id}`}
        size={80}
        radius={80}
        mx="auto"
        mt={-30}
        className={css.avatar}
      />
      <Text ta="center" fz="lg" fw={500} mt="sm" mb="lg">
        {github_username}
      </Text>
      <Group mt="md" justify="center" gap={30}>
        <div>
          <Text ta="center" fz={32} fw={600}>
            {pull_request_count}
          </Text>
          <Text ta="center" fz="sm" c="dimmed" lh={1}>
            Pull Requests
          </Text>
        </div>

        <div>
          <Text ta="center" fz={32} fw={600}>
            {review_count}
          </Text>
          <Text ta="center" fz="sm" c="dimmed" lh={1}>
            Reviews
          </Text>
        </div>

        <div>
          <Text ta="center" fz={32} fw={600}>
            {debits}
          </Text>
          <Text ta="center" fz="sm" c="dimmed" lh={1}>
            Karma Points
          </Text>
        </div>
      </Group>
      <a
        href={github_url}
        target="_blank"
        rel="noreferrer"
        style={{ width: '100%', color: 'default', textDecoration: 'none' }}
      >
        <Button fullWidth radius="md" mt="xl" size="md" variant="default" bg="primary.9">
          GitHub Profile <FaGithub style={{ marginLeft: '10px' }} />
        </Button>
      </a>
    </Card>
  );
};

export default UserProfile;
