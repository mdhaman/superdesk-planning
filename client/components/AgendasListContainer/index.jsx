import React from 'react'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { orderBy } from 'lodash'
import { AgendaList } from '../../components'
import './style.scss'

export function AgendasListComponent({
    agendas,
    openCreateAgenda,
    openEditAgenda,
    privileges,
}) {
    return (
        <AgendaList
            privileges={privileges}
            openCreateAgenda={openCreateAgenda}
            openEditAgenda={openEditAgenda}
            agendas={agendas}
        />
    )
}

AgendasListComponent.propTypes = {
    agendas: React.PropTypes.array,
    privileges: React.PropTypes.object.isRequired,
    openCreateAgenda: React.PropTypes.func,
    openEditAgenda: React.PropTypes.func,
}

const mapStateToProps = (state) => (
    {
        agendas: orderBy(selectors.getActiveAgendas(state), ['name'], ['desc']),
        privileges: selectors.getPrivileges(state),
    }
)

const mapDispatchToProps = (dispatch) => ({
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
    openEditAgenda: (agenda) => dispatch(actions.showModal({
        modalType: 'EDIT_AGENDA',
        modalProps: { agenda },
    })),
})


export const AgendasListContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AgendasListComponent)
