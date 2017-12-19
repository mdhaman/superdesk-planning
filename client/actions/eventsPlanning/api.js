import {pick} from 'lodash';
import {SPIKED_STATE} from '../../constants';
import eventsApi from '../events/api';
import planningApi from '../planning/api';

/**
 * Action Dispatcher for query the api for events and planning combined view
 * You can provide one of the following parameters to fetch from the server
 */
const query = ({
    advancedSearch = {},
    fulltext,
    spikeState = SPIKED_STATE.NOT_SPIKED,
}) => (
    (dispatch, getState, {api}) => {
        let eventsSearch = {
            fulltext: fulltext,
            spikeState: spikeState
        };

        eventsSearch.advancedSearch = pick(advancedSearch,
            ['anpa_category', 'subject', 'slugline', 'pubstatus', 'dates']);

        let planningSearch = {
            fulltext: fulltext,
            spikeState: spikeState,
            adHocPlanning: true, // only adhoc planning items,
            onlyFuture: !advancedSearch.dates,
        };

        planningSearch.advancedSearch = pick(advancedSearch,
            ['anpa_category', 'subject', 'slugline', 'pubstatus', 'dates']);

        return Promise.all([
            dispatch(eventsApi.query(eventsSearch)),
            dispatch(planningApi.query(planningSearch))
        ])
            .then(([events, planning]) => ({
                events,
                planning,
            }));
    }
);


// eslint-disable-next-line consistent-this
const self = {
    query
};

export default self;