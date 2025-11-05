import "@mantine/core/styles.css";
import {
  MantineProvider,
  Container,
  Title,
  TextInput,
  Button,
  Paper,
  Text,
  Loader,
  Stack,
  Group,
  Card,
  Badge,
  Divider,
  ActionIcon,
  CopyButton,
  Tooltip,
  rem,
} from "@mantine/core";
import { IconCheck, IconCopy, IconSearch } from "@tabler/icons-react";
import { notifications, Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { useState } from "react";
import { theme } from "./theme";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fake scrape function — replace with real fetching/scraping later
  async function handleScrape() {
    setError(null);
    if (!url.trim()) {
      setError("Please enter a URL");
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Please enter a URL',
        icon: <IconSearch size={16} />,
      });
      return;
    }

    setLoading(true);
    setResults(null);
    notifications.show({
      loading: true,
      title: 'Scraping',
      message: 'Fetching data from the URL...',
      autoClose: false,
      withBorder: true,
    });

    try {
      // call local scraper API which runs server-side (avoids CORS)
      const resp = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'scrape failed');

      const r: string[] = [];
      r.push(`Fetched: ${data.url}`);
      if (data.title) r.push(`Title: ${data.title}`);
      if (Array.isArray(data.headings) && data.headings.length) {
        r.push(`Headings: ${data.headings.slice(0,5).join(' | ')}`);
      }
      r.push(`Links found: ${data.linksCount ?? 0}`);
      r.push(`Images found: ${data.imagesCount ?? 0}`);
      if (Array.isArray(data.scheduleItems) && data.scheduleItems.length) {
        r.push('Schedule (sample):');
        data.scheduleItems.slice(0,5).forEach((s: string) => r.push(s));
      }

      setResults(r);
      notifications.clean();
      notifications.show({
        color: 'teal',
        title: 'Success',
        message: 'Data successfully scraped!',
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message ?? String(err);
      setError(errorMessage);
      notifications.clean();
      notifications.show({
        color: 'red',
        title: 'Error',
        message: errorMessage,
        icon: <IconSearch size={16} />,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Paper radius="md" p="md" withBorder>
            <Group justify="space-between" align="center">
              <Title order={2}>Web Scraper For Sites That Allow Scraping</Title>
              <Badge variant="light" size="lg">
                {todayStr}
              </Badge>
            </Group>
          </Paper>

          <Paper radius="md" p="md" withBorder>
            <Stack gap="sm">
              <Title order={4}>Scrape a URL</Title>

              <Group gap="sm">
                <TextInput
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.currentTarget.value)}
                  aria-label="url-input"
                  style={{ flex: 1 }}
                  leftSection={<IconSearch size={16} />}
                />
                <Button 
                  onClick={handleScrape} 
                  disabled={loading}
                  variant="filled"
                  radius="md"
                >
                  {loading ? <Loader size="xs" color="white" /> : "Scrape"}
                </Button>
              </Group>

              {error && (
                <Text c="red" size="sm">
                  {error}
                </Text>
              )}
            </Stack>
          </Paper>

          <Paper radius="md" p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={5}>Results</Title>
                {results && (
                  <CopyButton value={results.join('\n')}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy all'}>
                        <ActionIcon 
                          color={copied ? 'teal' : 'gray'} 
                          variant="subtle" 
                          onClick={copy}
                        >
                          {copied ? (
                            <IconCheck style={{ width: rem(16) }} />
                          ) : (
                            <IconCopy style={{ width: rem(16) }} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                )}
              </Group>

              {!results && !loading && (
                <Text c="dimmed">No results yet. Enter a URL and click Scrape.</Text>
              )}

              {loading && (
                <Group gap="sm">
                  <Loader size="sm" />
                  <Text>Scraping…</Text>
                </Group>
              )}

              {results && (
                <Stack gap="xs">
                  {results.map((r, i) => (
                    <Card key={i} withBorder padding="xs">
                      <Text size="sm">{r}</Text>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </MantineProvider>
  );
}
