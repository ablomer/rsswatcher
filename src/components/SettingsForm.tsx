import { TextInput, NumberInput, Button, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';

interface SettingsFormProps {
  initialNtfyTopic: string;
  initialCheckInterval: number;
  onSubmit: (ntfyTopic: string, checkInterval: number) => void;
}

export function SettingsForm({
  initialNtfyTopic,
  initialCheckInterval,
  onSubmit,
}: SettingsFormProps) {
  const form = useForm({
    initialValues: {
      ntfyTopic: initialNtfyTopic,
      checkInterval: initialCheckInterval,
    },
    validate: {
      ntfyTopic: (value) =>
        value.length === 0 ? 'Ntfy topic is required' : null,
      checkInterval: (value) =>
        value < 1 ? 'Check interval must be at least 1 minute' : null,
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values.ntfyTopic, values.checkInterval))}>
      <Stack>
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
        <Button type="submit">Save Settings</Button>
      </Stack>
    </form>
  );
} 