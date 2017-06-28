from apps.archive.common import set_original_creator
from apps.auth import get_user_id
from superdesk import Resource, Service, config
from superdesk.notification import push_notification


class AgendasResource(Resource):
    url = 'agenda'
    schema = {
        'name': {
            'type': 'string',
            'iunique': True,
            'required': True,
            'empty': False,
            'nullable': False
        },
        # Audit Information
        'original_creator': Resource.rel('users'),
        'version_creator': Resource.rel('users')
    }

    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'DELETE']

    privileges = {
        'POST': 'planning_agenda_management',
        'PATCH': 'planning_agenda_management',
        'DELETE': 'planning_agenda_management'
    }


class AgendasService(Service):
    def on_create(self, docs):
        for doc in docs:
            set_original_creator(doc)

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'agenda:created',
                item=str(doc[config.ID_FIELD]),
                user=str(doc.get('original_creator', ''))
            )

    def on_update(self, updates, original):
        updates['version_creator'] = get_user_id()

    def on_updated(self, updates, original):
        # todo: update all planning items
        push_notification(
            'agenda:updated',
            item=str(original[config.ID_FIELD]),
            user=str(original.get('original_creator', ''))
        )