import { randomUUID } from 'crypto';

export const savePointIdGenerator = () => {
    const savepointId = `savepoint_${randomUUID().replace(/-/g, '_')}`;

    return savepointId;
};
