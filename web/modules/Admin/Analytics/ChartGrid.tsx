import { useState } from 'react';
import { Grid } from '@mantine/core';
import ChartTile from './ChartTile';

type ChartConfig = {
  tileKey: string;
  title: string;
  description: string;
  url: string;
  chart: 'line' | 'bar';
  dataKey?: string;
  span?: { base?: number; md?: number; lg?: number };
  fullWidthSpan?: { base?: number; md?: number; lg?: number };
};

const chartConfigs: ChartConfig[] = [
  {
    tileKey: 'pullRequests',
    title: 'Total # Pull Requests',
    description: 'Cumulative number of PRs created by each user over time.',
    url: '/pullRequests',
    chart: 'line',
  },
  {
    tileKey: 'reviews',
    title: 'Total # Pull Request Reviews',
    description: 'Cumulative number of PR reviews created by each user over time.',
    url: '/reviews',
    chart: 'line',
  },
  {
    tileKey: 'review comments',
    title: 'Total # Pull Request Reviews Comments',
    description: 'Cumulative number of PR review comments created by each user over time.',
    url: '/comments',
    chart: 'line',
  },
  {
    tileKey: 'debits',
    title: 'Total # Karma Points Awarded',
    description: 'Total number of karma points awarded to each user over time.',
    url: '/debits',
    chart: 'line',
  },
  {
    tileKey: 'weeklyPullRequests',
    title: 'Weekly Pull Requests',
    description: 'Total number of Pull Requests created per week',
    url: '/weekly',
    chart: 'bar',
    dataKey: 'week',
    span: { base: 12, lg: 8 },
    fullWidthSpan: { base: 12, lg: 12 },
  },
];

type ChartGridItem = {
  title: string;
  description: string;
  url: string;
  tileKey: string;
  repo: string;
  chart: 'line' | 'bar';
  dataKey?: string;
  isFullWidth: boolean;
  onToggleFullWidth: (key: string) => void;
};

const ChartGridItem: React.FC<ChartGridItem> = ({
  title,
  description,
  url,
  tileKey,
  repo,
  chart,
  dataKey,
  isFullWidth,
  onToggleFullWidth,
}) => (
  <ChartTile
    title={title}
    description={description}
    url={`${url}?repo=${repo}`}
    chart={chart}
    dataKey={dataKey}
    isFullWidth={isFullWidth}
    onToggleFullWidth={() => onToggleFullWidth(tileKey)}
  />
);

type Props = {
  repo: string;
};

const ChartGrid: React.FC<Props> = ({ repo }) => {
  const [fullWidthTiles, setFullWidthTiles] = useState<string[]>([]);

  const toggleFullWidth = (tile: string) => {
    setFullWidthTiles((prev) =>
      prev.includes(tile) ? prev.filter((t) => t !== tile) : [...prev, tile]
    );
  };

  return (
    <Grid gutter="md">
      {chartConfigs.map(
        ({ tileKey, title, description, url, chart, dataKey, span, fullWidthSpan }) => (
          <Grid.Col
            key={tileKey}
            span={
              fullWidthTiles.includes(tileKey)
                ? fullWidthSpan || { base: 12, md: 12, lg: 8 }
                : span || { base: 12, md: 6, lg: 4 }
            }
          >
            <ChartGridItem
              tileKey={tileKey}
              title={title}
              description={description}
              url={url}
              repo={repo}
              chart={chart}
              dataKey={dataKey}
              onToggleFullWidth={toggleFullWidth}
              isFullWidth={fullWidthTiles.includes(tileKey)}
            />
          </Grid.Col>
        )
      )}
    </Grid>
  );
};

export default ChartGrid;
