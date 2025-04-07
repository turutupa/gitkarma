import { GitHubComment } from '@/components/GitHubComment/GitHubComment';

export const HowItWorks = () => {
  return (
    <GitHubComment
      username="Bimba"
      description="This is an example comment."
      minutesAgo={5}
      avatarUrl="https://github.com/mantinedev/mantine/blob/master/.demo/avatars/avatar-2.png?raw=true"
    />
  );
};
