import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';

function makeRenderer(
  PlotlyComponent,
  traceOptions = {},
  layoutOptions = {},
  transpose = false
) {
  const Renderer = (props) => {
    const pivotData = new PivotData(props);
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    const traceKeys = transpose ? colKeys : rowKeys;
    if (traceKeys.length === 0) {
      traceKeys.push([]);
    }
    const datumKeys = transpose ? rowKeys : colKeys;
    if (datumKeys.length === 0) {
      datumKeys.push([]);
    }

    let fullAggName = props.aggregatorName;
    const numInputs = props.aggregators[fullAggName]([])().numInputs || 0;
    if (numInputs !== 0) {
      fullAggName += ` of ${props.vals.slice(0, numInputs).join(', ')}`;
    }

    const data = traceKeys.map(traceKey => {
      const values = [];
      const labels = [];
      for (const datumKey of datumKeys) {
        const val = parseFloat(
          pivotData
            .getAggregator(
              transpose ? datumKey : traceKey,
              transpose ? traceKey : datumKey
            )
            .value()
        );
        values.push(isFinite(val) ? val : null);
        labels.push(datumKey.join('-') || ' ');
      }
      const trace = {name: traceKey.join('-') || fullAggName};
      if (traceOptions.type === 'pie') {
        trace.values = values;
        trace.labels = labels.length > 1 ? labels : [fullAggName];
      } else {
        trace.x = transpose ? values : labels;
        trace.y = transpose ? labels : values;
      }
      return Object.assign(trace, traceOptions);
    });

    let titleText = fullAggName;
    const hAxisTitle = transpose
      ? props.rows.join('-')
      : props.cols.join('-');
    const groupByTitle = transpose
      ? props.cols.join('-')
      : props.rows.join('-');
    if (hAxisTitle !== '') {
      titleText += ` vs ${hAxisTitle}`;
    }
    if (groupByTitle !== '') {
      titleText += ` by ${groupByTitle}`;
    }

    const layout = {
      title: titleText,
      hovermode: 'closest',
      width: window.innerWidth / 1.5,
      height: window.innerHeight / 1.4 - 50,
    };

    if (traceOptions.type === 'pie') {
      const columns = Math.ceil(Math.sqrt(data.length));
      const rows = Math.ceil(data.length / columns);
      layout.grid = {columns, rows};
      data.forEach((d, i) => {
        d.domain = {
          row: Math.floor(i / columns),
          column: i - columns * Math.floor(i / columns),
        };
        if (data.length > 1) {
          d.title = d.name;
        }
      });
      if (data[0].labels.length === 1) {
        layout.showlegend = false;
      }
    } else {
      layout.xaxis = {
        title: transpose ? fullAggName : null,
        automargin: true,
      };
      layout.yaxis = {
        title: transpose ? null : fullAggName,
        automargin: true,
      };
    }

    return (
      <PlotlyComponent
        data={data}
        layout={Object.assign(layout, layoutOptions, props.plotlyOptions)}
        config={props.plotlyConfig}
        onUpdate={props.onRendererUpdate}
      />
    );
  };

  Renderer.defaultProps = Object.assign({}, PivotData.defaultProps, {
    plotlyOptions: {},
    plotlyConfig: {},
  });
  
  Renderer.propTypes = Object.assign({}, PivotData.propTypes, {
    plotlyOptions: PropTypes.object,
    plotlyConfig: PropTypes.object,
    onRendererUpdate: PropTypes.func,
  });

  return Renderer;
}

function makeScatterRenderer(PlotlyComponent) {
  const Renderer = (props) => {
    const pivotData = new PivotData(props);
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    if (rowKeys.length === 0) {
      rowKeys.push([]);
    }
    if (colKeys.length === 0) {
      colKeys.push([]);
    }

    const data = {x: [], y: [], text: [], type: 'scatter', mode: 'markers'};

    rowKeys.map(rowKey => {
      colKeys.map(colKey => {
        const v = pivotData.getAggregator(rowKey, colKey).value();
        if (v !== null) {
          data.x.push(colKey.join('-'));
          data.y.push(rowKey.join('-'));
          data.text.push(v);
        }
      });
    });

    const layout = {
      title: props.rows.join('-') + ' vs ' + props.cols.join('-'),
      hovermode: 'closest',
      xaxis: {title: props.cols.join('-'), automargin: true},
      yaxis: {title: props.rows.join('-'), automargin: true},
      width: window.innerWidth / 1.5,
      height: window.innerHeight / 1.4 - 50,
    };

    return (
      <PlotlyComponent
        data={[data]}
        layout={Object.assign(layout, props.plotlyOptions)}
        config={props.plotlyConfig}
        onUpdate={props.onRendererUpdate}
      />
    );
  };

  Renderer.defaultProps = Object.assign({}, PivotData.defaultProps, {
    plotlyOptions: {},
    plotlyConfig: {},
  });

  Renderer.propTypes = Object.assign({}, PivotData.propTypes, {
    plotlyOptions: PropTypes.object,
    plotlyConfig: PropTypes.object,
    onRendererUpdate: PropTypes.func,
  });

  return Renderer;
}

export default function createPlotlyRenderers(PlotlyComponent) {
  return {
    'Grouped Column Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar'},
      {barmode: 'group'}
    ),
    'Stacked Column Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar'},
      {barmode: 'relative'}
    ),
    'Grouped Bar Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar', orientation: 'h'},
      {barmode: 'group'},
      true
    ),
    'Stacked Bar Chart': makeRenderer(
      PlotlyComponent,
      {type: 'bar', orientation: 'h'},
      {barmode: 'relative'},
      true
    ),
    'Line Chart': makeRenderer(PlotlyComponent),
    'Dot Chart': makeRenderer(PlotlyComponent, {mode: 'markers'}, {}, true),
    'Area Chart': makeRenderer(PlotlyComponent, {stackgroup: 1}),
    'Scatter Chart': makeScatterRenderer(PlotlyComponent),
    'Multiple Pie Chart': makeRenderer(
      PlotlyComponent,
      {type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none'},
      {},
      true
    ),
  };
}