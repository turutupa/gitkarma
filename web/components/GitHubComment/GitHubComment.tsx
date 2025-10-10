import { Avatar, Group, Pill, Text } from '@mantine/core';
import css from './GitHubComment.module.css';

type FailedCommentProps = {
  variant: 'failed';
  username: string;
  currentBalance: number;
  requiredBalance: number;
  shortfall?: number;
  timestamp?: string;
};

type CompletedCommentProps = {
  variant: 'completed';
  username: string;
  oldBalance: number;
  newBalance: number;
  mergePenalty: number;
  timestamp?: string;
};

type GitHubCommentProps = FailedCommentProps | CompletedCommentProps;

export function GitHubComment(props: GitHubCommentProps) {
  const { username, timestamp = 'commented 9 hours ago' } = props;

  let body: React.ReactNode = null;

  if (props.variant === 'failed') {
    const shortfall = props.shortfall ?? props.requiredBalance - props.currentBalance;

    body = (
      <div className={css.body}>
        <Text fw={600} fz="sm" mb="sm">
          ❌ PR Funding Check: Insufficient Funds
        </Text>

        <Text fz="sm" mb="xs">
          Hi <code>@{username}</code>! Your pull request could not be approved due to insufficient
          funds.
        </Text>

        <Text fz="sm" fw={600} mt="sm">
          Balance Details:
        </Text>
        <ul className={css.ul}>
          <li>Current balance: {props.currentBalance} karma points</li>
          <li>Required balance: {props.requiredBalance} karma points</li>
          <li>Shortfall: {shortfall} karma points</li>
        </ul>

        <Text fz="sm" fw={600} mt="sm">
          What to do next:
        </Text>
        <ul className={css.ul}>
          <li>Earn more karma points by reviewing and approving other PRs</li>
          <li>Add helpful comments to other PRs</li>
          <li>✨ – after you’ve earned more karma points to re-trigger gitkarma check</li>
          <li>🚀 – for bypassing rules and directly passing gitkarma check (admin only)</li>
          <li>💰 – to view your current balance</li>
        </ul>

        <Text fz="sm" mt="sm">
          Need help? Contact your repository administrator.
        </Text>
      </div>
    );
  } else {
    body = (
      <div className={css.body} style={{ textAlign: 'left' }}>
        <Text fw={600} fz="sm" mb="sm">
          ✅ Karma Points Verification Complete
        </Text>

        <Text fz="sm" mb="xs">
          <strong>Pull Request Approved for Merge</strong>
        </Text>

        <Text fz="sm" mb="xs">
          @{username} has a sufficient balance of <strong>{props.oldBalance}💰</strong> karma
          points, exceeding the required <strong>{props.mergePenalty}</strong> karma points for this
          repository.
        </Text>

        <Text fz="sm" fw={600} mt="sm">
          Balance Details
        </Text>
        <ul className={css.ul}>
          <li>Previous balance: {props.oldBalance}💰</li>
          <li>Karma points deducted: {props.mergePenalty}💰</li>
          <li>New balance: {props.newBalance}💰</li>
        </ul>

        <Text fz="sm" mt="sm">
          Thank you for using GitKarma!
        </Text>
      </div>
    );
  }

  return (
    <div className={css.wrapper}>
      <Avatar
        size={40}
        radius="sm"
        className={css.avatar}
        src="https://github.com/mantinedev/mantine/blob/master/.demo/avatars/avatar-2.png?raw=true"
      />

      <div className={css.commentContainer}>
        <div className={css.pointer} />

        <div className={css.header}>
          <Group gap={8} align="center">
            <Text span className={css.username}>
              <strong>gitkarma.dev</strong>
            </Text>
            <Pill mx="xs" bd="1px solid #393E40" fw={600}>
              bot
            </Pill>
            <Text span className={css.timestamp}>
              {timestamp}
            </Text>
          </Group>

          <span className={css.menu}>⋯</span>
        </div>

        {body}
      </div>
    </div>
  );
}
