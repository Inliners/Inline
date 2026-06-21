"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const AnnotationsAPI_1 = require("./apiBranch/AnnotationsAPI");
const app = (0, express_1.default)();
const port = process.env.PORT || 3030;
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
// Required for Chrome's Private Network Access policy —
// allows content scripts on public pages to fetch localhost
app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});
app.get('/', (req, res) => {
    res.send('Inline backend is running');
});
// Universal pipeline — receives any feature's data and persists it to Supabase
app.get('/api/annotations', AnnotationsAPI_1.getAnnotations);
app.post('/api/annotations', AnnotationsAPI_1.saveAnnotations);
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
