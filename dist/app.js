"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const product_controller_1 = require("./controllers/product.controller");
dotenv_1.default.config();
const PORT = process.env.PORT;
// Initialize the express app
const app = (0, express_1.default)();
// Initialize the Prisma client
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
app.use(express_1.default.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Gets the request and forward it to the Identify function of controller
app.post('/identify', product_controller_1.Identify);
exports.default = app;
