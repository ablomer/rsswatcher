import { Paper, Text, Group, Stack, ScrollArea } from '@mantine/core';
import { FeedStatus as FeedStatusType } from '../server/types';

interface FeedStatusProps {
  status: Record<string, FeedStatusType>;
}

export function FeedStatus({ status }: FeedStatusProps) {
  return (
    <Stack h="100%" style={{ flex: 1 }}>
      <Group justify="space-between" mb="md">
        <Text size="xl">Feed Status</Text>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        <Stack>
          {Object.entries(status).map(([url, feedStatus]) => (
            <Paper key={url} p="md" withBorder>
              <Text fw={500}>{url}</Text>
              <Text size="sm" c={feedStatus.isChecking ? 'blue' : 'gray'}>
                Last check: {new Date(feedStatus.lastCheck).toLocaleString()}
              </Text>
              {feedStatus.error && (
                <Text size="sm" c="red">
                  Error: {feedStatus.error}
                </Text>
              )}
              <Text size="sm" c={feedStatus.isChecking ? 'blue' : 'gray'}>
                Status: {feedStatus.isChecking ? 'Checking...' : 'Idle'}
              </Text>
            </Paper>
          ))}

          {Object.keys(status).length === 0 && (
            <Text c="dimmed" ta="center">
              No feeds configured yet
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
} 