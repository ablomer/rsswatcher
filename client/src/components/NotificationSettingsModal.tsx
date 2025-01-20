import { Modal, TextInput, Switch, Select, Stack, Button, Group, Paper, Text } from '@mantine/core';
import { NotificationSettings, NtfyPriority } from 'shared/types';
import { useState, useEffect } from 'react';

interface NotificationSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
}

export function NotificationSettingsModal({ opened, onClose, settings, onSave }: NotificationSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setLocalSettings(current => ({
      ...current,
      ...newSettings,
    }));
  };

  const handleTestNotification = async () => {    
    try {
      setIsTesting(true);
      await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: localSettings.ntfyTopic
        })
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Notification Settings"
      size="lg"
    >
      <Stack>
        {/* Content Section */}
        <Paper withBorder p="md">
          <Stack>
            <Text fw={500} size="sm">Title</Text>
            <Stack gap="xs">
              <TextInput
                placeholder="Enter custom title"
                value={localSettings.customTitle || ''}
                onChange={(event) => updateSettings({ customTitle: event.currentTarget.value })}
                disabled={localSettings.usePostTitle}
              />
              <Switch
                label="Use post title"
                checked={localSettings.usePostTitle}
                onChange={(event) => updateSettings({ usePostTitle: event.currentTarget.checked })}
              />
            </Stack>

            <Text fw={500} size="sm" mt="md">Description</Text>
            <Stack gap="xs">
              <TextInput
                placeholder="Enter custom description"
                value={localSettings.customDescription || ''}
                onChange={(event) => updateSettings({ customDescription: event.currentTarget.value })}
                disabled={localSettings.usePostDescription}
              />
              <Switch
                label="Use post description"
                checked={localSettings.usePostDescription}
                onChange={(event) => updateSettings({ usePostDescription: event.currentTarget.checked })}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Options Section */}
        <Paper withBorder p="md">
          <Stack>
            <Text fw={500} size="sm">Notification Settings</Text>
            <TextInput
              label="Ntfy Topic"
              placeholder="your-topic-name"
              description="Leave empty to use the default topic from settings"
              value={localSettings.ntfyTopic || ''}
              onChange={(event) => updateSettings({ ntfyTopic: event.currentTarget.value || undefined })}
            />
            <Select
              label="Priority"
              data={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'default', label: 'Default' },
                { value: 'low', label: 'Low' },
                { value: 'min', label: 'Min' },
              ]}
              value={localSettings.priority}
              onChange={(value) => updateSettings({ priority: value as NtfyPriority })}
            />

            <Text fw={500} size="sm" mt="md">Additional Options</Text>
            <Stack gap="xs">
              <Switch
                label="Append post link to description"
                checked={localSettings.appendLink}
                onChange={(event) => updateSettings({ appendLink: event.currentTarget.checked })}
              />
              <Switch
                label="Include matched keywords as tags"
                checked={localSettings.includeKeywordTags}
                onChange={(event) => updateSettings({ includeKeywordTags: event.currentTarget.checked })}
              />
              <Switch
                label="Add 'Open' action with post link"
                checked={localSettings.includeOpenAction}
                onChange={(event) => updateSettings({ includeOpenAction: event.currentTarget.checked })}
              />
            </Stack>
          </Stack>
        </Paper>

        <Group justify="space-between" mt="md">
          <Button onClick={handleTestNotification} loading={isTesting} variant="light">
            Test Notification
          </Button>
          <Group>
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
} 