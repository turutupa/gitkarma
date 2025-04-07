import { Avatar, Group, Pill, Text } from '@mantine/core';
import styles from './GitHubComment.module.css';

export function GitHubComment() {
  return (
    <div className={styles.wrapper}>
      <Avatar
        size={40}
        radius="sm"
        className={styles.avatar}
        src="https://github.com/mantinedev/mantine/blob/master/.demo/avatars/avatar-2.png?raw=true"
      />

      <div className={styles.commentContainer}>
        <div className={styles.pointer} />

        <div className={styles.header}>
          <Group gap={8} align="center">
            <Text span className={styles.username}>
              <strong>gitkarma.dev</strong>
            </Text>
            <Pill mx="xs" bd="1px solid #393E40" fw={600}>
              bot
            </Pill>
            <Text span className={styles.timestamp}>
              commented 9 hours ago
            </Text>
          </Group>

          <span className={styles.menu}>⋯</span>
        </div>

        <div className={styles.body}>
          <Text fw={600} fz="sm" mb="sm">
            ❌ PR Funding Check: Insufficient Funds
          </Text>

          <Text fz="sm" mb="xs">
            Hi <code>@turutupa</code>! Your pull request could not be approved due to insufficient
            funds.
          </Text>

          <Text fz="sm" fw={600} mt="sm">
            Balance Details:
          </Text>
          <ul className={styles.ul}>
            <li>Current balance: 0 debits</li>
            <li>Required balance: 100 debits</li>
            <li>Shortfall: 100 debits</li>
          </ul>

          <Text fz="sm" fw={600} mt="sm">
            What to do next:
          </Text>
          <ul className={styles.ul}>
            <li>Earn more debits by reviewing and approving other PRs</li>
            <li>Add helpful comments to other PRs</li>
            <li>✨ – after you’ve earned more debits to re-trigger gitkarma check</li>
            <li>🚀 – for bypassing rules and directly passing gitkarma check (admin only)</li>
            <li>💰 – to view your current balance</li>
          </ul>

          <Text fz="sm" mt="sm">
            Need help? Contact your repository administrator.
          </Text>
        </div>
      </div>
    </div>
  );
}
