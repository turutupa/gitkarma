import { Fade } from 'react-awesome-reveal';
import { GitHubComment } from '@/components/GitHubComment/GitHubComment';

export const Demo = () => {
  return (
    <Fade direction="down">
      Demo right here
      <GitHubComment />
    </Fade>
  );
};

export default Demo;
