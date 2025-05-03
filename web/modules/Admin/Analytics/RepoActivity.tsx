import { useCallback, useMemo, useState } from 'react';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import cx from 'clsx';
import { FaArrowCircleDown, FaArrowCircleUp, FaCog, FaSearch, FaTimesCircle } from 'react-icons/fa';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Checkbox,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Popover,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TActivityLog, TUsersGlobalStats } from '@/models/Analytics';
import { GITHUB_AVATAR_URL } from '@/src/endpoints';
import { useAPI } from '@/src/utils/useAPI';
import UserProfile from './UserProfile';
import css from './RepoActivity.module.css';

const eventColors: Record<string, string> = {
  pull_request: 'pink',
  admin_override: 'orange',
  check_trigger: 'yellow',
  approval_bonus: 'green',
  comment: 'cyan',
  review: 'indigo',
};

type Props = {
  repo: string;
  usersGlobalStats: TUsersGlobalStats[];
};

const RepoActivity: React.FC<Props> = ({ repo, usersGlobalStats }) => {
  const { colorScheme } = useMantineColorScheme();
  const [scrolled, setScrolled] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<number[]>([]);
  const [dateSort, setDateSort] = useState<'asc' | 'desc' | null>('desc');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [_, { open: openFilterPopover }] = useDisclosure(false);
  const [isModalOpened, { open: setIsModalOpened, close }] = useDisclosure(false);

  const {
    data: activityLog,
    error,
    isLoading,
    // @ts-ignore
  } = useAPI<TActivityLog[]>(`/repoActivity?${repo}`);

  const handleModal = useCallback((githubUserId: number) => {
    setSelectedUserId(githubUserId);
    setIsModalOpened();
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  const toggleDateSort = useCallback(() => {
    setDateSort((prev) => {
      if (prev === null || prev === 'desc') {
        return 'asc';
      }
      return 'desc';
    });
  }, []);

  const uniqueUsers = useMemo(() => {
    if (!activityLog) {
      return [];
    }
    return Array.from(new Set(activityLog.map((log: TActivityLog) => log.github_user_id))).map(
      (userId) => {
        const log = activityLog.find((log: TActivityLog) => log.github_user_id === userId);
        return {
          id: userId,
          username: log ? log.github_username : `User ${userId}`,
        };
      }
    );
  }, [activityLog]);

  const uniquePRs = useMemo(() => {
    if (!activityLog) {
      return [];
    }
    return Array.from(new Set(activityLog.map((log: TActivityLog) => log.pr_number)))
      .filter(Boolean)
      .map((prNumber) => {
        const log = activityLog.find((log: TActivityLog) => log.pr_number === prNumber);
        return {
          number: prNumber,
          title: log ? log.pr_title : `PR #${prNumber}`,
        };
      });
  }, [activityLog]);

  // apply all filters
  const filteredRows = activityLog?.filter((log: TActivityLog) => {
    const keyword = searchKeyword.toLowerCase();
    const searchFilter =
      log.github_username?.toLowerCase().includes(keyword) ||
      log.pr_title?.toLowerCase().includes(keyword) ||
      log.description?.toLowerCase().includes(keyword) ||
      log.event?.toLocaleLowerCase().includes(keyword);
    const filters =
      (selectedEvents.length > 0 ? selectedEvents.includes(log.event) : true) &&
      (selectedUsers.length > 0 ? selectedUsers.includes(log.github_user_id) : true) &&
      (selectedPRs.length > 0 ? selectedPRs.includes(log.pr_number) : true);
    if (keyword.length > 0) {
      return searchFilter && filters;
    }
    return filters;
  });

  const sortedRows = useMemo(() => {
    if (!dateSort || !filteredRows) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredRows, dateSort]);

  if (isLoading) {
    return (
      <Box pos="relative" h={300} mt="sm">
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Text color="red" ta="center" mt="md">
        Failed to load activity log. Please try again later.
      </Text>
    );
  }

  const rows = sortedRows.map((log: TActivityLog) => (
    <Table.Tr key={log.github_user_id + log.created_at}>
      {/* user */}
      <Table.Td className={css.username} onClick={() => handleModal(log.github_user_id)}>
        <Group gap="sm" wrap="nowrap">
          <Avatar size={26} src={`${GITHUB_AVATAR_URL}/${log.github_user_id}`} radius="lg" />
          <Text fz="sm" fw={500} truncate="end">
            {log.github_username}
          </Text>
        </Group>
      </Table.Td>

      {/* pr details */}
      <Table.Td className={css.username}>
        <Anchor
          c={colorScheme === 'light' ? 'primary.9' : 'primary.6'}
          size="sm"
          href={log.pr_url}
          target="_blank"
        >
          <Text fz="sm" fw={500} truncate="end">
            #{log.pr_number} {log.pr_title}
          </Text>
        </Anchor>
      </Table.Td>

      {/* event */}
      <Table.Td ta="center">
        <Badge
          color={eventColors[log.event]}
          variant={colorScheme === 'light' ? 'filled' : 'light'}
        >
          {log.event.replace(/_/g, ' ')}
        </Badge>
      </Table.Td>

      <Table.Td ta="center">
        <Anchor
          underline="not-hover"
          c={colorScheme === 'light' ? 'dark.4' : 'gray.5'}
          size="sm"
          href={log.description_url}
          target="_blank"
        >
          {log.description.replace(/^\w/, (c) => c.toUpperCase())}
        </Anchor>
      </Table.Td>

      {/* action - spent / received */}
      <Table.Td ta="center" fw={600}>
        {log.action === 'spent' ? (
          <FaArrowCircleDown color="red" />
        ) : log.action === 'received' ? (
          <FaArrowCircleUp color="green" />
        ) : (
          <FaTimesCircle />
        )}
      </Table.Td>

      <Table.Td ta="center">{log.action ? log.debits : <Text c="dimmed">-</Text>}</Table.Td>

      {/* date */}
      <Table.Td>
        <Group gap="xs" flex={1} justify="center">
          <Text fz="sm" fw={600}>
            {new Intl.DateTimeFormat('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(new Date(log.created_at))}
          </Text>
          <Text fz="sm" c="dimmed">
            {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(log.created_at))}
          </Text>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      {/* user modal */}
      <Modal
        opened={isModalOpened}
        onClose={close}
        m={0}
        p={0}
        padding="0px"
        centered
        withCloseButton={false}
        size="sm"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <UserProfile
          usersGlobalStats={usersGlobalStats?.find((stat) => stat.github_id === selectedUserId)}
        />
      </Modal>

      {/* card */}
      <Box
        style={{
          minHeight: isFullScreen ? 800 : 400,
          height: isFullScreen ? '800px' : '400px',
          resize: 'vertical',
          overflow: 'hidden',
          paddingBottom: '12px',
        }}
      >
        <Paper
          withBorder
          p="xl"
          shadow="sm"
          bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
          mt="sm"
          mb="md"
          style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
        >
          <Box pos="absolute" top={10} right={10}>
            {isFullScreen ? (
              <IconArrowsMinimize
                size={16}
                color="gray"
                style={{ cursor: 'pointer' }}
                onClick={toggleFullScreen}
                title="Exit Full Screen"
              />
            ) : (
              <IconArrowsMaximize
                size={16}
                color="gray"
                style={{ cursor: 'pointer' }}
                onClick={toggleFullScreen}
                title="Full Screen"
              />
            )}
          </Box>
          <Title mb="sm" order={3}>
            Activity Log
          </Title>

          {/* Search Input */}
          <TextInput
            type="text"
            placeholder="Search users, pull requests, events, gitkarma comments..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            mb="sm"
            leftSection={<FaSearch />}
          />

          {/* table */}
          <ScrollArea style={{ flex: 1 }} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
            <Table
              layout="fixed"
              stickyHeader
              verticalSpacing="sm"
              bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
              highlightOnHover
              highlightOnHoverColor={colorScheme === 'light' ? 'gray.3' : 'dark.8'}
              borderColor={colorScheme === 'light' ? 'gray.3' : 'dark.6'}
            >
              <Table.Thead className={cx(css.header, { [css.scrolled]: scrolled })}>
                <Table.Tr>
                  <Table.Th className={css.actionHeader}>
                    <Popover position="bottom-start" width={250} withinPortal shadow="sm">
                      <Popover.Target>
                        <Box style={{ cursor: 'pointer' }} ta="center">
                          <Group justify="center" align="center" gap="xs" wrap="nowrap">
                            <Text fw={600}>User</Text>
                            <Box w={12} style={{ display: 'inline-block' }}>
                              {selectedUsers.length > 0 && <FaCog size={12} />}
                            </Box>
                          </Group>
                        </Box>
                      </Popover.Target>
                      <Popover.Dropdown p="xs">
                        <ScrollArea>
                          <Stack>
                            {uniqueUsers.map((user) => (
                              <Group key={user.id} gap="xs" align="center">
                                <Checkbox
                                  className={css.pointer}
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() =>
                                    setSelectedUsers((prev) =>
                                      prev.includes(user.id)
                                        ? prev.filter((id) => id !== user.id)
                                        : [...prev, user.id]
                                    )
                                  }
                                />
                                <Group gap="sm" wrap="nowrap">
                                  <Avatar
                                    size={20}
                                    src={`${GITHUB_AVATAR_URL}/${user.id}`}
                                    radius="lg"
                                  />
                                  <Text size="sm">{user.username}</Text>
                                </Group>
                              </Group>
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Popover.Dropdown>
                    </Popover>
                  </Table.Th>
                  <Table.Th ta="center" className={css.actionHeader}>
                    <Popover position="bottom-start" width={300} withinPortal shadow="sm">
                      <Popover.Target>
                        <Box style={{ cursor: 'pointer' }}>
                          <Group justify="center" align="center" gap="xs" wrap="nowrap">
                            <Text fw={600}>Pull Request</Text>
                            <Box w={12} style={{ display: 'inline-block' }}>
                              {selectedPRs.length > 0 && <FaCog size={12} />}
                            </Box>
                          </Group>
                        </Box>
                      </Popover.Target>
                      <Popover.Dropdown p="xs">
                        <ScrollArea h={200}>
                          <Stack>
                            {uniquePRs.map((pr) => (
                              <Group key={pr.number} gap="xs" align="center" pos="relative">
                                <Checkbox
                                  className={css.pointer}
                                  checked={selectedPRs.includes(pr.number)}
                                  onChange={() =>
                                    setSelectedPRs((prev) =>
                                      prev.includes(pr.number)
                                        ? prev.filter((num) => num !== pr.number)
                                        : [...prev, pr.number]
                                    )
                                  }
                                />
                                <Text
                                  size="sm"
                                  w="calc(100% - 40px)"
                                  lineClamp={1}
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    userSelect: 'none',
                                  }}
                                >
                                  #{pr.number} {pr.title}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Popover.Dropdown>
                    </Popover>
                  </Table.Th>
                  <Table.Th ta="center" className={css.actionHeader}>
                    <Popover position="bottom-start" width={200} withinPortal shadow="sm">
                      <Popover.Target>
                        <Box style={{ cursor: 'pointer' }} onClick={openFilterPopover}>
                          <Group justify="center" align="center" gap="xs" wrap="nowrap">
                            <Text fw={600}>Event</Text>
                            <Box w={12} style={{ display: 'inline-block' }}>
                              {selectedEvents.length > 0 && <FaCog size={12} />}
                            </Box>
                          </Group>
                        </Box>
                      </Popover.Target>
                      <Popover.Dropdown p="xs">
                        <Stack>
                          {Object.keys(eventColors).map((event) => (
                            <Group key={event} gap="xs" align="center">
                              <Checkbox
                                className={css.pointer}
                                checked={selectedEvents.includes(event)}
                                onChange={() =>
                                  setSelectedEvents((prev) =>
                                    prev.includes(event)
                                      ? prev.filter((e) => e !== event)
                                      : [...prev, event]
                                  )
                                }
                              />
                              <Badge
                                color={eventColors[event]}
                                variant={colorScheme === 'light' ? 'filled' : 'light'}
                              >
                                {event.replace(/_/g, ' ')}
                              </Badge>
                            </Group>
                          ))}
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                  </Table.Th>
                  <Table.Th ta="center">GitKarma Comment</Table.Th>
                  <Table.Th ta="center">Transfer</Table.Th>
                  <Table.Th ta="center">Karma Points</Table.Th>
                  <Table.Th
                    className={css.actionHeader}
                    ta="center"
                    style={{ cursor: 'pointer' }}
                    onClick={toggleDateSort}
                  >
                    <Group justify="center" align="center" gap="xs" wrap="nowrap">
                      <Text fw={600}>Date</Text>
                      {dateSort &&
                        (dateSort === 'asc' ? (
                          <IconChevronUp size={14} />
                        ) : (
                          <IconChevronDown size={14} />
                        ))}
                    </Group>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      </Box>
    </>
  );
};

export default RepoActivity;
