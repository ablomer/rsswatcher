import { useEffect, useState } from 'react';
import { Table, Text, Badge, Group, ScrollArea, Button, ActionIcon, Stack, Modal } from '@mantine/core';
import { IconExternalLink, IconBell, IconBellOff, IconEye } from '@tabler/icons-react';
import { FeedHistory as FeedHistoryType, FeedHistoryEntry } from '../server/types';

interface FeedHistoryProps {
  onRefresh: () => void;
}

export function FeedHistory({ onRefresh }: FeedHistoryProps) {
  const [history, setHistory] = useState<FeedHistoryType>({ entries: [], maxEntries: 1000 });
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<FeedHistoryEntry | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setHistory(data);
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

  const handleRefresh = () => {
    setLoading(true);
    fetchHistory();
    onRefresh();
  };

  return (
    <Stack h="100%" style={{ flex: 1 }}>
      <Group justify="space-between" mb="md">
        <Text size="xl">Feed History</Text>
        <Button onClick={handleRefresh} loading={loading}>
          Refresh
        </Button>
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
            {history.entries.map((entry: FeedHistoryEntry, index) => (
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
                  {entry.notificationSent ? (
                    <Badge color="green" leftSection={<IconBell size={14} />}>
                      Sent
                    </Badge>
                  ) : (
                    <Badge color="gray" leftSection={<IconBellOff size={14} />}>
                      No Match
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
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>

      <Modal
        opened={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry?.title || ''}
        size="lg"
      >
        {selectedEntry && (
          <Stack>
            <Text size="sm" c="dimmed">Feed URL: {selectedEntry.feedUrl}</Text>
            <Text size="sm" c="dimmed">Published: {new Date(selectedEntry.pubDate).toLocaleString()}</Text>
            <Text size="sm" c="dimmed">Checked: {new Date(selectedEntry.checkedAt).toLocaleString()}</Text>
            {selectedEntry.matchedKeywords.length > 0 && (
              <Group>
                <Text size="sm" c="dimmed">Matched Keywords:</Text>
                {selectedEntry.matchedKeywords.map((keyword, idx) => (
                  <Badge key={idx} size="sm">{keyword}</Badge>
                ))}
              </Group>
            )}
            <Text mt="md" dangerouslySetInnerHTML={{ __html: selectedEntry.description }} />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
} 