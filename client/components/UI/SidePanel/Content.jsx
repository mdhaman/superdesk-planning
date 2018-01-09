import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Content = ({children, className, flex}) => (
    <div
        className={classNames(
            'side-panel__content',
            {'side-panel__content--flex': flex},
            className
        )}
    >
        {children}
    </div>
);

Content.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    flex: PropTypes.bool
};

Content.defaultProps = {
    flex: false
};