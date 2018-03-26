import {Target} from '@monument/core/main/decorators/Target';
import {DecoratorTarget} from '@monument/core/main/decorators/support/DecoratorTarget';
import {WithDecorator} from '@monument/reflection/main/decorators/WithDecorator';


export function Primary(): ClassDecorator {
    return function () {
        Target([DecoratorTarget.CLASS, DecoratorTarget.METHOD])(...arguments);
        WithDecorator(Primary)(...arguments);
    };
}
