/* global describe, beforeAll, beforeEach, it, expect */
/* eslint prefer-arrow-callback: 0 */
/* eslint-disable max-nested-callbacks */
'use strict';

const Promise = require('bluebird');
const fakeredis = require('fakeredis');
const redisStore = require('../../../../lib/stores/redis/');
const identityService = require('../../../../lib/services/identity');
const catalogService = require('../../../../lib/services/catalog');

describe('Identity Viewers Relationship Controller', function () {
	let bus;
	let res;

	const VIDEO_1 = {
		id: 'video-1',
		type: 'video',
		channel: 'odd-networks',
		title: 'Video One'
	};

	const VIDEO_2 = {
		id: 'video-2',
		type: 'video',
		channel: 'odd-networks',
		title: 'Video Two'
	};

	const COLLECTION_1 = {
		id: 'collection-1',
		type: 'collection',
		channel: 'odd-networks',
		title: 'Collection One'
	};

	const CHANNEL = {
		id: 'odd-networks',
		title: 'Odd Networks'
	};

	const PLATFORM = {
		id: 'apple-ios',
		title: 'Apple iOS',
		channel: 'odd-networks'
	};

	const VIEWER = {
		id: 'bingewatcher@oddnetworks.com',
		type: 'viewer',
		channel: 'odd-networks',
		relationships: {
			watchlist: {
				data: [
					{id: VIDEO_1.id, type: 'video'},
					{id: COLLECTION_1.id, type: 'collection'}
				]
			},
			library: {
				data: [
					{id: VIDEO_1.id, type: 'video'},
					{id: COLLECTION_1.id, type: 'collection'}
				]
			},
			platforms: {
				data: [
					{id: 'apple-ios', type: 'platform'}
				]
			}
		}
	};

	const OTHER_VIEWER = {
		id: 'other@oddnetworks.com',
		type: 'viewer',
		channel: 'odd-networks',
		relationships: {
			watchlist: {
				data: []
			},
			library: {
				data: []
			},
			platforms: {
				data: []
			}
		}
	};

	beforeAll(function (done) {
		bus = this.createBus();
		this.service = null;

		Promise.promisifyAll(fakeredis.RedisClient.prototype);
		Promise.promisifyAll(fakeredis.Multi.prototype);

		// Initialize a store
		redisStore(bus, {
			types: ['channel', 'platform', 'viewer', 'video', 'collection'],
			redis: fakeredis.createClient()
		})
			.then(store => {
				this.store = store;
			})
			// Initialize an identity service
			.then(() => {
				return identityService(bus, {
					jwtSecret: 'secret'
				});
			})
			.then(service => {
				this.service = service;
				this.controller = {
					viewerRelationshipWatchlist: new service.ViewerRelationshipController({bus, relationship: 'watchlist'}),
					viewerRelationshipLibrary: new service.ViewerRelationshipController({bus, relationship: 'library'}),
					viewerRelationshipPlatforms: new service.ViewerRelationshipController({bus, relationship: 'platforms'})
				};
			})
			// Initialize an catalog service
			.then(() => {
				return catalogService(bus);
			})
			.then(() => {
				return Promise.join(
					bus.sendCommand({role: 'store', cmd: 'set', type: 'video'}, VIDEO_1),
					bus.sendCommand({role: 'store', cmd: 'set', type: 'video'}, VIDEO_2),
					bus.sendCommand({role: 'store', cmd: 'set', type: 'collection'}, COLLECTION_1),
					bus.sendCommand({role: 'store', cmd: 'set', type: 'channel'}, CHANNEL),
					bus.sendCommand({role: 'store', cmd: 'set', type: 'platform'}, PLATFORM),
					bus.sendCommand({role: 'store', cmd: 'set', type: 'viewer'}, VIEWER),
					() => {}
				);
			})
			.then(done)
			.catch(this.handleError(done));
	});

	describe('GET', function () {
		beforeEach(function (done) {
			res = {
				status() {
				},
				body: {}
			};
			done();
		});

		describe('as platform without viewer JWT', function () {
			it('returns 401', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					}
				};

				this.controller.viewerRelationshipWatchlist.get(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(401);
					expect(err.output.payload.error).toBe('Unauthorized');
					expect(err.output.payload.message).toBe('Viewer not found.');
					done();
				});
			});
		});

		describe('as platform with non-matching JWT', function () {
			it('returns 403', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: OTHER_VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					}
				};

				this.controller.viewerRelationshipWatchlist.get(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(403);
					expect(err.output.payload.error).toBe('Forbidden');
					expect(err.output.payload.message).toBe('Viewer specified in JWT does not match requested viewer.');
					done();
				});
			});
		});

		describe('as platform', function () {
			it('returns the watchlist for a viewer', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					}
				};

				this.controller.viewerRelationshipWatchlist.get(req, res, () => {
					expect(res.body.length).toBe(2);
					done();
				});
			});
		});
		describe('as admin', function () {
			it('returns the watchlist for a viewer', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						audience: ['admin']
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					}
				};

				this.controller.viewerRelationshipWatchlist.get(req, res, () => {
					expect(res.body.length).toBe(2);
					done();
				});
			});
		});
	});

	describe('as platform', function () {
		it('returns the library for a viewer', function (done) {
			const req = {
				identity: {
					channel: CHANNEL,
					platform: PLATFORM,
					viewer: VIEWER
				},
				params: {
					id: 'bingewatcher@oddnetworks.com'
				}
			};

			this.controller.viewerRelationshipLibrary.get(req, res, () => {
				expect(res.body.length).toBe(2);
				done();
			});
		});
	});
	describe('as admin', function () {
		it('returns the library for a viewer', function (done) {
			const req = {
				identity: {
					channel: CHANNEL,
					platform: PLATFORM,
					audience: ['admin']
				},
				params: {
					id: 'bingewatcher@oddnetworks.com'
				}
			};

			this.controller.viewerRelationshipLibrary.get(req, res, () => {
				expect(res.body.length).toBe(2);
				done();
			});
		});
	});

	describe('as platform', function () {
		it('returns the platforms for a viewer', function (done) {
			const req = {
				identity: {
					channel: CHANNEL,
					platform: PLATFORM,
					viewer: VIEWER
				},
				params: {
					id: 'bingewatcher@oddnetworks.com'
				}
			};

			this.controller.viewerRelationshipPlatforms.get(req, res, () => {
				expect(res.body.length).toBe(1);
				done();
			});
		});
	});
	describe('as admin', function () {
		it('returns the platforms for a viewer', function (done) {
			const req = {
				identity: {
					channel: CHANNEL,
					platform: PLATFORM,
					audience: ['admin']
				},
				params: {
					id: 'bingewatcher@oddnetworks.com'
				}
			};

			this.controller.viewerRelationshipPlatforms.get(req, res, () => {
				expect(res.body.length).toBe(1);
				done();
			});
		});
	});

	describe('POST', function () {
		beforeEach(function (done) {
			res = {
				status() {},
				sendStatus() {},
				body: {}
			};
			done();
		});

		describe('as platform without viewer JWT', function () {
			it('returns 401', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: VIDEO_2.id, type: 'video'}
				};

				this.controller.viewerRelationshipWatchlist.post(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(401);
					expect(err.output.payload.error).toBe('Unauthorized');
					expect(err.output.payload.message).toBe('Viewer not found.');
					done();
				});
			});
		});

		describe('as platform with non-matching JWT', function () {
			it('returns 403', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: OTHER_VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					}
				};

				this.controller.viewerRelationshipWatchlist.post(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(403);
					expect(err.output.payload.error).toBe('Forbidden');
					expect(err.output.payload.message).toBe('Viewer specified in JWT does not match requested viewer.');
					done();
				});
			});
		});

		describe('as platform', function () {
			it('posts a new item to the watchlist for a viewer', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: VIDEO_2.id, type: 'video'}
				};

				this.controller.viewerRelationshipWatchlist.post(req, res)
					.then(viewer => {
						expect(viewer.relationships.watchlist.data.length).toBe(3);
						expect(viewer.relationships.watchlist.data[2].meta.updatedAt).toBeDefined();
						done();
					});
			});

			it('returns 422', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: 'viewer-1', type: 'viewer'}
				};

				this.controller.viewerRelationshipWatchlist.post(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(422);
					expect(err.output.payload.error).toBe('Unprocessable Entity');
					expect(err.output.payload.message).toBe('Resources is not of type video or collection.');
					done();
				});
			});
		});

		describe('as admin', function () {
			it('posts an exiting item to the watchlist for a viewer', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						audience: ['admin']
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: VIDEO_2.id, type: 'video'}
				};

				this.controller.viewerRelationshipWatchlist.post(req, res)
					.then(viewer => {
						expect(viewer.relationships.watchlist.data.length).toBe(3);
						expect(viewer.relationships.watchlist.data[2].meta.updatedAt).toBeDefined();
						done();
					});
			});
		});
	});

	describe('DELETE', function () {
		beforeEach(function (done) {
			res = {
				status() {},
				sendStatus() {},
				body: {}
			};
			done();
		});

		describe('as platform without viewer JWT', function () {
			it('returns 401', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: VIDEO_2.id, type: 'video'}
				};

				this.controller.viewerRelationshipWatchlist.delete(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(401);
					expect(err.output.payload.error).toBe('Unauthorized');
					expect(err.output.payload.message).toBe('Viewer not found.');
					done();
				});
			});
		});

		describe('as platform with non-matching JWT', function () {
			it('returns 403', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: OTHER_VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					}
				};

				this.controller.viewerRelationshipWatchlist.delete(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(403);
					expect(err.output.payload.error).toBe('Forbidden');
					expect(err.output.payload.message).toBe('Viewer specified in JWT does not match requested viewer.');
					done();
				});
			});
		});
		describe('as platform', function () {
			it('deletes an item on the watchlist for a viewer', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: VIDEO_2.id, type: 'video'}
				};

				this.controller.viewerRelationshipWatchlist.delete(req, res)
					.then(viewer => {
						expect(viewer.relationships.watchlist.data.length).toBe(2);
						done();
					});
			});

			it('returns 422', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						viewer: VIEWER
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: 'viewer-1', type: 'viewer'}
				};

				this.controller.viewerRelationshipWatchlist.delete(req, res, err => {
					expect(err.isBoom).toBe(true);
					expect(err.output.statusCode).toBe(422);
					expect(err.output.payload.error).toBe('Unprocessable Entity');
					expect(err.output.payload.message).toBe('Resources is not of type video or collection.');
					done();
				});
			});
		});
		describe('as admin', function () {
			it('deletes an item on the watchlist for a viewer', function (done) {
				const req = {
					identity: {
						channel: CHANNEL,
						platform: PLATFORM,
						audience: ['admin']
					},
					params: {
						id: 'bingewatcher@oddnetworks.com'
					},
					body: {id: VIDEO_1.id, type: 'video'}
				};

				this.controller.viewerRelationshipWatchlist.delete(req, res)
					.then(viewer => {
						expect(Array.isArray(viewer.relationships.watchlist.data)).toBe(false);
						expect(viewer.relationships.watchlist.data.id).toBe(COLLECTION_1.id);
						expect(viewer.relationships.watchlist.data.type).toBe(COLLECTION_1.type);
						done();
					});
			});
		});
	});
});
