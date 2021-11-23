import { addFunctionModule } from './sdk';
import processor from './ParamMgrProcessor.js';
import ParamMappingConfigurator from './ParamConfigurator.js';
import ParamMgrNode from './ParamMgrNode.js';
/** @typedef {import('@webaudiomodules/api').WebAudioModule} WebAudioModule */
/** @typedef {import('./types').ParametersMappingConfiguratorOptions} ParametersMappingConfiguratorOptions */
/** @typedef {import('./types').ParamMgrOptions} ParamMgrOptions */
/** @typedef {import('./types').AudioWorkletRegister} AudioWorkletRegister */

export default class ParamMgrFactory {
	/**
	 * @param {WebAudioModule} module
	 * @param {ParametersMappingConfiguratorOptions} [optionsIn = {}]
	 */
	static async create(module, optionsIn = {}) {
		const { audioContext, moduleId: processorId, instanceId } = module;
		const { paramsConfig, paramsMapping, internalParamsConfig } = new ParamMappingConfigurator(optionsIn);
		const initialParamsValue = Object.entries(paramsConfig)
			.reduce((currentParams, [name, { defaultValue }]) => {
				currentParams[name] = defaultValue;
				return currentParams;
			}, {});
		const serializableParamsConfig = Object.entries(paramsConfig)
			.reduce((currentParams, [name, { id, label, type, defaultValue, minValue, maxValue, discreteStep, exponent, choices, units }]) => {
				currentParams[name] = { id, label, type, defaultValue, minValue, maxValue, discreteStep, exponent, choices, units };
				return currentParams;
			}, {});
		await addFunctionModule(audioContext.audioWorklet, processor, processorId, serializableParamsConfig);
		/** @type {ParamMgrOptions} */
		const options = {
			internalParamsConfig,
			parameterData: initialParamsValue,
			processorOptions: {
				paramsConfig,
				paramsMapping,
				internalParamsMinValues: Object.values(internalParamsConfig)
					.map((config) => Math.max(0, config?.minValue || 0)),
				internalParams: Object.keys(internalParamsConfig),
				instanceId,
				processorId,
			},
		};
		const node = new ParamMgrNode(module, options);
		await node.initialize();
		return node;
	}
}
