import fs from 'fs';
import path from 'path';
import { PostHistory } from './types';

const POST_HISTORY_FILE = path.join(process.cwd(), 'history.json');

export class PostHistoryManager {
    private history: PostHistory = {};
    private filePath: string;

    constructor() {
        this.filePath = path.join(process.cwd(), POST_HISTORY_FILE);
        this.loadHistory();
    }

    private loadHistory() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf-8');
                this.history = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading post history:', error);
            this.history = {};
        }
    }

    private saveHistory() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.error('Error saving post history:', error);
        }
    }

    public isPostChecked(guid: string): boolean {
        return guid in this.history;
    }

    public addCheckedPost(guid: string, feedUrl: string, title: string) {
        this.history[guid] = {
            feedUrl,
            checkedAt: new Date().toISOString(),
            title
        };
        this.saveHistory();
    }

    public getHistory(): PostHistory {
        return this.history;
    }
} 