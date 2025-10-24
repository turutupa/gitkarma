import Demo from '@/modules/Homepage/Demo';
import GitKarmaFeatures from '@/modules/Homepage/GitKarmaFeatures';
import Homepage from '@/modules/Homepage/Homepage';
import Welcome from '@/modules/Homepage/Welcome';

export default function HomePage() {
  return (
    <>
      <Welcome />
      <Homepage />
      <Demo />
      <GitKarmaFeatures />
    </>
  );
}

(HomePage as any).meta = {
  title: 'Home',
  description: 'Learn how GitKarma can help you merge pull requests faster and improve your team\'s workflow.',
};
