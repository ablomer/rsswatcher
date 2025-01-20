import { TextInput, Button, Group, Stack, ActionIcon, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconBellRinging } from '@tabler/icons-react';
import { FeedConfig, NotificationSettings } from 'shared/types';
import { useEffect, useState } from 'react';
import { NotificationSettingsModal } from './NotificationSettingsModal';

interface FeedFormProps {
  initialFeeds: FeedConfig[];
  onSubmit: (feeds: FeedConfig[]) => void;
}

const defaultNotificationSettings: NotificationSettings = {
  usePostTitle: true,
  usePostDescription: true,
  appendLink: false,
  priority: 'low',
  includeKeywordTags: true,
  includeOpenAction: true,
};

export function FeedForm({ initialFeeds, onSubmit }: FeedFormProps) {
  const [editingNotificationIndex, setEditingNotificationIndex] = useState<number | null>(null);

  const form = useForm({
    initialValues: {
      feeds: initialFeeds.length > 0 ? initialFeeds.map(feed => ({
        ...feed,
        notificationSettings: feed.notificationSettings || defaultNotificationSettings,
      })) : [{
        url: '',
        keywords: [],
        notificationSettings: defaultNotificationSettings,
      }],
    },
  });

  useEffect(() => {
    form.setValues({
      feeds: initialFeeds.length > 0 ? initialFeeds.map(feed => ({
        ...feed,
        notificationSettings: feed.notificationSettings || defaultNotificationSettings,
      })) : [{
        url: '',
        keywords: [],
        notificationSettings: defaultNotificationSettings,
      }],
    });
  }, [initialFeeds]);

  const addFeed = () => {
    form.insertListItem('feeds', {
      url: '',
      keywords: [],
      notificationSettings: defaultNotificationSettings,
    });
  };

  const removeFeed = (index: number) => {
    form.removeListItem('feeds', index);
  };

  const handleNotificationSettingsSave = (settings: NotificationSettings) => {
    if (editingNotificationIndex !== null) {
      const updatedFeeds = form.values.feeds.map((feed, index) => 
        index === editingNotificationIndex 
          ? { ...feed, notificationSettings: settings }
          : feed
      );
      form.setFieldValue('feeds', updatedFeeds);
      setEditingNotificationIndex(null);
      onSubmit(updatedFeeds);
    }
  };

  return (
    <Stack h="100%" style={{ flex: 1 }}>
      <form onSubmit={form.onSubmit((values) => onSubmit(values.feeds))}>
        <Stack>
          {form.values.feeds.map((feed, index) => (
            <Group key={index} align="flex-start">
              <TextInput
                label="Feed URL"
                placeholder="https://example.com/feed.xml"
                required
                style={{ flex: 1 }}
                {...form.getInputProps(`feeds.${index}.url`)}
              />
              <MultiSelect
                label="Keywords"
                placeholder="Type and press enter to add keywords"
                style={{ flex: 1 }}
                data={Array.from(new Set([...feed.keywords]))}
                value={feed.keywords}
                onChange={(value) => {
                  form.setFieldValue(`feeds.${index}.keywords`, value);
                }}
                searchable
                clearable
                withAsterisk={false}
                onKeyDown={(event) => {
                  if (event.key === ',' || event.key === ';' || event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    const input = event.currentTarget as HTMLInputElement;
                    const value = input.value.trim();
                    if (value && !feed.keywords.includes(value)) {
                      form.setFieldValue(`feeds.${index}.keywords`, [...feed.keywords, value]);
                      setTimeout(() => {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                        if (nativeInputValueSetter) {
                          nativeInputValueSetter.call(input, '');
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                      }, 0);
                    }
                  }
                }}
              />
              <ActionIcon
                color="blue"
                mt={28}
                onClick={() => setEditingNotificationIndex(index)}
                variant="subtle"
                title="Notification Settings"
              >
                <IconBellRinging size={16} />
              </ActionIcon>
              <ActionIcon
                color="red"
                mt={28}
                onClick={() => removeFeed(index)}
                disabled={form.values.feeds.length === 1}
                variant="subtle"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}

          <Group justify="space-between" mt="md">
            <Button type="button" variant="outline" onClick={addFeed}>
              Add Feed
            </Button>
            <Button type="submit">Save Feeds</Button>
          </Group>
        </Stack>
      </form>

      <NotificationSettingsModal
        opened={editingNotificationIndex !== null}
        onClose={() => setEditingNotificationIndex(null)}
        settings={editingNotificationIndex !== null ? form.values.feeds[editingNotificationIndex].notificationSettings : defaultNotificationSettings}
        onSave={handleNotificationSettingsSave}
      />
    </Stack>
  );
} 