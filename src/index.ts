import Container from 'bottlejs';
import {
    createEventBus,
    getEventBus,
    isEventBusExist,
    setEventBusDevTool,
} from './eventbus';

import { CoreTypes } from './types';
import { createContext } from './context';

import { ResourceStore, ResourceStoreImpl } from './store/resource.store';
import { ModuleStore, ModuleStoreImpl } from './store/module.store';
import {
    InternationalizationStore,
    InternationalizationStoreImpl,
} from './store/internationalization.store';
import { ConfigStore, ConfigStoreImpl } from './store/config.store';

import {
    ResourceService,
    ResourceServiceImpl,
} from './service/resource.service';
import { ModuleService, ModuleServiceImpl } from './service/module.service';
import {
    InternationalizationService,
    InternationalizationServiceImpl,
} from './service/internationalization.service';
import { ConfigService, ConfigServiceImpl } from './service/config.service';

import { useStateObserver } from './hook/state-observer.hook';
import { createEventHook } from './hook/event.hook';
import { createResourceHook } from './hook/resource.hook';
import { createModuleHook } from './hook/module.hook';
import { createDependencyHook } from './hook/dependency.hook';
import {
    createInternationalizationHook,
    createTranslatorHook,
} from './hook/internationalization.hook';
import { createConfigHook } from './hook/config.hook';

import { CoreConfig, Core } from './core';
import { DEFAULT_NAME } from './constants';
import { env } from './env';
import { useReady } from './hook/ready.hook';

export * from './eventbus';
export * from './types';
export * from './context';

export * from './store/resource.store';
export * from './store/internationalization.store';
export * from './store/config.store';

export * from './service/internationalization.service';
export * from './service/config.service';
export * from './service/resource.service';

export * from './hook/event.hook';
export * from './hook/dependency.hook';
export * from './hook/internationalization.hook';
export * from './hook/config.hook';
export * from './hook/resource.hook';
export * from './hook/module.hook';
export * from './hook/state-observer.hook';

export * from './helper/converter.helper';

export * from './util/object.utils';
export * from './util/jsx.utils';
export * from './util/url.utils';

export * from './core';

export * from './exceptions';
export * from './constants';

export { Container };

export type CoreInitListener = (
    core: Core,
) => boolean | void | Promise<boolean | void>;

// Write Core package version to console
console.log(`Core version: ${env.version}`);

const initializedListeners: CoreInitListener[] = [];

/**
 * @function createCoreInstance
 * @description Create core instance and register it on global.
 * @param config {CoreConfig} Initial config for core module.
 * @returns {Core}
 */
export async function createCoreInstance(
    config: CoreConfig = {},
): Promise<Core> {
    const globalName = config.name || DEFAULT_NAME;

    // Check Core instance is present for HMR
    if (!!global[globalName]) {
        throw new Error(
            `Core instance present in global object with name: ${globalName}`,
        );
    }

    const context = createContext(globalName, config.bottle);

    context.bottle.constant(CoreTypes.EventBus, context.eventBus);

    context.bottle.factory(
        CoreTypes.ConfigStore,
        () => new ConfigStoreImpl(config.configs),
    );

    context.bottle.factory(
        CoreTypes.InternationalizationStore,
        () =>
            new InternationalizationStoreImpl(
                config.locales,
                config.currentLocale,
                config.defaultLocale,
                config.translateUnits,
            ),
    );

    context.bottle.factory(
        CoreTypes.ResourceStore,
        () => new ResourceStoreImpl(config.resources),
    );

    context.bottle.factory(
        CoreTypes.ModuleStore,
        () => new ModuleStoreImpl(config.modules),
    );

    context.bottle.factory(
        CoreTypes.ConfigService,
        (container) =>
            new ConfigServiceImpl(
                container[CoreTypes.ConfigStore] as ConfigStore,
                config.configLoaders,
            ),
    );

    context.bottle.factory(
        CoreTypes.InternationalizationService,
        (container) =>
            new InternationalizationServiceImpl(
                container[
                    CoreTypes.InternationalizationStore
                ] as InternationalizationStore,
                config.translateUnitLoaders,
            ),
    );

    context.bottle.factory(
        CoreTypes.ResourceService,
        (container) =>
            new ResourceServiceImpl(
                container[CoreTypes.ResourceStore] as ResourceStore,
                config.resourceLoaders,
            ),
    );

    context.bottle.factory(
        CoreTypes.ModuleService,
        (container) =>
            new ModuleServiceImpl(
                container[CoreTypes.ModuleStore] as ModuleStore,
                config.moduleLoaders,
            ),
    );

    const core: Core = {
        get name() {
            return globalName;
        },
        get resource() {
            return {
                get store() {
                    return context.bottle.container[
                        CoreTypes.ResourceStore
                    ] as ResourceStore;
                },
                get service() {
                    return context.bottle.container[
                        CoreTypes.ResourceService
                    ] as ResourceService;
                },
            };
        },
        get internationalization() {
            return {
                get store() {
                    return context.bottle.container[
                        CoreTypes.InternationalizationStore
                    ] as InternationalizationStore;
                },
                get service() {
                    return context.bottle.container[
                        CoreTypes.InternationalizationService
                    ] as InternationalizationService;
                },
            };
        },
        get config() {
            return {
                get store() {
                    return context.bottle.container[
                        CoreTypes.ConfigStore
                    ] as ConfigStore;
                },
                get service() {
                    return context.bottle.container[
                        CoreTypes.ConfigService
                    ] as ConfigService;
                },
            };
        },
        get module() {
            return {
                get store() {
                    return context.bottle.container[
                        CoreTypes.ModuleStore
                    ] as ModuleStore;
                },
                get service() {
                    return context.bottle.container[
                        CoreTypes.ModuleService
                    ] as ModuleService;
                },
            };
        },
        get context() {
            return context;
        },
        get eventBus() {
            return context.eventBus;
        },
        get bottle() {
            return context.bottle;
        },
        get container() {
            return context.bottle.container;
        },

        createEventBus: createEventBus,
        isEventBusExist: isEventBusExist,
        getEventBus: getEventBus,
        setEventBusDevTool: setEventBusDevTool,

        useReady,
        useStateObserver,
        useEvent: createEventHook(globalName),
        useModule: createModuleHook(globalName),
        useResource: createResourceHook(globalName),
        useInternationalization: createInternationalizationHook(globalName),
        useTranslator: createTranslatorHook(globalName),
        useConfig: createConfigHook(globalName),
        useDependency: createDependencyHook(globalName),
    };

    global[globalName] = core;

    for (let i = 0; i < initializedListeners.length; ) {
        const listener = initializedListeners[i];
        const useListenerAutoDeletion = await listener(core);
        if (useListenerAutoDeletion) {
            initializedListeners.slice(i, 1);
            continue;
        }
        i++;
    }

    return core;
}

export const whenCoreInit = (listener: CoreInitListener): void => {
    initializedListeners.push(listener);
};
