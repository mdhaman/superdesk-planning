import React from 'react'
import { fields, Toggle, AuditInformation } from '../components'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { get } from 'lodash'
import * as actions from '../actions'
import { ChainValidators, RequiredFieldsValidatorFactory, MaxLengthValidatorFactory } from '../validators'

export class Component extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            is_enabled: this.props.initialValues.is_enabled
        }
    }

    handleEnabledChange(event) {
        this.props.change('is_enabled', event.target.value)
        this.setState({is_enabled: event.target.value})
    }

    render() {
        return (
            <form onSubmit={this.props.handleSubmit} className="CreateEditAgendaForm">
                <div className="field">
                    <AuditInformation createdBy={get(this.props, 'initialValues.original_creator')}
                        updatedBy={get(this.props, 'initialValues.version_creator')}
                        createdAt={get(this.props, 'initialValues._created')}
                        updatedAt={get(this.props, 'initialValues._updated')}/>
                </div>
                <Field name="name"
                       component={fields.InputField}
                       autoFocus={true}
                       type="text"
                       label="Name"/>
                <div className="field">
                    <Toggle value={this.state.is_enabled}
                            onChange={this.handleEnabledChange.bind(this)}
                            /> Enabled
                </div>
                <button type="submit" style={{ visibility: 'hidden' }}>Submit</button>
            </form>
        )
    }
}

Component.propTypes = {
    handleSubmit: React.PropTypes.func.isRequired
}

// Decorate the form component
export const CreateEditAgenda = reduxForm({
    form: 'createEditAgenda', // a unique name for this form
    validate: ChainValidators([
        RequiredFieldsValidatorFactory(['name']),
        MaxLengthValidatorFactory({ name: 100 }),
    ]),
    touchOnBlur: false,
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: ({ _id, name, is_enabled }) => (
        // save the agenda through the API
        dispatch(actions.createOrUpdateAgenda({
            _id,
            name,
            is_enabled
        }))
    ),
})

export const CreateEditAgendaForm = connect(
    null,
    mapDispatchToProps,
    null,
    { withRef: true })(CreateEditAgenda)
