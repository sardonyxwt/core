import { useState, useEffect } from 'react';
import { Core } from '@source/core';

/**
 * @type DependencyHook
 * @description React hook for dependency injection.
 * @param id {string} Dependency id of dependency.
 * @param async {boolean} Check if dependency resolved return it or wait when resolved.
 * @returns {T}
 * */
export type DependencyHook = <T>(id: string, async?: boolean) => T;

/**
 * @function createDependencyHook
 * @param coreGlobalRegisterName {string} Core instance global name.
 * @returns React hook to manage dependencies.
 */
export const createDependencyHook = (
    coreGlobalRegisterName: string,
): DependencyHook => {
    return <T>(id: string, async = false): T => {
        const core = global[coreGlobalRegisterName] as Core;

        const [dependency, setDependency] = useState<T>(() => {
            if (typeof id !== 'string') {
                return;
            }
            const dependency = core.container[id];
            if (async && dependency instanceof Promise) {
                return;
            }
            return dependency;
        });

        useEffect(() => {
            if (typeof id !== 'string') {
                return;
            }
            const dependency = core.container[id];
            if (async && dependency instanceof Promise) {
                Promise.resolve(dependency).then((dependency) =>
                    setDependency(() => dependency),
                );
            } else {
                setDependency(() => dependency);
            }
        }, [id]);

        return dependency;
    };
};
