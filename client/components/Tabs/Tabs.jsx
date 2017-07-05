import React from 'react'

export class Tabs extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { children } = this.props

        return (
            <ul className="nav-tabs">
                { children }
            </ul>
        )
    }
}

Tabs.propTypes = { children: React.PropTypes.array }
