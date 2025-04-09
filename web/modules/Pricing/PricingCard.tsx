import { useCallback, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import {
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  Transition,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import css from './PricingCard.module.css';

type Props = {
  title: string;
  titleBadge?: string;
  description: string;
  price: React.ReactNode;
  features: string[];
  action: string;
  actionColor?: string;
  hoverText?: string;
  isAvailable?: boolean;
};

const Pricing: React.FC<Props> = ({
  title,
  titleBadge,
  description,
  price,
  features: featuresList,
  action,
  actionColor,
  isAvailable = true,
  hoverText = 'Coming soon!', // Default hover text
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [isHovered, setIsHovered] = useState(false);

  // Use a single consistent emoji for all features
  const features = featuresList.map((feature) => (
    <Group key={feature} gap="xs" align="flex-start" wrap="nowrap">
      <Text>
        <FaCheckCircle />
      </Text>
      <Text size="sm">{feature}</Text>
    </Group>
  ));

  const renderComingSoon = useCallback(() => {
    return (
      <>
        <Transition mounted={!isHovered} transition="scale-y" duration={300}>
          {(styles) => (
            <span
              style={{
                ...styles,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
              }}
            >
              {action}
            </span>
          )}
        </Transition>

        <Transition mounted={isHovered} transition="scale-y" duration={300}>
          {(styles) => (
            <span
              style={{
                ...styles,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
              }}
            >
              {hoverText}
            </span>
          )}
        </Transition>

        {/* Invisible text to maintain button size */}
        <span style={{ opacity: 0 }}>{action.length > hoverText.length ? action : hoverText}</span>
      </>
    );
  }, [isHovered, action, hoverText]);

  return (
    <Card withBorder radius="md" p="md" className={css.card}>
      <Paper
        shadow="md"
        p="md"
        bg={colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[3]}
      >
        <Group justify="space-between">
          <Text fz={36} fw={500}>
            {title}
          </Text>
          {titleBadge && <Badge bg="pink">Popular</Badge>}
        </Group>

        <Text fz="sm" c="dimmed" lh="xs">
          {description}
        </Text>
        <Text mt="lg" fz={36} fw={600}>
          {price}
        </Text>
      </Paper>

      <Text mt="lg" className={css.label} c="dimmed">
        Features
      </Text>
      <Stack gap="xs" mt="xs">
        {features}
      </Stack>

      <Group mt="auto" pt="xl">
        <Button
          bg={actionColor ?? theme.primaryColor}
          radius="md"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={!isAvailable && isHovered}
          c="white"
          className={`${css.actionButton} ${isHovered && isAvailable ? css.actionButtonHovered : ''}`}
        >
          {isAvailable ? action : renderComingSoon()}
        </Button>
      </Group>
    </Card>
  );
};

export default Pricing;
