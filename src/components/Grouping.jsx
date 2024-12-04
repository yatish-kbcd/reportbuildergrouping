import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Checkbox from './Checkbox';

const Grouping = ({ rendererName, onChange }) => {
  const [disabled, setDisabled] = useState(true);
  const visible = !!rendererName && rendererName.startsWith('Table');

  if (!visible) {
    return null;
  }

  const handleGroupingChange = (e) => {
    setDisabled(!e.target.checked);
    onChange(e);
  };

  return (
    <div className="row text-center">
      <div className="col-md-2 col-md-offset-3">
        <Checkbox onChange={handleGroupingChange} name="grouping" unchecked={true} />
      </div>
      <fieldset className="col-md-6" disabled={disabled}>
        <Checkbox onChange={onChange} name="compactRows" />
        <Checkbox onChange={onChange} name="rowGroupBefore" />
        <Checkbox onChange={onChange} name="colGroupBefore" unchecked={true} />
      </fieldset>
      <br />
      <br />
    </div>
  );
};

Grouping.propTypes = {
  rendererName: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default Grouping;