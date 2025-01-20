import { TextInput, NumberInput, Button, Stack, Group, Paper, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface SettingsFormProps {
  initialNtfyServerAddress: string;
  initialCheckInterval: number;
  initialDefaultNtfyTopic: string;
  onSubmit: (ntfyServerAddress: string, checkInterval: number, defaultNtfyTopic: string) => void;
}

export function SettingsForm({
  initialNtfyServerAddress,
  initialCheckInterval,
  initialDefaultNtfyTopic,
  onSubmit,
}: SettingsFormProps) {
  const form = useForm({
    initialValues: {
      ntfyServerAddress: initialNtfyServerAddress,
      checkInterval: initialCheckInterval,
      defaultNtfyTopic: initialDefaultNtfyTopic,
    },
    validate: {
      ntfyServerAddress: (value) =>
        !value || value.trim().length === 0 ? 'Ntfy server address is required' : null,
      checkInterval: (value) =>
        !value || value < 1 ? 'Check interval must be at least 1 minute' : null,
      defaultNtfyTopic: (value) =>
        !value || value.trim().length === 0 ? 'Default ntfy topic is required' : null,
    },
  });

  useEffect(() => {
    form.setValues({
      ntfyServerAddress: initialNtfyServerAddress,
      checkInterval: initialCheckInterval,
      defaultNtfyTopic: initialDefaultNtfyTopic,
    });
  }, [initialNtfyServerAddress, initialCheckInterval, initialDefaultNtfyTopic]);

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values.ntfyServerAddress, values.checkInterval, values.defaultNtfyTopic))}>
      <Stack>
        {/* Notification Settings Section */}
        <Paper withBorder p="md">
          <Stack>
            <Text fw={500} size="sm">Ntfy Settings</Text>
            <TextInput
              label="Server Address"
              placeholder="https://ntfy.sh"
              required
              {...form.getInputProps('ntfyServerAddress')}
            />
            <TextInput
              label="Default Topic"
              placeholder="rss"
              description="Used when a feed doesn't have a specific topic configured"
              required
              {...form.getInputProps('defaultNtfyTopic')}
            />
          </Stack>
        </Paper>

        {/* Feed Check Settings Section */}
        <Paper withBorder p="md">
          <Stack>
            <Text fw={500} size="sm">Monitoring Settings</Text>
            <NumberInput
              label="Check Interval"
              description="How often to check feeds for new posts (in minutes)"
              placeholder="15"
              min={1}
              required
              {...form.getInputProps('checkInterval')}
            />
          </Stack>
        </Paper>

        <Group justify="flex-end" mt="md">
          <Button type="submit">Save Settings</Button>
        </Group>
      </Stack>
    </form>
  );
} 