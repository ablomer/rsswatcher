import fs from 'fs';
import path from 'path';
import { PostHistory, FeedHistoryEntry } from './types';

const POST_HISTORY_FILE = 'history.json';

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
            // Ensure the directory exists
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(this.filePath, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.error('Error saving post history:', error);
        }
    }

    public isPostChecked(guid: string): boolean {
        return guid in this.history;
    }

    public addCheckedPost(guid: string, feedUrl: string, title: string, link: string, matchedKeywords: string[] = [], notificationSent: boolean = false) {
        this.history[guid] = {
            feedUrl,
            checkedAt: new Date().toISOString(),
            title,
            link,
            matchedKeywords,
            notificationSent
        };
        this.saveHistory();
    }

    public getHistoryEntries(): FeedHistoryEntry[] {
        return Object.entries(this.history)
            .map(([, entry]) => ({
                ...entry,
                description: '',  // These fields are required by FeedHistoryEntry
                content: '',      // but not stored in post history
                summary: '',
                contentSnippet: '',
                pubDate: entry.checkedAt
            }))
            .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
    }

    public getHistory(): PostHistory {
        return this.history;
    }
} 