import React from 'react'
import { Button } from 'react-bootstrap'
import { AgendaItem } from '../../components'
import {isArray} from 'lodash'


export const AgendaList = ({
    agendas,
    privileges,
    openCreateAgenda,
    openEditAgenda,
    }) => {
    return (
        <div className="split-content AgendaList">
            <div className="header">
                <h2>Manage Agendas</h2>
                {privileges.planning_agenda_management === 1 && (
                    <Button type="button"
                            bsClass="btn btn--primary"
                            className="pull-right"
                            onClick={openCreateAgenda}
                    >
                        <i className="icon-plus-sign icon-white"/>
                        Add a new agenda
                    </Button>
                )}
            </div>
            <div className="content">
                {isArray(agendas) && agendas.map((agenda) => (
                    <AgendaItem
                        agenda={agenda}
                        privileges={privileges}
                        onClick={openEditAgenda.bind(this, agenda)}
                        editEvent={openEditAgenda.bind(this, agenda)}
                        key={agenda._id}
                    />
                ))}
            </div>
        </div>
    )
}

AgendaList.propTypes = {
    agendas: React.PropTypes.array,
    privileges: React.PropTypes.object.isRequired,
    openCreateAgenda: React.PropTypes.func.isRequired,
    openEditAgenda: React.PropTypes.func.isRequired,
}
