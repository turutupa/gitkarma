import Pricing from '@/modules/Pricing/Pricing';

const PricingPage = () => {
  return <Pricing />;
};

(PricingPage as any).meta = {
  title: 'Pricing',
  description: 'Find the perfect GitKarma plan for your team and start improving your pull request review process today.',
};

export default PricingPage;
