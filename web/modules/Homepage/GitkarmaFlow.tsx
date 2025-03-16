import {
  IconBrain,
  IconBubbleText,
  IconCircleCheck,
  IconGitPullRequest,
  IconMoneybag,
} from '@tabler/icons-react';
import { Avatar, Container, Text, Timeline, Title, useMantineTheme } from '@mantine/core';

const GitkarmaFlow = () => {
  const theme = useMantineTheme();

  return (
    <Container size="sm" my={60}>
      <Title order={3} ta="center" mb="xl">
        How gitkarma Works
      </Title>
      <Timeline color={theme.colors.primary[6]} active={5} bulletSize={28} lineWidth={2}>
        <Timeline.Item bullet={<IconGitPullRequest size={16} />} title="Pull Request Created">
          <Text color="dimmed" size="sm">
            A developer creates a pull request. gitkarma immediately records the event and checks if
            the developer has sufficient tokens in their account.
          </Text>
          <Text size="xs" mt={4}>
            Step 1
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconMoneybag size={17} />} title="Tokens Deducted">
          <Text color="dimmed" size="sm">
            The required tokens are deducted from the PR creator's balance. The PR check passes,
            allowing the review process to begin.
          </Text>
          <Text size="xs" mt={4}>
            Step 2
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconBrain size={16} />} title="AI Analysis">
          <Text color="dimmed" size="sm">
            Our AI analyzes the PR's complexity to determine appropriate token values and identify
            potential issues for reviewers to focus on.
          </Text>
          <Text size="xs" mt={4}>
            Step 3
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconBubbleText size={16} />} title="PR Reviewed">
          <Text color="dimmed" size="sm">
            Team members review the PR. The AI evaluates review quality to determine fair token
            rewards for meaningful contributions.
          </Text>
          <Text size="xs" mt={4}>
            Step 4
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
          title="Reviewers Rewarded"
        >
          <Text color="dimmed" size="sm">
            Token rewards are credited to reviewers' accounts based on review quality and PR
            complexity. Bonus tokens are awarded for detecting critical issues.
          </Text>
          <Text size="xs" mt={4}>
            Step 5
          </Text>
        </Timeline.Item>

        <Timeline.Item bullet={<IconCircleCheck size={18} />} title="Merge Approved">
          <Text color="dimmed" size="sm">
            Once the PR has sufficient approvals, it's cleared for merging. All activities are
            recorded for team performance analytics.
          </Text>
          <Text size="xs" mt={4}>
            Step 6
          </Text>
        </Timeline.Item>
      </Timeline>
    </Container>
  );
};

export default GitkarmaFlow;
