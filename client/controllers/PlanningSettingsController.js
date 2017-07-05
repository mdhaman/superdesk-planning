import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, registerNotifications } from '../utils'
import * as actions from '../actions'
import { PlanningSettingsApp } from '../components'

PlanningSettingsController.$inject = [
    '$scope',
    '$element',
    'api',
    'config',
    'superdesk',
    'notify',
    'privileges',
    'userList',
    'session',
]
export function PlanningSettingsController(
    $scope,
    $element,
    api,
    config,
    superdesk,
    notify,
    privileges,
    userList,
    session
) {
    // create the application store
    const store = createStore({
        initialState: { config: config },
        extraArguments: {
            api,
            $scope,
            superdesk,
            notify,
            privileges,
            userList,
            session,
        },
    })
    // load data in the store
    store.dispatch(actions.loadPrivileges())
    store.dispatch(actions.fetchAgendas())
    store.dispatch(actions.loadUsers())
    store.dispatch(actions.loadSessionDetails())

    registerNotifications($scope, store)
    $scope.$on('$destroy', () => {
        // Unmount the React application
        ReactDOM.unmountComponentAtNode($element.get(0))
    })

    ReactDOM.render(
        <Provider store={store}>
            <PlanningSettingsApp/>
        </Provider>, $element.get(0))
}
