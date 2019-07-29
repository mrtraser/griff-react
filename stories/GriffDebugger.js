import React from 'react';
import { Context as Griff } from '../build/src/components/Griff';

const printData = data => {
  if (!data) {
    return data;
  }
  if (data.length === 0) {
    return [];
  }
  return `/* SNIP ${data.length} POINTS */`;
};

const printableSeries = s =>
  Object.keys(s).reduce((acc, key) => {
    const val = s[key];
    if (typeof val === 'function') {
      const { name = 'FUNCTION' } = val;
      return {
        ...acc,
        [key]: `/* ${name}(< ${val.length} args >) */`,
      };
    }
    if (key === 'data') {
      return {
        ...acc,
        data: printData(val),
      };
    }
    return {
      ...acc,
      [key]: val,
    };
  }, {});

export default () => (
  <Griff.Consumer>
    {({
      collections = [],
      collectionsById = {},
      series = [],
      seriesById = {},
    }) => (
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>
          <h3 style={{ fontFamily: 'monospace' }}>collectionsById</h3>
          <pre>
            {JSON.stringify(
              Object.keys(collectionsById).reduce(
                (acc, id) => ({
                  ...acc,
                  [id]: collectionsById[id],
                }),
                {}
              ),
              null,
              2
            )}
          </pre>
        </div>
        <div>
          <h3 style={{ fontFamily: 'monospace' }}>collections</h3>
          <pre>{JSON.stringify(collections, null, 2)}</pre>
        </div>
        <div>
          <h3 style={{ fontFamily: 'monospace' }}>seriesById</h3>
          <pre>
            {JSON.stringify(
              Object.keys(seriesById).reduce(
                (acc, id) => ({
                  ...acc,
                  [id]: printableSeries(seriesById[id]),
                }),
                {}
              ),
              null,
              2
            )}
          </pre>
        </div>
        <div>
          <h3 style={{ fontFamily: 'monospace' }}>series</h3>
          <pre>{JSON.stringify(series.map(printableSeries), null, 2)}</pre>
        </div>
      </div>
    )}
  </Griff.Consumer>
);
