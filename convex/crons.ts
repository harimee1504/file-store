import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.cron(
    'delete files from recycle bin',
    '30 18 * * *',
    internal.file.clearTrash
);

export default crons;
