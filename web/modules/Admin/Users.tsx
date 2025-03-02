import { useCallback, useState } from 'react';
import { IconMoneybag } from '@tabler/icons-react';
import axios from 'axios';
import {
  ActionIcon,
  Avatar,
  Group,
  Loader,
  NumberInput,
  Select,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { TUserData } from '@/models/UserRepo';
import { http } from '@/utils/http';

const rolesData = ['Owner', 'Admin', 'Collaborator'];

const GITHUB_AVATAR_URL = 'https://avatars.githubusercontent.com/u';

type Props = {
  users: TUserData[];
  repoId: number;
};

const Users: React.FC<Props> = ({ users, repoId }) => {
  const [transferAmounts, setTransferAmounts] = useState<{ [key: string]: number }>({});
  const [isTransferring, setIsTransferring] = useState<{ [key: string]: boolean }>({});

  const handleTransfer = useCallback(
    async (user: TUserData) => {
      const amount = transferAmounts[user.github_username];
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
              [user.github_username]: 0,
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
          let message = 'Transfer failed';
          if (status === 401) {
            message = 'Unauthorized access - please log in again';
          } else if (status === 403) {
            message = 'Forbidden - you do not have permission to perform this action';
          } else if (error.response?.data?.message) {
            message = error.response.data.message;
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

  const rows = users.map((user) => (
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
        <Select
          data={rolesData}
          defaultValue="Collaborator"
          variant="unstyled"
          allowDeselect={false}
        />
      </Table.Td>
      <Table.Td ta="center">
        {Number(user.account.debits_posted) - Number(user.account.credits_posted)}
      </Table.Td>
      <Table.Td>
        <Group align="center">
          <NumberInput
            placeholder="100"
            value={transferAmounts[user.github_username]}
            onChange={(value) =>
              setTransferAmounts((prev) => ({
                ...prev,
                [user.github_username]: Number(value) || 0,
              }))
            }
          />
          <Tooltip
            openDelay={500}
            closeDelay={200}
            label={transferAmounts[user.github_username] > 0 ? 'Transfer funds' : 'Deduct funds'}
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
  ));

  return (
    <>
      <Title mb="lg" order={2}>
        Users
      </Title>
      <Table.ScrollContainer minWidth={800} title="Users">
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Users</Table.Th>
              <Table.Th>GitKarma Role</Table.Th>
              <Table.Th ta="center">Balance</Table.Th>
              <Table.Th>Transfer funds</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
};

export default Users;
