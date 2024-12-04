import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';
import TableRenderers from './TableRenderers';

const PivotTable = (props) => {
  const Renderer = props.renderers[
    props.rendererName in props.renderers
      ? props.rendererName
      : Object.keys(props.renderers)[0]
  ];
  
  return <Renderer {...props} />;
};

PivotTable.propTypes = Object.assign({}, PivotData.propTypes, {
  rendererName: PropTypes.string,
  renderers: PropTypes.objectOf(PropTypes.func),
});

PivotTable.defaultProps = Object.assign({}, PivotData.defaultProps, {
  rendererName: 'Table',
  renderers: TableRenderers,
});

export default PivotTable;