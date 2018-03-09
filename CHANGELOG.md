# Changelog

## 3.11.0 JSON API response improvements
- Improves the tests for JSON API response middleware
- Document testing best practices
- Fixes bug #160 in dynamic broken relationships cleanup on response
- Adds an excludePortFromLinks option
- Adds paging (next, previous) links capability to json api response middleware

## 3.9.0 Breaking
- response-send middleware will now need to be included when setting up Express.js routes. The response-json-api middleware no longer calls `res.send(res.body)`.
- Fixes catalog [spec controller routing](https://gitlab.com/oddnetworks/oddworks/core/commit/8cfb1bbd9ee7124fd0d60e3281e4674a8bd94ecc).

## 3.8.0 Unstable
- Hide `channel.secrets` from /config response

## 3.7.0 Unstable
- Fixes a bug in the CORS headers middleware
- Report upstream source errors, but return cached content anyway
- Fix redis-search store
- Authorization warns if Authentication failed
- Fix search request parameter handling

## 3.5.0 Unstable
- Return [401 if channel/platform not active](https://gitlab.com/oddnetworks/oddworks/core/pull/115)
- Properly return [405 instead of 403](https://gitlab.com/oddnetworks/oddworks/core/pull/116) on bad method access.
- [Remove appending port to JSON API links](https://gitlab.com/oddnetworks/oddworks/core/pull/117) in production environments.
- [JSON API compliant error objects](https://gitlab.com/oddnetworks/oddworks/core/pull/120).

## 3.4.1 Unstable

- Correct JSON API error responses

## 3.4.0 Unstable

- Resource specification objects must be [fetched with full channel object](https://gitlab.com/oddnetworks/oddworks/core/pull/109) rather than the channel id string
- HTTP [DELETE handlers in catalog controllers](https://gitlab.com/oddnetworks/oddworks/core/pull/111).
_ More compliant [JSON API responses](https://gitlab.com/oddnetworks/oddworks/core/pull/112).

## 3.3.0 Unstable

- Handle special case of [JSON API links in config](https://gitlab.com/oddnetworks/oddworks/core/commit/f67ae7f61010d740099d26909e1b78bd6449b218) response
- Fixes JSON API response middleware bugs
- Limit attributes [assigned to resource object meta](https://gitlab.com/oddnetworks/oddworks/core/commit/12c113766e3e2433235e5c03d73dc94e9567ffe5)
- Fixes the include=foo query parameter in CatalogListController and CatalogItemController

## 3.2.2 Unstable

- Adds a type and id property to config objects for JSON API readiness.

## 3.2.0 Unstable

- Fixes a [promise chaining error](https://gitlab.com/oddnetworks/oddworks/core/pull/100/commits/8e156a8497231aad74fea35ce2d92af01ae955c3)
- Fixes a [promise returning warning](https://gitlab.com/oddnetworks/oddworks/core/pull/100/commits/525e25bef8f3ea8451ec2926d57bb834c9bb1e6e)
- Adds a [CloudSearch Store](https://gitlab.com/oddnetworks/oddworks/core/pull/100/commits/5163b532668417d2d88491c37e0ac4cca9edadf8)

## 3.1.1 Unstable

- Moves the identity service middleware into the middleware library. [Pull Request](https://gitlab.com/oddnetworks/oddworks/core/pull/97)
- Fixes [events service dependency](https://gitlab.com/oddnetworks/oddworks/core/pull/98).
- Fixes a [DynamoDB marshalling bug](https://gitlab.com/oddnetworks/oddworks/core/pull/96/commits/45bd9d13c7e90acc8f770196412729f006a2c1e1).
- Fixes a few [bugs in the catalog service](https://gitlab.com/oddnetworks/oddworks/core/commit/05d414ccc64e6d5d10f8b94fc13070f941a3ae12).

## 3.0.0 Unstable

- Stores and Services are now consistently initialized with a [single factory function](https://gitlab.com/oddnetworks/oddworks/core/issues/89).
- A default API is now exposed to [write data to both the identity and catalog services](https://gitlab.com/oddnetworks/oddworks/core/blob/master/lib/services/identity/README.md#authentication).
- [Sync service is deprecated](https://gitlab.com/oddnetworks/oddworks/core/issues/39) in favor of the [Provider](https://gitlab.com/oddnetworks/oddworks/core/tree/master/lib/services/catalog#providers-and-specs) caching system.
- The [x-access-token header is deprecated in favor of the Authorization header](https://gitlab.com/oddnetworks/oddworks/core/issues/83)
- [Token scopes](https://gitlab.com/oddnetworks/oddworks/core/issues/45) are [now defined](https://gitlab.com/oddnetworks/oddworks/core/blob/master/lib/services/identity/README.md#authentication) in the JSON Web Token audience (`.aud`) member.
- Stores now [filter resources based on channel](https://gitlab.com/oddnetworks/oddworks/core/issues/60)
- Stores now implement a [scan method](https://gitlab.com/oddnetworks/oddworks/core/issues/88) for fetching multiple records by type.
- Stores now support an [include argument](https://gitlab.com/oddnetworks/oddworks/core/issues/90) for fetching related records.
- The event service is deprecated.
- A [DynamoDB store](https://gitlab.com/oddnetworks/oddworks/core/issues/82) was added.
- The [JSON API service is deprecated](https://gitlab.com/oddnetworks/oddworks/core/issues/91) in favor of using request/response middleware instead.
- The [Logging service is deprecated](https://gitlab.com/oddnetworks/oddworks/core/issues/94).
- New [Request Controller Classes](https://gitlab.com/oddnetworks/oddworks/core/issues/92).
- Tests are now [authored using Jasmine](https://gitlab.com/oddnetworks/oddworks/core/issues/87) instead of tape.

## 2.2.1

- Fixed issue with links for included resource entities #74
- Fixed Google events analyzer (will actually `send()` events now)
- Documentation improvements

## 2.2.0

- Documentation improvements
- Added `oddworks.logger`, an extensible [winston](https://www.npmjs.com/package/winston) instance
- Added partials as factories to create getter/setter on stores, eliminating the need to pass in an entity type when creating or querying for it
- Added protection for options hashes passed into services, avoiding reference errors
- Refactored some code around Promises, reducing nested code and extra, unnecessary turns of the event loop
- Refactored prototype assignments so as not to override global Object.prototype
