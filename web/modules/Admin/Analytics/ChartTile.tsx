import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconArrowsMaximize, IconArrowsMinimize, IconCalendar } from '@tabler/icons-react';
import { FaSlidersH } from 'react-icons/fa';
import { BarChart, LineChart } from '@mantine/charts';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Group,
  LoadingOverlay,
  Paper,
  Popover,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { TAnalytics } from '@/models/Analytics';
import { useAPI } from '@/src/utils/useAPI';

const mantineColorPalette = [
  'indigo.6',
  'pink.6',
  'green.6',
  'yellow.6',
  'grape.7',
  'violet.6',
  'grape.6',
  'teal.6',
  'red.6',
  'cyan.6',
  'lime.6',
  'blue.6',
  'orange.6',
  'gray.6',
  'brown.6',
];

const getColorFromPalette = (index: number): string => {
  return mantineColorPalette[index % mantineColorPalette.length];
};

type Props = {
  url: string;
  title: string;
  dataKey?: string; // used for bar charts
  chart: 'line' | 'bar';
  description?: string;
  isFullWidth: boolean;
  onToggleFullWidth: () => void;
};

const ChartTile: React.FC<Props> = ({
  url: baseUrl,
  title,
  description,
  chart,
  dataKey,
  isFullWidth,
  onToggleFullWidth,
}) => {
  const { colorScheme } = useMantineColorScheme();
  const { colors } = useMantineTheme();

  const [counter, setCounter] = useState(0);
  const [apiUrl, setApiUrl] = useState(baseUrl);

  // Add flag to track if filters are applied to the API
  const [isFilteredApi, setIsFilteredApi] = useState(false);

  // filtering
  const [filterOpened, setFilterOpened] = useState(false);
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const [overlayVisible, { open: openOverlay, close: closeOverlay }] = useDisclosure(false);

  const { data: res, isLoading, error } = useAPI<TAnalytics>(apiUrl);

  // set loading overlay
  useEffect(() => {
    if (isLoading) {
      openOverlay();
    } else {
      closeOverlay();
    }
  }, [overlayVisible, openOverlay, isLoading]);

  // Initialize selected filters with all series keys when data is loaded
  useEffect(() => {
    if (res?.series && res.series.length > 0) {
      setSelectedFilters(res.series.map((s: any) => s.name));
    }
  }, [res?.series]);

  const series = useMemo(() => {
    if (!res?.series) {
      return [];
    }

    // Map series with consistent colors based on their original index
    return res.series
      .filter((serie: { name: string }) => selectedFilters.includes(serie.name))
      .map((serie: { name: string }) => ({
        ...serie,
        color: getColorFromPalette(res.series.findIndex((s: any) => s.name === serie.name)),
      }));
  }, [res, selectedFilters]);

  const handleFilterToggle = useCallback(
    (seriesName: string) => {
      setSelectedFilters((prev) => {
        if (prev.includes(seriesName)) {
          return prev.filter((name) => name !== seriesName);
        }
        return [...prev, seriesName];
      });
    },
    [setSelectedFilters]
  );

  const handleMaximizeTile = useCallback(() => {
    onToggleFullWidth();
    setCounter((prev) => prev + 1);
  }, [onToggleFullWidth]);

  const handleApplyDateFilter = useCallback(() => {
    // If we have a date range, apply it as a filter
    if (dateRange[0] && dateRange[1]) {
      // Format dates as ISO strings (YYYY-MM-DD)
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];

      // Create new URL with date parameters
      const separator = baseUrl.includes('?') ? '&' : '?';
      const newUrl = `${baseUrl}${separator}startDate=${startDate}&endDate=${endDate}`;

      setApiUrl(newUrl);
      setIsFilteredApi(true);
    }
    // If no date range but we have an active filter, reset to base URL
    else if (isFilteredApi) {
      setApiUrl(baseUrl);
      setIsFilteredApi(false);
    }

    setDatePickerOpened(false);
  }, [dateRange, setApiUrl, setIsFilteredApi, setDatePickerOpened]);

  // Check if date range is active (both values are set)
  const isDateRangeActive = useMemo(
    () => dateRange[0] !== null && dateRange[1] !== null,
    [dateRange]
  );

  // Check if filter is active (not all series are selected)
  const isFilterActive = useMemo(() => {
    if (res?.data.length === 0) {
      return false;
    }
    if (!res?.series) {
      return false;
    }
    return selectedFilters.length !== res.series.length;
  }, [selectedFilters, res?.series]);

  return (
    <Paper
      pos="relative"
      p="md"
      h={400}
      shadow="sm"
      withBorder
      key={`${title}-${counter}`}
      bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
    >
      {/* top right icons - filter, date picker, maximize */}
      <Box pos="absolute" top={10} right={10}>
        <Group gap="xs">
          {/* slider - filter by key */}
          {res?.data?.length > 0 && (
            <Popover opened={filterOpened} onChange={setFilterOpened} position="bottom-end">
              <Popover.Target>
                <FaSlidersH
                  size={22}
                  color={isFilterActive ? colors.dark[4] : 'gray'}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isFilterActive ? colors.primary[4] : 'transparent',
                    borderRadius: '100%',
                    padding: '5px',
                  }}
                  onClick={() => setFilterOpened((o) => !o)}
                />
              </Popover.Target>
              <Popover.Dropdown>
                <Stack gap="xs">
                  {res?.series?.map((serie: any, index: number) => (
                    <Checkbox
                      key={index}
                      label={serie.name}
                      checked={selectedFilters.includes(serie.name)}
                      onChange={() => handleFilterToggle(serie.name)}
                      styles={{ label: { color: getColorFromPalette(index) } }}
                    />
                  ))}
                </Stack>
              </Popover.Dropdown>
            </Popover>
          )}

          {/* calendar - date picker */}
          <Popover opened={datePickerOpened} onChange={setDatePickerOpened} position="bottom-end">
            <Popover.Target>
              <IconCalendar
                size={22}
                color={isDateRangeActive ? colors.dark[4] : 'gray'}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isDateRangeActive ? colors.primary[4] : 'transparent',
                  borderRadius: '100%',
                  padding: '3px',
                }}
                onClick={() => setDatePickerOpened((o) => !o)}
              />
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                <DatePicker
                  key={datePickerKey}
                  // @ts-ignore
                  allowDeselect
                  size="sm"
                  type="range"
                  value={dateRange}
                  onChange={setDateRange}
                  defaultDate={viewDate}
                />
                <Group justify="space-between">
                  <Button
                    variant="transparent"
                    size="xs"
                    onClick={() => {
                      // Update only the view date, not the selection
                      setViewDate(new Date());
                      setDatePickerKey((prev) => prev + 1);
                    }}
                  >
                    Today
                  </Button>
                  <Group gap="xs">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => {
                        setDateRange([null, null]);
                        setViewDate(new Date());
                        setDatePickerKey((prev) => prev + 1);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="light"
                      size="xs"
                      onClick={handleApplyDateFilter}
                      // Enable Apply button if we have a date range OR if filters are applied
                      disabled={!((dateRange[0] && dateRange[1]) || isFilteredApi)}
                    >
                      Apply
                    </Button>
                  </Group>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>

          {/* maximize  */}
          {isFullWidth ? (
            <IconArrowsMinimize
              size={16}
              color="gray"
              style={{ cursor: 'pointer' }}
              onClick={handleMaximizeTile}
            />
          ) : (
            <IconArrowsMaximize
              color="gray"
              size={16}
              style={{ cursor: 'pointer' }}
              onClick={handleMaximizeTile}
            />
          )}
        </Group>
      </Box>

      {/* loading overlay */}
      {isLoading && (
        <LoadingOverlay
          visible={overlayVisible}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
      )}

      {/* title & description */}
      <Stack gap={2} h="100%">
        <Title mb={0} order={3} maw="calc(100% - 100px)">
          {title}
        </Title>
        <Text c="dimmed" size="sm" mb="sm">
          {description}
        </Text>

        {/* show error */}
        {error && (
          <Flex direction="column" justify="center" align="center" fw={600}>
            Something went wrong
          </Flex>
        )}

        {/* show graph */}
        {res &&
          (chart === 'line' ? (
            <LineChart
              data={res.data}
              dataKey="date"
              series={series}
              curveType="linear"
              tickLine="none"
              withLegend
              yAxisProps={{ width: 40 }}
              legendProps={{ verticalAlign: 'bottom' }}
              style={{ height: '100%' }}
            />
          ) : (
            <BarChart
              data={res.data}
              series={series}
              dataKey={dataKey || ''}
              tickLine="none"
              yAxisProps={{ width: 40 }}
              legendProps={{ verticalAlign: 'bottom' }}
              style={{ height: '100%' }}
              barProps={{ radius: [4, 4, 0, 0] }}
            />
          ))}
      </Stack>
    </Paper>
  );
};

export default ChartTile;
