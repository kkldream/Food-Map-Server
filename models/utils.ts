module.exports = {
    generateUUID: () => {
        let d = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    },
    getDateFormat: (date: Date) => {
        if (!date) date = new Date();
        const year = date.getFullYear();
        const mouth = date.getMonth().toString().padStart(2, '0');
        const day = date.getDay().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${year}/${mouth}/${day}-${hours}:${minutes}:${seconds}`;
    }
}