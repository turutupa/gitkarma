import { useState } from 'react';
import { IconMoneybag } from '@tabler/icons-react';
import axios from 'axios';
import {
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  Title,
  Transition,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { http } from '@/utils/http';

// Update prop type with new fields
type RepoSettingsProps = {
  currentRepo: {
    initial_debits: number;
    approval_bonus: number;
    comment_bonus: number;
    complexity_bonus: number;
    merge_penalty: number;
    enable_complexity_bonus: boolean;
    enable_review_quality_bonus: boolean;
  };
};

const moneyIcon = <IconMoneybag size={18} stroke={1.5} />;

const RepoSettings = ({ currentRepo }: RepoSettingsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    initialValues: {
      initial_debits: currentRepo.initial_debits,
      approval_bonus: currentRepo.approval_bonus,
      comment_bonus: currentRepo.comment_bonus,
      complexity_bonus: currentRepo.complexity_bonus,
      merge_penalty: currentRepo.merge_penalty,
      enable_complexity_bonus: currentRepo.enable_complexity_bonus,
      enable_review_quality_bonus: currentRepo.enable_review_quality_bonus,
    },
    validate: {
      initial_debits: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      approval_bonus: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      comment_bonus: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      complexity_bonus: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      merge_penalty: (val: number) => (val < 0 ? 'Must be at least 0' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const res = await http.put('/repos', values);
      if (res.status === 200) {
        showNotification({
          title: 'Success',
          message: 'Repository settings saved successfully',
          color: 'green',
        });
      } else {
        showNotification({
          title: 'Error',
          message: 'Failed to update repository settings',
          color: 'red',
        });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let message =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to update repository settings';
        if (status === 401) {
          message = 'Unauthorized access - please log in again';
        } else if (status === 403) {
          message = 'Forbidden - you do not have permission to perform this action';
        }
        showNotification({
          title: 'Update Error',
          message,
          color: 'red',
        });
      } else {
        showNotification({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to update settings',
          color: 'red',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Title mb="lg" order={2}>
        Repository Settings
      </Title>
      <Paper shadow="none" p="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <NumberInput
              label="Initial Debits"
              placeholder="400"
              leftSection={moneyIcon}
              description="Initial debits assigned when a user is added to a repository."
              {...form.getInputProps('initial_debits')}
            />
            <NumberInput
              label="Merge Penalty"
              placeholder="100"
              leftSection={moneyIcon}
              description="Debits deducted from the PR author upon merge."
              {...form.getInputProps('merge_penalty')}
            />
            <NumberInput
              label="Approval Bonus"
              placeholder="50"
              leftSection={moneyIcon}
              description="Debits awarded to a PR approver upon review approval."
              {...form.getInputProps('approval_bonus')}
            />

            {/* ENABLE COMPLEXITY BONUS + CONDITIONAL RENDERING */}
            <Group justify="space-between" wrap="nowrap" gap="xl">
              <div>
                <Text>Enable Complexity Bonus</Text>
                <Text size="xs" c="dimmed">
                  Enable bonus for complex pull requests.
                </Text>
              </div>
              <Switch
                onLabel="ON"
                offLabel="OFF"
                size="lg"
                {...form.getInputProps('enable_complexity_bonus', { type: 'checkbox' })}
              />
            </Group>
            <Transition
              mounted={form.values.enable_complexity_bonus}
              transition="scale-y"
              duration={200}
              timingFunction="linear"
            >
              {(styles) => (
                <div style={styles}>
                  <NumberInput
                    label="Complexity Bonus"
                    placeholder="20"
                    leftSection={moneyIcon}
                    description="Bonus debits for complex pull requests."
                    {...form.getInputProps('complexity_bonus')}
                  />
                </div>
              )}
            </Transition>

            {/* ENABLE REVIEW BONUS + CONDITIONAL RENDERING */}
            <Group justify="space-between" wrap="nowrap" gap="xl" mt="md">
              <div>
                <Text>Enable Review Bonus</Text>
                <Text size="xs" c="dimmed">
                  Enable bonus for review quality.
                </Text>
              </div>
              <Switch
                onLabel="ON"
                offLabel="OFF"
                size="lg"
                {...form.getInputProps('enable_review_quality_bonus', { type: 'checkbox' })}
              />
            </Group>
            <Transition
              mounted={form.values.enable_review_quality_bonus}
              transition="scale-y"
              duration={200}
              timingFunction="ease"
            >
              {(styles) => (
                <div style={styles}>
                  <NumberInput
                    label="Review Bonus"
                    placeholder="5"
                    leftSection={moneyIcon}
                    description="Debits given for high-quality PR comments."
                    {...form.getInputProps('comment_bonus')}
                  />
                </div>
              )}
            </Transition>

            {/* ACTION BUTTONS */}
            <Group justify="flex-end">
              <Button
                variant="default"
                color="dark"
                mt="md"
                type="button"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Reset Changes
              </Button>
              <Button
                type="submit"
                mt="md"
                color="var(--mantine-color-primary-6)"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Save Settings
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  );
};

export default RepoSettings;
