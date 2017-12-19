import {createSelector} from 'reselect';
import {get, sortBy, cloneDeep} from 'lodash';
import moment from 'moment';
import {isItemLockedInThisSession} from '../utils';
import {session} from './general';
import {planningUtils} from '../utils';


const storedEvents = (state) => get(state, 'events.events', {});

export const storedPlannings = (state) => get(state, 'planning.plannings', {});
export const planIdsInList = (state) => get(state, 'planning.planningsInList', []);

export const agendas = (state) => get(state, 'agenda.agendas', []);
export const currentAgendaId = (state) => get(state, 'agenda.currentAgendaId', null);
export const currentPlanningId = (state) => get(state, 'planning.currentPlanningId');

export const currentPlanning = createSelector(
    [currentPlanningId, storedPlannings],
    (currentPlanningId, storedPlannings) => {
        if (typeof currentPlanningId === 'string') {
            return storedPlannings[currentPlanningId];
        } else if (typeof currentPlanningId === 'object') {
            return currentPlanningId;
        }
    }
);

export const currentAgenda = createSelector(
    [agendas, currentAgendaId],
    (agendas, agendaId) => (
        agendas.find((a) => a._id === agendaId)
    )
);

/** Used for the planning list */
export const plansInList = createSelector(
    [storedPlannings, planIdsInList],
    (plans, planIds) => (
        cloneDeep(planIds.map((planId) => plans[planId]))
    )
);

export const orderedPlanningList = createSelector(
    [currentAgenda, plansInList, storedEvents],
    (currentAgenda, plansInList, events) => planningUtils.getPlanningByDate(plansInList, events)
);


export const isCurrentPlanningLockedInThisSession = createSelector(
    [currentPlanning, session],
    (currentPlanning, session) => (
        currentPlanning && isItemLockedInThisSession(currentPlanning, session)
    )
);