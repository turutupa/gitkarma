import { Box } from '@mantine/core';
import { PricingCards } from './PricingCards';

export default function Home() {
  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '@media (max-width:755px)': {
          paddingBlock: '5rem',
          height: '100%',
        },
      }}
    >
      <PricingCards />
    </Box>
  );
}
