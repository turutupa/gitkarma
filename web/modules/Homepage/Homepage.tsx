import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconCoin } from '@tabler/icons-react';
import { Fade } from 'react-awesome-reveal';
import {
  Button,
  Group,
  List,
  Paper,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import css from './Homepage.module.css';

export default function Homepage() {
  const { colorScheme } = useMantineColorScheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Throttle function to limit updates
  const updateMousePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const now = Date.now();
    // Only update every 16ms (roughly 60fps)
    if (now - lastUpdateTimeRef.current < 16) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    // Make horizontal movement more sensitive (30 instead of 40)
    const x = (clientX - left - width / 2) / 30; // More aggressive horizontal tilt
    const y = (clientY - top - height / 2) / 40; // Vertical sensitivity unchanged

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
      if (containerRef.current && isHovering) {
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
  }, [isHovering, updateMousePosition]);

  // Calculate tilt values
  const tiltX = -mousePosition.y;
  // Remove the negative sign to invert the direction so image tilts toward cursor
  const tiltY = mousePosition.x - 10; // Removed the negative sign

  // Create a floating shadow effect
  // Also invert shadow direction to match the new tilt direction
  const shadowDistance = 40 + Math.abs(tiltX) * 1.5 + Math.abs(tiltY) * 1.5;
  const shadowOffsetX = -tiltY * 2; // Inverted direction for shadow
  const shadowOffsetY = Math.abs(tiltX) * 1.5 + 30; // Always keep some Y offset for floating look
  const shadowBlur = Math.max(5, Math.abs(tiltX) + Math.abs(tiltY));
  const shadowOpacity = 0.6 - (Math.abs(tiltX) + Math.abs(tiltY)) * 0.01;

  return (
    <Fade triggerOnce delay={800} direction="left">
      <div
        className={css.container}
        ref={containerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setMousePosition({ x: 0, y: 0 });
        }}
      >
        <div className={css.content}>
          <Title className={css.title}>Instant Reduced Time to Merge.</Title>
          <Text c={colorScheme === 'dark' ? 'dimmed' : ''} mt="md">
            Remember chasing teammates on Slack just to get your PR reviewed?{' '}
            <b>“Can you review my PR?”</b> was a daily ritual.
          </Text>

          <Text c={colorScheme === 'dark' ? 'dimmed' : ''} mt="md">
            With GitKarma, that’s history.
          </Text>

          <Text c={colorScheme === 'dark' ? 'dimmed' : ''} mt="md">
            Now, developers earn karma by reviewing others’ PRs and spend it to merge their own—no
            more nagging, just a fair, collaborative workflow that rewards meaningful code reviews
            and keeps your team moving fast.
          </Text>

          <Paper shadow="xs" p="lg" mt="lg" mb="lg">
            <Text ta="center" size="lg" maw={700}>
              It's a <span className={css.highlightGate}>gate</span> – not a game.
            </Text>
          </Paper>

          <List
            mt={30}
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon size={20} radius="xl" color="#2CDD66">
                <IconCoin size={12} stroke={1.5} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <b>Karma economy</b> – Developers earn karma points for reviewing PRs and spend them
              to create their own
            </List.Item>
            <List.Item>
              <b>AI-powered code analysis</b> – Automatic evaluation of PR complexity and review
              quality for fair karma distribution
            </List.Item>
            <List.Item>
              <b>Team metrics dashboard</b> – Track development velocity, code quality trends, and
              team collaboration
            </List.Item>
          </List>

          <Group mt={30}>
            <Button
              component="a"
              href="https://github.com/apps/gitkarma-dev"
              target="_blank"
              radius="xl"
              size="md"
              className={css.control}
            >
              Install App
            </Button>
            <Button
              component={Link}
              href="/docs"
              variant="default"
              radius="xl"
              size="md"
              className={css.control}
            >
              Documentation
            </Button>
          </Group>
        </div>

        <div className={css.imageWrapper}>
          <Image
            src="/two-buttons-meme.jpeg"
            alt="two-buttons-meme-gitkarma"
            width={400}
            height={500}
            className={css.memeImage}
            style={{
              transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
              // Create a more defined drop shadow below the image
              boxShadow: isHovering
                ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity}), 0 ${shadowDistance}px ${shadowBlur * 1.5}px rgba(0, 0, 0, 0.2)`
                : '0 15px 30px rgba(0, 0, 0, 0.15)',
            }}
          />
        </div>
      </div>
    </Fade>
  );
}
