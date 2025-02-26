import { IconMoneybag } from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Group,
  NumberInput,
  Select,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { TUserData } from '@/models/UserRepo';

const rolesData = ['Owner', 'Admin', 'Collaborator'];

const GITHUB_AVATAR_URL = 'https://avatars.githubusercontent.com/u';

type Props = {
  users: TUserData[];
};

const Users: React.FC<Props> = ({ users }) => {
  console.log(users);
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
      <Table.Td>
        {Number(user.account.debits_posted) - Number(user.account.credits_posted)}
      </Table.Td>
      <Table.Td>
        <Group align="center">
          <NumberInput description="" placeholder="100" />
          <Tooltip label="Transfer funds" color="gray" position="right-start" offset={6}>
            <ActionIcon variant="subtle" color="green" radius="sm" size={30}>
              <IconMoneybag size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={800} title="Users">
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Users</Table.Th>
            <Table.Th>GitKarma Role</Table.Th>
            <Table.Th>Balance</Table.Th>
            <Table.Th>Transfer funds</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default Users;
