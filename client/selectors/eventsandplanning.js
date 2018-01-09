import {createSelector} from 'reselect';
import {get} from 'lodash';
import {storedEvents} from './events';
import {storedPlannings} from './planning';

export const getEventsPlanningList = (state) => get(state, 'eventsAndPlanning.eventsAndPlanningInList', []);
export const getRelatedPlanningsList = (state) => get(state, 'eventsAndPlanning.relatedPlannings', {});
export const getCurrentSearch = (state) =>
    get(state, 'eventsAndPlanning.search.currentSearch', {});
export const getPreviousRequestParams = (state) =>
    get(state, 'eventsAndPlanning.lastRequestParams', {});

export const orderedEventsPlanning = createSelector(
    [storedEvents, storedPlannings, getEventsPlanningList],
    (events, plannings, eventPlanningList) => {
        let groupedList = [];

        eventPlanningList.forEach((e) => {
            let group = {
                date: e.date,
                events: []
            };

            e.events.forEach((data) => {
                if (data._type === 'events' && events[data._id]) {
                    group.events.push(events[data._id]);
                }

                if (data._type === 'planning' && plannings[data._id]) {
                    group.events.push(plannings[data._id]);
                }
            });

            groupedList.push(group);
        });

        return groupedList;
    }
);

export const getRelatedPlanningsInList = createSelector(
    [storedPlannings, getRelatedPlanningsList],
    (plannings, relatedPlanningsList) => {
        let relatedPlannings = {};

        Object.keys(relatedPlanningsList).forEach((eventId) => {
            let planningIds = get(relatedPlanningsList, eventId, []);

            relatedPlannings[eventId] = planningIds.map((pid) => get(plannings, pid, {}));
        });

        return relatedPlannings;
    }
);


export const getEventsPlaningFilterParams = createSelector(
    [getCurrentSearch],
    (search) => ({
        fulltext: null,
        advancedSearch: search,
        page: 1
    })
);