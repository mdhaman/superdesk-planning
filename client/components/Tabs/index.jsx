import React from 'react'
import classNames from 'classnames'

export const Tab = ({activeTab, tabName, onChangeTab}) => {

    return (
        <li className={classNames('nav-tabs__tab',
            {'nav-tabs__tab--active': activeTab === tabName})} >
            <button
                className="nav-tabs__link"
                onClick={onChangeTab}>
                <span>{tabName}</span>
            </button>
        </li>
    )
}

Tab.propTypes = {
    activeTab: React.PropTypes.string.isRequired,
    tabName: React.PropTypes.string.isRequired,
    onChangeTab: React.PropTypes.func.isRequired,
}

export class Tabs extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {children} = this.props

        return (
            <ul className="nav-tabs">
                {children}
            </ul>
        )
    }
}

Tabs.propTypes = {}


export class TabContent extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {children, activeTab, tabName} = this.props
        if (!children || children.length === 0 || activeTab !== tabName) {

            return null
        }
        return (
            <div className="nav-tabs__content">
                <div className="nav-tabs__pane" >
                    {children}
                </div>
            </div>
        )
    }
}

TabContent.propTypes = {
    activeTab: React.PropTypes.string.isRequired,
    tabName: React.PropTypes.string.isRequired,
}
