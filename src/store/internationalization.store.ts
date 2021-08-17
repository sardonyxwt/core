import {
    observable,
    action,
    makeObservable,
    intercept,
    IValueWillChange,
} from 'mobx';
import { saveToArray } from '@source/util/object.utils';

/**
 * @interface TranslationId
 * @description TranslationId identify translation in store.
 */
export interface TranslationId {
    /**
     * @field key
     * @description Key in context.
     * Create Unique pair with locale in context.
     */
    readonly key: string;
    /**
     * @field locale
     * @description Locale in context.
     * Create Unique pair with key in context.
     */
    readonly locale: string;
    /**
     * @field context
     * @description Unique context in application.
     * Used to select loader for config.
     */
    readonly context: string;
}

export type TranslationData = Record<string, unknown>;

/**
 * @interface Translation
 * @description Translation object in store.
 */
export interface Translation {
    /**
     * @field id
     * @description Unique pair of key, locale and context.
     */
    readonly id: TranslationId;
    /**
     * @field data
     * @description Translate unit data.
     */
    readonly data: TranslationData;
}

/**
 * @interface InternationalizationStoreState
 * @description Internationalization store state.
 */
export interface InternationalizationStoreState {
    /**
     * @field currentLocale
     * @description Current locale selected for application.
     */
    currentLocale: string;
    /**
     * @field defaultLocale
     * @description Fallback locale for application.
     */
    defaultLocale: string;
    /**
     * @field locales
     * @description All available locales in application.
     */
    locales: string[];
    /**
     * @field translations
     * @description All loaded translations.
     */
    readonly translations: Translation[];
}

/**
 * @interface InternationalizationStore
 * @description Store for i18n.
 */
export interface InternationalizationStore
    extends InternationalizationStoreState {
    /**
     * @method setTranslations
     * @description Add or replace translations in store.
     * @param translations {Translation[]} Translations to be added or replaced.
     */
    setTranslations(translations: Translation[]): void;

    /**
     * @method setTranslationForLocale
     * @description Add translations to context with locale.
     * @param locale Locale for add translation.
     * @param translationObject Map of key and translation data.
     * @param context Context for translation.
     */
    setTranslationForLocale(
        locale: string,
        translationObject: Record<string, TranslationData>,
        context?: string,
    ): void;

    /**
     * @method findTranslationById
     * @description Return translation with same id.
     * @param id {TranslationId} Id used to find translation in store.
     * @returns {Translation}
     */
    findTranslationById(id: TranslationId): Translation;

    /**
     * @method isLocaleExist
     * @description Check is locale available to use.
     * @param locale {string} Check is locale exist in store.
     * @returns {boolean}
     */
    isLocaleExist(locale: string): boolean;

    /**
     * @method isTranslationExist
     * @description Check is translation with same id present in store.
     * @param id {TranslationId} Id used to check translation present in store.
     * @returns {boolean}
     */
    isTranslationExist(id: TranslationId): boolean;
}

/**
 * @class InternationalizationStoreImpl
 * @description Default realization of InternationalizationStore.
 * You can replace it after core instance created.
 */
export class InternationalizationStoreImpl
    implements InternationalizationStore
{
    currentLocale: string = null;
    defaultLocale: string = null;
    locales: string[] = [];
    readonly translations: Translation[] = [];

    constructor(
        locales: string[] = [],
        currentLocale: string = locales.length > 0 ? locales[0] : null,
        defaultLocale: string = currentLocale,
        translations: Translation[] = [],
    ) {
        this.currentLocale = currentLocale;
        this.defaultLocale = defaultLocale;
        this.locales.push(...locales);
        this.translations.push(...translations);

        makeObservable(this, {
            currentLocale: observable,
            defaultLocale: observable,
            locales: observable,
            translations: observable.shallow,
            setTranslations: action,
            setTranslationForLocale: action,
        });

        intercept(this, 'currentLocale', (change: IValueWillChange<string>) => {
            if (change.newValue) {
                this.checkLocale(change.newValue);
            }
            return change;
        });
        intercept(this, 'defaultLocale', (change: IValueWillChange<string>) => {
            if (change.newValue) {
                this.checkLocale(change.newValue);
            }
            return change;
        });
        intercept(this, 'locales', (change: IValueWillChange<string[]>) => {
            try {
                this.checkLocale(this.currentLocale, change.newValue);
            } catch (e) {
                this.currentLocale = null;
            }
            try {
                this.checkLocale(this.defaultLocale, change.newValue);
            } catch (e) {
                this.defaultLocale = null;
            }
            return change;
        });
    }

    setTranslations(translations: Translation[]): void {
        translations.forEach((translation) =>
            saveToArray(this.translations, translation, (existTranslation) =>
                isTranslationsIdsEqual(translation.id, existTranslation.id),
            ),
        );
    }

    setTranslationForLocale(
        locale: string,
        translationObject: Record<string, TranslationData>,
        context?: string,
    ): void {
        const translations: Translation[] = Object.getOwnPropertyNames(
            translationObject,
        ).map((key) => ({
            id: { key, locale, context },
            data: translationObject[key],
        }));
        this.setTranslations(translations);
    }

    findTranslationById(id: TranslationId): Translation {
        return this.translations.find((translation) =>
            isTranslationsIdsEqual(translation.id, id),
        );
    }

    isLocaleExist(locale: string): boolean {
        return !!this.locales.find((it) => it === locale);
    }

    isTranslationExist(id: TranslationId): boolean {
        return !!this.findTranslationById(id);
    }

    private checkLocale(locale: string, locales = this.locales) {
        const isLocalNotAvailable = !locales.find((it) => it === locale);

        if (isLocalNotAvailable) {
            throw new Error('Locale not present in locales.');
        }
    }
}

/**
 * @function isTranslationsIdsEqual
 * @description Check is translations ids is equals.
 * @param translationId1 {TranslationId} First translation id to check equals.
 * @param translationId2 {TranslationId} Second translation id to check equals.
 * @returns {boolean}
 */
export function isTranslationsIdsEqual(
    translationId1: TranslationId,
    translationId2: TranslationId,
): boolean {
    return (
        translationId1.key === translationId2.key &&
        translationId1.locale === translationId2.locale &&
        translationId1.context === translationId2.context
    );
}
