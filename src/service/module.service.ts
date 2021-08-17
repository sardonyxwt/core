import { saveToArray, deleteFromArray } from '@source/util/object.utils';
import {
    isModulesIdsEqual,
    Module,
    ModuleId,
    ModuleStore,
} from '@source/store/module.store';

/**
 * @interface ModuleLoader
 * @description Loader for modules from any context.
 */
export interface ModuleLoader {
    readonly context: string;
    readonly loader: (
        key: string,
        context: string,
    ) => unknown | Promise<unknown>;
}

export type ModuleLoaderResolver = () => ModuleLoader;

interface ModulePromise {
    readonly id: ModuleId;
    readonly promise: Promise<Module>;
}

/**
 * @interface ModuleService
 * @description Service manage module store.
 */
export interface ModuleService {
    /**
     * @method setModuleLoader
     * @description Add or replace exist module loader.
     * @param loader {ModuleLoader} Loader for replaced or added.
     */
    setModuleLoader(loader: ModuleLoader): void;

    /**
     * @method addLazyModuleLoader
     * @description Add lazy initialized module loader.
     * @param loaderResolver {ModuleLoaderResolver} Loader resolver for replaced or added.
     */
    addLazyModuleLoader(loaderResolver: ModuleLoaderResolver): void;

    /**
     * @method getModuleLoader
     * @description Return module loader.
     * @param context {string} Context for loader.
     * @returns {ModuleLoader}
     */
    getModuleLoader(context?: string): ModuleLoader;

    /**
     * @method loadModule
     * @description Load config used loader.
     * @param id {ConfigId} for loader.
     * @returns {Module<T> | Promise<Module<T>>}
     */
    loadModule<T>(id: ModuleId): Module<T> | Promise<Module<T>>;
}

/**
 * @class ModuleServiceImpl
 * @description Default realization of ModuleService.
 * You can replace it after core instance created.
 */
export class ModuleServiceImpl implements ModuleService {
    private _isInitialized = false;
    private _modulePromises: ModulePromise[] = [];
    private _moduleLoaders: ModuleLoader[] = [];
    private _lazyModuleLoaders: ModuleLoaderResolver[] = [];

    constructor(
        private _store: ModuleStore,
        moduleLoaders: (ModuleLoader | ModuleLoaderResolver)[] = [],
    ) {
        moduleLoaders.forEach((loader) =>
            typeof loader === 'function'
                ? this._lazyModuleLoaders.push(loader)
                : this._moduleLoaders.push(loader),
        );
    }

    setModuleLoader(loader: ModuleLoader): void {
        deleteFromArray(
            this._modulePromises,
            (modulePromise) => modulePromise.id.context === loader.context,
        );
        saveToArray(
            this._moduleLoaders,
            loader,
            (moduleLoader) => moduleLoader.context === loader.context,
        );
    }

    addLazyModuleLoader(loaderResolver: ModuleLoaderResolver): void {
        if (this._isInitialized) {
            this.setModuleLoader(loaderResolver());
            return;
        }
        this._lazyModuleLoaders.push(loaderResolver);
    }

    getModuleLoader(context?: string): ModuleLoader {
        if (!this._isInitialized) {
            this._isInitialized = true;
            this._lazyModuleLoaders.forEach((loaderResolver) =>
                this.setModuleLoader(loaderResolver()),
            );
            this._lazyModuleLoaders = [];
        }
        return this._moduleLoaders.find((loader) => loader.context === context);
    }

    loadModule<T>(id: ModuleId): Module<T> | Promise<Module<T>> {
        const { _modulePromises, _store } = this;

        if (_store.isModuleExist(id)) {
            return _store.findModuleById(id);
        }

        const modulePromise = _modulePromises.find((it) =>
            isModulesIdsEqual(id, it.id),
        );

        if (modulePromise) {
            return modulePromise.promise as Promise<Module<T>>;
        }

        const moduleLoader = this.getModuleLoader(id.context);

        if (!moduleLoader) {
            throw new Error(
                `Module loader for key ${JSON.stringify(id)} not found`,
            );
        }

        const moduleBody = moduleLoader.loader(id.key, id.context);

        const resolveModule = (moduleBody: unknown): Module => {
            const module: Module = { id, body: moduleBody };
            _store.setModules([module]);
            return module;
        };

        if (moduleBody instanceof Promise) {
            const newModulePromise: ModulePromise = {
                id,
                promise: moduleBody.then(resolveModule),
            };

            newModulePromise.promise.then(() =>
                deleteFromArray(this._modulePromises, (modulePromise) =>
                    isModulesIdsEqual(modulePromise.id, id),
                ),
            );

            _modulePromises.push(newModulePromise);
            return newModulePromise.promise as Promise<Module<T>>;
        }

        return resolveModule(moduleBody) as Module<T>;
    }
}
