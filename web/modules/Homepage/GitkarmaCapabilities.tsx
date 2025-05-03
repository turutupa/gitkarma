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
import { Box, Container, Grid, Group, Paper, Text, Title, useMantineTheme } from '@mantine/core';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const Feature = ({ icon, title, description, color }: FeatureProps) => {
  const theme = useMantineTheme();

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      shadow="sm"
      h="100%"
      style={{
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows.md,
        },
      }}
    >
      <Group mb="xs">
        <Box
          style={(theme) => ({
            backgroundColor: color,
            color: '#fff',
            borderRadius: theme.radius.md,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          {icon}
        </Box>
        <Title order={4}>{title}</Title>
      </Group>
      <Text size="sm" color="dimmed" style={{ flexGrow: 1 }}>
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

  return (
    <Container size="lg" py={60}>
      <Title order={2} ta="center" mb={50}>
        Full{' '}
        <Text span color={theme.colors.primary[6]} inherit>
          gitkarma
        </Text>{' '}
        Capabilities
      </Title>

      <Grid>
        {features.map((feature, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
            <Feature
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}
