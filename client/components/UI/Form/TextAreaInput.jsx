import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {LineInput, Label, TextArea} from './';

import './style.scss';

export const TextAreaInput = ({
    field,
    value,
    label,
    onChange,
    autoHeight,
    autoHeightTimeout,
    nativeOnChange,
    placeholder,
    readOnly,
    maxLength,
    ...props
}) => (
    <LineInput {...props} readOnly={readOnly}>
        <Label text={label}/>
        <TextArea
            field={field}
            value={value}
            onChange={onChange}
            autoHeight={autoHeight}
            autoHeightTimeout={autoHeightTimeout}
            nativeOnChange={nativeOnChange}
            placeholder={placeholder}
            readOnly={readOnly}
        />

        {maxLength > 0 &&
            <div className="sd-line-input__char-count">{get(value, 'length', 0)}/{maxLength}</div>
        }
    </LineInput>
);

TextAreaInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    maxLength: PropTypes.number,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noLabel: PropTypes.bool,
    noMargin: PropTypes.bool,
    autoHeight: PropTypes.bool,
    autoHeightTimeout: PropTypes.number,
    nativeOnChange: PropTypes.bool,
    placeholder: PropTypes.string,
};

TextAreaInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    autoHeight: true,
    autoHeightTimeout: 50,
    nativeOnChange: false,
    maxLength: 0,
};
