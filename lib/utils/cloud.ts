/**
 * @license
 * Copyright 2019 Balena Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type * as SDK from 'balena-sdk';
import { stripIndent } from 'common-tags';
import * as _ from 'lodash';

import { ExpectedError } from '../errors';

export const serviceIdToName = _.memoize(
	async (
		sdk: SDK.BalenaSDK,
		serviceId: number,
	): Promise<string | undefined> => {
		const serviceName = await sdk.pine.get<SDK.Service>({
			resource: 'service',
			id: serviceId,
			options: {
				$select: 'service_name',
			},
		});

		if (serviceName != null) {
			return serviceName.service_name;
		}
		return;
	},
	// Memoize the call based on service id
	(_sdk, id) => id.toString(),
);

/**
 * Return Device and Application objects for the given device UUID (short UUID
 * or full UUID). An error is thrown if the application is not accessible, e.g.
 * if the application owner removed the current user as a collaborator (but the
 * device still belongs to the current user).
 */
export const getDeviceAndAppFromUUID = _.memoize(
	async (
		sdk: SDK.BalenaSDK,
		deviceUUID: string,
		selectDeviceFields?: Array<keyof SDK.Device>,
		selectAppFields?: Array<keyof SDK.Application>,
	): Promise<[SDK.Device, SDK.Application]> => {
		const [device, app] = await getDeviceAndMaybeAppFromUUID(
			sdk,
			deviceUUID,
			selectDeviceFields,
			selectAppFields,
		);
		if (app == null) {
			throw new ExpectedError(stripIndent`
				Unable to access the application that device ${deviceUUID} belongs to.
				Hint: check whether the application owner might have withdrawn access to it.
			`);
		}
		return [device, app];
	},
	// Memoize the call based on UUID
	(_sdk, deviceUUID) => deviceUUID,
);

/**
 * Return a Device object and maybe an Application object for the given device
 * UUID (short UUID or full UUID). The Application object may be undefined if
 * the user / device lost access to the application, e.g. if the application
 * owner removed the user as a collaborator (but the device still belongs to
 * the current user).
 */
export const getDeviceAndMaybeAppFromUUID = _.memoize(
	async (
		sdk: SDK.BalenaSDK,
		deviceUUID: string,
		selectDeviceFields?: Array<keyof SDK.Device>,
		selectAppFields?: Array<keyof SDK.Application>,
	): Promise<[SDK.Device, SDK.Application | undefined]> => {
		const pineOpts = {
			$expand: selectAppFields
				? { belongs_to__application: { $select: selectAppFields } }
				: 'belongs_to__application',
		} as SDK.PineOptionsFor<SDK.Device>;
		if (selectDeviceFields) {
			pineOpts.$select = selectDeviceFields as any;
		}
		const device = await sdk.models.device.get(deviceUUID, pineOpts);
		const apps = device.belongs_to__application as SDK.Application[];
		if (_.isEmpty(apps) || _.isEmpty(apps[0])) {
			return [device, undefined];
		}
		return [device, apps[0]];
	},
	// Memoize the call based on UUID
	(_sdk, deviceUUID) => deviceUUID,
);
