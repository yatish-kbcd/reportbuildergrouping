import React, { useState } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Dropzone from 'react-dropzone';
import Papa from 'papaparse';
import tips from './tips';
import { sortAs } from '../src/Utilities';
import Grouping from '../src/components/Grouping';
import PivotTableUIWrapper from '../src/components/PivotTableUI';
import '../src/pivottable.css';
import '../src/grouping.css';

const Plot = createPlotlyComponent(window.Plotly);

const initialPivotState = {
  data: tips,
  rows: ['Payer Gender', 'Meal'],
  cols: ['Payer Smoker', 'Party Size'],
  vals: ['Tip', 'Total Bill'],
  rendererName: 'Table',
  sorters: {
    Meal: sortAs(['Lunch', 'Dinner']),
    'Day of Week': sortAs(['Thursday', 'Friday', 'Saturday', 'Sunday']),
  },
  plotlyOptions: { width: 900, height: 500 },
  plotlyConfig: {},
  tableOptions: {
    clickCallback: (e, value, filters, pivotData) => {
      const names = [];
      pivotData.forEachMatchingRecord(filters, (record) => {
        names.push(record.Meal);
      });
      alert(names.join('\n'));
    },
  },
};

const App = () => {
  const [state, setState] = useState({
    mode: 'demo',
    filename: 'Sample Dataset: Tips',
    textarea: '',
    pivotState: initialPivotState,
  });

  const handleFileDrop = (files) => {
    setState(Object.assign({}, state, {
      mode: 'thinking',
      filename: '(Parsing CSV...)',
      textarea: '',
      pivotState: { data: [] }
    }));

    Papa.parse(files[0], {
      skipEmptyLines: true,
      error: (e) => alert(e),
      complete: (parsed) => {
        setState(Object.assign({}, state, {
          mode: 'file',
          filename: files[0].name,
          textarea: '',
          pivotState: Object.assign({}, state.pivotState, {
            data: parsed.data
          })
        }));
      }
    });
  };

  const handleTextareaChange = (event) => {
    Papa.parse(event.target.value, {
      skipEmptyLines: true,
      error: (e) => alert(e),
      complete: (parsed) => {
        setState(Object.assign({}, state, {
          mode: 'text',
          filename: 'Data from <textarea>',
          textarea: event.target.value,
          pivotState: Object.assign({}, state.pivotState, {
            data: parsed.data
          })
        }));
      }
    });
  };

  const handleGroupingChange = ({ target: { name, checked } }) => {
    setState(Object.assign({}, state, {
      pivotState: Object.assign({}, state.pivotState, {
        [name]: checked
      })
    }));
  };

  const handlePivotStateChange = (newPivotState) => {
    setState(Object.assign({}, state, {
      pivotState: newPivotState
    }));
  };

  return (
    <div>
      <div className="row text-center">
        <div className="col-md-3 col-md-offset-3">
          <p>Try it right now on a file...</p>
          <Dropzone
            onDrop={handleFileDrop}
            accept="text/csv"
            className="dropzone"
            activeClassName="dropzoneActive"
            rejectClassName="dropzoneReject"
          >
            <p>
              Drop a CSV file here, or click to choose a file from your computer.
            </p>
          </Dropzone>
        </div>
        <div className="col-md-3 text-center">
          <p>...or paste some data:</p>
          <textarea
            value={state.textarea}
            onChange={handleTextareaChange}
            placeholder="Paste from a spreadsheet or CSV-like file"
          />
        </div>
      </div>
      <div className="row text-center">
        <p>
          <em>Note: the data never leaves your browser!</em>
        </p>
        <br />
      </div>
      <div className="row">
        <h2 className="text-center">{state.filename}</h2>
        <br />
      </div>
      <Grouping
        onChange={handleGroupingChange}
        rendererName={state.pivotState.rendererName}
      />
      <div className="row">
        <PivotTableUIWrapper
          Plot={Plot}
          {...state.pivotState}
          onChange={handlePivotStateChange}
        />
      </div>
    </div>
  );
};

export default App;