export default class Log {
    constructor(timestamp, type, title, message) {
        this.timestamp = timestamp;
        this.type = type;
        this.title = title;
        this.message = message;
    }

    toJSON() {
        return {
            timestamp: this.timestamp,
            type: this.type,
            title: this.title,
            message: this.message
        };
    }
}