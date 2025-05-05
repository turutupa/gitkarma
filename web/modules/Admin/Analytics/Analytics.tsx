import React, { useState } from 'react';
import { Container, Grid, Title } from '@mantine/core';
import { TUsersGlobalStats } from '@/models/Analytics';
import { useAPI } from '@/src/utils/useAPI';
import ChartTile from './ChartTile';
import RepoActivity from './RepoActivity';
import Summary from './Summary';

type Props = {
  repo: string;
};

const Analytics: React.FC<Props> = ({ repo }) => {
  const { data: usersGlobalStats } = useAPI<TUsersGlobalStats[]>('/usersGlobalStats');
  const [fullWidthTiles, setFullWidthTiles] = useState<string[]>([]);

  const toggleFullWidth = (tile: string) => {
    setFullWidthTiles((prev) =>
      prev.includes(tile) ? prev.filter((t) => t !== tile) : [...prev, tile]
    );
  };

  return (
    <Container size="xxl" p={0}>
      {/* title */}
      <Title mb="lg" order={2}>
        Dashboard
      </Title>

      {/* summary tiles */}
      <Summary repo={repo} />

      {/* graphs */}
      <Grid gutter="md">
        <Grid.Col
          span={fullWidthTiles.includes('pullRequests') ? 12 : { base: 12, md: 6, lg: 4 }}
          style={{ transition: 'all 0.3s linear' }}
        >
          <ChartTile
            title="Total Pull Requests"
            description="Cumulative number of PRs created by each user over time."
            url={`/pullRequests?repo=${repo}`}
            onToggleFullWidth={() => toggleFullWidth('pullRequests')}
            isFullWidth={fullWidthTiles.includes('pullRequests')}
          />
        </Grid.Col>
        <Grid.Col
          span={fullWidthTiles.includes('reviews') ? 12 : { base: 12, md: 6, lg: 4 }}
          style={{ transition: 'all 0.3s linear' }}
        >
          <ChartTile
            title="Total Pull Request Reviews"
            description="Cumulative number of PR reviews created by each user over time."
            url={`/reviews?repo=${repo}`}
            onToggleFullWidth={() => toggleFullWidth('reviews')}
            isFullWidth={fullWidthTiles.includes('reviews')}
          />
        </Grid.Col>
        <Grid.Col
          span={fullWidthTiles.includes('review comments') ? 12 : { base: 12, md: 6, lg: 4 }}
          style={{ transition: 'all 0.3s linear' }}
        >
          <ChartTile
            title="Total Pull Request Reviews Comments"
            description="Cumulative number of PR review comments created by each user over time."
            url={`/comments?repo=${repo}`}
            onToggleFullWidth={() => toggleFullWidth('review comments')}
            isFullWidth={fullWidthTiles.includes('reviews comments')}
          />
        </Grid.Col>
        <Grid.Col
          span={fullWidthTiles.includes('debits') ? 12 : { base: 12, md: 6, lg: 4 }}
          style={{ transition: 'all 0.3s linear' }}
        >
          <ChartTile
            title="Total Karma Points Awarded"
            description="Total number of karma points awarded to each user over time."
            url={`/debits?repo=${repo}`}
            onToggleFullWidth={() => toggleFullWidth('debits')}
            isFullWidth={fullWidthTiles.includes('debits')}
          />
        </Grid.Col>
      </Grid>

      {/* activity log */}
      <RepoActivity repo={repo} usersGlobalStats={usersGlobalStats} />
    </Container>
  );
};

export default Analytics;
