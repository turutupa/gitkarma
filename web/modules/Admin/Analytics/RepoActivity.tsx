import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { AxiosError } from 'axios';
import cx from 'clsx';
import { FaArrowCircleDown, FaArrowCircleUp, FaCog, FaSearch, FaTimesCircle } from 'react-icons/fa';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Center,
  Checkbox,
  Group,
  Loader,
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
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { TActivityLog, TUsersGlobalStats } from '@/models/Analytics';
import { GITHUB_AVATAR_URL } from '@/src/endpoints';
import { http } from '@/src/utils/http';
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

const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 100,
    duration: 300,
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [activityLog, setActivityLog] = useState<TActivityLog[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isFetchingRef = useRef<boolean>(false);
  const hasFechedAllLogs = useRef<boolean>(false);
  const paramsRef = useRef<Record<string, string | number | Date>>({
    repo,
    startDate: oneWeekAgo,
    endDate: new Date(),
  });

  const fetchRepoActivity = useCallback(() => {
    http
      .get(`/repoActivity`, { params: paramsRef.current })
      .then((res) => {
        let newLogs: TActivityLog[] = [];
        setActivityLog((prev) => {
          const existingIds = new Set(prev.map((log) => log.id));
          newLogs = res.data.filter((log: TActivityLog) => !existingIds.has(log.id));
          return [...prev, ...newLogs];
        });
        if (newLogs.length === 0) {
          hasFechedAllLogs.current = true;
        }
      })
      .catch((e: AxiosError) => {
        setError(e.message);
      });
  }, [setActivityLog]);

  useEffect(() => {
    setIsInitialLoading(true);
    try {
      fetchRepoActivity();
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  const handleFetchMoreLogItems = useCallback(async () => {
    if (isFetchingRef.current || isLoading || hasFechedAllLogs.current) {
      return;
    }
    isFetchingRef.current = true;
    setIsLoading(true);

    // Minimum loading time in milliseconds.
    // To force loading spinner to not flicker
    const MIN_LOADING_TIME = 600;
    const startTime = Date.now();

    try {
      // new start & end dates
      const endDate = new Date(paramsRef.current.startDate);
      endDate.setDate(endDate.getDate());
      const startDate: Date = new Date(paramsRef.current.startDate);
      startDate.setDate(startDate.getDate() - 7);

      const newParams = { repo, startDate, endDate };
      paramsRef.current = newParams;
      await fetchRepoActivity();
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [activityLog, isLoading, setIsLoading]);

  const onScrollPositionChange = useCallback(({ y }: { x: number; y: number }) => {
    setScrolled(y !== 0);
    const viewport = scrollAreaRef.current;
    if (viewport) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      if (scrollHeight - clientHeight - scrollTop - 2 < 1) {
        handleFetchMoreLogItems();
      }
    }
  }, []);

  const handleModal = useCallback((githubUserId: number) => {
    setSelectedUserId(githubUserId);
    setIsModalOpened();
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      scrollIntoView();
      const logItemsThatFitOnScreen = 12;
      if (activityLog.length < logItemsThatFitOnScreen) {
        handleFetchMoreLogItems();
      }
      return;
    }
    setIsFullScreen(false);
  }, [activityLog, isFullScreen, scrollIntoView, setIsFullScreen]);

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

  if (isInitialLoading) {
    return (
      <Box pos="relative" h={300} mt="sm">
        <LoadingOverlay
          visible={isInitialLoading}
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
    <Table.Tr key={log.github_user_id + log.created_at + log.description}>
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
          href={log?.pr_url}
          target="_blank"
        >
          <Text fz="sm" fw={500} truncate="end">
            #{log?.pr_number} {log?.pr_title}
          </Text>
        </Anchor>
      </Table.Td>

      {/* event */}
      <Table.Td ta="center">
        <Badge
          color={eventColors[log?.event]}
          variant={colorScheme === 'light' ? 'filled' : 'light'}
        >
          {log?.event?.replace(/_/g, ' ')}
        </Badge>
      </Table.Td>

      <Table.Td ta="center">
        <Anchor
          underline="not-hover"
          c={colorScheme === 'light' ? 'dark.4' : 'gray.5'}
          size="sm"
          href={log?.description_url}
          target="_blank"
        >
          {log?.description?.replace(/^\w/, (c) => c.toUpperCase())}
        </Anchor>
      </Table.Td>

      {/* action - spent / received */}
      <Table.Td ta="center" fw={600}>
        {log?.action === 'spent' ? (
          <FaArrowCircleDown color="red" />
        ) : log?.action === 'received' ? (
          <FaArrowCircleUp color="green" />
        ) : (
          <FaTimesCircle />
        )}
      </Table.Td>

      <Table.Td ta="center">{log.action ? log?.debits : <Text c="dimmed">-</Text>}</Table.Td>

      {/* date */}
      <Table.Td>
        <Group gap="xs" flex={1} justify="center">
          <Text fz="sm" fw={600}>
            {log.created_at &&
              new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(new Date(log.created_at))}
          </Text>
          <Text fz="sm" c="dimmed">
            {log.created_at &&
              new Intl.DateTimeFormat('en-US', {
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
          ref={targetRef}
          withBorder
          p="xl"
          shadow="sm"
          bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
          mt="sm"
          mb="md"
          h="100%"
          display="flex"
          pos="relative"
          style={{ flexDirection: 'column' }}
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
          <ScrollArea
            viewportRef={scrollAreaRef}
            style={{ flex: 1 }}
            onBottomReached={handleFetchMoreLogItems}
            offsetScrollbars="y"
            onScrollPositionChange={onScrollPositionChange}
          >
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
                                {event?.replace(/_/g, ' ')}
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
          {isLoading && (
            <Center mt="sm">
              <Loader size="sm" />
            </Center>
          )}
        </Paper>
      </Box>
    </>
  );
};
export default RepoActivity;
