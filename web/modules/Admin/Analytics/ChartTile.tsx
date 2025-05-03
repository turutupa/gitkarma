import React, { useEffect, useMemo, useState } from 'react';
import { IconArrowsMaximize, IconArrowsMinimize, IconCalendar } from '@tabler/icons-react';
import { FaSlidersH } from 'react-icons/fa';
import { LineChart } from '@mantine/charts';
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
  'blue.6',
  'teal.6',
  'green.6',
  'red.6',
  'yellow.6',
  'violet.6',
  'grape.6',
  'cyan.6',
  'lime.6',
  'orange.6',
  'rose.6',
  'brown.6',
  'gray.6',
];

const getColorFromPalette = (index: number): string => {
  return mantineColorPalette[index % mantineColorPalette.length];
};

type Props = {
  url: string;
  title: string;
  description?: string;
  onToggleFullWidth: () => void;
  isFullWidth: boolean;
};

const ChartTile: React.FC<Props> = ({
  url: baseUrl,
  title,
  description,
  onToggleFullWidth,
  isFullWidth,
}) => {
  const { colorScheme } = useMantineColorScheme();
  const { colors } = useMantineTheme();

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

    // Filter series based on selectedFilters
    return res.series
      .filter((serie: any) => selectedFilters.includes(serie.name))
      .map((serie: any, i: number) => ({
        ...serie,
        color: getColorFromPalette(i),
      }));
  }, [res, selectedFilters]);

  const handleFilterToggle = (seriesName: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(seriesName)) {
        return prev.filter((name) => name !== seriesName);
      }
      return [...prev, seriesName];
    });
  };

  const handleApplyDateFilter = () => {
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
  };

  // Check if date range is active (both values are set)
  const isDateRangeActive = useMemo(
    () => dateRange[0] !== null && dateRange[1] !== null,
    [dateRange]
  );

  // Check if filter is active (not all series are selected)
  const isFilterActive = useMemo(() => {
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
      bg={colorScheme === 'dark' ? 'dark.7' : 'gray.1'}
    >
      {/* top right icons */}
      <Box pos="absolute" top={10} right={10}>
        <Group gap="xs">
          {/* filter by key */}
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

          {/* date picker */}
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
                      disabled={
                        !(
                          (dateRange[0] && dateRange[1]) || // New selection
                          isFilteredApi // OR we have active filters to clear
                        )
                      }
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
              onClick={onToggleFullWidth}
            />
          ) : (
            <IconArrowsMaximize
              color="gray"
              size={16}
              style={{ cursor: 'pointer' }}
              onClick={onToggleFullWidth}
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
        <Title mb={0} order={3}>
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
        {res && (
          <Box h="100%" w="100%" style={{ height: '100%', width: '100%' }}>
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
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default ChartTile;
