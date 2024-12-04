import React from 'react';
import PropTypes from 'prop-types';

const Checkbox = ({ name, onChange, unchecked }) => (
  <label className="checkbox-inline" style={{ textTransform: 'capitalize' }}>
    <input
      type="checkbox"
      name={name}
      onChange={onChange}
      defaultChecked={!unchecked}
    />
    {' '}
    {name.replace(/([A-Z])/g, ' $1')}
  </label>
);

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  unchecked: PropTypes.bool,
};

Checkbox.defaultProps = {
  unchecked: false,
};

export default Checkbox;