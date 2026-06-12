const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    _id: String,
    data: String // Changed to String to avoid Mongoose stripping keys with dots (.)
}, { _id: false }); // Disable Mongoose auto _id to safely use string keys

const AuthModel = mongoose.models.BaileysAuth || mongoose.model('BaileysAuth', authSchema);

const useMongoDBAuthState = async () => {
    // Wait for mongoose connection if not ready
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('open', resolve));
    }
    const collection = mongoose.connection.db.collection('baileysauths');

    const readData = async (key) => {
        try {
            const doc = await collection.findOne({ _id: key });
            if (doc && doc.data) {
                if (typeof doc.data === 'string') {
                    return JSON.parse(doc.data, BufferJSON.reviver);
                } else {
                    // Legacy Mongoose format fallback
                    return JSON.parse(JSON.stringify(doc.data), BufferJSON.reviver);
                }
            }
            return null;
        } catch (error) {
            console.error('Error reading auth state from MongoDB', error);
            return null;
        }
    };

    const writeData = async (data, key) => {
        try {
            const dataStr = JSON.stringify(data, BufferJSON.replacer);
            await collection.updateOne(
                { _id: key },
                { $set: { data: dataStr } },
                { upsert: true }
            );
        } catch (error) {
            console.error('Error writing auth state to MongoDB', error);
        }
    };

    const removeData = async (key) => {
        try {
            await collection.deleteOne({ _id: key });
        } catch (error) {
            console.error('Error deleting auth state from MongoDB', error);
        }
    };

    let creds = await readData('creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeData(creds, 'creds');
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds'),
        clearState: async () => {
            await collection.deleteMany({});
        }
    };
};

module.exports = useMongoDBAuthState;
