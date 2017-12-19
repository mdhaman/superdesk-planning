# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Search."""
import pytz
from flask import json, current_app as app

import superdesk
import logging
from datetime import datetime, timedelta
from superdesk import config
from superdesk.metadata.utils import item_url
from superdesk.utc import utcnow, get_timezone_offset
from superdesk.utils import ListCursor
from eve_elastic.elastic import parse_date
from ..common import PLANNING_ITEM_CUSTOM_HATEOAS, EVENT_ITEM_CUSTOM_HATEOAS
from superdesk.resource import build_custom_hateoas

logger = logging.getLogger(__name__)


class SearchService(superdesk.Service):

    repos = ['events', 'planning']

    @property
    def elastic(self):
        return app.data.elastic

    def _get_events_query(self, req):
        """Parse the request return the query for events"""
        args = req.args or {}
        must = [self._get_date_range_filter('dates.start',
                                            args.get('from'),
                                            args.get('to'),
                                            args.get('timezone'))]
        for field_name in ['anpa_category', 'subject', 'state', 'pubstatus']:
            filter_query = self._get_filter(field_name, args)
            if filter_query:
                must.append(filter_query)
                
        if args.get('slugline'):
            must.append({
                'query_string': {
                    'query': 'slugline:({})'.format(args.get('slugline')),
                    'default_operator': 'AND'
                }
            })
                
        query = {
            'size': 0,
            'query': {
                'bool': {
                    'must': must
                }
            },
            'aggs': {
                'date_histogram': {
                    'date_histogram': {
                        'field': 'dates.start',
                        'interval': 'day',
                        'format': 'yyyy-MM-dd'
                    },
                    'aggs': {
                        'by_date': {
                            'top_hits': {
                                'sort': [
                                    {'dates.start': {'order': 'asc'}},
                                    {'dates.end': {'order': 'asc'}}
                                ],
                                'size': 9999
                            }
                        }
                    }
                }
            }
        }

        return query

    def _get_planning_query(self, req):
        """Parse the request return the query for planning"""
        args = req.args or {}
        must = list()
        must_not = list()
        should = list()
        
        must.append({
            'nested': {
                'path': '_planning_schedule',
                'query': {
                    'bool': {
                        'must': [self._get_date_range_filter('_planning_schedule.scheduled', 
                                                             args.get('from'),
                                                             args.get('to'),
                                                             args.get('timezone'))]
                    }
                }
            }
        })

        if args.get('slugline'):
            should.append({
                'query_string': {
                    'query': 'slugline:({})'.format(args.get('slugline')),
                    'default_operator': 'AND'
                }
            })

            should.append({
                'nested': {
                    'path': 'coverages',
                    'query': {
                        'bool': {
                            'must': [
                                {
                                    'query_string': {
                                        'query': 'slugline:({})'.format(args.get('slugline')),
                                        'default_operator': 'AND'
                                    }
                                }
                            ]
                        }
                    }
                }
            })

        must_not.append({
            'constant_score': {
                'filter': {
                    'exists': {
                        'field': 'event_item'
                    }
                }
            }
        })
        
        for field_name in ['anpa_category', 'subject', 'state', 'pubstatus']:
            filter_query = self._get_filter(field_name, args)
            if filter_query:
                must.append(filter_query)

        query = {
            'size': 0,
            'query': {
                'bool': {
                    'must': must,
                    'must_not': must_not,
                    'should': should
                }
            },
            'aggs': {
                'planning_date': {
                    'nested': {
                        'path': '_planning_schedule'
                    },
                    'aggs': {
                        'date_histogram': {
                            'date_histogram': {
                                'field': '_planning_schedule.scheduled',
                                'interval': 'day',
                                'format': 'yyyy-MM-dd'
                            },
                            'aggs': {
                                'by_date': {
                                    'reverse_nested': {},
                                    'aggs': {
                                        'plannings': {
                                            'top_hits': {
                                                'size': 9999,
                                                'sort': [
                                                    {
                                                        '_planning_schedule.scheduled': {'order': 'asc'}
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return query

    def get_events_by_date(self, req):
        query = self._get_events_query(req)
        resource = 'events'

        hits = self.elastic.es.search(body=query,
                                      index=self._get_index([resource]),
                                      doc_type=resource)

        hits = hits.get('aggregations', {}).get('date_histogram')
        if not hits:
            return []

        response = []
        for data in hits.get('buckets'):
            by_date = {
                config.ID_FIELD: data.get('key_as_string'),
                'total': data.get('doc_count'),
                app.config['ITEMS']: self.elastic._parse_hits(data.get('by_date'), resource).docs
            }

            getattr(app, 'on_fetched_resource')(resource, by_date)
            getattr(app, 'on_fetched_resource_%s' % resource)(by_date)

            for item in by_date[app.config['ITEMS']] or []:
                build_custom_hateoas(EVENT_ITEM_CUSTOM_HATEOAS, item)

            response.append(by_date)

        return response

    def get_planning_by_date(self, req):
        query = self._get_planning_query(req)
        resource = 'planning'
        hits = self.elastic.es.search(body=query,
                                      index=self._get_index(['planning']),
                                      doc_type='planning')

        hits = hits.get('aggregations', {}).get('planning_date').get('date_histogram')
        if not hits:
            return []

        response = []
        for data in hits.get('buckets'):
            by_date = {
                config.ID_FIELD: data.get('key_as_string'),
                'total': data.get('doc_count'),
            }

            docs = data.get('by_date', {}).get('plannings') or {}
            by_date[app.config['ITEMS']] = self.elastic._parse_hits(docs, resource).docs
            bucket_date = datetime.strptime(data.get('key_as_string'),
                                            config.ELASTIC_DATE_FORMAT).replace(tzinfo=pytz.UTC)

            for item in by_date[app.config['ITEMS']]:
                item['day'] = bucket_date
                build_custom_hateoas(PLANNING_ITEM_CUSTOM_HATEOAS, item)

            getattr(app, 'on_fetched_resource')(resource, by_date)
            getattr(app, 'on_fetched_resource_%s' % resource)(by_date)
            response.append(by_date)

        return response

    def _get_date_range_filter(self, field_name, from_date, to_date, timezone):
        """Get the date range filter"""
        date_range = {field_name: {}}
        start = from_date or utcnow()
        end = to_date or start + timedelta(days=7)

        date_range[field_name]['gte'] = self._format_date(start)
        date_range[field_name]['lte'] = self._format_date(end)
        date_range[field_name]['time_zone'] = timezone or get_timezone_offset(config.DEFAULT_TIMEZONE, utcnow())
        return {'range': date_range}

    def _get_filter(self, argument_name, args):

        query = {}
        if not args or not args.get(argument_name):
            return query

        filter_value = args.get(argument_name)
        try:
            filter_value = json.loads(args.get(argument_name))
        except Exception:
            pass

        if not filter_value:
            return query

        if not isinstance(filter_value, list):
            filter_value = [filter_value]

        return {'terms': {argument_name: filter_value}}

    def get(self, req, lookup):
        """ Run the query against events and planning indexes """
        events = self.get_events_by_date(req)
        planning = self.get_planning_by_date(req)
        combined_results = self._combine_events_planning(events, planning)

        return ListCursor(combined_results)

    def _combine_events_planning(self, events, planning):
        events = {item.get(config.ID_FIELD): item for item in events or []}
        planning = {item.get(config.ID_FIELD): item for item in planning or []}
        days_to_process = sorted(list(set(events.keys()).union(planning.keys())))

        def sort_data(item):
            if item.get('_type') == 'events':
                return parse_date(item.get('dates').get('start'))

            if item.get('_type') == 'planning':
                coverage_dates = [parse_date(coverage.get('planning', {}).get('scheduled'))
                                  for coverage in item.get('coverages') or []
                                  if coverage.get('planning', {}).get('scheduled')]
                coverage_dates.append(item.get('_planning_date'))
                coverage_dates = sorted(coverage_dates)
                return next((cov_date for cov_date in coverage_dates if cov_date > item.get('day')),
                            item.get('_planning_date'))

        combined_list = []
        for day in days_to_process:
            combined_data = events.get(day, {}).get(app.config['ITEMS']) or []
            combined_data.extend(planning.get(day, {}).get(app.config['ITEMS']) or [])
            combined_data = sorted(combined_data, key=sort_data)
            combined_list.append({
                config.ID_FIELD: day,
                app.config['ITEMS']: combined_data,
                'total': len(combined_data)
            })

        return combined_list

    def _get_index(self, repos):
        """Get index id for all repos."""
        indexes = {app.data.elastic.index}
        for repo in repos:
            indexes.add(app.config['ELASTICSEARCH_INDEXES'].get(repo, app.data.elastic.index))
        return ','.join(indexes)

    @staticmethod
    def _format_date(date):
        return datetime.strftime(date, config.ELASTIC_DATE_FORMAT)


class SearchResource(superdesk.Resource):
    resource_methods = ['GET']
    item_methods = ['GET']
    item_url = item_url
    endpoint_name = 'planning_search'
    schema = {
        'fulltext': {'type': 'string'},
        'slugline': {'type': 'string'},
        'from': {'type': 'datetime'},
        'to': {'type': 'datetime'},
        'anpa_category': {'type': 'list'},
        'subject': {'type': 'list'},
        'state': {'type': 'list'},
        'pubstatus': {'type': 'list'},
        'timezone': {'type': 'string'}
    }


def init_app(app):
    superdesk.register_resource(SearchResource.endpoint_name,
                                SearchResource,
                                SearchService,
                                _app=app)
