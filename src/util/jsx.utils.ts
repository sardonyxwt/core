import {
    CSSProperties,
    ReactNode,
    Ref,
    MutableRefObject,
    MouseEvent as ReactMouseEvent,
    TouchEvent as ReactTouchEvent,
    KeyboardEvent as ReactKeyboardEvent,
} from 'react';

/**
 * @interface CommonProps
 * @description Default react component props.
 */
export interface CommonProps {
    id?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * @interface ChildrenProps
 * @description React children specification for components.
 */
export interface ChildrenProps<T extends unknown | unknown[] = ReactNode> {
    children?: T extends (infer U)[] ? U | U[] : T;
}

/**
 * @type DOMEvent
 * @description Any react/dom event type.
 */
export type DOMEvent =
    | MouseEvent
    | KeyboardEvent
    | TouchEvent
    | ReactMouseEvent
    | ReactTouchEvent
    | ReactKeyboardEvent;

/**
 * @method eventTrap
 * @description Trap react event with include native.
 * @param evt {DOMEvent} Event to trap.
 * @param includeNative {boolean} Include native event to trap flag.
 */
export const eventTrap = (evt: DOMEvent, includeNative = true): void => {
    evt.preventDefault();
    evt.stopPropagation();
    if (evt['nativeEvent'] && includeNative) {
        evt['nativeEvent'].preventDefault();
        evt['nativeEvent'].stopPropagation();
    }
};

/**
 * @method isModifiedEvent
 * @description Util method to detect modified event.
 * @example Command keys pressed
 * @param evt {DOMEvent} Any Event
 * @returns {boolean}
 */
export const isModifiedEvent = (evt: DOMEvent): boolean => {
    return !!(evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey);
};

/**
 * @method mergeRefs
 * @description Merge refs to one ref for one place used.
 * @param refs React refs to use in one place.
 * @returns {(ref: T) => void} React ref callback.
 */
export const mergeRefs =
    <T>(...refs: Array<Ref<T>>) =>
    (ref: T): void => {
        refs.filter((resolvedRef) => !!resolvedRef).map((resolvedRef) => {
            if (typeof resolvedRef === 'function') {
                resolvedRef(ref);
            } else {
                (resolvedRef as MutableRefObject<T>).current = ref;
            }
        });
    };
