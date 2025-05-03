import { useRef, useState } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconArrowRight, IconCircleCheck, IconCoin } from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Button,
  Container,
  Grid,
  Group,
  List,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const Docs = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [activeSection, setActiveSection] = useState('how-it-works');

  // Refs for each section
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const installationRef = useRef<HTMLDivElement>(null);
  const gettingStartedRef = useRef<HTMLDivElement>(null);
  const administrationRef = useRef<HTMLDivElement>(null);

  // Define sections in an array for easier navigation
  const sections = [
    { id: 'how-it-works', title: 'How GitKarma Works', ref: howItWorksRef },
    { id: 'installation', title: 'Installation', ref: installationRef },
    { id: 'getting-started', title: 'Getting Started', ref: gettingStartedRef },
    { id: 'administration', title: 'Administration', ref: administrationRef },
  ];

  // Navigate to previous or next section
  const navigateSection = (direction: 'prev' | 'next') => {
    const currentIndex = sections.findIndex((section) => section.id === activeSection);
    let newIndex;

    if (direction === 'prev') {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(sections.length - 1, currentIndex + 1);
    }

    const newSection = sections[newIndex].id;
    setActiveSection(newSection);
  };

  // Get next section title for the Continue button
  const getNextSectionTitle = () => {
    const currentIndex = sections.findIndex((section) => section.id === activeSection);
    if (currentIndex < sections.length - 1) {
      return sections[currentIndex + 1].title;
    }
    return null;
  };

  // Styling for sidebar container
  const sidebarContainerStyle = {
    position: 'relative' as const,
  };

  // Styling for sidebar
  const sidebarStyle = {
    padding: '1rem',
    marginBottom: '1rem',
    ...(isDesktop && {
      position: 'fixed' as const,
      width: '22%',
      maxWidth: '280px',
    }),
  };

  // Styling for content column
  const contentColStyle = {
    ...(isDesktop && {
      paddingLeft: '2rem',
    }),
  };

  // Render the content based on active section
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'how-it-works':
        return (
          <Box ref={howItWorksRef} id="how-it-works" pt={20}>
            <Title order={2} mb="md" fw={900}>
              How GitKarma Works
            </Title>
            <Text mb="md">
              GitKarma is{' '}
              <b>
                <i>not</i>
              </b>{' '}
              a gamification system for pull requests, but rather a meaningful quality control
              mechanism—similar to linting, tests, or build checks. It creates a credit-based
              economy that ensures developers contribute to code reviews before submitting their own
              work.
            </Text>
            <List spacing="lg">
              <List.Item>
                <Text fw={600}>Quality Check Mechanism</Text>
                <Text>
                  Like other CI/CD checks, PRs that don't meet the funding requirement won't
                  pass—ensuring developers participate in the review process. This keeps
                  repositories clean and balanced.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Credit Economy</Text>
                <Text>
                  Earn credits by reviewing others' PRs, with points based on PR complexity and
                  review quality. Creating a PR requires spending these credits.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>AI Analysis</Text>
                <Text>
                  Our AI evaluates PR complexity and review thoroughness to assign fair point
                  values.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Engineering Excellence</Text>
                <Text>
                  Beyond just enforcing reviews, GitKarma's roadmap includes incorporating
                  additional best practices as protected checks, helping teams build better software
                  engineers.
                </Text>
              </List.Item>
            </List>
          </Box>
        );
      case 'installation':
        return (
          <Box ref={installationRef} id="installation" pt={20}>
            <Title order={2} mb="md" fw={900}>
              Installation
            </Title>
            <List
              spacing="md"
              icon={
                <ThemeIcon color="green" size={24} radius="xl">
                  <IconCircleCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item mb="xl">
                <Text fw={600}>Step 1: Install the GitHub App</Text>
                <Text>
                  Follow the{' '}
                  <Anchor component="a" href="https://github.com/apps/gitkarma-dev" target="_blank">
                    <b>Install App</b>
                  </Anchor>{' '}
                  link to access the GitHub App installation page.
                </Text>
              </List.Item>
              <List.Item mb="xl">
                <Text fw={600}>Step 2: Configure Repository Access</Text>
                <Text>
                  Select specific repositories where you want to use GitKarma. You can start with
                  just one repo to try it out.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>Step 3: Start Using GitKarma</Text>
                <Text>
                  Once installed, you're ready to go! Create pull requests and start earning karma
                  points through reviews.
                </Text>
              </List.Item>
            </List>
          </Box>
        );
      case 'getting-started':
        return (
          <Box ref={gettingStartedRef} id="getting-started" pt={20}>
            <Title order={2} mb="md" fw={900}>
              Getting Started
            </Title>
            <Text mb="md">After installation, using GitKarma is seamless:</Text>
            <List>
              <List.Item mb="md">
                <Text>
                  <b>Create pull requests</b> as you normally would - GitKarma will automatically
                  track your activity and run a funds verification check on each PR
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>Earn credits</b> by reviewing others' PRs - more thorough reviews and helpful
                  comments earn more credits that accumulate in your balance
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>Monitor your balance</b> in the GitKarma dashboard or by commenting "💰" on any
                  PR to see your current funds
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>Re-trigger checks</b> by commenting "✨" on unfunded PRs after earning enough
                  credits instead of pushing dummy commits
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>View detailed feedback</b> on PR status through GitKarma's automatic comments
                  and checks, showing your current balance, required funds, and next steps
                </Text>
              </List.Item>
            </List>
            <Text mt="xl" fs="italic">
              Administrators can override funding requirements when necessary using admin-specific
              commands.
            </Text>
          </Box>
        );
      case 'administration':
        return (
          <Box ref={administrationRef} id="administration" pt={20}>
            <Title order={2} mb="md" fw={900}>
              Administration
            </Title>
            <Text mb="md">
              Team administrators have additional controls through the admin interface:
            </Text>
            <List>
              <List.Item mb="md">
                <Text>
                  <b>Send karma points</b> to team members to reward exceptional contributions
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>Deduct karma points</b> when necessary
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>Adjust debit</b> economy settings for your team's specific needs
                </Text>
              </List.Item>
              <List.Item mb="md">
                <Text>
                  <b>Manage roles</b> and grant users admin privileges for special controls
                </Text>
              </List.Item>
            </List>
            <Text mt="xl" fs="italic">
              Admin dashboards with detailed analytics and team performance metrics are currently in
              development and will be available soon.
            </Text>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container size="xl" py="md">
      <Title ta="center" order={1} mb="xl" fw={900}>
        GitKarma Documentation
      </Title>

      <Grid gutter="xl">
        {/* Side Navigation - Hide on mobile when scrolling content */}
        <Grid.Col span={{ base: 12, md: 3 }} style={sidebarContainerStyle}>
          <Box style={sidebarStyle}>
            <Tabs
              value={activeSection}
              orientation="vertical"
              onChange={(value) => {
                setActiveSection(value || 'how-it-works');
              }}
            >
              <Tabs.List style={{ width: '100%', border: 'none' }}>
                {sections.map((section) => (
                  <Tabs.Tab key={section.id} value={section.id} px="xs" py="md">
                    {section.title}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>

            <Box mt="xl">
              <Button
                mt="xl"
                component={Link}
                href="https://github.com/apps/gitkarma-dev"
                target="_blank"
                radius="xl"
                size="md"
                leftSection={<IconCoin size={16} />}
                fullWidth
              >
                Install GitKarma
              </Button>
            </Box>
          </Box>
        </Grid.Col>

        {/* Content Area - Full width on mobile */}
        <Grid.Col span={{ base: 12, md: 9 }} style={contentColStyle}>
          <Stack gap="xl">
            {/* Only render the current section content */}
            {renderSectionContent()}

            {/* Pagination */}
            <Box my="xl">
              <Group justify="space-between">
                <div>
                  {activeSection !== sections[0].id && (
                    <Button
                      variant="light"
                      leftSection={<IconArrowLeft size={16} />}
                      onClick={() => navigateSection('prev')}
                    >
                      {sections[sections.findIndex((s) => s.id === activeSection) - 1].title}
                    </Button>
                  )}
                </div>

                <div>
                  {getNextSectionTitle() && (
                    <Button
                      variant="filled"
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() => navigateSection('next')}
                      disabled={activeSection === sections[sections.length - 1].id}
                    >
                      {getNextSectionTitle()}
                    </Button>
                  )}
                </div>
              </Group>
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Docs;
