import * as fs from 'fs';
import {GetInstance} from '@monument/core/Language/Decorators/GetInstance';
import {DeferredObject} from '../../async/main/DeferredObject';
import {ReadOnlyCollection} from '../../collections-core/main/ReadOnlyCollection';
import {ArrayList} from '../../collections/main/ArrayList';
import {FileSystemEntry} from './FileSystemEntry';
import {AccessPermissions} from './AccessPermissions';
import {FileMode} from './FileMode';
import {AccessMode} from './AccessMode';
import {FileDescriptor} from './types';
import {IOException} from './IOException';
import {Path} from './Path';
import {FileSystemEntryType} from './FileSystemEntryType';
import {FileStorage} from './FileStorage';


export class LocalFileSystem implements FileStorage {
    @GetInstance()
    public static instance: LocalFileSystem;


    private constructor() {}


    public getEntry(
        fullName: Path | string
    ): Promise<FileSystemEntry> {
        return new Promise<FileSystemEntry>((resolve, reject) => {
            fs.lstat(fullName.toString(), (error: Error, stats: fs.Stats): void => {
                if (error) {
                    reject(error);

                    return;
                }

                resolve(new FileSystemEntry(fullName, stats));
            });
        });
    }


    public async createFile(
        fileName: Path | string,
        accessPermissions: AccessPermissions = AccessPermissions.Default,
        truncate: boolean = true,
        overwrite: boolean = true
    ): Promise<void> {
        let fd: FileDescriptor;
        let fileMode: FileMode = FileMode.Create | FileMode.NonBlock;

        if (truncate) {
            fileMode = fileMode | FileMode.Truncate;
        }

        if (!overwrite) {
            fileMode = fileMode | FileMode.Exclusive;
        }

        fd = await this.open(fileName.toString(), fileMode, accessPermissions);

        await this.close(fd);
    }


    public writeFile(
        fileName: Path | string,
        fileContent: Buffer,
        accessPermissions: AccessPermissions = AccessPermissions.Default
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.writeFile(fileName.toString(), fileContent, {
            mode: accessPermissions
        }, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public readFile(
        fileName: Path | string
    ): Promise<Buffer> {
        let deferred: DeferredObject<Buffer> = new DeferredObject<Buffer>();

        fs.readFile(fileName.toString(), (error: NodeJS.ErrnoException, content: Buffer): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(content);
            }
        });

        return deferred.promise;
    }


    public removeFile(
        fullName: Path | string
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.unlink(fullName.toString(), (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public async fileExists(
        fileName: Path | string
    ): Promise<boolean> {
        let entry: FileSystemEntry;

        try {
            entry = await this.getEntry(fileName);
        } catch (ex) {
            return false;
        }

        if (entry.entryType !== FileSystemEntryType.File) {
            throw new IOException(`File system entry at path "${fileName}" exists but it is not a file.`);
        }

        return true;
    }


    public createDirectory(
        directoryName: Path | string,
        accessPermissions: AccessPermissions = AccessPermissions.All
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.mkdir(directoryName.toString(), accessPermissions, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public async createPath(
        path: Path | string,
        accessPermissions: AccessPermissions = AccessPermissions.All
    ): Promise<void> {
        let names: string[] = Path.split(path);
        let segments: string[] = [];

        for (let name of names) {
            segments.push(name);

            let dirName: string = Path.concat(segments);

            if (!await this.directoryExists(dirName)) {
                await this.createDirectory(dirName, accessPermissions);
            }
        }
    }


    public readDirectory(
        directoryName: Path | string
    ): Promise<ReadOnlyCollection<FileSystemEntry>> {
        let deferred: DeferredObject<ReadOnlyCollection<FileSystemEntry>> =
            new DeferredObject<ReadOnlyCollection<FileSystemEntry>>();

        fs.readdir(directoryName.toString(), (error: NodeJS.ErrnoException, names: string[]): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(Promise.all(names.map((name: string): Promise<FileSystemEntry> => {
                    let fullName: string = Path.concat([directoryName.toString(), name]);

                    return this.getEntry(fullName);
                }))
                    .then((entries: FileSystemEntry[]) => {
                        return new ArrayList<FileSystemEntry>(entries);
                    }));
            }
        });

        return deferred.promise;
    }


    public removeDirectory(
        directoryName: Path | string
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.rmdir(directoryName.toString(), (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public async directoryExists(
        directoryName: Path | string
    ): Promise<boolean> {
        let entry: FileSystemEntry;

        try {
            entry = await this.getEntry(directoryName.toString());
        } catch (ex) {
            return false;
        }

        if (entry.entryType !== FileSystemEntryType.Directory) {
            throw new IOException(`File system entry at path "${directoryName}" exists but it is not a directory.`);
        }

        return true;
    }


    public checkAccess(
        fullName: Path | string,
        accessMode: AccessMode = AccessMode.Availability
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.access(fullName.toString(), accessMode, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public async getPermissions(
        fullName: Path | string
    ): Promise<AccessPermissions> {
        let stats: FileSystemEntry = await this.getEntry(fullName);

        return stats.accessPermissions;
    }


    public setPermissions(
        fullName: Path | string,
        accessPermissions: AccessPermissions
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.chmod(fullName.toString(), accessPermissions, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public setOwner(
        fullName: Path | string,
        userId: number,
        groupId: number
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.chown(fullName.toString(), userId, groupId, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public createSymbolicLink(
        fullName: Path | string,
        linkName: Path | string
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.symlink(fullName.toString(), linkName.toString(), undefined, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public createLink(
        fullName: Path | string,
        linkName: Path | string
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.link(fullName.toString(), linkName.toString(), (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public readLink(
        linkName: Path | string
    ): Promise<string> {
        let deferred: DeferredObject<string> = new DeferredObject<string>();

        fs.readlink(linkName.toString(), (error: NodeJS.ErrnoException, sourcePath: string): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(sourcePath);
            }
        });

        return deferred.promise;
    }


    public getAbsolutePath(
        path: Path | string
    ): Promise<string> {
        let deferred: DeferredObject<string> = new DeferredObject<string>();

        fs.realpath(path.toString(), (error: NodeJS.ErrnoException, absolutePath: string): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(absolutePath);
            }
        });

        return deferred.promise;
    }


    public move(
        sourceName: Path | string,
        destinationName: Path | string
    ): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.rename(sourceName.toString(), destinationName.toString(), (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public open(
        fullName: Path | string,
        fileMode: FileMode = FileMode.ReadWrite | FileMode.NonBlock,
        accessPermissions: AccessPermissions = AccessPermissions.Default
    ): Promise<FileDescriptor> {
        let deferred: DeferredObject<FileDescriptor> = new DeferredObject<FileDescriptor>();

        fs.open(fullName.toString(), fileMode, accessPermissions, (error: NodeJS.ErrnoException, fd: FileDescriptor): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(fd);
            }
        });

        return deferred.promise;
    }


    public close(fileDescriptor: FileDescriptor): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.close(fileDescriptor, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    public async read(
        fileDescriptor: FileDescriptor,
        position: number,
        length: number
    ): Promise<Buffer> {
        let buffer: Buffer = Buffer.alloc(length);
        let deferred: DeferredObject<Buffer> = new DeferredObject<Buffer>();

        fs.read(
            fileDescriptor,     // File descriptor, returned by `open` method
            buffer,             // Buffer to write bytes in
            0,                  // Initial position in buffer
            length,             // How much bytes to read
            position,           // Initial position in file
            (error: NodeJS.ErrnoException, bytesRead: number): void => {
                if (error) {
                    deferred.reject(error);

                    return;
                }

                if (bytesRead < length) {
                    buffer = buffer.slice(0, bytesRead);
                }

                deferred.resolve(buffer);
            }
        );

        return deferred.promise;
    }


    public write(
        fileDescriptor: FileDescriptor,
        position: number,
        buffer: Buffer
    ): Promise<number> {
        let deferred: DeferredObject<number> = new DeferredObject<number>();

        fs.write(
            fileDescriptor,             // File descriptor, returned by `open` method
            buffer,                     // Buffer with bytes to write
            0,                          // Initial position in buffer
            buffer.length,              // How much bytes to write
            position,                   // Initial position in file
            (error: NodeJS.ErrnoException, bytesWritten: number) => {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(bytesWritten);
                }
            }
        );

        return deferred.promise;
    }


    public flush(fileDescriptor: FileDescriptor): Promise<void> {
        let deferred: DeferredObject = new DeferredObject();

        fs.fsync(fileDescriptor, (error: NodeJS.ErrnoException): void => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }
}

LocalFileSystem.instance.createPath(__dirname + '/Case/Me/Please');
