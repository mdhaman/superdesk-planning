import React from 'react';
import PropTypes from 'prop-types';
import {ModalWithForm} from '../index';
import {
    SpikeEventForm,
    UnspikeEventForm,
    UpdateRecurringEventsForm,
    CancelEventForm,
    PostponeEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    ConvertToRecurringEventForm,
    SpikePlanningForm,
    UnspikePlanningForm,
    CancelPlanningCoveragesForm,
    UpdateAssignmentForm,
    EditPriorityForm,
    UpdateEventRepetitionsForm,
    PostEventsForm,
    CreatePlanningForm,
    AssignCalendarForm,
} from './index';
import {get} from 'lodash';
import {EVENTS, PLANNING, ASSIGNMENTS} from '../../constants';
import {gettext} from '../../utils';

export class ItemActionConfirmationModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {canSave: false};

        this.enableSaveInModal = this.enableSaveInModal.bind(this);
        this.disableSaveInModal = this.disableSaveInModal.bind(this);
    }

    enableSaveInModal() {
        this.setState({canSave: true});
    }

    disableSaveInModal() {
        this.setState({canSave: false});
    }

    render() {
        const {handleHide, modalProps} = this.props;

        let title;
        let form;
        let saveText = gettext('Save');
        let original = modalProps.original || {};
        let updates = modalProps.updates || {};
        const resolve = modalProps.resolve || null;
        const isRecurring = get(modalProps, 'original.recurrence_id');

        const getSaveAndPostTitle = () => {
            const post = get(modalProps, 'original._post', false);
            const save = get(modalProps, 'original._save', true);

            if (save && post)
                return gettext('Save & Post Event');
            else if (post)
                return gettext('Post Event');
            return gettext('Save Event');
        };

        const modalFormsMapper = {
            [EVENTS.ITEM_ACTIONS.SPIKE.label]: {
                title: gettext('Spike {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                saveText: gettext('Spike'),
                form: SpikeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UNSPIKE.label]: {
                title: gettext('Unspike {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                saveText: gettext('Unspike'),
                form: UnspikeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label]: {
                title: gettext('Cancel {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                saveText: gettext('OK'),
                form: CancelEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.label]: {
                title: gettext('Update time of {{event}}',
                    {event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event')}),
                form: UpdateTimeForm,
            },
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label]: {
                title: gettext('Reschedule {{event}}',
                    {event: isRecurring ? gettext('a Recurring Event') : gettext('an Event')}),
                saveText: gettext('Reschedule'),
                form: RescheduleEventForm,
            },
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label]: {
                title: gettext('Postpone {{event}}',
                    {event: isRecurring ? gettext('a Recurring Event') : gettext('an Event')}),
                saveText: gettext('Postpone'),
                form: PostponeEventForm,
            },
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label]: {
                title: get(EVENTS, 'ITEM_ACTIONS.CONVERT_TO_RECURRING.label'),
                form: ConvertToRecurringEventForm,
            },
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label]: {
                title: gettext('Update Repetitions of the Series'),
                saveText: gettext('Update Repetitions'),
                form: UpdateEventRepetitionsForm,
            },
            [EVENTS.ITEM_ACTIONS.POST_EVENT.label]: {
                title: gettext('{{action}} {{event}}', {
                    action: get(original, '_post', true) ? gettext('Post') : gettext('Unpost'),
                    event: isRecurring ? gettext('Recurring Event(s)') : gettext('an Event'),
                }),
                saveText: get(original, '_post', true) ? gettext('Post') : gettext('Unpost'),
                form: PostEventsForm,
            },
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.label]: {
                title: modalProps.title,
                saveText: gettext('Create'),
                form: CreatePlanningForm,
            },
            [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.label]: {
                title: gettext('Assign "{{calendar}}" Calendar to Series', {
                    calendar: get(updates, '_calendar.name') || '',
                }),
                saveText: gettext('Assign Calendar'),
                form: AssignCalendarForm,
            },
            [PLANNING.ITEM_ACTIONS.SPIKE.label]: {
                title: gettext('Spike Planning Item'),
                saveText: gettext('Spike'),
                form: SpikePlanningForm,
            },
            [PLANNING.ITEM_ACTIONS.UNSPIKE.label]: {
                title: gettext('Unspike Planning Item'),
                saveText: gettext('Unspike'),
                form: UnspikePlanningForm,
            },
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label]: {
                title: get(PLANNING, 'ITEM_ACTIONS.CANCEL_PLANNING.label'),
                form: CancelPlanningCoveragesForm,
            },
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label]: {
                title: get(PLANNING, 'ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label'),
                original: {
                    ...modalProps.original,
                    _cancelAllCoverage: true,
                },
                form: CancelPlanningCoveragesForm,
            },
            [ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label]: {
                title: ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label,
                form: UpdateAssignmentForm,
            },
            [ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label]: {
                title: ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label,
                form: EditPriorityForm,
            },
        };

        title = get(modalFormsMapper[modalProps.actionType], 'title', getSaveAndPostTitle());
        form = get(modalFormsMapper[modalProps.actionType], 'form', UpdateRecurringEventsForm);
        original = get(modalFormsMapper[modalProps.actionType], 'original', original);
        updates = get(modalFormsMapper[modalProps.actionType], 'updates', updates);
        saveText = get(modalFormsMapper[modalProps.actionType], 'saveText', saveText);

        return (
            <ModalWithForm
                title={title}
                onHide={handleHide}
                form={form}
                original={original}
                updates={updates}
                saveButtonText={saveText}
                cancelButtonText={gettext('Cancel')}
                large={get(modalProps, 'large', false)}
                show={true}
                canSave={this.state.canSave}
                enableSaveInModal={this.enableSaveInModal}
                disableSaveInModal={this.disableSaveInModal}
                modalProps={modalProps}
                resolve={resolve}
            />
        );
    }
}

ItemActionConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        eventDetail: PropTypes.object,
        original: PropTypes.object,
        updates: PropTypes.object,
        planning: PropTypes.object,
        actionType: PropTypes.string,
        large: PropTypes.bool,
    }),
};
