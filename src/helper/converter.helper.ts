/**
 * @abstract Converter
 * @description Converter for one side converting.
 * @example DTO -> POJO
 */
export abstract class Converter<In, Out> {
    abstract convert(source: In): Out;

    convertArray(sources: In[]): Out[] {
        return sources.map(this.convert);
    }
}

/**
 * @abstract DoubleSidedConverter
 * @description Converter for double side converting.
 * @example DTO <--> POJO
 */
export abstract class DoubleSidedConverter<In, Out> extends Converter<In, Out> {
    abstract revert(source: Out): In;

    revertArray(sources: Out[]): In[] {
        return sources.map(this.revert);
    }
}

/**
 * @abstract StraightConverter
 * @description Converter straight converting.
 * @example DTO -> POJO -> MODEL
 */
export abstract class StraightConverter<In, Intermediate, Out = In> {
    abstract convertTo(source: In): Intermediate;

    abstract convertFrom(source: Intermediate): Out;

    convertToArray(sources: In[]): Intermediate[] {
        return sources.map(this.convertTo);
    }

    convertFromArray(sources: Intermediate[]): Out[] {
        return sources.map(this.convertFrom);
    }
}

/**
 * @type LambdaConverter
 * @description LambdaConverter easy way for one side converting.
 * @example DTO -> POJO
 */
export type LambdaConverter<In, Out> = (source: In) => Out;

export const createConverter = <In, Out>(
    lambda: LambdaConverter<In, Out>,
): Converter<In, Out> => {
    return new (class extends Converter<In, Out> {
        convert(source: In): Out {
            return lambda(source);
        }
    })();
};

export const createDoubleSidedConverter = <In, Out>(
    lambda: LambdaConverter<In, Out>,
    revertLambda: LambdaConverter<Out, In>,
): DoubleSidedConverter<In, Out> => {
    return new (class extends DoubleSidedConverter<In, Out> {
        convert(source: In): Out {
            return lambda(source);
        }
        revert(source: Out): In {
            return revertLambda(source);
        }
    })();
};

export const createStraightConverter = <In, Intermediate, Out = In>(
    inToIntermediateLambda: LambdaConverter<In, Intermediate>,
    intermediateToOutLambda: LambdaConverter<Intermediate, Out>,
): StraightConverter<In, Intermediate, Out> => {
    return new (class extends StraightConverter<In, Intermediate, Out> {
        convertTo(source: In): Intermediate {
            return inToIntermediateLambda(source);
        }
        convertFrom(source: Intermediate): Out {
            return intermediateToOutLambda(source);
        }
    })();
};
