import {Class} from '@monument/core/Language/Reflection/Class';
import {Property} from '@monument/core/Language/Reflection/Property';
import {BEFORE_EACH_ATTRIBUTE} from '../Constants';


export function BeforeEach(): MethodDecorator {
    return function (target: any, key: PropertyKey) {
        let klass = Class.of(target.constructor);
        let property: Property = klass.getOwnInstanceProperty(key);

        property.setOwnAttribute(BEFORE_EACH_ATTRIBUTE, true);
    };
}
