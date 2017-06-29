'use strict';

const { v4 } = require('node-uuid');

const { mongo } = require('../dist/device/mongo');
const { user } = require('../dist/repository/user');
const { message } = require('../dist/repository/message');
const { get_user_survey_link } = require('../dist/controller/message');

const { logger } = require('../dist/log');

const { decrypt, encrypt } = require('../dist/crypto');
const { KEY_MESSAGES } = require('../dist/keys');

const log = logger(__filename);

function set_user_guid() {
    mongo.then((db) => {
        const users = user(db);
        const updates = [];

        users.find({}).forEach((user) => {
            if (user.guid) {
                log.info(`user#${user._id} already has a guid`);
                return;
            }

            log.info(`updating user#${user._id}`);

            let filter = { _id: user._id };
            let update = { $set: { guid: v4() } };

            updates.push(users.update(filter, update).then(() =>
                log.info(`updated user#${user._id}`)));
        }, () => Promise.all(updates).then(() => db.close()));
    });
}

function update_message_part(regex, updater) {
    mongo.then((db) => {
        const users = user(db);
        const messages = message(db);
        const updates = [];

        messages.find({
            body: {
                $regex: regex
            }
        }).forEach((message) => {
            let original = message.body;
            let msg_filter = { _id: message._id };

            updates.push(users.find_one({ _id: message.user_id }).then((user) => {
                if (!user) {
                    log.info(`no user found for message#${message._id}`);
                    return;
                }

                let updated = updater(message, user);
                let update = { $set: { body: updated } };

                if (updated !== original) {
                    log.info(`updating message#${message._id}`);
                    log.info(original);
                    log.info(updated);
                    updates.push(messages.update(msg_filter, update).then(() =>
                        log.info(`updated message#${message._id}`)));
                } else {
                    log.info(`nothing to update on message#${message._id}`);
                }
            }));
        }, () => Promise.all(updates).then(() => db.close()));
    });
}

function encrypt_all_responses() {
    mongo.then((db) => {
        const messages = message(db);
        const updates = [];

        messages.find({}).forEach((message) => {
            if (!message.responses || !message.responses.length) {
                log.info(`message#${message._id} has no messages`);
                return;
            }

            let needs_update = false;
            let responses = message.responses.reduce((store, response) => {
                let could_decrypt = false;

                try {
                    decrypt(response.body, KEY_MESSAGES);
                    could_decrypt = true;
                } catch (ignore) {}

                if (!could_decrypt && response.body) {
                    log.info('encrypting response');
                    response.body = encrypt(response.body, KEY_MESSAGES);
                    needs_update = true;
                }

                store.push(response);
                return store;
            }, []);

            let filter = { _id: message._id };
            let update = { $set: { responses } };

            if (needs_update) {
                updates.push(messages.update(filter, update).then(() =>
                    log.info(`updated message#${message._id}`)));
            } else {
                log.info(`nothing to update on message#${message._id}`);
            }
        }, () => Promise.all(updates).then(() => db.close()));
    });
}

switch (process.argv[2]) {
case 'set_user_guid':
    set_user_guid();
    break;

case 'encrypt_all_responses':
    encrypt_all_responses();
    break;

case 'update_survey_links':
    update_message_part(/feedback/, (message, user) => {
        return message.body
            .replace('[LINK TO SURVEY]', get_user_survey_link(user))
            .replace('http://bit.ly/2pLKKc3', get_user_survey_link(user))
            .replace('https://aryel1.typeform.com/to/uXF0sA', get_user_survey_link(user));
    });
    break;

default:
    console.error('Unknown command %s', process.argv[2]);
    process.exit(1);
}
