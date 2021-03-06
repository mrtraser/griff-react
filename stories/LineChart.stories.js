/* eslint-disable max-classes-per-file */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-this-in-sfc */
import React from 'react';
import moment from 'moment';
import Select from 'react-select';
import isEqual from 'lodash.isequal';
import { action } from '@storybook/addon-actions';
import { DataProvider, LineChart, Brush, Series, Collection } from '../src';
import quandlLoader from './quandlLoader';

import {
  staticLoader,
  monoLoader,
  customAccessorLoader,
  liveLoader,
} from './loaders';

const staticXDomain = [Date.now() - 1000 * 60 * 60 * 24 * 30, Date.now()];
const liveXDomain = [Date.now() - 1000 * 30, Date.now()];
const CHART_HEIGHT = 500;

export default {
  title: 'Demo|LineChart',

  decorators: [
    story => (
      <div style={{ marginLeft: 'auto', marginRight: 'auto', width: '80%' }}>
        {story()}
      </div>
    ),
  ],
};

export const empty = () => (
  <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

export const dynamicSeries = () => {
  const randomColor = () =>
    `rgb(${Math.round(Math.random() * 255)},${Math.round(
      Math.random() * 255
    )},${Math.round(Math.random() * 255)},1)`;

  class DynamicSeries extends React.Component {
    state = {
      series: [],
    };

    addSeries = () =>
      this.setState(({ series }) => ({
        series: [...series, { id: series.length + 1, color: randomColor() }],
      }));

    clearSeries = () => this.setState({ series: [] });

    render() {
      const { series } = this.state;
      return (
        <div>
          <button type="button" onClick={this.addSeries}>
            Add series
          </button>
          <button type="button" onClick={this.clearSeries}>
            Remove all series
          </button>
          <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
            {series.map(s => (
              <Series key={`series-${s.id}`} {...s} />
            ))}
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
        </div>
      );
    }
  }
  return <DynamicSeries />;
};

dynamicSeries.story = {
  name: 'Dynamic series',
};

export const basic = () => (
  <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

export const basicWithYDomains = () => (
  <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
    <Series id="1" color="steelblue" ySubDomain={[0, 5]} />
    <Series id="2" color="maroon" ySubDomain={[-1, 1]} />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

basicWithYDomains.story = {
  name: 'Basic with yDomains',
};

export const customTickFormatting = () => (
  <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart
      height={CHART_HEIGHT}
      xAxisFormatter={n => n / 1000}
      yAxisFormatter={n => n * 1000}
    />
  </DataProvider>
);

customTickFormatting.story = {
  name: 'Custom tick formatting',
};

export const customOfYAxisTicks = () => (
  <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} yAxisTicks={15} />
  </DataProvider>
);

customOfYAxisTicks.story = {
  name: 'Custom # of y-axis ticks',
};

export const multiple = () => (
  <>
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <Series id="3" color="orange" />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <Series id="3" color="orange" hidden />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
  </>
);

export const singleValueInYAxis = () => (
  <>
    <DataProvider timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" loader={monoLoader(0)} />
      <Series id="2" color="maroon" loader={monoLoader(0.5)} />
      <Series id="3" color="orange" loader={monoLoader(-0.5)} />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
  </>
);

singleValueInYAxis.story = {
  name: 'Single-value in y axis',
};

export const sized = () => (
  <div>
    <p>All of the components should be entirely contained in the red box</p>
    <div
      style={{
        width: `${CHART_HEIGHT}px`,
        height: `${CHART_HEIGHT}px`,
        border: '2px solid red',
        margin: '1em',
      }}
    >
      <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
        <Series id="1" color="steelblue" />
        <Series id="2" color="maroon" />
        <LineChart />
      </DataProvider>
    </div>
    <div
      style={{
        width: `${CHART_HEIGHT}px`,
        height: `${CHART_HEIGHT}px`,
        border: '2px solid red',
        margin: '1em',
      }}
    >
      <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
        <Series id="1" color="steelblue" />
        <Series id="2" color="maroon" />
        <LineChart contextChart={{ visible: false }} />
      </DataProvider>
    </div>
    <div
      style={{
        width: `${CHART_HEIGHT}px`,
        height: `${CHART_HEIGHT}px`,
        border: '2px solid red',
        margin: '1em',
      }}
    >
      <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
        <Series id="1" color="steelblue" />
        <Series id="2" color="maroon" />
        <LineChart
          contextChart={{
            visible: true,
            height: 250,
          }}
        />
      </DataProvider>
    </div>
    <div
      style={{
        width: `${CHART_HEIGHT}px`,
        height: `${CHART_HEIGHT}px`,
        border: '2px solid red',
        margin: '1em',
      }}
    >
      <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
        <Series id="1" color="steelblue" />
        <Series id="2" color="maroon" />
        <LineChart xAxisHeight={25} />
      </DataProvider>
    </div>
  </div>
);

export const fullSize = () => (
  <div style={{ height: '100vh' }}>
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <LineChart />
    </DataProvider>
  </div>
);

fullSize.story = {
  name: 'Full-size',
};

export const resizing = () => {
  class ResizingChart extends React.Component {
    state = { width: CHART_HEIGHT, height: CHART_HEIGHT };

    toggleHide = key => {
      const { hiddenSeries } = this.state;
      this.setState({
        hiddenSeries: {
          ...hiddenSeries,
          [key]: !hiddenSeries[key],
        },
      });
    };

    render() {
      const { width, height } = this.state;
      const nextWidth =
        width === CHART_HEIGHT ? CHART_HEIGHT * 2 : CHART_HEIGHT;
      const nextHeight =
        height === CHART_HEIGHT ? CHART_HEIGHT * 2 : CHART_HEIGHT;
      return (
        <>
          <p>
            All of the components should be entirely contained in the red box
          </p>
          <button
            type="button"
            onClick={() => this.setState({ width: nextWidth })}
          >
            change to {nextWidth} pixels wide
          </button>
          <button
            type="button"
            onClick={() => this.setState({ height: nextHeight })}
          >
            change to {nextHeight} pixels high
          </button>
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              border: '2px solid red',
            }}
          >
            <DataProvider
              defaultLoader={staticLoader}
              timeDomain={staticXDomain}
            >
              <Series id="1" color="steelblue" />
              <Series id="2" color="maroon" />
              <LineChart />
            </DataProvider>
          </div>
        </>
      );
    }
  }
  return <ResizingChart />;
};

export const customDefaultAccessors = () => (
  <DataProvider
    defaultLoader={customAccessorLoader}
    timeDomain={staticXDomain}
    timeAccessor={d => d[0]}
    yAccessor={d => d[1]}
  >
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

customDefaultAccessors.story = {
  name: 'Custom default accessors',
};

export const minMax = () => {
  const y0Accessor = d => d.value - 0.5;
  const y1Accessor = d => d.value + 0.5;
  return (
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series
        id="1"
        color="steelblue"
        y0Accessor={y0Accessor}
        y1Accessor={y1Accessor}
      />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
  );
};

minMax.story = {
  name: 'min/max',
};

export const minMaxStepSeries = () => {
  const y0Accessor = d => d.value - 0.5;
  const y1Accessor = d => d.value + 0.5;
  return (
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series
        id="1"
        color="steelblue"
        y0Accessor={y0Accessor}
        y1Accessor={y1Accessor}
        step
      />
      <Series id="2" color="maroon" step />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
  );
};

minMaxStepSeries.story = {
  name: 'min/max (step series)',
};

export const minMaxWithRawPoints = () => {
  const y0Accessor = d => d.value - 0.5;
  const y1Accessor = d => d.value + 0.5;
  return (
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series
        id="1"
        color="steelblue"
        y0Accessor={y0Accessor}
        y1Accessor={y1Accessor}
      />
      <Series id="2" color="maroon" drawPoints />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
  );
};

minMaxWithRawPoints.story = {
  name: 'min/max with raw points',
};

export const loadingDataFromApi = () => (
  <DataProvider
    defaultLoader={quandlLoader}
    timeDomain={[+moment().subtract(10, 'year'), +moment()]}
    pointsPerSeries={100}
  >
    <Series id="COM/COFFEE_BRZL" color="steelblue" />
    <Series id="COM/COFFEE_CLMB" color="red" />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

loadingDataFromApi.story = {
  name: 'Loading data from api',
};

export const hideSeries = () => {
  class HiddenSeries extends React.Component {
    state = { hiddenSeries: {} };

    toggleHide = key => {
      const { hiddenSeries } = this.state;
      this.setState({
        hiddenSeries: {
          ...hiddenSeries,
          [key]: !hiddenSeries[key],
        },
      });
    };

    render() {
      const { hiddenSeries } = this.state;
      return (
        <>
          <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
            <Series id="1" color="steelblue" hidden={hiddenSeries[1]} />
            <Series id="2" color="maroon" hidden={hiddenSeries[2]} />
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
          <button type="button" onClick={() => this.toggleHide(1)}>
            Hide series 1
          </button>
          <button type="button" onClick={() => this.toggleHide(2)}>
            Hide series 2
          </button>
        </>
      );
    }
  }
  return <HiddenSeries />;
};

hideSeries.story = {
  name: 'Hide series',
};

export const specifyYDomain = () => {
  const staticDomain = [-5, 5];
  const staticSubDomain = [-2, 2];

  class SpecifyDomain extends React.Component {
    state = { yDomains: {}, ySubDomains: {} };

    setStaticDomain = key => {
      const { yDomains } = this.state;
      if (yDomains[key]) {
        const newYDomains = { ...yDomains };
        delete newYDomains[key];
        this.setState({ yDomains: newYDomains });
        action(`Removing static domain`)(key);
        return;
      }
      action(`Setting domain to DataProvider`)(key);
      this.setState({ yDomains: { ...yDomains, [key]: staticDomain } });
    };

    setStaticSubDomain = key => {
      const { ySubDomains } = this.state;
      if (ySubDomains[key]) {
        const newYSubDomains = { ...ySubDomains };
        delete newYSubDomains[key];
        this.setState({ ySubDomains: newYSubDomains });
        action(`Removing static domain`)(key);
        return;
      }
      action(`Setting subdomain to DataProvider`)(key);
      this.setState({
        ySubDomains: { ...ySubDomains, [key]: staticSubDomain },
      });
    };

    render() {
      const { yDomains, ySubDomains } = this.state;

      const isEnabled = domain => (domain ? '(enabled)' : '(disabled)');

      return (
        <>
          <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
            <Series
              id="1"
              color="steelblue"
              yDomain={yDomains[1]}
              ySubDomain={ySubDomains[1]}
            />
            <Series
              id="2"
              color="maroon"
              yDomain={yDomains[2]}
              ySubDomain={ySubDomains[2]}
            />
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
          <button type="button" onClick={() => this.setStaticDomain(1)}>
            Set blue domain {isEnabled(yDomains[1])}
          </button>
          <button type="button" onClick={() => this.setStaticSubDomain(1)}>
            Set blue subdomain {isEnabled(ySubDomains[1])}
          </button>
          <button type="button" onClick={() => this.setStaticDomain(2)}>
            Set maroon domain {isEnabled(yDomains[2])}
          </button>
          <button type="button" onClick={() => this.setStaticSubDomain(2)}>
            Set maroon subdomain {isEnabled(ySubDomains[2])}
          </button>
        </>
      );
    }
  }
  return <SpecifyDomain />;
};

specifyYDomain.story = {
  name: 'Specify y domain',
};

export const annotationsStory = () => {
  const series = staticLoader({
    id: 1,
    reason: 'MOUNTED',
    timeDomain: staticXDomain,
  }).data;
  const exampleAnnotations = [
    {
      id: 1,
      data: [series[40].timestamp, series[60].timestamp],
      color: 'black',
    },
  ];
  return (
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} annotations={exampleAnnotations} />
    </DataProvider>
  );
};

annotationsStory.story = {
  name: 'Annotations',
};

export const clickEvents = () => {
  const series = staticLoader({
    id: 1,
    reason: 'MOUNTED',
    timeDomain: staticXDomain,
  }).data;
  const exampleAnnotations = [
    {
      id: 1,
      data: [series[40].timestamp, series[60].timestamp],
      color: 'black',
    },
  ];
  return (
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <LineChart
        height={CHART_HEIGHT}
        annotations={exampleAnnotations}
        onClickAnnotation={annotation => {
          action('annotation click')(annotation);
        }}
        onClick={e => {
          action('chart click')(e);
        }}
      />
    </DataProvider>
  );
};

clickEvents.story = {
  name: 'Click events',
};

export const drawPointsStory = () => (
  <>
    <DataProvider
      defaultLoader={staticLoader}
      timeDomain={staticXDomain}
      pointsPerSeries={100}
    >
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" drawPoints />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <DataProvider
      defaultLoader={staticLoader}
      timeDomain={staticXDomain}
      pointsPerSeries={100}
    >
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" drawPoints pointWidth={10} />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <DataProvider
      defaultLoader={staticLoader}
      timeDomain={staticXDomain}
      pointsPerSeries={100}
    >
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" drawPoints />
      <LineChart height={CHART_HEIGHT} pointWidth={4} />
    </DataProvider>
    <DataProvider
      defaultLoader={staticLoader}
      timeDomain={staticXDomain}
      pointsPerSeries={100}
      drawPoints={(d, _, __, { x, y, color }) => (
        <polygon
          points={`${x - 5} ${y},${x} ${y - 5},${x + 5} ${y},${x} ${y + 5}`}
          fill={color}
        />
      )}
    >
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} pointWidth={4} />
    </DataProvider>
  </>
);

drawPointsStory.story = {
  name: 'Draw points',
};

export const withoutContextChart = () => (
  <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} contextChart={{ visible: false }} />
  </DataProvider>
);

withoutContextChart.story = {
  name: 'Without context chart',
};

export const nonZoomable = () => {
  class ZoomToggle extends React.Component {
    state = {
      zoomable: true,
      yZoomable: { 1: false, 2: false },
    };

    toggleZoom = id => {
      const { yZoomable } = this.state;
      action('zoomed')(`${id} - ${!yZoomable[id]}`);
      this.setState({
        yZoomable: {
          ...yZoomable,
          [id]: !yZoomable[id],
        },
      });
    };

    render() {
      const { zoomable, yZoomable } = this.state;
      return (
        <>
          <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
            <Series id="1" color="steelblue" zoomable={yZoomable[1]} />
            <Series id="2" color="maroon" zoomable={yZoomable[2]} />
            <LineChart height={CHART_HEIGHT} zoomable={zoomable} />
          </DataProvider>
          <button
            type="button"
            onClick={() => this.setState({ zoomable: !zoomable })}
          >
            Toggle x zoom [{zoomable ? 'on' : 'off'}]
          </button>
          <button type="button" onClick={() => this.toggleZoom(1)}>
            Toggle y1 zoom [{yZoomable[1] !== false ? 'on' : 'off'}]
          </button>
          <button type="button" onClick={() => this.toggleZoom(2)}>
            Toggle y2 zoom [{yZoomable[2] !== false ? 'on' : 'off'}]
          </button>
        </>
      );
    }
  }
  return <ZoomToggle />;
};

nonZoomable.story = {
  name: 'Non-Zoomable',
};

export const dynamicTimeDomain = () => {
  class DynamicXDomain extends React.Component {
    state = {
      timeDomain: staticXDomain,
    };

    toggleTimeDomain = () => {
      const { timeDomain } = this.state;
      const newDomain = isEqual(timeDomain, staticXDomain)
        ? [staticXDomain[0] - 100000000 * 50, staticXDomain[1] + 100000000 * 50]
        : staticXDomain;
      this.setState({ timeDomain: newDomain });
    };

    render() {
      const { timeDomain } = this.state;
      return (
        <div>
          <button type="button" onClick={this.toggleTimeDomain}>
            {isEqual(timeDomain, staticXDomain)
              ? 'Shrink timeDomain'
              : 'Reset base domain'}
          </button>
          <DataProvider defaultLoader={staticLoader} timeDomain={timeDomain}>
            <Series id="1" color="steelblue" />
            <Series id="2" color="maroon" />
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
        </div>
      );
    }
  }
  return <DynamicXDomain />;
};

dynamicTimeDomain.story = {
  name: 'Dynamic time domain',
};

export const ySubDomainStory = () => (
  <>
    <h1>Set on DataProvider ([0.25, 0.5])</h1>
    <p>
      The ySubDomain for the chart should be [0.25, 0.5]. The context chart
      should be [0,1].
    </p>
    <DataProvider
      defaultLoader={staticLoader}
      timeDomain={staticXDomain}
      ySubDomain={[0.25, 0.5]}
    >
      <Series id="1" color="steelblue" />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <h1>Set on Series</h1>
    <p>
      The ySubDomain for the chart should be [0.25, 0.5] for blue <em>only</em>.
      Maroon should be [0, 1]
    </p>
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series id="1" color="steelblue" ySubDomain={[0.25, 0.5]} />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <h1>Set on Collection</h1>
    <p>
      The ySubDomain for the chart should be [0.0, 0.5] for the green collection
      (includes all lines).
    </p>
    <DataProvider
      defaultLoader={staticLoader}
      timeDomain={staticXDomain}
      collections={[]}
    >
      <Collection id="all" ySubDomain={[0.0, 0.5]} color="green">
        <Series id="1" color="steelblue" ySubDomain={[0.25, 0.5]} />
        <Series id="2" color="maroon" />
      </Collection>
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
    <h1>Set on Series with yDomain</h1>
    <p>
      The LineChart should be zoomed-in for the blue line, but the context chart
      should be zoomed-out (for the blue line). The blue line should have a
      maximum zoom-out range of [-1, 2].
    </p>
    <DataProvider defaultLoader={staticLoader} timeDomain={staticXDomain}>
      <Series
        id="1"
        color="steelblue"
        ySubDomain={[0.25, 0.75]}
        yDomain={[-1, 2]}
      />
      <Series id="2" color="maroon" />
      <LineChart height={CHART_HEIGHT} />
    </DataProvider>
  </>
);

ySubDomainStory.story = {
  name: 'ySubDomain',
};

export const dynamicTimeSubDomain = () => {
  const timeSubDomainFirst = [
    Date.now() - 1000 * 60 * 60 * 24 * 20,
    Date.now() - 1000 * 60 * 60 * 24 * 10,
  ];

  const timeSubDomainSecond = [
    Date.now() - 1000 * 60 * 60 * 24 * 10,
    Date.now(),
  ];

  class CustomTimeSubDomain extends React.Component {
    state = {
      isFirst: true,
    };

    render() {
      const { isFirst } = this.state;
      return (
        <>
          <button
            type="button"
            onClick={() => this.setState({ isFirst: !isFirst })}
          >
            {isFirst ? `Switch timeSubDomain` : `Switch back timeSubDomain`}
          </button>
          <DataProvider
            defaultLoader={staticLoader}
            timeDomain={staticXDomain}
            timeSubDomain={isFirst ? timeSubDomainFirst : timeSubDomainSecond}
          >
            <Series id="1" color="steelblue" />
            <Series id="2" color="maroon" />
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
        </>
      );
    }
  }
  return <CustomTimeSubDomain />;
};

dynamicTimeSubDomain.story = {
  name: 'Dynamic time sub domain',
};

export const liveLoading = () => (
  <DataProvider
    defaultLoader={liveLoader}
    timeDomain={liveXDomain}
    updateInterval={33}
  >
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

liveLoading.story = {
  name: 'Live loading',
};

export const liveLoadingAndRuler = () => (
  <div>
    <DataProvider
      defaultLoader={liveLoader}
      timeDomain={liveXDomain}
      updateInterval={33}
    >
      <Series id="1" color="steelblue" name="name1" />
      <Series id="2" color="maroon" name="name2" />
      <LineChart
        height={CHART_HEIGHT}
        crosshair={false}
        ruler={{
          visible: true,
          yLabel: point =>
            `${point.name}: ${Number.parseFloat(point.value).toFixed(3)}`,
          timeLabel: point =>
            moment(point.timestamp).format('DD-MM-YYYY HH:mm:ss'),
        }}
      />
    </DataProvider>
    <h3>With ruler timestamp</h3>
    <DataProvider
      defaultLoader={liveLoader}
      timeDomain={liveXDomain}
      updateInterval={33}
    >
      <Series id="1" color="steelblue" name="name1" />
      <Series id="2" color="maroon" name="name2" />
      <LineChart
        height={CHART_HEIGHT}
        crosshair={false}
        ruler={{
          visible: true,
          yLabel: point =>
            `${point.name}: ${Number.parseFloat(point.value).toFixed(3)}`,
          timeLabel: point =>
            moment(point.timestamp).format('DD-MM-YYYY HH:mm:ss'),
          timestamp: Date.now() - 1000 * 10,
        }}
      />
    </DataProvider>
    <h3>With custom ruler timestamp position</h3>
    <DataProvider
      defaultLoader={liveLoader}
      timeDomain={liveXDomain}
      updateInterval={33}
    >
      <Series id="1" color="steelblue" name="name1" />
      <Series id="2" color="maroon" name="name2" />
      <LineChart
        height={CHART_HEIGHT}
        crosshair={false}
        ruler={{
          visible: true,
          yLabel: point =>
            `${point.name}: ${Number.parseFloat(point.value).toFixed(3)}`,
          timeLabel: point =>
            moment(point.timestamp).format('DD-MM-YYYY HH:mm:ss'),
          timestamp: Date.now() - 1000 * 10,
          getTimeLabelPosition: defaultPosition => defaultPosition - 100,
        }}
      />
    </DataProvider>
  </div>
);

liveLoadingAndRuler.story = {
  name: 'Live loading and ruler',
};

export const enableDisableSeries = () => {
  const colors = {
    'COM/COFFEE_BRZL': 'steelblue',
    'COM/COFFEE_CLMB': 'maroon',
  };
  const options = [
    { value: 'COM/COFFEE_BRZL', label: 'Brazil coffe price' },
    { value: 'COM/COFFEE_CLMB', label: 'Columbia coffe price' },
  ];

  const xDomain = [+moment().subtract(10, 'year'), +moment()];

  // eslint-disable-next-line
  class EnableDisableSeries extends React.Component {
    state = {
      series: [options[0]],
    };

    onChangeSeries = series => this.setState({ series });

    render() {
      const { series } = this.state;
      return (
        <>
          <Select
            isMulti
            value={series}
            options={options}
            onChange={this.onChangeSeries}
            style={{ marginBottom: '15px' }}
          />
          <DataProvider
            defaultLoader={quandlLoader}
            pointsPerSeries={100}
            timeDomain={xDomain}
          >
            {series.map(s => (
              <Series key={s.value} id={s.value} color={colors[s.value]} />
            ))}
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
        </>
      );
    }
  }
  return <EnableDisableSeries />;
};

enableDisableSeries.story = {
  name: 'Enable/disable series',
};

export const customContextBrush = () => {
  const width = 600;
  const height = 50;
  // eslint-disable-next-line
  class BrushComponent extends React.Component {
    state = {
      selection: [0, width],
    };

    onUpdateSelection = selection => {
      this.setState({
        selection,
      });
    };

    render() {
      const { selection } = this.state;
      return (
        <div>
          <svg width={width} height={height} stroke="#777">
            <Brush
              height={height}
              width={width}
              selection={selection}
              onUpdateSelection={this.onUpdateSelection}
            />
          </svg>
          <p>width: {width}</p>
          <p>
            selection: [{selection[0]}, {selection[1]}]
          </p>
        </div>
      );
    }
  }
  return <BrushComponent />;
};

customContextBrush.story = {
  name: 'Custom context brush',
};

export const stickyTimeSubdomain = () => (
  <DataProvider
    defaultLoader={liveLoader}
    timeDomain={liveXDomain}
    timeSubDomain={[Date.now() - 1000 * 20, Date.now() - 1000 * 10]}
    updateInterval={33}
    isTimeSubDomainSticky
  >
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

stickyTimeSubdomain.story = {
  name: 'Sticky time subdomain',
};

export const stickyTimeSubdomainAndRuler = () => (
  <DataProvider
    defaultLoader={liveLoader}
    timeDomain={liveXDomain}
    timeSubDomain={[Date.now() - 1000 * 20, Date.now() - 1000 * 10]}
    updateInterval={33}
    isTimeSubDomainSticky
  >
    <Series id="1" color="steelblue" name="name1" />
    <Series id="2" color="maroon" name="name2" />
    <LineChart
      height={CHART_HEIGHT}
      ruler={{
        visible: true,
        yLabel: point =>
          `${point.name}: ${Number.parseFloat(point.value).toFixed(3)}`,
        timeLabel: point =>
          moment(point.timestamp).format('DD-MM-YYYY HH:mm:ss'),
      }}
    />
  </DataProvider>
);

stickyTimeSubdomainAndRuler.story = {
  name: 'Sticky time subdomain and ruler',
};

export const limitTimeSubdomain = () => {
  class LimitTimeSubDomain extends React.Component {
    limitTimeSubDomain = subDomain => {
      const subDomainLength = subDomain[1] - subDomain[0];
      const subDomainEnd = Math.min(
        subDomain[1],
        Date.now() - 1000 * 60 * 60 * 24 * 5
      );
      const subDomainStart = subDomainEnd - subDomainLength;
      return [subDomainStart, subDomainEnd];
    };

    render() {
      return (
        <div>
          <DataProvider
            defaultLoader={staticLoader}
            timeDomain={staticXDomain}
            timeSubDomain={[
              Date.now() - 1000 * 60 * 60 * 24 * 15,
              Date.now() - 1000 * 60 * 60 * 24 * 10,
            ]}
            limitTimeSubDomain={this.limitTimeSubDomain}
          >
            <Series id="1" color="steelblue" />
            <Series id="2" color="maroon" />
            <LineChart height={CHART_HEIGHT} />
          </DataProvider>
        </div>
      );
    }
  }
  return <LimitTimeSubDomain />;
};

limitTimeSubdomain.story = {
  name: 'Limit time subdomain',
};

export const onMouseOutStory = () => (
  <DataProvider
    defaultLoader={staticLoader}
    timeDomain={staticXDomain}
    xSubDomain={[
      Date.now() - 1000 * 60 * 60 * 24 * 30,
      Date.now() - 1000 * 60 * 60 * 24 * 10,
    ]}
  >
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart
      height={CHART_HEIGHT}
      onMouseOut={action('mouse out')}
      onBlur={() => {}}
    />
  </DataProvider>
);

onMouseOutStory.story = {
  name: 'onMouseOut',
};

export const onUpdateDomainsStory = () => (
  <DataProvider
    defaultLoader={staticLoader}
    timeDomain={staticXDomain}
    xSubDomain={[
      Date.now() - 1000 * 60 * 60 * 24 * 30,
      Date.now() - 1000 * 60 * 60 * 24 * 10,
    ]}
    onUpdateDomains={action('onUpdateDomains')}
  >
    <Series id="1" color="steelblue" />
    <Series id="2" color="maroon" />
    <LineChart height={CHART_HEIGHT} />
  </DataProvider>
);

onUpdateDomainsStory.story = {
  name: 'onUpdateDomains',
};
