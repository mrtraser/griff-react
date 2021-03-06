import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import isEqual from 'lodash.isequal';
import ScalerContext from 'context/Scaler';
import { createYScale, createXScale } from 'utils/scale-helpers';
import GriffPropTypes, {
  areaPropType,
  seriesPropType,
  annotationPropType,
  rulerPropType,
} from 'utils/proptypes';
import Annotation from 'components/Annotation';
import Ruler from 'components/Ruler';
import Area from 'components/Area';
import ZoomRect from 'components/ZoomRect';
import Axes from 'utils/Axes';
import { withDisplayName } from 'utils/displayName';

export const ZoomMode = {
  X: 0,
  Y: 1,
  BOTH: 2,
};

const MINIMUM_AREA_DIMENSION_PIXELS = 30;
const isLargeEnough = area =>
  Math.abs(area.start.xpos - area.end.xpos) > MINIMUM_AREA_DIMENSION_PIXELS ||
  Math.abs(area.start.ypos - area.end.ypos) > MINIMUM_AREA_DIMENSION_PIXELS;

class InteractionLayer extends React.Component {
  state = {
    area: null,
    crosshair: {
      x: null,
      y: null,
    },
    points: [],
    touchX: null,
    touchY: null,
  };

  componentDidMount() {
    const { ruler } = this.props;
    if (ruler.timestamp) {
      this.setRulerPosition(ruler.timestamp);
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      subDomainsByItemId: prevSubDomainsByItemId,
      ruler,
      width: prevWidth,
    } = this.props;
    // FIXME: Don't assume a single time domain
    const {
      width: nextWidth,
      subDomainsByItemId: nextSubDomainsByItemId,
    } = nextProps;
    const { touchX, touchY } = this.state;

    const prevTimeSubDomain = Axes.time(
      prevSubDomainsByItemId[Object.keys(prevSubDomainsByItemId)[0]]
    );
    const nextTimeSubDomain = Axes.time(
      nextSubDomainsByItemId[Object.keys(nextSubDomainsByItemId)[0]]
    );

    if (
      ruler &&
      ruler.visible &&
      touchX !== null &&
      (!isEqual(prevTimeSubDomain, nextTimeSubDomain) ||
        prevWidth !== nextWidth)
    ) {
      // keep track on ruler on subdomain update
      const prevXScale = createXScale(prevTimeSubDomain, prevWidth);
      const curXScale = createXScale(nextTimeSubDomain, nextWidth);
      const ts = prevXScale.invert(touchX);
      const newXPos = curXScale(ts);

      // hide ruler if point went out to the left of subdomain
      if (newXPos < 0) {
        this.setState({
          points: [],
          touchX: null,
          touchY: null,
        });
      } else if (this.touchMoving) {
        // ruler should not follow points during panning and zooming on mobile
        this.processMouseMove(touchX, touchY);
      } else {
        // ruler should follow points during live loading and
        // panning and zooming on desktop
        this.setState({ touchX: newXPos }, () => {
          this.processMouseMove(newXPos, touchY);
        });
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { onAreaDefined, ruler } = this.props;
    if (prevProps.onAreaDefined && !onAreaDefined) {
      // They no longer care about areas; if we're building one, then remove it.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        area: null,
      });
    }

    if (ruler.timestamp !== prevProps.ruler.timestamp) {
      this.setRulerPosition(ruler.timestamp);
    }
  }

  onMouseDown = e => {
    const { onAreaDefined } = this.props;
    if (onAreaDefined) {
      this.mouseDown = true;
      const xpos = e.nativeEvent.offsetX;
      const ypos = e.nativeEvent.offsetY;
      this.setState({
        area: {
          id: Date.now(),
          start: this.getDataForCoordinate(xpos, ypos, true),
        },
      });
    }
  };

  onMouseUp = () => {
    const { onAreaDefined } = this.props;
    setTimeout(() => {
      this.mouseUp = false;
      this.dragging = false;
    }, 50);
    if (onAreaDefined) {
      const { area } = this.state;
      if (area && area.start && area.end && isLargeEnough(area)) {
        onAreaDefined(area);
      }
    }
    this.setState({ area: null });
  };

  onMouseMove = e => {
    const { series, onMouseMove, crosshair, ruler } = this.props;
    if (series.length === 0) {
      return;
    }
    const xpos = e.nativeEvent.offsetX;
    const ypos = e.nativeEvent.offsetY;
    if (crosshair) {
      this.setState({
        crosshair: {
          x: xpos,
          y: ypos,
        },
      });
    }

    const { area } = this.state;
    if (onMouseMove || (ruler && ruler.visible) || area) {
      this.processMouseMove(xpos, ypos, e);
      this.setState({
        touchX: xpos,
        touchY: ypos,
      });

      if (area) {
        this.dragging = true;
      }
    }
  };

  onMouseOut = e => {
    const { onMouseMove, crosshair, onMouseOut, ruler } = this.props;
    if (crosshair) {
      this.setState({
        crosshair: {
          x: null,
          y: null,
        },
      });
    }
    if (ruler && ruler.visible) {
      this.setState({
        points: [],
        touchX: null,
        touchY: null,
      });
    }
    if (onMouseMove) {
      onMouseMove({ points: [] });
    }
    if (onMouseOut) {
      onMouseOut(e);
    }
    this.setState({ area: null });
  };

  onClick = e => {
    const {
      onClickAnnotation,
      onAreaClicked,
      onClick,
      width,
      height,
      annotations,
      areas,
      subDomainsByItemId,
      series,
    } = this.props;
    if (this.dragging) {
      return;
    }
    if (onClickAnnotation || onAreaClicked) {
      let notified = false;
      // FIXME: Don't assume a single time domain
      const timeSubDomain = Axes.time(
        subDomainsByItemId[Object.keys(subDomainsByItemId)[0]]
      );
      const xScale = createXScale(timeSubDomain, width);
      const xpos = e.nativeEvent.offsetX;
      const ypos = e.nativeEvent.offsetY;
      const rawTimestamp = xScale.invert(xpos);
      if (onAreaClicked) {
        let stopNotifying = false;
        areas.forEach(a => {
          if (stopNotifying) {
            return;
          }
          if (a.seriesId) {
            const s = series.find(s1 => s1.id === a.seriesId);
            if (s) {
              const { [Axes.y]: ySubDomain } = subDomainsByItemId[
                s.collectionId || s.id
              ];
              const yScale = createYScale(ySubDomain, height);
              const unScaled = {
                xpos: xScale.invert(xpos),
                ypos: yScale.invert(ypos),
              };
              const x = unScaled.xpos > a.xMin && unScaled.xpos < a.xMax;
              const y = unScaled.ypos > a.yMin && unScaled.ypos < a.yMax;
              if (x && y) {
                // Clicked within an area
                stopNotifying = onAreaClicked(a, xpos, ypos);
                notified = true;
              }
            }
          }
        });
      }
      if (onClickAnnotation) {
        annotations.forEach(a => {
          if (rawTimestamp > a.data[0] && rawTimestamp < a.data[1]) {
            // Clicked within an annotation
            onClickAnnotation(a, xpos, ypos);
            notified = true;
          }
        });
      }
      if (notified) {
        return;
      }
    }
    if (onClick) {
      onClick(e);
    }
  };

  onDoubleClick = e => {
    const { onDoubleClick } = this.props;
    if (onDoubleClick) {
      onDoubleClick(e);
    }
  };

  onTouchMove = () => {
    this.touchMoving = true;
  };

  onTouchMoveEnd = () => {
    this.touchMoving = false;
  };

  // TODO: This extrapolate thing is super gross and so hacky.
  getDataForCoordinate = (xpos, ypos, extrapolate = false) => {
    const { subDomainsByItemId, width, series, height } = this.props;

    const output = { xpos, ypos, points: [] };
    series.forEach(s => {
      const {
        [Axes.time]: timeSubDomain,
        [Axes.y]: ySubDomain,
      } = subDomainsByItemId[s.id];
      const xScale = createXScale(timeSubDomain, width);
      const rawTimestamp = xScale.invert(xpos);
      const { data, xAccessor, yAccessor } = s;
      const rawX = d3.bisector(xAccessor).left(data, rawTimestamp, 1);
      const x0 = data[rawX - 1];
      const x1 = data[rawX];
      let d = null;
      if (x0) {
        // If there is a point *before* the cursor position, then that should
        // be used since it was the last-known value, and extrapolating into the
        // future can be misleading (and incorrect).
        d = x0;
      } else if (x1) {
        // But if we only have a point under the cursor, go ahead and use that.
        d = x1;
      } else {
        // Otherwise, just use nothing.
        d = null;
      }
      if (d) {
        let yScale = createYScale(ySubDomain, height);
        if (extrapolate) {
          yScale = d3
            .scaleLinear()
            .domain([height, 0])
            .range(ySubDomain);
        }
        const ts = xAccessor(d);
        const value = extrapolate ? ypos : yAccessor(d);
        output.points.push({
          id: s.id,
          timestamp: ts,
          value: extrapolate ? yScale(value) : value,
          x: xScale(ts),
          y: yScale(value),
        });
      } else {
        output.points.push({ id: s.id });
      }
    });
    return output;
  };

  getRulerPoints = xpos => {
    const { series, height, width, subDomainsByItemId } = this.props;
    const newPoints = [];
    series.forEach(s => {
      if (!subDomainsByItemId[s.id]) {
        return;
      }
      const { [Axes.time]: timeSubDomain, [Axes.y]: ySubDomain } =
        subDomainsByItemId[s.collectionId] || subDomainsByItemId[s.id];
      const xScale = createXScale(timeSubDomain, width);
      const rawTimestamp = xScale.invert(xpos);
      const { data, xAccessor, yAccessor } = s;
      const rawX = d3.bisector(xAccessor).left(data, rawTimestamp, 1);
      const x0 = data[rawX - 1];
      const x1 = data[rawX];
      let d = null;
      if (x0) {
        // If there is a point *before* the cursor position, then that should
        // be used since it was the last-known value, and extrapolating into the
        // future can be misleading (and incorrect).
        d = x0;
      } else if (x1) {
        // But if we only have a point under the cursor, go ahead and use that.
        d = x1;
      } else {
        // Otherwise, just use nothing.
        d = null;
      }
      if (d) {
        const yScale = createYScale(ySubDomain, height);
        const ts = xAccessor(d);
        const value = yAccessor(d);
        newPoints.push({
          id: s.id,
          name: s.name,
          color: s.color,
          timestamp: ts,
          rawTimestamp,
          value,
          x: xScale(ts),
          y: yScale(value),
        });
      }
    });
    return newPoints;
  };

  setRulerPosition = timestamp => {
    if (!timestamp) {
      this.setState({
        points: [],
        touchX: null,
        touchY: null,
      });
      return;
    }
    const { width, subDomainsByItemId } = this.props;
    const timeSubDomain = Axes.time(
      subDomainsByItemId[Object.keys(subDomainsByItemId)[0]]
    );
    const xScale = createXScale(timeSubDomain, width);
    const xpos = xScale(timestamp);
    this.setRulerPoints(xpos);
    this.setState({
      touchX: xpos,
    });
  };

  setRulerPoints = xpos => {
    const rulerPoints = this.getRulerPoints(xpos);
    this.setState({ points: rulerPoints });

    return rulerPoints;
  };

  setArea = (xpos, ypos) => {
    const { area } = this.state;
    if (!area) {
      return;
    }
    const output = this.getDataForCoordinate(xpos, ypos, true);
    this.setState({
      area: {
        ...area,
        end: output,
      },
    });
  };

  processMouseMove = (xpos, ypos, e = null) => {
    const rulerPoints = this.setRulerPoints(xpos);
    this.setArea(xpos, ypos);
    const { onMouseMove } = this.props;
    if (onMouseMove) {
      onMouseMove({ points: rulerPoints, xpos, ypos, e });
    }
  };

  render() {
    const {
      annotations: propsAnnotations,
      areas: propsAreas,
      collections,
      height,
      crosshair,
      onAreaDefined,
      ruler,
      series,
      subDomainsByItemId,
      width,
      zoomAxes,
    } = this.props;

    if (series.length === 0) {
      return null;
    }

    const {
      crosshair: { x, y },
      points,
      area,
    } = this.state;
    let lines = null;
    if (crosshair && x !== null && y !== null) {
      lines = (
        <>
          <line
            key="x"
            x1={0}
            x2={width}
            stroke="#0004"
            strokeWidth={1}
            y1={y}
            y2={y}
          />
          <line
            key="y"
            y1={0}
            y2={height}
            stroke="#0004"
            strokeWidth={1}
            x1={x}
            x2={x}
          />
        </>
      );
    }
    // FIXME: Don't rely on a single time domain
    const timeSubDomain = Axes.time(subDomainsByItemId[series[0].id]);
    const xScale = createXScale(timeSubDomain, width);
    const annotations = propsAnnotations.map(a => (
      <Annotation
        key={`annotation-${a.id}`}
        {...a}
        height={height}
        xScale={xScale}
      />
    ));
    const areas = propsAreas.map(a => {
      const scaledArea = {
        ...a,
      };

      let s = null;

      scaledArea.xMin = Math.max(
        0,
        xScale(a.xMin !== undefined ? a.xMin : timeSubDomain[0])
      );
      scaledArea.xMax = xScale(
        a.xMax !== undefined ? a.xMax : timeSubDomain[1]
      );

      if (a.seriesId) {
        s = series.find(s1 => s1.id === a.seriesId);
        if (s) {
          const { [Axes.y]: ySubDomain } = subDomainsByItemId[
            s.collectionId || s.id
          ];
          const yScale = createYScale(ySubDomain, height);

          scaledArea.yMin = Math.max(
            0,
            yScale(a.yMin !== undefined ? a.yMin : ySubDomain[0])
          );
          scaledArea.yMax = yScale(
            a.yMax !== undefined ? a.yMax : ySubDomain[1]
          );
        }
      }
      const color = scaledArea.color || (s ? s.color : null);
      return (
        <Area key={`area-${scaledArea.id}`} color={color} {...scaledArea} />
      );
    });
    const areaBeingDefined = area ? (
      <Area key="user" {...area} color="#999" />
    ) : null;

    let zoomableAxes = zoomAxes;
    if (onAreaDefined) {
      zoomableAxes = {};
    }
    return (
      <>
        {lines}
        {annotations}
        {ruler.visible && points.length && (
          <Ruler
            ruler={ruler}
            points={points}
            chartWidth={width}
            chartHeight={height}
          />
        )}
        {areas}
        {areaBeingDefined}
        <ZoomRect
          zoomAxes={zoomableAxes}
          width={width}
          height={height}
          onClick={this.onClick}
          onMouseMove={this.onMouseMove}
          onBlur={this.onMouseMove}
          onMouseOut={this.onMouseOut}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onDoubleClick={this.onDoubleClick}
          itemIds={series.map(s => s.id).concat(collections.map(c => c.id))}
          onTouchMove={this.onTouchMove}
          onTouchMoveEnd={this.onTouchMoveEnd}
        />
      </>
    );
  }
}

InteractionLayer.propTypes = {
  crosshair: PropTypes.bool,
  ruler: rulerPropType,
  height: PropTypes.number.isRequired,
  // area => void
  onAreaDefined: PropTypes.func,
  // (area, xpos, ypos) => void
  onAreaClicked: PropTypes.func,
  onClick: PropTypes.func,
  onClickAnnotation: PropTypes.func,
  // event => void
  onDoubleClick: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseOut: PropTypes.func,
  // ({ xSubDomain, transformation }) => void
  onZoomXAxis: PropTypes.func,
  areas: PropTypes.arrayOf(areaPropType),
  annotations: PropTypes.arrayOf(annotationPropType),
  width: PropTypes.number.isRequired,
  zoomAxes: GriffPropTypes.zoomAxes.isRequired,

  // These are all populated by Griff.
  series: seriesPropType,
  collections: GriffPropTypes.collections,
  subDomainsByItemId: GriffPropTypes.subDomainsByItemId.isRequired,
};

InteractionLayer.defaultProps = {
  areas: [],
  annotations: [],
  collections: [],
  crosshair: false,
  onAreaDefined: null,
  onAreaClicked: null,
  onClick: null,
  onClickAnnotation: null,
  onDoubleClick: null,
  onMouseMove: null,
  onMouseOut: null,
  onZoomXAxis: null,
  series: [],
  ruler: {
    visible: false,
    timeLabel: () => {},
    yLabel: () => {},
    timestamp: null,
  },
};

export default withDisplayName('InteractionLayer', props => (
  <ScalerContext.Consumer>
    {({ collections, series, subDomainsByItemId }) => (
      <InteractionLayer
        {...props}
        collections={collections}
        series={series}
        subDomainsByItemId={subDomainsByItemId}
      />
    )}
  </ScalerContext.Consumer>
));
