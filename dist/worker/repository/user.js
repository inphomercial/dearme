"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_uuid_1 = require("node-uuid");
const model_1 = require("../device/model");
const application_1 = require("../application");
const utilities_1 = require("../utilities");
const personalities = [0, 1];
function user(db) {
    const coll = () => db.collection(application_1.config('mongo.collections.users'));
    const extras = model_1.repo(coll);
    const find = (query, fields) => coll().find(Object.assign({ inactive: false }, query), fields);
    const find_one = (query) => coll().findOne(Object.assign({ inactive: false }, query));
    const find_one_by_phone = (raw) => find_one({ phone: utilities_1.format_phone(raw) });
    const save = ({ fname, phone }) => {
        let guid = node_uuid_1.v4();
        let inactive = false;
        let date_created = new Date;
        let assigned_personality = utilities_1.rand(personalities);
        let user = { guid, inactive, fname, phone, date_created, assigned_personality };
        return coll()
            .insert(user)
            .then(() => user);
    };
    return Object.assign({}, extras, { find, find_one, find_one_by_phone, save });
}
exports.user = user;
