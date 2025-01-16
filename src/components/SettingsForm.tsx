import { TextInput, NumberInput, Button, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';

interface SettingsFormProps {
  initialNtfyTopic: string;
  initialNtfyServerAddress: string;
  initialCheckInterval: number;
  onSubmit: (ntfyTopic: string, ntfyServerAddress: string, checkInterval: number) => void;
}

export function SettingsForm({
  initialNtfyTopic,
  initialNtfyServerAddress,
  initialCheckInterval,
  onSubmit,
}: SettingsFormProps) {
  const [isTesting, setIsTesting] = useState(false);
  const form = useForm({
    initialValues: {
      ntfyTopic: initialNtfyTopic,
      ntfyServerAddress: initialNtfyServerAddress,
      checkInterval: initialCheckInterval,
    },
    validate: {
      ntfyTopic: (value) =>
        value.length === 0 ? 'Ntfy topic is required' : null,
      ntfyServerAddress: (value) =>
        value.length === 0 ? 'Ntfy server address is required' : null,
      checkInterval: (value) =>
        value < 1 ? 'Check interval must be at least 1 minute' : null,
    },
  });

  useEffect(() => {
    form.setValues({
      ntfyTopic: initialNtfyTopic,
      ntfyServerAddress: initialNtfyServerAddress,
      checkInterval: initialCheckInterval,
    });
  }, [initialNtfyTopic, initialNtfyServerAddress, initialCheckInterval]);

  const handleTestNotification = async () => {
    if (!form.isValid()) return;
    
    try {
      setIsTesting(true);
      await fetch('/api/test-notification', { method: 'POST' });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values.ntfyTopic, values.ntfyServerAddress, values.checkInterval))}>
      <Stack>
        <TextInput
          label="Ntfy Server Address"
          placeholder="https://ntfy.sh"
          required
          {...form.getInputProps('ntfyServerAddress')}
        />
        <TextInput
          label="Ntfy Topic"
          placeholder="your-topic-name"
          required
          {...form.getInputProps('ntfyTopic')}
        />
        <NumberInput
          label="Check Interval (minutes)"
          placeholder="15"
          min={1}
          required
          {...form.getInputProps('checkInterval')}
        />
        <Group justify="space-between">
          <Button onClick={handleTestNotification} loading={isTesting} variant="light">
            Test Notification
          </Button>
          <Button type="submit">Save Settings</Button>
        </Group>
      </Stack>
    </form>
  );
} 