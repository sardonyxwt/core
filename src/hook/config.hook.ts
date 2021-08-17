import { useState, useEffect } from 'react';
import { ConfigData, ConfigId } from '@source/store/config.store';
import { Core } from '@source/core';
import { ROOT_CONTEXT } from '@source/constants';

/**
 * @type ConfigHook
 * @description React hook for config loading.
 * @param key {string} Config key.
 * @param context {string} Config context for loader selection.
 * @returns {T}
 * */
export type ConfigHook = <T extends ConfigData = ConfigData>(
    key: string,
    context?: string,
) => T;

/**
 * @function createConfigHook
 * @param coreGlobalRegisterName {string} Core instance global name.
 * @returns React hook for config loading used loaders.
 */
export const createConfigHook = (
    coreGlobalRegisterName: string,
): ConfigHook => {
    return <T extends ConfigData = ConfigData>(
        key: string,
        context = ROOT_CONTEXT,
    ): T => {
        const core = global[coreGlobalRegisterName] as Core;

        const id: ConfigId = { key, context };

        const prepareConfigData = () => {
            if (core.config.store.isConfigExist(id)) {
                return core.config.store.findConfigById<T>(id).data;
            }
            const config = core.config.service.loadConfig<T>(id);
            if (config instanceof Promise) {
                return;
            }
            return config.data;
        };

        const [config, setConfig] = useState<T>(prepareConfigData);

        useEffect(() => {
            if (config) {
                return;
            }
            Promise.resolve(core.config.service.loadConfig<T>(id)).then(
                (config) => setConfig(() => config.data),
            );
        }, [config]);

        return config;
    };
};
