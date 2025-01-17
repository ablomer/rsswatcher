import { TextInput, Button, Group, Stack, ActionIcon, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
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
                  if (event.key === ',' || event.key === ';') {
                    event.preventDefault();
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
    </Stack>
  );
} 