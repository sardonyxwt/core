import { useState, useEffect } from 'react';
import { Core } from '@source/core';
import { ROOT_CONTEXT } from '@source/constants';
import { Module, ModuleId } from '@source/store/module.store';

/**
 * @type ModuleHook
 * @description React hook for module loading.
 * @param key {string} Module key.
 * @param context {string} Module context for loader selection.
 * @returns {[T, boolean]} Cortege of module body and ready status.
 * */
export type ModuleHook = <T = unknown>(
    key: string,
    context?: string,
) => [T, boolean];

/**
 * @function createModuleHook
 * @param coreGlobalRegisterName {string} Core instance global name.
 * @returns React hook for module loading used loaders.
 */
export const createModuleHook = (
    coreGlobalRegisterName: string,
): ModuleHook => {
    return <T = unknown>(key: string, context = ROOT_CONTEXT): [T, boolean] => {
        const core = global[coreGlobalRegisterName] as Core;

        const id: ModuleId = { key, context };

        const prepareModule = <T>() => {
            if (core.module.store.isModuleExist(id)) {
                return core.module.store.findModuleById<T>(id);
            }
            const module = core.module.service.loadModule<T>(id);
            if (module instanceof Promise) {
                return;
            }
            return module;
        };

        const [module, setModule] = useState<Module<T>>(prepareModule);

        useEffect(() => {
            if (module) {
                return;
            }
            Promise.resolve(core.module.service.loadModule<T>(id)).then(
                (module) => setModule(() => module),
            );
        }, [module]);

        return [module?.body, !!module];
    };
};
