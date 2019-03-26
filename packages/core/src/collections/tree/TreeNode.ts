import { InvalidArgumentException } from '../../exceptions/InvalidArgumentException';
import { ReadOnlyList } from '../list/readonly/ReadOnlyList';
import { ArrayList } from '../list/mutable/ArrayList';

/**
 * @author Alex Chugaev
 * @since 0.0.1
 * @mutable
 */
export class TreeNode<T = any> {
    private readonly _childNodes: ArrayList<TreeNode<T>> = new ArrayList();
    private _parentNode: TreeNode<T> | undefined;

    public data: T | undefined;

    public get childNodes(): ReadOnlyList<TreeNode<T>> {
        return this._childNodes;
    }

    public get childNodesCount(): number {
        return this._childNodes.length;
    }

    public get depth(): number {
        let depth = 0;
        let parentNode: TreeNode<T> | undefined = this.parentNode;

        while (parentNode != null) {
            depth += 1;
            parentNode = parentNode.parentNode;
        }

        return depth;
    }

    public get firstChild(): TreeNode<T> | undefined {
        if (this.hasChildNodes) {
            return this.childNodes.getAt(0);
        } else {
            return undefined;
        }
    }

    public get hasChildNodes(): boolean {
        return this.childNodes.isEmpty === false;
    }

    public get isDetached(): boolean {
        return this._parentNode == null;
    }

    public get lastChild(): TreeNode<T> | undefined {
        if (this.hasChildNodes) {
            return this.childNodes.getAt(this.childNodes.lastIndex);
        } else {
            return undefined;
        }
    }

    public get nextSibling(): TreeNode<T> | undefined {
        let indexOfCurrentNode: number;

        if (!this.parentNode) {
            return undefined;
        }

        indexOfCurrentNode = this.parentNode.childNodes.indexOf(this);

        return this.parentNode.childNodes.getAt(indexOfCurrentNode + 1);
    }

    public get parentNode(): TreeNode<T> | undefined {
        return this._parentNode;
    }

    public get path(): Iterable<TreeNode<T>> {
        return this.getPath();
    }

    public get previousSibling(): TreeNode<T> | undefined {
        let indexOfCurrentNode: number;

        if (!this.parentNode) {
            return undefined;
        }

        indexOfCurrentNode = this.parentNode.childNodes.indexOf(this);

        return this.parentNode.childNodes.getAt(indexOfCurrentNode - 1);
    }

    public constructor(data?: T) {
        this.data = data;
    }

    public addChild(node: TreeNode<T>): boolean {
        if (this.hasChild(node)) {
            return false;
        }

        node.detach();
        node._parentNode = this;

        return this._childNodes.add(node);
    }

    public addChildren(nodes: Iterable<TreeNode<T>>): boolean {
        let modified = false;

        for (const node of nodes) {
            if (this.addChild(node)) {
                modified = true;
            }
        }

        return modified;
    }

    public detach(): void {
        if (this._parentNode) {
            this._parentNode._childNodes.remove(this);
            this._parentNode = undefined;
        }
    }

    public hasChild(node: TreeNode<T>): boolean {
        return this._childNodes.contains(node);
    }

    public insertAfter(newNode: TreeNode<T>, refNode: TreeNode<T>): void {
        const insertPosition: number = this.childNodes.indexOf(refNode);

        if (insertPosition < -1) {
            throw new InvalidArgumentException('Reference node is not a member of child nodes collection.');
        }

        newNode.detach();
        newNode._parentNode = this;

        this._childNodes.insert(insertPosition + 1, newNode);
    }

    public insertBefore(newNode: TreeNode<T>, refNode: TreeNode<T>): void {
        const insertPosition: number = this.childNodes.indexOf(refNode);

        if (insertPosition < -1) {
            throw new InvalidArgumentException('Reference node is not a member of child nodes collection.');
        }

        newNode.detach();
        newNode._parentNode = this;

        this._childNodes.insert(insertPosition, newNode);
    }

    public removeChild(node: TreeNode<T>): boolean {
        if (!this.hasChild(node)) {
            throw new InvalidArgumentException('Reference node is not a member of child nodes collection.');
        }

        node.detach();

        return true;
    }

    public removeChildren(nodes: Iterable<TreeNode<T>>): boolean {
        let modified = false;

        for (const node of nodes) {
            if (this.removeChild(node)) {
                modified = true;
            }
        }

        return modified;
    }

    public replaceChild(newNode: TreeNode<T>, refNode: TreeNode<T>): void {
        const indexOfOldNode: number = this.childNodes.indexOf(refNode);

        if (indexOfOldNode < -1) {
            throw new InvalidArgumentException('Reference node is not a member of child nodes collection.');
        }

        this.insertAfter(newNode, refNode);

        refNode.detach();
    }

    private *getPath(): Iterable<TreeNode<T>> {
        let node: TreeNode<T> | undefined = this;

        while (node) {
            yield node;

            node = node.parentNode;
        }
    }
}
