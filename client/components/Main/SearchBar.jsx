import React from 'react';
import PropTypes from 'prop-types';

import {SubNav} from '../UI/SubNav';
import {SearchBox} from '../UI';
import {ActionsSubnavDropdown, CreateNewSubnavDropdown} from './index';

export const SearchBar = ({addEvent, openAgendas, value, search, activeFilter}) => (
    <SubNav>
        <SearchBox label="Search planning" value={value} search={search} activeFilter={activeFilter}/>
        <ActionsSubnavDropdown
            openAgendas={openAgendas}
        />
        <CreateNewSubnavDropdown
            addEvent={addEvent}
        />
    </SubNav>
);

SearchBar.propTypes = {
    addEvent: PropTypes.func.isRequired,
    openAgendas: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    search: PropTypes.func.isRequired,
    activeFilter: PropTypes.string.isRequired
};
