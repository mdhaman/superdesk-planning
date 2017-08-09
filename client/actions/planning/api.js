import { PLANNING, ITEM_STATE } from '../../constants'
import { get, cloneDeep, pickBy, isEqual, has } from 'lodash'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { getTimeZoneOffset } from '../../utils/index'
import moment from 'moment'

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const spike = (item) => (
    (dispatch, getState, { api }) => (
        api.update('planning_spike', { ...item }, {})
        .then(() => {
            dispatch({
                type: PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: item,
            })
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} item - The Planning item to unspike
 * @return Promise
 */
const unspike = (item) => (
    (dispatch, getState, { api }) => (
        api.update('planning_unspike', { ...item }, {})

        .then(() => {
            dispatch({
                type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: item,
            })
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher to perform fetch the list of planning items from the server
 * @param {string} eventIds - An event ID to fetch Planning items for that event
 * @param {string} state - Planning item state
 * @param {agendas} list of agenda ids
 * @param {int} page - The page number to query for
 * @return Promise
 */
const query = ({
    eventIds,
    state=ITEM_STATE.ALL,
    agendas,
    noAgendaAssigned=false,
    page=1,
    advancedSearch={},
    onlyFuture,
    fulltext,
}) => (
    (dispatch, getState, { api }) => {
        let query = {}
        let mustNot = []
        let must = []

        if (eventIds) {
            if (Array.isArray(eventIds)) {
                const chunkSize = PLANNING.FETCH_IDS_CHUNK_SIZE
                if (eventIds.length <= chunkSize) {
                    must.push({ terms: { event_item: eventIds } })
                } else {
                    const requests = []
                    for (let i = 0; i < Math.ceil(eventIds.length / chunkSize); i++) {
                        const args = {
                            ...arguments[0],
                            eventIds: eventIds.slice(i * chunkSize, (i + 1) * chunkSize),
                        }
                        requests.push(dispatch(self.query(args)))
                    }

                    // Flatten responses and return a response-like object
                    return Promise.all(requests).then((responses) => (
                        Array.prototype.concat(...responses)
                    ))
                }

            } else {
                must.push({ term: { event_item: eventIds } })
            }
        }

        [
            {
                condition: () => (true),
                do: () => {
                    if (agendas) {
                        must.push({ terms: { agendas: agendas } })
                    } else if (noAgendaAssigned) {
                        let field = { field: 'agendas' }
                        mustNot.push({ constant_score: { filter: { exists: field } } })
                    }
                },
            },
            {
                condition: () => (state === ITEM_STATE.SPIKED),
                do: () => {
                    must.push({ term: { state: ITEM_STATE.SPIKED } })
                },
            },
            {
                condition: () => (state === ITEM_STATE.ACTIVE || !state),
                do: () => {
                    mustNot.push({ term: { state: ITEM_STATE.SPIKED } })
                },
            },
            {
                condition: () => (fulltext),
                do: () => {
                    let query = { bool: { should: [] } }
                    let queryString = {
                        query_string: {
                            query: '(' + fulltext.replace(/\//g, '\\/') + ')',
                            lenient: false,
                            default_operator: 'AND',
                        },
                    }
                    query.bool.should.push(queryString)
                    query.bool.should.push({
                        has_child: {
                            type: 'coverage',
                            query: { bool: { must: [queryString] } },
                        },
                    })
                    must.push(query)
                },
            },
            {
                condition: () => (onlyFuture),
                do: () => {
                    must.push({
                        nested: {
                            path: '_coverages',
                            query: {
                                bool: {
                                    must: [
                                        {
                                            range: {
                                                '_coverages.scheduled': {
                                                    gte: 'now/d',
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    })
                },
            },
            {
                condition: () => (!onlyFuture),
                do: () => {
                    must.push({
                        nested: {
                            path: '_coverages',
                            query: {
                                bool: {
                                    must: [
                                        {
                                            range: {
                                                '_coverages.scheduled': {
                                                    lt: 'now/d',
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    })
                },
            },
            {
                condition: () => (advancedSearch),
                do: () => (true),
            },
        ].forEach((action) => {
            if (action.condition() && !eventIds) {
                action.do()
            }
        })

        query.bool = {
            must,
            must_not: mustNot,
        }

        let sort = [
            {
                '_coverages.scheduled': {
                    order: onlyFuture ? 'asc' : 'desc',
                    nested_path: '_coverages',
                    nested_filter: {
                        range: {
                            '_coverages.scheduled': onlyFuture ? {
                                gte: 'now/d',
                                time_zone: getTimeZoneOffset(),
                            } : {
                                lt: 'now/d',
                                time_zone: getTimeZoneOffset(),
                            },
                        },
                    },
                },
            },
        ]

        if (eventIds) {
            sort = [{ _planning_date: { order: 'asc' } }]
        }

        // Query the API
        return api('planning').query({
            page,
            source: JSON.stringify({
                query,
                sort,
            }),
            embedded: { original_creator: 1 }, // Nest creator to planning
            timestamp: new Date(),
        })
        .then((data) => {
            if (get(data, '_items')) {
                data._items.forEach(_convertCoveragesGenreToObject)
                return Promise.resolve(data._items)
            } else {
                return Promise.reject('Failed to retrieve items')
            }
        }, (error) => (Promise.reject(error)))
    }
)

/**
 * Action dispatcher for requesting a fetch of planning items
 * Then store them in the redux store. This also replaces the list of
 * visibile Planning items for the PlanningList component
 * @param {object} params - Parameters used when fetching the planning items
 * @return Promise
 */
const fetch = (params={}) => (
    (dispatch) => (
        dispatch(self.query(params))
        .then((items) => (
            dispatch(self.fetchPlanningsEvents(items))
            .then(() => {
                dispatch(self.receivePlannings(items))
                return Promise.resolve(items)
            }, (error) => (Promise.reject(error)))
        ), (error) => {
            dispatch(self.receivePlannings([]))
            return Promise.reject(error)
        })
    )
)

/**
 * Action Dispatcher to re-fetch the current list of planning
 * It achieves this by performing a fetch using the params from
 * the store value `planning.lastRequestParams`
 */
const refetch = (page=1, plannings=[]) => (
    (dispatch, getState) => {
        const prevParams = selectors.getPreviousPlanningRequestParams(getState())
        let params = selectors.getPlanningFilterParams(getState())
        params.page = page

        return dispatch(self.query(params))
        .then((items) => {
            plannings = plannings.concat(items)
            page++
            if (get(prevParams, 'page', 1) >= page) {
                return dispatch(self.refetch(page, plannings))
            }

            dispatch(self.receivePlannings(plannings))
            return Promise.resolve(plannings)
        }, (error) => (Promise.reject(error)))
    }
)

/**
 * Action dispatcher to fetch Events associated with Planning items
 * and place them in the local store.
 * @param {Array} plannings - An array of Planning items
 * @return Promise
 */
const fetchPlanningsEvents = (plannings) => (
    (dispatch, getState) => {
        const loadedEvents = selectors.getEvents(getState())
        const linkedEvents = plannings
        .map((p) => p.event_item)
        .filter((eid) => (
            eid && !has(loadedEvents, eid)
        ))

        // load missing events, if there are any
        if (get(linkedEvents, 'length', 0) > 0) {
            return dispatch(actions.silentlyFetchEventsById(linkedEvents, ITEM_STATE.ALL))
        }

        return Promise.resolve([])
    }
)

/**
 * Action Dispatcher that fetches a Planning Item by ID
 * and adds or updates it in the redux store.
 * If the Planning item already exists in the local store, then don't
 * fetch the Planning item from the API
 * @param {string} pid - The ID of the Planning item to fetch
 * @param {boolean} force - Force using the API instead of local store
 * @return Promise
 */
const fetchPlanningById = (pid, force=false) => (
    (dispatch, getState, { api }) => {
        // Test if the Planning item is already loaded into the store
        // If so, return that instance instead
        const storedPlannings = selectors.getStoredPlannings(getState())
        if (has(storedPlannings, pid) && !force) {
            return Promise.resolve(storedPlannings[pid])
        }

        return api('planning').getById(pid)
        .then((item) => (
            dispatch(self.fetchPlanningsEvents([_convertCoveragesGenreToObject(item)]))
            .then(() => {
                dispatch(self.receivePlannings([item]))
                return Promise.resolve(item)
            }, (error) => (Promise.reject(error)))
        ), (error) => {
            dispatch(self.receivePlannings([]))
            return Promise.reject(error)
        })
    }
)

/**
 * Action Dispatcher that fetches a Coverage by ID and adds or updates it
 * in the redux store for the associated Planning item
 * @param {string} cid - The ID of the Coverage to fetch
 * @return Promise
 */
const fetchCoverageById = (cid) => (
    (dispatch, getState, { api }) => (
        api('coverage').getById(cid)
        .then((coverage) => {
            _convertCoverageGenreToObject(coverage)
            dispatch(self.receiveCoverage(coverage))
            return Promise.resolve(coverage)
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action Dispatcher to fetch planning history from the server
 * This will add the history of action on that planning item in planning history list
 * @param {object} currentPlanningId - Query parameters to send to the server
 * @return arrow function
 */
const fetchPlanningHistory = (currentPlanningId) => (
    (dispatch, getState, { api }) => (
        // Query the API and sort by created
        api('planning_history').query({
            where: { planning_id: currentPlanningId },
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
        .then(data => {
            dispatch(self.receivePlanningHistory(data._items))
            return Promise.resolve(data)
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action to receive the history of actions on planning item
 * @param {array} planningHistoryItems - An array of planning history items
 * @return object
 */
const receivePlanningHistory = (planningHistoryItems) => ({
    type: PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY,
    payload: planningHistoryItems,
})

/**
 * Action dispatcher to load a Planning item from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {object} query - The query used to query the Planning items
 * @return Promise
 */
const loadPlanning = (query) => (
    (dispatch) => (
        dispatch(self.query(query))
        .then((data) => {
            dispatch(self.receivePlannings(data))
            return Promise.resolve(data)
        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Action dispatcher to load Planning items by ID from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 * @param {string} state - The state of the Planning items
 * @return Promise
 */
const loadPlanningById = (ids=[], state = ITEM_STATE.ALL) => (
    (dispatch, getState, { api }) => {
        if (Array.isArray(ids)) {
            return dispatch(self.loadPlanning({
                ids,
                state,
            }))
        } else {
            return api('planning').getById(ids)
            .then((item) => {
                _convertCoveragesGenreToObject(item)
                dispatch(self.receivePlannings([item]))
                return Promise.resolve([item])
            }, (error) => (Promise.reject(error)))
        }
    }
)

/**
 * Action dispatcher to load Planning items by Event ID from the API, and place them
 * in the local store. This does not update the list of visible Planning items
 * @param {string} eventIds - The Event ID used to query the API
 * @param {string} state - The state of the Planning items
 * @return Promise
 */
const loadPlanningByEventId = (eventIds, state = ITEM_STATE.ALL) => (
    (dispatch) => (
        dispatch(self.loadPlanning({
            eventIds,
            state,
        }))
    )
)

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item instead
 * @param {object} item - The Planning item to save
 * @param {object} original - If supplied, will use this as the original Planning item
 * @return Promise
 */
const save = (item, original=undefined) => (
    (dispatch, getState, { api }) => (
        // Find the original (if it exists) either from the store or the API
        new Promise((resolve, reject) => {
            if (original !== undefined) {
                return resolve(original)
            } else if (get(item, '_id')) {
                return dispatch(self.fetchPlanningById(item._id))
                .then(
                    (item) => (resolve(item)),
                    (error) => (reject(error))
                )
            } else {
                return resolve({})
            }
        })
        .then((originalItem) => {
            // remove all properties starting with _,
            // otherwise it will fail for "unknown field" with `_type`
            item = pickBy(item, (v, k) => (!k.startsWith('_')))
            // clone and remove the nested coverages to save them later
            const coverages = cloneDeep(item.coverages)
            delete item.coverages
            // remove nested original creator
            delete item.original_creator

            if (item.agendas) {
                item.agendas = item.agendas.map((agenda) => agenda._id || agenda)
            }

            if (!get(originalItem, '_id')) {
                return api('planning').save(cloneDeep(originalItem), item)
                .then(
                    (item) => (Promise.resolve(item)),
                    (error) => (Promise.reject(error))
                )
            }

            return dispatch(self.saveAndDeleteCoverages(
                    coverages,
                    originalItem,
                    get(originalItem, 'coverages', [])
            ))
            .then(() => (
                api('planning').save(cloneDeep(originalItem), item)
                .then(
                    (item) => (Promise.resolve(item)),
                    (error) => (Promise.reject(error))
                )
            ), (error) => (Promise.reject(error)))

        }, (error) => (Promise.reject(error)))
    )
)

/**
 * Saves or deletes coverages through the API to
 * the given planning based on the original coverages
 * @param {array, object} coverages - An array of coverage objects
 * @param {object} item - The associated planning item
 * @param {object} originalCoverages - The original version of the coverage list
 * @return Promise
 */
const saveAndDeleteCoverages = (coverages, item, originalCoverages) => (
    (dispatch, getState, { api }) => {
        const promises = []

        // Saves coverages
        if (get(coverages, 'length', 0) > 0) {
            coverages.forEach((coverage) => {
                // patch or post ? look for an original coverage
                const originalCoverage = originalCoverages.find((c) => (
                    c._id === coverage._id
                ))

                // If the coverage is scheduled, convert it to a moment instance
                // so the lodash.isEqual function can compare it with the new coverage
                if (get(originalCoverage, 'planning.scheduled')) {
                    originalCoverage.planning.scheduled = moment(
                        originalCoverage.planning.scheduled
                    )
                }

                // Make sure that the updated coverage schedule is
                // a moment instance as well
                if (get(coverage, 'planning.scheduled')) {
                    coverage.planning.scheduled = moment(coverage.planning.scheduled)
                }

                // Only update the coverage if it has changed
                if (!isEqual(coverage, originalCoverage)) {
                    coverage.planning_item = item._id

                    // Convert genre back to an Array
                    if (get(coverage, 'planning.genre')) {
                        coverage.planning.genre = [coverage.planning.genre]
                    }

                    promises.push(
                        api('coverage').save(cloneDeep(originalCoverage || {}), coverage)
                    )
                }
            })
        }

        // Deletes coverages
        if (get(originalCoverages, 'length', 0) > 0) {
            originalCoverages.forEach((originalCoverage) => {
                // if there is a coverage in the original planning that is not anymore
                // in the planning, we delete it
                if (coverages.findIndex((c) => (
                    c._id && c._id === originalCoverage._id
                )) === -1) {
                    promises.push(
                        api('coverage').remove(originalCoverage)
                    )
                }
            })
        }

        // returns the up to date planning when all is done
        return Promise.all(promises)
    }
)

/**
 * Saves the supplied planning item and reload the
 * list of Agendas and their associated planning items.
 * If the planning item does not have an ._id, then add it to the
 * currently selected Agenda
 * If no Agenda is selected, or the currently selected Agenda is spiked,
 * then notify the end user and reject this action
 * @param {object} item - The planning item to save
 * @return Promise
 */
const saveAndReloadCurrentAgenda = (item) => (
    (dispatch, getState) => (
        new Promise((resolve, reject) => {
            if (get(item, '_id')) {
                return dispatch(self.fetchPlanningById(item._id))
                .then(
                    (item) => (resolve(item)),
                    (error) => (reject(error))
                )
            } else {
                return resolve({})
            }
        })
        .then((originalItem) => {
            if (isEqual(originalItem, {})) {
                const currentAgenda = selectors.getCurrentAgenda(getState())
                const currentAgendaId = selectors.getCurrentAgendaId(getState())
                const errorMessage = { data: {} }

                if (!currentAgendaId) {
                    errorMessage.data._message = 'No Agenda is currently selected.'
                    return Promise.reject(errorMessage)
                } else if (currentAgenda && !currentAgenda.is_enabled) {
                    errorMessage.data._message =
                        'Cannot create a new planning item in a disabled Agenda.'
                    return Promise.reject(errorMessage)
                }

                item.agendas = currentAgenda ? [currentAgenda] : []
            }

            return dispatch(self.save(item, originalItem))
            .then(
                (item) => (Promise.resolve(item)),
                (error) => (Promise.reject(error))
            )
        })
    )
)

/**
 * Action for updating the list of planning items in the redux store
 * @param  {array, object} plannings - An array of planning item objects
 * @return action object
 */
const receivePlannings = (plannings) => ({
    type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
    payload: plannings,
})

/**
 * Action for updating Planning item's coverage in the redux store
 * @param {object} coverage - The Coverage to add to the store
 */
const receiveCoverage = (coverage) => ({
    type: PLANNING.ACTIONS.RECEIVE_COVERAGE,
    payload: coverage,
})

/**
 * Action dispatcher that attempts to unlock a Planning item through the API
 * @param {object} item - The Planning item to unlock
 * @return Promise
 */
const unlock = (item) => (
    (dispatch, getState, { api }) => (
        api('planning_unlock', item).save({})
    )
)

/**
 * Action dispatcher that attempts to lock a Planning item through the API
 * @param {object} item - The Planning item to lock
 * @return Promise
 */
const lock = (item) => (
    (dispatch, getState, { api }) => (
        api.save(
            'planning_lock',
            {},
            { lock_action: 'edit' },
            { _id: item }
        )
    )
)

/**
 * Utility to convert a Planning item's coverage's genre from an Array to an Object
 * @param {object} plan - The planning item to modify it's coverages
 * @return {object} planning item provided
 */
const _convertCoveragesGenreToObject = (plan) => {
    get(plan, 'coverages', []).forEach(_convertCoverageGenreToObject)
    return plan
}

/**
 * Utility to convert coverage genre from an Array to an Object
 * @param {object} coverage - The coverage to modify
 * @return {object} coverage item provided
 */
const _convertCoverageGenreToObject = (coverage) => {
    // Make sure the coverage has a planning field
    if (!('planning' in coverage)) coverage.planning = {}

    // Convert genre from an Array to an Object
    coverage.planning.genre = get(coverage, 'planning.genre[0]')

    return coverage
}

const self = {
    spike,
    unspike,
    query,
    fetch,
    receivePlannings,
    receiveCoverage,
    save,
    saveAndDeleteCoverages,
    saveAndReloadCurrentAgenda,
    fetchCoverageById,
    fetchPlanningById,
    fetchPlanningsEvents,
    unlock,
    lock,
    loadPlanning,
    loadPlanningById,
    fetchPlanningHistory,
    receivePlanningHistory,
    loadPlanningByEventId,
    refetch,
}

export default self
