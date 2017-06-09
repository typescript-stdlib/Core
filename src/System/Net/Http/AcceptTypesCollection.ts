import {Enumerable} from '../../../Core/Collections/Enumerable';
import {AcceptType} from './AcceptType';
import {IgnoreCaseComparator} from '../../../Core/Text/IgnoreCaseComparator';
import {InvalidOperationException} from '../../../Core/Exceptions/InvalidOperationException';
import {assertArgumentNotNull} from '../../../Core/Assertion/Assert';


export class AcceptTypesCollection extends Enumerable<AcceptType> {
    public add(type: AcceptType): void {
        assertArgumentNotNull('type', type);

        Array.prototype.push.call(this, type);
    }


    public addType(mimeType: string, priority: number): void {
        assertArgumentNotNull('mimeType', mimeType);
        assertArgumentNotNull('priority', priority);

        this.add(new AcceptType(mimeType, priority));
    }


    public contains(acceptType: AcceptType): boolean {
        for (let type of this) {
            if (type === acceptType) {
                return true;
            }
        }

        return false;
    }


    public containsType(mimeType: string): boolean {
        for (let type of this) {
            if (IgnoreCaseComparator.instance.equals(type.mimeType, mimeType)) {
                return true;
            }
        }

        return false;
    }


    public getTypePriority(mimeType: string): number {
        assertArgumentNotNull('mimeType', mimeType);

        for (let type of this) {
            if (IgnoreCaseComparator.instance.equals(type.mimeType, mimeType)) {
                return type.priority;
            }
        }

        throw new InvalidOperationException(`Unable to get priority for '${mimeType}'. Type was not found.`);
    }


    public getTypeWithMaxPriority(): AcceptType {
        if (this.length === 0) {
            throw new InvalidOperationException(`Unable to perform operation on empty collection.`);
        }

        let typeWithMaxPriority: AcceptType = this[0];

        for (let type of this) {
            if (typeWithMaxPriority.priority < type.priority) {
                typeWithMaxPriority = type;
            }
        }

        return typeWithMaxPriority;
    }
}
