import { useEffect, useState } from 'react';
import { Table, Text, Badge, Group, ScrollArea, ActionIcon, Stack } from '@mantine/core';
import { IconExternalLink, IconBell } from '@tabler/icons-react';
import { FeedHistory as FeedHistoryType, FeedHistoryEntry } from '../server/types';

export function FeedHistory() {
  const [history, setHistory] = useState<FeedHistoryType>({ entries: [], maxEntries: 1000 });
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory({
        entries: data.entries || [],
        maxEntries: data.maxEntries || 1000
      });
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Stack h="100%" style={{ flex: 1 }}>
      <Group justify="space-between" mb="md">
        <Text size="xl">Feed History</Text>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Feed URL</th>
              <th>Title</th>
              <th>Checked At</th>
              <th>Keywords Matched</th>
              <th>Notification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(history.entries || []).map((entry: FeedHistoryEntry, index) => (
              <tr key={`${entry.feedUrl}-${entry.title}-${entry.checkedAt}-${index}`}>
                <td>
                  <Text size="sm" lineClamp={1}>
                    {entry.feedUrl}
                  </Text>
                </td>
                <td>
                  <Text size="sm" lineClamp={1}>
                    {entry.title}
                  </Text>
                </td>
                <td>
                  <Text size="sm">
                    {new Date(entry.checkedAt).toLocaleString()}
                  </Text>
                </td>
                <td>
                  <Group gap={4}>
                    {entry.matchedKeywords.map((keyword, idx) => (
                      <Badge key={idx} size="sm">
                        {keyword}
                      </Badge>
                    ))}
                  </Group>
                </td>
                <td>
                  {entry.notificationSent && (
                    <Badge color="green" leftSection={<IconBell size={14} />}>
                      Sent
                    </Badge>
                  )}
                </td>
                <td>
                  <Group gap={4}>
                    <ActionIcon
                      component="a"
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      variant="subtle"
                    >
                      <IconExternalLink size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
} 