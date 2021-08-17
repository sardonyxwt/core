import { useEffect, useState } from 'react';
import { reaction } from 'mobx';
import {
    Translator,
    TranslatorArgs,
} from '@source/service/internationalization.service';
import { TranslationId } from '@source/store/internationalization.store';
import { Core } from '@source/core';
import { ROOT_CONTEXT } from '@source/constants';

export interface InternationalizationHookReturnType {
    setLocale: (locale: string) => void;
    currentLocale: string;
    defaultLocale: string;
    locales: string[];
}

export type InternationalizationHook = () => InternationalizationHookReturnType;

/**
 * @function createInternationalizationHook
 * @param coreGlobalRegisterName {string} Core instance global name.
 * @returns React hook for internationalization managing.
 */
export const createInternationalizationHook = (
    coreGlobalRegisterName: string,
): InternationalizationHook => {
    return (): InternationalizationHookReturnType => {
        const core = global[coreGlobalRegisterName] as Core;

        const store = core.internationalization.store;
        const prepareI18nState = (): InternationalizationHookReturnType => ({
            setLocale: (locale: string) => (store.currentLocale = locale),
            currentLocale: store.currentLocale,
            defaultLocale: store.defaultLocale,
            locales: store.locales,
        });

        const [internationalizationState, setInternationalizationState] =
            useState<InternationalizationHookReturnType>(prepareI18nState);

        useEffect(
            () => reaction(prepareI18nState, setInternationalizationState),
            [],
        );

        return internationalizationState;
    };
};

export type TranslatorHookReturnType = [Translator, boolean];

/**
 * @type TranslatorHook
 * @description React hook for translation.
 * @param translationKey {string} Translation key.
 * @param context {string} Translation context for loader selection.
 * @returns {TranslatorHookReturnType}
 * */
export type TranslatorHook = (
    translationKey: string,
    context?: string,
) => TranslatorHookReturnType;

/**
 * @function createTranslatorHook
 * @param coreGlobalRegisterName {string} Core instance global name.
 * @returns React hook for translation loading used loaders
 * and translation.
 */
export const createTranslatorHook = (
    coreGlobalRegisterName: string,
): TranslatorHook => {
    return (
        translationKey: string,
        context = ROOT_CONTEXT,
    ): TranslatorHookReturnType => {
        const core = global[coreGlobalRegisterName] as Core;

        const getTranslator = (): Translator => {
            const translator = core.internationalization.service.getTranslator(
                context,
                core.internationalization.store.currentLocale,
            );
            translator.prefix = `${translationKey}.`;
            return translator;
        };

        const getId = (): TranslationId => ({
            key: translationKey,
            context,
            locale: core.internationalization.store.currentLocale,
        });

        const prepareTranslator = () => {
            const id = getId();
            if (core.internationalization.store.isTranslationExist(id)) {
                return getTranslator();
            }
            const translation =
                core.internationalization.service.loadTranslation(id);
            if (translation instanceof Promise) {
                return;
            }
            return getTranslator();
        };

        const [translator, setTranslator] =
            useState<Translator>(prepareTranslator);

        useEffect(
            () =>
                reaction(
                    prepareTranslator,
                    (translator) =>
                        translator && setTranslator(() => translator),
                ),
            [],
        );

        return [
            translator ||
                ((<T>(_, argsOrDefaultValue?: T | TranslatorArgs<T>) =>
                    typeof argsOrDefaultValue === 'object' &&
                    !Array.isArray(argsOrDefaultValue)
                        ? (argsOrDefaultValue as TranslatorArgs<T>).defaultValue
                        : argsOrDefaultValue) as Translator),
            !!translator,
        ];
    };
};
