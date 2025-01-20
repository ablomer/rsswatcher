import { useEffect, useState } from 'react';
import { Container, Title, Tabs, LoadingOverlay } from '@mantine/core';
import { FeedForm } from './components/FeedForm';
import { FeedStatus } from './components/FeedStatus';
import { SettingsForm } from './components/SettingsForm';
import { FeedHistory } from './components/FeedHistory';
import { AppConfig, FeedStatus as FeedStatusType } from './server/types';

export default function App() {
  const [config, setConfig] = useState<AppConfig>({
    feeds: [],
    ntfyTopic: '',
    ntfyServerAddress: 'https://ntfy.sh',
    checkIntervalMinutes: 15,
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

  const handleSettingsSubmit = async (ntfyTopic: string, ntfyServerAddress: string, checkIntervalMinutes: number) => {
    try {
      setLoading(true);
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, ntfyTopic, ntfyServerAddress, checkIntervalMinutes }),
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
      <Title order={1} mb="xl">
        RSS Feed Monitor
      </Title>

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
          <FeedStatus status={status} onCheckNow={handleCheckNow} />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <FeedHistory onRefresh={handleCheckNow} />
        </Tabs.Panel>

        <Tabs.Panel value="settings">
          <SettingsForm
            initialNtfyTopic={config.ntfyTopic}
            initialNtfyServerAddress={config.ntfyServerAddress}
            initialCheckInterval={config.checkIntervalMinutes}
            onSubmit={handleSettingsSubmit}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
