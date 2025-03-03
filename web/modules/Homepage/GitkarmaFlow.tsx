import {
  IconBubbleText,
  IconCircleCheck,
  IconGitPullRequest,
  IconMoneybag,
} from '@tabler/icons-react';
import { Avatar, Container, Text, Timeline, Title } from '@mantine/core';

const GitkarmaFlow = () => {
  return (
    <Container size="sm">
      <Title order={3} ta="center" mb="md">
        How GitKarma Works
      </Title>
      <Timeline color="var(--mantine-color-primary-6)" active={2} bulletSize={28} lineWidth={2}>
        <Timeline.Item bullet={<IconGitPullRequest size={16} />} title="Pull Request Created">
          <Text color="dimmed" size="sm">
            A developer creates a pull request. GitKarma immediately records the event and deducts
            the required tokens from the PR creator's account.
          </Text>
          <Text size="xs" mt={4}>
            2 hours ago
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconMoneybag size={17} />} title="Tokens Deducted">
          <Text color="dimmed" size="sm">
            The system deducts the necessary tokens (credits) from the PR creator's balance.
          </Text>
          <Text size="xs" mt={4}>
            52 minutes ago
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconBubbleText size={16} />} title="PR Reviewed">
          <Text color="dimmed" size="sm">
            Other developers review the PR and approve it. Their review actions are recorded by
            GitKarma.
          </Text>
          <Text size="xs" mt={4}>
            34 minutes ago
          </Text>
        </Timeline.Item>

        <Timeline.Item
          bullet={
            <Avatar
              size={24}
              radius="xl"
              src="https://github.com/mantinedev/mantine/blob/master/.demo/avatars/avatar-2.png?raw=true"
            />
          }
          title="Approvers Rewarded"
          lineVariant="dashed"
        >
          <Text color="dimmed" size="sm">
            Token rewards are credited back to the reviewers' accounts for their approval.
          </Text>
          <Text size="xs" mt={4}>
            12 minutes ago
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconCircleCheck size={18} />} title="Merge Approved">
          <Text color="dimmed" size="sm">
            Once the PR has enough approvals and tokens are verified, the pull request is cleared
            for merging.
          </Text>
          <Text size="xs" mt={4}>
            3 minutes ago
          </Text>
        </Timeline.Item>
      </Timeline>
    </Container>
  );
};

export default GitkarmaFlow;
