import React from 'react'
import { connect } from 'react-redux'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { orderBy } from 'lodash'
import { AgendaList } from '../../components'

export function AgendasListComponent({
    enabledAgendas,
    disabledAgendas,
    openCreateAgenda,
    openEditAgenda,
    privileges,
}) {
    return (
        <AgendaList
            privileges={privileges}
            openCreateAgenda={openCreateAgenda}
            openEditAgenda={openEditAgenda}
            enabledAgendas={enabledAgendas}
            disabledAgendas={disabledAgendas}/>
    )
}

AgendasListComponent.propTypes = {
    enabledAgendas: React.PropTypes.array,
    disabledAgendas: React.PropTypes.array,
    privileges: React.PropTypes.object.isRequired,
    openCreateAgenda: React.PropTypes.func,
    openEditAgenda: React.PropTypes.func,
}

const mapStateToProps = (state) => (
    {
        enabledAgendas: orderBy(selectors.getEnabledAgendas(state), ['name'], ['asc']),
        disabledAgendas: orderBy(selectors.getDisabledAgendas(state), ['name'], ['asc']),
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
