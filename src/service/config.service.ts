import { deleteFromArray, saveToArray } from '@source/util/object.utils';
import {
    Config,
    ConfigData,
    ConfigId,
    ConfigStore,
    isConfigsIdsEqual,
} from '@source/store/config.store';

/**
 * @interface ConfigLoader
 * @description Loader for configs from any context.
 */
export interface ConfigLoader {
    readonly context: string;
    readonly loader: (
        key: string,
        context: string,
    ) => ConfigData | Promise<ConfigData>;
}

export type ConfigLoaderResolver = () => ConfigLoader;

interface ConfigPromise {
    readonly id: ConfigId;
    readonly promise: Promise<Config>;
}

/**
 * @interface ConfigService
 * @description Service manage config store.
 */
export interface ConfigService {
    /**
     * @method setConfigLoader
     * @description Add or replace exist config loader.
     * @param loader {ConfigLoader} Loader for replaced or added.
     */
    setConfigLoader(loader: ConfigLoader): void;

    /**
     * @method addLazyConfigLoader
     * @description Add lazy initialized config loader.
     * @param loaderResolver {ConfigLoaderResolver} Loader resolver for replaced or added.
     */
    addLazyConfigLoader(loaderResolver: ConfigLoaderResolver): void;

    /**
     * @method getConfigLoader
     * @description Return config loader with same context.
     * @param context {string} Context for loader.
     * @returns {ConfigLoader}
     */
    getConfigLoader(context?: string): ConfigLoader;

    /**
     * @method loadConfig
     * @description Load config used loader.
     * @param id {ConfigId} for loader.
     * @returns {Config<T> | Promise<Config<T>>}
     */
    loadConfig<T extends ConfigData>(
        id: ConfigId,
    ): Config<T> | Promise<Config<T>>;
}

/**
 * @class ConfigServiceImpl
 * @description Default realization of ConfigService.
 * You can replace it after core instance created.
 */
export class ConfigServiceImpl implements ConfigService {
    private _isInitialized = false;
    private _configPromises: ConfigPromise[] = [];
    private _configLoaders: ConfigLoader[] = [];
    private _lazyConfigLoaders: ConfigLoaderResolver[] = [];

    constructor(
        private _store: ConfigStore,
        configLoaders: (ConfigLoader | ConfigLoaderResolver)[] = [],
    ) {
        configLoaders.forEach((loader) =>
            typeof loader === 'function'
                ? this._lazyConfigLoaders.push(loader)
                : this._configLoaders.push(loader),
        );
    }

    setConfigLoader(loader: ConfigLoader): void {
        deleteFromArray(
            this._configPromises,
            (configPromise) => configPromise.id.context === loader.context,
        );
        saveToArray(
            this._configLoaders,
            loader,
            (configLoader) => configLoader.context === loader.context,
        );
    }

    addLazyConfigLoader(loaderResolver: ConfigLoaderResolver): void {
        if (this._isInitialized) {
            this.setConfigLoader(loaderResolver());
            return;
        }
        this._lazyConfigLoaders.push(loaderResolver);
    }

    getConfigLoader(context?: string): ConfigLoader {
        if (!this._isInitialized) {
            this._isInitialized = true;
            this._lazyConfigLoaders.forEach((loaderResolver) =>
                this.setConfigLoader(loaderResolver()),
            );
            this._lazyConfigLoaders = [];
        }
        return this._configLoaders.find((loader) => loader.context === context);
    }

    loadConfig<T extends ConfigData>(
        id: ConfigId,
    ): Config<T> | Promise<Config<T>> {
        const { _configPromises, _store } = this;

        if (_store.isConfigExist(id)) {
            return _store.findConfigById(id);
        }

        const configPromise = _configPromises.find((it) =>
            isConfigsIdsEqual(id, it.id),
        );

        if (configPromise) {
            return configPromise.promise as Promise<Config<T>>;
        }

        const configLoader = this.getConfigLoader(id.context);

        if (!configLoader) {
            throw new Error(
                `Config loader for key ${JSON.stringify(id)} not found`,
            );
        }

        const configData = configLoader.loader(id.key, id.context) as T;

        const resolveConfig = (configData: T): Config<T> => {
            const config: Config<T> = { id, data: configData };
            _store.setConfigs([config]);
            return config;
        };

        if (configData instanceof Promise) {
            const newConfigPromise: ConfigPromise = {
                id,
                promise: configData.then(resolveConfig),
            };

            newConfigPromise.promise.then(() =>
                deleteFromArray(this._configPromises, (configPromise) =>
                    isConfigsIdsEqual(configPromise.id, id),
                ),
            );

            _configPromises.push(newConfigPromise);
            return newConfigPromise.promise as Promise<Config<T>>;
        }

        return resolveConfig(configData);
    }
}
