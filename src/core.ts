import Container from 'bottlejs';
import {
    createEventBus,
    getEventBus,
    isEventBusExist,
    setEventBusDevTool,
    Eventbus,
} from './eventbus';

import { Context } from './context';

import { Resource, ResourceStore } from './store/resource.store';
import {
    InternationalizationStore,
    Translation,
} from './store/internationalization.store';
import { Config, ConfigStore } from './store/config.store';
import { Module, ModuleStore } from './store/module.store';

import {
    ResourceLoader,
    ResourceLoaderResolver,
    ResourceService,
} from './service/resource.service';
import {
    InternationalizationService,
    TranslationLoader,
    TranslationLoaderResolver,
} from './service/internationalization.service';
import {
    ConfigService,
    ConfigLoader,
    ConfigLoaderResolver,
} from './service/config.service';
import {
    ModuleService,
    ModuleLoader,
    ModuleLoaderResolver,
} from './service/module.service';

import { StateObserverHook } from './hook/state-observer.hook';
import { EventHook } from './hook/event.hook';
import { ResourceHook } from './hook/resource.hook';
import { DependencyHook } from './hook/dependency.hook';
import {
    InternationalizationHook,
    TranslatorHook,
} from './hook/internationalization.hook';
import { ConfigHook } from './hook/config.hook';
import { ModuleHook } from './hook/module.hook';
import { ReadyHook } from './hook/ready.hook';

/**
 * @interface CoreConfig
 * @description Initialization config for core module
 */
export interface CoreConfig {
    /**
     * @field name
     * @description Name for global scope declaration.
     * @default By default Core.
     */
    name?: string;
    /**
     * @field bottle
     * @description Bottlejs instance used in core module.
     */
    bottle?: Container;
    /**
     * @field modules
     * @description Predefined modules in application.
     */
    modules?: Module[];
    /**
     * @field resources
     * @description Predefined resources in application.
     */
    resources?: Resource[];
    /**
     * @field configs
     * @description Predefined configs in application.
     */
    configs?: Config[];
    /**
     * @field locales
     * @description Available locales in application.
     */
    locales?: string[];
    /**
     * @field currentLocale
     * @description Current locale of application.
     */
    currentLocale?: string;
    /**
     * @field defaultLocale
     * @description Fallback locale of application.
     */
    defaultLocale?: string;
    /**
     * @field translateUnits
     * @description Predefined translation units in application.
     */
    translateUnits?: Translation[];
    /**
     * @field moduleLoaders
     * @description Predefined modules loaders.
     */
    moduleLoaders?: (ModuleLoader | ModuleLoaderResolver)[];
    /**
     * @field resourceLoaders
     * @description Predefined resources loaders.
     */
    resourceLoaders?: (ResourceLoader | ResourceLoaderResolver)[];
    /**
     * @field translateUnitLoaders
     * @description Predefined translate units loaders.
     */
    translateUnitLoaders?: (TranslationLoader | TranslationLoaderResolver)[];
    /**
     * @field configLoaders
     * @description Predefined configs loaders.
     */
    configLoaders?: (ConfigLoader | ConfigLoaderResolver)[];
}

/**
 * @interface Core
 * @description Core module facade.
 */
export type Core = Readonly<{
    name: string;
    resource: {
        store: ResourceStore;
        service: ResourceService;
    };
    internationalization: {
        store: InternationalizationStore;
        service: InternationalizationService;
    };
    config: {
        store: ConfigStore;
        service: ConfigService;
    };
    module: {
        store: ModuleStore;
        service: ModuleService;
    };
    context: Context;
    eventBus: Eventbus;
    bottle: Container;
    container: Container.IContainer;

    createEventBus: typeof createEventBus;
    isEventBusExist: typeof isEventBusExist;
    getEventBus: typeof getEventBus;
    setEventBusDevTool: typeof setEventBusDevTool;

    useReady: ReadyHook;
    useStateObserver: StateObserverHook;
    useEvent: EventHook;
    useDependency: DependencyHook;
    useModule: ModuleHook;
    useResource: ResourceHook;
    useInternationalization: InternationalizationHook;
    useTranslator: TranslatorHook;
    useConfig: ConfigHook;
}>;
