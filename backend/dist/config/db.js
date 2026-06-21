"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config();
const supabaseURL = process.env.SECRET_DATABASE_CONNECTION;
const supabaseKEY = process.env.SECRET_DATABASE_KEY;
if (!supabaseURL || !supabaseKEY) {
    throw new Error("Missing Supabase key or url in .env");
}
const supabase = (0, supabase_js_1.createClient)(supabaseURL, supabaseKEY);
exports.default = supabase;
