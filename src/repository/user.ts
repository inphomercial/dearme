import { connection, Cursor, Collection } from '../device/mongo';
import { Model } from '../device/model';
import { config } from '../application';

export interface User extends Model {
    inactive?: boolean;
    handle?: string | null;
    phone: string | null;
}

export namespace user {
    export function coll(): Collection {
        const coll = config<string>('mongo.collections.users');
        return connection.collection(coll);
    }

    export function all(): Cursor<User> {
        return coll().find({ inactive: false });
    }

    export function save({ phone, handle = null }: User): Promise<User> {
        let inactive = false;
        let date_created = Date.now();

        let user: User = { inactive, phone, handle, date_created };
        console.info('saving', user);

        return coll()
            .insert(user)
            .then(() => user);
    }
}