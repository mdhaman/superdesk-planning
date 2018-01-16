import {pick, get} from 'lodash';
import {SPIKED_STATE, MAIN} from '../../constants';
import eventsApi from '../events/api';
import planningApi from '../planning/api';
import {getTimeZoneOffset, planningUtils, eventUtils} from '../../utils';
import * as selectors from '../../selectors';

/**
 * Action Dispatcher for query the api for events and planning combined view
 * You can provide one of the following parameters to fetch from the server
 */
const query = ({
    advancedSearch = {},
    fulltext,
    spikeState = SPIKED_STATE.NOT_SPIKED,
    page = 1,
    maxResults = 25,
}) => (
    (dispatch, getState, {api}) => {
        const filter = {};

        let search = {
            fulltext: fulltext,
            spikeState: spikeState,
            adHocPlanning: true, // only adhoc planning items,
            advancedSearch: pick(advancedSearch,
                ['anpa_category', 'subject', 'slugline', 'pubstatus'])
        };

        const planningCriteria = planningApi.getCriteria(search);
        const eventsCriteria = eventsApi.getCriteria(search);

        filter.or = {
            filters: [
                {
                    and: {
                        filters: [
                            {type: {value: 'events'}},
                            eventsCriteria.filter
                        ]
                    }
                },
                {
                    and: {
                        filters: [
                            {type: {value: 'planning'}},
                            planningCriteria.filter
                        ]
                    }
                }
            ]
        };

        let sort = [
            {
                '_planning_schedule.scheduled': {
                    order: 'asc',
                    nested_path: '_planning_schedule',
                    nested_filter: {
                        range: {
                            '_planning_schedule.scheduled': {
                                gte: 'now/d',
                                time_zone: getTimeZoneOffset(),
                            }
                        },
                    },
                },
            },
        ];

        // Query the API
        return api('planning_search').query({
            source: JSON.stringify({
                query: planningCriteria.query,
                filter: filter,
                sort: sort,
                size: maxResults,
                from: (page - 1) * maxResults
            }),
            timestamp: new Date(),
        })
            .then((data) => {
                if (get(data, '_items')) {
                    const events = [];
                    const planning = [];

                    data._items.forEach((item) => {
                        if (item._type === 'events') {
                            eventUtils.convertToMoment(item);
                            events.push(item);
                            return;
                        }
                        planningUtils.convertCoveragesGenreToObject(item);
                        planning.push(item);
                    });

                    return Promise.resolve({
                        events,
                        planning
                    });
                } else {
                    return Promise.reject('Failed to retrieve items');
                }
            }, (error) => (Promise.reject(error)));
    }
);

/**
 * Action Dispatcher to re-fetch the current list of planning
 * It achieves this by performing a fetch using the params from
 * the store value `planning.lastRequestParams`
 */
const refetch = (page = 1, results = {events: [], planning: []}) => (
    (dispatch, getState) => {
        if (selectors.main.activeFilter(getState()) !== MAIN.FILTERS.COMBINED) {
            return Promise.resolve({});
        }

        const prevParams = selectors.main.lastRequestParams(getState());
        let currentPage = page;
        let params = {
            ...prevParams,
            currentPage
        };

        return dispatch(self.query(params))
            .then((items) => {
                results.events = results.events.concat(items.events);
                results.planning = results.planning.concat(items.planning);
                currentPage++;
                if (get(prevParams, 'page', 1) >= currentPage) {
                    return dispatch(self.refetch(currentPage, results));
                }
                return Promise.resolve(results);
            }, (error) => (Promise.reject(error)));
    }
);

// eslint-disable-next-line consistent-this
const self = {
    query,
    refetch
};

export default self;