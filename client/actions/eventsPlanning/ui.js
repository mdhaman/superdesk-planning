import {get} from 'lodash';

import eventsAndPlanningApi from './api';
import eventsApi from '../events/api';
import planningApi from '../planning/api';
import {EVENTS_PLANNING} from '../../constants';
import * as selectors from '../../selectors';

/**
 * Action to fetch events and planning based on the params
 * @param {object} params - Params Object
 * @return object - Object containing array of events and planning
 */
const fetch = (params = {}) => (
    (dispatch, getState) => {
        dispatch(self.requestEventsPlanning(params));

        return dispatch(eventsAndPlanningApi.query(params))
            .then((results) => {
                dispatch(eventsApi.receiveEvents(results.events));
                dispatch(planningApi.receivePlannings(results.planning));
                dispatch(self.setInList(results));
            });
    }
);

/**
 * Action to load next page of the events and planning object
 * @return object - Object containing array of events and planning
 */
const loadMore = () => (
    (dispatch, getState) => {
        console.log('loadMore');
        const previousParams = selectors.eventsAndPlanning.getPreviousRequestParams(getState());
        const params = {
            ...previousParams,
            page: get(previousParams, 'page', 0) + 1,
        };

        dispatch(self.requestEventsPlanning(params));
        return dispatch(eventsAndPlanningApi.query(params))
            .then((results) => {
                dispatch(eventsApi.receiveEvents(results.events));
                dispatch(planningApi.receivePlannings(results.planning));
                dispatch(self.addToList(results));
            });
    }
);

const setInList = ({events = [], planning = []}) => ({
    type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
    payload: {events, planning}
});

const addToList = ({events = [], planning = []}) => ({
    type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
    payload: {events, planning}
});

const clearList = () => ({
    type: EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST
});

/**
 * Action to load related plannings for an event
 * @param {object} event - Event Object
 * @return array - Array of planning items related to the event
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

const requestEventsPlanning = (payload = {}) => ({
    type: EVENTS_PLANNING.ACTIONS.REQUEST_EVENTS_PLANNING_LIST,
    payload: payload
});

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
    clearRelatedPlannings,
    loadMore,
    requestEventsPlanning,
};

export default self;
