import { ArraySet, EqualsFunction, Sequence } from '../../../../..';
import { testSet } from './Set.spec';

describe('ArraySet', function() {
  function create<T>(items?: Sequence<T>, comparator?: EqualsFunction<T>): ArraySet<T> {
    return new ArraySet(items, comparator);
  }

  testSet(create);
});
