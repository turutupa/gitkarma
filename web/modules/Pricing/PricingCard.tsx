import { useCallback, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  Transition,
  useMantineTheme,
} from '@mantine/core';
import css from './PricingCard.module.css';

type Props = {
  title: string;
  titleBadge?: string;
  description: string;
  price: React.ReactNode;
  features: string[];
  actionText: string;
  actionColor?: string;
  actionRef?: string;
  hoverText?: string;
  isAvailable?: boolean;
  backgroundGradient?: string;
};

const Pricing: React.FC<Props> = ({
  title,
  titleBadge,
  description,
  price,
  features: featuresList,
  actionText,
  actionColor,
  actionRef,
  isAvailable = true,
  hoverText = 'Coming soon!',
}) => {
  const theme = useMantineTheme();
  const [isHovered, setIsHovered] = useState(false);

  // Use a single consistent emoji for all features
  const features = featuresList.map((feature) => (
    <Group key={feature} gap="xs" align="flex-start" wrap="nowrap">
      <Text className={css.feature}>
        <FaCheckCircle />
      </Text>
      <Text size="sm">{feature}</Text>
    </Group>
  ));

  const renderComingSoon = useCallback(() => {
    return (
      <>
        <Transition mounted={!isHovered} transition="fade-left" duration={300}>
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
              {actionText}
            </span>
          )}
        </Transition>

        <Transition mounted={isHovered} transition="fade" duration={300}>
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
        <span style={{ opacity: 0 }}>
          {actionText.length > hoverText.length ? actionText : hoverText}
        </span>
      </>
    );
  }, [isHovered, actionText, hoverText]);

  return (
    <Card withBorder radius="md" p="md" className={`${css.card} ${css.hvrRadialOut}`} shadow="sm">
      <Paper p="md" className={css.paper} shadow="xl">
        <Group justify="space-between">
          <Text fz={36} fw={500}>
            {title}
          </Text>
          {titleBadge && (
            <span>
              <Badge bg={theme.colors.pink[8]}>{titleBadge}</Badge>
            </span>
          )}
        </Group>

        <Text fz="sm" c="dimmed" lh="xs">
          {description}
        </Text>
        <Box mt="lg">{price}</Box>
      </Paper>

      <Text mt="xl" pl="sm" className={css.label} c="dimmed">
        Features
      </Text>
      <Stack gap="xs" mt="xs" pl="sm">
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
          onClick={() => {
            if (actionRef) {
              window.open(actionRef, '_blank');
            }
          }}
        >
          {isAvailable ? actionText : renderComingSoon()}
        </Button>
      </Group>
    </Card>
  );
};

export default Pricing;
