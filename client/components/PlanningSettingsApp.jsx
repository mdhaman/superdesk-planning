import React from 'react'
import { connect } from 'react-redux'
import {
    PlanningSettingsContainer
} from './index'

const PlanningSettingsAppComponent = () => {
    return (
        <PlanningSettingsContainer/>
    )
}

PlanningSettingsAppComponent.propTypes = { }

const mapStateToProps = (state) => ({})

export const PlanningSettingsApp = connect(mapStateToProps)(PlanningSettingsAppComponent)
