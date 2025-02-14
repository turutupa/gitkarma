import { pino } from "pino";

const log =
  process.env.NODE_ENV === "production"
    ? pino()
    : pino({
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss.l",
            colorize: true,
            ignore: "hostname",
            errorLikeObjectKeys: ["err", "error"],
            errorProps: "stack,type,message",
            singleLine: false,
          },
        },
      });

export default log;
