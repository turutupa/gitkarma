import { useCallback, useEffect, useRef, useState } from 'react';
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
  const { colorScheme } = useMantineColorScheme();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isCardHovering, setIsCardHovering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Throttle function to limit updates
  const updateMousePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) {
      return;
    }

    const now = Date.now();
    // Only update every 16ms (roughly 60fps)
    if (now - lastUpdateTimeRef.current < 16) {
      return;
    }

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) / 40;
    const y = (clientY - top - height / 2) / 25;

    // Use requestAnimationFrame for smoother updates
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setMousePosition({ x, y });
    });

    lastUpdateTimeRef.current = now;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current && isCardHovering) {
        updateMousePosition(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isCardHovering, updateMousePosition]);

  // Calculate tilt values
  const tiltX = Math.min(8, mousePosition.y * 2 + 5);
  const tiltY = mousePosition.x * 3;

  // Create a floating shadow effect
  const shadowDistance = 20 + Math.abs(tiltX) * 1.5 + Math.abs(tiltY) * 1.5;
  const shadowOffsetX = -tiltY;
  const shadowOffsetY = Math.max(0, Math.abs(tiltX));
  const shadowBlur = Math.max(2, Math.abs(tiltX) + Math.abs(tiltY) - 2);
  const shadowOpacity = 1 - (Math.abs(tiltX) + Math.abs(tiltY)) * 0.01;

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
    <Card
      withBorder
      radius="md"
      p="md"
      className={`${css.card} ${css.hvrRadialOut}`}
      shadow="sm"
      ref={containerRef}
      onMouseEnter={() => setIsCardHovering(true)}
      onMouseLeave={() => {
        setIsCardHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
    >
      <Paper
        p="md"
        className={css.paper}
        shadow="xl"
        style={{
          transform: isCardHovering
            ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
            : 'rotateX(0deg) rotateY(0deg)',
          boxShadow: isCardHovering
            ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${
                colorScheme === 'dark'
                  ? `rgba(75, 90, 140, ${shadowOpacity})`
                  : `rgba(55, 70, 120, ${shadowOpacity * 0.6})`
              }, 0 ${shadowDistance}px ${shadowBlur * 1.5}px ${
                colorScheme === 'dark' ? 'rgba(65, 80, 130, 0.2)' : 'rgba(55, 70, 120, 0.12)'
              }`
            : colorScheme === 'dark'
              ? '0 4px 12px rgba(70, 80, 100, 0.35)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Group justify="space-between">
          <Text fz={36} fw={500}>
            {title}
          </Text>
          {titleBadge && (
            <span>
              <Badge bg={theme.colors.primary[8]}>{titleBadge}</Badge>
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
