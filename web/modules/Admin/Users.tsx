import { useCallback, useMemo, useState } from 'react';
import { IconInfoCircle, IconMoneybag } from '@tabler/icons-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import {
  ActionIcon,
  Avatar,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Table,
  Text,
  Title,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { EUserRepoRole, TUserData } from '@/models/UserRepo';
import { http } from '@/utils/http';

const rolesData = ['Admin', 'Collaborator', 'Organization Member'];
const rolesMap = {
  Admin: EUserRepoRole.ADMIN,
  Collaborator: EUserRepoRole.COLLABORATOR,
  'Organization Member': EUserRepoRole.ORGANIZATION_MEMBER,
};
const reverseRolesMap: Record<EUserRepoRole, string> = {
  [EUserRepoRole.ADMIN]: 'Admin',
  [EUserRepoRole.COLLABORATOR]: 'Collaborator',
  [EUserRepoRole.ORGANIZATION_MEMBER]: 'Organization Member',
};

const GITHUB_AVATAR_URL = 'https://avatars.githubusercontent.com/u';

type Props = {
  users: TUserData[];
  repoId: number;
};

const Users: React.FC<Props> = ({ users, repoId }) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const [transferAmounts, setTransferAmounts] = useState<{ [key: string]: number }>({});
  const [isTransferring, setIsTransferring] = useState<{ [key: string]: boolean }>({});
  const [isUpdatingRole, setIsUpdatingRole] = useState<{ [key: string]: boolean }>({});
  const { data: session } = useSession();

  // @ts-ignore
  const currentUserId = Number(session?.sub);
  const currentUser = users.find((u) => u.github_id === currentUserId);
  const hasEditAccess = Number(currentUser?.role) === EUserRepoRole.ADMIN;

  const handleUserRole = useCallback(
    async (role: EUserRepoRole, user: TUserData) => {
      if (user.role === role || isUpdatingRole[user.github_username]) {
        return;
      }

      // must have at least 1 admin at all times
      const adminsCounter = users.reduce((acc, u) => {
        if (Number(u.role) === EUserRepoRole.ADMIN) {
          return acc + 1;
        }
        return acc;
      }, 0);
      if (
        adminsCounter === 1 &&
        role !== EUserRepoRole.ADMIN &&
        Number(user.role) === EUserRepoRole.ADMIN
      ) {
        showNotification({
          title: 'Error',
          message: 'You cannot remove the last admin from the repository',
          color: 'red',
        });
        return;
      }

      setIsUpdatingRole((prev) => ({ ...prev, [user.github_username]: true }));
      const userId = user.id;
      try {
        await http.put('/repos/roles', {
          userId,
          role,
        });

        user.role = role;

        showNotification({
          title: 'Success',
          message: `User role updated to ${reverseRolesMap[role]}`,
          color: 'green',
        });
      } catch (error: unknown) {
        showNotification({
          title:
            axios.isAxiosError(error) && error.response?.status === 403
              ? 'Permission Denied'
              : 'Error',
          message:
            axios.isAxiosError(error) && error.response?.status === 403
              ? "You do not have sufficient permissions to change this user's role. Only admins can modify roles."
              : 'Failed to update user role',
          color: 'red',
        });
      } finally {
        setIsUpdatingRole((prev) => ({ ...prev, [user.github_username]: false }));
      }
    },
    [users]
  );

  const handleTransfer = useCallback(
    async (user: TUserData) => {
      const balance = Number(user.account.debits_posted) - Number(user.account.credits_posted);
      const amount = transferAmounts[user.github_username];

      if (amount < 0 && Math.abs(amount) > balance) {
        showNotification({
          title: 'Error',
          message: 'The user does not have enough funds',
          color: 'red',
        });
        return;
      }

      if (!amount || isTransferring[user.github_username]) {
        return;
      }
      setIsTransferring((prev) => ({ ...prev, [user.github_username]: true }));
      try {
        const res = await http.post('/funds', {
          repoId,
          userId: user.github_id,
          amount,
        });
        if (res.status === 200) {
          const updatedUser = users.find((u) => u.github_id === user.github_id);
          if (updatedUser) {
            if (amount > 0) {
              updatedUser.account.debits_posted = (
                Number(updatedUser.account.debits_posted) + amount
              ).toString();
            } else {
              updatedUser.account.credits_posted = (
                Number(updatedUser.account.credits_posted) + Math.abs(amount)
              ).toString();
            }
            setTransferAmounts((prev) => ({
              ...prev,
              [user.github_username]: 100,
            }));
          }
          showNotification({
            title: 'Success',
            message: 'Funds transferred successfully',
            color: 'green',
          });
        } else {
          showNotification({
            title: 'Error',
            message: 'Transfer failed',
            color: 'red',
          });
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          // Check both 'error' and 'message' keys in the response payload
          let message =
            error?.response?.data?.error || error?.response?.data?.message || 'Transfer failed';
          if (status === 401) {
            message = 'Unauthorized access - please log in again';
          } else if (status === 403) {
            message = 'Forbidden - you do not have permission to perform this action';
          }
          showNotification({
            title: 'Transfer Error',
            message,
            color: 'red',
          });
        } else {
          showNotification({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Transfer failed',
            color: 'red',
          });
        }
      } finally {
        setIsTransferring((prev) => ({ ...prev, [user.github_username]: false }));
      }
    },
    [transferAmounts, repoId, isTransferring, users]
  );

  const rows = useMemo(
    () =>
      users.map((user) => (
        <Table.Tr key={user.github_username}>
          <Table.Td>
            <Group gap="lg">
              <Avatar size={50} src={`${GITHUB_AVATAR_URL}/${user.github_id}`} radius="md" />
              <div>
                <Text fz="sm" fw={700}>
                  {user.github_username}
                </Text>
                <Text fz="xs" c="dimmed">
                  {user.github_id}
                </Text>
              </div>
            </Group>
          </Table.Td>
          <Table.Td>
            {isUpdatingRole[user.github_username] ? (
              <Group justify="flex-start" gap="xs">
                <Loader size="sm" />
                <Text size="sm">Updating...</Text>
              </Group>
            ) : (
              <Select
                data={rolesData}
                value={reverseRolesMap[user.role] || 'Collaborator'}
                defaultValue="Collaborator"
                variant="unstyled"
                allowDeselect={false}
                onChange={(value: string | null) => {
                  if (!value || !(value in rolesMap)) {
                    return;
                  }
                  const role = value as keyof typeof rolesMap;
                  handleUserRole(rolesMap[role] as EUserRepoRole, user);
                }}
              />
            )}
          </Table.Td>
          <Table.Td ta="center">
            {Number(user.account.debits_posted) - Number(user.account.credits_posted)}
          </Table.Td>
          <Table.Td>
            <Group align="center">
              <NumberInput
                placeholder="100"
                value={transferAmounts[user.github_username]}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTransfer(user);
                  }
                }}
                onChange={(value) =>
                  setTransferAmounts((prev) => ({
                    ...prev,
                    [user.github_username]: Number(value) || 0,
                  }))
                }
                disabled={!hasEditAccess}
              />
              <Tooltip
                openDelay={500}
                closeDelay={200}
                label={
                  transferAmounts[user.github_username] > 0 ? 'Transfer funds' : 'Deduct funds'
                }
                color="gray"
                position="right-start"
                offset={6}
              >
                <ActionIcon
                  color={
                    !transferAmounts[user.github_username] ||
                    transferAmounts[user.github_username] === 0
                      ? 'black'
                      : transferAmounts[user.github_username] > 0
                        ? 'green'
                        : 'red'
                  }
                  radius="sm"
                  size={30}
                  onClick={() => handleTransfer(user)}
                  disabled={
                    isTransferring[user.github_username] ||
                    !transferAmounts[user.github_username] ||
                    transferAmounts[user.github_username] === 0
                  }
                >
                  {isTransferring[user.github_username] ? (
                    <Loader size={18} />
                  ) : (
                    <IconMoneybag size={18} stroke={1.5} />
                  )}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Table.Td>
        </Table.Tr>
      )),
    [users, hasEditAccess, transferAmounts, isTransferring, isUpdatingRole]
  );

  return (
    <>
      <Title mb="lg" order={2}>
        Users
      </Title>

      <Paper
        shadow="sm"
        p="lg"
        bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
        style={{
          border: `1px solid ${
            colorScheme === 'dark' ? theme.colors.gray[8] : theme.colors.gray[3]
          }`,
        }}
      >
        <Table.ScrollContainer minWidth={800} title="Users">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Users</Table.Th>
                <Table.Th>
                  Gitkarma Role
                  <Tooltip
                    withArrow
                    multiline
                    offset={10}
                    position="bottom-start"
                    transitionProps={{ transition: 'scale-y', duration: 300 }}
                    label={
                      <>
                        <Text size="xs">
                          <b>Admin</b>: Full control over repository settings and users
                        </Text>
                        <Text size="xs">
                          <b>Collaborator</b>: Contributes to the repository
                        </Text>
                        <Text size="xs">
                          <b>Organization Member</b>: Hidden from the dashboard
                        </Text>
                      </>
                    }
                  >
                    <ActionIcon mx={5} variant="subtle" radius="xl" size="xs" color="gray">
                      <IconInfoCircle size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Th>
                <Table.Th ta="center">Balance</Table.Th>
                <Table.Th>Transfer funds</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
};

export default Users;
