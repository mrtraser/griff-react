import * as React from 'react';
import { ItemId } from '../../external';
import {
  Context as Griff,
  RegisterSeriesFunction,
  UpdateSeriesFunction,
} from '../Griff';
import { withDisplayName } from '../../utils/displayName';
import { IncomingItem } from '../../internal';

export interface ItemProps extends IncomingItem {}

export const WATCHED_PROP_NAMES = [
  'color',
  'drawLines',
  'drawPoints',
  'pointWidth',
  'strokeWidth',
  'hidden',
  'loader',
  'step',
  'zoomable',
  'name',
  'timeAccessor',
  'xAccessor',
  'x0Accessor',
  'x1Accessor',
  'yAccessor',
  'y0Accessor',
  'y1Accessor',
  'yDomain',
  'ySubDomain',
  'yAxisPlacement',
  'yAxisDisplayMode',
  'pointWidthAccessor',
  'opacity',
  'opacityAccessor',
  'zoomable',
];

export interface Props extends ItemProps {
  collectionId?: ItemId;
}

interface InternalProps {
  registerSeries: RegisterSeriesFunction;
  updateSeries: UpdateSeriesFunction;
}

const Series: React.FunctionComponent<Props & InternalProps> = ({
  id,
  registerSeries,
  updateSeries,
  children,

  // Below are all of the series props.
  ...props
}) => {
  // This only happens once, when the component is first mounted.
  React.useEffect(() => {
    return registerSeries({
      id,
      ...props,
    });
  }, []);

  // But whenever the component is updated, we want to update the series in the
  // DataProvider.
  React.useEffect(() => {
    return updateSeries({
      id,
      ...props,
    });
    // @ts-ignore - It's okay for props[name] to be implicit any.
  }, WATCHED_PROP_NAMES.map(name => props[name]).concat(props.collectionId));
  return null;
};
(Series as any).griffDataItem = true;

export default withDisplayName('Series', (props: Props) => (
  <Griff.Consumer>
    {({ registerSeries, updateSeries }: InternalProps) => (
      <Series
        {...props}
        registerSeries={registerSeries}
        updateSeries={updateSeries}
      />
    )}
  </Griff.Consumer>
));
