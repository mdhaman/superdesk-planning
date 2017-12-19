import {EVENTS_PLANNING} from '../constants';
import {eventUtils} from '../utils';
import {cloneDeep, keyBy, sortBy, get, omit} from 'lodash';

const initialState = {
    eventsAndPlanningInList: [],
    search: {
        currentSearch: undefined,
        advancedSearchOpened: false,
    },
    relatedPlannings: {}
};

const modifyEventsPlanning = (state, action) => {
    let eventsPlanning = keyBy(cloneDeep(state.eventsAndPlanningInList || []), 'date');
    let eventsPlanningToAdd = keyBy(eventUtils.getEventsPlanningByDate(action.payload), 'date');

    Object.keys(eventsPlanningToAdd).forEach((eventDate) => {
        eventsPlanning[eventDate] = eventsPlanningToAdd[eventDate];
    });

    return sortBy(Object.values(eventsPlanning), [(e) => (e.date)]);
};

export default function(state = initialState, action) {
    let eventId;

    switch (action.type) {
    case EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST:
        return {
            ...state,
            eventsAndPlanningInList: eventUtils.getEventsPlanningByDate(action.payload)
        };
    case EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST:
        return {
            ...state,
            eventsAndPlanningInList: modifyEventsPlanning(state, action)
        };
    case EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST:
        return {
            ...state,
            eventsAndPlanningInList: []
        };
    case EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS:
        eventId = get(action, 'payload._id');
        if (!eventId) {
            return state;
        }

        return {
            ...state,
            relatedPlannings: {
                ...state.relatedPlannings,
                [eventId]: get(action, 'payload.planning_ids', [])
            }
        };
    case EVENTS_PLANNING.ACTIONS.HIDE_RELATED_PLANNINGS:
        eventId = get(action, 'payload._id');
        if (!eventId) {
            return state;
        }

        return {
            ...state,
            relatedPlannings: omit(state.relatedPlannings, eventId)
        };
    case EVENTS_PLANNING.ACTIONS.CLEAR_RELATED_PLANNINGS:
        return {
            ...state,
            relatedPlannings: {}
        };
    default:
        return state;
    }
}