import { SelectMetaTermsField } from './SelectMetaTermsField/'
import * as selectors from '../../selectors'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    options: selectors.getEnabledAgendas(state).map((agenda) => (
        {
            label: agenda.name,
            value: agenda,
        }
    )),
    value: (ownProps.input.value || []).map((agenda) => (
        {
            label: agenda.name,
            value: agenda,
        }
    )),
})

export const CategoryField = connect(mapStateToProps)(SelectMetaTermsField)
