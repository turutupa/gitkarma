import { Container, createTheme, MantineColorsTuple, rem } from '@mantine/core';

const CONTAINER_SIZES: Record<string, number> = {
  xxs: 470,
  xs: 570,
  sm: 770,
  md: 970,
  lg: 1170,
  xl: 1370,
  xxl: 1570,
};

const primary: MantineColorsTuple = [
  '#e6ffee',
  '#d3f9e0',
  '#a8f2c0',
  '#7aea9f',
  '#54e382',
  '#3bdf70',
  // '#2bdd66',
  '#1bc455',
  '#1bc455',
  '#0bae4a',
  '#00973c',
];

export const theme = createTheme({
  colors: { primary },
  primaryColor: 'primary',
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '200em',
  },
  components: {
    Container: Container.extend({
      vars: (_, { size, fluid }) => ({
        root: {
          '--container-size': fluid
            ? '100%'
            : size !== undefined && size in CONTAINER_SIZES
              ? rem(CONTAINER_SIZES[size])
              : rem(size),
        },
      }),
    }),
  },
});
