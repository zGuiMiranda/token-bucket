import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import app from "./app";

app.server.listen(
  { port: +process.env.PORT || 9001, host: "0.0.0.0" },
  (err, address) => {
    if (err) {
      app.server.log.error(err);
      process.exit(1);
    }
    console.log(`Server running at ${address}`);
  }
);
