import React from 'react'
import { Modal } from '../index'
import { Button } from 'react-bootstrap'
import './style.scss'
import { isBoolean } from 'lodash'

export class ModalWithForm extends React.Component {
    constructor(props) {
        super(props)
    }

    submit() {
        this.refs.form.getWrappedInstance().submit()
    }

    render() {
        const form = React.createElement(this.props.form, {
            initialValues: this.props.initialValues,
            ref: 'form',
        })
        return (
            <Modal show={this.props.show}
                   onHide={this.props.onHide}
                   large={isBoolean(this.props.large) ? this.props.large : false}
                   fill={isBoolean(this.props.fill) ? this.props.fill : false}
                   fullscreen={isBoolean(this.props.fullscreen) ? this.props.fullscreen : false}
                   white={isBoolean(this.props.white) ? this.props.white : false}>
                <Modal.Header>
                    <a className="close" onClick={this.props.onHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3>{ this.props.title }</h3>
                </Modal.Header>
                <Modal.Body>
                    { form }
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.onHide}>Close</Button>
                    <Button type="submit"
                            className="btn btn--primary"
                            onClick={this.submit.bind(this)}
                            disabled={this.props.pristine ||
                                this.props.submitting}>Save</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

ModalWithForm.propTypes = {
    form: React.PropTypes.func.isRequired,
    initialValues: React.PropTypes.object,
    title: React.PropTypes.string,
    show: React.PropTypes.bool,
    onHide: React.PropTypes.func,
    pristine: React.PropTypes.bool,
    submitting: React.PropTypes.func,
    large: React.PropTypes.bool,
    fill: React.PropTypes.bool,
    fullscreen: React.PropTypes.bool,
    white: React.PropTypes.bool,
}
