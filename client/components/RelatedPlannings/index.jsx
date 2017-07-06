import React from 'react'
import { connect } from 'react-redux'
import './style.scss'
import * as selectors from '../../selectors'
import * as actions from '../../actions'

export const RelatedPlanningsComponent = ({ plannings, openPlanningItem, openPlanningClick }) => (
    <ul className="related-plannings">
        {plannings.map(({
            _id,
            slugline,
            anpa_category,
            _agendas,
            original_creator: { display_name },
            state,
        }) => (
            <li key={_id}>
                <i className="icon-list-alt"/>&nbsp;
                {state && state === 'spiked' &&
                    <span className="label label--alert">spiked</span>
                }
                Created by { display_name } in {
                    _agendas.map((_agenda) => (
                        _agenda &&
                            <span>
                                <a onClick={ openPlanningItem ? openPlanningClick.bind(null, _id, _agenda) : null}>
                                    {
                                        _agenda.is_enabled ? `${_agenda.name}` : `${_agenda.name} - [Disabled]`
                                    }
                                </a>
                            ,&nbsp;</span>
                    ))
                }
                {anpa_category && anpa_category.length && (
                    <span>&nbsp;[{anpa_category.map((c) => c.name).join(', ')}]</span>
                    )
                }
            </li>
        ))}
    </ul>
)

RelatedPlanningsComponent.propTypes = {
    plannings: React.PropTypes.array.isRequired,
    openPlanningItem: React.PropTypes.bool,
    openPlanningClick: React.PropTypes.func.isRequired,
}

const mapStateToProps = (state, ownProps) => ({
    plannings: ownProps.plannings.map((planning) => {
        return {
            ...planning,
            _agendas: !planning.agendas ? [] : planning.agendas.map((agendaId) =>
                selectors.getAgendas(state).find((agenda => agenda._id === agendaId))),
        }}),
})

const mapDispatchToProps = (dispatch) => ({
    openPlanningClick: (planningId, agenda) => (
        dispatch(actions.planning.ui.previewPlanningAndOpenAgenda(planningId, agenda))
    ),
})

export const RelatedPlannings = connect(mapStateToProps, mapDispatchToProps)(RelatedPlanningsComponent)

