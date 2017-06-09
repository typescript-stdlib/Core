

export abstract class Fixture {
    private _isCreated: boolean = false;


    public get isCreated(): boolean {
        return this._isCreated;
    }


    public async create(): Promise<void> {
        await this.doCreate();

        this._isCreated = true;
    }


    public async destroy(): Promise<void> {
        await this.doDestroy();

        this._isCreated = false;
    }


    protected abstract doCreate(): Promise<void>;
    protected abstract doDestroy(): Promise<void>;
}
