import { deleteFromArray, saveToArray } from '@source/util/object.utils';
import {
    InternationalizationStore,
    Translation,
    TranslationData,
    TranslationId,
    isTranslationsIdsEqual,
} from '@source/store/internationalization.store';

/**
 * @interface TranslatorArgs
 * @description Args for translator.
 * Contains of defaultValue and args for insert in translated string template.
 */
export interface TranslatorArgs<T> {
    defaultValue?: T;
    [key: string]: unknown;
}

/**
 * @type Translator
 * @description Translator used for app localization.
 */
export interface Translator {
    /**
     * @method
     * @description Return translated value.
     * @param path {string | Record<string, unknown>}
     * path for localization:
     * @example "footer.links.social.facebook"
     * or localization map:
     * @example "{'ru': 'Привет мир', 'en': 'Hello world'}"
     * @param argsOrDefaultValue {T | TranslatorArgs<T>}
     * Default value if translator return undefined
     * or map for replace in translate template with default value.
     * @example "Hello ${name}!" with {name: 'World'} -> "Hello World!"
     */
    <T = string>(
        path: string | Record<string, unknown>,
        argsOrDefaultValue?: T | TranslatorArgs<T>,
    ): T;

    /**
     * @field locale
     * @description Locale of translator.
     */
    locale: string;

    /**
     * @field prefix
     * @description Prefix of all translation calls.
     */
    prefix: string;
}

/**
 * @interface TranslationLoader
 * @description Loader for translation units from any context.
 */
export interface TranslationLoader {
    readonly context: string;
    readonly loader: (
        locale: string,
        key: string,
        context: string,
    ) => TranslationData | Promise<TranslationData>;
}

export type TranslationLoaderResolver = () => TranslationLoader;

interface TranslationPromise {
    readonly id: TranslationId;
    readonly promise: Promise<Translation>;
}

/**
 * @interface ConfigService
 * @description Service manage i18n store and used for translation.
 */
export interface InternationalizationService {
    /**
     * @method setTranslationLoader
     * @description Add or replace exist translation loader.
     * @param loader {TranslationLoader} Loader for replaced or added.
     */
    setTranslationLoader(loader: TranslationLoader): void;

    /**
     * @method addLazyTranslationLoader
     * @description Add lazy initialized translation loader.
     * @param loaderResolver {TranslationLoaderResolver} Loader resolver for replaced or added.
     */
    addLazyTranslationLoader(loaderResolver: TranslationLoaderResolver): void;

    /**
     * @method getTranslationLoader
     * @description Return translation loader with same context.
     * @param context {string} Context for loader.
     * @returns {TranslationLoader}
     */
    getTranslationLoader(context?: string): TranslationLoader;

    /**
     * @method loadTranslation
     * @description Load translation used loader.
     * @param id {TranslationId} for loader.
     * @returns {Translation | Promise<Translation>}
     */
    loadTranslation(id: TranslationId): Translation | Promise<Translation>;

    /**
     * @method getTranslator
     * @description Return translator if present in store.
     * @param context Context of translation.
     * @param locale Locale used for translation.
     * @returns {Translator}
     */
    getTranslator(context: string, locale?: string): Translator;
}

/**
 * @class InternationalizationServiceImpl
 * @description Default realization of InternationalizationService.
 * You can replace it after core instance created.
 */
export class InternationalizationServiceImpl
    implements InternationalizationService
{
    private _isInitialized = false;
    private _translationsPromises: TranslationPromise[] = [];
    private _translationLoaders: TranslationLoader[] = [];
    private _lazyTranslationLoaders: TranslationLoaderResolver[] = [];

    constructor(
        private _store: InternationalizationStore,
        translationLoaders: (
            | TranslationLoader
            | TranslationLoaderResolver
        )[] = [],
    ) {
        translationLoaders.forEach((loader) =>
            typeof loader === 'function'
                ? this._lazyTranslationLoaders.push(loader)
                : this._translationLoaders.push(loader),
        );
    }

    setTranslationLoader(loader: TranslationLoader): void {
        deleteFromArray(
            this._translationsPromises,
            (translationPromise) =>
                translationPromise.id.context === loader.context,
        );
        saveToArray(
            this._translationLoaders,
            loader,
            (translationLoader) => translationLoader.context === loader.context,
        );
    }

    addLazyTranslationLoader(loaderResolver: TranslationLoaderResolver): void {
        if (this._isInitialized) {
            this.setTranslationLoader(loaderResolver());
            return;
        }
        this._lazyTranslationLoaders.push(loaderResolver);
    }

    getTranslationLoader(context?: string): TranslationLoader {
        if (!this._isInitialized) {
            this._isInitialized = true;
            this._lazyTranslationLoaders.forEach((loaderResolver) =>
                this.setTranslationLoader(loaderResolver()),
            );
            this._lazyTranslationLoaders = [];
        }
        return this._translationLoaders.find(
            (loader) => loader.context === context,
        );
    }

    loadTranslation(id: TranslationId): Translation | Promise<Translation> {
        const { _translationsPromises, _store } = this;

        if (_store.isTranslationExist(id)) {
            return _store.findTranslationById(id);
        }

        const translationPromise = _translationsPromises.find((it) =>
            isTranslationsIdsEqual(id, it.id),
        );

        if (translationPromise) {
            return translationPromise.promise;
        }

        const translationLoader = this.getTranslationLoader(id.context);

        if (!translationLoader) {
            throw new Error(
                `Translation loader for key ${JSON.stringify(id)} not found`,
            );
        }

        const translationData =
            translationLoader.loader(id.locale, id.key, id.context) ??
            translationLoader.loader(_store.defaultLocale, id.key, id.context);

        const resolveTranslation = (
            translationData: TranslationData,
        ): Translation => {
            const translation: Translation = {
                id,
                data: translationData,
            };
            _store.setTranslations([translation]);
            return translation;
        };

        if (translationData instanceof Promise) {
            const newTranslationPromise: TranslationPromise = {
                id,
                promise: translationData.then(resolveTranslation),
            };

            newTranslationPromise.promise.then(() =>
                deleteFromArray(
                    this._translationsPromises,
                    (translationPromise) =>
                        isTranslationsIdsEqual(translationPromise.id, id),
                ),
            );

            _translationsPromises.push(newTranslationPromise);
            return newTranslationPromise.promise;
        }

        return resolveTranslation(translationData);
    }

    getTranslator(context: string, locale?: string): Translator {
        const translator: Translator = <T>(
            path: string | Record<string, unknown>,
            argsOrDefaultValue?: T | TranslatorArgs<T>,
        ): T => {
            let resolvedArgs: TranslatorArgs<T> = {};

            if (typeof argsOrDefaultValue === 'string') {
                resolvedArgs = { defaultValue: argsOrDefaultValue };
            } else if (typeof argsOrDefaultValue === 'object') {
                resolvedArgs = argsOrDefaultValue as TranslatorArgs<T>;
            }

            if (typeof path === 'object') {
                return (
                    (path[translator.locale] as T) || resolvedArgs.defaultValue
                );
            }

            if (typeof path !== 'string') {
                throw new Error(`Invalid translator arg path format ${path}`);
            }

            const resolvedPath = `${translator.prefix}${path}`;

            const [key, ...pathParts] = resolvedPath
                .split(/[.\[\]]/)
                .filter((it) => it !== '');

            const translationId: TranslationId = {
                key,
                context,
                locale: locale || this._store.currentLocale,
            };
            const defaultTranslationId: TranslationId = {
                key,
                context,
                locale: this._store.defaultLocale,
            };

            const translation =
                this._store.findTranslationById(translationId) ??
                this._store.findTranslationById(defaultTranslationId);

            if (translation === undefined) {
                return resolvedArgs.defaultValue;
            }

            let result: string | TranslationData = translation.data;

            for (let i = 0; i < pathParts.length && !!result; i++) {
                result = result[pathParts[i]] as TranslationData;
            }

            if (result === undefined) {
                return resolvedArgs.defaultValue;
            }

            if (typeof result !== 'string') {
                return result as unknown as T;
            }

            Object.keys(resolvedArgs).forEach((argKey) => {
                const templateArgument = resolvedArgs[argKey] ?? '';
                result = (result as string).replace(
                    `\${${argKey}}`,
                    typeof templateArgument === 'string'
                        ? templateArgument
                        : JSON.stringify(templateArgument),
                );
            });

            return result;
        };

        translator.locale = locale || this._store.currentLocale;
        translator.prefix = '';

        return translator;
    }
}
