import { IconMoneybag } from '@tabler/icons-react';
import { NumberInput, Stack, Title } from '@mantine/core';

const moneyIcon = <IconMoneybag size={22} stroke={1.5} />;

const RepoSettings = () => {
  return (
    <>
      <Title mb="lg" order={2}>
        Repository Settings
      </Title>
      <Stack gap="md">
        <NumberInput
          leftSection={moneyIcon}
          description="this is an example of a description"
          label="Default debits"
          placeholder="400"
        />
        <NumberInput
          leftSection={moneyIcon}
          description="this is an example of a description"
          label="Fund Pull Request"
          placeholder="400"
        />
        <NumberInput
          leftSection={moneyIcon}
          description="this is an example of a description"
          label="On Approve Pull Request"
          placeholder="400"
        />
        <NumberInput
          leftSection={moneyIcon}
          description="this is an example of a description"
          label="On code complexity"
          placeholder="400"
        />
      </Stack>
    </>
  );
};

export default RepoSettings;
