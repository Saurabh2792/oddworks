'use strict';

const _ = require('lodash');
const Boom = require('boom');

const utils = require('../../../utils');
const Controller = require('../../../controllers/controller');

class ViewerRelationshipController extends Controller {
	constructor(options) {
		super();
		this.bus = options.bus;
		this.type = 'viewer';
		this.relationship = options.relationship;
	}

	get(req, res, next) {
		if (!this.isAdminRequest(req) && !_.has(req, 'identity.viewer')) {
			return next(Boom.unauthorized('Viewer not found.'));
		}

		if (!this.isAdminRequest(req) && req.params.id !== _.get(req, 'identity.viewer.id')) {
			return next(Boom.forbidden('Viewer specified in JWT does not match requested viewer.'));
		}

		const relationshipKey = this.relationship;

		if (req.identity.viewer) {
			res.body = _.get(req, `identity.viewer.relationships.${relationshipKey}.data`, null);
			res.status(200);
			return next();
		}

		this.bus.query({role: 'store', cmd: 'get', type: this.type}, {id: req.params.id, type: this.type, channel: req.identity.channel.id})
			.then(viewer => {
				if (!viewer) {
					return next(Boom.notFound(`viewer ${req.params.id} not found`));
				}

				res.body = _.get(viewer, `relationships.${relationshipKey}.data`, null);
				res.status(200);
				next();
			})
			.catch(next);
	}

	post(req, res, next) {
		if (!this.isAdminRequest(req) && !_.has(req, 'identity.viewer')) {
			return next(Boom.unauthorized('Viewer not found.'));
		}

		if (!this.isAdminRequest(req) && req.params.id !== _.get(req, 'identity.viewer.id')) {
			return next(Boom.forbidden('Viewer specified in JWT does not match requested viewer.'));
		}

		const args = {
			id: req.params.id,
			type: this.type,
			channel: req.identity.channel.id
		};

		let data = utils.arrayify(req.body);
		data = data.map(resource => {
			if (resource.id && (resource.type === 'video' || resource.type === 'collection')) {
				return {
					id: resource.id,
					type: resource.type,
					meta: {
						updatedAt: (new Date()).toISOString()
					}
				};
			}
			return null;
		});
		data = _.compact(data);

		if (data.length <= 0) {
			return next(Boom.badData(`Resources is not of type video or collection.`));
		}

		return this.bus.query({role: 'store', cmd: 'get', type: this.type}, args)
			.then(viewer => {
				viewer.relationships[this.relationship] = viewer.relationships[this.relationship] || {};
				viewer.relationships[this.relationship].data = viewer.relationships[this.relationship].data || [];
				viewer.relationships[this.relationship].data = utils.arrayify(viewer.relationships[this.relationship].data);

				viewer.relationships[this.relationship].data = viewer.relationships[this.relationship].data.concat(data);
				viewer.relationships[this.relationship].data = _.uniqWith(viewer.relationships[this.relationship].data, utils.isEqualResource);

				if (viewer.relationships[this.relationship].data.length === 1) {
					viewer.relationships[this.relationship].data = viewer.relationships[this.relationship].data[0];
				}

				return this.bus.sendCommand({role: 'store', cmd: 'set', type: this.type}, viewer);
			})
			.then(viewer => {
				res.sendStatus(202);
				return viewer;
			})
			.catch(next);
	}

	delete(req, res, next) {
		if (!this.isAdminRequest(req) && !_.has(req, 'identity.viewer')) {
			return next(Boom.unauthorized('Viewer not found.'));
		}

		if (!this.isAdminRequest(req) && req.params.id !== _.get(req, 'identity.viewer.id')) {
			return next(Boom.forbidden('Viewer specified in JWT does not match requested viewer.'));
		}

		const args = {
			id: req.params.id,
			type: this.type,
			channel: req.identity.channel.id
		};

		let data = utils.arrayify(req.body);
		data = data.map(resource => {
			if (resource.id && (resource.type === 'video' || resource.type === 'collection')) {
				return {id: resource.id, type: resource.type};
			}
			return null;
		});
		data = _.compact(data);

		if (data.length <= 0) {
			return next(Boom.badData(`Resources is not of type video or collection.`));
		}

		return this.bus.query({role: 'store', cmd: 'get', type: this.type}, args)
			.then(viewer => {
				viewer.relationships[this.relationship] = viewer.relationships[this.relationship] || {};
				viewer.relationships[this.relationship].data = viewer.relationships[this.relationship].data || [];
				viewer.relationships[this.relationship].data = utils.arrayify(viewer.relationships[this.relationship].data);

				// Remove resources from current
				_.remove(viewer.relationships[this.relationship].data, resource => {
					return _.find(data, utils.toResourceIdentifier(resource));
				});

				if (viewer.relationships[this.relationship].data.length === 1) {
					viewer.relationships[this.relationship].data = viewer.relationships[this.relationship].data[0];
				}

				return this.bus.sendCommand({role: 'store', cmd: 'set', type: this.type}, viewer);
			})
			.then(viewer => {
				res.sendStatus(202);
				return viewer;
			})
			.catch(next);
	}

	static create(options) {
		if (!options.bus || !_.isObject(options.bus)) {
			throw new Error('ViewerRelationshipController options.bus is required');
		}
		if (!options.relationship || !_.isString(options.relationship)) {
			throw new Error('ViewerRelationshipController options.relationship is required');
		}

		return Controller.create(new ViewerRelationshipController(options));
	}
}

module.exports = ViewerRelationshipController;
