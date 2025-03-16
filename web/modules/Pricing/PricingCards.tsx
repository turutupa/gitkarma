import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Group,
  Stack,
  Switch,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';

export const PricingCards = () => {
  const { colorScheme } = useMantineColorScheme();
  const [monthly, setMonthly] = useState(false);
  const theme = useMantineTheme();

  const handleChange = () => {
    setMonthly(!monthly);
  };

  return (
    <>
      <Group style={{ zIndex: 50 }}>
        <Stack gap={40}>
          {/** header section */}
          <Flex direction="column" gap={10} align="center" justify="start">
            <Title order={1} fw={900} c={colorScheme === 'dark' ? 'white' : 'hsl(233, 13%, 49%)'}>
              Our Pricing
            </Title>
            <Box
              style={{
                fontWeight: 700,
                color: colorScheme === 'dark' ? theme.colors.dark[1] : 'hsl(234, 14%, 74%)',
                display: 'flex',
                alignItems: 'center',
                gap: 19,
              }}
            >
              <Text fz="md">Annually</Text>
              <Switch
                color={theme.colors.primary[6]}
                checked={monthly}
                onChange={handleChange}
                width={65}
                height={55}
              />
              <Text fz="md">Monthly</Text>
            </Box>
          </Flex>

          {/** cards section */}
          <Group>
            <Flex
              align="center"
              direction={{ base: 'column', sm: 'row' }}
              color="hsl(232, 13%, 33%)"
              gap={{ base: '1.5rem', sm: 0 }}
            >
              <Box
                style={{
                  boxShadow: '0px 30px 50px -7px rgba(0,0,0,0.1)',
                  height: '22rem',
                  width: '17rem',
                  paddingInline: '1.5rem',
                  backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : 'white',
                  borderRadius: '0.7rem 0 0 0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  '@media (max-width: 755px)': {
                    width: '19rem',
                    borderRadius: '0.7rem',
                  },
                  '@media (min-width: 756px) and (max-width: 820px)': {
                    width: '15rem',
                    borderRadius: '0.7rem 0 0 0.7rem',
                  },
                }}
              >
                <Stack w="100%" align="center" gap={20}>
                  <Text
                    style={{
                      fontWeight: 700,
                      color: colorScheme === 'dark' ? theme.colors.dark[1] : 'hsl(233, 13%, 49%)',
                    }}
                    fz="md"
                  >
                    Startup
                  </Text>
                  <Title
                    order={2}
                    style={{
                      color: colorScheme === 'dark' ? 'white' : 'hsl(232, 13%, 33%)',
                      fontSize: 50,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Text fz="2rem">$</Text>
                    {monthly ? '19.99' : '199.99'}
                  </Title>
                  <Stack
                    w="100%"
                    align="center"
                    gap={10}
                    style={{ color: colorScheme === 'light' ? 'hsl(233, 13%, 49%)' : 'white' }}
                  >
                    <Text fz="sm" fw={600}>
                      3 Repositories
                    </Text>
                    <Text fz="sm" fw={600}>
                      5 Team Members
                    </Text>
                    <Text fz="sm" fw={600}>
                      Basic AI Analysis
                    </Text>
                  </Stack>
                  <Button
                    variant="gradient"
                    gradient={{ from: theme.colors.primary[3], to: theme.colors.primary[9] }}
                    w="100%"
                  >
                    GET STARTED
                  </Button>
                </Stack>
              </Box>
              <Box
                style={{
                  boxShadow: '0px 30px 50px -7px rgba(0,0,0,0.1)',
                  height: '25rem',
                  width: '19rem',
                  paddingInline: '1.5rem',
                  background: `linear-gradient(to bottom right, ${theme.colors.primary[9]}, ${theme.colors.primary[7]})`,
                  color: 'white',
                  borderRadius: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  '@media (min-width: 756px) and (max-width: 820px)': {
                    width: '15rem',
                    borderRadius: '0.7rem',
                  },
                }}
              >
                <Stack w="100%" align="center" gap={20}>
                  <Text
                    style={{
                      fontWeight: 700,
                    }}
                    fz="md"
                  >
                    Team
                  </Text>
                  <Title
                    order={2}
                    style={{
                      fontSize: 50,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Text fz="2rem">$</Text>
                    {monthly ? '24.99' : '249.99'}
                  </Title>
                  <Stack w="100%" align="center" gap={10}>
                    <Text fz="sm" fw={600}>
                      10 Repositories
                    </Text>
                    <Text fz="sm" fw={600}>
                      15 Team Members
                    </Text>
                    <Text fz="sm" fw={600}>
                      Advanced AI Review Quality
                    </Text>
                  </Stack>
                  <Button
                    style={{
                      backgroundColor: 'white',
                      color: theme.colors.primary[8],

                      '&:hover': {
                        backgroundColor: 'white',
                        opacity: 0.95,
                      },
                    }}
                    w="100%"
                  >
                    GET STARTED
                  </Button>
                </Stack>
              </Box>
              <Box
                style={{
                  boxShadow: '0px 30px 50px -7px rgba(0,0,0,0.1)',
                  height: '22rem',
                  width: '18rem',
                  paddingInline: '1.5rem',
                  backgroundColor: colorScheme === 'dark' ? theme.colors.dark[5] : 'white',
                  borderRadius: '0 0.7rem 0.7rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  '@media (max-width: 755px)': {
                    width: '19rem',
                    borderRadius: '0.7rem',
                  },
                  '@media (min-width: 756px) and (max-width: 820px)': {
                    width: '15rem',
                    borderRadius: '0 0.7rem 0.7rem 0',
                  },
                }}
              >
                <Stack w="100%" align="center" gap={20}>
                  <Text
                    style={{
                      fontWeight: 700,
                      color: colorScheme === 'dark' ? theme.colors.dark[1] : 'hsl(233, 13%, 49%)',
                    }}
                    fz="md"
                  >
                    Enterprise
                  </Text>
                  <Title
                    order={2}
                    style={{
                      color: colorScheme === 'dark' ? 'white' : 'hsl(232, 13%, 33%)',
                      fontSize: 50,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Text fz="2rem">$</Text>
                    {monthly ? '39.99' : '399.99'}
                  </Title>
                  <Stack
                    w="100%"
                    align="center"
                    gap={10}
                    style={{ color: colorScheme === 'light' ? 'hsl(233, 13%, 49%)' : 'white' }}
                  >
                    <Text fz="sm" fw={600}>
                      Unlimited Repositories
                    </Text>
                    <Text fz="sm" fw={600}>
                      Unlimited Team Members
                    </Text>
                    <Text fz="sm" fw={600}>
                      Custom Token Economy
                    </Text>
                  </Stack>
                  <Button
                    variant="gradient"
                    gradient={{ from: theme.colors.primary[3], to: theme.colors.primary[9] }}
                    w="100%"
                  >
                    CONTACT US
                  </Button>
                </Stack>
              </Box>
            </Flex>
          </Group>
        </Stack>
      </Group>
    </>
  );
};
