import React from 'react'
import { Button } from 'react-bootstrap'
import { AgendaItem } from '../../components'
import './style.scss'

export const AgendaList = ({
    enabledAgendas,
    disabledAgendas,
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
                <div className="agenda-group">
                    <span className="form-label"><strong>Active Agendas</strong></span>
                    {enabledAgendas.length > 0 &&
                        <div className="sd-list-item-group sd-list-item-group--space-between-items">
                            {enabledAgendas.map((agenda) => (
                                <AgendaItem
                                    agenda={agenda}
                                    privileges={privileges}
                                    onClick={openEditAgenda.bind(this, agenda)}
                                    editEvent={openEditAgenda.bind(this, agenda)}
                                    key={agenda._id}
                                />
                            ))}
                        </div>
                    ||
                        <p>There are no active agendas.</p>
                    }
                </div>
                <div className="agenda-group">
                    <span className="form-label"><strong>Disable Agendas</strong></span>
                    {disabledAgendas.length > 0 &&
                        <div className="sd-list-item-group sd-list-item-group--space-between-items">
                            {disabledAgendas.map((agenda) => (
                                <AgendaItem
                                    agenda={agenda}
                                    privileges={privileges}
                                    onClick={openEditAgenda.bind(this, agenda)}
                                    editEvent={openEditAgenda.bind(this, agenda)}
                                    key={agenda._id}
                                />
                            ))}
                        </div>
                    ||
                        <p>There are no disabled agendas.</p>
                    }
                </div>
            </div>
        </div>
    )
}

AgendaList.propTypes = {
    enabledAgendas: React.PropTypes.array,
    disabledAgendas: React.PropTypes.array,
    privileges: React.PropTypes.object.isRequired,
    openCreateAgenda: React.PropTypes.func.isRequired,
    openEditAgenda: React.PropTypes.func.isRequired,
}
