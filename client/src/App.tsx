import { useEffect, useState } from 'react';
import { Container, Title, Tabs, LoadingOverlay, Group, Button } from '@mantine/core';
import { FeedForm } from './components/FeedForm';
import { FeedStatus } from './components/FeedStatus';
import { SettingsForm } from './components/SettingsForm';
import { FeedHistory } from './components/FeedHistory';
import { AppConfig, FeedStatus as FeedStatusType } from './server/types';

export default function App() {
  const [config, setConfig] = useState<AppConfig>({
    feeds: [],
    ntfyServerAddress: 'https://ntfy.sh',
    checkIntervalMinutes: 15,
    defaultNtfyTopic: 'rss',
  });
  const [status, setStatus] = useState<Record<string, FeedStatusType>>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchConfig(), fetchStatus()]).finally(() => setLoading(false));

    // Poll status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFeedSubmit = async (feeds: AppConfig['feeds']) => {
    try {
      setLoading(true);
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, feeds }),
      });
      await fetchConfig();
      await fetchStatus();
    } catch (error) {
      console.error('Failed to update feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (ntfyServerAddress: string, checkIntervalMinutes: number, defaultNtfyTopic: string) => {
    try {
      setLoading(true);
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, ntfyServerAddress, checkIntervalMinutes, defaultNtfyTopic }),
      });
      await fetchConfig();
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNow = async () => {
    try {
      await fetch('/api/check', { method: 'POST' });
      await fetchStatus();
    } catch (error) {
      console.error('Failed to trigger check:', error);
    }
  };

  return (
    <Container size="lg" py="xl">
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" mb="xl">
        <Title order={1}>RSS Feed Monitor</Title>
        <Button onClick={handleCheckNow} loading={loading}>Check Now</Button>
      </Group>

      <Tabs defaultValue="feeds">
        <Tabs.List mb="md">
          <Tabs.Tab value="feeds">Feeds</Tabs.Tab>
          <Tabs.Tab value="status">Status</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="feeds">
          <FeedForm initialFeeds={config.feeds} onSubmit={handleFeedSubmit} />
        </Tabs.Panel>

        <Tabs.Panel value="status">
          <FeedStatus status={status} />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <FeedHistory />
        </Tabs.Panel>

        <Tabs.Panel value="settings">
          <SettingsForm
            initialNtfyServerAddress={config.ntfyServerAddress}
            initialCheckInterval={config.checkIntervalMinutes}
            initialDefaultNtfyTopic={config.defaultNtfyTopic}
            onSubmit={handleSettingsSubmit}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
