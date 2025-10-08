import Demo from '@/modules/Homepage/Demo';
import GitkarmaCapabilities from '@/modules/Homepage/GitkarmaCapabilities';
import GitkarmaFlow from '@/modules/Homepage/GitkarmaFlow';
import Homepage from '@/modules/Homepage/Homepage';
import Welcome from '@/modules/Homepage/Welcome';

export default function HomePage() {
  return (
    <>
      {/* <GitHubComment /> */}
      <Welcome />
      <Homepage />
      <Demo />
      <GitkarmaCapabilities />
      <GitkarmaFlow />
    </>
  );
}
