import React, {useEffect} from 'react';
import PropTypes from 'prop-types';
import TableRenderers from '../TableRenderers';
import createPlotlyRenderers from '../PlotlyRenderers';
import PivotTableUI from '../PivotTableUI';

const PivotTableUIWrapper = ({ Plot, ...props }) => {
  const renderers = {
    ...TableRenderers,
    ...createPlotlyRenderers(Plot),
  };

   return (
    <PivotTableUI
      renderers={renderers}
      {...props}
      unusedOrientationCutoff={Infinity}
    />
  );
};

PivotTableUIWrapper.propTypes = {
  Plot: PropTypes.func.isRequired,
};

export default PivotTableUIWrapper;