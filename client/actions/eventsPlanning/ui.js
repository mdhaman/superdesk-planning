import {get} from 'lodash';

import eventsAndPlanningApi from './api';
import eventsApi from '../events/api';
import planningApi from '../planning/api';
import {EVENTS_PLANNING} from '../../constants';


const fetch = (params = {}) => (
    (dispatch, getState) => dispatch(eventsAndPlanningApi.query(params))
        .then((results) => {
            dispatch(eventsApi.receiveEvents(results.events));
            dispatch(planningApi.receivePlannings(results.planning));
            dispatch(self.setInList(results));
        })
);

const setInList = (payload) => ({
    type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
    payload: payload
});

const addToList = (payload) => ({
    type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
    payload: payload
});

const clearList = () => ({
    type: EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST
});

/**
 * Action to load related plannings for an event
 * @param {object} event - Event Object
 * @return array - Array of nested planning items
 */
const showRelatedPlannings = (event) => (
    (dispatch, getState) => dispatch(eventsApi.loadAssociatedPlannings(event))
        .then((plannings) => {
            if (get(plannings, 'length', 0)) {
                dispatch(self._showRelatedPlannings(event));
            }
            return Promise.resolve(plannings);
        })
);

const _showRelatedPlannings = (event) => ({
    type: EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS,
    payload: event
});

const hideRelatedPlannings = (event) => ({
    type: EVENTS_PLANNING.ACTIONS.HIDE_RELATED_PLANNINGS,
    payload: event
});

const clearRelatedPlannings = () => ({
    type: EVENTS_PLANNING.ACTIONS.CLEAR_RELATED_PLANNINGS
});

// eslint-disable-next-line consistent-this
const self = {
    fetch,
    setInList,
    addToList,
    clearList,
    showRelatedPlannings,
    _showRelatedPlannings,
    hideRelatedPlannings,
    clearRelatedPlannings
};

export default self;
