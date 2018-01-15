import {MAIN} from '../constants';
import {cloneDeep, get} from 'lodash';

const search = {
    lastRequestParams: {page: 1},
    fulltext: undefined,
    currentSearch: undefined
};

const initialState = {
    previewItem: null,
    editItem: null,
    filter: null,
    search: {
        [MAIN.FILTERS.EVENTS]: cloneDeep(search),
        [MAIN.FILTERS.PLANNING]: cloneDeep(search),
        [MAIN.FILTERS.COMBINED]: cloneDeep(search)
    }
};

const modifyParams = (state, action) => {
    let params = cloneDeep(state.search) || {};

    Object.keys(action.payload).forEach((key) => {
        const payloadParam = get(action.payload, key, {});

        params[key] = {
            ...params[key],
            ...payloadParam
        };

        params[key].lastRequestParams = {
            ...search.lastRequestParams,
            ...payloadParam
        };
    });

    return params;
};

export default function(state = initialState, action) {
    switch (action.type) {
    case MAIN.ACTIONS.PREVIEW:
        return {...state, previewItem: action.payload || null};

    case MAIN.ACTIONS.EDIT:
        return {...state, editItem: action.payload || null};

    case MAIN.ACTIONS.FILTER:
        return {...state, filter: action.payload || MAIN.FILTERS.COMBINED};

    case MAIN.ACTIONS.CLOSE_PREVIEW:
        return {...state, previewItem: null};

    case MAIN.ACTIONS.REQUEST:
        return {
            ...state,
            search: modifyParams(state, action)
        };
    default:
        return state;
    }
}
