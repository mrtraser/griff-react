import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { DataProvider, ChartContainer, LineChart, ContextChart } from '../src';
import moment from 'moment';
import axios from 'axios';
import * as d3 from 'd3';

const randomData = () => {
  const data = [];
  for (let i = 500; i > 0; i--) {
    const timestamp = Date.now() - i * 1000;
    const value = Math.random();
    data.push({
      timestamp,
      value
    });
  }
  return data;
};

const baseConfig = {
  yAxis: {
    mode: 'every',
    accessor: d => d.value,
    width: 50,
    calculateDomain: data => d3.extent(data, d => d.value)
  },
  xAxis: {
    accessor: d => d.timestamp,
    calculateDomain: data => d3.extent(d => d.timestamp)
  },
  baseDomain: d3.extent(randomData(), d => d.timestamp)
};

storiesOf('DataProvider', module)
  .add(
    'with static data',
    withInfo()(() => {
      const loader = () => {
        const series = {
          1: { color: 'red', data: randomData(), id: 1 },
          2: { color: 'blue', data: randomData().map(i => i * 2), id: 2 },
          3: { color: 'green', data: randomData().map(i => i * 3) }
        };
        return () => series;
      };
      return (
        <DataProvider
          config={baseConfig}
          margin={{ top: 50, bottom: 10, left: 10, right: 10 }}
          height={500}
          width={800}
          loader={loader()}
        >
          <ChartContainer>
            <LineChart heightPct={1} />
          </ChartContainer>
        </DataProvider>
      );
    })
  )
  .add(
    'with static data and timeline',
    withInfo()(() => {
      const loader = () => {
        const series = {
          1: { color: 'red', data: randomData(), id: 1 },
          2: { color: 'blue', data: randomData(), id: 2 }
        };
        return () => series;
      };
      return (
        <DataProvider
          config={baseConfig}
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
          height={500}
          width={800}
          loader={loader()}
        >
          <ChartContainer>
            <LineChart heightPct={0.8} />
            <ContextChart heightPct={0.1} margin={{ top: 0.1 }} />
          </ChartContainer>
        </DataProvider>
      );
    })
  )
  .add(
    'Dynamic data, aggregating oil prices last 10 years.',
    withInfo()(() => {
      const loader = () => {
        const formatDate = date => moment(date).format('YYYY-MM-DD');

        const calculateGranularity = (domain, pps) => {
          const diff = domain[1] - domain[0];

          if (diff / (1000 * 60 * 60 * 24) < pps) {
            // Can we show daily
            return 'daily';
          } else if (diff / (1000 * 60 * 60 * 24 * 7) < pps) {
            // Can we show weekly
            return 'weekly';
          } else if (diff / (1000 * 60 * 60 * 24 * 30) < pps) {
            // Can we show monthly
            return 'monthly';
          } else if (diff / (1000 * 60 * 60 * 24 * 30 * 3) < pps) {
            return 'quarterly';
          }
          return 'annualy';
        };
        let previousGranularity = null;
        let prevDomain = [-Infinity, Infinity];
        return async (domain, subDomain, config, oldSeries, reason) => {
          const granularity = calculateGranularity(
            subDomain,
            config.pointsPerSerie
          );
          if (
            granularity === previousGranularity &&
            subDomain[0] > prevDomain[0] &&
            subDomain[1] < prevDomain[1] &&
            reason === 'UPDATE_SUBDOMAIN'
          ) {
            action(`Skipped updating subdomain, same granularity.`)();
            return oldSeries;
          }
          action(`Loader requested data. Reason: ${reason}`)(
            reason,
            domain,
            subDomain,
            granularity
          );
          if (reason === 'NEW_LOADER') {
            return oldSeries;
          }
          previousGranularity = granularity;
          prevDomain = domain;
          const result = await axios.get(
            `https://www.quandl.com/api/v3/datasets/OPEC/ORB.json?start_date=${formatDate(
              subDomain[0]
            )}&end_date=${formatDate(subDomain[1])}&order=asc&collapse=${
              granularity
            }&api_key=Yztsvxixwuz_NQz-8Ze3`
          );
          const { dataset } = result.data;
          let data = dataset.data.map(d => ({
            timestamp: +moment(d[0]),
            value: d[1]
          }));
          if (reason === 'UPDATE_SUBDOMAIN') {
            const oldSerie = oldSeries[1];
            if (oldSerie && data.length > 0) {
              const xAccessor = oldSerie.xAccessor || config.xAxis.accessor;
              const oldData = oldSerie.data;
              const firstPoint = xAccessor(data[0]);
              const lastPoint = xAccessor(data[data.length - 1]);
              let insertionStart = 0;
              let insertionEnd = data.length - 1;

              for (let idx = 1; idx < oldData.length; idx += 1) {
                if (xAccessor(oldData[idx]) > firstPoint) {
                  insertionStart = idx - 1;
                  break;
                }
              }
              for (let idx = oldData.length - 2; idx > 0; idx -= 1) {
                if (xAccessor(oldData[idx]) <= lastPoint) {
                  insertionEnd = idx + 1;
                  break;
                }
              }
              data = [
                ...oldData.slice(0, insertionStart),
                ...data,
                ...oldData.slice(insertionEnd)
              ];
            }
          }
          return {
            1: {
              id: 1,
              data,
              color: 'blue'
            }
          };
        };
      };
      return (
        <DataProvider
          config={{
            ...baseConfig,
            pointsPerSerie: 1000,
            baseDomain: [+moment().subtract(10, 'year'), +moment()]
          }}
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
          height={500}
          width={800}
          loader={loader()}
        >
          <ChartContainer>
            <LineChart heightPct={0.8} />
            <ContextChart heightPct={0.1} margin={{ top: 0.1 }} />
          </ChartContainer>
        </DataProvider>
      );
    })
  );