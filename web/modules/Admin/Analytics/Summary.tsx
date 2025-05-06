import { useEffect, useMemo } from 'react';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCoin,
  IconGitPullRequest,
  IconPencilBolt,
} from '@tabler/icons-react';
import { FaComment } from 'react-icons/fa';
import {
  Box,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TSummary } from '@/models/Analytics';
import { useAPI } from '@/src/utils/useAPI';
import css from './Summary.module.css';

const icons = {
  pullRequest: IconGitPullRequest,
  review: IconPencilBolt,
  comment: FaComment,
  coin: IconCoin,
};

const iconTooltips = {
  pullRequest: 'Total number of pull requests opened per month',
  review: 'Total number of reviews per month',
  comment: 'Total number of review comments per month',
  coin: 'Total number of karma points per month',
};

type Props = {
  repo: string;
};

const Summary: React.FC<Props> = ({ repo }) => {
  const { colorScheme } = useMantineColorScheme();
  const { data, isLoading, error } = useAPI<TSummary>(`/summary?${repo}`);
  const [visible, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (isLoading) {
      open();
    } else {
      close();
    }
  }, [visible, open, isLoading]);

  const tiles = useMemo(() => {
    const {
      pull_requests_last_month = 0,
      pull_requests_this_month = 0,
      comments_last_month = 0,
      comments_this_month = 0,
      reviews_last_month = 0,
      reviews_this_month = 0,
      debits_last_month = 0,
      debits_this_month = 0,
    } = data || {};
    return [
      {
        title: 'Pull Requests',
        icon: 'pullRequest',
        value: pull_requests_this_month,
        diff: pull_requests_this_month - pull_requests_last_month,
      },
      {
        title: 'Reviews',
        icon: 'review',
        value: reviews_this_month,
        diff: reviews_this_month - reviews_last_month,
      },
      {
        title: 'Review Comments',
        icon: 'comment',
        value: comments_this_month,
        diff: comments_this_month - comments_last_month,
      },
      {
        title: 'Karma Points Awarded',
        icon: 'coin',
        value: debits_this_month,
        diff: debits_last_month,
      },
    ] as const;
  }, [data]);

  const stats = tiles.map((stat) => {
    const Icon = icons[stat.icon];
    const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

    return (
      <Paper
        withBorder
        p="md"
        radius="md"
        key={stat.title}
        mb={0}
        shadow="sm"
        pos="relative"
        h={131}
        bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
      >
        {isLoading && (
          <LoadingOverlay
            visible={visible}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
        )}

        {/* show error */}
        {error && (
          <Flex direction="column" justify="center" align="center" fw={600}>
            Something went wrong
          </Flex>
        )}

        {data && (
          <>
            <Group justify="space-between">
              <Text size="xs" c="dimmed" className={css.title}>
                {stat.title}
              </Text>
              <Tooltip label={iconTooltips[stat.icon]} position="top" withArrow>
                <Icon className={css.icon} size="22" stroke="1.5" />
              </Tooltip>
            </Group>

            <Group align="flex-end" gap="xs" mt={25}>
              <Text className={css.value}>{stat.value}</Text>
              <Text c={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={css.diff}>
                <span>{stat.diff}%</span>
                <DiffIcon size={16} stroke={1.5} />
              </Text>
            </Group>

            <Text fz="xs" c="dimmed" mt={7}>
              Compared to previous month
            </Text>
          </>
        )}
      </Paper>
    );
  });
  return (
    <Box mb="sm">
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>{stats}</SimpleGrid>
    </Box>
  );
};

export default Summary;
