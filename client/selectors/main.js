import {createSelector} from 'reselect';
import {get} from 'lodash';
import {MAIN} from '../constants';
import {orderedEvents} from './events';
import {orderedPlanningList} from './planning';
import {orderedEventsPlanning} from './eventsandplanning';


export const activeFilter = (state) => get(state, 'main.filter', MAIN.FILTERS.COMBINED);
export const previewItem = (state) => get(state, 'main.previewItem', null);
export const editItem = (state) => get(state, 'main.editItem', null);
export const itemGroups = createSelector(
    [activeFilter, orderedEvents, orderedPlanningList, orderedEventsPlanning],
    (filter, events, plans, eventsPlannings) => {
        switch (filter) {
        case MAIN.FILTERS.COMBINED:
            return eventsPlannings;
        case MAIN.FILTERS.EVENTS:
            return events;
        case MAIN.FILTERS.PLANNING:
            return plans;
        }

        return [];
    }
);

export const searchParams = (state) => get(state, 'main.search', {});

export const currentSearch = createSelector(
    [activeFilter, searchParams],
    (filter, params) => {
        return get(params, `${filter}.currentSearch`, {});
    }
);

export const lastRequestParams = createSelector(
    [activeFilter, searchParams],
    (filter, params) => {
        return get(params, `${filter}.lastRequestParams`, {});
    }
);

export const fullText = createSelector(
    [activeFilter, searchParams],
    (filter, params) => {
        return get(params, `${filter}.fullText`, {});
    }
);
