import { TextInput, Button, Group, Box, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FeedConfig } from '../server/types';

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

  const addFeed = () => {
    form.insertListItem('feeds', { url: '', keywords: [] });
  };

  const removeFeed = (index: number) => {
    form.removeListItem('feeds', index);
  };

  return (
    <Box>
      <form onSubmit={form.onSubmit((values) => onSubmit(values.feeds))}>
        {form.values.feeds.map((feed, index) => (
          <Box key={index} mb="md">
            <Group align="flex-start">
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
          </Box>
        ))}

        <Group justify="space-between" mt="md">
          <Button type="button" variant="outline" onClick={addFeed}>
            Add Feed
          </Button>
          <Button type="submit">Save Feeds</Button>
        </Group>
      </form>
    </Box>
  );
} 