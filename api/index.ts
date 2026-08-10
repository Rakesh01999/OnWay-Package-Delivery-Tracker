import { handle } from "hono/vercel";
import { createApp } from "../backend/src/app";

const app = createApp();

export const config = {
    runtime: "nodejs",
};

export default handle(app);
