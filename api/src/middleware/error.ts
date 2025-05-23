import log from "@/log";

export const errorHandler = (err, _, res, __) => {
  const error = {
    error: {
      message: err.message,
      name: err.name,
      statusCode: err.statusCode,
      ...err,
    },
  };
  log.error(error);
  res.status(err.statusCode || 500).json(error);
};
