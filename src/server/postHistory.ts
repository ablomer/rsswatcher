import fs from 'fs';
import path from 'path';
import { PostHistory } from './types';

const POST_HISTORY_FILE = path.join(process.cwd(), 'history.json');

export class PostHistoryManager {
    private history: PostHistory = {};

    constructor() {
        this.loadHistory();
    }

    private loadHistory() {
        try {
            if (fs.existsSync(POST_HISTORY_FILE)) {
                const data = fs.readFileSync(POST_HISTORY_FILE, 'utf-8');
                this.history = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading post history:', error);
            this.history = {};
        }
    }

    private saveHistory() {
        try {
            // Ensure the directory exists
            const dir = path.dirname(POST_HISTORY_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(POST_HISTORY_FILE, JSON.stringify(this.history, null, 2));
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