import { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { IconMoneybag, IconMoodSmile } from '@tabler/icons-react';
import axios from 'axios';
import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  Popover,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Transition,
  useMantineColorScheme,
  useMantineTheme,
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
    trigger_recheck_text: string;
    admin_trigger_recheck_text: string;
    disable_gitkarma: boolean;
  };
  mutateReposAndUsers?: (repoData: any) => void;
};

const moneyIcon = <IconMoneybag size={18} stroke={1.5} />;

const RepoSettings = ({ currentRepo, mutateReposAndUsers }: RepoSettingsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeEmojiField, setActiveEmojiField] = useState<string | null>(null);
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const form = useForm({
    initialValues: {
      initial_debits: currentRepo.initial_debits,
      approval_bonus: currentRepo.approval_bonus,
      comment_bonus: currentRepo.comment_bonus,
      complexity_bonus: currentRepo.complexity_bonus,
      merge_penalty: currentRepo.merge_penalty,
      enable_complexity_bonus: currentRepo.enable_complexity_bonus,
      enable_review_quality_bonus: currentRepo.enable_review_quality_bonus,
      trigger_recheck_text: currentRepo.trigger_recheck_text,
      admin_trigger_recheck_text: currentRepo.admin_trigger_recheck_text,
      disable_gitkarma: currentRepo.disable_gitkarma || false,
    },
    validate: {
      initial_debits: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      approval_bonus: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      comment_bonus: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      complexity_bonus: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      merge_penalty: (val: number) => (val < 0 ? 'Must be at least 0' : null),
      trigger_recheck_text: (val: string) => (!val ? 'Cannot be empty' : null),
      admin_trigger_recheck_text: (val: string) => (!val ? 'Cannot be empty' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const res = await http.put('/repos/settings', values);
      if (res.status === 200) {
        showNotification({
          title: 'Success',
          message: 'Repository settings saved successfully',
          color: 'green',
        });
        // Trigger SWR cache revalidation if available
        if (mutateReposAndUsers) {
          mutateReposAndUsers(values);
        }
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
          title: 'Update Error',
          message: error instanceof Error ? error.message : 'Failed to update settings',
          color: 'red',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const emojiChar = emoji.native;
    if (activeEmojiField === 'trigger_recheck_text') {
      form.setFieldValue('trigger_recheck_text', form.values.trigger_recheck_text + emojiChar);
    } else if (activeEmojiField === 'admin_trigger_recheck_text') {
      form.setFieldValue(
        'admin_trigger_recheck_text',
        form.values.admin_trigger_recheck_text + emojiChar
      );
    }
    setActiveEmojiField(null);
  };

  return (
    <>
      <Title mb="lg" order={2}>
        Repository Settings
      </Title>
      <Paper shadow="none" p="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Funds */}
            <Title order={3}>Financial Settings</Title>
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

            {/* Trigger Recheck Settings */}
            <Title mt="xl" order={3}>
              Recheck Triggers
            </Title>

            {/* user trigger recheck text */}
            <TextInput
              label="User Trigger Recheck Text"
              placeholder=":sparkles:"
              description="Text/emoji that users can comment to trigger a PR recheck."
              {...form.getInputProps('trigger_recheck_text')}
              rightSection={
                <Popover
                  trapFocus
                  position="top-end"
                  width="auto"
                  opened={activeEmojiField === 'trigger_recheck_text'}
                  onChange={(opened) => {
                    if (!opened) {
                      setActiveEmojiField(null);
                    }
                  }}
                >
                  <Popover.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() =>
                        setActiveEmojiField(
                          activeEmojiField === 'trigger_recheck_text'
                            ? null
                            : 'trigger_recheck_text'
                        )
                      }
                    >
                      <IconMoodSmile size={18} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown p={0} m={0} bg="transparent" bd="none">
                    <Picker
                      title="Pick your emoji"
                      data={data}
                      theme={colorScheme}
                      onEmojiSelect={handleEmojiSelect}
                    />
                  </Popover.Dropdown>
                </Popover>
              }
            />

            {/* admin trigger recheck text */}
            <TextInput
              label="Admin Trigger Recheck Text"
              placeholder=":rocket:"
              description="Text/emoji that admins can comment to trigger a PR recheck."
              {...form.getInputProps('admin_trigger_recheck_text')}
              rightSection={
                <Popover
                  trapFocus
                  position="top-end"
                  width="auto"
                  opened={activeEmojiField === 'admin_trigger_recheck_text'}
                  onChange={(opened) => {
                    if (!opened) {
                      setActiveEmojiField(null);
                    }
                  }}
                >
                  <Popover.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() =>
                        setActiveEmojiField(
                          activeEmojiField === 'admin_trigger_recheck_text'
                            ? null
                            : 'admin_trigger_recheck_text'
                        )
                      }
                    >
                      <IconMoodSmile size={18} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown p={0} m={0} bg="transparent" bd="none">
                    <Picker
                      theme={colorScheme}
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      title="Pick your emoji"
                    />
                  </Popover.Dropdown>
                </Popover>
              }
            />

            {/* Danger Zone */}
            <Title mt="xl" order={3} c="red">
              Danger Zone
            </Title>
            <Group justify="space-between" wrap="nowrap" gap="xl" mt="md">
              <div>
                <Text>Disable GitKarma</Text>
                <Text size="xs" c="dimmed">
                  Temporarily pause GitKarma scoring for this repository. This will not uninstall
                  GitKarma.
                </Text>
                <Text size="xs" c="dimmed">
                  All actions will be paused including balance checks and re-triggering gitkarma
                  checks
                </Text>
              </div>
              <Switch
                onLabel="ON"
                offLabel="OFF"
                size="lg"
                color="red"
                {...form.getInputProps('disable_gitkarma', { type: 'checkbox' })}
              />
            </Group>

            {/* ACTION BUTTONS */}
            <Group justify="flex-end" mt="lg">
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
                color={theme.colors.primary[8]}
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
