const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    _id: String,
    data: mongoose.Schema.Types.Mixed
});

const AuthModel = mongoose.models.BaileysAuth || mongoose.model('BaileysAuth', authSchema);

const useMongoDBAuthState = async () => {
    const readData = async (key) => {
        try {
            const doc = await AuthModel.findById(key);
            if (doc && doc.data) {
                return JSON.parse(JSON.stringify(doc.data), BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            console.error('Error reading auth state from MongoDB', error);
            return null;
        }
    };

    const writeData = async (data, key) => {
        try {
            const dataStr = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
            await AuthModel.findByIdAndUpdate(key, { data: dataStr }, { upsert: true });
        } catch (error) {
            console.error('Error writing auth state to MongoDB', error);
        }
    };

    const removeData = async (key) => {
        try {
            await AuthModel.findByIdAndDelete(key);
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
            await AuthModel.deleteMany({});
        }
    };
};

module.exports = useMongoDBAuthState;
