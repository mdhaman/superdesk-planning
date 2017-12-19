import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Label} from '../';
import {EVENTS, MAIN} from '../../constants';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu, NestedItem} from '../UI/List';
import {PlanningItem} from '../Planning';
import {EventDateTime} from './';
import {ItemActionsMenu} from '../index';
import {eventUtils, getItemWorkflowStateLabel, gettext} from '../../utils';


export class EventItem extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {openPlanningItems: false};
        this.togglePlanningItem = this.togglePlanningItem.bind(this);
    }

    togglePlanningItem(evt) {
        evt.stopPropagation();
        if (!this.state.openPlanningItems) {
            this.props.showRelatedPlannings(this.props.item);
        }
        this.setState({openPlanningItems: !this.state.openPlanningItems});
    }

    render() {
        const {item, onItemClick, lockedItems, dateFormat, timeFormat,
            session, privileges, activeFilter, date, agendas} = this.props;
        const {openPlanningItems} = this.state;

        if (!item) {
            return null;
        }

        const hasPlanning = eventUtils.eventHasPlanning(item);
        const isItemLocked = eventUtils.isEventLocked(item, lockedItems);
        const state = getItemWorkflowStateLabel(item);
        const planningItems = get(item, 'planning_ids', []).length;
        let planningItemText = '';

        if (hasPlanning) {
            const itemsText = planningItems > 1 ? gettext('items') : gettext('item');
            const showHideText = openPlanningItems ? gettext('Hide') : gettext('Show');

            planningItemText = `(${planningItems}) ${showHideText} ${gettext('planning')} ${itemsText}`;
        }

        let borderState = false;

        if (isItemLocked)
            borderState = 'locked';
        else if (hasPlanning)
            borderState = 'active';

        const itemActionsCallBack = {
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
        };
        const itemActions = eventUtils.getEventActions(item, session, privileges, lockedItems, itemActionsCallBack);

        const renderEventItem = () => (
            <Item shadow={1} onClick={() => onItemClick(item)}>
                <Border state={borderState} />
                <ItemType item={item} onCheckToggle={() => { /* no-op */ }} />
                <PubStatus item={item} />
                <Column
                    grow={true}
                    border={false}
                >
                    <Row>
                        <Label
                            text={state.label}
                            iconType={state.iconType}
                        />
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {item.slugline &&
                                    <span className="sd-list-item__slugline">{item.slugline}</span>
                            }
                            {item.name}
                        </span>
                        <EventDateTime
                            item={item}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                        />
                    </Row>
                    {activeFilter === MAIN.FILTERS.COMBINED && hasPlanning && <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <a
                                className="text-link"
                                onClick={this.togglePlanningItem}
                            >
                                <i className="icon-calendar" />
                                {planningItemText}
                            </a>
                        </span>
                    </Row>}
                </Column>
                {get(itemActions, 'length', 0) > 0 && <ActionMenu>
                    <ItemActionsMenu
                        className="side-panel__top-tools-right"
                        actions={itemActions} />
                </ActionMenu>}
            </Item>
        );

        const getPlannings = () => (
            get(this.props.relatedPlanningsInList, item._id, []).map((plan) => (
                <PlanningItem
                    key={plan._id}
                    item={plan}
                    date={date}
                    lockedItems={lockedItems}
                    onItemClick={onItemClick}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    agendas={agendas}
                />
            ))
        );

        if (activeFilter !== MAIN.FILTERS.COMBINED || !hasPlanning) {
            return renderEventItem();
        } else if (activeFilter === MAIN.FILTERS.COMBINED && hasPlanning) {
            return (
                <NestedItem
                    collapsed={!openPlanningItems}
                    expanded={openPlanningItems}
                    parentItem={renderEventItem()}
                    nestedChildren={getPlannings()} />
            );
        }

        return null;
    }
}

EventItem.propTypes = {
    item: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    date: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
};
