import fs from 'fs';
import path from 'path';
import { PostHistory, FeedHistoryEntry } from './types';
import { DEFAULT_DATA_DIR } from './constants';

const DATA_DIR = process.env.RSS_WATCHER_DATA_DIR || DEFAULT_DATA_DIR;
const POST_HISTORY_FILE = path.join(DATA_DIR, 'history.json');

export class PostHistoryManager {
    private history: PostHistory = {};

    constructor() {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
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
            fs.writeFileSync(POST_HISTORY_FILE, JSON.stringify(this.history, null, 2));
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