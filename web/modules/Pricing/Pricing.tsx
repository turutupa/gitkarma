import { useMemo } from 'react';
import { Group, SimpleGrid, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import PricingCard from './PricingCard';

const Pricing = () => {
  const theme = useMantineTheme();

  const team = useMemo(
    () => ({
      title: 'Team',
      description:
        'Perfect for small team or company getting started. Collaborate efficiently with basic features and essential tools to streamline your workflow and boost productivity.',
      price: (
        <Group gap={0} align="flex-end">
          <Text fw={800} fz={36}>
            $0
          </Text>
          <Text fz="sm" c="dimmed" mb={6} ml={5}>
            / User Per Month
          </Text>
        </Group>
      ),
      features: ['1 Repositories', '10 Team Members', 'Basic AI Review Quality'],
      actionText: 'Select plan',
      actionRef: 'https://github.com/apps/gitkarma-dev',
      isAvailable: true,
    }),
    []
  );

  const startup = useMemo(
    () => ({
      title: 'Startup',
      titleBadge: 'Coming soon',
      description:
        'Ideal for growing businesses. Unlock advanced features, priority support, and enhanced analytics to scale your operations with confidence.',
      price: (
        <Group gap={0} align="flex-end">
          <Text fw={800} fz={36}>
            $15
          </Text>
          <Text fz="sm" c="dimmed" mb={6} ml={5}>
            / User Per Month
          </Text>
        </Group>
      ),
      features: [
        '3 Repositories',
        '15 Team Members',
        'Basic AI Review Quality',
        'Analytics Dashboard',
        'Standard Reports',
        'Core Integrations',
      ],
      actionText: 'Select plan',
      isAvailable: false,
    }),
    []
  );

  const enterprise = useMemo(
    () => ({
      title: 'Enterprise',
      titleBadge: 'Coming soon',
      description:
        'Tailored solutions for large organizations. Custom integrations, dedicated support team, and unlimited resources to meet your complex business needs.',
      price: (
        <Stack gap="0">
          <Text fw={800} fz={28}>
            Contact sales
          </Text>
          <Text fz="sm" c="dimmed">
            for custom pricing
          </Text>
        </Stack>
      ),
      features: [
        'Unlimited Repositories',
        'Unlimited Team Members',
        'Advanced AI Review Quality',
        'Analytics Dashboard',
        'Advanced Reports',
        'Custom Integrations',
      ],
      actionText: 'Contact sales',
      actionColor: theme.colors.indigo[6],
      isAvailable: false,
    }),
    [theme.colors.indigo]
  );

  return (
    <div>
      <Title ta="center" order={1} mb="sm" fw={900}>
        Pricing
      </Title>
      <Text ta="center" mb="xl" fw={500} c="dimmed" maw={400} m="auto">
        Choose the perfect plan for your needs. Flexible options for teams of all sizes.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        <PricingCard {...team} />
        <PricingCard {...startup} />
        <PricingCard {...enterprise} />
      </SimpleGrid>
    </div>
  );
};

export default Pricing;
