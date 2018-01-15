import {createSelector} from 'reselect';
import {get} from 'lodash';
import {storedEvents} from './events';
import {storedPlannings} from './planning';

export const getEventsPlanningList = (state) => get(state, 'eventsPlanning.eventsAndPlanningInList', []);
export const getRelatedPlanningsList = (state) => get(state, 'eventsPlanning.relatedPlannings', {});

/**
 * Selector for Ordered Events and adHoc Planning.
 * @type {Reselect.Selector<any, any>}
 */
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
                if (data._type === 'events' && get(events, data._id)) {
                    group.events.push(events[data._id]);
                }

                if (data._type === 'planning' && get(plannings, data._id)) {
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
