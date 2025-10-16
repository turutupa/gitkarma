import {
  IconAlertCircle,
  IconBrain,
  IconChartBar,
  IconCoin,
  IconDashboard,
  IconGitPullRequest,
  IconRobot,
  IconUserCheck,
} from '@tabler/icons-react';
import { Fade } from 'react-awesome-reveal';
import {
  Badge,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import classes from './GitKarmaFeatures.module.css';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  upcoming?: boolean;
}

const Feature = ({ icon, title, description, color, upcoming }: FeatureProps) => {
  return (
    <Paper p="md" h="100%" radius="md" shadow="md" withBorder className={classes.feature}>
      {upcoming && (
        <Badge variant="filled" size="xs" className={classes.upcoming}>
          Upcoming
        </Badge>
      )}
      <Group mb="xs">
        <Box
          className={classes.iconBox}
          style={{ '--feature-color': color } as React.CSSProperties}
        >
          {icon}
        </Box>
        <Title order={4}>{title}</Title>
      </Group>
      <Text size="sm" color="dimmed" className={classes.description}>
        {description}
      </Text>
    </Paper>
  );
};

export default function GitkarmaCapabilities() {
  const theme = useMantineTheme();

  const features = [
    {
      icon: <IconCoin size={20} />,
      title: 'Karma Economy',
      description:
        'Incentivize collaboration with our karma system. Pay to create PRs, earn by reviewing them.',
      color: theme.colors.green[6],
    },
    {
      icon: <IconBrain size={20} />,
      title: 'AI Code Analysis',
      description:
        'Our AI evaluates PR complexity to assign fair karma points values based on code changes.',
      color: theme.colors.blue[6],
    },
    {
      icon: <IconRobot size={20} />,
      title: 'Review Quality AI',
      description:
        'AI assesses review quality and awards bonus karma points for meaningful contributions.',
      color: theme.colors.violet[6],
    },
    {
      icon: <IconGitPullRequest size={20} />,
      title: 'PR Workflow Integration',
      description: 'Seamlessly integrates with GitHub PR workflows with automatic status checks.',
      color: theme.colors.orange[6],
    },
    {
      icon: <IconDashboard size={20} />,
      title: 'Team Dashboard',
      description: 'Visualize team performance, karma economy health, and review engagement.',
      color: theme.colors.indigo[6],
    },
    {
      icon: <IconChartBar size={20} />,
      title: 'Productivity Metrics',
      description: 'Track development velocity, review response times, and team collaboration.',
      color: theme.colors.red[6],
    },
    {
      icon: <IconUserCheck size={20} />,
      title: 'Developer Recognition',
      description: 'Recognize top reviewers and quality contributors with leaderboards.',
      color: theme.colors.teal[6],
    },
    {
      icon: <IconAlertCircle size={20} />,
      title: 'Quality Alerts',
      description: 'Receive notifications about code quality issues and review bottlenecks.',
      color: theme.colors.yellow[7],
    },
  ];

  // Mark upcoming features (all except non-upcoming titles) and reorder them at the end.
  const nonUpcomingTitles = [
    'Karma Economy',
    'PR Workflow Integration',
    'Team Dashboard',
    'Productivity Metrics',
  ];
  const featuresWithUpcoming = features.map((feature) => ({
    ...feature,
    upcoming: !nonUpcomingTitles.includes(feature.title),
  }));
  const sortedFeatures = [
    ...featuresWithUpcoming.filter((f) => !f.upcoming),
    ...featuresWithUpcoming.filter((f) => f.upcoming),
  ];

  return (
    <Container mt="xl" size="xl" py={60}>
      <Fade triggerOnce cascade delay={200} fraction={0.6}>
        <Title order={2} ta="center" mb={50}>
          Upcoming{' '}
          <Text span color={theme.colors.primary[6]} inherit fw={900}>
            GitKarma
          </Text>{' '}
          Features
        </Title>
      </Fade>

      <Fade triggerOnce cascade delay={200} fraction={0.5}>
        <Grid>
          {sortedFeatures.map((feature, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
              <Feature
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                upcoming={feature.upcoming}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Fade>
    </Container>
  );
}
