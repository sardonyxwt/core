import { observable, action, makeObservable } from 'mobx';
import { saveToArray } from '@source/util/object.utils';

/**
 * @interface ConfigId
 * @description ConfigId identify config in store.
 */
export interface ConfigId {
    /**
     * @field key
     * @description Unique key in context.
     */
    readonly key: string;
    /**
     * @field context
     * @description Unique context in application.
     * Used to select loader for config.
     */
    readonly context: string;
}

export type ConfigData = Record<string, unknown>;

/**
 * @interface Config
 * @description Config instance in store.
 */
export interface Config<T extends ConfigData = ConfigData> {
    /**
     * @field id
     * @description Unique pair of key and context.
     */
    readonly id: ConfigId;
    /**
     * @field data
     * @description Config data.
     */
    readonly data: T;
}

/**
 * @interface ConfigStoreState
 * @description Config store state.
 */
export interface ConfigStoreState {
    readonly configs: Config[];
}

/**
 * @interface ConfigStore
 * @description Store for configs.
 */
export interface ConfigStore extends ConfigStoreState {
    /**
     * @method setConfigs
     * @description Add or replace configs in store.
     * @param configs {Config[]} Configs to be added or replaced.
     */
    setConfigs(configs: Config[]): void;

    /**
     * @method findConfigById
     * @description Return config with same id.
     * @param id {ConfigId} Id used to find config in store.
     * @returns {Config<T>}
     */
    findConfigById<T extends ConfigData = ConfigData>(id: ConfigId): Config<T>;

    /**
     * @method isConfigExist
     * @description Check is config with same id present in store.
     * @param id {ConfigId} Id used to check config present in store.
     * @returns {boolean}
     */
    isConfigExist(id: ConfigId): boolean;
}

/**
 * @class ConfigStoreImpl
 * @description Default realization of ConfigStore.
 * You can replace it after core instance created.
 */
export class ConfigStoreImpl implements ConfigStore {
    readonly configs: Config[] = [];

    constructor(configs: Config[] = []) {
        makeObservable(this, {
            configs: observable.shallow,
            setConfigs: action,
        });
        this.configs.push(...configs);
    }

    setConfigs(configs: Config[]): void {
        configs.forEach((config) =>
            saveToArray(this.configs, config, (existConfig) =>
                isConfigsIdsEqual(config.id, existConfig.id),
            ),
        );
    }

    findConfigById<T extends ConfigData = ConfigData>(id: ConfigId): Config<T> {
        return this.configs.find((config) =>
            isConfigsIdsEqual(config.id, id),
        ) as Config<T>;
    }

    isConfigExist(id: ConfigId): boolean {
        return !!this.findConfigById(id);
    }
}

/**
 * @function isConfigsIdsEqual
 * @description Check is configs ids is equals.
 * @param configId1 {ConfigId} First config id to check equals.
 * @param configId2 {ConfigId} Second config id to check equals.
 * @returns {boolean}
 */
export function isConfigsIdsEqual(
    configId1: ConfigId,
    configId2: ConfigId,
): boolean {
    return (
        configId1.key === configId2.key &&
        configId1.context === configId2.context
    );
}
