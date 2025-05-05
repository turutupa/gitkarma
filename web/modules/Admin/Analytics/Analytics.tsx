import React from 'react';
import { Container, Title } from '@mantine/core';
import { TUsersGlobalStats } from '@/models/Analytics';
import { useAPI } from '@/src/utils/useAPI';
import ChartGrid from './ChartGrid';
import RepoActivity from './RepoActivity';
import Summary from './Summary';

type Props = {
  repo: string;
};

const Analytics: React.FC<Props> = ({ repo }) => {
  const { data: usersGlobalStats } = useAPI<TUsersGlobalStats[]>('/usersGlobalStats');

  return (
    <Container size="xxl" p={0}>
      {/* title */}
      <Title mb="lg" order={2}>
        Dashboard
      </Title>

      {/* summary tiles */}
      <Summary repo={repo} />

      {/* grid graphs */}
      <ChartGrid repo={repo} />

      {/* activity log */}
      <RepoActivity repo={repo} usersGlobalStats={usersGlobalStats} />
    </Container>
  );
};

export default Analytics;
