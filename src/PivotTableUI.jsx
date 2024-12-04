import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { PivotData, sortAs, getSort } from './Utilities';
import PivotTable from './PivotTable';
import Sortable from 'react-sortablejs';
import Draggable from 'react-draggable';

// Convert DraggableAttribute to function component
const DraggableAttribute = ({
                              name,
                              addValuesToFilter,
                              removeValuesFromFilter,
                              attrValues,
                              valueFilter = {},
                              moveFilterBoxToTop,
                              sorter,
                              menuLimit,
                              zIndex,
                              setValuesInFilter
                            }) => {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  const toggleValue = (value) => {
    if (value in valueFilter) {
      removeValuesFromFilter(name, [value]);
    } else {
      addValuesToFilter(name, [value]);
    }
  };

  const matchesFilter = (x) => {
    return x.toLowerCase().trim().includes(filterText.toLowerCase().trim());
  };

  const selectOnly = (e, value) => {
    e.stopPropagation();
    setValuesInFilter(
      name,
      Object.keys(attrValues).filter(y => y !== value)
    );
  };

  const getFilterBox = () => {
    const showMenu = Object.keys(attrValues).length < menuLimit;
    const values = Object.keys(attrValues);
    const shown = values.filter(matchesFilter).sort(sorter);

    return (
      <Draggable handle=".pvtDragHandle">
        <div
          className="pvtFilterBox"
          style={{
            display: 'block',
            cursor: 'initial',
            zIndex: zIndex,
          }}
          onClick={() => moveFilterBoxToTop(name)}
        >
          <a onClick={() => setOpen(false)} className="pvtCloseX">×</a>
          <span className="pvtDragHandle">☰</span>
          <h4>{name}</h4>

          {showMenu || <p>(too many values to show)</p>}

          {showMenu && (
            <p>
              <input
                type="text"
                placeholder="Filter values"
                className="pvtSearch"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
              />
              <br />
              <a
                role="button"
                className="pvtButton"
                onClick={() =>
                  removeValuesFromFilter(
                    name,
                    Object.keys(attrValues).filter(matchesFilter)
                  )
                }
              >
                Select {values.length === shown.length ? 'All' : shown.length}
              </a>{' '}
              <a
                role="button"
                className="pvtButton"
                onClick={() =>
                  addValuesToFilter(
                    name,
                    Object.keys(attrValues).filter(matchesFilter)
                  )
                }
              >
                Deselect {values.length === shown.length ? 'All' : shown.length}
              </a>
            </p>
          )}

          {showMenu && (
            <div className="pvtCheckContainer">
              {shown.map(x => (
                <p
                  key={x}
                  onClick={() => toggleValue(x)}
                  className={x in valueFilter ? '' : 'selected'}
                >
                  <a className="pvtOnly" onClick={e => selectOnly(e, x)}>
                    only
                  </a>
                  <a className="pvtOnlySpacer">&nbsp;</a>
                  {x === '' ? <em>null</em> : x}
                </p>
              ))}
            </div>
          )}
        </div>
      </Draggable>
    );
  };

  const toggleFilterBox = () => {
    setOpen(!open);
    moveFilterBoxToTop(name);
  };

  const filtered = Object.keys(valueFilter).length !== 0 ? 'pvtFilteredAttribute' : '';

  return (
    <li data-id={name}>
      <span className={'pvtAttr ' + filtered}>
        {name}
        <span className="pvtTriangle" onClick={toggleFilterBox}> ▾</span>
      </span>
      {open ? getFilterBox() : null}
    </li>
  );
};

// Convert Dropdown to function component
const Dropdown = React.memo(({ current, values, open, zIndex, toggle, setValue }) => {
  return (
    <div className="pvtDropdown" style={{ zIndex }}>
      <div
        onClick={e => {
          e.stopPropagation();
          toggle();
        }}
        className={
          'pvtDropdownValue pvtDropdownCurrent ' +
          (open ? 'pvtDropdownCurrentOpen' : '')
        }
        role="button"
      >
        <div className="pvtDropdownIcon">{open ? '×' : '▾'}</div>
        {current || <span>&nbsp;</span>}
      </div>

      {open && (
        <div className="pvtDropdownMenu">
          {values.map(r => (
            <div
              key={r}
              role="button"
              onClick={e => {
                e.stopPropagation();
                if (current === r) {
                  toggle();
                } else {
                  setValue(r);
                }
              }}
              className={
                'pvtDropdownValue ' +
                (r === current ? 'pvtDropdownActiveValue' : '')
              }
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Main PivotTableUI component converted to function component
const PivotTableUI = (props) => {
  const [state, setState] = useState({
    unusedOrder: [],
    zIndices: {},
    maxZIndex: 1000,
    openDropdown: false,
    attrValues: {},
    materializedInput: [],
    data: null
  });

  // console.log("pffffffffrops",props);
  useEffect(() => {
    materializeInput(props.data);
  }, [props.data]);

  const materializeInput = (nextData) => {
    if (state.data === nextData) {
      return;
    }

    const newState = {
      data: nextData,
      attrValues: {},
      materializedInput: [],
    };

    let recordsProcessed = 0;
    PivotData.forEachRecord(
      newState.data,
      props.derivedAttributes,
      function(record) {
        newState.materializedInput.push(record);
        for (const attr of Object.keys(record)) {
          if (!(attr in newState.attrValues)) {
            newState.attrValues[attr] = {};
            if (recordsProcessed > 0) {
              newState.attrValues[attr].null = recordsProcessed;
            }
          }
        }
        for (const attr in newState.attrValues) {
          const value = attr in record ? record[attr] : 'null';
          if (!(value in newState.attrValues[attr])) {
            newState.attrValues[attr][value] = 0;
          }
          newState.attrValues[attr][value]++;
        }
        recordsProcessed++;
      }
    );

    setState(prevState => ({
      ...prevState,
      ...newState
    }));
  };

  const sendPropUpdate = (command) => {
    props.onChange(update(props, command));
  };

  const propUpdater = (key) => {
    return value => sendPropUpdate({[key]: {$set: value}});
  };

  const setValuesInFilter = (attribute, values) => {
    sendPropUpdate({
      valueFilter: {
        [attribute]: {
          $set: values.reduce((r, v) => {
            r[v] = true;
            return r;
          }, {}),
        },
      },
    });
  };

  const addValuesToFilter = (attribute, values) => {
    if (attribute in props.valueFilter) {
      sendPropUpdate({
        valueFilter: {
          [attribute]: values.reduce((r, v) => {
            r[v] = {$set: true};
            return r;
          }, {}),
        },
      });
    } else {
      setValuesInFilter(attribute, values);
    }
  };

  const removeValuesFromFilter = (attribute, values) => {
    sendPropUpdate({
      valueFilter: {[attribute]: {$unset: values}},
    });
  };

  const moveFilterBoxToTop = (attribute) => {
    setState(prevState => ({
      ...prevState,
      maxZIndex: prevState.maxZIndex + 1,
      zIndices: {
        ...prevState.zIndices,
        [attribute]: prevState.maxZIndex + 1
      }
    }));
  };

  const isOpen = (dropdown) => {
    return state.openDropdown === dropdown;
  };

  const makeDnDCell = (items, onChange, classes) => {
    return (
      <Sortable
        options={{
          group: 'shared',
          ghostClass: 'pvtPlaceholder',
          filter: '.pvtFilterBox',
          preventOnFilter: false,
        }}
        tag="td"
        className={classes}
        onChange={onChange}
      >
        {items.map(x => (
          <DraggableAttribute
            name={x}
            key={x}
            attrValues={state.attrValues[x]}
            valueFilter={props.valueFilter[x] || {}}
            sorter={getSort(props.sorters, x)}
            menuLimit={props.menuLimit}
            setValuesInFilter={setValuesInFilter}
            addValuesToFilter={addValuesToFilter}
            moveFilterBoxToTop={moveFilterBoxToTop}
            removeValuesFromFilter={removeValuesFromFilter}
            zIndex={state.zIndices[x] || state.maxZIndex}
          />
        ))}
      </Sortable>
    );
  };
  // console.log(props);
  const numValsAllowed = props.aggregators[props.aggregatorName]([])().numInputs || 0;
  const aggregatorCellOutlet = props.aggregators[props.aggregatorName]([])().outlet;
  const rendererName = props.rendererName in props.renderers
    ? props.rendererName
    : Object.keys(props.renderers)[0];

  const sortIcons = {
    key_a_to_z: {
      rowSymbol: '↕',
      colSymbol: '↔',
      next: 'value_a_to_z',
    },
    value_a_to_z: {
      rowSymbol: '↓',
      colSymbol: '→',
      next: 'value_z_to_a',
    },
    value_z_to_a: {
      rowSymbol: '↑',
      colSymbol: '←',
      next: 'key_a_to_z'
    },
  };

  const rendererCell = (
    <td className="pvtRenderers">
      <Dropdown
        current={rendererName}
        values={Object.keys(props.renderers)}
        open={isOpen('renderer')}
        zIndex={isOpen('renderer') ? state.maxZIndex + 1 : 1}
        toggle={() =>
          setState(prevState => ({
            ...prevState,
            openDropdown: isOpen('renderer') ? false : 'renderer',
          }))
        }
        setValue={propUpdater('rendererName')}
      />
    </td>
  );

  const aggregatorCell = (
    <td className="pvtVals">
      <Dropdown
        current={props.aggregatorName}
        values={Object.keys(props.aggregators)}
        open={isOpen('aggregators')}
        zIndex={isOpen('aggregators') ? state.maxZIndex + 1 : 1}
        toggle={() =>
          setState(prevState => ({
            ...prevState,
            openDropdown: isOpen('aggregators') ? false : 'aggregators',
          }))
        }
        setValue={propUpdater('aggregatorName')}
      />
      <a
        role="button"
        className="pvtRowOrder"
        onClick={() =>
          propUpdater('rowOrder')(sortIcons[props.rowOrder].next)
        }
      >
        {sortIcons[props.rowOrder].rowSymbol}
      </a>
      <a
        role="button"
        className="pvtColOrder"
        onClick={() =>
          propUpdater('colOrder')(sortIcons[props.colOrder].next)
        }
      >
        {sortIcons[props.colOrder].colSymbol}
      </a>
      {numValsAllowed > 0 && <br />}
      {new Array(numValsAllowed).fill().map((n, i) => [
        <Dropdown
          key={i}
          current={props.vals[i]}
          values={Object.keys(state.attrValues).filter(
            e =>
              !props.hiddenAttributes.includes(e) &&
              !props.hiddenFromAggregators.includes(e)
          )}
          open={isOpen(`val${i}`)}
          zIndex={isOpen(`val${i}`) ? state.maxZIndex + 1 : 1}
          toggle={() =>
            setState(prevState => ({
              ...prevState,
              openDropdown: isOpen(`val${i}`) ? false : `val${i}`,
            }))
          }
          setValue={value =>
            sendPropUpdate({
              vals: {$splice: [[i, 1, value]]},
            })
          }
        />,
        i + 1 !== numValsAllowed ? <br key={`br${i}`} /> : null,
      ])}
      {aggregatorCellOutlet && aggregatorCellOutlet(props.data)}
    </td>
  );

  const unusedAttrs = Object.keys(state.attrValues)
    .filter(
      e =>
        !props.rows.includes(e) &&
        !props.cols.includes(e) &&
        !props.hiddenAttributes.includes(e) &&
        !props.hiddenFromDragDrop.includes(e)
    )
    .sort(sortAs(state.unusedOrder));

  const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0);
  const horizUnused = unusedLength < props.unusedOrientationCutoff;

  const unusedAttrsCell = makeDnDCell(
    unusedAttrs,
    order => setState(prevState => ({ ...prevState, unusedOrder: order })),
    `pvtAxisContainer pvtUnused ${
      horizUnused ? 'pvtHorizList' : 'pvtVertList'
    }`
  );

  console.log("colAttrssssssss",props);

  const colAttrs = props.cols.filter(
    e =>
      !props.hiddenAttributes.includes(e) &&
      !props.hiddenFromDragDrop.includes(e)
  );


  const colAttrsCell = makeDnDCell(
    colAttrs,
    propUpdater('cols'),
    'pvtAxisContainer pvtHorizList pvtCols'
  );

  const rowAttrs = props.rows.filter(
    e =>
      !props.hiddenAttributes.includes(e) &&
      !props.hiddenFromDragDrop.includes(e)
  );

  const rowAttrsCell = makeDnDCell(
    rowAttrs,
    propUpdater('rows'),
    'pvtAxisContainer pvtVertList pvtRows'
  );

  const outputCell = (
    <td className="pvtOutput">
      <PivotTable
        {...update(props, {
          data: {$set: state.materializedInput},
        })}
      />
    </td>
  );

  if (horizUnused) {
    return (
      <table className="pvtUi">
        <tbody onClick={() => setState(prevState => ({ ...prevState, openDropdown: false }))}>
        <tr>
          {rendererCell}
          {unusedAttrsCell}
        </tr>
        <tr>
          {aggregatorCell}
          {colAttrsCell}
        </tr>
        <tr>
          {rowAttrsCell}
          {outputCell}
        </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="pvtUi">
      <tbody onClick={() => setState(prevState => ({ ...prevState, openDropdown: false }))}>
      <tr>
        {rendererCell}
        {aggregatorCell}
        {colAttrsCell}
      </tr>
      <tr>
        {unusedAttrsCell}
        {rowAttrsCell}
        {outputCell}
      </tr>
      </tbody>
    </table>
  );
};

PivotTableUI.propTypes = Object.assign({}, PivotTable.propTypes, {
  onChange: PropTypes.func.isRequired,
  hiddenAttributes: PropTypes.arrayOf(PropTypes.string),
  hiddenFromAggregators: PropTypes.arrayOf(PropTypes.string),
  hiddenFromDragDrop: PropTypes.arrayOf(PropTypes.string),
  unusedOrientationCutoff: PropTypes.number,
  menuLimit: PropTypes.number,
});

PivotTableUI.defaultProps = Object.assign({}, PivotTable.defaultProps, {
  hiddenAttributes: [],
  hiddenFromAggregators: [],
  hiddenFromDragDrop: [],
  unusedOrientationCutoff: 85,
  menuLimit: 500,
});

export default PivotTableUI;