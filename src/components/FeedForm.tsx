import { TextInput, Button, Group, Stack, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FeedConfig } from '../server/types';
import { useEffect } from 'react';

interface FeedFormProps {
  initialFeeds: FeedConfig[];
  onSubmit: (feeds: FeedConfig[]) => void;
}

export function FeedForm({ initialFeeds, onSubmit }: FeedFormProps) {
  const form = useForm({
    initialValues: {
      feeds: initialFeeds.length > 0 ? initialFeeds : [{ url: '', keywords: [] }],
    },
  });

  useEffect(() => {
    form.setValues({
      feeds: initialFeeds.length > 0 ? initialFeeds : [{ url: '', keywords: [] }],
    });
  }, [initialFeeds]);

  const addFeed = () => {
    form.insertListItem('feeds', { url: '', keywords: [] });
  };

  const removeFeed = (index: number) => {
    form.removeListItem('feeds', index);
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
              <TextInput
                label="Keywords (comma-separated)"
                placeholder="keyword1, keyword2"
                style={{ flex: 1 }}
                onChange={(event) => {
                  const keywords = event.target.value
                    .split(',')
                    .map((k) => k.trim())
                    .filter((k) => k !== '');
                  form.setFieldValue(`feeds.${index}.keywords`, keywords);
                }}
                value={feed.keywords.join(', ')}
              />
              <ActionIcon
                color="red"
                mt={28}
                onClick={() => removeFeed(index)}
                disabled={form.values.feeds.length === 1}
              >
                ×
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
    </Stack>
  );
} 