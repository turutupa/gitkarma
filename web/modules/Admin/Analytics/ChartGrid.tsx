import { useState } from 'react';
import { Grid } from '@mantine/core';
import ChartTile from './ChartTile';

type ChartConfig = {
  tileKey: string;
  title: string;
  description: string;
  url: string;
};

const chartConfigs: ChartConfig[] = [
  {
    tileKey: 'pullRequests',
    title: 'Total Pull Requests',
    description: 'Cumulative number of PRs created by each user over time.',
    url: '/pullRequests',
  },
  {
    tileKey: 'reviews',
    title: 'Total Pull Request Reviews',
    description: 'Cumulative number of PR reviews created by each user over time.',
    url: '/reviews',
  },
  {
    tileKey: 'review comments',
    title: 'Total Pull Request Reviews Comments',
    description: 'Cumulative number of PR review comments created by each user over time.',
    url: '/comments',
  },
  {
    tileKey: 'debits',
    title: 'Total Karma Points Awarded',
    description: 'Total number of karma points awarded to each user over time.',
    url: '/debits',
  },
];

type ChartGridItem = {
  title: string;
  description: string;
  url: string;
  tileKey: string;
  repo: string;
  onToggleFullWidth: (key: string) => void;
  isFullWidth: boolean;
};

const ChartGridItem: React.FC<ChartGridItem> = ({
  title,
  description,
  url,
  tileKey,
  repo,
  onToggleFullWidth,
  isFullWidth,
}) => (
  <ChartTile
    title={title}
    description={description}
    url={`${url}?repo=${repo}`}
    onToggleFullWidth={() => onToggleFullWidth(tileKey)}
    isFullWidth={isFullWidth}
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
      {chartConfigs.map(({ tileKey, title, description, url }) => (
        <Grid.Col
          key={tileKey}
          span={
            fullWidthTiles.includes(tileKey)
              ? { base: 12, md: 12, lg: 8 }
              : { base: 12, md: 6, lg: 4 }
          }
        >
          <ChartGridItem
            tileKey={tileKey}
            title={title}
            description={description}
            url={url}
            repo={repo}
            onToggleFullWidth={toggleFullWidth}
            isFullWidth={fullWidthTiles.includes(tileKey)}
          />
        </Grid.Col>
      ))}
    </Grid>
  );
};

export default ChartGrid;
